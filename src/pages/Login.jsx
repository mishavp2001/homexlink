import { useEffect, useMemo } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import { Loader2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  AMPLIFY_POST_LOGIN_REDIRECT_KEY,
  restorePostLoginRedirect,
} from '@/utils/mobileAuth';

export const isPublic = true;

const getDashboardUrl = () => `${window.location.origin}${createPageUrl('Dashboard')}`;

/** @param {string} search */
const getRedirectTarget = search => {
  const params = new URLSearchParams(search);
  return params.get('next') || params.get('from_url') || getDashboardUrl();
};

/** @param {string} search */
const isSignupFlow = search => {
  const params = new URLSearchParams(search);
  const explicitMode = String(params.get('mode') || '').toLowerCase();

  if (explicitMode === 'signup') {
    return true;
  }

  const redirectTarget = params.get('next') || params.get('from_url') || '';

  try {
    const targetUrl = new URL(redirectTarget, window.location.origin);
    return params.get('signup') === 'true' || targetUrl.searchParams.get('signup') === 'true';
  } catch {
    return params.get('signup') === 'true';
  }
};

/** @param {{ redirectTarget: string }} props */
function AuthenticatedLoginRedirect({ redirectTarget }) {
  useEffect(() => {
    const fallbackUrl = getDashboardUrl();
    const redirected = restorePostLoginRedirect({
      fallbackUrl,
      includeLegacyParams: true,
    });

    if (!redirected) {
      window.location.assign(fallbackUrl);
    }
  }, [redirectTarget]);

  return (
    <div className="text-center py-12">
      <Loader2 className="w-12 h-12 animate-spin text-[#1e3a5f] mx-auto mb-4" />
      <p className="text-gray-600">Finishing sign in...</p>
    </div>
  );
}

export default function Login() {
  const location = useLocation();
  const redirectTarget = useMemo(() => getRedirectTarget(location.search), [location.search]);
  const initialState = useMemo(
    () => (isSignupFlow(location.search) ? 'signUp' : 'signIn'),
    [location.search],
  );

  useEffect(() => {
    sessionStorage.setItem(AMPLIFY_POST_LOGIN_REDIRECT_KEY, redirectTarget);
  }, [redirectTarget]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
      <div className="w-full max-w-md px-4 py-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-[#1e3a5f] mb-2">HomeXLink</h1>
          <p className="text-gray-600">
            {initialState === 'signUp' ? 'Create your account' : 'Sign in to continue'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <Authenticator
            key={`${initialState}:${redirectTarget}`}
            initialState={initialState}
            socialProviders={['facebook', 'google']}
            loginMechanisms={['email']}
            signUpAttributes={['email']}
          >
            {() => <AuthenticatedLoginRedirect redirectTarget={redirectTarget} />}
          </Authenticator>
        </div>

        <div className="text-center mt-6">
          <a href={createPageUrl('Landing')} className="text-blue-600 hover:underline">
            Return to home
          </a>
        </div>
      </div>
    </div>
  );
}