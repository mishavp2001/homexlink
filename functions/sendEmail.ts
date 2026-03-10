/// <reference lib="deno.ns" />
import { Resend } from 'npm:resend@3.2.0';
import { requireAmplifyUser, toErrorResponse } from './_amplifyAuth.ts';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
  try {
    await requireAmplifyUser(req);

    const { to, subject, html, text, from } = await req.json();

    if (!to || !subject || (!html && !text)) {
      return Response.json({ error: 'Missing required fields (to, subject, html/text)' }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: from || 'HomeXREI <onboarding@resend.dev>',
      to: Array.isArray(to) ? to : [to],
      subject: subject,
      html: html,
      text: text
    });

    if (error) {
      console.error('Resend error:', error);
      return Response.json({ error: error }, { status: 400 });
    }

    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Send email error:', error);
    return toErrorResponse(error, 'Failed to send email');
  }
});