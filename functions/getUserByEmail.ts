/// <reference lib="deno.ns" />
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    // Initialize with service role for public profile viewing
    const base44 = createClientFromRequest(req);
    
    const { email } = await req.json();
    
    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    // Fetch only from ServiceListing - no Users table access
    const listings = await base44.asServiceRole.entities.ServiceListing.filter({ expert_email: email });
    
    if (listings.length === 0) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    const serviceListing = listings[0];
    
    // Return service listing data
    return Response.json({ 
      email: serviceListing.expert_email,
      user_type: 'service_provider',
      profile_type: 'business',
      bio: serviceListing.bio,
      business_name: serviceListing.business_name,
      business_photo_url: serviceListing.business_photo_url,
      business_phone: serviceListing.business_phone,
      business_address: serviceListing.business_address,
      service_types: serviceListing.service_types,
      service_areas: serviceListing.service_areas,
      certifications: serviceListing.certifications,
      years_in_business: serviceListing.years_in_business,
      website_url: serviceListing.website_url,
      social_links: serviceListing.social_links,
      work_photos: serviceListing.work_photos,
      price_list: serviceListing.price_list,
      quote_assistant_instructions: serviceListing.quote_assistant_instructions
    });
    
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});