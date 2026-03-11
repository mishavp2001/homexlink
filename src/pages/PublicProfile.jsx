import React, { useState, useEffect } from 'react';
import { Deal, Review, ServiceListing } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  User, Briefcase, MapPin, Phone, Mail, Globe, Award, CheckCircle,
  Facebook, Instagram, Linkedin, Twitter, DollarSign, Image as ImageIcon, Loader2,
  Star, MessageSquare, QrCode
} from 'lucide-react';

export const isPublic = true;

export default function PublicProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const userEmail = urlParams.get('user') ? decodeURIComponent(urlParams.get('user')) : null;
  


  // Fetch service listing data directly (public data)
  const { data: profileUser, isLoading: loadingUser } = useQuery({
    queryKey: ['profileUser', userEmail],
    queryFn: async () => {
      if (!userEmail) return null;
      
      const listings = await ServiceListing.filter({ 
        expert_email: userEmail,
        status: 'active'
      });
      
      if (listings.length === 0) return null;
      
      return listings[0];
    },
    enabled: !!userEmail
  });

  // Fetch service listings for reviews
  const { data: userServices = [], isLoading: loadingServices } = useQuery({
    queryKey: ['userServices', userEmail],
    queryFn: async () => {
      if (!userEmail) return [];
      return await ServiceListing.filter({ 
        expert_email: userEmail, 
        status: 'active' 
      });
    },
    enabled: !!userEmail,
    initialData: []
  });

  const { data: userDeals = [] } = useQuery({
    queryKey: ['userDeals', userEmail],
    queryFn: async () => {
      if (!userEmail) return [];
      return await Deal.filter({ 
        user_email: userEmail, 
        status: 'active' 
      });
    },
    enabled: !!userEmail,
    initialData: []
  });

  const { data: allReviews = [] } = useQuery({
    queryKey: ['userReviews', userServices],
    queryFn: async () => {
      if (!userServices || userServices.length === 0) return [];
      const serviceIds = userServices.map(s => s.id);
      const reviews = await Review.list();
      return reviews.filter(r => serviceIds.includes(r.service_listing_id));
    },
    enabled: userServices.length > 0,
    initialData: []
  });

  const isLoading = loadingServices || loadingUser;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#1e3a5f]" />
      </div>
    );
  }

  // If no user profile found, show error
  if (!profileUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="py-12 px-4 flex items-center justify-center">
          <Card className="p-12 text-center max-w-md">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
            <p className="text-gray-600 mb-4">This user profile could not be found.</p>
            {userEmail && <p className="text-sm text-gray-500">Email: {userEmail}</p>}
          </Card>
        </div>
      </div>
    );
  }

  // Use service listing data only
  const isBusinessProfile = true; // Always business profile from ServiceListing
  const displayName = profileUser?.business_name 
    ? profileUser.business_name.charAt(0).toUpperCase() + profileUser.business_name.slice(1)
    : userEmail ? userEmail.split('@')[0].charAt(0).toUpperCase() + userEmail.split('@')[0].slice(1) : 'Unknown';
  const displayPhoto = profileUser?.business_photo_url;
  const displayBio = profileUser?.bio || '';
  const displayPhone = profileUser?.business_phone;

  const getReviewsForService = (serviceId) => {
    return allReviews.filter(r => r.service_listing_id === serviceId);
  };

  const getAverageRating = (serviceId) => {
    const reviews = getReviewsForService(serviceId);
    if (reviews.length === 0) return 0;
    return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  };

  // Helper to strip HTML tags from text
  const stripHtml = (html) => {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // All public profiles are service providers with business profiles
  if (profileUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Business Card Header - Always Visible */}
          <Card className="p-8 mb-6 bg-gradient-to-br from-[#1e3a5f] to-[#2a4a7f] text-white shadow-lg">
            <div className="flex gap-6 items-start">
              {displayPhoto ? (
                <img
                  src={displayPhoto}
                  alt={displayName}
                  className="w-28 h-28 rounded-xl object-cover flex-shrink-0 border-4 border-white/20 shadow-xl"
                />
              ) : (
                <div className="w-28 h-28 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0 border-4 border-white/20">
                  <Briefcase className="w-14 h-14 text-white" />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold mb-2 drop-shadow-sm">{displayName}</h1>
                
                {displayBio && (
                  <p className="text-white/90 text-sm mb-4 line-clamp-2">{stripHtml(displayBio)}</p>
                )}

                <div className="flex flex-wrap gap-4 text-sm mb-4">
                  {profileUser?.business_address && (
                    <span className="flex items-center gap-1.5 text-white/90">
                      <MapPin className="w-4 h-4" />
                      {profileUser.business_address}
                    </span>
                  )}
                  {profileUser?.years_in_business > 0 && (
                    <span className="flex items-center gap-1.5 text-white/90">
                      <Award className="w-4 h-4" />
                      {profileUser.years_in_business} years in business
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {displayPhone && (
                    <Button size="sm" asChild className="bg-white text-[#1e3a5f] hover:bg-white/90">
                      <a href={`tel:${displayPhone}`}>
                        <Phone className="w-3 h-3 mr-1" />
                        Call
                      </a>
                    </Button>
                  )}
                  {userEmail && (
                    <Button size="sm" asChild className="bg-white/10 text-white border-white/30 hover:bg-white/20">
                      <a href={`mailto:${userEmail}`}>
                        <Mail className="w-3 h-3 mr-1" />
                        Email
                      </a>
                    </Button>
                  )}
                  {profileUser?.website_url && (
                    <Button size="sm" asChild className="bg-white/10 text-white border-white/30 hover:bg-white/20">
                      <a href={profileUser.website_url} target="_blank" rel="noopener noreferrer">
                        <Globe className="w-3 h-3 mr-1" />
                        Website
                      </a>
                    </Button>
                  )}
                </div>

                {/* Social Links */}
                {profileUser?.social_links && Object.values(profileUser.social_links).some(v => v) && (
                  <div className="flex gap-2">
                    {profileUser.social_links.facebook && (
                      <a href={profileUser.social_links.facebook} target="_blank" rel="noopener noreferrer">
                        <Button size="icon" className="h-8 w-8 bg-white/10 hover:bg-white/20 border-0">
                          <Facebook className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                    {profileUser.social_links.instagram && (
                      <a href={profileUser.social_links.instagram} target="_blank" rel="noopener noreferrer">
                        <Button size="icon" className="h-8 w-8 bg-white/10 hover:bg-white/20 border-0">
                          <Instagram className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                    {profileUser.social_links.linkedin && (
                      <a href={profileUser.social_links.linkedin} target="_blank" rel="noopener noreferrer">
                        <Button size="icon" className="h-8 w-8 bg-white/10 hover:bg-white/20 border-0">
                          <Linkedin className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                    {profileUser.social_links.twitter && (
                      <a href={profileUser.social_links.twitter} target="_blank" rel="noopener noreferrer">
                        <Button size="icon" className="h-8 w-8 bg-white/10 hover:bg-white/20 border-0">
                          <Twitter className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* QR Code - Float Right */}
              {profileUser?.profile_qr_code_url && (
                <div className="flex-shrink-0">
                  <div className="bg-white/10 rounded-lg p-3 border-2 border-white/20">
                    <img 
                      src={profileUser.profile_qr_code_url} 
                      alt="Profile QR Code" 
                      className="w-32 h-32 bg-white p-2 rounded-lg"
                    />
                    <p className="text-xs text-white/80 text-center mt-2">Scan to visit</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Tabs Below Business Card */}
          <Tabs defaultValue="portfolio" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 h-auto">
              <TabsTrigger value="portfolio" className="py-3">Portfolio</TabsTrigger>
              <TabsTrigger value="services" className="py-3">Services</TabsTrigger>
              <TabsTrigger value="assistant" className="py-3">Assistant</TabsTrigger>
            </TabsList>

            {/* Portfolio Tab */}
            <TabsContent value="portfolio">
              <Card className="p-6 mb-6">

                {/* Reviews Summary */}
                {allReviews.length > 0 && (
                  <div className="mb-6 p-6 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-[#1e3a5f]">
                          {(allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)}
                        </div>
                        <div className="flex gap-1 justify-center my-2">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-5 h-5 ${i < Math.round(allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-300'}`} />
                          ))}
                        </div>
                        <p className="text-sm text-gray-600">{allReviews.length} Reviews</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {allReviews.map((review) => (
                        <Card key={review.id} className="p-4 bg-white">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold text-gray-900">{review.reviewer_name}</p>
                              <div className="flex items-center gap-1 mt-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-300'}`} />
                                ))}
                              </div>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(review.created_date).toLocaleDateString()}
                            </span>
                          </div>
                          {review.review_text && (
                            <p className="text-gray-700 text-sm mt-2">{review.review_text}</p>
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Service Areas */}
                {profileUser?.service_areas?.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-[#1e3a5f] mb-3">Service Areas</h3>
                    <div className="flex flex-wrap gap-2">
                      {profileUser.service_areas.map((area, index) => (
                        <Badge key={index} variant="outline" className="text-base px-4 py-2">
                          <MapPin className="w-4 h-4 mr-2" />
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certifications */}
                {profileUser?.certifications?.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-[#1e3a5f] mb-3">
                      <Award className="w-5 h-5 inline mr-2" />
                      Certifications & Licenses
                    </h3>
                    <ul className="space-y-2">
                      {profileUser.certifications.map((cert, index) => (
                        <li key={index} className="flex items-center gap-2 text-gray-700">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          {cert}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Portfolio */}
                {profileUser?.work_photos?.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-[#1e3a5f] mb-3">
                      <ImageIcon className="w-5 h-5 inline mr-2" />
                      Portfolio
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {profileUser.work_photos.map((url, index) => (
                        <img 
                          key={index} 
                          src={url} 
                          alt={`Work ${index + 1}`} 
                          className="w-full h-48 object-cover rounded-lg hover:scale-105 transition-transform cursor-pointer"
                          onClick={() => window.open(url, '_blank')}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* Services Tab */}
            <TabsContent value="services">
              {/* Active Deals First */}
              {userDeals.length > 0 && (
                <Card className="p-6 mb-6">
                  <h2 className="text-xl font-bold text-[#1e3a5f] mb-4">Active Deals</h2>
                  <div className="grid md:grid-cols-3 gap-4">
                    {userDeals.map((deal) => (
                      <Card key={deal.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        {deal.photo_urls?.length > 0 && (
                          <img src={deal.photo_urls[0]} alt={deal.title} className="w-full h-32 object-cover" />
                        )}
                        <div className="p-4">
                          <h3 className="font-bold text-[#1e3a5f] mb-2 line-clamp-1">{deal.title}</h3>
                          <p className="text-lg font-bold text-[#d4af37] mb-2">${deal.price.toLocaleString()}</p>
                          <p className="text-sm text-gray-600 line-clamp-1">{deal.location}</p>
                        </div>
                      </Card>
                    ))}
                  </div>
                </Card>
              )}

              {/* Services Offered */}
              {profileUser?.service_types?.length > 0 && (
                <Card className="p-6 mb-6">
                  <h2 className="text-xl font-bold text-[#1e3a5f] mb-4">Services We Offer</h2>
                  <div className="flex flex-wrap gap-2">
                    {profileUser.service_types.map((type, idx) => (
                      <Badge key={idx} className="bg-[#d4af37] text-white text-base px-4 py-2">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}

              {/* Price List */}
              {profileUser?.price_list?.length > 0 && (
                <Card className="p-6 mb-6">
                  <h2 className="text-xl font-bold text-[#1e3a5f] mb-4">
                    <DollarSign className="w-5 h-5 inline mr-2" />
                    Price List
                  </h2>
                  <div className="space-y-3">
                    {profileUser.price_list.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <span className="font-medium text-gray-900">{item.description}</span>
                        <span className="text-xl font-bold text-[#d4af37]">${item.price}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Contact */}
              <Card className="p-6">
                <h2 className="text-xl font-bold text-[#1e3a5f] mb-4">Get in Touch</h2>
                <div className="flex gap-3">
                  {displayPhone && (
                    <Button asChild className="flex-1 bg-[#1e3a5f] hover:bg-[#2a4a7f]">
                      <a href={`tel:${displayPhone}`}>
                        <Phone className="w-4 h-4 mr-2" />
                        Call Now
                      </a>
                    </Button>
                  )}
                  <Button asChild variant="outline" className="flex-1">
                    <a href={`mailto:${userEmail}`}>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Email
                    </a>
                  </Button>
                </div>
              </Card>
            </TabsContent>

            {/* Assistant Tab */}
            <TabsContent value="assistant" className="space-y-0">
              <div className="w-full h-[700px] rounded-lg overflow-hidden border border-gray-200">
                <iframe 
                  src={`${window.location.origin}/servicequote?user=${encodeURIComponent(userEmail)}`}
                  width="100%" 
                  height="100%" 
                  frameBorder="0" 
                  style={{ border: 'none' }}
                  title="Quote Assistant"
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  // Default view for non-service providers
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Profile Header */}
          <Card className="p-8 mb-8 bg-white shadow-xl">
            <div className="flex flex-col md:flex-row gap-6">
              {displayPhoto ? (
                <img
                  src={displayPhoto}
                  alt={displayName}
                  className={`${isBusinessProfile ? 'w-32 h-32 rounded-lg' : 'w-32 h-32 rounded-full'} object-cover`}
                />
              ) : (
                <div className={`w-32 h-32 bg-[#1e3a5f] ${isBusinessProfile ? 'rounded-lg' : 'rounded-full'} flex items-center justify-center flex-shrink-0`}>
                  {isBusinessProfile ? <Briefcase className="w-16 h-16 text-white" /> : <User className="w-16 h-16 text-white" />}
                </div>
              )}
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-3xl font-bold text-[#1e3a5f]">{displayName}</h1>
                  {profileUser && (
                    <Badge variant="outline" className="capitalize">
                      {isBusinessProfile ? <Briefcase className="w-3 h-3 mr-1" /> : <User className="w-3 h-3 mr-1" />}
                    </Badge>
                  )}
                </div>
                
                {displayBio && (
                  <div className="text-gray-700 mb-4">
                    <p className="leading-relaxed">{stripHtml(displayBio)}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {profileUser?.business_address && isBusinessProfile && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{profileUser.business_address}</span>
                    </div>
                  )}
                  {displayPhone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <a href={`tel:${displayPhone}`} className="hover:text-[#1e3a5f]">
                        {displayPhone}
                      </a>
                    </div>
                  )}
                  {userEmail && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <a href={`mailto:${userEmail}`} className="hover:text-[#1e3a5f]">
                        {userEmail}
                      </a>
                    </div>
                  )}
                  {profileUser?.website_url && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Globe className="w-4 h-4" />
                      <a href={profileUser.website_url} target="_blank" rel="noopener noreferrer" className="hover:text-[#1e3a5f]">
                        Website
                      </a>
                    </div>
                  )}
                  {profileUser?.years_in_business > 0 && isBusinessProfile && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Award className="w-4 h-4" />
                      <span>{profileUser.years_in_business} years in business</span>
                    </div>
                  )}
                </div>

                {/* Social Links */}
                {profileUser?.social_links && Object.values(profileUser.social_links).some(v => v) && (
                  <div className="flex gap-3 mt-4">
                    {profileUser.social_links.facebook && (
                      <a href={profileUser.social_links.facebook} target="_blank" rel="noopener noreferrer">
                        <Button size="icon" variant="outline">
                          <Facebook className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                    {profileUser.social_links.instagram && (
                      <a href={profileUser.social_links.instagram} target="_blank" rel="noopener noreferrer">
                        <Button size="icon" variant="outline">
                          <Instagram className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                    {profileUser.social_links.linkedin && (
                      <a href={profileUser.social_links.linkedin} target="_blank" rel="noopener noreferrer">
                        <Button size="icon" variant="outline">
                          <Linkedin className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                    {profileUser.social_links.twitter && (
                      <a href={profileUser.social_links.twitter} target="_blank" rel="noopener noreferrer">
                        <Button size="icon" variant="outline">
                          <Twitter className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Service Areas */}
          {profileUser?.service_areas?.length > 0 && isBusinessProfile && (
            <Card className="p-6 mb-8">
              <h2 className="text-xl font-bold text-[#1e3a5f] mb-4">Service Areas</h2>
              <div className="flex flex-wrap gap-2">
                {profileUser.service_areas.map((area, index) => (
                  <Badge key={index} variant="outline" className="text-base px-4 py-2">
                    <MapPin className="w-4 h-4 mr-2" />
                    {area}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Certifications */}
          {profileUser?.certifications?.length > 0 && isBusinessProfile && (
            <Card className="p-6 mb-8">
              <h2 className="text-xl font-bold text-[#1e3a5f] mb-4">
                <Award className="w-5 h-5 inline mr-2" />
                Certifications & Licenses
              </h2>
              <ul className="space-y-2">
                {profileUser.certifications.map((cert, index) => (
                  <li key={index} className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    {cert}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Price List */}
          {profileUser?.price_list?.length > 0 && isBusinessProfile && (
            <Card className="p-6 mb-8">
              <h2 className="text-xl font-bold text-[#1e3a5f] mb-4">
                <DollarSign className="w-5 h-5 inline mr-2" />
                Price List
              </h2>
              <div className="space-y-3">
                {profileUser.price_list.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="font-medium text-gray-900">{item.description}</span>
                    <span className="text-xl font-bold text-[#d4af37]">${item.price}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Portfolio / Work Photos */}
          {profileUser?.work_photos?.length > 0 && isBusinessProfile && (
            <Card className="p-6 mb-8">
              <h2 className="text-xl font-bold text-[#1e3a5f] mb-4">
                <ImageIcon className="w-5 h-5 inline mr-2" />
                Portfolio
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {profileUser.work_photos.map((url, index) => (
                  <img 
                    key={index} 
                    src={url} 
                    alt={`Work ${index + 1}`} 
                    className="w-full h-48 object-cover rounded-lg hover:scale-105 transition-transform cursor-pointer"
                    onClick={() => window.open(url, '_blank')}
                  />
                ))}
              </div>
            </Card>
          )}

          {/* Services Offered */}
          {profileUser?.service_types?.length > 0 && isBusinessProfile && (
            <Card className="p-6 mb-8">
              <h2 className="text-xl font-bold text-[#1e3a5f] mb-4">Services Offered</h2>
              <div className="flex flex-wrap gap-2">
                {profileUser.service_types.map((type, idx) => (
                  <Badge key={idx} className="bg-[#d4af37] text-white text-base px-4 py-2">
                    {type}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Service Listings with Details */}
          {userServices.length > 0 && (
            <Card className="p-6 mb-8">
              <h2 className="text-xl font-bold text-[#1e3a5f] mb-6">Service Details</h2>
              <div className="space-y-8">
                {userServices.map((service) => {
                  const serviceReviews = getReviewsForService(service.id);
                  const avgRating = getAverageRating(service.id);
                  
                  return (
                    <div key={service.id} className="border-b pb-8 last:border-b-0 last:pb-0">
                      <div className="flex items-start gap-6 mb-6">
                        {service.photo_url && (
                          <img 
                            src={service.photo_url} 
                            alt={service.expert_name}
                            className="w-32 h-32 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-sm">{service.service_category}</Badge>
                            {service.is_verified && (
                              <Badge className="bg-blue-100 text-blue-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          <h3 className="text-2xl font-bold text-[#1e3a5f] mb-3">{service.expert_name}</h3>
                          
                          {/* Rating */}
                          <div className="flex items-center gap-4 mb-4">
                            <div className="flex items-center gap-2">
                              {[...Array(5)].map((_, i) => (
                                <Award key={i} className={`w-5 h-5 ${i < Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-300'}`} />
                              ))}
                            </div>
                            <span className="text-lg font-semibold text-gray-700">
                              {avgRating > 0 ? avgRating.toFixed(1) : 'No reviews'}
                            </span>
                            <span className="text-sm text-gray-500">
                              ({serviceReviews.length} review{serviceReviews.length !== 1 ? 's' : ''})
                            </span>
                          </div>

                          <div 
                            className="text-gray-700 mb-4 leading-relaxed prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: service.description }}
                          />
                          
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                            {service.service_area && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {service.service_area}
                              </span>
                            )}
                            {service.years_experience > 0 && (
                              <span className="flex items-center gap-1">
                                <Award className="w-4 h-4" />
                                {service.years_experience} years experience
                              </span>
                            )}
                            {service.hourly_rate > 0 && (
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                ${service.hourly_rate}/hour
                              </span>
                            )}
                          </div>

                          {service.certifications && (
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <p className="text-sm font-semibold text-gray-700 mb-2">Certifications & Licenses:</p>
                              <p className="text-sm text-gray-600">{service.certifications}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Reviews Section */}
                      {serviceReviews.length > 0 && (
                        <div className="mt-6 pt-6 border-t">
                          <h4 className="text-lg font-semibold text-[#1e3a5f] mb-4">
                            Customer Reviews ({serviceReviews.length})
                          </h4>
                          <div className="space-y-4">
                            {serviceReviews.slice(0, 5).map((review) => (
                              <Card key={review.id} className="p-4 bg-gray-50">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <p className="font-semibold text-gray-900">{review.reviewer_name}</p>
                                    <div className="flex items-center gap-1 mt-1">
                                      {[...Array(5)].map((_, i) => (
                                        <Award key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-300'}`} />
                                      ))}
                                    </div>
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {new Date(review.created_date).toLocaleDateString()}
                                  </span>
                                </div>
                                {review.review_text && (
                                  <p className="text-gray-700 text-sm mt-3">{review.review_text}</p>
                                )}
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Contact Buttons */}
                      <div className="flex gap-3 mt-6">
                        {displayPhone && (
                          <Button asChild className="bg-[#1e3a5f] hover:bg-[#2a4a7f]">
                            <a href={`tel:${displayPhone}`}>
                              <Phone className="w-4 h-4 mr-2" />
                              Call Now
                            </a>
                          </Button>
                        )}
                        <Button asChild variant="outline">
                          <a href={`mailto:${service.expert_email}`}>
                            <Mail className="w-4 h-4 mr-2" />
                            Send Email
                          </a>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* AI Quote Assistant Widget - Only for Business Profiles */}
          {isBusinessProfile && profileUser?.business_name && (
            <Card className="p-6 mb-8">
              <h2 className="text-xl font-bold text-[#1e3a5f] mb-4">Get an Instant Quote</h2>
              <p className="text-gray-600 mb-4">
                Chat with our AI assistant to get a personalized quote for your project.
              </p>
              <iframe 
                src={`${window.location.origin}/servicequote?name=${encodeURIComponent(profileUser.business_name)}`}
                width="100%" 
                height="600" 
                frameBorder="0" 
                style={{ border: '1px solid #e5e7eb', borderRadius: '8px' }}
                title="Quote Assistant"
              />
            </Card>
          )}

          {/* Active Deals */}
          {userDeals.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-bold text-[#1e3a5f] mb-4">Active Listings</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {userDeals.map((deal) => (
                  <Card key={deal.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    {deal.photo_urls?.length > 0 && (
                      <img src={deal.photo_urls[0]} alt={deal.title} className="w-full h-32 object-cover" />
                    )}
                    <div className="p-4">
                      <h3 className="font-bold text-[#1e3a5f] mb-2 line-clamp-1">{deal.title}</h3>
                      <p className="text-lg font-bold text-[#d4af37] mb-2">${deal.price.toLocaleString()}</p>
                      <p className="text-sm text-gray-600 line-clamp-1">{deal.location}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}