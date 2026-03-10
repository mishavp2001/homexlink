/// <reference lib="deno.ns" />
import { requireAmplifyUser, toErrorResponse } from './_amplifyAuth.ts';
import { listAmplifyPrivateItems, queryAmplifyPrivateData } from './_amplifyPrivateData.ts';
import { listAmplifyPublicItems } from './_amplifyPublicData.ts';

const LAMBDA_VIDEO_API = 'https://lxoosxditdulqtbnqql3zox2o40hqvjv.lambda-url.us-east-1.on.aws/';
const VIDEO_COST = 1; // 1 credit per video

const LIST_DEALS_QUERY = `
  query ListDeals($filter: ModelDealFilterInput, $limit: Int, $nextToken: String) {
    listDeals(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        user_email
        title
        description
        price
        bedrooms
        bathrooms
        sqft
        photo_urls
      }
      nextToken
    }
  }
`;

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

const UPDATE_DEAL_MUTATION = `
  mutation UpdateDeal($input: UpdateDealInput!) {
    updateDeal(input: $input) {
      id
      video_url
      video_generated_date
    }
  }
`;

type DealRecord = {
  id: string;
  user_email: string;
  title: string;
  description?: string | null;
  price?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  sqft?: number | null;
  photo_urls?: string[] | null;
};

type UserProfileRecord = {
  id: string;
  email: string;
  credits?: number | null;
};

type UserProfileMutationResponse = {
  createUserProfile?: UserProfileRecord;
  updateUserProfile?: UserProfileRecord;
};

type LambdaVideoPayload = {
  success?: boolean;
  videoKey?: string;
  videoUrl?: string;
};

type LambdaVideoResponse = {
  body?: string | LambdaVideoPayload;
  success?: boolean;
  videoKey?: string;
  videoUrl?: string;
};

const asFiniteNumber = (value: unknown, fallback = 0) => {
  const numericValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
};

const findDealById = async (dealId: string): Promise<DealRecord | null> => {
  const deals = await listAmplifyPublicItems({
    query: LIST_DEALS_QUERY,
    rootField: 'listDeals',
    filter: { id: { eq: dealId } },
    limit: 1,
  });

  return (deals[0] as DealRecord | undefined) || null;
};

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

const upsertUserCredits = async (authToken: string, email: string, isAdmin: boolean, credits: number) => {
  const existingProfile = await findUserProfileByEmail(authToken, email);
  if (existingProfile?.id) {
    const data = await queryAmplifyPrivateData(authToken, UPDATE_USER_PROFILE_MUTATION, {
      input: { id: existingProfile.id, credits },
    }) as UserProfileMutationResponse;
    return data.updateUserProfile;
  }

  const data = await queryAmplifyPrivateData(authToken, CREATE_USER_PROFILE_MUTATION, {
    input: {
      email,
      full_name: email,
      role: isAdmin ? 'admin' : 'member',
      credits,
    },
  }) as UserProfileMutationResponse;

  return data.createUserProfile;
};

const parseLambdaVideoPayload = (lambdaResult: LambdaVideoResponse): LambdaVideoPayload => {
  if (typeof lambdaResult.body === 'string') {
    return JSON.parse(lambdaResult.body) as LambdaVideoPayload;
  }

  if (lambdaResult.body && typeof lambdaResult.body === 'object') {
    return lambdaResult.body;
  }

  return lambdaResult;
};

Deno.serve(async (req: Request) => {
  try {
    const user = await requireAmplifyUser(req);

    if (!user.email) {
      return Response.json({ error: 'Authenticated user email is required' }, { status: 400 });
    }

    const profile = await findUserProfileByEmail(user.authToken, user.email);
    const currentCredits = Math.max(0, Math.floor(asFiniteNumber(profile?.credits)));

    if (currentCredits < VIDEO_COST) {
      return Response.json({
        error: 'Insufficient credits',
        required: VIDEO_COST,
        current: currentCredits,
      }, { status: 402 });
    }

    const { dealId } = await req.json() as { dealId?: string };

    if (!dealId) {
      return Response.json({ error: 'dealId is required' }, { status: 400 });
    }

    const deal = await findDealById(dealId);

    if (!deal) {
      return Response.json({ error: 'Deal not found' }, { status: 404 });
    }

    if (!user.isAdmin && deal.user_email !== user.email) {
      return Response.json({ error: 'Unauthorized - not deal owner' }, { status: 403 });
    }

    const photos = Array.isArray(deal.photo_urls) ? deal.photo_urls.filter(Boolean) : [];
    if (photos.length === 0) {
      return Response.json({
        error: 'Deal must have at least one photo to generate video',
      }, { status: 400 });
    }

    console.log('=== GENERATING PROPERTY VIDEO ===');
    console.log('Deal ID:', dealId);
    console.log('Photos:', photos.length);

    const payload = {
      description: deal.description || deal.title,
      price: String(asFiniteNumber(deal.price)),
      bedrooms: asFiniteNumber(deal.bedrooms),
      bathrooms: asFiniteNumber(deal.bathrooms),
      squareFootage: asFiniteNumber(deal.sqft),
      photos: photos.slice(0, 10),
    };

    console.log('Calling Lambda API with payload:', payload);

    const lambdaResponse = await fetch(LAMBDA_VIDEO_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!lambdaResponse.ok) {
      const errorText = await lambdaResponse.text();
      console.error('Lambda API error:', errorText);
      return Response.json({
        error: `Video generation failed: ${lambdaResponse.statusText}`,
        details: errorText,
      }, { status: 500 });
    }

    const lambdaResult = await lambdaResponse.json() as LambdaVideoResponse;
    console.log('Lambda API response:', lambdaResult);

    const videoData = parseLambdaVideoPayload(lambdaResult);

    if (!videoData.success || !videoData.videoUrl) {
      return Response.json({
        error: 'Video generation failed',
        details: videoData,
      }, { status: 500 });
    }

    console.log('✅ Video generated successfully:', videoData.videoUrl);

    const newCredits = currentCredits - VIDEO_COST;
    await upsertUserCredits(user.authToken, user.email, user.isAdmin, newCredits);

    console.log(`✅ Deducted ${VIDEO_COST} credit(s). New balance: ${newCredits}`);

    await queryAmplifyPrivateData(user.authToken, UPDATE_DEAL_MUTATION, {
      input: {
        id: dealId,
        video_url: videoData.videoUrl,
        video_generated_date: new Date().toISOString(),
      },
    });

    console.log('✅ Deal updated with video URL');

    return Response.json({
      success: true,
      videoUrl: videoData.videoUrl,
      videoKey: videoData.videoKey,
      creditsRemaining: newCredits,
      message: 'Video generated successfully!',
    });

  } catch (error) {
    console.error('❌ Error generating video:', error);
    return toErrorResponse(error, 'Failed to generate video');
  }
});