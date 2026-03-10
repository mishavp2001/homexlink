/// <reference lib="deno.ns" />
import { requireAmplifyUser, toErrorResponse } from './_amplifyAuth.ts';
import Stripe from 'npm:stripe@14.11.0';

const FALLBACK_APP_URL = 'https://homexrei.com';

const resolveAppUrl = (req: Request) => {
  for (const candidate of [req.headers.get('x-origin-url'), req.headers.get('origin'), req.headers.get('referer')]) {
    if (!candidate) {
      continue;
    }

    try {
      return new URL(candidate).origin;
    } catch (error) {
      console.error('Failed to parse app URL from request header:', candidate, error);
    }
  }

  return FALLBACK_APP_URL;
};

Deno.serve(async (req) => {
  try {
    const user = await requireAmplifyUser(req);

    const { amount, invoiceIds } = await req.json();
    
    if (!amount || amount < 100) {
      return Response.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      return Response.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    const appUrl = resolveAppUrl(req);
    const userIdentifier = user.sub || user.username || user.email || 'unknown';

    console.log('Creating checkout session for user:', user.email);
    console.log('Amount:', amount, 'Invoice IDs:', invoiceIds);
    console.log('App URL:', appUrl);

    let lineItems;
    let metadata = {
      user_id: userIdentifier,
      user_email: user.email || '',
    };

    // Check if this is for invoices or credits
    if (invoiceIds && invoiceIds.length > 0) {
      // Invoice payment
      lineItems = [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Lead Invoices Payment (${invoiceIds.length} invoice${invoiceIds.length > 1 ? 's' : ''})`,
              description: 'Payment for qualified leads received',
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ];
      metadata.invoice_ids = JSON.stringify(invoiceIds);
      metadata.payment_type = 'invoice';
    } else {
      // Credit purchase
      const credits = amount / 100;
      lineItems = [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${credits} Video Generation Credits`,
              description: `Purchase ${credits} credits for AI video generation`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ];
      metadata.credits_to_add = credits.toString();
      metadata.payment_type = 'credits';
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${appUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: invoiceIds ? `${appUrl}/ProviderBilling` : `${appUrl}/Insights`,
      metadata: metadata,
      customer_email: user.email || undefined,
    });

    console.log('Checkout session created:', session.id);

    return Response.json({
      url: session.url,
      sessionId: session.id,
    });

  } catch (error) {
    console.error('Checkout session error:', error);
    return toErrorResponse(error, 'Failed to create checkout session');
  }
});