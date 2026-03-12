const isNode = typeof window === 'undefined';

const LEGACY_RUNTIME_PREFIX = ['base', '44'].join('');
const LEGACY_APP_ID_ENV_NAME = ['VITE_', 'BASE', '44', '_APP_ID'].join('');
const LEGACY_BACKEND_URL_ENV_NAME = ['VITE_', 'BASE', '44', '_BACKEND_URL'].join('');

const toSnakeCase = str => str.replace(/([A-Z])/g, '_$1').toLowerCase();

const getStorageKeys = paramName => {
  const suffix = toSnakeCase(paramName);
  return [`homexlink_${suffix}`, `${LEGACY_RUNTIME_PREFIX}_${suffix}`];
};

const getStoredValue = storageKeys => {
  for (const storageKey of storageKeys) {
    const storedValue = window.localStorage.getItem(storageKey);
    if (storedValue) {
      return storedValue;
    }
  }

  return null;
};

const setStoredValue = (storageKey, value) => {
  if (value === undefined || value === null || value === '') {
    return;
  }

  window.localStorage.setItem(storageKey, value);
};

const getEnvDefault = (primaryName, legacyName) => import.meta.env[primaryName] || import.meta.env[legacyName];

const getAppParamValue = (paramName, { defaultValue = undefined, removeFromUrl = false } = {}) => {
  if (isNode) {
    return defaultValue ?? null;
  }

  const [storageKey, ...legacyStorageKeys] = getStorageKeys(paramName);
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get(paramName);

  if (removeFromUrl) {
    urlParams.delete(paramName);
    const newUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ''}${window.location.hash}`;
    window.history.replaceState({}, document.title, newUrl);
  }

  if (searchParam) {
    setStoredValue(storageKey, searchParam);
    return searchParam;
  }

  if (defaultValue !== undefined && defaultValue !== null) {
    setStoredValue(storageKey, defaultValue);
    return defaultValue;
  }

  return getStoredValue([storageKey, ...legacyStorageKeys]);
};

const getAppParams = () => ({
  appId: getAppParamValue('app_id', { defaultValue: getEnvDefault('VITE_APP_ID', LEGACY_APP_ID_ENV_NAME) }),
  serverUrl: getAppParamValue('server_url', { defaultValue: getEnvDefault('VITE_BACKEND_URL', LEGACY_BACKEND_URL_ENV_NAME) }),
  token: getAppParamValue('access_token', { removeFromUrl: true }),
  fromUrl: getAppParamValue('from_url', { defaultValue: isNode ? null : window.location.href }),
  functionsVersion: getAppParamValue('functions_version'),
});

export const appParams = {
  ...getAppParams(),
};
