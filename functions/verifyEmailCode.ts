import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, code } = await req.json();

    if (!email || !code) {
      return Response.json({ error: 'Email and code are required' }, { status: 400 });
    }

    // Verify the OTP code
    const { user, error } = await base44.auth.verifyOtp({
      email: email,
      otpCode: code
    });

    if (error) {
      return Response.json({ 
        error: error.message || 'Invalid verification code' 
      }, { status: 400 });
    }

    // Mark user as verified
    if (user && user.id) {
      await base44.asServiceRole.entities.User.update(user.id, {
        is_verified: true
      });
    }

    return Response.json({ success: true, user });
  } catch (error) {
    console.error('Email verification error:', error);
    return Response.json({ 
      error: error.message || 'Invalid verification code' 
    }, { status: 400 });
  }
});