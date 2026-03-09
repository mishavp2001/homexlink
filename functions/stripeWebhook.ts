/// <reference lib="deno.ns" />
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

Deno.serve(async (req) => {
  try {
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();
    
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return Response.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    console.log('Webhook event:', event.type);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { dealId, buyerEmail, sellerEmail, dealTitle } = session.metadata;

      console.log('Processing payment for deal:', dealId);

      const base44 = createClientFromRequest(req);
      
      const qrData = `DEAL-${dealId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrData)}&format=png`;

      const booking = await base44.asServiceRole.entities.Booking.create({
        deal_id: dealId,
        booking_type: 'deal_purchase',
        renter_email: buyerEmail,
        renter_name: buyerEmail,
        owner_email: sellerEmail,
        total_cost: session.amount_total / 100,
        status: 'paid',
        payment_status: 'paid',
        payment_intent_id: session.payment_intent,
        payment_amount: session.amount_total / 100,
        qr_code_data: qrData,
        qr_code_url: qrCodeUrl,
        redeemed: false,
        property_address: dealTitle
      });

      console.log('Booking created:', booking.id);

      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: buyerEmail,
          subject: `Your Deal Purchase Confirmation - ${dealTitle}`,
          body: `Thank you for your purchase!

Deal: ${dealTitle}
Amount Paid: $${(session.amount_total / 100).toFixed(2)}

Your QR Code for Redemption:
${qrCodeUrl}

IMPORTANT: Show this QR code to the service provider to redeem your deal.

You can also find your QR code anytime in your Dashboard.

Enjoy your service!

---
HomeXREI Team`
        });
        console.log('Email sent to buyer');
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
      }

      try {
        await base44.asServiceRole.entities.Message.create({
          sender_email: 'noreply@homexrei.com',
          sender_name: 'HomeXREI',
          recipient_email: sellerEmail,
          recipient_name: sellerEmail,
          subject: `New Deal Purchase - ${dealTitle}`,
          content: `You have a new deal purchase!

Buyer: ${buyerEmail}
Deal: ${dealTitle}
Amount: $${(session.amount_total / 100).toFixed(2)}

The customer will present a QR code for redemption. You can verify and redeem QR codes in your Dashboard.`,
          thread_id: `deal_purchase_${booking.id}`,
          reference_type: 'deal',
          reference_id: dealId,
          is_read: false
        });
        console.log('Message sent to seller');
      } catch (msgError) {
        console.error('Failed to create message:', msgError);
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});