import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, Upload, X, Sparkles, CreditCard } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function EditInsight() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const insightId = urlParams.get('id');
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [generatingImages, setGeneratingImages] = useState(false);

  const [insightForm, setInsightForm] = useState({
    title: '',
    content: '',
    category: '',
    tags: '',
    photo_urls: [],
    author_name: ''
  });

  // Quill modules
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
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'color', 'background', 'link', 'image'
  ];

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        if (!currentUser) {
           base44.auth.redirectToLogin(window.location.href);
        } else if (!insightId) {
           setInsightForm(prev => ({ ...prev, author_name: currentUser.full_name || 'Anonymous' }));
        }
      } catch (error) {
        base44.auth.redirectToLogin(window.location.href);
      }
    };
    loadUser();
  }, [insightId]);

  const { data: insight, isLoading } = useQuery({
    queryKey: ['insight', insightId],
    queryFn: async () => {
      if (!insightId) return null;
      const insights = await base44.entities.Insight.filter({ id: insightId });
      return insights[0];
    },
    enabled: !!insightId
  });

  const { data: categories } = useQuery({
    queryKey: ['insightCategories'],
    queryFn: () => base44.entities.Category.filter({ type: 'insight_type', is_active: true }),
    initialData: []
  });

  useEffect(() => {
    if (insight) {
      setInsightForm({
        title: insight.title,
        content: insight.content,
        category: insight.category,
        tags: insight.tags || '',
        photo_urls: insight.photo_urls || [],
        author_name: insight.author_name
      });
    }
  }, [insight]);

  const mutation = useMutation({
    mutationFn: (data) => {
      if (insightId) {
        return base44.entities.Insight.update(insightId, data);
      }
      return base44.entities.Insight.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['insights']);
      navigate(-1);
    }
  });

  const generateImagesMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('generateInsightImages', {
        title: insightForm.title,
        description: insightForm.content.replace(/<[^>]+>/g, '').substring(0, 200),
        count: 10
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to generate images');
      }

      return response.data;
    },
    onSuccess: (data) => {
      setInsightForm(prev => ({
        ...prev,
        photo_urls: [...prev.photo_urls, ...data.imageUrls]
      }));
      setUser(prev => ({ ...prev, credits: data.creditsRemaining }));
      alert(`✨ Generated ${data.imagesGenerated} images! ${data.creditsRemaining} credits remaining.`);
    },
    onError: (error) => {
      alert(`Failed to generate images: ${error.message}`);
    }
  });

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setUploadingPhotos(true);
    try {
      const uploadPromises = files.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
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

  const handleGenerateImages = async () => {
    if (!insightForm.title.trim()) {
      alert('Please enter a title first');
      return;
    }

    const userCredits = user?.credits || 0;
    if (userCredits < 1) {
      alert('Insufficient credits. You need 1 credit to generate 10 images.');
      return;
    }

    generateImagesMutation.mutate();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const stripHtml = (html) => {
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || '';
    };

    const tags = insightForm.tags.split(',').map(t => t.trim()).filter(Boolean);
    const tagsString = tags.join(' ');

    mutation.mutate({
      ...insightForm,
      content: insightForm.content,
      content_text: stripHtml(insightForm.content),
      tags: tagsString
    });
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black/50">
        <Loader2 className="w-12 h-12 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100/90 backdrop-blur-sm flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-3xl relative">
        <Button 
          variant="ghost" 
          className="absolute -top-12 left-0 text-gray-600 hover:text-gray-900"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <Card className="shadow-2xl p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#1e3a5f]">
              {insightId ? 'Edit Insight' : 'Share Insight'}
            </h2>
            {user && (
              <Badge className="bg-[#d4af37] text-white px-3 py-1">
                <CreditCard className="w-4 h-4 mr-1" />
                {user.credits || 0} Credits
              </Badge>
            )}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={insightForm.title}
                onChange={(e) => setInsightForm({ ...insightForm, title: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Category *</Label>
              <Select
                value={insightForm.category || ''}
                onValueChange={(value) => setInsightForm({ ...insightForm, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Content *</Label>
              <div className="bg-white rounded-lg border">
                <ReactQuill
                  theme="snow"
                  value={insightForm.content}
                  onChange={(value) => setInsightForm({ ...insightForm, content: value })}
                  modules={quillModules}
                  formats={quillFormats}
                  style={{ minHeight: '120px' }}
                />
              </div>
            </div>
            <div>
              <Label>Tags (comma separated)</Label>
              <Input
                value={insightForm.tags}
                onChange={(e) => setInsightForm({ ...insightForm, tags: e.target.value })}
                placeholder="plumbing, diy"
              />
            </div>
            <div>
              <Label>Photos</Label>
              <div className="flex flex-wrap gap-2 mb-3">
                {insightForm.photo_urls.map((url, index) => (
                  <div key={index} className="relative w-20 h-20">
                    <img src={url} alt="" className="w-full h-full object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <label className="cursor-pointer inline-block">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhotos}
                  />
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm">
                    <Upload className="w-4 h-4" />
                    <span>{uploadingPhotos ? 'Uploading...' : 'Upload Photos'}</span>
                  </div>
                </label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerateImages}
                  disabled={generateImagesMutation.isPending || !insightForm.title.trim()}
                  className="border-purple-600 text-purple-700 hover:bg-purple-50"
                >
                  {generateImagesMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      AI Generate 10 Images (1 credit)
                    </>
                  )}
                </Button>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" className="bg-[#1e3a5f] hover:bg-[#2a4a7f]" disabled={mutation.isLoading}>
                {mutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Insight'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}