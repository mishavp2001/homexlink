import { defineBackend } from '@aws-amplify/backend';

import { auth } from './auth/resource';
import { data } from './data/resource';
import { searchGooglePlacesFunction } from './functions/search-google-places/resource';

export { legacyFunctionEnvironmentKeys, legacyFunctionSecrets } from './legacy-function-env';

defineBackend({
  auth,
  data,
  searchGooglePlacesFunction,
});