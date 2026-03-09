/// <reference lib="deno.ns" />
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.11.0';
import { Resend } from 'npm:resend@3.2.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await req.json();
    
    if (!sessionId) {
      return Response.json({ error: 'Session ID required' }, { status: 400 });
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      return Response.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    console.log('Verifying payment for session:', sessionId);

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    console.log('Session status:', session.payment_status);
    console.log('Payment type:', session.metadata.payment_type);
    
    if (session.payment_status !== 'paid') {
      return Response.json({ 
        success: false,
        status: session.payment_status,
        message: 'Payment not completed'
      });
    }

    // Verify this session belongs to the current user
    if (session.metadata.user_id !== user.id) {
      console.error('Session user mismatch:', session.metadata.user_id, 'vs', user.id);
      return Response.json({ 
        error: 'Session does not belong to current user' 
      }, { status: 403 });
    }

    // Handle different payment types
    if (session.metadata.payment_type === 'deal') {
      // Deal purchase - no action needed here, webhook already created booking
      const dealId = session.metadata.deal_id;
      
      return Response.json({
        success: true,
        paymentType: 'deal',
        dealId: dealId,
        message: 'Service deal purchase successful!'
      });

    } else if (session.metadata.payment_type === 'invoice') {
    // Update invoice statuses to paid
    const invoiceIds = JSON.parse(session.metadata.invoice_ids || '[]');

    console.log('Marking invoices as paid:', invoiceIds);

    for (const invoiceId of invoiceIds) {
      await base44.entities.LeadCharge.update(invoiceId, {
        status: 'paid',
        payment_date: new Date().toISOString(),
        payment_method: 'stripe_checkout'
      });
    }

    // Send confirmation email
    await resend.emails.send({
      from: 'HomeXREI <onboarding@resend.dev>',
      to: user.email,
      subject: 'Invoice Payment Confirmation',
      html: `
        <h1>Payment Successful</h1>
        <p>Your payment for ${invoiceIds.length} invoice(s) has been processed successfully.</p>
        <p>Thank you for your business!</p>
      `
    });

    return Response.json({
      success: true,
      paymentType: 'invoice',
      invoicesPaid: invoiceIds.length,
      message: 'Invoices successfully paid!'
    });

    } else {
    // Credit purchase
    const creditsToAdd = parseFloat(session.metadata.credits_to_add);

    console.log('Adding credits:', creditsToAdd, 'to user:', user.email);

    const currentCredits = user.credits || 0;
    const newBalance = currentCredits + creditsToAdd;

    await base44.auth.updateMe({
      credits: newBalance
    });

    console.log(`✅ Added ${creditsToAdd} credits to user ${user.email}. New balance: ${newBalance}`);

    // Send confirmation email
    await resend.emails.send({
      from: 'HomeXREI <onboarding@resend.dev>',
      to: user.email,
      subject: 'Credits Purchased',
      html: `
        <h1>Credits Added</h1>
        <p>You have successfully purchased <strong>${creditsToAdd}</strong> credits.</p>
        <p>Your new balance is: <strong>${newBalance}</strong></p>
        <p>Thank you!</p>
      `
    });

    return Response.json({
      success: true,
      paymentType: 'credits',
      creditsAdded: creditsToAdd,
      newBalance: newBalance,
      message: 'Credits successfully added to your account!'
    });
    }

  } catch (error) {
    console.error('Payment verification error:', error);
    return Response.json({ 
      error: error.message || 'Failed to verify payment',
      details: error.stack
    }, { status: 500 });
  }
});