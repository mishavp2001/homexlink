/// <reference lib="deno.ns" />
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { Resend } from 'npm:resend@3.2.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Require authentication
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    return Response.json({ error: error.message }, { status: 500 });
  }
});