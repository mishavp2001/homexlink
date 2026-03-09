/// <reference lib="deno.ns" />
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Check if user is authenticated
    let user = null;
    try {
      user = await base44.auth.me();
    } catch (e) {
      // User not authenticated
    }

    const body = await req.json();
    const { code, placeId, businessData } = body;
    
    if (!code || !businessData || !businessData.phone) {
      return Response.json({ error: 'Missing required fields: code and businessData with phone' }, { status: 400 });
    }
    
    console.log('Verifying phone:', businessData.phone);
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const verifySid = Deno.env.get('TWILIO_VERIFY_SERVICE_SID');

    if (!accountSid || !authToken || !verifySid) {
      return Response.json({ error: 'Twilio Verify not configured' }, { status: 500 });
    }

    // Check verification using Twilio Verify API
    const verifyUrl = `https://verify.twilio.com/v2/Services/${verifySid}/VerificationCheck`;
    const verifyResponse = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: businessData.phone,
        Code: code
      })
    });

    if (!verifyResponse.ok) {
      const error = await verifyResponse.text();
      console.error('Twilio Verify error:', error);
      return Response.json({ error: 'Failed to verify code' }, { status: 500 });
    }

    const result = await verifyResponse.json();
    
    if (result.status !== 'approved') {
      return Response.json({ error: 'Invalid or expired verification code' }, { status: 400 });
    }

    // If user is not authenticated, return success but indicate auth is required
    if (!user) {
      return Response.json({ 
        success: true, 
        requiresAuth: true,
        message: 'Phone verified. Please create an account to continue.' 
      });
    }

    // Update user profile with business info
    await base44.auth.updateMe({
      user_type: 'service_provider',
      profile_type: 'business',
      business_name: businessData.name,
      business_phone: businessData.phone,
      business_address: businessData.address,
      website_url: businessData.website || '',
      google_place_id: placeId
    });

    // Create or update ServiceListing
    const existingListings = await base44.asServiceRole.entities.ServiceListing.filter({ 
      expert_email: user.email 
    });
    
    if (existingListings.length === 0) {
      await base44.asServiceRole.entities.ServiceListing.create({
        expert_email: user.email,
        status: 'active',
        average_rating: businessData.rating || 0,
        review_count: businessData.user_ratings_total || 0
      });
    } else {
      await base44.asServiceRole.entities.ServiceListing.update(existingListings[0].id, {
        status: 'active',
        average_rating: businessData.rating || 0,
        review_count: businessData.user_ratings_total || 0
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error verifying SMS code:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});