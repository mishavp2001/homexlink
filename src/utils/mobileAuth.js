export const AMPLIFY_POST_LOGIN_REDIRECT_KEY = 'amplify_post_login_redirect';

const CUSTOM_APP_SCHEME_PREFIXES = ['homexlink://', 'com.homexlink.app://'];

const isCustomAppRedirect = value => (
  typeof value === 'string' && CUSTOM_APP_SCHEME_PREFIXES.some(prefix => value.startsWith(prefix))
);

const normalizeRedirectTarget = value => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  if (isCustomAppRedirect(trimmedValue)) {
    return trimmedValue;
  }

  try {
    const url = new URL(trimmedValue, window.location.origin);

    if (!['http:', 'https:'].includes(url.protocol)) {
      return null;
    }

    if (url.origin !== window.location.origin) {
      return null;
    }

    return url.toString();
  } catch (error) {
    console.warn('Ignoring invalid post-login redirect target:', trimmedValue, error);
    return null;
  }
};

const consumeStoredPostLoginRedirect = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const target = sessionStorage.getItem(AMPLIFY_POST_LOGIN_REDIRECT_KEY);

  if (target) {
    sessionStorage.removeItem(AMPLIFY_POST_LOGIN_REDIRECT_KEY);
  }

  return target;
};

const getLegacyCallbackRedirectTarget = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  return params.get('from_url') || params.get('next');
};

export const restorePostLoginRedirect = ({ fallbackUrl = null, includeLegacyParams = false } = {}) => {
  if (typeof window === 'undefined') {
    return false;
  }

  const storedTarget = normalizeRedirectTarget(consumeStoredPostLoginRedirect());
  const legacyTarget = includeLegacyParams
    ? normalizeRedirectTarget(getLegacyCallbackRedirectTarget())
    : null;
  const fallbackTarget = normalizeRedirectTarget(fallbackUrl);

  let target = storedTarget || legacyTarget || fallbackTarget;

  if (!target) {
    return false;
  }

  if (!isCustomAppRedirect(target)) {
    const currentUrl = normalizeRedirectTarget(window.location.href);

    if (target === currentUrl) {
      if (!fallbackTarget || fallbackTarget === currentUrl) {
        return false;
      }

      target = fallbackTarget;
    }
  }

  window.location.assign(target);
  return true;
};
