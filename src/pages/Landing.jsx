import React, { useState, useEffect, useCallback, useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { hasAuthenticatedUser, redirectToAppLogin } from '@/api/base44Client';
import { Category, PendingUser, Property } from '@/api/entities';
import { getLocationFromIP, searchGooglePlaces } from '@/api/functions';
import { InvokeLLM, UploadFile } from '@/api/integrations';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Home, Wrench, Lightbulb, TrendingUp, Users, Shield, ArrowRight, Menu, X, DollarSign, Sparkles, AlertTriangle, Loader2, LogIn, ChevronLeft, ChevronRight, ChevronDown, Circle, MessageSquare, Camera, Briefcase, User as UserIcon, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import StepIndicator from '../components/PropertyCapture/StepIndicator';
import PropertyInfoForm from '../components/PropertyCapture/PropertyInfoForm';
import ComponentUploader from '../components/PropertyCapture/ComponentUploader';
import ReviewAndGenerate from '../components/PropertyCapture/ReviewAndGenerate';
import HomeSearchCriteria from '../components/HomeBuyer/HomeSearchCriteria';
import HomeResults from '../components/HomeBuyer/HomeResults';
import ReviewSubmit from '../components/HomeBuyer/ReviewSubmit';
import { useAuth } from '@/components/lib/AuthContext';
import BenefitCarousel from '../components/Landing/BenefitCarousel';
import ChatWidget from '../components/ChatWidget';
import ClaimBusinessSection from '../components/Landing/ClaimBusinessSection';
import { Label } from '@/components/ui/label';
import { isMobileApp } from '@/components/MobileAuthHandler';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

export const isPublic = true;

const iconMap = {
  Home, Wrench, Lightbulb, TrendingUp, DollarSign, Circle
};

const DynamicIcon = ({ name, className }) => {
  const IconComponent = iconMap[name];
  if (IconComponent) {
    return <IconComponent className={className} />;
  }
  if (name && name.length < 5) {
    return <span className={className}>{name}</span>;
  }
  return <Circle className={className} />;
};

const HoverMenu = ({ trigger, children, isOpen, onOpenChange }) => {
  const timeoutRef = useRef(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    onOpenChange(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      onOpenChange(false);
    }, 150);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={onOpenChange} modal={false}>
      <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="h-full flex items-center">
        <DropdownMenuTrigger className="focus:outline-none h-full" asChild>
          {trigger}
        </DropdownMenuTrigger>
      </div>
      <DropdownMenuContent
        className="w-[800px] p-6"
        align="start"
        sideOffset={-1}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}>

        {children}
      </DropdownMenuContent>
    </DropdownMenu>);

};

