import { createPageUrl } from '@/utils';

export const buildLoginUrl = (nextUrl, { mode = null } = {}) => {
  const loginPath = createPageUrl('Login');
  const searchParams = new URLSearchParams();

  if (nextUrl) {
    searchParams.set('next', nextUrl);
  }

  if (mode) {
    searchParams.set('mode', mode);
  }

  const queryString = searchParams.toString();
  return queryString ? `${loginPath}?${queryString}` : loginPath;
};