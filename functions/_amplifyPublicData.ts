/// <reference lib="deno.ns" />
import amplifyOutputs from '../amplify_outputs.json' with { type: 'json' };

const amplifyDataConfig = amplifyOutputs?.data || {};

const getAmplifyPublicDataConfig = () => {
  const endpoint =
    Deno.env.get('AMPLIFY_DATA_URL') ||
    Deno.env.get('AMPLIFY_GRAPHQL_ENDPOINT') ||
    Deno.env.get('VITE_AMPLIFY_GRAPHQL_ENDPOINT') ||
    amplifyDataConfig.url;
  const apiKey =
    Deno.env.get('AMPLIFY_DATA_API_KEY') ||
    Deno.env.get('AMPLIFY_API_KEY') ||
    Deno.env.get('VITE_AMPLIFY_API_KEY') ||
    amplifyDataConfig.api_key;

  if (!endpoint || !apiKey) {
    throw new Error('Amplify public GraphQL configuration is missing.');
  }

  return { endpoint, apiKey };
};

const getErrorMessage = payload => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    return payload.errors[0]?.message || 'Amplify GraphQL request failed.';
  }

  return typeof payload.error === 'string' ? payload.error : null;
};

export const queryAmplifyPublicData = async (query, variables = {}) => {
  const { endpoint, apiKey } = getAmplifyPublicDataConfig();
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({ query, variables }),
  });

  const payload = await response.json();
  const errorMessage = getErrorMessage(payload);

  if (!response.ok || errorMessage) {
    throw new Error(errorMessage || `Amplify GraphQL request failed with status ${response.status}.`);
  }

  if (!payload?.data || typeof payload.data !== 'object') {
    throw new Error('Amplify GraphQL response did not include a data payload.');
  }

  return payload.data;
};

export const listAmplifyPublicItems = async ({ query, rootField, filter, limit = 100 }) => {
  const items = [];
  let nextToken = null;

  do {
    const data = await queryAmplifyPublicData(query, { filter, limit, nextToken });
    const connection = data?.[rootField];

    if (!connection || typeof connection !== 'object') {
      throw new Error(`Amplify GraphQL response did not include the ${rootField} connection.`);
    }

    if (Array.isArray(connection.items)) {
      items.push(...connection.items.filter(Boolean));
    }

    nextToken = typeof connection.nextToken === 'string' && connection.nextToken ? connection.nextToken : null;
  } while (nextToken);

  return items;
};

const parseMaybeJson = value => {
  if (typeof value !== 'string') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

export const SERVICE_LISTING_PUBLIC_FIELDS = `
  id
  expert_email
  expert_name
  business_name
  business_phone
  business_address
  business_photo_url
  website_url
  google_place_id
  bio
  service_category
  service_types
  service_areas
  certifications
  years_in_business
  years_experience
  hourly_rate
  quote_assistant_instructions
  profile_qr_code_url
  price_list
  work_photos
  social_links
  average_rating
  review_count
  is_verified
  status
  createdAt
  updatedAt
`;

export const mapServiceListingToPublicProvider = listing => ({
  id: listing.id,
  email: listing.expert_email,
  expert_email: listing.expert_email,
  expert_name: listing.expert_name,
  user_type: 'service_provider',
  profile_type: 'business',
  bio: listing.bio,
  business_name: listing.business_name,
  business_photo_url: listing.business_photo_url,
  business_phone: listing.business_phone,
  business_address: listing.business_address,
  service_category: listing.service_category,
  service_types: Array.isArray(listing.service_types) ? listing.service_types : [],
  service_areas: Array.isArray(listing.service_areas) ? listing.service_areas : [],
  certifications: Array.isArray(listing.certifications) ? listing.certifications : [],
  years_in_business: listing.years_in_business,
  years_experience: listing.years_experience,
  hourly_rate: listing.hourly_rate,
  website_url: listing.website_url,
  google_place_id: listing.google_place_id,
  social_links: parseMaybeJson(listing.social_links),
  work_photos: parseMaybeJson(listing.work_photos),
  price_list: parseMaybeJson(listing.price_list),
  quote_assistant_instructions: listing.quote_assistant_instructions,
  average_rating: listing.average_rating ?? 0,
  review_count: listing.review_count ?? 0,
  is_verified: Boolean(listing.is_verified),
  status: listing.status,
  profile_qr_code_url: listing.profile_qr_code_url,
  createdAt: listing.createdAt,
  updatedAt: listing.updatedAt,
});