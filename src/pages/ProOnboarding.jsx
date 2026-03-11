import React, { useEffect, useState } from 'react';
import { getCurrentUserProfile, redirectToAppLogin, updateCurrentUserProfile } from '@/api/base44Client';
import { ProviderSettings } from '@/api/entities';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';

export default function ProOnboarding() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  useEffect(() => {
    const completeOnboarding = async () => {
      try {
        const user = await getCurrentUserProfile();
        if (!user) {
          const currentUrl = window.location.href;
          void redirectToAppLogin(currentUrl);
          return;
        }

        const pendingDataStr = localStorage.getItem('pendingProSignup');
        if (!pendingDataStr) {
          navigate(createPageUrl('Dashboard'));
          return;
        }

        const pendingData = JSON.parse(pendingDataStr);

        // Update user with business data
        await updateCurrentUserProfile({
          business_name: pendingData.business_name,
          phone: pendingData.phone,
          service_types: pendingData.service_types,
          service_area: pendingData.service_area,
          description: pendingData.description,
          years_experience: Number(pendingData.years_experience) || 0,
          hourly_rate: Number(pendingData.hourly_rate) || 0,
          certifications: pendingData.certifications,
          user_type: 'service_provider'
        });

        // Create ProviderSettings for billing
        try {
          await ProviderSettings.create({
            provider_email: user.email,
            billing_email: user.email,
            status: 'active'
          });
        } catch (e) {
          console.log('Provider settings creation skipped:', e);
        }

        localStorage.removeItem('pendingProSignup');
        setStatus('success');

        setTimeout(() => {
          navigate(createPageUrl('Dashboard'));
        }, 1500);

      } catch (err) {
        console.error('Onboarding error:', err);
        setError(err.message || 'Failed to complete profile setup');
        setStatus('error');
      }
    };

    completeOnboarding();
  }, [navigate]);

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Setup Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => navigate(createPageUrl('Dashboard'))}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center">
        {status === 'loading' ? (
          <>
            <Loader2 className="w-16 h-16 animate-spin text-[#1e3a5f] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Setting up your profile...</h2>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Welcome Aboard!</h2>
            <p className="text-gray-600 mt-2">Redirecting to dashboard...</p>
          </>
        )}
      </div>
    </div>
  );
}