/// <reference lib="deno.ns" />
import OpenAI from 'npm:openai';
import { listAmplifyPrivateItems, queryAmplifyPrivateData } from './_amplifyPrivateData.ts';

const METADATA_MODEL = Deno.env.get('OPENAI_METADATA_MODEL') || Deno.env.get('OPENAI_MODEL') || 'gpt-4o-mini';

const LIST_PAGE_METADATA_QUERY = `
  query ListPageMetadata($filter: ModelPageMetadataFilterInput, $limit: Int, $nextToken: String) {
    listPageMetadata(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        page_name
        meta_title
        meta_description
        meta_keywords
        og_title
        og_description
        twitter_title
        twitter_description
        is_auto_generated
        last_generated_date
        createdAt
        updatedAt
      }
      nextToken
    }
  }
`;

const CREATE_PAGE_METADATA_MUTATION = `
  mutation CreatePageMetadata($input: CreatePageMetadataInput!) {
    createPageMetadata(input: $input) {
      id
      page_name
      meta_title
      meta_description
      meta_keywords
      og_title
      og_description
      twitter_title
      twitter_description
      is_auto_generated
      last_generated_date
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_PAGE_METADATA_MUTATION = `
  mutation UpdatePageMetadata($input: UpdatePageMetadataInput!) {
    updatePageMetadata(input: $input) {
      id
      page_name
      meta_title
      meta_description
      meta_keywords
      og_title
      og_description
      twitter_title
      twitter_description
      is_auto_generated
      last_generated_date
      createdAt
      updatedAt
    }
  }
`;

export type GeneratedPageMetadata = {
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  og_title: string;
  og_description: string;
  twitter_title: string;
  twitter_description: string;
};

type StoredPageMetadata = GeneratedPageMetadata & {
  id: string;
  page_name: string;
  is_auto_generated?: boolean | null;
  last_generated_date?: string | null;
};

type PageMetadataMutationResponse = {
  createPageMetadata?: StoredPageMetadata;
  updatePageMetadata?: StoredPageMetadata;
};

const getOpenAIClient = () => {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured.');
  }

  return new OpenAI({ apiKey });
};

const readString = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

const buildPrompt = (pageName: string, pageContext?: string) => `Generate SEO-optimized metadata for a website page named "${pageName}".

${pageContext ? `Context about this page: ${pageContext}` : ''}

The website is a home management and real estate platform that helps users:
- Control home expenses with AI-powered property management
- Connect with verified service providers
- Discover exclusive real estate deals
- Digitize property portfolios
- Track maintenance and expenses
- Find homes to buy or rent

Return valid JSON with exactly these keys:
- meta_title
- meta_description
- meta_keywords
- og_title
- og_description
- twitter_title
- twitter_description

Requirements:
- meta_title: 60-70 characters and keyword-rich
- meta_description: 150-160 characters and compelling
- meta_keywords: comma-separated relevant keywords
- social titles/descriptions should be engaging and concise`;

const normalizeGeneratedMetadata = (value: unknown): GeneratedPageMetadata => {
  if (!value || typeof value !== 'object') {
    throw new Error('OpenAI did not return a valid JSON object for page metadata.');
  }

  const raw = value as Record<string, unknown>;
  const meta_title = readString(raw.meta_title);
  const meta_description = readString(raw.meta_description);
  const meta_keywords = readString(raw.meta_keywords);
  const og_title = readString(raw.og_title) || meta_title;
  const og_description = readString(raw.og_description) || meta_description;
  const twitter_title = readString(raw.twitter_title) || meta_title;
  const twitter_description = readString(raw.twitter_description) || meta_description;

  if (!meta_title || !meta_description || !meta_keywords) {
    throw new Error('Generated metadata is missing one or more required SEO fields.');
  }

  return {
    meta_title,
    meta_description,
    meta_keywords,
    og_title,
    og_description,
    twitter_title,
    twitter_description,
  };
};

export const generatePageMetadataWithAI = async (pageName: string, pageContext?: string): Promise<GeneratedPageMetadata> => {
  const completion = await getOpenAIClient().chat.completions.create({
    model: METADATA_MODEL,
    temperature: 0.4,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'You generate SEO metadata and must respond with valid JSON only.',
      },
      {
        role: 'user',
        content: buildPrompt(pageName, pageContext),
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI returned an empty metadata response.');
  }

  return normalizeGeneratedMetadata(JSON.parse(content));
};

export const upsertPageMetadata = async (
  authToken: string,
  input: GeneratedPageMetadata & { page_name: string; is_auto_generated: boolean; last_generated_date: string },
) => {
  const existingItems = await listAmplifyPrivateItems({
    authToken,
    query: LIST_PAGE_METADATA_QUERY,
    rootField: 'listPageMetadata',
    filter: { page_name: { eq: input.page_name } },
    limit: 1,
  });

  const existing = (existingItems[0] as StoredPageMetadata | undefined) || null;
  const response = existing?.id
    ? await queryAmplifyPrivateData(authToken, UPDATE_PAGE_METADATA_MUTATION, { input: { id: existing.id, ...input } }) as PageMetadataMutationResponse
    : await queryAmplifyPrivateData(authToken, CREATE_PAGE_METADATA_MUTATION, { input }) as PageMetadataMutationResponse;

  return response.updatePageMetadata || response.createPageMetadata;
};