import { Amplify } from 'aws-amplify';

const csvToList = value =>
  String(value || '')
    .split(',')
    .map(entry => entry.trim())
    .filter(Boolean);

const env = /** @type {Record<string, string | undefined>} */ ((/** @type {any} */ (import.meta)).env || {});

export const amplifyRuntimeConfig = {
  region: env.VITE_AMPLIFY_REGION || env.VITE_AWS_REGION || env.VITE_AWS_PROJECT_REGION || '',
  userPoolId: env.VITE_AMPLIFY_USER_POOL_ID || '',
  userPoolClientId: env.VITE_AMPLIFY_USER_POOL_CLIENT_ID || '',
  identityPoolId: env.VITE_AMPLIFY_IDENTITY_POOL_ID || '',
  graphqlEndpoint: env.VITE_AMPLIFY_GRAPHQL_ENDPOINT || '',
  graphqlRegion: env.VITE_AMPLIFY_GRAPHQL_REGION || env.VITE_AMPLIFY_REGION || env.VITE_AWS_REGION || env.VITE_AWS_PROJECT_REGION || '',
  apiKey: env.VITE_AMPLIFY_API_KEY || '',
  defaultAuthMode: env.VITE_AMPLIFY_DEFAULT_AUTH_MODE || 'userPool',
  oauthDomain: env.VITE_AMPLIFY_OAUTH_DOMAIN || '',
  oauthScopes: csvToList(env.VITE_AMPLIFY_OAUTH_SCOPES || 'openid,email,profile'),
  redirectSignIn: csvToList(env.VITE_AMPLIFY_REDIRECT_SIGN_IN),
  redirectSignOut: csvToList(env.VITE_AMPLIFY_REDIRECT_SIGN_OUT),
  oauthResponseType: env.VITE_AMPLIFY_OAUTH_RESPONSE_TYPE || 'code',
};

export const isAmplifyRuntimeEnabled = Boolean(
  amplifyRuntimeConfig.region &&
    amplifyRuntimeConfig.userPoolId &&
    amplifyRuntimeConfig.userPoolClientId &&
    amplifyRuntimeConfig.graphqlEndpoint,
);

export const canUseManagedAmplifyLogin = Boolean(
  isAmplifyRuntimeEnabled &&
    amplifyRuntimeConfig.oauthDomain &&
    amplifyRuntimeConfig.redirectSignIn.length &&
    amplifyRuntimeConfig.redirectSignOut.length,
);

const buildAmplifyConfig = () => {
  if (!isAmplifyRuntimeEnabled) {
    return null;
  }

  const config = /** @type {any} */ ({
    Auth: {
      Cognito: {
        userPoolId: amplifyRuntimeConfig.userPoolId,
        userPoolClientId: amplifyRuntimeConfig.userPoolClientId,
        ...(amplifyRuntimeConfig.identityPoolId
          ? { identityPoolId: amplifyRuntimeConfig.identityPoolId }
          : {}),
        loginWith: {
          email: true,
        },
      },
    },
    API: {
      GraphQL: {
        endpoint: amplifyRuntimeConfig.graphqlEndpoint,
        region: amplifyRuntimeConfig.graphqlRegion,
        defaultAuthMode: amplifyRuntimeConfig.defaultAuthMode,
        ...(amplifyRuntimeConfig.apiKey ? { apiKey: amplifyRuntimeConfig.apiKey } : {}),
      },
    },
  });

  if (canUseManagedAmplifyLogin) {
    config.Auth.Cognito.loginWith.oauth = {
      domain: amplifyRuntimeConfig.oauthDomain,
      scopes: amplifyRuntimeConfig.oauthScopes,
      redirectSignIn: amplifyRuntimeConfig.redirectSignIn,
      redirectSignOut: amplifyRuntimeConfig.redirectSignOut,
      responseType: amplifyRuntimeConfig.oauthResponseType,
    };
  }

  return config;
};

let isConfigured = false;

export const configureAmplify = () => {
  if (isConfigured || !isAmplifyRuntimeEnabled) {
    return false;
  }

  Amplify.configure(/** @type {any} */ (buildAmplifyConfig()));
  isConfigured = true;
  return true;
};