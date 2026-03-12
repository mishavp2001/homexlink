/// <reference lib="deno.ns" />
import { HttpError, requireAmplifyUser, toErrorResponse } from './_amplifyAuth.ts';
import { getEnv } from './_env.ts';

Deno.serve(async (req) => {
  try {
    const user = await requireAmplifyUser(req);

    if (!user.isAdmin) {
      throw new HttpError(403, 'Forbidden: Admin access required');
    }

    const { phoneNumber, businessName, claimUrl } = await req.json();

    if (!phoneNumber || !claimUrl) {
      return Response.json({ error: 'Phone number and claim URL are required' }, { status: 400 });
    }

    const accountSid = getEnv('TWILIO_ACCOUNT_SID');
    const authToken = getEnv('TWILIO_AUTH_TOKEN');
    const fromPhoneNumber = getEnv('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !fromPhoneNumber) {
      return Response.json({ error: 'Twilio SMS not configured' }, { status: 500 });
    }

    const message = `Hi! We'd like to invite "${businessName}" to join our home services platform. Claim your free business profile here: ${claimUrl}`;

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const formData = new URLSearchParams();
    formData.append('To', phoneNumber);
    formData.append('From', fromPhoneNumber);
    formData.append('Body', message);

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const result = await response.json();

    if (!response.ok) {
      return Response.json({ error: 'Failed to send SMS', details: result }, { status: 500 });
    }

    return Response.json({ success: true, messageSid: result.sid });
  } catch (error) {
    return toErrorResponse(error, 'Failed to send claim SMS');
  }
});