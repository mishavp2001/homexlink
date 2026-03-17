import { defineFunction, secret } from '@aws-amplify/backend';

export const searchGooglePlacesFunction = defineFunction({
  name: 'search-google-places',
  entry: './handler.ts',
  timeoutSeconds: 30,
  environment: {
    GOOGLE_PLACES_API_KEY: secret('GOOGLE_PLACES_API_KEY'),
  },
});