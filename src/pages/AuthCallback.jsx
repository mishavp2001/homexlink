import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { handleMobileAuthCallback } from '../components/MobileAuthHandler';

export const isPublic = true;

export default function AuthCallback() {
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    const processCallback = async () => {
      try {
        const handled = await handleMobileAuthCallback();
        
        if (handled) {
          setStatus('success');
        } else {
          // Not a mobile callback, redirect to dashboard
          window.location.href = '/dashboard';
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
      }
    };

    processCallback();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
      <div className="text-center">
        {status === 'processing' && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-[#1e3a5f] mx-auto mb-4" />
            <p className="text-gray-600">Processing authentication...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <p className="text-red-600 mb-4">Authentication failed</p>
            <a href="/" className="text-blue-600 hover:underline">Return to home</a>
          </>
        )}
      </div>
    </div>
  );
}