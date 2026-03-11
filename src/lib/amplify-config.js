import { Amplify } from 'aws-amplify';
import amplifyOutputs from '../../amplify_outputs.json';

/**
 * @typedef {{
 *   domain?: string,
 *   scopes?: string[],
 *   redirect_sign_in_uri?: string[],
 *   redirect_sign_out_uri?: string[],
 *   response_type?: string,
 *   identity_providers?: string | string[],
 * }} AmplifyOutputsOAuth
 */

/**
 * @typedef {{
 *   aws_region?: string,
 *   user_pool_id?: string,
 *   user_pool_client_id?: string,
 *   identity_pool_id?: string,
 *   oauth?: AmplifyOutputsOAuth,
 * }} AmplifyOutputsAuth
 */

/**
 * @typedef {{
 *   aws_region?: string,
 *   url?: string,
 *   api_key?: string,
 *   default_authorization_type?: string,
 * }} AmplifyOutputsData
 */

/** @param {string | string[] | null | undefined} value */
const csvToList = value =>
  String(value || '')
    .split(',')
    .map(entry => entry.trim())
    .filter(Boolean);

/** @param {...(string | null | undefined)} values */
const firstNonEmpty = (...values) => values.find(value => Boolean(value)) || '';

/** @param {...(string[] | null | undefined)} values */
const firstNonEmptyList = (...values) => values.find(value => Array.isArray(value) && value.length) || [];

/** @param {string | null | undefined} value */
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

/** @param {string | null | undefined} value */
const mapOAuthResponseType = value => {
  const normalized = String(value || '').trim().toLowerCase();

  if (normalized === 'token') {
    return 'token';
  }

  return normalized ? 'code' : '';
};

/** @param {string | null | undefined} value */
const mapOAuthProvider = value => {
  const normalized = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');

  switch (normalized) {
    case 'GOOGLE':
      return 'Google';
    case 'FACEBOOK':
      return 'Facebook';
    case 'LOGIN_WITH_AMAZON':
    case 'AMAZON':
      return 'Amazon';
    case 'SIGN_IN_WITH_APPLE':
    case 'APPLE':
      return 'Apple';
    default:
      return '';
  }
};

/** @param {string | string[] | null | undefined} value */
const mapOAuthProviders = value => {
  const values = Array.isArray(value) ? value : csvToList(value);
  return [...new Set(values.map(mapOAuthProvider).filter(Boolean))];
};

const importMeta = /** @type {{ env?: Record<string, string | undefined> }} */ (/** @type {unknown} */ (import.meta));
const env = /** @type {Record<string, string | undefined>} */ (importMeta.env || {});

const amplifyOutputsConfig = /** @type {{ auth?: AmplifyOutputsAuth, data?: AmplifyOutputsData }} */ (amplifyOutputs || {});
const outputsAuth = amplifyOutputsConfig.auth || {};
const outputsData = amplifyOutputsConfig.data || {};
const outputsOAuth = outputsAuth.oauth || {};

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
  oauthResponseType: mapOAuthResponseType(env.VITE_AMPLIFY_OAUTH_RESPONSE_TYPE) || 'code',
  oauthProviders: mapOAuthProviders(env.VITE_AMPLIFY_OAUTH_PROVIDERS),
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
  oauthDomain: firstNonEmpty(outputsOAuth.domain, envRuntimeConfig.oauthDomain),
  oauthScopes: firstNonEmptyList(outputsOAuth.scopes, envRuntimeConfig.oauthScopes),
  redirectSignIn: firstNonEmptyList(outputsOAuth.redirect_sign_in_uri, envRuntimeConfig.redirectSignIn),
  redirectSignOut: firstNonEmptyList(outputsOAuth.redirect_sign_out_uri, envRuntimeConfig.redirectSignOut),
  oauthResponseType: firstNonEmpty(mapOAuthResponseType(outputsOAuth.response_type), envRuntimeConfig.oauthResponseType),
  oauthProviders: firstNonEmptyList(mapOAuthProviders(outputsOAuth.identity_providers), envRuntimeConfig.oauthProviders),
};

export const isAmplifyRuntimeEnabled = Boolean(
  amplifyRuntimeConfig.region &&
    amplifyRuntimeConfig.userPoolId &&
    amplifyRuntimeConfig.userPoolClientId &&
    amplifyRuntimeConfig.graphqlEndpoint,
);

const hasAmplifyOauthConfig = Boolean(
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

  if (hasAmplifyOauthConfig) {
    config.Auth.Cognito.loginWith.oauth = {
      domain: amplifyRuntimeConfig.oauthDomain,
      scopes: amplifyRuntimeConfig.oauthScopes,
      redirectSignIn: amplifyRuntimeConfig.redirectSignIn,
      redirectSignOut: amplifyRuntimeConfig.redirectSignOut,
      responseType: amplifyRuntimeConfig.oauthResponseType,
      ...(amplifyRuntimeConfig.oauthProviders.length
        ? { providers: amplifyRuntimeConfig.oauthProviders }
        : {}),
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