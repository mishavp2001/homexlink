/// <reference lib="deno.ns" />
import Stripe from 'npm:stripe@14.11.0';
import { Resend } from 'npm:resend@3.2.0';
import { requireAmplifyUser, toErrorResponse, type VerifiedAmplifyUser } from './_amplifyAuth.ts';
import { listAmplifyPrivateItems, queryAmplifyPrivateData } from './_amplifyPrivateData.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2023-10-16',
});
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

type StripeMetadata = Record<string, string | undefined>;

type UserProfileRecord = {
  id: string;
  email: string;
  credits?: number | null;
};

type UserProfileMutationResponse = {
  createUserProfile?: UserProfileRecord;
  updateUserProfile?: UserProfileRecord;
};

const getExpectedPaymentOwners = (user: VerifiedAmplifyUser) => [user.sub, user.username, user.email].filter(Boolean);

const getPaymentOwner = (metadata: StripeMetadata | null | undefined) => metadata?.user_id || metadata?.user_email || null;

const findUserProfileByEmail = async (authToken: string, email: string): Promise<UserProfileRecord | null> => {
  const profiles = await listAmplifyPrivateItems({
    authToken,
    query: LIST_USER_PROFILES_QUERY,
    rootField: 'listUserProfiles',
    filter: { email: { eq: email } },
    limit: 1,
  });

  return (profiles[0] as UserProfileRecord | undefined) || null;
};

const upsertUserCredits = async (user: VerifiedAmplifyUser, credits: number) => {
  if (!user.email) {
    throw new Error('Authenticated user email is missing.');
  }

  const existingProfile = await findUserProfileByEmail(user.authToken, user.email);
  if (existingProfile?.id) {
    const data = await queryAmplifyPrivateData(user.authToken, UPDATE_USER_PROFILE_MUTATION, {
      input: { id: existingProfile.id, credits },
    }) as UserProfileMutationResponse;
    return data.updateUserProfile;
  }

  const data = await queryAmplifyPrivateData(user.authToken, CREATE_USER_PROFILE_MUTATION, {
    input: {
      email: user.email,
      full_name: user.email,
      role: user.isAdmin ? 'admin' : 'member',
      credits,
    },
  }) as UserProfileMutationResponse;
  return data.createUserProfile;
};

Deno.serve(async (req: Request) => {
  try {
    const user = await requireAmplifyUser(req);

    const { paymentIntentId } = await req.json();
    
    if (!paymentIntentId) {
      return Response.json({ error: 'Payment intent ID required' }, { status: 400 });
    }

    // Retrieve payment intent to verify
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const metadata = (paymentIntent.metadata || {}) as StripeMetadata;
    
    if (paymentIntent.status !== 'succeeded') {
      return Response.json({ 
        error: 'Payment not completed',
        status: paymentIntent.status 
      }, { status: 400 });
    }

    const paymentOwner = getPaymentOwner(metadata);
    if (!paymentOwner || !getExpectedPaymentOwners(user).includes(paymentOwner)) {
      console.error('Payment intent user mismatch:', paymentOwner, 'vs', getExpectedPaymentOwners(user));
      return Response.json({ error: 'Payment intent does not belong to current user' }, { status: 403 });
    }

    // Calculate credits to add (amount in cents / 100 = credits)
    const creditsToAdd = paymentIntent.amount / 100;
    if (!Number.isFinite(creditsToAdd) || creditsToAdd <= 0 || !Number.isInteger(creditsToAdd)) {
      return Response.json({ error: 'Invalid credits amount on payment intent' }, { status: 400 });
    }
    
    const profile = user.email ? await findUserProfileByEmail(user.authToken, user.email) : null;
    const currentCredits = Number(profile?.credits || 0);
    
    // Update user credits
    const newBalance = currentCredits + creditsToAdd;
    await upsertUserCredits(user, newBalance);

    // Send confirmation email
    if (user.email) {
      await resend.emails.send({
        from: 'HomeXREI <onboarding@resend.dev>',
        to: user.email,
        subject: 'Payment Confirmed',
        html: `
          <h1>Payment Successful</h1>
          <p>We have confirmed your payment.</p>
          <p><strong>${creditsToAdd}</strong> credits have been added to your account.</p>
          <p>New Balance: ${newBalance}</p>
        `
      });
    }

    return Response.json({
      success: true,
      creditsAdded: creditsToAdd,
      newBalance: newBalance
    });

  } catch (error) {
    console.error('Payment confirmation error:', error);
    return toErrorResponse(error, 'Failed to confirm payment');
  }
});