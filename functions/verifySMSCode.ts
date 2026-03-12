/// <reference lib="deno.ns" />
import { getAmplifyUser, toErrorResponse, type VerifiedAmplifyUser } from './_amplifyAuth.ts';
import { listAmplifyPrivateItems, queryAmplifyPrivateData } from './_amplifyPrivateData.ts';
import { getEnv } from './_env.ts';

const LIST_USER_PROFILES_QUERY = `
  query ListUserProfiles($filter: ModelUserProfileFilterInput, $limit: Int, $nextToken: String) {
    listUserProfiles(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        email
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
    }
  }
`;

const UPDATE_USER_PROFILE_MUTATION = `
  mutation UpdateUserProfile($input: UpdateUserProfileInput!) {
    updateUserProfile(input: $input) {
      id
      email
    }
  }
`;

const LIST_SERVICE_LISTINGS_QUERY = `
  query ListServiceListings($filter: ModelServiceListingFilterInput, $limit: Int, $nextToken: String) {
    listServiceListings(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        expert_email
      }
      nextToken
    }
  }
`;

const CREATE_SERVICE_LISTING_MUTATION = `
  mutation CreateServiceListing($input: CreateServiceListingInput!) {
    createServiceListing(input: $input) {
      id
      expert_email
      status
    }
  }
`;

const UPDATE_SERVICE_LISTING_MUTATION = `
  mutation UpdateServiceListing($input: UpdateServiceListingInput!) {
    updateServiceListing(input: $input) {
      id
      expert_email
      status
    }
  }
`;

type BusinessData = {
  address?: string;
  name?: string;
  phone?: string;
  rating?: number;
  user_ratings_total?: number;
  website?: string;
};

type UserProfileRecord = {
  id: string;
  email: string;
};

type ServiceListingRecord = {
  id: string;
  expert_email: string;
};

const asFiniteNumber = (value: unknown, fallback = 0) => {
  const numericValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
};

const normalizeBusinessString = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

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

const findServiceListingByEmail = async (authToken: string, email: string): Promise<ServiceListingRecord | null> => {
  const listings = await listAmplifyPrivateItems({
    authToken,
    query: LIST_SERVICE_LISTINGS_QUERY,
    rootField: 'listServiceListings',
    filter: { expert_email: { eq: email } },
    limit: 1,
  });

  return (listings[0] as ServiceListingRecord | undefined) || null;
};

const upsertUserProfile = async (user: VerifiedAmplifyUser, businessData: BusinessData) => {
  if (!user.email) {
    throw new Error('Authenticated user email is required.');
  }

  const input: Record<string, unknown> = {
    business_address: normalizeBusinessString(businessData.address) || undefined,
    business_name: normalizeBusinessString(businessData.name) || undefined,
    business_phone: normalizeBusinessString(businessData.phone) || undefined,
    profile_type: 'business',
    role: user.isAdmin ? 'admin' : 'member',
    user_type: 'service_provider',
  };

  const existingProfile = await findUserProfileByEmail(user.authToken, user.email);
  if (existingProfile?.id) {
    await queryAmplifyPrivateData(user.authToken, UPDATE_USER_PROFILE_MUTATION, {
      input: { id: existingProfile.id, ...input },
    });
    return;
  }

  await queryAmplifyPrivateData(user.authToken, CREATE_USER_PROFILE_MUTATION, {
    input: {
      email: user.email,
      ...input,
    },
  });
};

const upsertServiceListing = async (user: VerifiedAmplifyUser, businessData: BusinessData, placeId: string | null) => {
  if (!user.email) {
    throw new Error('Authenticated user email is required.');
  }

  const businessName = normalizeBusinessString(businessData.name) || user.email;
  const businessPhone = normalizeBusinessString(businessData.phone);
  const businessAddress = normalizeBusinessString(businessData.address);
  const websiteUrl = normalizeBusinessString(businessData.website);
  const listingInput: Record<string, unknown> = {
    average_rating: asFiniteNumber(businessData.rating),
    business_name: businessName,
    expert_email: user.email,
    review_count: Math.max(0, Math.round(asFiniteNumber(businessData.user_ratings_total))),
    status: 'active',
  };

  if (businessName) {
    listingInput.expert_name = businessName;
  }
  if (businessPhone) {
    listingInput.business_phone = businessPhone;
    listingInput.expert_phone = businessPhone;
  }
  if (businessAddress) {
    listingInput.business_address = businessAddress;
  }
  if (websiteUrl) {
    listingInput.website_url = websiteUrl;
  }
  if (placeId) {
    listingInput.google_place_id = placeId;
  }

  const existingListing = await findServiceListingByEmail(user.authToken, user.email);
  if (existingListing?.id) {
    await queryAmplifyPrivateData(user.authToken, UPDATE_SERVICE_LISTING_MUTATION, {
      input: { id: existingListing.id, ...listingInput },
    });
    return;
  }

  await queryAmplifyPrivateData(user.authToken, CREATE_SERVICE_LISTING_MUTATION, {
    input: listingInput,
  });
};

Deno.serve(async (req: Request) => {
  try {
    const user = await getAmplifyUser(req);

    const body = await req.json() as { code?: string; placeId?: string; businessData?: BusinessData };
    const { code, placeId, businessData } = body;
    
    if (!code || !businessData || !businessData.phone) {
      return Response.json({ error: 'Missing required fields: code and businessData with phone' }, { status: 400 });
    }
    
    console.log('Verifying phone:', businessData.phone);
    const accountSid = getEnv('TWILIO_ACCOUNT_SID');
    const authToken = getEnv('TWILIO_AUTH_TOKEN');
    const verifySid = getEnv('TWILIO_VERIFY_SERVICE_SID');

    if (!accountSid || !authToken || !verifySid) {
      return Response.json({ error: 'Twilio Verify not configured' }, { status: 500 });
    }

    // Check verification using Twilio Verify API
    const verifyUrl = `https://verify.twilio.com/v2/Services/${verifySid}/VerificationCheck`;
    const verifyResponse = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: businessData.phone,
        Code: code
      })
    });

    if (!verifyResponse.ok) {
      const error = await verifyResponse.text();
      console.error('Twilio Verify error:', error);
      return Response.json({ error: 'Failed to verify code' }, { status: 500 });
    }

    const result = await verifyResponse.json();
    
    if (result.status !== 'approved') {
      return Response.json({ error: 'Invalid or expired verification code' }, { status: 400 });
    }

    // If user is not authenticated, return success but indicate auth is required
    if (!user) {
      return Response.json({ 
        success: true, 
        requiresAuth: true,
        message: 'Phone verified. Please create an account to continue.' 
      });
    }

    if (!user.email) {
      return Response.json({ error: 'Authenticated user email is required' }, { status: 400 });
    }

    await upsertUserProfile(user, businessData);
    await upsertServiceListing(user, businessData, normalizeBusinessString(placeId) || null);

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error verifying SMS code:', error);
    return toErrorResponse(error, 'Failed to verify SMS code');
  }
});