/// <reference lib="deno.ns" />
import {
  listAmplifyPublicItems,
  mapServiceListingToPublicProvider,
  SERVICE_LISTING_PUBLIC_FIELDS,
} from './_amplifyPublicData.ts';

const LIST_SERVICE_PROVIDERS = `
  query ListServiceProvidersForBusinessLookup($filter: ModelServiceListingFilterInput, $limit: Int, $nextToken: String) {
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
    const { businessName } = await req.json();

    if (!businessName) {
      return Response.json({ error: 'Business name is required' }, { status: 400 });
    }

    const listings = await listAmplifyPublicItems({
      query: LIST_SERVICE_PROVIDERS,
      rootField: 'listServiceListings',
    });

    const listing = listings.find(item =>
      item.business_name && item.business_name.toLowerCase() === businessName.toLowerCase()
    );

    if (!listing) {
      return Response.json({ error: 'Business not found' }, { status: 404 });
    }

    return Response.json({
      success: true,
      ...mapServiceListingToPublicProvider(listing),
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});