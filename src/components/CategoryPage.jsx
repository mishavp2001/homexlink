import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function CategoryPage({ type, category, children }) {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to the main page with appropriate filter
    const pageMap = {
      'service': 'Services',
      'deal': 'Deals',
      'insight': 'Insights'
    };
    
    const mainPage = pageMap[type];
    if (mainPage) {
      // For deals, use 'type' param instead of 'category'
      const paramName = type === 'deal' ? 'type' : 'category';
      navigate(`${createPageUrl(mainPage)}?${paramName}=${encodeURIComponent(category)}`, { replace: true });
    }
  }, [type, category, navigate]);

  return children || null;
}