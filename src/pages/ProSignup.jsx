import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { buildLoginUrl } from '@/lib/login-route';
import { createPageUrl } from '@/utils';

export default function ProSignup() {
  useEffect(() => {
    // Mark that user is going through pro signup flow
    localStorage.setItem('proSignupFlow', 'true');
    
    // Redirect to signup/login immediately
    const dashboardUrl = window.location.origin + createPageUrl('Dashboard') + '?setup=business';
    window.location.assign(buildLoginUrl(dashboardUrl, { mode: 'signUp' }));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center">
        <Loader2 className="w-16 h-16 animate-spin text-[#1e3a5f] mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Redirecting to signup...</h2>
        <p className="text-gray-600 mt-2">You'll complete your business profile after creating your account</p>
      </div>
    </div>
  );
}