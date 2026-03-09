import { Amplify } from 'aws-amplify';

const csvToList = value =>
  String(value || '')
    .split(',')
    .map(entry => entry.trim())
    .filter(Boolean);

const firstNonEmpty = (...values) => values.find(value => Boolean(value)) || '';

const mapAuthMode = value => {
  const normalized = String(value || '').trim().toUpperCase();

  switch (normalized) {
    case 'AMAZON_COGNITO_USER_POOLS':
    case 'USER_POOL':
    case 'USERPOOLS':
      return 'userPool';
    case 'API_KEY':
    case 'APIKEY':
      return 'apiKey';
    case 'AWS_IAM':
    case 'IAM':
      return 'iam';
    case 'OPENID_CONNECT':
    case 'OIDC':
      return 'oidc';
    case 'AWS_LAMBDA':
    case 'LAMBDA':
      return 'lambda';
    default:
      return '';
  }
};

const env = /** @type {Record<string, string | undefined>} */ ((/** @type {any} */ (import.meta)).env || {});

const amplifyOutputsModules = import.meta.glob('../../amplify_outputs.json', {
  eager: true,
  import: 'default',
});

const [amplifyOutputs = null] = Object.values(amplifyOutputsModules);

const outputsAuth = amplifyOutputs?.auth || {};
const outputsData = amplifyOutputs?.data || {};

const envRuntimeConfig = {
  region: env.VITE_AMPLIFY_REGION || env.VITE_AWS_REGION || env.VITE_AWS_PROJECT_REGION || '',
  userPoolId: env.VITE_AMPLIFY_USER_POOL_ID || '',
  userPoolClientId: env.VITE_AMPLIFY_USER_POOL_CLIENT_ID || '',
  identityPoolId: env.VITE_AMPLIFY_IDENTITY_POOL_ID || '',
  graphqlEndpoint: env.VITE_AMPLIFY_GRAPHQL_ENDPOINT || '',
  graphqlRegion: env.VITE_AMPLIFY_GRAPHQL_REGION || env.VITE_AMPLIFY_REGION || env.VITE_AWS_REGION || env.VITE_AWS_PROJECT_REGION || '',
  apiKey: env.VITE_AMPLIFY_API_KEY || '',
  defaultAuthMode: mapAuthMode(env.VITE_AMPLIFY_DEFAULT_AUTH_MODE) || 'userPool',
  oauthDomain: env.VITE_AMPLIFY_OAUTH_DOMAIN || '',
  oauthScopes: csvToList(env.VITE_AMPLIFY_OAUTH_SCOPES || 'openid,email,profile'),
  redirectSignIn: csvToList(env.VITE_AMPLIFY_REDIRECT_SIGN_IN),
  redirectSignOut: csvToList(env.VITE_AMPLIFY_REDIRECT_SIGN_OUT),
  oauthResponseType: env.VITE_AMPLIFY_OAUTH_RESPONSE_TYPE || 'code',
};

export const amplifyRuntimeConfig = {
  region: firstNonEmpty(outputsAuth.aws_region, outputsData.aws_region, envRuntimeConfig.region),
  userPoolId: firstNonEmpty(outputsAuth.user_pool_id, envRuntimeConfig.userPoolId),
  userPoolClientId: firstNonEmpty(outputsAuth.user_pool_client_id, envRuntimeConfig.userPoolClientId),
  identityPoolId: firstNonEmpty(outputsAuth.identity_pool_id, envRuntimeConfig.identityPoolId),
  graphqlEndpoint: firstNonEmpty(outputsData.url, envRuntimeConfig.graphqlEndpoint),
  graphqlRegion: firstNonEmpty(outputsData.aws_region, outputsAuth.aws_region, envRuntimeConfig.graphqlRegion),
  apiKey: firstNonEmpty(outputsData.api_key, envRuntimeConfig.apiKey),
  defaultAuthMode: firstNonEmpty(mapAuthMode(outputsData.default_authorization_type), envRuntimeConfig.defaultAuthMode, 'userPool'),
  oauthDomain: envRuntimeConfig.oauthDomain,
  oauthScopes: envRuntimeConfig.oauthScopes,
  redirectSignIn: envRuntimeConfig.redirectSignIn,
  redirectSignOut: envRuntimeConfig.redirectSignOut,
  oauthResponseType: envRuntimeConfig.oauthResponseType,
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