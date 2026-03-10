import {
  listAmplifyPublicItems,
  mapServiceListingToPublicProvider,
  SERVICE_LISTING_PUBLIC_FIELDS,
} from './_amplifyPublicData.ts';

const LIST_SERVICE_PROVIDERS = `
  query ListServiceProviders($filter: ModelServiceListingFilterInput, $limit: Int, $nextToken: String) {
    listServiceListings(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        ${SERVICE_LISTING_PUBLIC_FIELDS}
      }
      nextToken
    }
  }
`;

Deno.serve(async (req) => {
  try {
    req;

    const listings = await listAmplifyPublicItems({
      query: LIST_SERVICE_PROVIDERS,
      rootField: 'listServiceListings',
    });

    const serviceProviders = listings
      .map(mapServiceListingToPublicProvider)
      .filter(provider => provider.business_name && provider.service_types?.length > 0);
    
    return Response.json(serviceProviders);
  } catch (error) {
    console.error('Error fetching service providers:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});