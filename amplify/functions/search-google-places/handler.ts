import type { Schema } from '../../data/resource';

type GooglePlacesSearchResponse = {
  error_message?: string;
  results?: Array<GooglePlaceSearchResult>;
  status?: string;
};

type GooglePlaceSearchResult = {
  formatted_address?: string;
  name?: string;
  photos?: Array<{ photo_reference?: string | null }>;
  place_id?: string;
  rating?: number;
  types?: string[];
  user_ratings_total?: number;
};

type GooglePlaceDetailsResponse = {
  result?: {
    formatted_phone_number?: string;
    international_phone_number?: string;
    website?: string;
  };
  status?: string;
};

const requireEnv = (name: string) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }
  return value;
};

const asJson = async <T>(response: Response) => response.json() as Promise<T>;

export const handler: Schema['searchGooglePlaces']['functionHandler'] = async event => {
  const { query, location } = event.arguments;
  const apiKey = requireEnv('GOOGLE_PLACES_API_KEY');

  const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}${location ? `&location=${encodeURIComponent(location)}` : ''}&key=${apiKey}`;
  const searchResponse = await fetch(searchUrl);
  const searchPayload = await asJson<GooglePlacesSearchResponse>(searchResponse);

  if (!searchResponse.ok) {
    throw new Error(searchPayload.error_message || 'Google Places search request failed.');
  }

  if (searchPayload.status !== 'OK' && searchPayload.status !== 'ZERO_RESULTS') {
    throw new Error(searchPayload.error_message || `Google Places API error: ${searchPayload.status || 'UNKNOWN_ERROR'}`);
  }

  const places = await Promise.all((searchPayload.results || []).map(async place => {
    if (!place.place_id) {
      return null;
    }

    try {
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(place.place_id)}&fields=name,formatted_address,formatted_phone_number,international_phone_number,website,photos,types&key=${apiKey}`;
      const detailsResponse = await fetch(detailsUrl);
      const detailsPayload = await asJson<GooglePlaceDetailsResponse>(detailsResponse);

      return {
        place_id: place.place_id,
        name: place.name || null,
        address: place.formatted_address || null,
        phone: detailsPayload.result?.international_phone_number || detailsPayload.result?.formatted_phone_number || null,
        website: detailsPayload.result?.website || null,
        types: place.types || null,
        rating: place.rating ?? null,
        user_ratings_total: place.user_ratings_total ?? null,
        photo_url: place.photos?.[0]?.photo_reference
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${apiKey}`
          : null,
      };
    } catch {
      return {
        place_id: place.place_id,
        name: place.name || null,
        address: place.formatted_address || null,
        phone: null,
        website: null,
        types: place.types || null,
        rating: place.rating ?? null,
        user_ratings_total: place.user_ratings_total ?? null,
        photo_url: null,
      };
    }
  }));

  return {
    places: places.filter(Boolean),
  };
};