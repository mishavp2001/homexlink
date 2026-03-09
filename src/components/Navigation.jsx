import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/lib/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import LocationInput from './LocationInput';
import ChatWidget from './ChatWidget';
import LanguageSelector from './LanguageSelector';
import ThemeToggle from './ThemeToggle';
import { useTranslation } from './lib/TranslationContext';
import { 
  Home, Key, Palmtree, Wrench, Lightbulb, Briefcase, ChevronDown, 
  User, LogOut, Menu, X, MessageSquare, DollarSign, Search, MapPin, Phone, Mail,
  Hammer, Paintbrush, Scissors, Truck, Lock, Zap, Thermometer, Flower2, Circle, ArrowRight,
  Droplet, Flame, Wind, Fan, Snowflake, Trees, Shovel, Axe, Plug, Tv, Wifi, Shield, 
  ShoppingBag, Stethoscope, Heart, Cross, GraduationCap, Book, Smartphone, Laptop, 
  Camera, Music, Video, Speaker, Mic, Megaphone, Bell, Calendar, Clock, Navigation as NavigationIcon, 
  Compass, Anchor, Sun, Moon, Cloud, Umbrella, Palette, Ruler, Pencil, Trash2, 
  Recycle, Coins, CreditCard, TrendingUp, ChartBar, PieChart, Activity, Layers, 
  Layout, Grid, List, CheckCircle, AlertCircle, Info, HelpCircle, Users, UserPlus, 
  Smile, ThumbsUp, Star, Award, Gift, Tag, Sparkles
} from 'lucide-react';

const iconMap = {
  Home, Key, Palmtree, Wrench, Lightbulb, Briefcase, 
  Hammer, Paintbrush, Scissors, Truck, Lock, Zap, Thermometer, Flower2,
  Droplet, Flame, Wind, Fan, Snowflake, Trees, Shovel, Axe, Plug, Tv, Wifi, Shield,
  ShoppingBag, Stethoscope, Heart, Cross, GraduationCap, Book, Smartphone, Laptop,
  Camera, Music, Video, Speaker, Mic, Megaphone, Bell, Calendar, Clock, Navigation: NavigationIcon,
  Compass, Anchor, Sun, Moon, Cloud, Umbrella, Palette, Ruler, Pencil, Trash2,
  Recycle, Coins, CreditCard, DollarSign, TrendingUp, ChartBar, PieChart, Activity, Layers,
  Layout, Grid, List, CheckCircle, AlertCircle, Info, HelpCircle, User, Users, UserPlus,
  Smile, ThumbsUp, Star, Award, Gift, Tag, Sparkles, MapPin, Phone, Mail, Search,
  MessageSquare, LogOut, Menu, X, ChevronDown, ArrowRight
};

