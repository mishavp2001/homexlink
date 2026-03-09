import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Use service role to bypass RLS and fetch all users
    const users = await base44.asServiceRole.entities.User.list();
    
    // Filter for service providers with business profiles
    const serviceProviders = users.filter(u => 
      u.user_type === 'service_provider' && 
      u.profile_type === 'business' && 
      u.service_types?.length > 0
    );
    
    return Response.json(serviceProviders);
  } catch (error) {
    console.error('Error fetching service providers:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});