import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const rootTabs = ['dashboard', 'deals', 'services', 'messages'];

export function useTabState() {
  const location = useLocation();

  useEffect(() => {
    const currentPath = location.pathname.toLowerCase().split('/').pop() || '';
    const isRootTab = rootTabs.includes(currentPath);

    // Save scroll position when leaving a root tab
    if (isRootTab) {
      const scrollKey = `scroll_${currentPath}`;
      const handleScroll = () => {
        sessionStorage.setItem(scrollKey, window.scrollY.toString());
      };
      
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [location.pathname]);

  useEffect(() => {
    const currentPath = location.pathname.toLowerCase().split('/').pop() || '';
    const isRootTab = rootTabs.includes(currentPath);

    // Restore scroll position when entering a root tab
    if (isRootTab) {
      const scrollKey = `scroll_${currentPath}`;
      const savedScroll = sessionStorage.getItem(scrollKey);
      
      if (savedScroll) {
        // Use timeout to ensure content is rendered
        setTimeout(() => {
          window.scrollTo(0, parseInt(savedScroll));
        }, 0);
      }
    } else {
      // For non-root tabs, scroll to top
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);
}