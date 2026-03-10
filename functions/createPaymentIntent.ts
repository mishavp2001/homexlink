/// <reference lib="deno.ns" />
import { requireAmplifyUser, toErrorResponse } from './_amplifyAuth.ts';
import Stripe from 'npm:stripe@14.11.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
  try {
    const user = await requireAmplifyUser(req);

    const { amount } = await req.json();
    
    if (!amount || amount < 100) {
      return Response.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // amount in cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        user_id: user.sub || user.username || user.email || 'unknown',
        user_email: user.email || '',
      }
    });

    return Response.json({
      clientSecret: paymentIntent.client_secret,
    });

  } catch (error) {
    console.error('Payment intent error:', error);
    return toErrorResponse(error, 'Failed to create payment intent');
  }
});