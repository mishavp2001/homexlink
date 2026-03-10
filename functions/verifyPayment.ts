/// <reference lib="deno.ns" />
import Stripe from 'npm:stripe@14.11.0';
import { Resend } from 'npm:resend@3.2.0';
import { requireAmplifyUser, toErrorResponse } from './_amplifyAuth.ts';
import { listAmplifyPrivateItems, queryAmplifyPrivateData } from './_amplifyPrivateData.ts';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const LIST_USER_PROFILES_QUERY = `
  query ListUserProfiles($filter: ModelUserProfileFilterInput, $limit: Int, $nextToken: String) {
    listUserProfiles(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        email
        credits
      }
      nextToken
    }
  }
`;

const CREATE_USER_PROFILE_MUTATION = `
  mutation CreateUserProfile($input: CreateUserProfileInput!) {
    createUserProfile(input: $input) {
      id
      email
      credits
    }
  }
`;

const UPDATE_USER_PROFILE_MUTATION = `
  mutation UpdateUserProfile($input: UpdateUserProfileInput!) {
    updateUserProfile(input: $input) {
      id
      email
      credits
    }
  }
`;

const UPDATE_LEAD_CHARGE_MUTATION = `
  mutation UpdateLeadCharge($input: UpdateLeadChargeInput!) {
    updateLeadCharge(input: $input) {
      id
      status
      paid_at
    }
  }
`;

const getExpectedSessionOwners = user => [user.sub, user.username, user.email].filter(Boolean);

const getSessionOwner = metadata => metadata?.user_id || metadata?.user_email || metadata?.buyerEmail || null;

const findUserProfileByEmail = async (authToken, email) => {
  const profiles = await listAmplifyPrivateItems({
    authToken,
    query: LIST_USER_PROFILES_QUERY,
    rootField: 'listUserProfiles',
    filter: { email: { eq: email } },
    limit: 1,
  });

  return profiles[0] || null;
};

const upsertUserCredits = async (user, credits) => {
  if (!user.email) {
    throw new Error('Authenticated user email is missing.');
  }

  const existingProfile = await findUserProfileByEmail(user.authToken, user.email);
  if (existingProfile?.id) {
    const data = await queryAmplifyPrivateData(user.authToken, UPDATE_USER_PROFILE_MUTATION, {
      input: { id: existingProfile.id, credits },
    });
    return data.updateUserProfile;
  }

  const data = await queryAmplifyPrivateData(user.authToken, CREATE_USER_PROFILE_MUTATION, {
    input: {
      email: user.email,
      full_name: user.email,
      role: user.isAdmin ? 'admin' : 'member',
      credits,
    },
  });
  return data.createUserProfile;
};

Deno.serve(async (req) => {
  try {
    const user = await requireAmplifyUser(req);

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
    const metadata = session.metadata || {};
    
    console.log('Session status:', session.payment_status);
    console.log('Payment type:', metadata.payment_type);
    
    if (session.payment_status !== 'paid') {
      return Response.json({ 
        success: false,
        status: session.payment_status,
        message: 'Payment not completed'
      });
    }

    // Verify this session belongs to the current user
    const sessionOwner = getSessionOwner(metadata);
    if (!sessionOwner || !getExpectedSessionOwners(user).includes(sessionOwner)) {
      console.error('Session user mismatch:', sessionOwner, 'vs', getExpectedSessionOwners(user));
      return Response.json({ 
        error: 'Session does not belong to current user' 
      }, { status: 403 });
    }

    // Handle different payment types
    if (metadata.payment_type === 'deal') {
      // Deal purchase - no action needed here, webhook already created booking
      const dealId = metadata.deal_id || metadata.dealId;
      
      return Response.json({
        success: true,
        paymentType: 'deal',
        dealId: dealId,
        message: 'Service deal purchase successful!'
      });

    } else if (metadata.payment_type === 'invoice') {
    // Update invoice statuses to paid
    const rawInvoiceIds = JSON.parse(metadata.invoice_ids || '[]');
    const invoiceIds = Array.isArray(rawInvoiceIds) ? rawInvoiceIds.filter(id => typeof id === 'string' && id) : [];
    const paidAt = new Date().toISOString();

    console.log('Marking invoices as paid:', invoiceIds);

    for (const invoiceId of invoiceIds) {
      await queryAmplifyPrivateData(user.authToken, UPDATE_LEAD_CHARGE_MUTATION, {
        input: {
          id: invoiceId,
          status: 'paid',
          paid_at: paidAt,
        },
      });
    }

    // Send confirmation email
    if (user.email) {
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
    }

    return Response.json({
      success: true,
      paymentType: 'invoice',
      invoicesPaid: invoiceIds.length,
      message: 'Invoices successfully paid!'
    });

    } else {
    // Credit purchase
    const creditsToAdd = Number.parseFloat(metadata.credits_to_add || '0');
    if (!Number.isFinite(creditsToAdd) || creditsToAdd <= 0 || !Number.isInteger(creditsToAdd)) {
      return Response.json({ error: 'Invalid credits amount on payment session' }, { status: 400 });
    }

    console.log('Adding credits:', creditsToAdd, 'to user:', user.email);

    const profile = user.email ? await findUserProfileByEmail(user.authToken, user.email) : null;
    const currentCredits = Number(profile?.credits || 0);
    const newBalance = currentCredits + creditsToAdd;

    await upsertUserCredits(user, newBalance);

    console.log(`✅ Added ${creditsToAdd} credits to user ${user.email}. New balance: ${newBalance}`);

    // Send confirmation email
    if (user.email) {
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
    }

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
    return toErrorResponse(error, 'Failed to verify payment');
  }
});