const DynamicIcon = ({ name, className }) => {
  const IconComponent = iconMap[name];
  
  if (IconComponent) {
    return <IconComponent className={className} />;
  }
  
  // If not a known icon component, check if it might be an emoji (short string)
  if (name && name.length < 5) {
    return <span className="text-lg leading-none flex items-center justify-center h-full w-full">{name}</span>;
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
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default function Navigation({ user, actionButton, locationFilter, onLocationChange, onRadiusChange }) {
  const { navigateToLogin } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [locationPopoverOpen, setLocationPopoverOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [radiusMiles, setRadiusMiles] = useState(200);
  
  const [dealsOpen, setDealsOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);

  // Get site name from domain with proper capitalization
  const getSiteName = () => {
    const hostname = window.location.hostname;
    const domain = hostname.split('.')[0];
    
    if (domain.toLowerCase().startsWith('homes') && domain.length > 5) {
      return 'Homes' + domain.charAt(5).toUpperCase() + domain.slice(6);
    } else if (domain.toLowerCase().startsWith('home') && domain.length > 4) {
      return 'Home' + domain.charAt(4).toUpperCase() + domain.slice(5);
    } else {
      return domain.charAt(0).toUpperCase() + domain.slice(1);
    }
  };
  const siteName = "HomeXLink"; //getSiteName();

  // Load location from localStorage on mount
  useEffect(() => {
    if (onLocationChange) {
      const savedLocation = localStorage.getItem('userLocation');
      if (savedLocation && !locationFilter) {
        onLocationChange(savedLocation);
      }
    }
  }, []);

  // Save location to localStorage when it changes
  const handleLocationChange = (newLocation) => {
    localStorage.setItem('userLocation', newLocation);
    if (onLocationChange) {
      onLocationChange(newLocation);
    }
  };

  const handleRadiusChange = (newRadius) => {
    setRadiusMiles(newRadius);
    if (onRadiusChange) {
      onRadiusChange(newRadius);
    }
  };

  // Get unread message count for logged in users
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unreadMessages', user?.email],
    queryFn: async () => {
      if (!user) return 0;
      const messages = await base44.entities.Message.list();
      const received = messages.filter(m => 
        m.recipient_email === user.email && !m.is_read
      );
      return received.length;
    },
    enabled: !!user,
    refetchInterval: 30000
  });

  // Check if user is a service provider
  const { data: isProvider = false } = useQuery({
    queryKey: ['isProvider', user?.email],
    queryFn: async () => {
      if (!user) return false;
      const services = await base44.entities.ServiceListing.filter({ expert_email: user.email });
      return services.length > 0;
    },
    enabled: !!user
  });

  // Fetch categories for navigation menus
  const { data: categories = [] } = useQuery({
    queryKey: ['navCategories'],
    queryFn: () => base44.entities.Category.list('name', 100),
    staleTime: 60000
  });

  const dealCategories = categories.filter(c => c.type === 'deal_type').sort((a, b) => a.name.localeCompare(b.name));
  const serviceCategories = categories.filter(c => c.type === 'service_type').sort((a, b) => a.name.localeCompare(b.name));
  const insightCategories = categories.filter(c => c.type === 'insight_type').sort((a, b) => a.name.localeCompare(b.name));

  const handleLogout = () => {
    base44.auth.logout(window.location.origin + createPageUrl('Landing'));
  };

  const handleLogin = () => {
    navigateToLogin();
  };

  const isActive = (pageName) => {
    const currentPath = location.pathname.toLowerCase();
    const pageNameLower = pageName.toLowerCase();
    
    return currentPath.endsWith(`/${pageNameLower}`) || 
           currentPath.includes(`/${pageNameLower}?`) ||
           currentPath === `/${pageNameLower}` ||
           (currentPath === '/' && pageNameLower === 'landing');
  };

  const navLinkClass = (pageName) => {
    return isActive(pageName)
      ? 'text-[#1e3a5f] font-semibold border-b-2 border-[#d4af37] pb-1 transition-colors'
      : 'text-gray-700 hover:text-[#1e3a5f] font-medium transition-colors';
  };

  const mobileNavLinkClass = (pageName) => {
    return isActive(pageName)
      ? 'block text-[#1e3a5f] font-bold py-2 bg-[#d4af37]/10 px-3 rounded-lg transition-colors'
      : 'block text-gray-700 hover:text-[#1e3a5f] font-medium py-2 transition-colors';
  };

  return (
    <>
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm pt-safe">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl(user ? 'Dashboard' : 'Landing')} className="flex items-center gap-2 flex-shrink-0">
              <Home className="w-7 h-7 text-[#1e3a5f]" />
              <span className="text-2xl font-bold text-[#1e3a5f]">{siteName}</span>
            </Link>

            <Button
              onClick={() => setChatOpen(true)}
              size="sm"
              variant="outline"
              className="border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">{t('aiAssistant')}</span>
            </Button>

            {actionButton && (
              <div className="hidden md:block">
                {actionButton}
              </div>
            )}

            {onLocationChange && (
              <Popover open={locationPopoverOpen} onOpenChange={setLocationPopoverOpen}>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-1 px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 hidden md:inline">
                      {locationFilter || t('setLocation')}
                    </span>
                    <ChevronDown className="w-3 h-3 text-gray-500" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4">
                  <div className="space-y-3">
                    <div className="text-sm font-semibold text-gray-900">Find deals & services near you</div>
                    <LocationInput
                      value={locationFilter}
                      onChange={handleLocationChange}
                      placeholder="Enter ZIP code or city"
                      onApply={() => setLocationPopoverOpen(false)}
                    />
                    <div className="pt-2 border-t">
                      <label className="text-xs text-gray-600 mb-2 block">Search Radius</label>
                      <select
                        value={radiusMiles}
                        onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                      >
                        <option value="25">25 miles</option>
                        <option value="50">50 miles</option>
                        <option value="100">100 miles</option>
                        <option value="200">200 miles</option>
                        <option value="500">500 miles</option>
                      </select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-4 flex-shrink-0 h-full">
            {user && (
              <Link to={createPageUrl('Dashboard')} className={navLinkClass('Dashboard')}>
                {t('dashboard')}
              </Link>
            )}

            {/* Deals Hover Menu */}
            <HoverMenu
              isOpen={dealsOpen}
              onOpenChange={setDealsOpen}
              trigger={
                <Link to={createPageUrl('Deals')} className={`flex items-center gap-1 cursor-pointer ${navLinkClass('Deals')}`}>
                  {t('deals')} <ChevronDown className="w-4 h-4" />
                </Link>
              }
            >
              <div className="grid grid-cols-3 gap-x-6 gap-y-4">
                 <div className="col-span-3 mb-2 border-b pb-2">
                    <Link to={`${createPageUrl('Deals')}?type=all`} className="font-bold text-lg text-[#1e3a5f] hover:text-[#d4af37] flex items-center gap-2">
                       {t('allDeals')}
                       <ArrowRight className="w-4 h-4" />
                    </Link>
                 </div>
                 
                 {/* Property Deal Types */}
                 {dealCategories.map(cat => {
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
                       </Link>
                       );
                       })}

                 {/* Service Deal Types */}
                 {serviceCategories.length > 0 && serviceCategories.map((cat) => (
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
                 ))}
              </div>
            </HoverMenu>

            {/* Services Hover Menu */}
            <HoverMenu
              isOpen={servicesOpen}
              onOpenChange={setServicesOpen}
              trigger={
                <Link to={createPageUrl('Services')} className={`flex items-center gap-1 cursor-pointer ${navLinkClass('Services')}`}>
                  {t('services')} <ChevronDown className="w-4 h-4" />
                </Link>
              }
            >
              <div className="grid grid-cols-4 gap-x-6 gap-y-4">
                 <div className="col-span-4 mb-2 border-b pb-2">
                    <Link to={createPageUrl('Services')} className="font-bold text-lg text-[#1e3a5f] hover:text-[#d4af37] flex items-center gap-2">
                       {t('findProfessionals')}
                       <ArrowRight className="w-4 h-4" />
                    </Link>
                 </div>
                 {serviceCategories.length > 0 ? serviceCategories.map(cat => (
                     <Link key={cat.id} to={`${createPageUrl('Services')}?category=${cat.name}`} className="group">
                       <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-yellow-50 transition-colors">
                         <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                           <DynamicIcon name={cat.icon || 'Wrench'} className="w-5 h-5 text-yellow-600" />
                         </div>
                         <span className="font-semibold text-gray-900 group-hover:text-yellow-700 text-sm">{cat.name}</span>
                       </div>
                     </Link>
                 )) : (
                   <div className="col-span-4 text-center text-gray-500 py-4">
                     No service categories found.
                   </div>
                 )}
              </div>
            </HoverMenu>

            {/* Insights Hover Menu */}
            <HoverMenu
              isOpen={insightsOpen}
              onOpenChange={setInsightsOpen}
              trigger={
                <Link to={createPageUrl('Insights')} className={`flex items-center gap-1 cursor-pointer ${navLinkClass('Insights')}`}>
                  {t('insights')} <ChevronDown className="w-4 h-4" />
                </Link>
              }
            >
              <div className="grid grid-cols-4 gap-x-6 gap-y-4">
                 <div className="col-span-4 mb-2 border-b pb-2">
                    <Link to={createPageUrl('Insights')} className="font-bold text-lg text-[#1e3a5f] hover:text-[#d4af37] flex items-center gap-2">
                       {t('latestInsights')}
                       <ArrowRight className="w-4 h-4" />
                    </Link>
                 </div>
                 {insightCategories.length > 0 ? insightCategories.map(cat => (
                     <Link key={cat.id} to={`${createPageUrl('Insights')}?category=${cat.name}`} className="group">
                       <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-purple-50 transition-colors">
                         <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                           <DynamicIcon name={cat.icon || 'Lightbulb'} className="w-5 h-5 text-purple-600" />
                         </div>
                         <span className="font-semibold text-gray-900 group-hover:text-purple-700 text-sm">{cat.name}</span>
                       </div>
                     </Link>
                 )) : (
                   <div className="col-span-4 text-center text-gray-500 py-4">
                     No insight categories found.
                   </div>
                 )}
              </div>
            </HoverMenu>
            
            {user ? (
              <>
                <Link to={createPageUrl('Messages')} className="relative flex-shrink-0">
                  <Button 
                    variant={isActive('Messages') ? 'default' : 'outline'} 
                    size="sm"
                    className={isActive('Messages') ? 'bg-[#1e3a5f] hover:bg-[#2a4a7f]' : ''}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    {t('messages')}
                    {unreadCount > 0 && (
                      <Badge className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 min-w-[20px] h-5">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
                {isProvider && (
                  <Link to={createPageUrl('ProviderBilling')} className="flex-shrink-0">
                    <Button 
                      variant={isActive('ProviderBilling') ? 'default' : 'outline'} 
                      size="sm"
                      className={isActive('ProviderBilling') ? 'bg-[#d4af37] hover:bg-[#c49d2a]' : ''}
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      {t('billing')}
                    </Button>
                  </Link>
                )}
                <Link to={createPageUrl('Profile')} className="flex-shrink-0">
                  <Button 
                    variant={isActive('Profile') ? 'default' : 'outline'} 
                    size="sm"
                    className={isActive('Profile') ? 'bg-[#1e3a5f] hover:bg-[#2a4a7f]' : ''}
                  >
                    <User className="w-4 h-4 mr-2" />
                    {t('profile')}
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={handleLogout} className="flex-shrink-0">
                  <LogOut className="w-4 h-4 mr-2" />
                  {t('logout')}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={handleLogin} className="flex-shrink-0">
                  {t('signIn')}
                </Button>
                <Link to={createPageUrl('PropertyCapture')} className="flex-shrink-0">
                  <Button className="bg-[#d4af37] hover:bg-[#c49d2a]">
                    {t('getStarted')}
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden flex-shrink-0 p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-4 space-y-3">
            {actionButton && (
              <div className="pb-3 border-b">
                {actionButton}
              </div>
            )}
            
            <div className="pb-3 border-b space-y-2">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Settings</div>
              <LanguageSelector />
              <ThemeToggle />
            </div>

            {user && (
              <Link 
                to={createPageUrl('Dashboard')} 
                className={mobileNavLinkClass('Dashboard')}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('dashboard')}
              </Link>
            )}
            <Link 
              to={createPageUrl('Deals')} 
              className={mobileNavLinkClass('Deals')}
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('deals')}
            </Link>
            <Link 
              to={createPageUrl('Services')} 
              className={mobileNavLinkClass('Services')}
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('services')}
            </Link>
            <Link 
              to={createPageUrl('Insights')} 
              className={mobileNavLinkClass('Insights')}
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('insights')}
            </Link>
            
            {user ? (
              <>
                <Link to={createPageUrl('Messages')} onClick={() => setMobileMenuOpen(false)}>
                  <Button 
                    variant={isActive('Messages') ? 'default' : 'outline'} 
                    className={`w-full ${isActive('Messages') ? 'bg-[#1e3a5f] hover:bg-[#2a4a7f]' : ''}`}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    {t('messages')}
                    {unreadCount > 0 && (
                      <Badge className="ml-2 bg-red-500 text-white">{unreadCount}</Badge>
                    )}
                  </Button>
                </Link>
                {isProvider && (
                  <Link to={createPageUrl('ProviderBilling')} onClick={() => setMobileMenuOpen(false)}>
                    <Button 
                      variant={isActive('ProviderBilling') ? 'default' : 'outline'} 
                      className={`w-full ${isActive('ProviderBilling') ? 'bg-[#d4af37] hover:bg-[#c49d2a]' : ''}`}
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      {t('billing')}
                    </Button>
                  </Link>
                )}
                <Link to={createPageUrl('Profile')} onClick={() => setMobileMenuOpen(false)}>
                  <Button 
                    variant={isActive('Profile') ? 'default' : 'outline'} 
                    className={`w-full ${isActive('Profile') ? 'bg-[#1e3a5f] hover:bg-[#2a4a7f]' : ''}`}
                  >
                    <User className="w-4 h-4 mr-2" />
                    {t('profile')}
                  </Button>
                </Link>
                <Button variant="outline" className="w-full" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  {t('logout')}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" className="w-full" onClick={handleLogin}>
                  {t('signIn')}
                </Button>
                <Link to={createPageUrl('PropertyCapture')} onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-[#d4af37] hover:bg-[#c49d2a]">
                    {t('getStarted')}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
    <ChatWidget isOpen={chatOpen} setIsOpen={setChatOpen} inNavigation={true} />
    </>
  );
}