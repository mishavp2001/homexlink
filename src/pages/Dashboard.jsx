import React, { useEffect, useState } from 'react';
import { base44, getCurrentUserProfile, redirectToAppLogin, updateCurrentUserProfile } from '@/api/base44Client';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plus, Home, Loader2, Wrench, DollarSign, Edit2, MapPin, Calendar, User, Mail, Phone, CalendarIcon, Users, CheckCircle2, Heart, ExternalLink, FileText, XCircle, Sparkles, Trash2, Printer, Lightbulb } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import PropertyCard from '../components/Dashboard/PropertyCard';
import Navigation from '../components/Navigation';
import BusinessProfileModal from '../components/Dashboard/BusinessProfileModal';
import { format } from 'date-fns';
import PullToRefresh from 'react-simple-pull-to-refresh';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [serviceListing, setServiceListing] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [showBusinessProfileModal, setShowBusinessProfileModal] = useState(false);
  const [revaluatingProperties, setRevaluatingProperties] = React.useState({});

  useEffect(() => {
    // Track Dashboard page view conversion
    if (window.gtag) {
      window.gtag('event', 'conversion', {'send_to': 'AW-17861560470/j_7uCPz-h-YbEJaRh8VC'});
    }

    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUserProfile();
        setUser(currentUser);
        
        // Check for pending user data and auto-convert to Property/MaintenanceTask
        try {
          const pendingUsers = await base44.entities.PendingUser.filter({ 
            email: currentUser.email.toLowerCase().trim(), 
            status: 'pending' 
          });
          
          if (pendingUsers && pendingUsers.length > 0) {
            const pendingUser = pendingUsers[0];

            // Update pending user with linked email
            await base44.entities.PendingUser.update(pendingUser.id, {
              linked_user_email: currentUser.email,
              status: 'linked'
            });

            // Process based on user type
            if (pendingUser.user_type === 'service_provider' && pendingUser.service_listing) {
              // Update user type and clear business fields from User.data (they belong in ServiceListing)
              await updateCurrentUserProfile({ 
                user_type: 'service_provider',
                business_name: null,
                business_address: null,
                business_phone: null,
                business_photo_url: null
              });

              // Check if ServiceListing already exists
              const existingListings = await base44.entities.ServiceListing.filter({
                expert_email: currentUser.email
              });

              const listingData = {
                business_name: pendingUser.service_listing.business_name,
                business_address: pendingUser.service_listing.business_address,
                business_phone: pendingUser.service_listing.business_phone || pendingUser.phone,
                service_types: pendingUser.service_listing.service_types || [],
                is_verified: pendingUser.service_listing.is_verified || true,
                status: 'active'
              };

              if (existingListings.length > 0) {
                // Update existing ServiceListing
                await base44.entities.ServiceListing.update(existingListings[0].id, listingData);
              } else {
                // Create new ServiceListing
                await base44.entities.ServiceListing.create({
                  expert_email: currentUser.email,
                  ...listingData
                });
              }

              // Delete pending user record
              await base44.entities.PendingUser.delete(pendingUser.id);

              // Reload to show service provider dashboard
              window.location.reload();
            } else if (pendingUser.user_type === 'homeowner' && pendingUser.project) {
              // Update user type
              await updateCurrentUserProfile({ user_type: 'homeowner' });
              
              // Create property
              const property = await base44.entities.Property.create({
                address: pendingUser.project.address,
                user_email: currentUser.email,
                user_phone: pendingUser.phone || '',
                status: 'completed'
              });

              // Create maintenance task
              await base44.entities.MaintenanceTask.create({
                property_id: property.id,
                project_title: pendingUser.project.project_title,
                project_description: pendingUser.project.project_description,
                project_type: pendingUser.project.project_type,
                component_type: pendingUser.project.component_type,
                urgency: pendingUser.project.urgency || 'medium',
                preferred_timeline: pendingUser.project.preferred_timeline || '',
                budget_range: pendingUser.project.budget_range || '',
                photo_urls: pendingUser.project.photo_urls || [],
                status: 'open'
              });

              // Delete pending user record
              await base44.entities.PendingUser.delete(pendingUser.id);
              
              // Reload to show properties tab
              window.location.reload();
              }
          }
        } catch (err) {
          console.error('Error converting pending user:', err);
        }
        
        // Check if coming from pro signup flow
        const urlParams = new URLSearchParams(window.location.search);
        const isBusinessSetup = urlParams.get('setup') === 'business';
        const proSignupFlow = localStorage.getItem('proSignupFlow');
        
        if ((isBusinessSetup || proSignupFlow) && (!currentUser.business_name || !currentUser.service_types || currentUser.service_types.length === 0)) {
          setShowBusinessProfileModal(true);
        }
        
        // Clean up URL
        if (isBusinessSetup) {
          window.history.replaceState({}, '', createPageUrl('Dashboard'));
        }
        
        // Fetch ServiceListing for service providers
        if (currentUser.user_type === 'service_provider') {
          try {
            const listings = await base44.entities.ServiceListing.filter({
              expert_email: currentUser.email
            });
            if (listings.length > 0) {
              setServiceListing(listings[0]);
            }
          } catch (error) {
            console.error('Error fetching service listing:', error);
          }
        }
      } catch (error) {
        console.error('Not authenticated', error);
        const dashboardUrl = window.location.origin + createPageUrl('Dashboard');
        void redirectToAppLogin(dashboardUrl);
      }
      setLoadingAuth(false);
    };
    loadUser();
  }, []);

  const { data: properties, isLoading: loadingProperties } = useQuery({
    queryKey: ['properties', user?.email],
    queryFn: () => user ? base44.entities.Property.filter({ user_email: user.email }, '-created_date') : [],
    enabled: !!user,
    initialData: []
  });

  const { data: maintenanceTasks, isLoading: loadingTasks } = useQuery({
    queryKey: ['maintenanceTasks', user?.email],
    queryFn: async () => {
      if (!user) return [];
      const tasks = await base44.entities.MaintenanceTask.list();
      return tasks.filter(t => properties.some(p => p.id === t.property_id));
    },
    enabled: !!user && properties.length > 0,
    initialData: []
  });

  const { data: allReports } = useQuery({
    queryKey: ['reports', properties],
    queryFn: async () => {
      if (!properties || properties.length === 0) return [];
      const reports = await base44.entities.Report.list();
      return reports;
    },
    enabled: !!properties && properties.length > 0,
    initialData: []
  });



  const { data: myDeals, isLoading: loadingDeals } = useQuery({
    queryKey: ['myDeals', user?.email],
    queryFn: () => user ? base44.entities.Deal.filter({ user_email: user.email }, '-created_date') : [],
    enabled: !!user,
    initialData: []
  });

  const { data: receivedBookings, isLoading: loadingReceivedBookings } = useQuery({
    queryKey: ['receivedBookings', user?.email],
    queryFn: () => user ? base44.entities.Booking.filter({ owner_email: user.email }, '-created_date') : [],
    enabled: !!user,
    initialData: []
  });

  const { data: sentBookings, isLoading: loadingSentBookings } = useQuery({
    queryKey: ['sentBookings', user?.email],
    queryFn: () => user ? base44.entities.Booking.filter({ renter_email: user.email }, '-created_date') : [],
    enabled: !!user,
    initialData: []
  });

  const { data: savedDeals, isLoading: loadingSavedDeals } = useQuery({
    queryKey: ['savedDeals', user?.email],
    queryFn: () => user ? base44.entities.SavedDeal.filter({ user_email: user.email }, '-created_date') : [],
    enabled: !!user,
    initialData: []
  });

  const { data: myInsights, isLoading: loadingInsights } = useQuery({
    queryKey: ['myInsights', user?.email],
    queryFn: () => user ? base44.entities.Insight.filter({ created_by: user.email }, '-created_date') : [],
    enabled: !!user,
    initialData: []
  });

  const { data: sentOffers, isLoading: loadingSentOffers } = useQuery({
    queryKey: ['sentOffers', user?.email],
    queryFn: () => user ? base44.entities.Offer.filter({ buyer_email: user.email }, '-created_date') : [],
    enabled: !!user,
    initialData: []
  });

  const { data: receivedOffers, isLoading: loadingReceivedOffers } = useQuery({
    queryKey: ['receivedOffers', user?.email],
    queryFn: () => user ? base44.entities.Offer.filter({ seller_email: user.email }, '-created_date') : [],
    enabled: !!user,
    initialData: []
  });

  const queryClient = useQueryClient();
  const [generatingRecommendations, setGeneratingRecommendations] = React.useState({});

  const generateRecommendationsMutation = useMutation({
    mutationFn: async ({ taskId, task }) => {
      const prompt = `You are a home maintenance expert. Analyze this maintenance project and provide detailed recommendations.

PROJECT DETAILS:
- Title: ${task.project_title}
- Description: ${task.project_description}
- Component Type: ${task.component_type || 'N/A'}
- Project Type: ${task.project_type}
- Urgency: ${task.urgency}
- Budget Range: ${task.budget_range || 'Not specified'}
- Timeline: ${task.preferred_timeline || 'Not specified'}

Provide comprehensive recommendations including:
1. Recommended approach and best practices
2. Estimated timeline and phases
3. Key considerations and potential issues
4. Cost-saving tips
5. Quality materials/contractors to look for
6. Safety considerations

Format your response as structured JSON with these sections.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            approach: { type: "string" },
            timeline: { type: "string" },
            considerations: { type: "string" },
            cost_tips: { type: "string" },
            quality_guidelines: { type: "string" },
            safety: { type: "string" }
          }
        }
      });

      await base44.entities.MaintenanceTask.update(taskId, {
        ai_recommendations: response,
        recommendations_generated_date: new Date().toISOString()
      });

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['maintenanceTasks']);
    }
  });

  const handleGenerateRecommendations = async (task) => {
    setGeneratingRecommendations(prev => ({ ...prev, [task.id]: true }));
    try {
      await generateRecommendationsMutation.mutateAsync({ taskId: task.id, task });
    } finally {
      setGeneratingRecommendations(prev => ({ ...prev, [task.id]: false }));
    }
  };

  const handleRevaluateProperty = async (property) => {
    setRevaluatingProperties(prev => ({ ...prev, [property.id]: true }));
    try {
      const prompt = `Analyze this property and provide comprehensive investment insights:

PROPERTY DETAILS:
- Address: ${property.address}
- Type: ${property.property_type}
- Size: ${property.sqft} sqft
- Bedrooms: ${property.bedrooms}
- Bathrooms: ${property.bathrooms}
- Year Built: ${property.year_built}
- Appraised Value: $${property.appraised_value}
- Classification: ${property.property_classification}
${property.investment_type ? `- Investment Type: ${property.investment_type}` : ''}

Provide detailed analysis including:
1. Current market trends for this property type and location
2. ROI projections for 1, 5, and 10 years
3. Investment risks with severity levels
4. Investment opportunities
5. Comparable properties analysis
6. Value drivers
7. Maintenance priorities with costs and urgency

Format as structured JSON.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            market_trends: { type: "string" },
            roi_projection: {
              type: "object",
              properties: {
                one_year: { type: "number" },
                five_year: { type: "number" },
                ten_year: { type: "number" }
              }
            },
            investment_risks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  risk_type: { type: "string" },
                  severity: { type: "string" },
                  description: { type: "string" }
                }
              }
            },
            investment_opportunities: {
              type: "array",
              items: { type: "string" }
            },
            comparable_properties: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  address: { type: "string" },
                  price: { type: "number" },
                  sqft: { type: "number" },
                  similarity_score: { type: "number" }
                }
              }
            },
            value_drivers: {
              type: "array",
              items: { type: "string" }
            },
            maintenance_priorities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  priority: { type: "string" },
                  item: { type: "string" },
                  estimated_cost: { type: "number" },
                  urgency: { type: "string" }
                }
              }
            }
          }
        }
      });

      await base44.entities.Property.update(property.id, {
        ai_insights: response
      });

      queryClient.invalidateQueries(['properties']);
      alert('AI insights generated successfully!');
    } catch (error) {
      console.error('Failed to generate AI insights:', error);
      alert('Failed to generate AI insights. Please try again.');
    } finally {
      setRevaluatingProperties(prev => ({ ...prev, [property.id]: false }));
    }
  };

  const updateBookingMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Booking.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['receivedBookings']);
      queryClient.invalidateQueries(['sentBookings']);
    }
  });

  const deleteSavedDealMutation = useMutation({
    mutationFn: (id) => base44.entities.SavedDeal.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['savedDeals']);
    }
  });

  const deleteDealMutation = useMutation({
    mutationFn: (id) => base44.entities.Deal.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['myDeals']);
    }
  });

  const deleteInsightMutation = useMutation({
    mutationFn: (id) => base44.entities.Insight.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['myInsights']);
    }
  });

  const deletePropertyMutation = useMutation({
    mutationFn: (id) => base44.entities.Property.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['properties']);
    }
  });

  const deleteMaintenanceTaskMutation = useMutation({
    mutationFn: (id) => base44.entities.MaintenanceTask.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['maintenanceTasks']);
    }
  });

  const deleteBookingMutation = useMutation({
    mutationFn: (id) => base44.entities.Booking.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['receivedBookings']);
      queryClient.invalidateQueries(['sentBookings']);
    }
  });

  const deleteOfferMutation = useMutation({
    mutationFn: (id) => base44.entities.Offer.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['receivedOffers']);
      queryClient.invalidateQueries(['sentOffers']);
    }
  });

  const updateOfferMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Offer.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['receivedOffers']);
      queryClient.invalidateQueries(['sentOffers']);
    }
  });

  const handleBookingAction = (booking, status, response = '') => {
    updateBookingMutation.mutate({
      id: booking.id,
      data: {
        status,
        owner_response: response,
        confirmed_date: status === 'confirmed' ? new Date().toISOString() : null
      }
    });

    if (status === 'confirmed' || status === 'rejected') {
      base44.functions.invoke('sendEmail', {
        to: booking.renter_email,
        subject: `Booking Request ${status === 'confirmed' ? 'Confirmed' : 'Declined'} - ${booking.property_address}`,
        html: `
          <h1>Booking Update</h1>
          <p>Your booking request for <strong>${booking.property_address}</strong> has been ${status}.</p>
          ${response ? `<p><strong>Owner Response:</strong> ${response}</p>` : ''}
          <p>Please log in to your dashboard for more details.</p>
        `
      }).catch(err => console.error('Failed to send booking email', err));
    }
  };

  const handleOfferAction = async (offer, status) => {
    let response = '';

    if (status === 'rejected') {
      response = prompt('Reason for rejection (optional):');
      if (response === null) return;
    } else if (status === 'countered') {
      const counterAmountStr = prompt(`Current offer: $${offer.offer_amount.toLocaleString()}\n\nEnter your counter offer amount:`);
      if (!counterAmountStr) return;
      const counterAmount = parseFloat(counterAmountStr);
      if (isNaN(counterAmount) || counterAmount <= 0) {
        alert('Please enter a valid positive number for the counter offer.');
        return;
      }

      const counterTerms = prompt('Any additional counter terms? (optional)');

      updateOfferMutation.mutate({
        id: offer.id,
        data: {
          status: 'countered',
          counter_offer_amount: counterAmount,
          counter_offer_terms: counterTerms || '',
          seller_response: `Counter offer: $${counterAmount.toLocaleString()}`
        }
      });
      return;
    }

    updateOfferMutation.mutate({
      id: offer.id,
      data: {
        status,
        seller_response: response || (status === 'accepted' ? 'Offer accepted!' : ''),
        accepted_date: status === 'accepted' ? new Date().toISOString() : null
      }
    });

    if (status === 'accepted' || status === 'rejected') {
      try {
        await base44.entities.Message.create({
          sender_email: user.email,
          sender_name: user.full_name || user.email,
          recipient_email: offer.buyer_email,
          recipient_name: offer.buyer_name,
          subject: `Offer ${status === 'accepted' ? 'Accepted' : 'Rejected'} - ${offer.property_address}`,
          content: `Your offer of $${offer.offer_amount.toLocaleString()} for ${offer.property_address} has been ${status}.\n\n${response || ''}`,
          thread_id: `offer_${offer.id}_${Date.now()}`,
          reference_type: 'deal',
          reference_id: offer.deal_id,
          is_read: false
        });

        await base44.functions.invoke('sendEmail', {
          to: offer.buyer_email,
          subject: `Offer ${status === 'accepted' ? 'Accepted' : 'Rejected'} - ${offer.property_address}`,
          html: `
            <h1>Offer Update</h1>
            <p>Your offer of <strong>$${offer.offer_amount.toLocaleString()}</strong> for <strong>${offer.property_address}</strong> has been ${status}.</p>
            ${response ? `<p><strong>Seller Response:</strong> ${response}</p>` : ''}
            <p>Please log in to your dashboard to view details.</p>
          `
        });
      } catch (error) {
        console.error('Failed to send notification:', error);
      }
    }
  };

  const handleUnsave = (savedDealId) => {
    if (confirm('Remove this deal from your saved list?')) {
      deleteSavedDealMutation.mutate(savedDealId);
    }
  };

  const getPublicDealUrl = (deal) => {
    const encodedAddress = encodeURIComponent(deal.deal_location);

    if (deal.deal_type === 'sale') {
      return `/sale?address=${encodedAddress}`;
    } else if (deal.deal_type === 'long_term_rent') {
      return `/rent?address=${encodedAddress}`;
    } else if (deal.deal_type === 'short_term_rent') {
      return `/airbnb?address=${encodedAddress}`;
    }
    return createPageUrl(`Deals#deal-${deal.deal_id}`);
  };

  const getPropertyReports = (propertyId) => {
    if (!allReports) return [];
    return allReports.filter((r) => r.property_id === propertyId);
  };

  const getDealTypeLabel = (dealType) => {
    switch (dealType) {
      case 'sale': return 'Property Sale';
      case 'long_term_rent': return 'Long-Term Rent';
      case 'short_term_rent': return 'Airbnb';
      case 'service_deal': return 'Service Deal';
      default: return dealType?.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) || 'Deal';
    }
  };

  const getDealTypeColor = (dealType) => {
    switch (dealType) {
      case 'sale': return 'bg-[#1e3a5f] text-white';
      case 'long_term_rent': return 'bg-blue-600 text-white';
      case 'short_term_rent': return 'bg-purple-600 text-white';
      default: return 'bg-[#d4af37] text-white';
    }
  };

  const canPostDeals = properties.length > 0 || user?.user_type === 'service_provider';

  if (loadingAuth || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#1e3a5f] mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries(['properties']),
      queryClient.invalidateQueries(['maintenanceTasks']),
      queryClient.invalidateQueries(['myDeals']),
      queryClient.invalidateQueries(['receivedBookings']),
      queryClient.invalidateQueries(['sentBookings']),
      queryClient.invalidateQueries(['savedDeals']),
      queryClient.invalidateQueries(['myInsights']),
      queryClient.invalidateQueries(['sentOffers']),
      queryClient.invalidateQueries(['receivedOffers'])
    ]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 pb-20" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <Navigation user={user} />
      
      <BusinessProfileModal
        isOpen={showBusinessProfileModal}
        onClose={() => {
          setShowBusinessProfileModal(false);
          localStorage.removeItem('proSignupFlow');
        }}
        onComplete={() => {
          setShowBusinessProfileModal(false);
          window.location.reload();
        }}
      />
      
      <PullToRefresh onRefresh={handleRefresh} className="w-full">
        <div className="py-8 px-4">
          <div className="max-w-7xl mx-auto">

          <Tabs defaultValue={user.user_type === 'service_provider' ? 'deals' : 'properties'} className="w-full">
            <TabsList className={`grid w-full mb-8 h-auto ${user.user_type === 'service_provider' ? 'grid-cols-3' : 'grid-cols-3'}`}>
              {user.user_type !== 'service_provider' && <TabsTrigger value="properties">My Properties</TabsTrigger>}
              <TabsTrigger value="deals">Deals</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
              {user.user_type === 'service_provider' && <TabsTrigger value="bookings">Bookings</TabsTrigger>}
            </TabsList>

            {/* HOMEOWNER PROPERTIES TAB */}
            {user.user_type !== 'service_provider' && (
              <TabsContent value="properties">
              {loadingProperties ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-12 h-12 animate-spin text-[#1e3a5f]" />
                </div>
              ) : properties.length === 0 ? (
                <Card className="p-12 text-center bg-white">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Home className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Properties Yet</h3>
                  <p className="text-gray-600 mb-6">Start by digitizing your first property</p>
                  <Link to={createPageUrl('PropertyCapture')}>
                    <Button className="bg-[#1e3a5f] hover:bg-[#2a4a7f] text-white">
                      <Plus className="w-5 h-5 mr-2" />
                      Digitize Property
                    </Button>
                  </Link>
                </Card>
              ) : (
                <Accordion type="single" collapsible defaultValue="my-properties" className="space-y-4">
                  {/* My Properties Section */}
                  <AccordionItem value="my-properties" className="border rounded-lg bg-white">
                    <AccordionTrigger className="px-6 hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <Home className="w-5 h-5 text-[#1e3a5f]" />
                          <div className="text-left">
                            <p className="font-semibold text-[#1e3a5f]">My Properties</p>
                            <p className="text-sm text-gray-500">{properties.length} propert{properties.length !== 1 ? 'ies' : 'y'}</p>
                          </div>
                        </div>
                        <Link to={createPageUrl('PropertyCapture')} onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" className="bg-[#d4af37] hover:bg-[#c49d2a]">
                            <Plus className="w-4 h-4 mr-2" />
                            Add
                          </Button>
                        </Link>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6">
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                        {properties.map((property) => (
                          <PropertyCard
                            key={property.id}
                            property={property}
                            reports={getPropertyReports(property.id)}
                            onRevaluate={() => handleRevaluateProperty(property)}
                            isRevaluating={revaluatingProperties[property.id]}
                            onDelete={() => deletePropertyMutation.mutate(property.id)}
                          />
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Maintenance Projects Section */}
                  <AccordionItem value="maintenance" className="border rounded-lg bg-white">
                    <AccordionTrigger className="px-6 hover:no-underline">
                      <div className="flex items-center gap-3">
                        <Wrench className="w-5 h-5 text-[#1e3a5f]" />
                        <div className="text-left">
                          <p className="font-semibold text-[#1e3a5f]">Maintenance Projects</p>
                          <p className="text-sm text-gray-500">{maintenanceTasks.length} project{maintenanceTasks.length !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6">
                      <div className="mt-4">
                        {loadingTasks ? (
                          <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
                          </div>
                        ) : maintenanceTasks.length === 0 ? (
                          <Card className="p-8 text-center bg-gray-50">
                            <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600">No maintenance projects yet</p>
                          </Card>
                        ) : (
                          <Accordion type="single" collapsible defaultValue={properties[0]?.id} className="space-y-4">
                            {properties.map((property) => {
                              const propertyTasks = maintenanceTasks.filter(t => t.property_id === property.id);
                              if (propertyTasks.length === 0) return null;

                              return (
                                <AccordionItem key={property.id} value={property.id} className="border rounded-lg bg-white">
                                  <AccordionTrigger className="px-6 hover:no-underline">
                                    <div className="flex items-center gap-3">
                                      <Home className="w-5 h-5 text-[#1e3a5f]" />
                                      <div className="text-left">
                                        <p className="font-semibold text-[#1e3a5f]">{property.address}</p>
                                        <p className="text-sm text-gray-500">{propertyTasks.length} project{propertyTasks.length !== 1 ? 's' : ''}</p>
                                      </div>
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent className="px-6 pb-6">
                                    <div className="space-y-4 mt-4">
                                      {propertyTasks.map((task) => (
                                        <Card key={task.id} className="p-4 border-l-4 border-l-[#d4af37] relative">
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            className="absolute bottom-2 right-2 h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => {
                                              if (confirm('Delete this maintenance project?')) {
                                                deleteMaintenanceTaskMutation.mutate(task.id);
                                              }
                                            }}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                          <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                              <h4 className="font-semibold text-gray-900 mb-1">{task.project_title}</h4>
                                              <div className="flex flex-wrap gap-2 mb-2">
                                                <Badge variant="outline" className="capitalize">{task.component_type}</Badge>
                                                <Badge className={
                                                  task.urgency === 'urgent' ? 'bg-red-100 text-red-800' :
                                                  task.urgency === 'high' ? 'bg-orange-100 text-orange-800' :
                                                  task.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                  'bg-green-100 text-green-800'
                                                }>
                                                  {task.urgency}
                                                </Badge>
                                                <Badge className={
                                                  task.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                  task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                                  'bg-gray-100 text-gray-800'
                                                }>
                                                  {task.status.replace('_', ' ')}
                                                </Badge>
                                              </div>
                                              <p className="text-sm text-gray-600 mb-2">{task.project_description}</p>
                                              {task.budget_range && (
                                                <p className="text-sm text-gray-500">Budget: {task.budget_range}</p>
                                              )}
                                            </div>
                                          </div>

                                          {task.ai_recommendations ? (
                                            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                              <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                  <Sparkles className="w-4 h-4 text-blue-600" />
                                                  <p className="font-semibold text-blue-900">AI Recommendations</p>
                                                </div>
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  onClick={() => handleGenerateRecommendations(task)}
                                                  disabled={generatingRecommendations[task.id]}
                                                >
                                                  {generatingRecommendations[task.id] ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                  ) : (
                                                    'Regenerate'
                                                  )}
                                                </Button>
                                              </div>
                                              <div className="space-y-3 text-sm">
                                                {task.ai_recommendations.approach && (
                                                  <div>
                                                    <p className="font-medium text-gray-700 mb-1">Recommended Approach:</p>
                                                    <p className="text-gray-600">{task.ai_recommendations.approach}</p>
                                                  </div>
                                                )}
                                                {task.ai_recommendations.timeline && (
                                                  <div>
                                                    <p className="font-medium text-gray-700 mb-1">Timeline:</p>
                                                    <p className="text-gray-600">{task.ai_recommendations.timeline}</p>
                                                  </div>
                                                )}
                                                {task.ai_recommendations.considerations && (
                                                  <div>
                                                    <p className="font-medium text-gray-700 mb-1">Key Considerations:</p>
                                                    <p className="text-gray-600">{task.ai_recommendations.considerations}</p>
                                                  </div>
                                                )}
                                                {task.ai_recommendations.cost_tips && (
                                                  <div>
                                                    <p className="font-medium text-gray-700 mb-1">Cost-Saving Tips:</p>
                                                    <p className="text-gray-600">{task.ai_recommendations.cost_tips}</p>
                                                  </div>
                                                )}
                                                {task.ai_recommendations.safety && (
                                                  <div>
                                                    <p className="font-medium text-gray-700 mb-1">Safety:</p>
                                                    <p className="text-gray-600">{task.ai_recommendations.safety}</p>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          ) : (
                                            <Button
                                              size="sm"
                                              onClick={() => handleGenerateRecommendations(task)}
                                              disabled={generatingRecommendations[task.id]}
                                              className="mt-3 bg-[#d4af37] hover:bg-[#c49d2a]"
                                            >
                                              {generatingRecommendations[task.id] ? (
                                                <>
                                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                  Generating...
                                                </>
                                              ) : (
                                                <>
                                                  <Sparkles className="w-4 h-4 mr-2" />
                                                  Generate AI Recommendations
                                                </>
                                              )}
                                            </Button>
                                          )}
                                        </Card>
                                      ))}
                                    </div>
                                    </AccordionContent>
                                    </AccordionItem>
                                    );
                                    })}
                          </Accordion>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Bookings Section */}
                  <AccordionItem value="bookings" className="border rounded-lg bg-white">
                    <AccordionTrigger className="px-6 hover:no-underline">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-[#1e3a5f]" />
                        <div className="text-left">
                          <p className="font-semibold text-[#1e3a5f]">Bookings</p>
                          <p className="text-sm text-gray-500">
                            {receivedBookings.filter(b => b.status === 'pending').length} pending requests
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6">
                      <Tabs defaultValue="received" className="w-full mt-4">
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                          <TabsTrigger value="received">
                            Received
                            {receivedBookings.filter((b) => b.status === 'pending').length > 0 && (
                            <Badge className="ml-2 bg-red-500 text-white">
                                {receivedBookings.filter((b) => b.status === 'pending').length}
                              </Badge>
                            )}
                          </TabsTrigger>
                          <TabsTrigger value="sent">Sent</TabsTrigger>
                        </TabsList>

                        <TabsContent value="received">
                          {loadingReceivedBookings ? (
                            <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f] mx-auto" />
                          ) : receivedBookings.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No booking requests yet</p>
                          ) : (
                            <div className="grid md:grid-cols-2 gap-4">
                              {receivedBookings.map((booking) => (
                                <Card key={booking.id} className="p-4 relative">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="absolute bottom-2 right-2 h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => {
                                      if (confirm('Delete this booking?')) {
                                        deleteBookingMutation.mutate(booking.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                  <div className="flex justify-between mb-2">
                                    <h4 className="font-semibold text-[#1e3a5f]">{booking.property_address}</h4>
                                    <Badge className={
                                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                      booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                      'bg-red-100 text-red-800'
                                    }>
                                      {booking.status}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-2">{booking.renter_name}</p>
                                  <p className="text-lg font-bold text-[#d4af37]">${booking.total_cost.toLocaleString()}</p>
                                  {booking.status === 'pending' && (
                                    <div className="flex gap-2 mt-3">
                                      <Button size="sm" className="flex-1 bg-green-600" onClick={() => handleBookingAction(booking, 'confirmed', '')}>Accept</Button>
                                      <Button size="sm" variant="outline" className="flex-1" onClick={() => handleBookingAction(booking, 'rejected', '')}>Decline</Button>
                                    </div>
                                  )}
                                </Card>
                              ))}
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="sent">
                         {loadingSentBookings ? (
                           <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f] mx-auto" />
                         ) : sentBookings.length === 0 ? (
                           <p className="text-gray-500 text-center py-8">No booking requests sent yet</p>
                         ) : (
                           <div className="grid md:grid-cols-2 gap-4">
                             {sentBookings.map((booking) => (
                               <Card key={booking.id} className="p-4 relative">
                                 <Button
                                   size="icon"
                                   variant="ghost"
                                   className="absolute bottom-2 right-2 h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                   onClick={() => {
                                     if (confirm('Delete this booking?')) {
                                       deleteBookingMutation.mutate(booking.id);
                                     }
                                   }}
                                 >
                                   <Trash2 className="h-4 w-4" />
                                 </Button>
                                 <div className="flex justify-between mb-2">
                                   <h4 className="font-semibold text-[#1e3a5f]">{booking.property_address}</h4>
                                   <Badge className={
                                     booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                     booking.status === 'confirmed' || booking.status === 'paid' ? 'bg-green-100 text-green-800' :
                                     booking.status === 'redeemed' ? 'bg-purple-100 text-purple-800' :
                                     'bg-red-100 text-red-800'
                                   }>
                                     {booking.status}
                                   </Badge>
                                 </div>
                                 <p className="text-sm text-gray-600 mb-2">
                                   {booking.check_in_date ? format(new Date(booking.check_in_date), 'MMM d, yyyy') : 'Service booking'}
                                 </p>
                                 <p className="text-lg font-bold text-[#d4af37] mb-3">${booking.total_cost.toLocaleString()}</p>

                                 {booking.qr_code_url && booking.status === 'paid' && !booking.redeemed && (
                                   <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                     <p className="text-xs font-semibold text-green-800 mb-2">Your Redemption QR Code:</p>
                                     <img src={booking.qr_code_url} alt="QR Code" className="w-32 h-32 mx-auto mb-2" />
                                     <p className="text-xs text-green-700 text-center">Show this to the service provider</p>
                                   </div>
                                 )}

                                 {booking.redeemed && (
                                   <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                                     <p className="text-xs text-purple-800">
                                       ✓ Redeemed on {format(new Date(booking.redeemed_date), 'MMM d, yyyy h:mm a')}
                                     </p>
                                   </div>
                                 )}
                               </Card>
                             ))}
                           </div>
                         )}
                        </TabsContent>
                      </Tabs>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Offers Section */}
                  <AccordionItem value="offers" className="border rounded-lg bg-white">
                    <AccordionTrigger className="px-6 hover:no-underline">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-[#1e3a5f]" />
                        <div className="text-left">
                          <p className="font-semibold text-[#1e3a5f]">Purchase Offers</p>
                          <p className="text-sm text-gray-500">
                            {receivedOffers.filter(o => o.status === 'pending').length} pending offers
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6">
                      <Tabs defaultValue="received" className="w-full mt-4">
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                          <TabsTrigger value="received">
                            Received
                            {receivedOffers.filter(o => o.status === 'pending').length > 0 && (
                              <Badge className="ml-2 bg-red-500 text-white">
                                {receivedOffers.filter(o => o.status === 'pending').length}
                              </Badge>
                            )}
                          </TabsTrigger>
                          <TabsTrigger value="sent">Sent</TabsTrigger>
                        </TabsList>

                        <TabsContent value="received">
                          {loadingReceivedOffers ? (
                            <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f] mx-auto" />
                          ) : receivedOffers.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No offers received yet</p>
                          ) : (
                            <div className="grid md:grid-cols-2 gap-4">
                              {receivedOffers.map((offer) => (
                                <Card key={offer.id} className="p-4 relative">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="absolute bottom-2 right-2 h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => {
                                      if (confirm('Delete this offer?')) {
                                        deleteOfferMutation.mutate(offer.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                  <div className="flex justify-between mb-2">
                                    <h4 className="font-semibold text-[#1e3a5f]">{offer.property_address}</h4>
                                    <Badge className={
                                      offer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                      offer.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                      'bg-red-100 text-red-800'
                                    }>
                                      {offer.status}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-2">{offer.buyer_name}</p>
                                  <p className="text-2xl font-bold text-[#d4af37] mb-3">${offer.offer_amount.toLocaleString()}</p>
                                  {offer.status === 'pending' && (
                                    <div className="flex gap-2">
                                      <Button size="sm" className="flex-1 bg-green-600" onClick={() => handleOfferAction(offer, 'accepted')}>Accept</Button>
                                      <Button size="sm" variant="outline" className="flex-1" onClick={() => handleOfferAction(offer, 'countered')}>Counter</Button>
                                      <Button size="sm" variant="outline" className="flex-1 text-red-600" onClick={() => handleOfferAction(offer, 'rejected')}>Decline</Button>
                                    </div>
                                  )}
                                </Card>
                              ))}
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="sent">
                          {loadingSentOffers ? (
                            <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f] mx-auto" />
                          ) : sentOffers.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No offers sent yet</p>
                          ) : (
                            <div className="grid md:grid-cols-2 gap-4">
                              {sentOffers.map((offer) => (
                                <Card key={offer.id} className="p-4 relative">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="absolute bottom-2 right-2 h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => {
                                      if (confirm('Delete this offer?')) {
                                        deleteOfferMutation.mutate(offer.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                  <div className="flex justify-between mb-2">
                                    <h4 className="font-semibold text-[#1e3a5f]">{offer.property_address}</h4>
                                    <Badge className={
                                      offer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                      offer.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                      'bg-red-100 text-red-800'
                                    }>
                                      {offer.status}
                                    </Badge>
                                  </div>
                                  <p className="text-2xl font-bold text-[#d4af37] mb-2">${offer.offer_amount.toLocaleString()}</p>
                                  {offer.counter_offer_amount && (
                                    <p className="text-sm text-blue-600">Counter: ${offer.counter_offer_amount.toLocaleString()}</p>
                                  )}
                                </Card>
                              ))}
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </TabsContent>
            )}



            {/* DEALS TAB - For all users */}
            <TabsContent value="deals" className="space-y-12">
              {/* My Deals */}
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-[#1e3a5f]">My Deals</h2>
                  {canPostDeals ? (
                    <Link to={createPageUrl('EditDeal')}>
                        <Button className="bg-[#1e3a5f] hover:bg-[#2a4a7f] text-white">
                          <Plus className="w-5 h-5 mr-2" />
                          Post Deal
                        </Button>
                      </Link>
                  ) : (
                    <Button
                      disabled
                      className="bg-gray-300 cursor-not-allowed"
                      title="You need at least one property or service to post deals"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Post Deal
                    </Button>
                  )}
                </div>

                {!canPostDeals && (
                  <Card className="p-6 mb-6 bg-blue-50 border-2 border-blue-200">
                    <p className="text-sm text-blue-900">
                      💡 <strong>Get Started:</strong> To post deals, you need to either digitize a property or add a service listing first.
                    </p>
                  </Card>
                )}

                {loadingDeals ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
                  </div>
                ) : myDeals.length === 0 ? (
                  <Card className="p-12 text-center bg-white">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <DollarSign className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Deals Posted</h3>
                    <p className="text-gray-600 mb-6">
                      {canPostDeals ?
                        'Start advertising your properties or services by posting a deal' :
                        'Add a property or service first to start posting deals'}
                    </p>
                    {canPostDeals && (
                      <Link to={createPageUrl('EditDeal')}>
                          <Button className="bg-[#1e3a5f] hover:bg-[#2a4a7f] text-white">
                            <Plus className="w-5 h-5 mr-2" />
                            Post Deal
                          </Button>
                        </Link>
                    )}
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myDeals.map((deal) => (
                      <Card key={deal.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        {deal.photo_urls?.length > 0 && (
                          <div className="h-40 overflow-hidden relative">
                            <img
                              src={deal.photo_urls[0]}
                              alt={deal.title}
                              className="w-full h-full object-cover"
                            />
                            <Badge className={`absolute top-3 right-3 ${getDealTypeColor(deal.deal_type)}`}>
                              {getDealTypeLabel(deal.deal_type)}
                            </Badge>
                          </div>
                        )}
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-lg font-bold text-[#1e3a5f] line-clamp-1">{deal.title}</h3>
                            <Badge className={
                              deal.status === 'active' ? 'bg-green-100 text-green-800' :
                              deal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              ['sold', 'rented'].includes(deal.status) ? 'bg-gray-100 text-gray-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {deal.status}
                            </Badge>
                          </div>
                          <p className="text-2xl font-bold text-[#d4af37] mb-3">
                            {deal.deal_type === 'short_term_rent' && deal.price_per_night ?
                              `$${deal.price_per_night}/night` :
                              deal.deal_type === 'long_term_rent' ?
                              `$${deal.price.toLocaleString()}/mo` :
                              `$${deal.price.toLocaleString()}`
                            }
                          </p>
                          <div className="flex items-start gap-1 text-sm text-gray-500 mb-4">
                            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-1">{deal.location}</span>
                          </div>
                          <div className="flex gap-2">
                            <Link to={createPageUrl(`EditDeal?id=${deal.id}`)} className="flex-1">
                              <Button size="sm" className="w-full bg-[#1e3a5f] hover:bg-[#2a4a7f]">
                                <Edit2 className="w-4 h-4 mr-2" />
                                Edit
                              </Button>
                            </Link>
                            {['property_sales', 'long_term_rent', 'short_term_rent'].includes(deal.deal_type) && (
                              <Link to={createPageUrl(`PropertyLanding?id=${deal.id}&address=${encodeURIComponent(deal.location)}`)} target="_blank">
                                <Button size="sm" variant="outline" title="Print Flyer">
                                  <Printer className="w-4 h-4" />
                                </Button>
                              </Link>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(e) => {
                                e.preventDefault();
                                if (confirm('Are you sure you want to delete this deal?')) {
                                  deleteDealMutation.mutate(deal.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Saved Deals */}
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-[#1e3a5f]">Saved Deals</h2>
                    <p className="text-sm text-gray-600 mt-1">Deals you've saved for later</p>
                  </div>
                  <Link to={createPageUrl('Deals')}>
                    <Button variant="outline">
                      Browse More Deals
                    </Button>
                  </Link>
                </div>

                {loadingSavedDeals ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
                  </div>
                ) : savedDeals.length === 0 ? (
                  <Card className="p-12 text-center bg-white">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Heart className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Saved Deals</h3>
                    <p className="text-gray-600 mb-6">Start browsing and save deals you're interested in</p>
                    <Link to={createPageUrl('Deals')}>
                      <Button className="bg-[#1e3a5f] hover:bg-[#2a4a7f] text-white">
                        Browse Deals
                      </Button>
                    </Link>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedDeals.map((saved) => (
                      <Card key={saved.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        {saved.deal_photo_url && (
                          <div className="h-40 overflow-hidden relative">
                            <img
                              src={saved.deal_photo_url}
                              alt={saved.deal_title}
                              className="w-full h-full object-cover"
                            />
                            <Badge className={`absolute top-3 right-3 ${getDealTypeColor(saved.deal_type)}`}>
                              {getDealTypeLabel(saved.deal_type)}
                            </Badge>
                          </div>
                        )}
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-lg font-bold text-[#1e3a5f] line-clamp-1">{saved.deal_title}</h3>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleUnsave(saved.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 -mt-1 -mr-2"
                            >
                              <Heart className="w-5 h-5 fill-red-600" />
                            </Button>
                          </div>
                          <p className="text-2xl font-bold text-[#d4af37] mb-3">
                            ${saved.deal_price?.toLocaleString() || 'N/A'}
                          </p>
                          <div className="flex items-start gap-1 text-sm text-gray-500 mb-4">
                            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-1">{saved.deal_location}</span>
                          </div>
                          
                          {saved.notes && (
                            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                              <p className="text-xs text-gray-500 mb-1">Notes:</p>
                              <p className="text-sm text-gray-700">{saved.notes}</p>
                            </div>
                          )}

                          <div className="text-xs text-gray-500 mb-3">
                            Saved {format(new Date(saved.created_date), 'MMM d, yyyy')}
                          </div>

                          <Link to={getPublicDealUrl(saved)}>
                            <Button size="sm" className="w-full bg-[#1e3a5f] hover:bg-[#2a4a7f]">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View Deal
                            </Button>
                          </Link>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* INSIGHTS TAB - For all users */}
            <TabsContent value="insights">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-[#1e3a5f]">My Insights</h2>
                  <p className="text-sm text-gray-600 mt-1">Tips and knowledge you've shared</p>
                </div>
                <Link to={createPageUrl('EditInsight')}>
                  <Button className="bg-[#d4af37] hover:bg-[#c49d2a] text-white">
                    <Plus className="w-5 h-5 mr-2" />
                    Share New Insight
                  </Button>
                </Link>
              </div>

              {loadingInsights ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
                </div>
              ) : myInsights.length === 0 ? (
                <Card className="p-12 text-center bg-white">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Lightbulb className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Insights Shared Yet</h3>
                  <p className="text-gray-600 mb-6">Share your home maintenance tips and experiences with the community</p>
                  <Link to={createPageUrl('EditInsight')}>
                    <Button className="bg-[#d4af37] hover:bg-[#c49d2a] text-white">
                      <Plus className="w-5 h-5 mr-2" />
                      Share Your First Insight
                    </Button>
                  </Link>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myInsights.map((insight) => (
                    <Card key={insight.id} className="p-6 hover:shadow-lg transition-shadow">
                      {insight.photo_urls?.length > 0 && (
                        <div className="mb-4 -mx-6 -mt-6">
                          <img
                            src={insight.photo_urls[0]}
                            alt={insight.title}
                            className="w-full h-40 object-cover rounded-t-lg"
                          />
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline" className="capitalize text-xs">
                          {insight.category.replace('_', ' ')}
                        </Badge>
                        <Badge className={
                          insight.status === 'published' ? 'bg-green-100 text-green-800' :
                          insight.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {insight.status}
                        </Badge>
                        {insight.is_featured && (
                          <Badge className="bg-yellow-100 text-yellow-800">⭐ Featured</Badge>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-[#1e3a5f] mb-3 line-clamp-2">{insight.title}</h3>
                      <p className="text-gray-700 mb-4 line-clamp-3 text-sm">
                        {insight.content_text || (insight.content ? insight.content.replace(/<[^>]+>/g, '') : '')}
                      </p>

                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4 pt-4 border-t">
                        <span className="flex items-center gap-3">
                          <span>👁️ {insight.views}</span>
                          <span>❤️ {insight.likes}</span>
                        </span>
                        <span className="text-xs">
                          {format(new Date(insight.created_date), 'MMM d, yyyy')}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Link to={createPageUrl(`EditInsight?id=${insight.id}`)} className="flex-1">
                          <Button size="sm" variant="outline" className="w-full">
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.preventDefault();
                            if (confirm('Are you sure you want to delete this insight?')) {
                              deleteInsightMutation.mutate(insight.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* SERVICE PROVIDER BOOKINGS TAB */}
            {user.user_type === 'service_provider' && (
              <TabsContent value="bookings">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-[#1e3a5f]">Service Bookings</h2>
                </div>

                {loadingReceivedBookings ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
                  </div>
                ) : receivedBookings.length === 0 ? (
                  <Card className="p-12 text-center bg-white">
                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Service Bookings</h3>
                    <p className="text-gray-600">When someone books your services, it will appear here</p>
                  </Card>
                ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                      {receivedBookings.map((booking) => (
                        <Card key={booking.id} className="p-6 hover:shadow-lg transition-shadow relative">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="absolute bottom-2 right-2 h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => {
                              if (confirm('Delete this booking?')) {
                                deleteBookingMutation.mutate(booking.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-bold text-[#1e3a5f] mb-1">{booking.property_address}</h3>
                              <Badge className={
                                booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                booking.status === 'confirmed' || booking.status === 'paid' ? 'bg-green-100 text-green-800' :
                                booking.status === 'redeemed' ? 'bg-purple-100 text-purple-800' :
                                booking.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }>
                                {booking.status}
                              </Badge>
                            </div>
                            <Badge variant="outline" className="capitalize">
                              {booking.booking_type === 'deal_purchase' ? 'Deal' : booking.booking_type}
                            </Badge>
                          </div>

                          <div className="space-y-2 mb-4 text-sm">
                            <div className="flex items-center gap-2 text-gray-700">
                              <User className="w-4 h-4" />
                              <span>{booking.renter_name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700">
                              <Mail className="w-4 h-4" />
                              <span>{booking.renter_email}</span>
                            </div>
                            {booking.renter_phone && (
                              <div className="flex items-center gap-2 text-gray-700">
                                <Phone className="w-4 h-4" />
                                <span>{booking.renter_phone}</span>
                              </div>
                            )}
                            {booking.check_in_date && (
                              <div className="flex items-center gap-2 text-gray-700">
                                <CalendarIcon className="w-4 h-4" />
                                <span>
                                  {format(new Date(booking.check_in_date), 'MMM d, yyyy')}
                                  {booking.check_out_date && ` - ${format(new Date(booking.check_out_date), 'MMM d, yyyy')}`}
                                </span>
                              </div>
                            )}
                          </div>

                          {booking.message && (
                            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                              <p className="text-xs text-gray-500 mb-1">Message:</p>
                              <p className="text-sm text-gray-700">{booking.message}</p>
                            </div>
                          )}

                          <div className="pt-4 border-t">
                            <p className="text-2xl font-bold text-[#d4af37] mb-3">
                              ${booking.total_cost.toLocaleString()}
                            </p>

                            {booking.qr_code_url && (booking.status === 'paid' || booking.status === 'redeemed') && (
                              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-xs font-semibold text-blue-800 mb-2">QR Code for Redemption:</p>
                                <img src={booking.qr_code_url} alt="QR Code" className="w-32 h-32 mx-auto mb-2" />
                                {!booking.redeemed ? (
                                  <div className="space-y-2">
                                    <p className="text-xs text-blue-800 text-center">
                                      In-app redemption is temporarily unavailable during the platform migration.
                                    </p>
                                    <Button
                                      asChild
                                      size="sm"
                                      variant="outline"
                                      className="w-full border-blue-300 text-blue-800 hover:bg-blue-100"
                                    >
                                      <a
                                        href={`mailto:support@homexrei.com?subject=${encodeURIComponent(`Redemption request for booking ${booking.id}`)}&body=${encodeURIComponent(`Please mark this booking as redeemed.\n\nBooking ID: ${booking.id}\nProperty: ${booking.property_address}\nOwner: ${user?.email || ''}\nRenter: ${booking.renter_email || ''}`)}`}
                                      >
                                        Contact Support to Redeem
                                      </a>
                                    </Button>
                                  </div>
                                ) : (
                                  <p className="text-xs text-purple-800 text-center">
                                    ✓ Redeemed on {format(new Date(booking.redeemed_date), 'MMM d, h:mm a')}
                                  </p>
                                )}
                              </div>
                            )}
                            
                            {booking.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="flex-1 bg-green-600 hover:bg-green-700"
                                  onClick={() => handleBookingAction(booking, 'confirmed', 'Booking confirmed!')}
                                  disabled={updateBookingMutation.isLoading}
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-1" />
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 text-red-600 hover:bg-red-50"
                                  onClick={() => {
                                    const reason = prompt('Reason for rejection (optional):');
                                    handleBookingAction(booking, 'rejected', reason || 'Booking not available');
                                  }}
                                  disabled={updateBookingMutation.isLoading}
                                >
                                  Decline
                                </Button>
                              </div>
                            )}

                            {booking.status === 'confirmed' && (
                              <div className="text-center p-3 bg-green-50 rounded-lg">
                                <p className="text-sm text-green-800">✓ Confirmed on {format(new Date(booking.confirmed_date), 'MMM d, yyyy')}</p>
                              </div>
                            )}

                            {booking.status === 'rejected' && booking.owner_response && (
                              <div className="p-3 bg-red-50 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">Reason:</p>
                                <p className="text-sm text-red-800">{booking.owner_response}</p>
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
              </TabsContent>
            )}


          </Tabs>
        </div>
      </div>
      </PullToRefresh>
      

    </div>
  );
}