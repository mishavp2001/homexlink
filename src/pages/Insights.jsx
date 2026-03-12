import React, { useState, useEffect } from 'react';
import { getCurrentUserProfile, redirectToAppLogin } from '@/api/client';
import { Category, Insight } from '@/api/entities';
import { getLocationFromIP, searchYouTubeVideos } from '@/api/functions';
import { UploadFile } from '@/api/integrations';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Lightbulb, Plus, Heart, Eye, Upload, X, Video, Download, Loader2, CreditCard, DollarSign } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import Navigation from '../components/Navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import VideoPlayer from '../components/VideoPlayer';
import BuyCredits from '../components/BuyCredits';

export const isPublic = true;

export default function Insights() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const queryParams = new URLSearchParams(location.search);
  const categoryParam = queryParams.get('category');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || 'all');
  const [locationFilter, setLocationFilter] = useState('');
  const [radiusMiles, setRadiusMiles] = useState(200);
  const [locationLoadedFromIP, setLocationLoadedFromIP] = useState(false);
  const [userLocationCoords, setUserLocationCoords] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [youtubeVideos, setYoutubeVideos] = useState([]);
  const [loadingYouTube, setLoadingYouTube] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get('category');
    setSelectedCategory(category || 'all');
  }, [location.search]);
  const [showFilters, setShowFilters] = useState(false);
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [user, setUser] = useState(null);
  const [viewingInsight, setViewingInsight] = useState(null);
  const [editingInsightId, setEditingInsightId] = useState(null);
  const [insightForm, setInsightForm] = useState({
    title: '',
    content: '',
    category: '',
    tags: '',
    photo_urls: [],
    author_name: ''
  });

  // Quill modules configuration
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link', 'image'],
      ['clean']
    ]
  };

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'link', 'image'
  ];

  // Handle edit from URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const editInsightId = urlParams.get('edit');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUserProfile();
        setUser(currentUser);
        setInsightForm(prev => ({ ...prev, author_name: currentUser.full_name || 'Anonymous' }));
      } catch (error) {
        // User not logged in
      }
    };
    loadUser();
  }, []);

  // Geocode location filter to get coordinates
  useEffect(() => {
    const geocodeLocation = async () => {
      if (!locationFilter) {
        setUserLocationCoords(null);
        return;
      }

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationFilter)}`
        );
        const data = await response.json();
        if (data && data.length > 0) {
          setUserLocationCoords({
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon)
          });
        }
      } catch (error) {
        console.error('Geocoding error:', error);
      }
    };

    const debounce = setTimeout(geocodeLocation, 500);
    return () => clearTimeout(debounce);
  }, [locationFilter]);

  // Auto-detect location from IP if not already set
  useEffect(() => {
    const loadLocationFromIP = async () => {
      if (locationFilter || locationLoadedFromIP) return;
      
      try {
        const response = await getLocationFromIP();
        if (response.data.success && response.data.city) {
          setLocationFilter(response.data.city);
        }
      } catch (error) {
        console.error('Failed to get location from IP:', error);
      }
      setLocationLoadedFromIP(true);
    };

    loadLocationFromIP();
  }, [locationFilter, locationLoadedFromIP]);

  const { data: insights, isLoading } = useQuery({
    queryKey: ['insights'],
    queryFn: () => Insight.filter({ status: 'published' }, '-created_date'),
    initialData: []
  });

  const { data: insightCategories, isLoading: loadingCategories } = useQuery({
    queryKey: ['insightCategories'],
    queryFn: () => Category.filter({ type: 'insight_type', is_active: true }),
    initialData: []
  });

  // Load insight for editing if edit param is present
  useEffect(() => {
    if (editInsightId && insights.length > 0 && user) {
      const insightToEdit = insights.find(i => i.id === editInsightId);
      if (insightToEdit && insightToEdit.created_by === user.email) {
        setEditingInsightId(editInsightId);
        setInsightForm({
          title: insightToEdit.title,
          content: insightToEdit.content,
          category: insightToEdit.category,
          tags: insightToEdit.tags || '',
          photo_urls: insightToEdit.photo_urls || [],
          author_name: insightToEdit.author_name
        });
        setShowForm(true);
        // Clear URL parameter
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [editInsightId, insights, user]);

  const createInsightMutation = useMutation({
    mutationFn: data => {
      if (editingInsightId) {
        return Insight.update(editingInsightId, data);
      }
      return Insight.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['insights']);
      queryClient.invalidateQueries(['myInsights']);
      setShowForm(false);
      setEditingInsightId(null);
      setInsightForm({
        title: '',
        content: '',
        category: '',
        tags: '',
        photo_urls: [],
        author_name: user?.full_name || 'Anonymous'
      });
    }
  });

  const likeInsightMutation = useMutation({
    mutationFn: ({ id, likes }) => Insight.update(id, { likes: likes + 1 }),
    onSuccess: () => {
      queryClient.invalidateQueries(['insights']);
      setViewingInsight(prev => prev ? { ...prev, likes: prev.likes + 1 } : null);
    }
  });

  const viewInsightMutation = useMutation({
    mutationFn: ({ id, views }) => Insight.update(id, { views: views + 1 })
  });

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setUploadingPhotos(true);
    try {
      const uploadPromises = files.map(file => UploadFile({ file }));
      const results = await Promise.all(uploadPromises);
      const urls = results.map(r => r.file_url);
      setInsightForm({ ...insightForm, photo_urls: [...insightForm.photo_urls, ...urls] });
    } catch (error) {
      console.error('Upload error:', error);
    }
    setUploadingPhotos(false);
  };

  const removePhoto = (index) => {
    setInsightForm({
      ...insightForm,
      photo_urls: insightForm.photo_urls.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please sign in to share insights');
      void redirectToAppLogin(window.location.origin + createPageUrl('Insights'));
      return;
    }

    // Strip HTML tags from content
    const stripHtml = (html) => {
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || '';
    };

    const tags = insightForm.tags.split(',').map(t => t.trim()).filter(Boolean);
    const tagsString = tags.join(' ');

    createInsightMutation.mutate({
      ...insightForm,
      content: stripHtml(insightForm.content),
      tags: tagsString
    });
  };

  const handleView = (insight) => {
    setViewingInsight(insight);
    viewInsightMutation.mutate({ id: insight.id, views: insight.views });
  };

  // Helper function to calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const filteredInsights = insights.filter(insight => {
    const tagsText = Array.isArray(insight.tags) ? insight.tags.join(' ') : (insight.tags || '');
    
    const matchesSearch = !searchTerm || 
      insight.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      insight.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tagsText.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || insight.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Fetch YouTube videos when category or search changes
  useEffect(() => {
    const fetchYouTubeVideos = async () => {
      const searchQuery = searchTerm || (selectedCategory !== 'all' ? `${selectedCategory} home tips` : 'home improvement tips');
      
      setLoadingYouTube(true);
      try {
        const response = await searchYouTubeVideos({
          query: searchQuery,
          maxResults: 6
        });
        setYoutubeVideos(response.data.videos || []);
      } catch (error) {
        console.error('Failed to fetch YouTube videos:', error);
        setYoutubeVideos([]);
      }
      setLoadingYouTube(false);
    };

    const debounce = setTimeout(() => {
      fetchYouTubeVideos();
    }, 500);

    return () => clearTimeout(debounce);
  }, [selectedCategory, searchTerm]);

  const categories = insightCategories.map(cat => ({
    value: cat.name,
    label: cat.name,
    icon: cat.icon
  }));

  const shareInsightButton = (
    <Link to={createPageUrl('EditInsight')}>
      <Button
        className="bg-[#d4af37] hover:bg-[#c49d2a]"
        size="sm"
      >
        <Plus className="w-4 h-4 mr-2" />
        Share Insight
      </Button>
    </Link>
  );

  const userCredits = user?.credits || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 pb-20" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <Navigation 
        user={user} 
        actionButton={shareInsightButton}
        locationFilter={locationFilter}
        onLocationChange={setLocationFilter}
        onRadiusChange={setRadiusMiles}
      />
      
      <div className="py-6 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-[#1e3a5f]">
              {selectedCategory !== 'all' ? `${selectedCategory} Community Insights` : 'Community Insights'}
            </h1>
            {user && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <Badge className="bg-[#d4af37] text-white px-4 py-2 text-base">
                  <CreditCard className="w-4 h-4 mr-2" />
                  {userCredits} Credit{userCredits !== 1 ? 's' : ''}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBuyCredits(true)}
                  className="border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-white"
                >
                  <DollarSign className="w-4 h-4 mr-1" />
                  Buy Credits
                </Button>
              </div>
            )}
          </div>



          {/* Results */}
          {isLoading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f] mx-auto"></div>
            </div>
          ) : (
            <>
              {/* App Insights */}
              {filteredInsights.length === 0 ? (
                <Card className="p-12 text-center mb-8">
                  <Lightbulb className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No insights found</h3>
                  <p className="text-gray-600 mb-4">Be the first to share!</p>
                  <Button onClick={() => setShowForm(true)} className="bg-[#d4af37] hover:bg-[#c49d2a]">
                    Share Your Insight
                  </Button>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {filteredInsights.map((insight) => (
                <Card 
                  key={insight.id} 
                  className="p-6 hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => handleView(insight)}
                >
                  {insight.photo_urls?.length > 0 && (
                    <div className="mb-4 -mx-6 -mt-6">
                      <img 
                        src={insight.photo_urls[0]} 
                        alt={insight.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="capitalize">
                      {categories.find(c => c.value === insight.category)?.icon} {insight.category.replace('_', ' ')}
                    </Badge>
                    {insight.is_featured && (
                      <Badge className="bg-yellow-100 text-yellow-800">⭐ Featured</Badge>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-[#1e3a5f] mb-3">{insight.title}</h3>
                  <p className="text-gray-700 mb-4 line-clamp-3 text-sm">
                    {insight.content_text || (insight.content ? insight.content.replace(/<[^>]+>/g, '') : '')}
                  </p>

                  {insight.tags && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(Array.isArray(insight.tags) ? insight.tags : insight.tags.split(' ').filter(Boolean)).slice(0, 3).map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">#{tag}</Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
                    <span>By {insight.author_name || 'Anonymous'}</span>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {insight.views}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          likeInsightMutation.mutate({ id: insight.id, likes: insight.likes });
                        }}
                        className="flex items-center gap-1 hover:text-red-500 transition-colors"
                      >
                        <Heart className="w-4 h-4" />
                        {insight.likes}
                      </button>
                    </div>
                  </div>
                </Card>
                  ))}
                </div>
              )}

              {/* YouTube Videos Section */}
              {youtubeVideos.length > 0 && (
                <div className="mt-12">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                      <Video className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-[#1e3a5f]">Related YouTube Videos</h2>
                  </div>
                  
                  {loadingYouTube ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f] mx-auto" />
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {youtubeVideos.map((video) => (
                        <Card key={video.id} className="p-4 hover:shadow-xl transition-shadow">
                          <a href={video.url} target="_blank" rel="noopener noreferrer">
                            <div className="relative mb-3">
                              <img 
                                src={video.thumbnail} 
                                alt={video.title}
                                className="w-full h-48 object-cover rounded-lg"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all rounded-lg flex items-center justify-center">
                                <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center opacity-90">
                                  <Video className="w-6 h-6 text-white" />
                                </div>
                              </div>
                            </div>
                            
                            <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 hover:text-[#1e3a5f]">
                              {video.title}
                            </h3>
                            
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                              {video.description}
                            </p>
                            
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>{video.channel}</span>
                              <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                                YouTube
                              </Badge>
                            </div>
                          </a>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Fixed Bottom Search Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search insights..."
                className="pl-9 h-10"
              />
              </div>

              <Select value={selectedCategory} onValueChange={(value) => {
              setSelectedCategory(value);
              const url = new URL(window.location);
              if (value === 'all') {
                url.searchParams.delete('category');
              } else {
                url.searchParams.set('category', value);
              }
              window.history.pushState({}, '', url);
            }}>
              <SelectTrigger className="w-40 h-10 flex-shrink-0">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
              </Select>

            <Badge variant="outline" className="hidden sm:flex">
              {filteredInsights.length} found
            </Badge>
          </div>
        </div>
      </div>

      {/* Filter Drawer */}
      <Dialog open={showFilters} onOpenChange={setShowFilters}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Filter Insights</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => setSelectedCategory('all')}
                variant="outline"
                className="flex-1"
              >
                Clear
              </Button>
              <Button
                onClick={() => setShowFilters(false)}
                className="flex-1 bg-[#1e3a5f] hover:bg-[#2a4a7f]"
              >
                Apply
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Insight Details Modal */}
      <Dialog open={!!viewingInsight} onOpenChange={() => setViewingInsight(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {viewingInsight && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{viewingInsight.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 mt-4">
                {viewingInsight.video_url ? (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Video className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-semibold text-gray-700">AI-Generated Video</span>
                      </div>
                      <a 
                        href={viewingInsight.video_url} 
                        download 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </a>
                    </div>
                    <VideoPlayer videoUrl={viewingInsight.video_url} />
                  </div>
                ) : null}

                {viewingInsight.photo_urls?.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {viewingInsight.photo_urls.map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`${viewingInsight.title} ${index + 1}`}
                        className="w-full h-64 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {categories.find(c => c.value === viewingInsight.category)?.icon} {viewingInsight.category.replace('_', ' ')}
                  </Badge>
                  {viewingInsight.is_featured && (
                    <Badge className="bg-yellow-100 text-yellow-800">⭐ Featured</Badge>
                  )}
                </div>

                <div 
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: viewingInsight.content }}
                />

                {viewingInsight.tags && (
                  <div className="flex flex-wrap gap-2">
                    {(Array.isArray(viewingInsight.tags) ? viewingInsight.tags : viewingInsight.tags.split(' ').filter(Boolean)).map((tag, idx) => (
                      <Badge key={idx} variant="outline">#{tag}</Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-6 border-t">
                  <span className="text-sm text-gray-600">
                    By {viewingInsight.author_name || 'Anonymous'}
                  </span>
                  <div className="flex items-center gap-6">
                    <span className="flex items-center gap-2 text-gray-600">
                      <Eye className="w-5 h-5" />
                      {viewingInsight.views} views
                    </span>
                    <button
                      onClick={() => {
                        likeInsightMutation.mutate({ id: viewingInsight.id, likes: viewingInsight.likes });
                      }}
                      className="flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors"
                    >
                      <Heart className="w-5 h-5" />
                      {viewingInsight.likes} likes
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Buy Credits Modal */}
      <BuyCredits
        isOpen={showBuyCredits}
        onClose={() => setShowBuyCredits(false)}
      />
    </div>
  );
}