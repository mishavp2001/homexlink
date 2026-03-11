import React, { useState, useEffect } from 'react';
import { getCurrentUserProfile } from '@/api/base44Client';
import { Category, Message, ServiceListing } from '@/api/entities';
import { getLocationFromIP, getServiceProviders, searchGooglePlaces as searchGooglePlacesFunction, sendSMSVerification, verifySMSCode } from '@/api/functions';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, MapPin, Wrench, Loader2, Star, Send } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import Navigation from '../components/Navigation';
import { useAuth } from '@/components/lib/AuthContext';
import PullToRefresh from 'react-pull-to-refresh';
import { useQueryClient } from '@tanstack/react-query';

export const isPublic = true;

export default function Services() {
  const location = useLocation();
  const { navigateToLogin } = useAuth();
  const queryClient = useQueryClient();
  const queryParams = new URLSearchParams(location.search);
  const categoryParam = queryParams.get('category');
  const claimParam = queryParams.get('claim');
  const cityParam = queryParams.get('city');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || 'all');
  const [selectedArea, setSelectedArea] = useState('all');
  const [locationFilter, setLocationFilter] = useState('');
  const [radiusMiles, setRadiusMiles] = useState(200);
  const [locationLoadedFromIP, setLocationLoadedFromIP] = useState(false);
  const [userLocationCoords, setUserLocationCoords] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [user, setUser] = useState(null);
  const [googlePlaces, setGooglePlaces] = useState([]);
  const [loadingGooglePlaces, setLoadingGooglePlaces] = useState(false);
  const [claimingBusiness, setClaimingBusiness] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [sendingSMS, setSendingSMS] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [contactingProvider, setContactingProvider] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [pendingClaim, setPendingClaim] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get('category');
    const claim = params.get('claim');
    const city = params.get('city');
    
    setSelectedCategory(category || 'all');
    
    // Override locationFilter with city param if present
    if (city) {
      setLocationFilter(city);
    }
    
    // Set searchTerm to claim if present
    if (claim) {
      setSearchTerm(claim.replace(/-/g, ' '));
      setPendingClaim(claim);
    }
  }, [location.search]);

  // Auto-open claim modal once googlePlaces is loaded
  useEffect(() => {
    if (pendingClaim && googlePlaces.length > 0 && !claimingBusiness) {
      const business = googlePlaces.find(p => 
        p.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') === pendingClaim.toLowerCase() ||
        p.place_id === pendingClaim
      );
      if (business) {
        setClaimingBusiness(business);
        setPendingClaim(null);
      }
    }
  }, [pendingClaim, googlePlaces, claimingBusiness]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUserProfile();
        setUser(currentUser);
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
      if (locationFilter || locationLoadedFromIP || cityParam) return;
      
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
  }, [locationFilter, locationLoadedFromIP, cityParam]);

  // Auto-search Google Places when search term or filters change
  useEffect(() => {
    const loadGooglePlaces = async () => {
      const defaultLocation = 'Granite Bay, CA';
      const searchLocation = locationFilter || defaultLocation;
      
      if (!searchTerm && !searchLocation) {
        setGooglePlaces([]);
        return;
      }
      
      setLoadingGooglePlaces(true);
      try {
        const categoryQuery = selectedCategory !== 'all' ? selectedCategory : 'service';
        const searchQuery = searchTerm ? `${searchTerm} ${categoryQuery}` : categoryQuery;
        
        const response = await searchGooglePlacesFunction({
          query: `${searchQuery} in ${searchLocation}`,
          location: searchLocation
        });
        setGooglePlaces(response.data.places || []);
      } catch (error) {
        console.error('Error searching Google Places:', error);
        setGooglePlaces([]);
      }
      setLoadingGooglePlaces(false);
    };

    const debounce = setTimeout(() => {
      loadGooglePlaces();
    }, 500);

    return () => clearTimeout(debounce);
  }, [searchTerm, selectedCategory, locationFilter]);

  const { data: serviceProviders, isLoading: loadingServices } = useQuery({
    queryKey: ['serviceProviders'],
    queryFn: async () => {
      const response = await getServiceProviders();
      return response.data;
    },
    initialData: [],
  });

  const { data: serviceListings } = useQuery({
    queryKey: ['serviceListings'],
    queryFn: () => ServiceListing.list(),
    initialData: [],
  });

  const { data: categories } = useQuery({
    queryKey: ['serviceCategories'],
    queryFn: () => Category.filter({ type: 'service_type', is_active: true }),
    initialData: []
  });

  const getServiceListing = (email) => {
    return serviceListings.find(sl => sl.expert_email === email) || { average_rating: 0, review_count: 0 };
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

  const filteredServices = serviceProviders.filter(provider => {
    const matchesSearch = !searchTerm || 
      provider.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.service_types?.some(st => st.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || provider.service_types?.includes(selectedCategory);
    const matchesArea = selectedArea === 'all' || provider.service_areas?.some(area => area.toLowerCase().includes(selectedArea.toLowerCase()));
    const matchesLocation = !locationFilter || provider.service_areas?.some(area => area.toLowerCase().includes(locationFilter.toLowerCase()));

    return matchesSearch && matchesCategory && matchesArea && matchesLocation;
  });

  const uniqueAreas = [...new Set(serviceProviders.flatMap(p => p.service_areas || []))].sort();

  const isBusinessClaimed = (placeId) => {
    return serviceProviders.some(p => p.google_place_id === placeId);
  };

  const handleClaimBusiness = (place) => {
    setClaimingBusiness(place);
    // Update URL with claim and city parameters
    const businessSlug = place.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    const newUrl = new URLSearchParams(location.search);
    newUrl.set('claim', businessSlug);
    if (locationFilter) {
      newUrl.set('city', locationFilter);
    }
    window.history.pushState({}, '', `${location.pathname}?${newUrl.toString()}`);
  };

  const handleSendVerification = async () => {
    if (!claimingBusiness?.phone) {
      alert('This business does not have a phone number listed');
      return;
    }

    setSendingSMS(true);
    try {
      await sendSMSVerification(claimingBusiness.phone);
      alert('Verification code sent to ' + claimingBusiness.phone);
    } catch (error) {
      console.error('Error sending SMS:', error);
      alert('Failed to send verification code');
    }
    setSendingSMS(false);
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      alert('Please enter a valid 6-digit code');
      return;
    }

    setVerifyingCode(true);
    try {
      const response = await verifySMSCode({
        code: verificationCode,
        placeId: claimingBusiness.place_id,
        businessData: {
          name: claimingBusiness.name,
          address: claimingBusiness.address,
          phone: claimingBusiness.phone,
          website: claimingBusiness.website,
          rating: claimingBusiness.rating,
          user_ratings_total: claimingBusiness.user_ratings_total
        }
      });
      
      if (response.data.requiresAuth) {
        // Store business data and redirect to signup
        sessionStorage.setItem('claimedBusiness', JSON.stringify({
          name: claimingBusiness.name,
          address: claimingBusiness.address,
          phone: claimingBusiness.phone,
          website: claimingBusiness.website,
          placeId: claimingBusiness.place_id
        }));
        alert('Phone verified! Please create an account to complete claiming your business.');
        setClaimingBusiness(null);
        setVerificationCode('');
        navigateToLogin();
      } else {
        alert('Business claimed successfully! Complete your profile to get started.');
        setClaimingBusiness(null);
        setVerificationCode('');
        window.location.href = createPageUrl('Profile');
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      alert(error.response?.data?.error || 'Failed to verify code');
    }
    setVerifyingCode(false);
  };

  const handleContact = (provider) => {
    if (!user) {
      navigateToLogin();
      return;
    }
    
    const defaultMessage = `Hi ${provider.business_name},\n\nI'm interested in your ${provider.service_types?.[0] || 'services'}. Could you please provide more information and availability?\n\nThank you!`;
    setMessageText(defaultMessage);
    setContactingProvider(provider);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      alert('Please enter a message');
      return;
    }

    setSendingMessage(true);
    try {
      await Message.create({
        sender_email: user.email,
        sender_name: user.full_name || user.email,
        recipient_email: contactingProvider.email,
        recipient_name: contactingProvider.business_name,
        subject: `Inquiry about ${contactingProvider.service_types?.[0] || 'services'}`,
        content: messageText,
        thread_id: `service_${contactingProvider.email}_${Date.now()}`,
        reference_type: 'service',
        reference_id: contactingProvider.email,
        is_read: false
      });
      alert('Message sent! Check your messages for responses.');
      setContactingProvider(null);
      setMessageText('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    }
    setSendingMessage(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 pb-20" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <Navigation 
        user={user} 
        locationFilter={locationFilter}
        onLocationChange={setLocationFilter}
        onRadiusChange={setRadiusMiles}
      />

      <div className="py-6 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-[#1e3a5f]">
              {selectedCategory !== 'all' ? `${selectedCategory} Service Providers` : 'Service Providers'}
            </h1>
          </div>

          {/* Results */}
          <PullToRefresh
            onRefresh={async () => {
              await queryClient.invalidateQueries(['serviceProviders']);
              await queryClient.invalidateQueries(['serviceListings']);
              return new Promise(resolve => setTimeout(resolve, 500));
            }}
            resistance={3}
          >
            {(loadingServices || loadingGooglePlaces) ? (
              <div className="text-center py-20">
                <Loader2 className="w-12 h-12 animate-spin text-[#1e3a5f] mx-auto" />
              </div>
            ) : filteredServices.length === 0 && googlePlaces.length === 0 ? (
            <Card className="p-12 text-center">
              <Wrench className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No service providers found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your filters or search terms</p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* User Service Providers */}
              {filteredServices.map((provider) => {
                const listing = getServiceListing(provider.email);
                return (
                  <Card key={provider.email} className="p-6 hover:shadow-xl transition-shadow">
                    <div className="flex items-start gap-4 mb-4">
                      {provider.business_photo_url ? (
                        <img
                          src={provider.business_photo_url}
                          alt={provider.business_name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-[#d4af37] rounded-lg flex items-center justify-center">
                          <Wrench className="w-8 h-8 text-white" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-[#1e3a5f] mb-1">{provider.business_name}</h3>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {provider.service_types?.slice(0, 2).map((type, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">{type}</Badge>
                          ))}
                          {provider.service_types?.length > 2 && (
                            <Badge variant="outline" className="text-xs">+{provider.service_types.length - 2}</Badge>
                          )}
                        </div>
                        {listing.average_rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-semibold">{listing.average_rating.toFixed(1)}</span>
                            <span className="text-xs text-gray-500">({listing.review_count})</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                      {provider.bio ? provider.bio.replace(/<[^>]+>/g, '') : ''}
                    </p>

                    {provider.service_areas?.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                        <MapPin className="w-4 h-4" />
                        <span>{provider.service_areas.slice(0, 2).join(', ')}{provider.service_areas.length > 2 ? '...' : ''}</span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Link to={`/publicprofile?user=${encodeURIComponent(provider.email)}`} className="flex-1">
                        <Button variant="outline" className="w-full" size="sm">
                          View Profile
                        </Button>
                      </Link>
                      {user && (
                        <Button
                          onClick={() => handleContact(provider)}
                          className="flex-1 bg-[#1e3a5f] hover:bg-[#2a4a7f]"
                          size="sm"
                        >
                          Contact
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}

              {/* Google Places Results */}
              {googlePlaces.map((place) => {
                const isClaimed = isBusinessClaimed(place.place_id);
                return (
                  <Card key={`google-${place.place_id}`} className="p-6 hover:shadow-xl transition-shadow border-2 border-blue-100">
                    <div className="flex items-start gap-4 mb-4">
                      {place.photo_url ? (
                        <img src={place.photo_url} alt={place.name} className="w-16 h-16 object-cover rounded-lg" />
                      ) : (
                        <div className="w-16 h-16 bg-gray-300 rounded-lg flex items-center justify-center">
                          <Wrench className="w-8 h-8 text-white" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-[#1e3a5f] mb-1">{place.name}</h3>
                        <Badge variant="outline" className="mb-2 text-xs">Google Business</Badge>
                        {place.rating > 0 && (
                          <div className="flex items-center gap-1 mb-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-semibold">{place.rating.toFixed(1)}</span>
                            <span className="text-xs text-gray-500">({place.user_ratings_total})</span>
                          </div>
                        )}
                        {isClaimed && (
                          <Badge className="bg-green-100 text-green-800 text-xs">Claimed</Badge>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{place.address}</p>
                    {place.phone && (
                      <p className="text-sm text-gray-600 mb-4">{place.phone}</p>
                    )}

                    {isClaimed ? (
                      <Button variant="outline" className="w-full" size="sm" disabled>
                        Already Claimed
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => handleClaimBusiness(place)} 
                        className="w-full bg-[#d4af37] hover:bg-[#c49d2a]"
                        size="sm"
                      >
                        Claim This Business
                      </Button>
                    )}
                  </Card>
                  );
                  })}
            </div>
            )}
          </PullToRefresh>
        </div>
      </div>

      {/* Contact Provider Modal */}
      <Dialog open={!!contactingProvider} onOpenChange={() => { setContactingProvider(null); setMessageText(''); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Contact {contactingProvider?.business_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Your Message</Label>
              <Textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Enter your message..."
                rows={8}
                className="resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                Edit the message above and click send when ready
              </p>
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={sendingMessage || !messageText.trim()}
              className="w-full bg-[#1e3a5f] hover:bg-[#2a4a7f]"
            >
              {sendingMessage ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Send Message
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Claim Business Modal */}
      <Dialog open={!!claimingBusiness} onOpenChange={() => { 
        setClaimingBusiness(null); 
        setVerificationCode(''); 
        // Remove claim parameter from URL
        const newUrl = new URLSearchParams(location.search);
        newUrl.delete('claim');
        const newSearch = newUrl.toString();
        window.history.pushState({}, '', `${location.pathname}${newSearch ? '?' + newSearch : ''}`);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Claim Business</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <p className="font-semibold text-lg mb-2">{claimingBusiness?.name}</p>
              <p className="text-sm text-gray-600 mb-1">{claimingBusiness?.address}</p>
              <p className="text-sm text-gray-600">{claimingBusiness?.phone}</p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                To claim this business, we'll send a verification code to the phone number listed on Google.
              </p>
            </div>

            <div>
              <Label>Enter Verification Code</Label>
              <Input
                type="text"
                maxLength={6}
                placeholder="6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSendVerification}
                variant="outline"
                className="flex-1"
                disabled={sendingSMS}
              >
                {sendingSMS ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Send Code
              </Button>
              <Button
                onClick={handleVerifyCode}
                className="flex-1 bg-[#1e3a5f] hover:bg-[#2a4a7f]"
                disabled={verifyingCode || verificationCode.length !== 6}
              >
                {verifyingCode ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Verify & Claim
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fixed Bottom Search Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search services..."
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
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Badge variant="outline" className="hidden sm:flex">
              {filteredServices.length + googlePlaces.length} found
            </Badge>
          </div>
        </div>
      </div>

      {/* Filter Drawer */}
      <Dialog open={showFilters} onOpenChange={setShowFilters}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Filter Services</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="category-select">Service Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger id="category-select">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="area-select">Service Area</Label>
              <Select value={selectedArea} onValueChange={setSelectedArea}>
                <SelectTrigger id="area-select">
                  <SelectValue placeholder="All Areas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Areas</SelectItem>
                  {uniqueAreas.map(area => (
                    <SelectItem key={area} value={area}>{area}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedArea('all');
                }}
                variant="outline"
                className="flex-1"
              >
                Clear All
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
    </div>
  );
}