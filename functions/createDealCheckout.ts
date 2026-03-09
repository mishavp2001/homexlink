/// <reference lib="deno.ns" />
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { dealId } = await req.json();
    
    if (!dealId) {
      return Response.json({ error: 'dealId is required' }, { status: 400 });
    }

    const deals = await base44.asServiceRole.entities.Deal.filter({ id: dealId });
    const deal = deals[0];
    
    if (!deal) {
      return Response.json({ error: 'Deal not found' }, { status: 404 });
    }

    if (deal.user_email === user.email) {
      return Response.json({ error: 'Cannot purchase your own deal' }, { status: 400 });
    }

    // Get the origin from request or referer header
    const origin = req.headers.get('origin') || req.headers.get('referer');
    let appUrl = 'https://homexrei.com'; // fallback
    
    if (origin) {
      try {
        const url = new URL(origin);
        appUrl = url.origin;
      } catch (e) {
        console.error('Failed to parse origin URL:', e);
      }
    }
    
    console.log('Using app URL for checkout:', appUrl);
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: deal.title,
            description: `Service Deal - ${deal.service_category || 'Service'}`,
            images: deal.photo_urls?.length > 0 ? [deal.photo_urls[0]] : []
          },
          unit_amount: Math.round(deal.price * 100)
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: `${appUrl}/dashboard?payment=success&dealId=${dealId}`,
      cancel_url: `${appUrl}/deals`,
      metadata: {
        dealId: deal.id,
        buyerEmail: user.email,
        sellerEmail: deal.user_email,
        dealTitle: deal.title
      }
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});