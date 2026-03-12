/// <reference lib="deno.ns" />
import amplifyOutputs from '../amplify_outputs.json' with { type: 'json' };
import { getEnv, getFirstEnv } from './_env.ts';

const encoder = new TextEncoder();
const adminGroupName = 'ADMINS';
const jwksTtlMs = 60 * 60 * 1000;

type JwtPayload = Record<string, unknown> & {
  aud?: string;
  client_id?: string;
  email?: string;
  exp?: number;
  iss?: string;
  nbf?: number;
  sub?: string;
  token_use?: string;
  username?: string;
};

export type VerifiedAmplifyUser = {
  authToken: string;
  email: string | null;
  groups: string[];
  isAdmin: boolean;
  sub: string | null;
  username: string | null;
};

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

let cachedJwks: { expiresAt: number; keys: Record<string, JsonWebKey> } | null = null;
const cryptoKeyCache = new Map<string, Promise<CryptoKey>>();

const getAmplifyAuthConfig = () => {
  const authConfig = amplifyOutputs?.auth || {};
  const region = getFirstEnv('AMPLIFY_AUTH_REGION', 'AWS_REGION') || authConfig.aws_region;
  const userPoolId = getEnv('AMPLIFY_AUTH_USER_POOL_ID') || authConfig.user_pool_id;
  const clientId = getEnv('AMPLIFY_AUTH_USER_POOL_CLIENT_ID') || authConfig.user_pool_client_id;

  if (!region || !userPoolId || !clientId) {
    throw new Error('Amplify Cognito configuration is missing.');
  }

  return {
    clientId,
    issuer: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`,
    jwksUrl: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`,
  };
};

const parseBearerToken = (value: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || trimmed;
};

const looksLikeJwt = (value: string | null) => Boolean(value && value.split('.').length === 3);

const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return atob(padded);
};

const decodeBase64UrlJson = <T>(value: string): T => JSON.parse(decodeBase64Url(value));

const decodeBase64UrlBytes = (value: string) => Uint8Array.from(decodeBase64Url(value), char => char.charCodeAt(0));

const readStringClaim = (payload: JwtPayload, claimName: string) => {
  const value = payload[claimName];
  return typeof value === 'string' && value ? value : null;
};

const readGroups = (...payloads: Array<JwtPayload | null>) => Array.from(new Set(
  payloads.flatMap(payload => {
    const value = payload?.['cognito:groups'];
    if (Array.isArray(value)) {
      return value.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0);
    }
    return typeof value === 'string' && value ? [value] : [];
  }),
));

const getJwks = async () => {
  if (cachedJwks && cachedJwks.expiresAt > Date.now()) {
    return cachedJwks.keys;
  }

  const { jwksUrl } = getAmplifyAuthConfig();
  const response = await fetch(jwksUrl);
  if (!response.ok) {
    throw new Error(`Failed to load Cognito JWKS (${response.status}).`);
  }

  const payload = await response.json();
  const keys = Object.fromEntries(
    (Array.isArray(payload?.keys) ? payload.keys : [])
      .filter((jwk): jwk is JsonWebKey & { kid: string } => typeof jwk?.kid === 'string' && jwk.kid.length > 0)
      .map(jwk => [jwk.kid, jwk]),
  );

  if (Object.keys(keys).length === 0) {
    throw new Error('Cognito JWKS response did not include any signing keys.');
  }

  cachedJwks = {
    expiresAt: Date.now() + jwksTtlMs,
    keys,
  };

  return keys;
};

const getCryptoKey = async (kid: string) => {
  if (!cryptoKeyCache.has(kid)) {
    cryptoKeyCache.set(kid, (async () => {
      let jwks = await getJwks();
      let jwk = jwks[kid];

      if (!jwk) {
        cachedJwks = null;
        jwks = await getJwks();
        jwk = jwks[kid];
      }

      if (!jwk) {
        throw new HttpError(401, 'Authentication token was signed with an unknown key.');
      }

      return crypto.subtle.importKey(
        'jwk',
        { ...jwk, ext: true },
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['verify'],
      );
    })());
  }

  return cryptoKeyCache.get(kid)!;
};

