import { useEffect, useMemo } from 'react';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import { Loader2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { amplifySocialProviders } from '@/lib/amplify-config';
import {
  AMPLIFY_POST_LOGIN_REDIRECT_KEY,
  restorePostLoginRedirect,
} from '@/utils/mobileAuth';

export const isPublic = true;

const homeXLinkMark = new URL('../assets/homexlink-mark.svg', import.meta.url).href;

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

function AuthRouteHeading({ title, subtitle }) {
  return (
    <div className="space-y-2 pb-2 text-center">
      <h1 className="text-[2rem] font-semibold tracking-tight text-slate-900">{title}</h1>
      <p className="text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

function SignInHeader() {
  return (
    <AuthRouteHeading
      title="Welcome to HomeXLink"
      subtitle="Sign in to continue"
    />
  );
}

function SignUpHeader() {
  return (
    <AuthRouteHeading
      title="Create your account"
      subtitle="Join HomeXLink to keep everything in one place"
    />
  );
}

function ForgotPasswordHeader() {
  return (
    <AuthRouteHeading
      title="Reset your password"
      subtitle="We’ll send a verification code to your email"
    />
  );
}

function SignInFooter() {
  const { toForgotPassword, toSignUp } = useAuthenticator(context => [
    context.toForgotPassword,
    context.toSignUp,
  ]);

  return (
    <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-sm">
      <button
        type="button"
        onClick={toForgotPassword}
        className="font-semibold text-blue-600 transition hover:text-blue-700"
      >
        Forgot password?
      </button>
      <span className="text-slate-300">•</span>
      <button
        type="button"
        onClick={toSignUp}
        className="font-semibold text-blue-600 transition hover:text-blue-700"
      >
        Sign up
      </button>
    </div>
  );
}

function SignUpFooter() {
  const { toSignIn } = useAuthenticator(context => [context.toSignIn]);

  return (
    <div className="mt-2 text-center text-sm text-slate-500">
      Already have an account?{' '}
      <button
        type="button"
        onClick={toSignIn}
        className="font-semibold text-blue-600 transition hover:text-blue-700"
      >
        Sign in
      </button>
    </div>
  );
}

const AUTHENTICATOR_COMPONENTS = {
  SignIn: {
    Header: SignInHeader,
    Footer: SignInFooter,
  },
  SignUp: {
    Header: SignUpHeader,
    Footer: SignUpFooter,
  },
  ForgotPassword: {
    Header: ForgotPasswordHeader,
  },
};

const AUTHENTICATOR_FORM_FIELDS = {
  signIn: {
    username: {
      label: 'Email address',
      placeholder: 'you@example.com',
      type: 'email',
    },
    password: {
      label: 'Password',
      placeholder: 'Enter your password',
    },
  },
  signUp: {
    email: {
      label: 'Email address',
      placeholder: 'you@example.com',
      order: 1,
    },
    password: {
      label: 'Password',
      placeholder: 'Create a password',
      order: 2,
    },
    confirm_password: {
      label: 'Confirm password',
      placeholder: 'Confirm your password',
      order: 3,
    },
  },
  forgotPassword: {
    username: {
      label: 'Email address',
      placeholder: 'you@example.com',
    },
  },
  confirmResetPassword: {
    confirmation_code: {
      label: 'Verification code',
      placeholder: 'Enter the code from your email',
    },
    password: {
      label: 'New password',
      placeholder: 'Choose a new password',
    },
    confirm_password: {
      label: 'Confirm new password',
      placeholder: 'Confirm your new password',
    },
  },
};

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.14),_transparent_38%),linear-gradient(180deg,_#f8fbff_0%,_#eff5fb_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md flex-col items-center justify-center gap-5">
        <div className="relative w-full pt-14 sm:pt-16">
          <div className="absolute left-1/2 top-0 z-10 flex h-24 w-24 -translate-x-1/2 items-center justify-center rounded-full border border-slate-200/80 bg-white shadow-[0_20px_45px_-24px_rgba(15,23,42,0.45)]">
            <img src={homeXLinkMark} alt="HomeXLink" className="h-16 w-16" />
          </div>

          <div className="rounded-[2rem] border border-white/80 bg-white/95 px-6 pb-8 pt-14 shadow-[0_32px_70px_-36px_rgba(15,23,42,0.45)] backdrop-blur sm:px-8">
            <div className="login-authenticator-shell">
              <Authenticator
                key={`${initialState}:${redirectTarget}`}
                className="login-authenticator"
                components={AUTHENTICATOR_COMPONENTS}
                formFields={AUTHENTICATOR_FORM_FIELDS}
                initialState={initialState}
                loginMechanisms={['email']}
                signUpAttributes={['email']}
                socialProviders={amplifySocialProviders}
              >
                {() => <AuthenticatedLoginRedirect redirectTarget={redirectTarget} />}
              </Authenticator>
            </div>
          </div>
        </div>

        <div className="w-full text-center">
          <a href={createPageUrl('Landing')} className="text-sm font-medium text-slate-600 transition hover:text-slate-900 hover:underline">
            Return to home
          </a>
        </div>
      </div>
    </div>
  );
}