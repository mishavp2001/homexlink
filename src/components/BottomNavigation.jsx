import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, DollarSign, Wrench, Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { Message } from '@/api/entities';

export default function BottomNavigation({ user }) {
  const location = useLocation();

  // Get unread message count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unreadMessages', user?.email],
    queryFn: async () => {
      if (!user) return 0;
      const messages = await Message.list();
      const received = messages.filter(m => 
        m.recipient_email === user.email && !m.is_read
      );
      return received.length;
    },
    enabled: !!user,
    refetchInterval: 30000
  });

  const isActive = (pageName) => {
    const currentPath = location.pathname.toLowerCase();
    const pageNameLower = pageName.toLowerCase();
    return currentPath.endsWith(`/${pageNameLower}`) || 
           currentPath.includes(`/${pageNameLower}?`) ||
           currentPath === `/${pageNameLower}` ||
           (currentPath === '/' && pageNameLower === 'dashboard');
  };

  const tabs = user ? [
    { name: 'Deals', icon: DollarSign, path: createPageUrl('Deals') },
    { name: 'Services', icon: Wrench, path: createPageUrl('Services') },
    { name: 'Insights', icon: Lightbulb, path: createPageUrl('Insights') },
    { name: 'Dashboard', icon: Home, path: createPageUrl('Dashboard') }
  ] : [
    { name: 'Deals', icon: DollarSign, path: createPageUrl('Deals') },
    { name: 'Services', icon: Wrench, path: createPageUrl('Services') },
    { name: 'Insights', icon: Lightbulb, path: createPageUrl('Insights') },
    { name: 'Home', icon: Home, path: createPageUrl('Landing') }
  ];

  // Show on Deals, Services, Insights pages (even when not logged in), and Dashboard when logged in
  const currentPath = location.pathname.toLowerCase();
  const shouldShow = currentPath.includes('/deals') || 
                     currentPath.includes('/services') || 
                     currentPath.includes('/insights') ||
                     (user && currentPath.includes('/dashboard'));
  
  if (!shouldShow) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-50 pb-safe select-none">
      <div className={`grid ${user ? 'grid-cols-4' : 'grid-cols-4'} h-16`}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.name);
          
          return (
            <Link
              key={tab.name}
              to={tab.path}
              onClick={(e) => {
                if (active) {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  window.history.pushState({}, '', tab.path);
                  window.location.href = tab.path;
                }
              }}
              className={`flex flex-col items-center justify-center gap-1 transition-colors select-none ${
                active 
                  ? 'text-[#1e3a5f] dark:text-[#d4af37]' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className="relative">
                <Icon className="w-6 h-6" />
                {tab.badge > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1.5 py-0 min-w-[18px] h-4 flex items-center justify-center select-none">
                    {tab.badge}
                  </Badge>
                )}
              </div>
              <span className={`text-xs select-none ${active ? 'font-semibold' : 'font-medium'}`}>
                {tab.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}