const verifyCognitoJwt = async (token: string, expectedTokenUse?: 'access' | 'id') => {
  const segments = token.split('.');
  if (segments.length !== 3) {
    throw new HttpError(401, 'Authentication token is malformed.');
  }

  const [headerSegment, payloadSegment, signatureSegment] = segments;
  const header = decodeBase64UrlJson<Record<string, unknown>>(headerSegment);
  const payload = decodeBase64UrlJson<JwtPayload>(payloadSegment);

  if (header.alg !== 'RS256') {
    throw new HttpError(401, 'Authentication token algorithm is not supported.');
  }

  const kid = typeof header.kid === 'string' && header.kid ? header.kid : null;
  if (!kid) {
    throw new HttpError(401, 'Authentication token is missing a signing key identifier.');
  }

  const cryptoKey = await getCryptoKey(kid);
  const isValid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    decodeBase64UrlBytes(signatureSegment),
    encoder.encode(`${headerSegment}.${payloadSegment}`),
  );

  if (!isValid) {
    throw new HttpError(401, 'Authentication token signature is invalid.');
  }

  const { clientId, issuer } = getAmplifyAuthConfig();
  const now = Math.floor(Date.now() / 1000);
  const tokenUse = readStringClaim(payload, 'token_use');

  if (!payload.exp || payload.exp <= now) {
    throw new HttpError(401, 'Authentication token has expired.');
  }
  if (payload.nbf && payload.nbf > now) {
    throw new HttpError(401, 'Authentication token is not yet valid.');
  }
  if (payload.iss !== issuer) {
    throw new HttpError(401, 'Authentication token issuer is invalid.');
  }
  if (!tokenUse || !['access', 'id'].includes(tokenUse)) {
    throw new HttpError(401, 'Authentication token use is invalid.');
  }
  if (expectedTokenUse && tokenUse !== expectedTokenUse) {
    throw new HttpError(401, `Expected a Cognito ${expectedTokenUse} token.`);
  }

  if (tokenUse === 'id' && payload.aud !== clientId) {
    throw new HttpError(401, 'Authentication token audience is invalid.');
  }
  if (tokenUse === 'access' && payload.client_id !== clientId) {
    throw new HttpError(401, 'Authentication token client is invalid.');
  }

  return payload;
};

export const requireAmplifyUser = async (req: Request): Promise<VerifiedAmplifyUser> => {
  const explicitIdToken = parseBearerToken(req.headers.get('x-amplify-id-token'));
  const explicitAccessToken = parseBearerToken(req.headers.get('x-amplify-access-token'));
  const sharedToken = parseBearerToken(req.headers.get('x-amplify-authorization'));
  const authHeaderToken = parseBearerToken(req.headers.get('authorization'));
  const fallbackToken = looksLikeJwt(sharedToken) ? sharedToken : looksLikeJwt(authHeaderToken) ? authHeaderToken : null;

  let idPayload = explicitIdToken ? await verifyCognitoJwt(explicitIdToken, 'id') : null;
  let accessPayload = explicitAccessToken ? await verifyCognitoJwt(explicitAccessToken, 'access') : null;

  if (!idPayload && !accessPayload && fallbackToken) {
    const sharedPayload = await verifyCognitoJwt(fallbackToken);
    if (sharedPayload.token_use === 'id') {
      idPayload = sharedPayload;
    } else {
      accessPayload = sharedPayload;
    }
  }

  if (!idPayload && explicitIdToken == null && fallbackToken) {
    const sharedPayload = await verifyCognitoJwt(fallbackToken);
    if (sharedPayload.token_use === 'id') {
      idPayload = sharedPayload;
    }
  }

  if (!accessPayload && explicitAccessToken == null && fallbackToken) {
    const sharedPayload = await verifyCognitoJwt(fallbackToken);
    if (sharedPayload.token_use === 'access') {
      accessPayload = sharedPayload;
    }
  }

  if (!idPayload && !accessPayload) {
    throw new HttpError(401, 'Unauthorized');
  }

  const email = readStringClaim(idPayload || {}, 'email');
  const username =
    readStringClaim(idPayload || {}, 'cognito:username') ||
    readStringClaim(accessPayload || {}, 'username') ||
    readStringClaim(accessPayload || {}, 'cognito:username');
  const groups = readGroups(idPayload, accessPayload);

  return {
    authToken: explicitIdToken || fallbackToken || explicitAccessToken || '',
    email,
    groups,
    isAdmin: groups.includes(adminGroupName),
    sub: readStringClaim(idPayload || accessPayload || {}, 'sub'),
    username,
  };
};

export const getAmplifyUser = async (req: Request): Promise<VerifiedAmplifyUser | null> => {
  try {
    return await requireAmplifyUser(req);
  } catch (error) {
    if (error instanceof HttpError && error.status === 401) {
      return null;
    }

    throw error;
  }
};

export const toErrorResponse = (error: unknown, fallbackMessage: string) => {
  if (error instanceof HttpError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  const message = error instanceof Error ? error.message : fallbackMessage;
  return Response.json({ error: message || fallbackMessage }, { status: 500 });
};