export default function Landing() {
  const navigate = useNavigate();
  const { navigateToLogin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [manualAddress, setManualAddress] = useState('');
  const [showPropertyCaptureModal, setShowPropertyCaptureModal] = useState(false);
  const [captureAddress, setCaptureAddress] = useState('');
  const [dealsOpen, setDealsOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showQuoteResultModal, setShowQuoteResultModal] = useState(false);
  const [mode, setMode] = useState('digitize');
  const [showBenefits, setShowBenefits] = useState(false);
  const [projectDescription, setProjectDescription] = useState('');
  const [projectPhotos, setProjectPhotos] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [projectLocation, setProjectLocation] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('projectLocation') || '';
    }
    return '';
  });
  const [locationLoaded, setLocationLoaded] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState(null);
  const [identifiedProject, setIdentifiedProject] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [isFirstTimeBuyer, setIsFirstTimeBuyer] = useState(false);
  const [showHomeBuyerModal, setShowHomeBuyerModal] = useState(false);
  const [homeBuyerStep, setHomeBuyerStep] = useState(1);
  const [searchCriteria, setSearchCriteria] = useState(null);
  const [homeData, setHomeData] = useState(null);
  const [showAIAssistantModal, setShowAIAssistantModal] = useState(false);
  const [heroBg, setHeroBg] = useState("https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80");
  const [heroBgNext, setHeroBgNext] = useState(null);

  const handleBatchChange = (_batchIndex, newBg) => {
    if (newBg === heroBg) return;
    setHeroBgNext(newBg);
    setTimeout(() => { setHeroBg(newBg); setHeroBgNext(null); }, 900);
  };

  const domain = window.location.hostname.split('.')[0];
  let siteName;
  if (domain.toLowerCase().startsWith('homes') && domain.length > 5) {
    siteName = 'Homes' + domain.charAt(5).toUpperCase() + domain.slice(6);
  } else if (domain.toLowerCase().startsWith('home') && domain.length > 4) {
    siteName = 'Home' + domain.charAt(4).toUpperCase() + domain.slice(5);
  } else {
    siteName = domain.charAt(0).toUpperCase() + domain.slice(1);
  }
  //Override all
  siteName = 'HomeXLink';

  const handleStartWithAddress = () => {
    if (manualAddress.trim()) {
      setCaptureAddress(manualAddress.trim());
      setShowPropertyCaptureModal(true);
    }
  };

  const handleStartWithoutAddress = () => {
    setCaptureAddress('');
    setShowPropertyCaptureModal(true);
  };

  const handleLogin = async () => {
    const isAuth = await hasAuthenticatedUser();
    if (isAuth) {
      navigate(createPageUrl('Dashboard'));
      return;
    }
    navigateToLogin();
  };

  const handleSignUp = async () => {
    const isAuth = await hasAuthenticatedUser();
    if (isAuth) {
      navigate(createPageUrl('Dashboard'));
      return;
    }
    if (isMobileApp()) {
      const checkAuthAndRedirect = async () => {
        try {
            // For mobile app/webview, use /sign instead of /login
            const authRoute = '/sign';
            window.location.replace(window.location.origin + authRoute + '?next=' + encodeURIComponent(createPageUrl('Dashboard')));
        } catch (error) {
          const authRoute = '/sign';
          window.location.replace(window.location.origin + authRoute + '?next=' + encodeURIComponent(createPageUrl('Dashboard')));
        }
      };
      
      checkAuthAndRedirect();
    } else {
      //alert("Not mobile");
      const signupUrl = window.location.origin + createPageUrl('Dashboard') + '?signup=true';
      void redirectToAppLogin(signupUrl);
    }
  };

  const handleSaveLocation = (location) => {
    setProjectLocation(location);
    localStorage.setItem('projectLocation', location);
  };

  const handleGetPrice = async () => {
    if (!projectDescription.trim()) return;

    setLoadingPrice(true);
    setEstimatedPrice(null);
    setIdentifiedProject(null);

    try {
      // First, get AI analysis of the project
      const response = await InvokeLLM({
        prompt: `You are a home maintenance and construction expert. Analyze this project description and provide:
1. Cost estimate
2. Project classification
3. A clear project title
4. An enhanced description
5. The professional service category needed

Project Description: ${projectDescription}

Provide your response in this exact JSON format:
{
  "min_cost": <minimum cost as number>,
  "max_cost": <maximum cost as number>,
  "average_cost": <average cost as number>,
  "breakdown": "<brief explanation of what affects the cost>",
  "factors": ["<factor 1>", "<factor 2>", "<factor 3>"],
  "project_type": "<Repair, Replace, Install, or Upgrade>",
  "component_type": "<roof, hvac, plumbing, electrical, windows, flooring, painting, appliances, foundation, or other>",
  "project_title": "<clear, concise title for this project>",
  "enhanced_description": "<improved, detailed description of the work needed>",
  "service_category": "<the type of professional service needed, e.g., 'roofing contractor', 'plumber', 'electrician', 'hvac technician', 'general contractor', etc.>"
}`,
        response_json_schema: {
          type: "object",
          properties: {
            min_cost: { type: "number" },
            max_cost: { type: "number" },
            average_cost: { type: "number" },
            breakdown: { type: "string" },
            factors: { type: "array", items: { type: "string" } },
            project_type: { type: "string" },
            component_type: { type: "string" },
            project_title: { type: "string" },
            enhanced_description: { type: "string" },
            service_category: { type: "string" }
          }
        }
      });

      // If location is set, search for businesses using the AI-determined service category
      let placesResult = { places: [] };
      if (projectLocation.trim() && response.service_category) {
        try {
          const placesResponse = await searchGooglePlaces({
            query: `${response.service_category} ${projectLocation}`,
            location: projectLocation
          });
          placesResult = placesResponse.data;
        } catch (err) {
          console.error('Places search error:', err);
        }
      }

      setEstimatedPrice({
        ...response,
        businesses: placesResult?.places?.slice(0, 5) || []
      });
      setIdentifiedProject(response);
      setShowQuoteResultModal(true);
    } catch (error) {
      console.error('Failed to get price estimate:', error);
      alert('Failed to get price estimate. Please try again.');
    }

    setLoadingPrice(false);
  };

  const { data: dealCategories = [] } = useQuery({
    queryKey: ['dealCategories'],
    queryFn: () => Category.filter({ type: 'deal_type', is_active: true }),
    staleTime: 60000
  });

  const { data: serviceDealCategories = [] } = useQuery({
    queryKey: ['serviceDealCategories'],
    queryFn: () => Category.filter({ type: 'service_type', is_active: true }),
    staleTime: 60000
  });

  const { data: serviceCategories = [] } = useQuery({
    queryKey: ['serviceCategories'],
    queryFn: () => Category.filter({ type: 'service_type', is_active: true }),
    staleTime: 60000
  });

  const { data: insightCategories = [] } = useQuery({
    queryKey: ['insightCategories'],
    queryFn: () => Category.filter({ type: 'insight_type', is_active: true }),
    staleTime: 60000
  });

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center' });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    if (emblaApi) {
      const autoplay = setInterval(() => {
        emblaApi.scrollNext();
      }, 5000);
      return () => clearInterval(autoplay);
    }
  }, [emblaApi]);

 useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await hasAuthenticatedUser();
        if (isAuth) {
          navigate(createPageUrl('Dashboard'));
        }
      } catch (error) {
        // Not authenticated, stay on landing
      }
    };
    checkAuth();
  }, [navigate]);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowBenefits(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Auto-detect location from IP
  useEffect(() => {
    const loadLocationFromIP = async () => {
      // Only load if location is not already set and we haven't loaded yet
      if (projectLocation || locationLoaded) return;

      try {
        const response = await getLocationFromIP();
        if (response.data.success && response.data.location) {
          setProjectLocation(response.data.location);
          localStorage.setItem('projectLocation', response.data.location);
        }
      } catch (error) {
        console.error('Failed to get location from IP:', error);
      }
      setLocationLoaded(true);
    };

    loadLocationFromIP();
  }, [projectLocation, locationLoaded]);

  const features = [
  {
    title: "Deals",
    icon: <TrendingUp className="w-8 h-8 text-white" />,
    iconBg: "from-emerald-600 to-teal-700",
    description: "Find deals and connect with sellers and service providers instantly.",
    action: () => navigate(createPageUrl('Deals')),
    buttonText: "View Deals",
    highlight: false
  },
  {
    title: "Services",
    icon: <Wrench className="w-8 h-8 text-white" />,
    iconBg: "from-blue-600 to-blue-700",
    description: "Find trusted experts for your home projects.",
    action: () => navigate(createPageUrl('Services')),
    buttonText: "Find Experts",
    highlight: false
  },
  {
    title: "Insights",
    icon: <Lightbulb className="w-8 h-8 text-white" />,
    iconBg: "from-purple-600 to-indigo-700",
    description: "Discover tips, tricks, and best practices from the homeowner community.",
    action: () => navigate(createPageUrl('Insights')),
    buttonText: "Browse Insights",
    highlight: false
  },
  {
    title: "Manage",
    icon: <DollarSign className="w-8 h-8 text-white" />,
    iconBg: "from-yellow-500 to-amber-600",
    description: "Track income and expenses with AI driven maintenance recomendations with cost estimates.",
    action: handleSignUp,
    buttonText: "Get Started",
    highlight: true
  }];


  return (
     <div className="min-h-screen bg-white overflow-x-hidden" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Navigation - Centered Layout */}
      <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50 shadow-sm pt-safe">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center justify-between h-16">
            {/* Left - Public Links */}
            <div className="hidden md:flex items-center gap-6 h-full">
              <HoverMenu
                isOpen={dealsOpen}
                onOpenChange={setDealsOpen}
                trigger={
                <Link to={createPageUrl('Deals')} className="flex items-center gap-1 text-gray-700 hover:text-green-700 font-medium transition-colors">
                    Deals <ChevronDown className="w-4 h-4" />
                  </Link>
                }>

                <div className="grid grid-cols-3 gap-x-6 gap-y-4">
                  <div className="col-span-3 mb-2 border-b pb-2">
                    <Link to={`${createPageUrl('Deals')}?type=all`} className="font-bold text-lg text-[#1e3a5f] hover:text-[#d4af37] flex items-center gap-2">
                      View All Deals
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>

                  {/* Property Deal Types */}
                  {dealCategories.map((cat) => {
                    const dealTypeValue = cat.description || cat.name.toLowerCase().replace(/\s+/g, '_');
                    return (
                      <Link key={cat.id} to={`${createPageUrl('Deals')}?type=${dealTypeValue}`} className="group">
                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 transition-colors">
                          <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                            <DynamicIcon name={cat.icon || 'Home'} className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 group-hover:text-blue-700">{cat.name}</p>
                            {cat.description && <p className="text-xs text-gray-500 capitalize">{cat.description.replace(/_/g, ' ')}</p>}
                          </div>
                        </div>
                      </Link>);

                  })}

                  {/* Service Deal Types */}
                  {serviceDealCategories.length > 0 && serviceDealCategories.map((cat) =>
                  <Link key={cat.id} to={`${createPageUrl('Deals')}?serviceCategory=${encodeURIComponent(cat.name)}`} className="group">
                      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 transition-colors">
                        <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                          <DynamicIcon name={cat.icon || 'Wrench'} className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 group-hover:text-blue-700">{cat.name}</p>
                        </div>
                      </div>
                    </Link>
                  )}
                </div>
              </HoverMenu>

              <HoverMenu
                isOpen={servicesOpen}
                onOpenChange={setServicesOpen}
                trigger={
                <Link to={createPageUrl('Services')} className="flex items-center gap-1 text-gray-700 hover:text-green-700 font-medium transition-colors">
                    Services <ChevronDown className="w-4 h-4" />
                  </Link>
                }>

                <div className="grid grid-cols-4 gap-x-6 gap-y-4">
                  <div className="col-span-4 mb-2 border-b pb-2">
                    <Link to={createPageUrl('Services')} className="font-bold text-lg text-green-700 hover:text-green-800 flex items-center gap-2">
                      Find Professionals
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                  {serviceCategories.map((cat) =>
                  <Link key={cat.id} to={`${createPageUrl('Services')}?category=${cat.name}`} className="group">
                      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-green-50 transition-colors">
                        <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                          <DynamicIcon name={cat.icon || 'Wrench'} className="w-5 h-5 text-green-600" />
                        </div>
                        <span className="font-semibold text-gray-900 group-hover:text-green-700 text-sm">{cat.name}</span>
                      </div>
                    </Link>
                  )}
                </div>
              </HoverMenu>

              <HoverMenu
                isOpen={insightsOpen}
                onOpenChange={setInsightsOpen}
                trigger={
                <Link to={createPageUrl('Insights')} className="flex items-center gap-1 text-gray-700 hover:text-green-700 font-medium transition-colors">
                    Insights <ChevronDown className="w-4 h-4" />
                  </Link>
                }>

                <div className="grid grid-cols-4 gap-x-6 gap-y-4">
                  <div className="col-span-4 mb-2 border-b pb-2">
                    <Link to={createPageUrl('Insights')} className="font-bold text-lg text-green-700 hover:text-green-800 flex items-center gap-2">
                      Latest Insights
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                  {insightCategories.map((cat) =>
                  <Link key={cat.id} to={`${createPageUrl('Insights')}?category=${cat.name}`} className="group">
                      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-green-50 transition-colors">
                        <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                          <DynamicIcon name={cat.icon || 'Lightbulb'} className="w-5 h-5 text-green-600" />
                        </div>
                        <span className="font-semibold text-gray-900 group-hover:text-green-700 text-sm">{cat.name}</span>
                      </div>
                    </Link>
                  )}
                </div>
              </HoverMenu>
            </div>

            {/* Center - Logo & Brand */}
            <div className="flex items-center gap-2 absolute left-1/2 transform -translate-x-1/2">
              <Home className="w-7 h-7 text-slate-900" />
              <span className="text-2xl font-bold text-slate-900">{siteName}</span>
              <Button
                onClick={() => setChatOpen(true)}
                size="sm"
                variant="outline"
                className="ml-2 md:ml-3 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white">

                <MessageSquare className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">AI Assistant</span>
              </Button>
            </div>

            {/* Right - User Actions */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                to={createPageUrl('ProSignup')}
                className="hidden lg:block text-gray-600 hover:text-[#1e3a5f] font-medium transition-colors mr-2">

                Sign up as a Pro
              </Link>
              <Button
                variant="outline"
                className="border-green-600 text-green-700 hover:bg-green-50"
                onClick={() => {
                  if (window.gtag_report_conversion) {
                    window.gtag_report_conversion();
                  }
                  handleLogin();
                }}>
                Sign In
              </Button>
              <Button
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg"
                onClick={() => {
                  if (window.gtag_report_conversion) {
                    window.gtag_report_conversion();
                  }
                  handleSignUp();
                }}>
                Get Started
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden flex justify-between items-center h-16">
            <button
              className="p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <div className="flex items-center gap-2">
              <Home className="w-7 h-7 text-slate-900" />
              <span className="text-2xl font-bold text-slate-900">{siteName}</span>
            </div>

            <div className="w-10"></div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen &&
        <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-4 space-y-3">
              <Link
              to={createPageUrl('Deals')}
              className="block text-gray-700 hover:text-green-700 font-medium py-2">
                Deals
              </Link>
              <Link
              to={createPageUrl('Services')}
              className="block text-gray-700 hover:text-green-700 font-medium py-2">
                Services
              </Link>
              <Link
              to={createPageUrl('Insights')}
              className="block text-gray-700 hover:text-green-700 font-medium py-2">
                Insights
              </Link>
              <Link
              to={createPageUrl('ProSignup')}
              className="block text-gray-700 hover:text-[#1e3a5f] font-medium py-2">
                Sign up as a Pro
              </Link>
              <Button
              variant="outline"
              className="w-full border-green-600 text-green-700"
              onClick={() => {
                if (window.gtag_report_conversion) {
                  window.gtag_report_conversion();
                }
                handleLogin();
              }}>
                Sign In
              </Button>
              <Button
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
              onClick={() => {
                if (window.gtag_report_conversion) {
                  window.gtag_report_conversion();
                }
                handleSignUp();
              }}>
                Get Started
              </Button>
            </div>
          </div>
        }
      </nav>

      <Tabs defaultValue="homeowner" className="w-full">
      {/* Hero Section with Background - Darker with visible image */}
      <section
          className="relative text-white px-4 overflow-hidden min-h-screen pt-20 md:pt-24"
          style={{
            backgroundSize: 'cover',
            backgroundPosition: 'center bottom',
            backgroundAttachment: 'fixed',
            paddingTop: `max(40px, calc(40px + env(safe-area-inset-top, 0px)))`
          }}>
        {/* Base background */}
        <div className="absolute inset-0 transition-none" style={{ backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.50) 0%, rgba(0,0,0,0.40) 50%, rgba(0,0,0,0.60) 100%), url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center bottom', backgroundAttachment: 'fixed', zIndex: 0 }} />
        {/* Next background fading in */}
        {heroBgNext && (
          <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.50) 0%, rgba(0,0,0,0.40) 50%, rgba(0,0,0,0.60) 100%), url(${heroBgNext})`, backgroundSize: 'cover', backgroundPosition: 'center bottom', backgroundAttachment: 'fixed', zIndex: 1, animation: 'fadeInBg 0.9s ease forwards' }} />
        )}
        <style>{`@keyframes fadeInBg { from { opacity: 0; } to { opacity: 1; } }`}</style>

        <div className="max-w-7xl relative w-full mx-auto pb-20 md:pb-12" style={{ zIndex: 2 }}>
          <div className="text-center">
            <div
                className="transition-all duration-700 ease-out overflow-hidden"
                style={{
                  maxHeight: showBenefits ? '400px' : '0',
                  opacity: showBenefits ? 1 : 0,
                  marginTop: showBenefits ? '0' : '-20px'
                }}>

              <BenefitCarousel onBatchChange={handleBatchChange} />
            </div>
          </div>
          {/* Quick Start Content */}
          <div
              className="w-full max-w-3xl mx-auto space-y-4 relative z-20 transition-all duration-700 px-2"
              style={{
                marginTop: showBenefits ? '0' : '60px'
              }}>

            <Card className="bg-white/98 text-card-foreground px-4 py-4 rounded-xl backdrop-blur-md shadow-2xl border-2 border-white/50">
                <TabsList className="mx-auto my-1 p-1 px-1 py-1 bg-transparent ">
                <TabsTrigger
                    value="homeowner"
                    onClick={(e) => { const scrollY = window.scrollY; setTimeout(() => window.scrollTo({ top: scrollY, behavior: 'instant' }), 0); }}
                    className="text-white/80 my-3 px-3 py-3 text-base font-semibold rounded-none inline-flex items-center justify-center whitespace-nowrap ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-green-500 border-b-2 border-transparent hover:text-white">


                  Home Owner
                </TabsTrigger>
                <TabsTrigger
                    value="pro"
                    onClick={(e) => { const scrollY = window.scrollY; setTimeout(() => window.scrollTo({ top: scrollY, behavior: 'instant' }), 0); }}
                    className="text-white/80 px-3 py-3 text-base font-semibold rounded-none inline-flex items-center justify-center whitespace-nowrap ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-green-500 border-b-2 border-transparent hover:text-white">


                  Service Pro
                </TabsTrigger>
                <TabsTrigger
                    value="askai"
                    onClick={(e) => { const scrollY = window.scrollY; setTimeout(() => window.scrollTo({ top: scrollY, behavior: 'instant' }), 0); }}
                    className="text-white/80 px-3 py-3 text-base font-semibold rounded-none inline-flex items-center justify-center whitespace-nowrap ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-green-500 border-b-2 border-transparent hover:text-white">
                  <Sparkles className="w-4 h-4 mr-1" />
                  Ask AI
                </TabsTrigger>
              </TabsList>
              <TabsContent value="homeowner" className="mt-0">
                  <div className="mt-5">
                    <Accordion type="single" collapsible defaultValue="quote" className="space-y-3">
                      {/* Get AI Project Quote */}
                      <AccordionItem value="quote" className="bg-white/10 rounded-lg border border-white/20 px-4">
                        <AccordionTrigger className="text-white hover:text-white/80 font-semibold">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5" />
                            Lower Price & Great Quality Guaranteed
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 pb-4">
                          <div className="space-y-3">
                            <Textarea
                              value={projectDescription}
                              onChange={(e) => setProjectDescription(e.target.value)}
                              placeholder="Describe your project... (e.g., Replace kitchen countertops with granite, install new hardwood flooring in living room, repair roof shingles)"
                              className="bg-slate-50 text-slate-900 min-h-[100px] border-green-300 focus:border-green-600 focus:ring-green-600"
                              rows={4} />

                            {/* Photo Preview */}
                            {projectPhotos.length > 0 &&
                            <div className="flex flex-wrap gap-2">
                                {projectPhotos.map((url, index) =>
                              <div key={index} className="relative w-16 h-16">
                                    <img src={url} alt="" className="w-full h-full object-cover rounded-lg" />
                                    <button
                                  type="button"
                                  onClick={() => setProjectPhotos(projectPhotos.filter((_, i) => i !== index))}
                                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5">
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                              )}
                              </div>
                            }

                            {/* Photo Upload and Location Row */}
                            <div className="grid grid-cols-2 gap-2">
                              {/* Add Photos Button */}
                              {projectPhotos.length < 3 &&
                              <label className="cursor-pointer">
                                  <input
                                  type="file"
                                  multiple
                                  accept="image/*"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const files = Array.from(e.target.files).slice(0, 3 - projectPhotos.length);
                                    if (files.length === 0) return;
                                    setUploadingPhotos(true);
                                    try {
                                      const uploadPromises = files.map(file => UploadFile({ file }));
                                      const results = await Promise.all(uploadPromises);
                                      const urls = results.map((r) => r.file_url);
                                      setProjectPhotos([...projectPhotos, ...urls].slice(0, 3));
                                    } catch (error) {
                                      console.error('Upload error:', error);
                                    }
                                    setUploadingPhotos(false);
                                    e.target.value = '';
                                  }}
                                  disabled={uploadingPhotos} />
                                  <div className="flex items-center justify-center gap-2 px-3 py-2 bg-white/20 border border-white/40 hover:bg-white/30 rounded-lg text-sm text-white h-[38px] w-full">
                                    {uploadingPhotos ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                                    <span className="whitespace-nowrap">{uploadingPhotos ? 'Uploading...' : `Add Photos (${projectPhotos.length}/3)`}</span>
                                  </div>
                                </label>
                              }

                              {/* Set Location Input */}
                              <Input
                                placeholder="Set Location"
                                value={projectLocation}
                                onChange={(e) => setProjectLocation(e.target.value)}
                                onBlur={(e) => handleSaveLocation(e.target.value)}
                                className={`bg-slate-50 text-slate-900 h-[38px] text-sm ${projectPhotos.length >= 3 ? 'col-span-2' : ''}`} />

                            </div>

                            <Button
                              onClick={handleGetPrice}
                              disabled={!projectDescription.trim() || loadingPrice}
                              className="w-full h-[38px] bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg">

                              {loadingPrice ?
                              <>
                                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                  Getting Price...
                                </> :

                              <>
                                  <DollarSign className="w-5 h-5 mr-2" />
                                  Get Price
                                </>
                              }
                            </Button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      {/* Airbnb Listing */}
                      <AccordionItem value="airbnb" className="bg-white/10 rounded-lg border border-white/20 px-4">
                        <AccordionTrigger className="text-white hover:text-white/80 font-semibold">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🏠</span>
                            Advertise Your Airbnb Listing
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 pb-4">
                          <AirbnbListingFlow />
                        </AccordionContent>
                      </AccordionItem>

                      {/* Find Dream Home / Digitize Your Home */}
                      <AccordionItem value="digitize" className="bg-white/10 px-2 rounded-lg border border-white/20">
                        <AccordionTrigger className="text-white hover:text-white/80 font-semibold">
                          <div className="flex items-center gap-2">
                            <Home className="w-5 h-5" />
                            {isFirstTimeBuyer ? 'Find Your Dream Home' : 'Maintain Your Home'}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 pb-4">
                          {isFirstTimeBuyer ?
                          <div className="space-y-3">
                              <div className="flex gap-3">
                                <Input
                                value={manualAddress}
                                onChange={(e) => setManualAddress(e.target.value)}
                                placeholder="City or ZIP (e.g., Sacramento or 95814)"
                                className="bg-slate-50 text-slate-900 flex-1 border-green-300 focus:border-green-600 focus:ring-green-600"
                                onKeyPress={(e) => e.key === 'Enter' && manualAddress.trim() && setShowHomeBuyerModal(true)} />

                                <Button
                                onClick={() => setShowHomeBuyerModal(true)}
                                disabled={!manualAddress.trim()}
                                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg">
                                  Start
                                  <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                type="checkbox"
                                id="firstTimeBuyer"
                                checked={isFirstTimeBuyer}
                                onChange={(e) => setIsFirstTimeBuyer(e.target.checked)}
                                className="w-4 h-4 rounded border-white/40 bg-white/10 text-green-600 focus:ring-green-600 focus:ring-offset-0" />

                                <label htmlFor="firstTimeBuyer" className="text-white/70 text-sm cursor-pointer">
                                  Renting
                                </label>
                              </div>
                            </div> :

                          <div className="space-y-3">
                              <div className="flex gap-3">
                                <Input
                                value={manualAddress}
                                onChange={(e) => setManualAddress(e.target.value)}
                                placeholder="123 Main St, City, State ZIP"
                                className="bg-slate-50 text-slate-900 flex-1 border-green-300 focus:border-green-600 focus:ring-green-600"
                                onKeyPress={(e) => e.key === 'Enter' && handleStartWithAddress()} />

                                <Button
                                onClick={handleStartWithAddress}
                                disabled={!manualAddress.trim()}
                                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg">
                                  Start
                                  <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                type="checkbox"
                                id="firstTimeBuyer"
                                checked={isFirstTimeBuyer}
                                onChange={(e) => setIsFirstTimeBuyer(e.target.checked)}
                                className="w-4 h-4 rounded border-white/40 bg-white/10 text-green-600 focus:ring-green-600 focus:ring-offset-0" />

                                <label htmlFor="firstTimeBuyer" className="text-white/70 text-sm cursor-pointer">
                                  Renting
                                </label>
                              </div>
                            </div>
                          }
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    {/* Demo Button - Full Width */}
                    <Link to={createPageUrl('DemoPropertyDashboard')} className="block mt-4">
                      <Button
                        variant="outline"
                        className="w-full bg-white/20 text-white border-white/60 hover:bg-white/30 backdrop-blur-md shadow-xl h-12 text-base">

                        <Sparkles className="w-5 h-5 mr-2" />
                        View Demo
                      </Button>
                    </Link>
                  </div>
                </TabsContent>

                  <TabsContent value="pro" className="mt-0">
                  <h3 className="text-slate-50 mt-5 mb-6 text-xl font-semibold text-center">Start Growing Your Business</h3>
                  <div className="mt-5">
                    <Accordion type="single" collapsible defaultValue="claim" className="space-y-3">
                      {/* Claim Business */}
                      <AccordionItem value="claim" className="bg-white/10 rounded-lg border border-white/20 px-4">
                        <AccordionTrigger className="text-white hover:text-white/80 font-semibold">
                          <div className="flex items-center gap-2">
                            <Briefcase className="w-5 h-5" />
                            Claim Your Business
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 pb-4">
                          <ClaimBusinessSection />
                        </AccordionContent>
                      </AccordionItem>

                      {/* AI Assistant */}
                      <AccordionItem value="ai" className="bg-white/10 rounded-lg border border-white/20 px-4">
                        <AccordionTrigger className="text-white hover:text-white/80 font-semibold">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5" />
                            Create AI Assistant
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 pb-4">
                          <ProAIAssistantContent />
                        </AccordionContent>
                      </AccordionItem>

                      {/* Post Deal */}
                      <AccordionItem value="deal" className="bg-white/10 rounded-lg border border-white/20 px-4">
                        <AccordionTrigger className="text-white hover:text-white/80 font-semibold">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5" />
                            Post a Deal
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 pb-4">
                          <ProDealContent />
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    <Link to={createPageUrl('DemoBusinessDashboard')} className="block mt-4">
                      <Button
                        variant="outline"
                        className="w-full bg-white/20 text-white border-white/60 hover:bg-white/30 backdrop-blur-md shadow-xl h-12 text-base">

                        <Sparkles className="w-5 h-5 mr-2" />
                        View Demo Dashboard
                      </Button>
                    </Link>
                  </div>
              </TabsContent>

              <TabsContent value="askai" className="mt-0">
                <AskAITab />
              </TabsContent>
            </Card>
          </div>
        </div>
      </section>
      </Tabs>

      {/* Features Section */}
      <section className="bg-gradient-to-b py-8 px-4 from-green-50 to-white relative z-30 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto relative z-40">
            {features.map((feature, idx) =>
          <Card key={idx} className="bg-gradient-to-br text-card-foreground pt-4 pr-4 pb-6 pl-4 rounded-xl hover:shadow-xl transition-all hover:-translate-y-1 border-2 border-green-300 from-green-50 to-white shadow-lg">
                <div className={`${feature.iconBg} bg-gradient-to-br mx-auto rounded-xl w-16 h-16 flex items-center justify-center shadow-lg`}>
                  {feature.icon}
                </div>
                <h3 className="text-green-800 mb-2 text-2xl font-bold text-center">{feature.title}</h3>
                <p className="text-gray-600 mb-6 text-center min-h-[80px]">
                  {feature.description}
                </p>
                <Button
              variant={feature.highlight ? "default" : "outline"}
              className={`w-full ${feature.highlight ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800' : 'border-green-600 text-green-700 hover:bg-green-50'}`}
              onClick={feature.action}>
                  {feature.buttonText}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Card>
          )}
          </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-white px-4 py-12 overflow-hidden">
        <div className="w-full max-w-7xl mx-auto">
          <h2 className="text-green-800 mb-10 text-4xl font-bold text-center">Why Choose {siteName}?

          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center max-w-5xl mx-auto">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">AI-Powered Insights</h3>
                  <p className="text-gray-600">Get intelligent property analysis, ROI projections, maintenance priorities, and market trends powered by advanced AI.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Simple Accounting</h3>
                  <p className="text-gray-600">Track rental income and property expenses effortlessly. View profit/loss by month or year with visual breakdowns.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Maintenance</h3>
                  <p className="text-gray-600">AI recommends maintenance priorities with cost estimates and urgency levels. Connect with verified service providers in one click.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Professional Reports</h3>
                  <p className="text-gray-600">Generate inspection and appraisal reports suitable for insurance, real estate transactions, and financial planning.</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-100 to-emerald-50 rounded-2xl p-12 text-center shadow-xl">
              <div className="text-6xl font-bold text-green-700 mb-4">1000+</div>
              <p className="text-xl text-gray-700 mb-8">Properties Digitized</p>
              <div className="text-6xl font-bold text-green-700 mb-4">500+</div>
              <p className="text-xl text-gray-700 mb-8">Verified Experts</p>
              <div className="text-6xl font-bold text-green-700 mb-4">2500+</div>
              <p className="text-xl text-gray-700">Community Insights</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Darker with visible image */}
      <section
        className="relative py-20 px-4 overflow-hidden min-h-[500px] flex items-center"
        style={{
          backgroundImage: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.55) 0%, rgba(0, 0, 0, 0.45) 50%, rgba(0, 0, 0, 0.65) 100%), url(https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center bottom',
          backgroundAttachment: 'fixed'
        }}>

        {/* Subtle green tint overlay */}
        <div className="absolute inset-0 bg-green-900/15 mix-blend-multiply"></div>
        
        <div className="max-w-4xl mx-auto text-center text-white relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 drop-shadow-2xl">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 text-white/95 drop-shadow-lg">
            Join thousands of homeowners protecting and maximizing their property value
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-green-700 hover:bg-gray-100 text-lg h-14 px-8 shadow-2xl font-semibold"
              onClick={handleSignUp}>
              Create Free Account
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-white/20 hover:bg-white/30 text-white border-white/60 text-lg h-14 px-8 backdrop-blur-md shadow-xl"
              onClick={() => navigate(createPageUrl('Services'))}>
              Browse Services
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center shadow-lg">
              <Home className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold">{siteName}</span>
          </div>
          <p className="text-gray-400 mb-6">Your trusted partner in home management</p>
          <div className="flex justify-center gap-8 mb-6">
            <Link to={createPageUrl('Deals')} className="text-gray-400 hover:text-green-400 transition-colors">
              Deals
            </Link>
            <Link to={createPageUrl('Services')} className="text-gray-400 hover:text-green-400 transition-colors">
              Services
            </Link>
            <Link to={createPageUrl('Insights')} className="text-gray-400 hover:text-green-400 transition-colors">
              Insights
            </Link>
            <button onClick={handleSignUp} className="text-gray-400 hover:text-green-400 transition-colors">
              Digitize Home
            </button>
          </div>
          <div className="flex justify-center gap-6 mb-4 text-sm">
            <Link to={createPageUrl('PrivacyPolicy')} className="text-gray-400 hover:text-green-400 transition-colors">
              Privacy Policy
            </Link>
            <Link to={createPageUrl('TermsOfService')} className="text-gray-400 hover:text-green-400 transition-colors">
              Terms of Service
            </Link>
          </div>
          <p className="text-gray-500 text-sm">© 2024 {siteName}. All rights reserved.</p>
        </div>
      </footer>

      {/* Property Capture Modal */}
      <Dialog open={showPropertyCaptureModal} onOpenChange={setShowPropertyCaptureModal}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto p-0">
          <PropertyCaptureModalContent
            initialAddress={captureAddress}
            onClose={() => setShowPropertyCaptureModal(false)} />
        </DialogContent>
      </Dialog>

      {/* Maintenance Project Modal */}
      <Dialog open={showProjectModal} onOpenChange={setShowProjectModal}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0">
          <MaintenanceProjectModal onClose={() => setShowProjectModal(false)} />
        </DialogContent>
      </Dialog>

      {/* Quote Result Modal - inline simple version */}
      <Dialog open={showQuoteResultModal} onOpenChange={setShowQuoteResultModal}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0">
          {estimatedPrice && (
            <div className="py-12 px-4">
              <div className="max-w-3xl mx-auto">
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-[#1e3a5f] mb-2">Cost Estimate</h1>
                  <p className="text-gray-600">Here's what your project might cost</p>
                </div>
                <Card className="mb-8 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 p-6">
                  <h4 className="font-bold text-green-900 mb-4 text-center text-xl">Estimated Cost Range</h4>
                  <div className="text-center mb-6">
                    <p className="text-4xl font-bold text-green-700 mb-2">${estimatedPrice.min_cost?.toLocaleString()} - ${estimatedPrice.max_cost?.toLocaleString()}</p>
                    <p className="text-lg text-green-600">Average: ${estimatedPrice.average_cost?.toLocaleString()}</p>
                  </div>
                  <div className="border-t border-green-200 pt-4">
                    <p className="text-sm text-gray-700 mb-3">{estimatedPrice.breakdown}</p>
                    <ul className="text-sm text-gray-600 space-y-1">{estimatedPrice.factors?.map((f, i) => <li key={i} className="flex items-start gap-2"><span className="text-green-600 mt-0.5">•</span><span>{f}</span></li>)}</ul>
                  </div>
                </Card>
                {estimatedPrice.businesses?.length > 0 && (
                  <Card className="mb-8 p-6">
                    <h4 className="font-bold text-gray-900 mb-4 text-lg">Professionals Near You</h4>
                    <div className="space-y-3">{estimatedPrice.businesses.map((b, i) => <div key={i} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg"><div className="flex-1"><h5 className="font-semibold">{b.name}</h5>{b.address && <p className="text-sm text-gray-600">{b.address}</p>}<div className="flex gap-4 mt-1">{b.rating && <span className="text-sm">⭐ {b.rating}</span>}{b.phone && <a href={`tel:${b.phone}`} className="text-sm text-green-600">{b.phone}</a>}</div></div></div>)}</div>
                  </Card>
                )}
                <Card className="p-8 text-center">
                  <h3 className="text-2xl font-bold text-[#1e3a5f] mb-3">Ready to Start This Project?</h3>
                  <p className="text-gray-600 mb-6">Create an account and we'll connect you with qualified professionals</p>
                  <div className="flex gap-3 justify-center">
                    <Button onClick={() => { setShowQuoteResultModal(false); handleSignUp(); }} className="bg-[#d4af37] hover:bg-[#c49d2a]"><ArrowRight className="w-5 h-5 mr-2" />Get Started</Button>
                    <Button variant="outline" onClick={() => setShowQuoteResultModal(false)}>Maybe Later</Button>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ChatWidget isOpen={chatOpen} setIsOpen={setChatOpen} inNavigation={true} />

      {/* Home Buyer Modal */}
      <Dialog open={showHomeBuyerModal} onOpenChange={setShowHomeBuyerModal}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto p-0">
          <HomeBuyerModalContent
            initialLocation={manualAddress}
            onClose={() => {
              setShowHomeBuyerModal(false);
              setHomeBuyerStep(1);
            }} />

        </DialogContent>
      </Dialog>

      {/* AI Assistant Modal */}
      <Dialog open={showAIAssistantModal} onOpenChange={setShowAIAssistantModal}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <AIAssistantModalContent onClose={() => setShowAIAssistantModal(false)} />
        </DialogContent>
      </Dialog>
      </div>);

}

function ProAIAssistantContent() {
  const [showAIAssistantModal, setShowAIAssistantModal] = useState(false);
  const [quoteInstructions, setQuoteInstructions] = useState('');
  const [priceList, setPriceList] = useState([{ description: '', price: '' }]);

  const addPriceItem = () => {
    setPriceList([...priceList, { description: '', price: '' }]);
  };

  const removePriceItem = (index) => {
    setPriceList(priceList.filter((_, i) => i !== index));
  };

  const updatePriceItem = (index, field, value) => {
    const updated = [...priceList];
    updated[index][field] = value;
    setPriceList(updated);
  };

  return (
    <>
      <div className="space-y-3">
        <Textarea
          value={quoteInstructions}
          onChange={(e) => setQuoteInstructions(e.target.value)}
          placeholder="Quote Assistant Instructions (e.g., 'Provide accurate quotes, be friendly and professional...')"
          className="bg-slate-50 text-slate-900 min-h-[80px] text-sm"
          rows={3} />

        <div className="space-y-2">
          <Label className="text-white text-xs">Price List</Label>
          {priceList.map((item, index) =>
          <div key={index} className="flex gap-2">
              <Input
              placeholder="Service"
              value={item.description}
              onChange={(e) => updatePriceItem(index, 'description', e.target.value)}
              className="bg-slate-50 text-slate-900 text-sm flex-1" />

              <Input
              placeholder="Price"
              value={item.price}
              onChange={(e) => updatePriceItem(index, 'price', e.target.value)}
              className="bg-slate-50 text-slate-900 text-sm w-24" />

              {priceList.length > 1 &&
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removePriceItem(index)}
              className="bg-white/20 hover:bg-white/30 text-white h-[38px]">

                  <X className="w-4 h-4" />
                </Button>
            }
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={addPriceItem}
            className="w-full bg-white/20 hover:bg-white/30 text-white h-8 text-xs">

            <Plus className="w-3 h-3 mr-1" />
            Add Item
          </Button>
        </div>

        <Button
          onClick={() => setShowAIAssistantModal(true)}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg">
          <Sparkles className="w-5 h-5 mr-2" />
          Test AI Assistant
        </Button>
      </div>

      <Dialog open={showAIAssistantModal} onOpenChange={setShowAIAssistantModal}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <AIAssistantModalContent
            onClose={() => setShowAIAssistantModal(false)}
            initialInstructions={quoteInstructions}
            initialPriceList={priceList} />

        </DialogContent>
      </Dialog>
    </>);

}

function ProDealContent() {
  const [showDealModal, setShowDealModal] = useState(false);

  return (
    <>
      <Button
        onClick={() => setShowDealModal(true)}
        className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg h-12 text-base">
        <DollarSign className="w-5 h-5 mr-2" />
        Post a Deal
      </Button>

      <Dialog open={showDealModal} onOpenChange={setShowDealModal}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <ProDealModalContent onClose={() => setShowDealModal(false)} />
        </DialogContent>
      </Dialog>
    </>);

}

function AIAssistantModalContent({ onClose, initialInstructions = '', initialPriceList = [{ description: '', price: '' }] }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [quoteInstructions, setQuoteInstructions] = useState(initialInstructions);
  const [priceList, setPriceList] = useState(initialPriceList);
  const [testMessages, setTestMessages] = useState([]);
  const [testInput, setTestInput] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    business_name: '',
    email: '',
    phone: '',
    service_types: [],
    business_address: ''
  });
  const [creating, setCreating] = useState(false);

  const { data: serviceCategories = [] } = useQuery({
    queryKey: ['serviceCategories'],
    queryFn: () => Category.filter({ type: 'service_type', is_active: true }),
    staleTime: 60000
  });

  const handleTestMessage = async () => {
    if (!testInput.trim()) return;

    const userMessage = { role: 'user', content: testInput };
    setTestMessages([...testMessages, userMessage]);
    setTestInput('');
    setTestLoading(true);

    try {
      const priceListText = priceList.
      filter((item) => item.description && item.price).
      map((item) => `- ${item.description}: $${item.price}`).
      join('\n');

      const prompt = `You are a helpful quote assistant for a service business. 
      
Customer Instructions: ${quoteInstructions || 'Provide helpful quotes and service information.'}

Price List:
${priceListText || 'No specific prices provided.'}

Customer Message: ${testInput}

Provide a helpful response with quotes when relevant.`;

      const response = await InvokeLLM({ prompt });

      const assistantMessage = { role: 'assistant', content: response };
      setTestMessages([...testMessages, userMessage, assistantMessage]);
    } catch (error) {
      console.error('Test error:', error);
      alert('Failed to test assistant. Please try again.');
    }

    setTestLoading(false);
  };

  const handleCreateAccount = async () => {
    if (!profileData.business_name || !profileData.email || profileData.service_types.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    setCreating(true);
    try {
      await PendingUser.create({
        email: profileData.email,
        full_name: profileData.business_name,
        phone: profileData.phone,
        user_type: 'service_provider',
        service_listing: {
          business_name: profileData.business_name,
          service_types: profileData.service_types,
          business_address: profileData.business_address,
          quote_assistant_instructions: quoteInstructions,
          price_list: priceList.filter((item) => item.description && item.price)
        },
        status: 'pending'
      });

      const signupUrl = window.location.origin + createPageUrl('Dashboard') +
      '?signup=true' +
      '&name=' + encodeURIComponent(profileData.business_name) +
      '&email=' + encodeURIComponent(profileData.email);

      void redirectToAppLogin(signupUrl);
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
      setCreating(false);
    }
  };

  const steps = [
  { number: 1, title: 'Test Quote Assistant' },
  { number: 2, title: 'Create Account' }];


  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-[#1e3a5f] mb-6 text-center">Setup AI Quote Assistant</h2>
      
      {/* Step Indicator */}
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, idx) =>
        <div key={step.number} className="flex items-center">
            <div className={`flex flex-col items-center ${idx > 0 ? 'ml-4' : ''}`}>
              <div className={`rounded-full w-12 h-12 flex items-center justify-center font-bold transition-colors ${
            currentStep >= step.number ?
            'bg-[#1e3a5f] text-white' :
            'bg-gray-200 text-gray-500'}`}>
                {currentStep > step.number ? '✓' : step.number}
              </div>
              <p className={`text-sm mt-2 font-medium ${
            currentStep >= step.number ? 'text-[#1e3a5f]' : 'text-gray-500'}`}>
                {step.title}
              </p>
            </div>
            {idx < steps.length - 1 &&
          <div className={`h-1 w-24 mx-2 rounded transition-colors ${
          currentStep > step.number ? 'bg-[#1e3a5f]' : 'bg-gray-200'}`} />
          }
          </div>
        )}
      </div>

      {currentStep === 1 &&
      <div className="space-y-4">
          <Accordion type="single" collapsible defaultValue="test-assistant">
            <AccordionItem value="setup-assistant">
              <AccordionTrigger>AI Assistant Setup</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label>Quote Assistant Instructions</Label>
                    <Textarea
                    value={quoteInstructions}
                    onChange={(e) => setQuoteInstructions(e.target.value)}
                    placeholder="Tell the AI how to handle customer inquiries. E.g., 'Provide accurate quotes based on our price list. Be friendly and professional.'"
                    className="min-h-[100px]"
                    rows={4} />

                  </div>

                  <div>
                    <Label>Price List</Label>
                    <div className="text-xs text-gray-500 mb-2">Add your service prices for accurate quotes</div>
                    <div className="space-y-2 mt-2">
                      {priceList.map((item, index) =>
                    <div key={index} className="flex gap-2">
                          <Input
                        placeholder="Service description"
                        value={item.description}
                        onChange={(e) => {
                          const updated = [...priceList];
                          updated[index].description = e.target.value;
                          setPriceList(updated);
                        }}
                        className="flex-1" />

                          <Input
                        placeholder="Price"
                        value={item.price}
                        onChange={(e) => {
                          const updated = [...priceList];
                          updated[index].price = e.target.value;
                          setPriceList(updated);
                        }}
                        className="w-32" />

                          {priceList.length > 1 &&
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPriceList(priceList.filter((_, i) => i !== index))}>

                              <X className="w-4 h-4" />
                            </Button>
                      }
                        </div>
                    )}
                      <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPriceList([...priceList, { description: '', price: '' }])}
                      className="w-full">

                        <Plus className="w-4 h-4 mr-2" />
                        Add Price Item
                      </Button>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="test-assistant">
              <AccordionTrigger>Test AI Assistant</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-4">
                  <div className="border rounded-lg p-4 bg-gray-50 min-h-[300px] max-h-[400px] overflow-y-auto space-y-3">
                    {testMessages.length === 0 ?
                  <p className="text-gray-500 text-center py-8">
                        Start a conversation to test your AI assistant
                      </p> :

                  testMessages.map((msg, idx) =>
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] p-3 rounded-lg ${
                    msg.role === 'user' ?
                    'bg-[#1e3a5f] text-white' :
                    'bg-white border'}`
                    }>
                            {msg.content}
                          </div>
                        </div>
                  )
                  }
                    {testLoading &&
                  <div className="flex justify-start">
                        <div className="bg-white border p-3 rounded-lg">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                      </div>
                  }
                  </div>

                  <div className="flex gap-2">
                    <Input
                    placeholder="Type a test message..."
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !testLoading && handleTestMessage()}
                    disabled={testLoading} />

                    <Button
                    onClick={handleTestMessage}
                    disabled={!testInput.trim() || testLoading}>

                      Send
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={() => setCurrentStep(2)} className="bg-[#1e3a5f] hover:bg-[#2a4a7f] flex-1">
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      }

      {currentStep === 2 &&
      <Card className="p-6">
          <div className="space-y-4">
            <div>
              <Label>Business Name *</Label>
              <Input
              value={profileData.business_name}
              onChange={(e) => setProfileData({ ...profileData, business_name: e.target.value })}
              placeholder="ABC Plumbing Services" />

            </div>

            <div>
              <Label>Email *</Label>
              <Input
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
              placeholder="business@example.com" />

            </div>

            <div>
              <Label>Phone</Label>
              <Input
              type="tel"
              value={profileData.phone}
              onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
              placeholder="(555) 123-4567" />

            </div>

            <div>
              <Label>Service Types *</Label>
              <Select
              value={profileData.service_types[0] || ''}
              onValueChange={(value) => {
                if (!profileData.service_types.includes(value)) {
                  setProfileData({
                    ...profileData,
                    service_types: [...profileData.service_types, value]
                  });
                }
              }}>

                <SelectTrigger>
                  <SelectValue placeholder="Select services" />
                </SelectTrigger>
                <SelectContent>
                  {serviceCategories.map((cat) =>
                <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                )}
                </SelectContent>
              </Select>
              {profileData.service_types.length > 0 &&
            <div className="flex flex-wrap gap-2 mt-2">
                  {profileData.service_types.map((service, idx) =>
              <Badge key={idx} className="bg-[#1e3a5f]">
                      {service}
                      <button
                  onClick={() => setProfileData({
                    ...profileData,
                    service_types: profileData.service_types.filter((_, i) => i !== idx)
                  })}
                  className="ml-2">

                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
              )}
                </div>
            }
            </div>

            <div>
              <Label>Business Address</Label>
              <Input
              value={profileData.business_address}
              onChange={(e) => setProfileData({ ...profileData, business_address: e.target.value })}
              placeholder="123 Main St, City, State ZIP" />

            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                Back
              </Button>
              <Button
              onClick={handleCreateAccount}
              disabled={creating}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 flex-1">
                {creating ?
              <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Creating...
                  </> :

              <>
                    Create Account
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
              }
              </Button>
            </div>
          </div>
        </Card>
      }
    </div>);

}

import MaintenanceProjectModal from '../components/Landing/MaintenanceProjectModal';
import ProDealModal from '../components/Landing/ProDealModal';
import AskAITab from '../components/Landing/AskAITab';
import AirbnbListingFlow from '../components/Landing/AirbnbListingFlow';

function ProDealModalContent({ onClose }) { return <ProDealModal onClose={onClose} />; }

function HomeBuyerModalContent({ initialLocation, onClose }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [searchCriteria, setSearchCriteria] = useState({ location: initialLocation });
  const [homeData, setHomeData] = useState(null);

  const handleCriteriaNext = (criteria) => {
    setSearchCriteria(criteria);
    setCurrentStep(2);
  };

  const handleHomeNext = (data) => {
    setHomeData(data);
    setCurrentStep(3);
  };

  const steps = [
  { number: 1, title: 'Search Criteria' },
  { number: 2, title: 'Browse Homes' },
  { number: 3, title: 'Review & Submit' }];


  return (
    <div className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
      <h1 className="text-4xl md:text-5xl font-bold text-[#1e3a5f] mb-3">
      Find Your Dream Home
      </h1>
      <p className="text-xl text-gray-600">Let's find the perfect home for you</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center mb-12">
      {steps.map((step, idx) =>
          <div key={step.number} className="flex items-center">
        <div className={`flex flex-col items-center ${idx > 0 ? 'ml-4' : ''}`}>
          <div className={`rounded-full w-12 h-12 flex items-center justify-center font-bold transition-colors ${
              currentStep >= step.number ?
              'bg-[#1e3a5f] text-white' :
              'bg-gray-200 text-gray-500'}`
              }>
            {currentStep > step.number ? '✓' : step.number}
          </div>
          <p className={`text-sm mt-2 font-medium ${
              currentStep >= step.number ? 'text-[#1e3a5f]' : 'text-gray-500'}`
              }>
            {step.title}
          </p>
        </div>
        {idx < steps.length - 1 &&
            <div className={`h-1 w-24 mx-2 rounded transition-colors ${
            currentStep > step.number ? 'bg-[#1e3a5f]' : 'bg-gray-200'}`
            } />
            }
      </div>
          )}
      </div>

      {currentStep === 1 &&
        <HomeSearchCriteria
          initialData={searchCriteria}
          onNext={handleCriteriaNext}
          onBack={onClose} />

        }

      {currentStep === 2 &&
        <HomeResults
          criteria={searchCriteria}
          onNext={handleHomeNext}
          onBack={() => setCurrentStep(1)} />

        }

      {currentStep === 3 &&
        <ReviewSubmit
          criteria={searchCriteria}
          selectedHome={homeData.selectedHome}
          desiredChanges={homeData.desiredChanges}
          onBack={() => setCurrentStep(2)} />

        }
      </div>
      </div>);

}

// QuoteResultModalContent and MaintenanceProjectModalContent extracted to sub-components

function PropertyCaptureModalContent({ initialAddress, onClose }) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [propertyData, setPropertyData] = useState(initialAddress ? { address: initialAddress } : null);
  const [componentData, setComponentData] = useState({});
  const [checking, setChecking] = useState(false);
  const [existingProperty, setExistingProperty] = useState(null);

  React.useEffect(() => {
    const checkAddress = async () => {
      if (initialAddress) {
        setChecking(true);
        try {
          const properties = await Property.filter({ address: initialAddress });

          if (properties && properties.length > 0) {
            setExistingProperty(properties[0]);
          } else {
            setPropertyData({ address: initialAddress });
          }
        } catch (error) {
          console.error('Error checking address:', error);
          setPropertyData({ address: initialAddress });
        }
        setChecking(false);
      }
    };

    checkAddress();
  }, [initialAddress]);

  const handlePropertyNext = (data) => {
    setPropertyData(data);
    setCurrentStep(2);
  };

  const handleComponentNext = (data) => {
    setComponentData(data);
    setCurrentStep(3);
  };

  const handleLogin = () => {
    const dashboardUrl = window.location.origin + createPageUrl('Dashboard');
    navigateToLogin(dashboardUrl);
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#1e3a5f] mx-auto mb-4" />
          <p className="text-gray-600">Checking property...</p>
        </div>
      </div>);

  }

  if (existingProperty) {
    return (
      <div className="py-12 px-4 flex items-center justify-center">
        <Card className="p-8 max-w-md text-center shadow-xl">
          <div className="w-16 h-16 bg-[#1e3a5f] rounded-full flex items-center justify-center mx-auto mb-6">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-[#1e3a5f] mb-3">Property Already Digitized</h2>
          <p className="text-gray-600 mb-6">
            This property at <strong>{existingProperty.address}</strong> has already been digitized.
          </p>
          <p className="text-gray-600 mb-6">
            Please log in to access your property dashboard and reports.
          </p>
          <Button
            onClick={handleLogin}
            className="w-full bg-[#1e3a5f] hover:bg-[#2a4a7f] h-12">

            <LogIn className="w-5 h-5 mr-2" />
            Log In to Access Property
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full mt-3">

            Back to Home
          </Button>
        </Card>
      </div>);

  }

  return (
    <div className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[#1e3a5f] mb-3">
            Digitize Your Home
          </h1>
          <p className="text-xl text-gray-600">Professional property analysis in minutes</p>
        </div>

        <StepIndicator currentStep={currentStep} />

        {currentStep === 1 &&
        <PropertyInfoForm
          initialData={propertyData}
          onNext={handlePropertyNext} />

        }

        {currentStep === 2 &&
        <ComponentUploader
          onNext={handleComponentNext}
          onBack={() => setCurrentStep(1)} />

        }

        {currentStep === 3 &&
        <ReviewAndGenerate
          propertyData={propertyData}
          componentData={componentData}
          onBack={() => setCurrentStep(2)} />

        }
      </div>
    </div>);

}