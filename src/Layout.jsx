import React, { useEffect, useState } from 'react';
import { AuthProvider } from '@/components/lib/AuthContext';
import { TranslationProvider } from '@/components/lib/TranslationContext';
import { getCurrentUserProfile } from '@/api/base44Client';
import { PageMetadata } from '@/api/entities';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import BottomNavigation from '@/components/BottomNavigation';
import { useTabState } from '@/components/TabStateManager';

export default function Layout({ children, currentPageName }) {
  const [pageMetadata, setPageMetadata] = useState(null);
  const [user, setUser] = useState(null);
  const location = useLocation();
  
  // Manage tab state and scroll preservation
  useTabState();

  // Load user for bottom navigation
  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUserProfile();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    // Fetch AI-generated metadata for current page
    const fetchMetadata = async () => {
      try {
        const metadata = await PageMetadata.filter({ 
          page_name: currentPageName 
        });
        if (metadata && metadata.length > 0) {
          setPageMetadata(metadata[0]);
        }
      } catch (error) {
        console.error('Error fetching page metadata:', error);
      }
    };

    if (currentPageName) {
      fetchMetadata();
    }
  }, [currentPageName]);

  useEffect(() => {
    // Get site name from domain
    const hostname = window.location.hostname;
    const domain = hostname.split('.')[0];
    let siteName;
    if (domain.toLowerCase().startsWith('homes') && domain.length > 5) {
      siteName = 'Homes' + domain.charAt(5).toUpperCase() + domain.slice(6);
    } else if (domain.toLowerCase().startsWith('home') && domain.length > 4) {
      siteName = 'Home' + domain.charAt(4).toUpperCase() + domain.slice(5);
    } else {
      siteName = domain.charAt(0).toUpperCase() + domain.slice(1);
    }
    
    // Use AI-generated metadata if available, otherwise use defaults
    const metaTitle = pageMetadata?.meta_title || `${siteName} - control home expenses | use best service`;
    const metaDescription = pageMetadata?.meta_description || 'Control home expenses with AI-powered property management. Connect with verified service providers, discover exclusive real estate deals, and digitize your property portfolio. Free home ownership platform.';
    const metaKeywords = pageMetadata?.meta_keywords || 'home management, property management, home expenses, real estate deals, service providers, home maintenance, property digitization, AI home assistant, home services marketplace';
    const ogTitle = pageMetadata?.og_title || `${siteName} - Control Home Expenses | Verified Service Providers | Exclusive Deals`;
    const ogDescription = pageMetadata?.og_description || 'AI-powered home management platform. Track expenses, connect with verified service providers, discover exclusive real estate deals. Free property digitization and maintenance tracking.';
    const twitterTitle = pageMetadata?.twitter_title || `${siteName} - Control Home Expenses | Verified Service Providers`;
    const twitterDescription = pageMetadata?.twitter_description || 'AI-powered home management. Track expenses, connect with verified service providers, discover exclusive real estate deals. Free property digitization.';
    
    // Set document title
    document.title = metaTitle;
    
    // Add or update meta tags
    const updateMetaTag = (name, content, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Set viewport meta tag
    updateMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');


    // Basic SEO meta tags
    updateMetaTag('description', metaDescription);
    updateMetaTag('keywords', metaKeywords);
    updateMetaTag('author', siteName);
    updateMetaTag('robots', 'index, follow');
    
    // Open Graph meta tags
    updateMetaTag('og:title', ogTitle, true);
    updateMetaTag('og:description', ogDescription, true);
    updateMetaTag('og:type', 'website', true);
    updateMetaTag('og:url', window.location.href, true);
    updateMetaTag('og:site_name', siteName, true);

    // Twitter Card meta tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', twitterTitle);
    updateMetaTag('twitter:description', twitterDescription);
    
    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', window.location.href.split('?')[0]);

    // Structured Data (Schema.org JSON-LD)
    let structuredDataScript = document.querySelector('#structured-data');
    if (!structuredDataScript) {
      structuredDataScript = document.createElement('script');
      structuredDataScript.id = 'structured-data';
      structuredDataScript.type = 'application/ld+json';
      document.head.appendChild(structuredDataScript);
    }
    
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": siteName,
      "url": window.location.origin,
      "description": "AI-powered home management platform. Control expenses, connect with verified service providers, discover exclusive real estate deals. Free property digitization and maintenance tracking.",
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${window.location.origin}/deals?search={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    };
    structuredDataScript.textContent = JSON.stringify(structuredData);

    // Initialize Google Ads
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = 'https://www.googletagmanager.com/gtag/js?id=AW-17861560470';
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'AW-17861560470');
    `;
    document.head.appendChild(script2);

    // Initialize second Google Tag
    const script3 = document.createElement('script');
    script3.async = true;
    script3.src = 'https://www.googletagmanager.com/gtag/js?id=AW-17861477364';
    document.head.appendChild(script3);

    const script4 = document.createElement('script');
    script4.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'AW-17861477364');
    `;
    document.head.appendChild(script4);

    return () => {
      // Cleanup scripts on unmount
      if (script1.parentNode) script1.parentNode.removeChild(script1);
      if (script2.parentNode) script2.parentNode.removeChild(script2);
      if (script3.parentNode) script3.parentNode.removeChild(script3);
      if (script4.parentNode) script4.parentNode.removeChild(script4);
    };
  }, [pageMetadata]);

  // Define root tab pages and landing
  const rootTabs = ['dashboard', 'deals', 'services', 'messages', 'landing', 'insights', ''];
  const currentPath = location.pathname.toLowerCase().split('/').pop() || '';
  const isRootTab = rootTabs.includes(currentPath);
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const canGoBack = isMobile && window.history.length > 1 && !isRootTab;

  return (
    <TranslationProvider>
      <AuthProvider>
        {canGoBack && (
          <div className="md:hidden fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-40 pt-safe">
            <div className="flex items-center px-4 h-14">
              <button
                onClick={() => window.history.back()}
                className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">Back</span>
              </button>
            </div>
          </div>
          )}
          <div className={canGoBack ? 'md:pt-0' : ''} style={{ paddingTop: canGoBack ? 'calc(3.5rem + env(safe-area-inset-top))' : '0' }}>
          {children}
          </div>
        <BottomNavigation user={user} />
      </AuthProvider>
    </TranslationProvider>
  );
}