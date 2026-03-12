import { secret } from '@aws-amplify/backend';

// These root-level `functions/*.ts` handlers still run through the legacy Deno runtime,
// not Amplify `defineFunction(...)` resources yet. Keep the key inventory here so the
// migration target is explicit while preserving the existing runtime topology.
export const legacyFunctionSecrets = {
  AMPLIFY_API_KEY: secret('AMPLIFY_API_KEY'),
  AMPLIFY_DATA_API_KEY: secret('AMPLIFY_DATA_API_KEY'),
  GOOGLE_PLACES_API_KEY: secret('GOOGLE_PLACES_API_KEY'),
  OPENAI_API_KEY: secret('OPENAI_API_KEY'),
  RAPIDAPI_KEY: secret('RAPIDAPI_KEY'),
  RESEND_API_KEY: secret('RESEND_API_KEY'),
  STRIPE_SECRET_KEY: secret('STRIPE_SECRET_KEY'),
  TWILIO_ACCOUNT_SID: secret('TWILIO_ACCOUNT_SID'),
  TWILIO_AUTH_TOKEN: secret('TWILIO_AUTH_TOKEN'),
  TWILIO_PHONE_NUMBER: secret('TWILIO_PHONE_NUMBER'),
  TWILIO_VERIFY_SERVICE_SID: secret('TWILIO_VERIFY_SERVICE_SID'),
  VITE_AMPLIFY_API_KEY: secret('VITE_AMPLIFY_API_KEY'),
  YOUTUBE_API_KEY: secret('YOUTUBE_API_KEY'),
} as const;

export const legacyFunctionEnvironmentKeys = [
  'AMPLIFY_AUTH_REGION',
  'AMPLIFY_AUTH_USER_POOL_CLIENT_ID',
  'AMPLIFY_AUTH_USER_POOL_ID',
  'AMPLIFY_DATA_URL',
  'AMPLIFY_GRAPHQL_ENDPOINT',
  'APP_URL',
  'AWS_REGION',
  'OPENAI_METADATA_MODEL',
  'OPENAI_MODEL',
  'VITE_AMPLIFY_GRAPHQL_ENDPOINT',
] as const;