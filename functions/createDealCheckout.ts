/// <reference lib="deno.ns" />
import { requireAmplifyUser, toErrorResponse } from './_amplifyAuth.ts';
import { listAmplifyPublicItems } from './_amplifyPublicData.ts';
import Stripe from 'npm:stripe';
import { requireEnv } from './_env.ts';

const createStripeClient = () => new Stripe(requireEnv('STRIPE_SECRET_KEY'));

const FALLBACK_APP_URL = 'https://homexrei.com';

const LIST_DEALS_QUERY = `
  query ListDeals($filter: ModelDealFilterInput, $limit: Int, $nextToken: String) {
    listDeals(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        user_email
        title
        service_category
        photo_urls
        price
      }
      nextToken
    }
  }
`;

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

    const { dealId } = await req.json();
    
    if (!dealId) {
      return Response.json({ error: 'dealId is required' }, { status: 400 });
    }

    if (!user.email) {
      return Response.json({ error: 'Authenticated user email is required' }, { status: 400 });
    }

    const deals = await listAmplifyPublicItems({
      query: LIST_DEALS_QUERY,
      rootField: 'listDeals',
      filter: { id: { eq: dealId } },
      limit: 1,
    });
    const deal = deals[0];
    
    if (!deal) {
      return Response.json({ error: 'Deal not found' }, { status: 404 });
    }

    if (deal.user_email === user.email) {
      return Response.json({ error: 'Cannot purchase your own deal' }, { status: 400 });
    }

    const stripe = createStripeClient();
    const appUrl = resolveAppUrl(req);
    
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
    return toErrorResponse(error, 'Failed to create deal checkout session');
  }
});