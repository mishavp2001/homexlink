/// <reference lib="deno.ns" />
import amplifyOutputs from '../amplify_outputs.json' with { type: 'json' };
import { getFirstEnv } from './_env.ts';

const amplifyDataConfig = amplifyOutputs?.data || {};

const getAmplifyPrivateDataConfig = () => {
  const endpoint =
    getFirstEnv('AMPLIFY_DATA_URL', 'AMPLIFY_GRAPHQL_ENDPOINT', 'VITE_AMPLIFY_GRAPHQL_ENDPOINT') ||
    amplifyDataConfig.url;

  if (!endpoint) {
    throw new Error('Amplify private GraphQL configuration is missing.');
  }

  return { endpoint };
};

const getErrorMessage = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const maybeErrors = (payload as { errors?: Array<{ message?: string }> }).errors;
  if (Array.isArray(maybeErrors) && maybeErrors.length > 0) {
    return maybeErrors[0]?.message || 'Amplify GraphQL request failed.';
  }

  return typeof (payload as { error?: unknown }).error === 'string' ? (payload as { error: string }).error : null;
};

export const queryAmplifyPrivateData = async (authToken: string, query: string, variables: Record<string, unknown> = {}) => {
  if (!authToken) {
    throw new Error('Amplify auth token is missing.');
  }

  const { endpoint } = getAmplifyPrivateDataConfig();
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  const payload = await response.json();
  const errorMessage = getErrorMessage(payload);
  if (!response.ok || errorMessage) {
    throw new Error(errorMessage || `Amplify GraphQL request failed with status ${response.status}.`);
  }

  if (!payload?.data || typeof payload.data !== 'object') {
    throw new Error('Amplify GraphQL response did not include a data payload.');
  }

  return payload.data;
};

export const listAmplifyPrivateItems = async ({
  authToken,
  query,
  rootField,
  filter,
  limit = 100,
}: {
  authToken: string;
  query: string;
  rootField: string;
  filter?: Record<string, unknown>;
  limit?: number;
}) => {
  const items: unknown[] = [];
  let nextToken: string | null = null;

  do {
    const data = await queryAmplifyPrivateData(authToken, query, { filter, limit, nextToken });
    const connection = data?.[rootField];

    if (!connection || typeof connection !== 'object') {
      throw new Error(`Amplify GraphQL response did not include the ${rootField} connection.`);
    }

    const connectionItems = (connection as { items?: unknown[] }).items;
    if (Array.isArray(connectionItems)) {
      items.push(...connectionItems.filter(Boolean));
    }

    const connectionNextToken = (connection as { nextToken?: unknown }).nextToken;
    nextToken = typeof connectionNextToken === 'string' && connectionNextToken ? connectionNextToken : null;
  } while (nextToken);

  return items;
};