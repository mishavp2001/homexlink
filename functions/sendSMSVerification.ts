/// <reference lib="deno.ns" />

Deno.serve(async (req) => {
  try {
    const { phoneNumber } = await req.json();
    
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const verifySid = Deno.env.get('TWILIO_VERIFY_SERVICE_SID');

    if (!accountSid || !authToken || !verifySid) {
      return Response.json({ error: 'Twilio Verify not configured' }, { status: 500 });
    }

    // Start verification using Twilio Verify API
    const verifyUrl = `https://verify.twilio.com/v2/Services/${verifySid}/Verifications`;
    console.log(verifyUrl);
    const verifyResponse = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: phoneNumber,
        Channel: 'sms'
      })
    });

    if (!verifyResponse.ok) {
      const error = await verifyResponse.text();
      console.error('Twilio Verify error:', error);
      return Response.json({ error: 'Failed to send verification code' }, { status: 500 });
    }

    const result = await verifyResponse.json();
    return Response.json({ success: true, status: result.status });
  } catch (error) {
    console.error('Error sending verification:', error);
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
});