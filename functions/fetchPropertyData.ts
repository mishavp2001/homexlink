/// <reference lib="deno.ns" />
import { requireAmplifyUser, toErrorResponse } from './_amplifyAuth.ts';

Deno.serve(async (req) => {
  try {
    await requireAmplifyUser(req);

    const { address } = await req.json();

    if (!address) {
      return Response.json({ error: 'Address is required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('RAPIDAPI_KEY');
    if (!apiKey) {
      return Response.json({ error: 'RapidAPI key not configured' }, { status: 500 });
    }

    // Use RapidAPI Realtor API
    const response = await fetch(`https://realtor16.p.rapidapi.com/property/details?address=${encodeURIComponent(address)}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'realtor16.p.rapidapi.com'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      return Response.json({ 
        error: 'Failed to fetch property data', 
        details: error 
      }, { status: response.status });
    }

    const result = await response.json();

    // Parse and structure the property data from RapidAPI Realtor
    if (result && result.data) {
      const propertyData = result.data;
      
      // Extract photos (up to 3)
      let photos = [];
      if (propertyData.photos && Array.isArray(propertyData.photos)) {
        photos = propertyData.photos.slice(0, 3).map(p => p.href || p);
      }
      
      return Response.json({
        success: true,
        property: {
          address: propertyData.location?.address?.line || propertyData.address || address,
          description: propertyData.description?.text || propertyData.public_record?.description || propertyData.property_history?.[0]?.event_name || null,
          sqft: propertyData.description?.sqft || propertyData.building_size?.size || null,
          bedrooms: propertyData.description?.beds || null,
          bathrooms: propertyData.description?.baths || null,
          year_built: propertyData.description?.year_built || null,
          property_type: propertyData.description?.type?.toLowerCase().replace(/\s+/g, '_') || 'single_family',
          lot_size: propertyData.description?.lot_sqft || null,
          appraised_value: propertyData.list_price || propertyData.price || null,
          photos: photos,
          raw_data: propertyData
        }
      });
    }

    return Response.json({
      success: false,
      error: 'No property data found for this address'
    });

  } catch (error) {
    console.error('Error fetching property data:', error);
    return toErrorResponse(error, 'Failed to fetch property data');
  }
});