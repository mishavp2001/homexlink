import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { User, Wrench, Plus, Edit2, Loader2, CheckCircle, Briefcase, X, Camera, ExternalLink, DollarSign, Image, QrCode, Trash2, MessageSquare, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import Navigation from '../components/Navigation';
import SMSOptInModal from '../components/SMSOptInModal';
import { Checkbox } from '@/components/ui/checkbox';
import LanguageSelector from '@/components/LanguageSelector';
import ThemeToggle from '@/components/ThemeToggle';

export default function Profile() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingProfilePhoto, setUploadingProfilePhoto] = useState(false);
  const [uploadingBusinessPhoto, setUploadingBusinessPhoto] = useState(false);
  const [uploadingWorkPhoto, setUploadingWorkPhoto] = useState(false);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [showSMSOptIn, setShowSMSOptIn] = useState(false);
  
  const [profileForm, setProfileForm] = useState({
    user_type: 'homeowner',
    bio: '',
    profile_photo_url: '',
    business_name: '',
    business_photo_url: '',
    business_address: '',
    business_phone: '',
    service_areas: [],
    service_types: [],
    website_url: '',
    social_links: {},
    price_list: [],
    work_photos: [],
    certifications: [],
    years_in_business: 0,
    public_profile_url: '',
    quote_assistant_instructions: '',
    profile_qr_code_url: ''
  });

  const [newServiceArea, setNewServiceArea] = useState('');
  const [newCertification, setNewCertification] = useState('');
  const [newPriceItem, setNewPriceItem] = useState({ description: '', price: '' });

  const [serviceForm, setServiceForm] = useState({
    expert_name: '',
    expert_email: '',
    expert_phone: '',
    service_category: '',
    description: '',
    service_area: '',
    years_experience: '',
    hourly_rate: '',
    photo_url: '',
    certifications: ''
  });

  // Quill modules configuration
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }],
      ['link'],
      ['clean']
    ]
  };

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline',
    'list', 'bullet',
    'color',
    'link'
  ];

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        // Show SMS opt-in modal for first-time users
        if (!currentUser.has_seen_sms_optin && !currentUser.sms_consent && !currentUser.sms_opt_in) {
          setShowSMSOptIn(true);
        }
        
        setServiceForm(prev => ({
          ...prev,
          expert_email: currentUser.email,
          expert_name: currentUser.full_name || ''
        }));
        
        let initialProfileData = {
          user_type: currentUser.user_type || 'homeowner',
          bio: currentUser.bio || '',
          profile_photo_url: currentUser.profile_photo_url || '',
          business_name: '',
          business_photo_url: '',
          business_address: '',
          business_phone: '',
          service_areas: [],
          service_types: [],
          website_url: '',
          social_links: {},
          price_list: [],
          work_photos: [],
          certifications: [],
          years_in_business: 0,
          quote_assistant_instructions: ''
        };
        
        // For service providers, load data from ServiceListing
        if (currentUser.user_type === 'service_provider') {
          const listings = await base44.entities.ServiceListing.filter({ expert_email: currentUser.email });
          if (listings.length > 0) {
            const listing = listings[0];
            initialProfileData = {
              ...initialProfileData,
              business_name: listing.business_name || '',
              business_photo_url: listing.business_photo_url || '',
              business_address: listing.business_address || '',
              business_phone: listing.business_phone || '',
              bio: listing.bio || currentUser.bio || '',
              service_areas: listing.service_areas || [],
              service_types: listing.service_types || [],
              website_url: listing.website_url || '',
              social_links: listing.social_links || {},
              price_list: listing.price_list || [],
              work_photos: listing.work_photos || [],
              certifications: listing.certifications || [],
              years_in_business: listing.years_in_business || 0,
              quote_assistant_instructions: listing.quote_assistant_instructions || '',
              profile_qr_code_url: listing.profile_qr_code_url || ''
            };
          }
        }
        
        // Check if there's a claimed business to apply
        const claimedBusinessData = sessionStorage.getItem('claimedBusiness');
        if (claimedBusinessData) {
          const claimed = JSON.parse(claimedBusinessData);
          initialProfileData = {
            ...initialProfileData,
            user_type: 'service_provider',
            business_name: claimed.name || initialProfileData.business_name,
            business_address: claimed.address || initialProfileData.business_address,
            business_phone: claimed.phone || initialProfileData.business_phone,
            website_url: claimed.website || initialProfileData.website_url
          };
          sessionStorage.removeItem('claimedBusiness');
        }
        
        setProfileForm(initialProfileData);
      } catch (error) {
        console.error('Not authenticated');
        const profileUrl = window.location.origin + createPageUrl('Profile');
        base44.auth.redirectToAppLogin(profileUrl);
      }
      setLoadingAuth(false);
    };
    loadUser();
  }, []);

  const { data: myServices, isLoading } = useQuery({
    queryKey: ['myServices', user?.email],
    queryFn: () => user ? base44.entities.ServiceListing.filter({ expert_email: user.email }, '-created_date') : [],
    enabled: !!user,
    initialData: []
  });

  const { data: categories } = useQuery({
    queryKey: ['serviceCategories'],
    queryFn: () => base44.entities.Category.filter({ type: 'service_type', is_active: true }),
    initialData: []
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      // Save basic user info to User entity
      await base44.auth.updateMe({
        user_type: data.user_type,
        bio: data.bio,
        profile_photo_url: data.profile_photo_url
      });
      
      // For service providers, save business data to ServiceListing
      if (data.user_type === 'service_provider') {
        const existingListings = await base44.entities.ServiceListing.filter({ expert_email: user.email });
        
        const serviceListingData = {
          expert_email: user.email,
          business_name: data.business_name,
          business_photo_url: data.business_photo_url,
          business_address: data.business_address,
          business_phone: data.business_phone,
          bio: data.bio,
          service_areas: data.service_areas,
          service_types: data.service_types,
          website_url: data.website_url,
          social_links: data.social_links,
          price_list: data.price_list,
          work_photos: data.work_photos,
          certifications: data.certifications,
          years_in_business: data.years_in_business,
          quote_assistant_instructions: data.quote_assistant_instructions,
          profile_qr_code_url: data.profile_qr_code_url || existingListings[0]?.profile_qr_code_url,
          status: 'active'
        };
        
        if (existingListings.length === 0) {
          await base44.entities.ServiceListing.create(serviceListingData);
        } else {
          await base44.entities.ServiceListing.update(existingListings[0].id, serviceListingData);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user']);
      alert('Profile updated successfully!');
    },
    onError: (error) => {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile.');
    }
  });

  const createServiceMutation = useMutation({
    mutationFn: (data) => base44.entities.ServiceListing.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['myServices']);
      setShowServiceForm(false);
      setServiceForm({
        expert_name: user?.full_name || '',
        expert_email: user?.email || '',
        expert_phone: '',
        service_category: '',
        description: '',
        service_area: '',
        years_experience: '',
        hourly_rate: '',
        photo_url: '',
        certifications: ''
      });
    },
    onError: (error) => {
      console.error('Failed to create service:', error);
      alert('Failed to create service listing.');
    }
  });

  const updateServiceMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ServiceListing.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['myServices']);
      setEditingService(null);
      setShowServiceForm(false);
    },
    onError: (error) => {
      console.error('Failed to update service:', error);
      alert('Failed to update service listing.');
    }
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id) => base44.entities.ServiceListing.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['myServices']);
    },
    onError: (error) => {
      console.error('Failed to delete service:', error);
      alert('Failed to delete service listing.');
    }
  });

  const handleProfilePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingProfilePhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProfileForm({ ...profileForm, profile_photo_url: file_url });
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload profile photo.');
    }
    setUploadingProfilePhoto(false);
  };

  const handleBusinessPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingBusinessPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProfileForm({ ...profileForm, business_photo_url: file_url });
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload business photo.');
    }
    setUploadingBusinessPhoto(false);
  };

  const handleWorkPhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setUploadingWorkPhoto(true);
    try {
      const uploadPromises = files.map(file => base44.integrations.Core.UploadFile({ file }));
      const results = await Promise.all(uploadPromises);
      const newUrls = results.map(r => r.file_url);
      setProfileForm({ ...profileForm, work_photos: [...profileForm.work_photos, ...newUrls] });
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload work photos.');
    }
    setUploadingWorkPhoto(false);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setServiceForm({ ...serviceForm, photo_url: file_url });
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload service photo.');
    }
    setUploadingPhoto(false);
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileForm);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...serviceForm,
      years_experience: parseFloat(serviceForm.years_experience) || 0,
      hourly_rate: parseFloat(serviceForm.hourly_rate) || 0
    };

    if (editingService) {
      updateServiceMutation.mutate({ id: editingService.id, data });
    } else {
      createServiceMutation.mutate(data);
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setServiceForm(service);
    setShowServiceForm(true);
  };

  const addServiceArea = () => {
    if (newServiceArea.trim() && !profileForm.service_areas.includes(newServiceArea.trim())) {
      setProfileForm({
        ...profileForm,
        service_areas: [...profileForm.service_areas, newServiceArea.trim()]
      });
      setNewServiceArea('');
    }
  };

  const removeServiceArea = (index) => {
    setProfileForm({
      ...profileForm,
      service_areas: profileForm.service_areas.filter((_, i) => i !== index)
    });
  };

  const addCertification = () => {
    if (newCertification.trim() && !profileForm.certifications.includes(newCertification.trim())) {
      setProfileForm({
        ...profileForm,
        certifications: [...profileForm.certifications, newCertification.trim()]
      });
      setNewCertification('');
    }
  };

  const removeCertification = (index) => {
    setProfileForm({
      ...profileForm,
      certifications: profileForm.certifications.filter((_, i) => i !== index)
    });
  };

  const addPriceItem = () => {
    if (newPriceItem.description.trim() && newPriceItem.price && parseFloat(newPriceItem.price) > 0) {
      setProfileForm({
        ...profileForm,
        price_list: [...profileForm.price_list, { 
          description: newPriceItem.description.trim(), 
          price: parseFloat(newPriceItem.price) 
        }]
      });
      setNewPriceItem({ description: '', price: '' });
    }
  };

  const removePriceItem = (index) => {
    setProfileForm({
      ...profileForm,
      price_list: profileForm.price_list.filter((_, i) => i !== index)
    });
  };

  const removeWorkPhoto = (index) => {
    setProfileForm({
      ...profileForm,
      work_photos: profileForm.work_photos.filter((_, i) => i !== index)
    });
  };

  const generateQRCode = async () => {
    setGeneratingQR(true);
    try {
      const publicProfileUrl = `${window.location.origin}/publicprofile?user=${encodeURIComponent(user.email)}`;
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(publicProfileUrl)}`;
      
      setProfileForm({
        ...profileForm,
        profile_qr_code_url: qrApiUrl
      });
      
      alert('QR code generated! Save your profile to apply it.');
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      alert('Failed to generate QR code.');
    }
    setGeneratingQR(false);
  };

  if (loadingAuth || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#1e3a5f]" />
      </div>
    );
  }

  const publicProfileUrl = `${window.location.origin}/publicprofile?user=${encodeURIComponent(user.email)}`;
  const deleteAccountSupportHref = `mailto:support@homexrei.com?subject=${encodeURIComponent('Account deletion request')}&body=${encodeURIComponent(`Please delete my HomeXREI account associated with ${user.email}.\n\nI understand this request will permanently remove my account and related data once verified.`)}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Navigation user={user} />
      
      <SMSOptInModal 
        isOpen={showSMSOptIn} 
        onClose={(success) => {
          setShowSMSOptIn(false);
          if (success) {
            window.location.reload();
          }
        }}
        user={user}
      />
      
      <div className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link to={createPageUrl('Dashboard')}>
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-[#1e3a5f]">My Profile</h1>
              <p className="text-gray-600">Manage your profile and services</p>
            </div>
            {user.user_type === 'service_provider' && (
            <div className="flex items-center gap-2">
              <a href={publicProfileUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="icon" title="Public Profile">
                  <User className="w-4 h-4" />
                </Button>
              </a>
              {profileForm.user_type === 'service_provider' && profileForm.business_name && (
                <a href={`${window.location.origin}/service?name=${encodeURIComponent(profileForm.business_name)}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="icon" title="Business Profile">
                    <Briefcase className="w-4 h-4" />
                  </Button>
                </a>
              )}
            </div>)}
          </div>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className={`grid w-full ${user.user_type === 'service_provider' ? 'grid-cols-3' : 'grid-cols-1'} mb-6`}>
              <TabsTrigger value="profile">
                <User className="w-4 h-4 mr-2" />
                Profile Settings
              </TabsTrigger>
              {user.user_type === 'service_provider' && (
                <TabsTrigger value="services">
                  <Wrench className="w-4 h-4 mr-2" />
                  Service
                </TabsTrigger>
              )}
              {user.user_type === 'service_provider' && (
                <TabsTrigger value="quote-assistant">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Quote Assistant
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="profile">
              <Card className="p-6 mb-8">
                <h2 className="text-xl font-bold text-[#1e3a5f] mb-6">Profile Information</h2>
                
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  {/* User Type */}
                  <div>
                    <Label>User Type</Label>
                    <Select
                      value={profileForm.user_type}
                      onValueChange={(value) => setProfileForm({ ...profileForm, user_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="homeowner">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Homeowner
                          </div>
                        </SelectItem>
                        <SelectItem value="service_provider">
                          <div className="flex items-center gap-2">
                            <Wrench className="w-4 h-4" />
                            Service Provider
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      {profileForm.user_type === 'homeowner' ? 'Can digitize properties and post property deals' : 'Can list services and post service deals'}
                    </p>
                  </div>

                  {/* Basic Info */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Full Name</Label>
                      <Input value={user.full_name} disabled className="bg-gray-100" />
                      <p className="text-xs text-gray-500 mt-1">Contact support to change your name</p>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input value={user.email} disabled className="bg-gray-100" />
                    </div>
                  </div>

                  {/* Profile Photo */}
                  <div>
                    <Label>Profile Photo</Label>
                    <div className="flex items-center gap-4 mt-2">
                      {profileForm.profile_photo_url && (
                        <img src={profileForm.profile_photo_url} alt="Profile" className="w-20 h-20 object-cover rounded-full" />
                      )}
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleProfilePhotoUpload}
                          disabled={uploadingProfilePhoto}
                        />
                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg">
                          {uploadingProfilePhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                          <span className="text-sm">{uploadingProfilePhoto ? 'Uploading...' : 'Upload Photo'}</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <Label>Bio</Label>
                    <div className="bg-white rounded-lg">
                      <ReactQuill
                        theme="snow"
                        value={profileForm.bio}
                        onChange={(value) => setProfileForm({ ...profileForm, bio: value })}
                        modules={quillModules}
                        formats={quillFormats}
                        placeholder="Tell us about yourself..."
                        style={{ minHeight: '120px' }}
                      />
                    </div>
                  </div>

                  {/* SMS Notifications Opt-In */}
                  <div className="border rounded-lg p-4 bg-blue-50">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="sms-consent"
                        checked={user.sms_consent || user.sms_opt_in || false}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setShowSMSOptIn(true);
                          } else {
                            if (confirm('Are you sure you want to opt-out of SMS notifications?')) {
                              base44.auth.updateMe({ sms_consent: false, sms_opt_in: false });
                              window.location.reload();
                            }
                          }
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <Label htmlFor="sms-consent" className="cursor-pointer flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          <span className="font-semibold">Receive SMS Notifications</span>
                        </Label>
                        <p className="text-xs text-gray-600 mt-1">
                          Get instant updates about bookings, appointments, and important notifications via text message. 
                          {(user.sms_consent || user.sms_opt_in) && user.sms_phone_number && (
                            <span className="block mt-1 font-medium">Phone: {user.sms_phone_number}</span>
                          )}
                        </p>
                        <Link to={createPageUrl('SMSOptIn')} className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                          Manage SMS preferences
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* App Preferences */}
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h3 className="font-semibold text-gray-900 mb-4">App Preferences</h3>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Language</Label>
                        <LanguageSelector />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Theme</Label>
                        <ThemeToggle />
                      </div>
                    </div>
                  </div>



                  {/* Business Fields - Only for Service Providers */}
                  {profileForm.user_type === 'service_provider' && (
                    <>
                      <div className="pt-6 border-t">
                        <h3 className="text-lg font-semibold text-[#1e3a5f] mb-4">Business Information</h3>
                        
                        <div className="space-y-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <Label>Business Name *</Label>
                              <Input
                                value={profileForm.business_name}
                                onChange={(e) => setProfileForm({ ...profileForm, business_name: e.target.value })}
                                required
                              />
                            </div>
                            <div>
                              <Label>Business Phone</Label>
                              <Input
                                type="tel"
                                value={profileForm.business_phone}
                                onChange={(e) => setProfileForm({ ...profileForm, business_phone: e.target.value })}
                              />
                            </div>
                          </div>

                          <div>
                            <Label>Business Address</Label>
                            <Input
                              value={profileForm.business_address}
                              onChange={(e) => setProfileForm({ ...profileForm, business_address: e.target.value })}
                              placeholder="123 Main St, City, State ZIP"
                            />
                          </div>

                          <div>
                            <Label>Business Logo/Photo</Label>
                            <div className="flex items-center gap-4 mt-2">
                              {profileForm.business_photo_url && (
                                <img src={profileForm.business_photo_url} alt="Business" className="w-20 h-20 object-cover rounded-lg" />
                              )}
                              <label className="cursor-pointer">
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={handleBusinessPhotoUpload}
                                  disabled={uploadingBusinessPhoto}
                                />
                                <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg">
                                  {uploadingBusinessPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                                  <span className="text-sm">{uploadingBusinessPhoto ? 'Uploading...' : 'Upload Logo'}</span>
                                </div>
                              </label>
                            </div>
                          </div>

                          <div>
                            <Label>Business Profile Link</Label>
                            <a 
                              href={`${window.location.origin}/publicprofile?user=${encodeURIComponent(user.email)}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="block"
                            >
                              <Button type="button" variant="outline" className="w-full">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View Your Business Profile
                              </Button>
                            </a>
                            <p className="text-xs text-gray-500 mt-1">
                              See how your business profile appears to customers
                            </p>
                          </div>

                          <div>
                            <Label>Profile QR Code</Label>
                            {profileForm.profile_qr_code_url ? (
                              <div className="mt-2 space-y-3">
                                <img 
                                  src={profileForm.profile_qr_code_url} 
                                  alt="Profile QR Code" 
                                  className="w-48 h-48 mx-auto bg-white p-3 rounded-lg border"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={generateQRCode}
                                  disabled={generatingQR}
                                  className="w-full"
                                >
                                  {generatingQR ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <QrCode className="w-4 h-4 mr-2" />}
                                  Regenerate QR Code
                                </Button>
                              </div>
                            ) : (
                              <Button
                                type="button"
                                onClick={generateQRCode}
                                disabled={generatingQR}
                                className="w-full mt-2"
                              >
                                {generatingQR ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <QrCode className="w-4 h-4 mr-2" />}
                                Generate QR Code
                              </Button>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              QR code links to your public profile. Share on business cards or social media. Remember to save your profile after generating.
                            </p>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <Label>Website</Label>
                              <Input
                                type="url"
                                value={profileForm.website_url}
                                onChange={(e) => setProfileForm({ ...profileForm, website_url: e.target.value })}
                                placeholder="https://yourwebsite.com"
                              />
                            </div>
                            <div>
                              <Label>Years in Business</Label>
                              <Input
                                type="number"
                                value={profileForm.years_in_business}
                                onChange={(e) => setProfileForm({ ...profileForm, years_in_business: parseFloat(e.target.value) || 0 })}
                              />
                            </div>
                          </div>



                          {/* Social Links */}
                          <div>
                            <Label>Social Media Links</Label>
                            <div className="grid md:grid-cols-2 gap-4">
                              <Input
                                value={profileForm.social_links?.facebook || ''}
                                onChange={(e) => setProfileForm({ 
                                  ...profileForm, 
                                  social_links: { ...profileForm.social_links, facebook: e.target.value }
                                })}
                                placeholder="Facebook URL"
                              />
                              <Input
                                value={profileForm.social_links?.instagram || ''}
                                onChange={(e) => setProfileForm({ 
                                  ...profileForm, 
                                  social_links: { ...profileForm.social_links, instagram: e.target.value }
                                })}
                                placeholder="Instagram URL"
                              />
                              <Input
                                value={profileForm.social_links?.linkedin || ''}
                                onChange={(e) => setProfileForm({ 
                                  ...profileForm, 
                                  social_links: { ...profileForm.social_links, linkedin: e.target.value }
                                })}
                                placeholder="LinkedIn URL"
                              />
                              <Input
                                value={profileForm.social_links?.twitter || ''}
                                onChange={(e) => setProfileForm({ 
                                  ...profileForm, 
                                  social_links: { ...profileForm.social_links, twitter: e.target.value }
                                })}
                                placeholder="Twitter URL"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full bg-[#1e3a5f] hover:bg-[#2a4a7f]"
                    disabled={updateProfileMutation.isLoading}
                  >
                    {updateProfileMutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Save Profile
                  </Button>
                </form>
              </Card>

              {/* Account Deletion Section */}
              <Card className="p-6 border-red-200 bg-red-50">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-bold text-red-900 mb-2">Delete Account</h3>
                    <p className="text-sm text-red-800 mb-4">
                      Self-service account deletion is temporarily unavailable during the platform migration.
                      To request permanent deletion of your account and associated data, contact support from your account email so the request can be verified safely.
                    </p>
                    <Button asChild variant="destructive" className="bg-red-600 hover:bg-red-700">
                      <a href={deleteAccountSupportHref}>
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Email Support to Delete Account
                      </a>
                    </Button>
                    <p className="text-xs text-red-700 mt-3">
                      Support: <a href="mailto:support@homexrei.com" className="underline">support@homexrei.com</a>
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="services">
              <Card className="p-6 mb-8">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <Wrench className="w-6 h-6 text-[#d4af37]" />
                    <h2 className="text-xl font-bold text-[#1e3a5f]">Service Information</h2>
                  </div>
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  {/* Service Types */}
                  <div>
                    <Label>Service Types Offered</Label>
                    <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50 mb-3">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm text-gray-600">Select all services you provide</p>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (profileForm.service_types.length === categories.length) {
                              setProfileForm({ ...profileForm, service_types: [] });
                            } else {
                              setProfileForm({ ...profileForm, service_types: categories.map(c => c.name) });
                            }
                          }}
                        >
                          {profileForm.service_types.length === categories.length ? 'Deselect All' : 'Select All'}
                        </Button>
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {categories.map((cat) => {
                          const isSelected = profileForm.service_types?.includes(cat.name);
                          return (
                            <label
                              key={cat.id}
                              className="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-gray-50 cursor-pointer border-2 transition-colors"
                              style={{ borderColor: isSelected ? '#1e3a5f' : '#e5e7eb' }}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setProfileForm({
                                      ...profileForm,
                                      service_types: [...(profileForm.service_types || []), cat.name]
                                    });
                                  } else {
                                    setProfileForm({
                                      ...profileForm,
                                      service_types: profileForm.service_types.filter(t => t !== cat.name)
                                    });
                                  }
                                }}
                                className="w-5 h-5 text-[#1e3a5f] focus:ring-[#1e3a5f]"
                              />
                              <span className="text-2xl">{cat.icon || '🔧'}</span>
                              <span className="font-medium">{cat.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {profileForm.service_types?.map((type, index) => (
                        <Badge key={index} className="bg-[#1e3a5f] text-white">
                          {type}
                          <X
                            className="w-3 h-3 ml-1 cursor-pointer"
                            onClick={() => {
                              setProfileForm({
                                ...profileForm,
                                service_types: profileForm.service_types.filter(t => t !== type)
                              });
                            }}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Service Areas */}
                  <div>
                    <Label>Service Areas</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={newServiceArea}
                        onChange={(e) => setNewServiceArea(e.target.value)}
                        placeholder="Add city or region..."
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addServiceArea())}
                      />
                      <Button type="button" onClick={addServiceArea}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {profileForm.service_areas.map((area, index) => (
                        <Badge key={index} variant="outline" className="flex items-center gap-1">
                          {area}
                          <X className="w-3 h-3 cursor-pointer" onClick={() => removeServiceArea(index)} />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Price List */}
                  <div>
                    <Label>
                      <DollarSign className="w-4 h-4 inline mr-1" />
                      Price List
                    </Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={newPriceItem.description}
                        onChange={(e) => setNewPriceItem({ ...newPriceItem, description: e.target.value })}
                        placeholder="Service description..."
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={newPriceItem.price}
                        onChange={(e) => setNewPriceItem({ ...newPriceItem, price: e.target.value })}
                        placeholder="Price"
                        className="w-32"
                      />
                      <Button type="button" onClick={addPriceItem}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {profileForm.price_list.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{item.description}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-[#d4af37]">${item.price}</span>
                            <X className="w-4 h-4 cursor-pointer text-gray-400 hover:text-red-600" onClick={() => removePriceItem(index)} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Certifications */}
                  <div>
                    <Label>Certifications & Licenses</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={newCertification}
                        onChange={(e) => setNewCertification(e.target.value)}
                        placeholder="Add certification..."
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
                      />
                      <Button type="button" onClick={addCertification}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-1">
                      {profileForm.certifications.map((cert, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">{cert}</span>
                          <X className="w-4 h-4 cursor-pointer text-gray-400 hover:text-red-600" onClick={() => removeCertification(index)} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Work Photos */}
                  <div>
                    <Label>
                      <Image className="w-4 h-4 inline mr-1" />
                      Portfolio / Work Photos
                    </Label>
                    <div className="mb-3">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleWorkPhotoUpload}
                          disabled={uploadingWorkPhoto}
                        />
                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg inline-flex">
                          {uploadingWorkPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                          <span className="text-sm">{uploadingWorkPhoto ? 'Uploading...' : 'Add Photos'}</span>
                        </div>
                      </label>
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                      {profileForm.work_photos.map((url, index) => (
                        <div key={index} className="relative group">
                          <img src={url} alt={`Work ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                          <button
                            type="button"
                            onClick={() => removeWorkPhoto(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-[#1e3a5f] hover:bg-[#2a4a7f]"
                    disabled={updateProfileMutation.isLoading}
                  >
                    {updateProfileMutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Save Service Information
                  </Button>
                </form>

                {/* Service Listings */}
                {myServices.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-[#1e3a5f] mb-4">Your Service Listings</h3>
                    <div className="space-y-3">
                      {myServices.map((service) => (
                        <Card key={service.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{service.business_name}</h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {service.service_types?.join(', ') || 'No services listed'}
                              </p>
                              {service.service_areas?.length > 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Areas: {service.service_areas.join(', ')}
                                </p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this service listing? This will remove it from the marketplace.')) {
                                  deleteServiceMutation.mutate(service.id);
                                }
                              }}
                              disabled={deleteServiceMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="quote-assistant">
              <Card className="p-6 mb-8">
                <h2 className="text-xl font-bold text-[#1e3a5f] mb-4">AI Quote Assistant</h2>
                <p className="text-gray-600 mb-6">
                  Configure how the AI assistant should generate quotes for your business. This will be used in the embeddable quote widget.
                </p>

                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div>
                    <Label>Quote Assistant Instructions</Label>
                    <Textarea
                      value={profileForm.quote_assistant_instructions || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, quote_assistant_instructions: e.target.value })}
                      placeholder="Example: Always include a detailed breakdown of labor and materials. Offer a 10% discount for first-time customers. Include warranty information..."
                      rows={8}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      These instructions will guide the AI when generating quotes for your customers.
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-[#1e3a5f] mb-2">Widget Embed Code</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Copy this code and paste it into your website to embed the quote widget:
                    </p>
                    <div className="bg-white p-3 rounded-lg font-mono text-xs overflow-x-auto border">
                      {`<iframe src="${window.location.origin}/servicequote?name=${encodeURIComponent(profileForm.business_name || '')}" width="100%" height="600" frameborder="0" style="border: 1px solid #e5e7eb; border-radius: 8px;"></iframe>`}
                    </div>

                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-[#1e3a5f] mb-2">What the AI Uses</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      The AI quote assistant will use the following information from your profile:
                    </p>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Business Name:</strong> {profileForm.business_name || 'Not set'}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Service Types:</strong> {profileForm.service_types?.length || 0} selected</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Service Areas:</strong> {profileForm.service_areas?.length || 0} areas</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Price List:</strong> {profileForm.price_list?.length || 0} items</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Website:</strong> {profileForm.website_url || 'Not set'}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Custom Instructions:</strong> {profileForm.quote_assistant_instructions ? '✓ Set' : 'Not set'}</span>
                      </li>
                    </ul>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-[#1e3a5f] hover:bg-[#2a4a7f]"
                    disabled={updateProfileMutation.isLoading}
                  >
                    {updateProfileMutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Save Quote Assistant Settings
                  </Button>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

    </div>
  );
}