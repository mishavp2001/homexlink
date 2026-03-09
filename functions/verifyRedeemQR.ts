/// <reference lib="deno.ns" />
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { qrData, action } = await req.json();
    
    if (!qrData) {
      return Response.json({ error: 'qrData is required' }, { status: 400 });
    }

    const bookings = await base44.asServiceRole.entities.Booking.filter({ 
      qr_code_data: qrData 
    });
    
    if (bookings.length === 0) {
      return Response.json({ error: 'QR code not found', valid: false }, { status: 404 });
    }

    const booking = bookings[0];

    if (booking.owner_email !== user.email) {
      return Response.json({ error: 'Unauthorized - not your booking', valid: false }, { status: 403 });
    }

    if (booking.redeemed) {
      return Response.json({ 
        error: 'Already redeemed', 
        valid: false,
        booking,
        redeemed_date: booking.redeemed_date 
      }, { status: 400 });
    }

    if (action === 'verify') {
      return Response.json({ 
        valid: true, 
        booking,
        message: 'Valid QR code - ready to redeem'
      });
    }

    if (action === 'redeem') {
      const updated = await base44.asServiceRole.entities.Booking.update(booking.id, {
        redeemed: true,
        redeemed_date: new Date().toISOString(),
        redeemed_by: user.email,
        status: 'redeemed'
      });

      try {
        await base44.asServiceRole.entities.Message.create({
          sender_email: user.email,
          sender_name: user.full_name || user.email,
          recipient_email: booking.renter_email,
          recipient_name: booking.renter_name,
          subject: `Deal Redeemed - ${booking.property_address}`,
          content: `Your deal has been successfully redeemed!

Deal: ${booking.property_address}
Redeemed on: ${new Date().toLocaleString()}
Redeemed by: ${user.full_name || user.email}

Thank you for using HomeXREI!`,
          thread_id: `redemption_${booking.id}`,
          reference_type: 'deal',
          reference_id: booking.deal_id,
          is_read: false
        });
      } catch (msgError) {
        console.error('Failed to send confirmation message:', msgError);
      }

      return Response.json({ 
        success: true, 
        booking: updated,
        message: 'Deal redeemed successfully!'
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('QR verification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});