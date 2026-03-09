import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { query, location } = await req.json();
    
    console.log('Searching Google Places:', { query, location });
    
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!apiKey) {
      console.error('GOOGLE_PLACES_API_KEY not set');
      return Response.json({ error: 'Google Places API key not configured' }, { status: 500 });
    }

    // Use Text Search API
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}${location ? `&location=${location}` : ''}&key=${apiKey}`;
    console.log('Search URL:', searchUrl.replace(apiKey, 'HIDDEN'));
    
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    console.log('Google API Response:', { status: data.status, resultCount: data.results?.length || 0 });
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google API Error:', data.error_message || data.status);
      return Response.json({ error: data.error_message || `Google Places API error: ${data.status}`, status: data.status }, { status: 500 });
    }

    // Fetch details for each place to get phone numbers
    const placesWithDetails = await Promise.all(
      (data.results || []).map(async (place) => {
        try {
          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,international_phone_number,website,photos,types&key=${apiKey}`;
          const detailsResponse = await fetch(detailsUrl);
          const detailsData = await detailsResponse.json();
          
          console.log('Place details for', place.name, ':', { status: detailsData.status, hasPhone: !!detailsData.result?.international_phone_number });
          
          return {
            place_id: place.place_id,
            name: place.name,
            address: place.formatted_address,
            phone: detailsData.result?.international_phone_number || detailsData.result?.formatted_phone_number,
            website: detailsData.result?.website,
            types: place.types,
            rating: place.rating,
            user_ratings_total: place.user_ratings_total,
            photo_url: place.photos?.[0] ? 
              `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${apiKey}` : 
              null
          };
        } catch (err) {
          console.error('Error fetching details for place:', place.name, err);
          return {
            place_id: place.place_id,
            name: place.name,
            address: place.formatted_address,
            phone: null,
            website: null,
            types: place.types,
            rating: place.rating,
            user_ratings_total: place.user_ratings_total,
            photo_url: null
          };
        }
      })
    );

    console.log('Returning', placesWithDetails.length, 'places');
    return Response.json({ places: placesWithDetails });
  } catch (error) {
    console.error('Error searching Google Places:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});