/// <reference lib="deno.ns" />
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { businessName } = await req.json();

    if (!businessName) {
      return Response.json({ error: 'Business name is required' }, { status: 400 });
    }

    // Fetch all users (service role needed to access user data)
    const users = await base44.asServiceRole.entities.User.list();
    
    // Find user by business name (case-insensitive match)
    const user = users.find(u => 
      u.business_name && 
      u.business_name.toLowerCase() === businessName.toLowerCase()
    );

    if (!user) {
      return Response.json({ error: 'Business not found' }, { status: 404 });
    }

    // Return only public info
    return Response.json({
      success: true,
      email: user.email,
      business_name: user.business_name
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});