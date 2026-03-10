import {
  mapServiceListingToPublicProvider,
  queryAmplifyPublicData,
  SERVICE_LISTING_PUBLIC_FIELDS,
} from './_amplifyPublicData.ts';

declare const Deno: {
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

const GET_SERVICE_PROVIDER_BY_EMAIL = `
  query GetServiceProviderByEmail($email: String!) {
    listServiceListings(filter: { expert_email: { eq: $email } }, limit: 1) {
      items {
        ${SERVICE_LISTING_PUBLIC_FIELDS}
      }
    }
  }
`;

Deno.serve(async (req) => {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    const data = await queryAmplifyPublicData(GET_SERVICE_PROVIDER_BY_EMAIL, { email });
    const listings = Array.isArray(data?.listServiceListings?.items)
      ? data.listServiceListings.items.filter(Boolean)
      : [];
    
    if (listings.length === 0) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    return Response.json(mapServiceListingToPublicProvider(listings[0]));
    
  } catch (error) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
});