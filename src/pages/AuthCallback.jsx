import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { restorePostLoginRedirect } from '@/utils/mobileAuth';
import { createPageUrl } from '@/utils';

export const isPublic = true;

const wait = ms => new Promise(resolve => {
  window.setTimeout(resolve, ms);
});

const waitForAuthenticatedSession = async () => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      if (await base44.auth.isAuthenticated()) {
        return true;
      }
    } catch (error) {
      console.debug('Waiting for auth session during callback completion:', error);
    }

    await wait(250);
  }

  return false;
};

export default function AuthCallback() {
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    let isMounted = true;

    const processCallback = async () => {
      try {
        const isAuthenticated = await waitForAuthenticatedSession();

        if (!isMounted) {
          return;
        }

        if (!isAuthenticated) {
          setStatus('error');
          return;
        }

        setStatus('success');

        const redirected = restorePostLoginRedirect({
          fallbackUrl: `${window.location.origin}${createPageUrl('Dashboard')}`,
          includeLegacyParams: true,
        });

        if (!redirected) {
          window.location.assign(createPageUrl('Dashboard'));
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        if (isMounted) {
          setStatus('error');
        }
      }
    };

    processCallback();

    return () => {
      isMounted = false;
    };
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