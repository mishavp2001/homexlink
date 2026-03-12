import { generateClient } from 'aws-amplify/api';
import { fetchAuthSession, fetchUserAttributes, getCurrentUser, signOut } from 'aws-amplify/auth';
import { appParams } from '@/lib/app-params';
import { amplifyRuntimeConfig, isAmplifyRuntimeEnabled } from '@/lib/amplify-config';
import { buildLoginUrl } from '@/lib/login-route';

const { appId, serverUrl, token, functionsVersion } = appParams;
const LEGACY_RUNTIME_PREFIX = ['base', '44'].join('');
const LEGACY_FUNCTIONS_VERSION_HEADER = ['Base', '44', '-Functions-Version'].join('');

export const hasLegacyRuntimeConfig = Boolean(appId && serverUrl);

const MODEL_DEFINITIONS = {
  UserProfile: {
    aliases: ['UserProfile', 'User'],
    listOperation: 'listUserProfiles',
    createOperation: 'createUserProfile',
    updateOperation: 'updateUserProfile',
    deleteOperation: 'deleteUserProfile',
    readAccess: 'private',
    selectionSet: [
      'id', 'email', 'full_name', 'phone', 'role', 'user_type', 'profile_type', 'is_verified', 'credits',
      'bio', 'profile_photo_url', 'business_name', 'business_phone', 'business_address', 'service_types',
      'service_area', 'description', 'years_experience', 'hourly_rate', 'certifications', 'sms_phone_number',
      'sms_consent', 'sms_consent_date', 'sms_consent_ip', 'sms_opt_in', 'sms_opt_in_date', 'sms_opt_in_ip',
      'has_seen_sms_optin', 'onboarding_state', 'deleted_at', 'createdAt', 'updatedAt'
    ].join(' '),
  },
  ServiceListing: {
    aliases: ['ServiceListing'],
    listOperation: 'listServiceListings',
    createOperation: 'createServiceListing',
    updateOperation: 'updateServiceListing',
    deleteOperation: 'deleteServiceListing',
    readAccess: 'public',
    selectionSet: [
      'id', 'expert_email', 'expert_name', 'expert_phone', 'business_name', 'business_phone', 'business_address',
      'business_photo_url', 'website_url', 'google_place_id', 'bio', 'service_category', 'service_types',
      'service_areas', 'certifications', 'years_in_business', 'years_experience', 'hourly_rate',
      'quote_assistant_instructions', 'profile_qr_code_url', 'price_list', 'work_photos', 'social_links',
      'average_rating', 'review_count', 'is_verified', 'status', 'createdAt', 'updatedAt'
    ].join(' '),
  },
  Category: {
    aliases: ['Category'],
    listOperation: 'listCategories',
    createOperation: 'createCategory',
    updateOperation: 'updateCategory',
    deleteOperation: 'deleteCategory',
    readAccess: 'public',
    selectionSet: 'id type name description icon is_active sort_order createdAt updatedAt',
  },
  ProviderSettings: {
    aliases: ['ProviderSettings'],
    listOperation: 'listProviderSettings',
    createOperation: 'createProviderSettings',
    updateOperation: 'updateProviderSettings',
    deleteOperation: 'deleteProviderSettings',
    readAccess: 'private',
    selectionSet: [
      'id', 'provider_email', 'billing_email', 'payment_terms', 'status', 'lead_fee_per_lead',
      'total_leads_received', 'billing_profile', 'createdAt', 'updatedAt'
    ].join(' '),
  },
  LeadCharge: {
    aliases: ['LeadCharge'],
    listOperation: 'listLeadCharges',
    createOperation: 'createLeadCharge',
    updateOperation: 'updateLeadCharge',
    deleteOperation: 'deleteLeadCharge',
    readAccess: 'private',
    selectionSet: [
      'id', 'provider_email', 'provider_name', 'maintenance_task_id', 'property_address', 'project_title',
      'lead_amount', 'lead_quality', 'status', 'stripe_invoice_id', 'paid_at', 'createdAt', 'updatedAt'
    ].join(' '),
  },
  Setting: {
    aliases: ['Setting', 'Settings'],
    listOperation: 'listSettings',
    createOperation: 'createSetting',
    updateOperation: 'updateSetting',
    deleteOperation: 'deleteSetting',
    readAccess: 'private',
    selectionSet: 'id setting_key setting_value description createdAt updatedAt',
  },
  PageMetadata: {
    aliases: ['PageMetadata'],
    listOperation: 'listPageMetadata',
    createOperation: 'createPageMetadata',
    updateOperation: 'updatePageMetadata',
    deleteOperation: 'deletePageMetadata',
    readAccess: 'public',
    selectionSet: [
      'id', 'page_name', 'meta_title', 'meta_description', 'meta_keywords', 'og_title', 'og_description',
      'twitter_title', 'twitter_description', 'is_auto_generated', 'last_generated_date', 'createdAt', 'updatedAt'
    ].join(' '),
  },
  PropertyComponent: {
    aliases: ['PropertyComponent'],
    listOperation: 'listPropertyComponents',
    createOperation: 'createPropertyComponent',
    updateOperation: 'updatePropertyComponent',
    deleteOperation: 'deletePropertyComponent',
    readAccess: 'private',
    selectionSet: [
      'id', 'property_id', 'user_email', 'component_type', 'manufacturer', 'model_number', 'serial_number',
      'install_date', 'condition_rating', 'photo_urls', 'component_data', 'status', 'createdAt', 'updatedAt'
    ].join(' '),
  },
  MaintenanceTask: {
    aliases: ['MaintenanceTask'],
    listOperation: 'listMaintenanceTasks',
    createOperation: 'createMaintenanceTask',
    updateOperation: 'updateMaintenanceTask',
    deleteOperation: 'deleteMaintenanceTask',
    readAccess: 'private',
    selectionSet: [
      'id', 'property_id', 'user_email', 'project_title', 'project_description', 'project_type', 'component_type',
      'urgency', 'preferred_timeline', 'budget_range', 'photo_urls', 'status', 'task_data', 'createdAt', 'updatedAt'
    ].join(' '),
  },
  Report: {
    aliases: ['Report'],
    listOperation: 'listReports',
    createOperation: 'createReport',
    updateOperation: 'updateReport',
    deleteOperation: 'deleteReport',
    readAccess: 'private',
    selectionSet: 'id property_id user_email report_type report_data status createdAt updatedAt',
  },
  Review: {
    aliases: ['Review'],
    listOperation: 'listReviews',
    createOperation: 'createReview',
    updateOperation: 'updateReview',
    deleteOperation: 'deleteReview',
    readAccess: 'public',
    legacyOperations: ['update'],
    selectionSet: [
      'id', 'service_listing_id', 'reviewer_email', 'reviewer_name', 'rating', 'review_text',
      'helpful_count', 'status', 'createdAt', 'updatedAt'
    ].join(' '),
  },
  SavedDeal: {
    aliases: ['SavedDeal'],
    listOperation: 'listSavedDeals',
    createOperation: 'createSavedDeal',
    updateOperation: 'updateSavedDeal',
    deleteOperation: 'deleteSavedDeal',
    readAccess: 'private',
    selectionSet: 'id deal_id user_email notes createdAt updatedAt',
  },
  Booking: {
    aliases: ['Booking'],
    listOperation: 'listBookings',
    createOperation: 'createBooking',
    updateOperation: 'updateBooking',
    deleteOperation: 'deleteBooking',
    readAccess: 'private',
    selectionSet: [
      'id', 'deal_id', 'service_listing_id', 'booking_type', 'status', 'payment_status', 'renter_email',
      'renter_name', 'renter_phone', 'owner_email', 'property_address', 'service_date', 'service_time',
      'service_price', 'total_cost', 'message', 'payment_intent_id', 'payment_amount', 'qr_code_data',
      'qr_code_url', 'redeemed', 'participant_owner_ids', 'createdAt', 'updatedAt'
    ].join(' '),
  },
  Offer: {
    aliases: ['Offer'],
    listOperation: 'listOffers',
    createOperation: 'createOffer',
    updateOperation: 'updateOffer',
    deleteOperation: 'deleteOffer',
    readAccess: 'private',
    selectionSet: [
      'id', 'deal_id', 'buyer_email', 'buyer_name', 'seller_email', 'offered_price', 'message', 'status',
      'participant_owner_ids', 'createdAt', 'updatedAt'
    ].join(' '),
  },
  Message: {
    aliases: ['Message'],
    listOperation: 'listMessages',
    createOperation: 'createMessage',
    updateOperation: 'updateMessage',
    deleteOperation: 'deleteMessage',
    readAccess: 'private',
    selectionSet: [
      'id', 'sender_email', 'sender_name', 'recipient_email', 'recipient_name', 'subject', 'content', 'thread_id',
      'reference_type', 'reference_id', 'parent_message_id', 'is_read', 'read_at', 'participant_owner_ids',
      'createdAt', 'updatedAt'
    ].join(' '),
  },
  Transaction: {
    aliases: ['Transaction'],
    listOperation: 'listTransactions',
    createOperation: 'createTransaction',
    updateOperation: 'updateTransaction',
    deleteOperation: 'deleteTransaction',
    readAccess: 'private',
    selectionSet: [
      'id', 'property_id', 'user_email', 'transaction_type', 'category', 'amount', 'date', 'description',
      'receipt_url', 'payment_method', 'payee', 'payer', 'is_recurring', 'recurring_frequency', 'createdAt', 'updatedAt'
    ].join(' '),
  },
};

const ENTITY_TO_MODEL = Object.fromEntries(
  Object.entries(MODEL_DEFINITIONS).flatMap(([modelName, definition]) =>
    definition.aliases.map(alias => [alias, modelName]),
  ),
);

let graphQLClient;

const getGraphQLClient = () => {
  if (!graphQLClient) {
    graphQLClient = generateClient();
  }

  return graphQLClient;
};

/**
 * @typedef {Object} LegacyTokenOptions
 * @property {boolean} [persist]
 */

/**
 * @typedef {Object} LegacyEntityParamsInput
 * @property {any} [query]
 * @property {any} [sort]
 * @property {any} [limit]
 * @property {any} [skip]
 * @property {string | string[]} [fields]
 */

/**
 * @typedef {Object} LegacyCurrentUserRequest
 * @property {string} [method]
 * @property {any} [data]
 */

/**
 * @typedef {Object} LegacyAppApiRequest
 * @property {string} path
 * @property {string} [method]
 * @property {any} [data]
 * @property {Record<string, any>} [params]
 * @property {boolean} [includeFunctionsVersion]
 * @property {string} unavailableMessage
 * @property {string} [requestName]
 */

/**
 * @param {string} message
 * @param {Record<string, any>} [extra]
 */
const normalizeError = (message, extra = {}) => Object.assign(new Error(message), extra);

const ACCESS_TOKEN_STORAGE_KEYS = ['homexlink_access_token', `${LEGACY_RUNTIME_PREFIX}_access_token`, 'token'];

const getLegacyAccessToken = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return token || null;
  }

  try {
    for (const storageKey of ACCESS_TOKEN_STORAGE_KEYS) {
      const storedToken = window.localStorage.getItem(storageKey);
      if (storedToken) {
        return storedToken;
      }
    }
  } catch {
    return token || null;
  }

  return token || null;
};

/**
 * @param {string | null | undefined} accessToken
 * @param {LegacyTokenOptions} [options]
 */
const setLegacyAccessToken = (accessToken, { persist = true } = {}) => {
  if (!accessToken || typeof window === 'undefined' || !window.localStorage || !persist) {
    return;
  }

  try {
    for (const storageKey of ACCESS_TOKEN_STORAGE_KEYS) {
      window.localStorage.setItem(storageKey, accessToken);
    }
  } catch {
    // Ignore storage failures and continue with in-memory auth state only.
  }
};

const clearLegacyAccessToken = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    for (const storageKey of ACCESS_TOKEN_STORAGE_KEYS) {
      window.localStorage.removeItem(storageKey);
    }
  } catch {
    // Ignore storage failures during logout cleanup.
  }
};

const hasFileValue = value => typeof File !== 'undefined' && value instanceof File;

const serializeLegacyPayload = (kind, name, data) => {
  if (typeof data === 'string') {
    throw normalizeError(`${kind} ${name} must receive an object with named parameters, received: ${data}`);
  }

  if (typeof FormData !== 'undefined' && data instanceof FormData) {
    return { body: data, contentType: null };
  }

  if (data && typeof data === 'object' && Object.values(data).some(value => hasFileValue(value))) {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      const value = data[key];
      if (hasFileValue(value)) {
        formData.append(key, value, value.name);
      } else if (typeof value === 'object' && value !== null) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    });
    return { body: formData, contentType: null };
  }

  return {
    body: data === undefined ? undefined : JSON.stringify(data),
    contentType: 'application/json',
  };
};

const parseLegacyResponseBody = async response => {
  const responseText = await response.text();
  if (!responseText) {
    return null;
  }

  const responseContentType = response.headers.get('content-type') || '';
  if (responseContentType.includes('application/json')) {
    try {
      return JSON.parse(responseText);
    } catch {
      return responseText;
    }
  }

  return responseText;
};

const getLegacyErrorMessage = (payload, fallbackMessage) => {
  if (typeof payload === 'string' && payload) {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    if (typeof payload.message === 'string' && payload.message) {
      return payload.message;
    }
    if (typeof payload.detail === 'string' && payload.detail) {
      return payload.detail;
    }
    if (typeof payload.error === 'string' && payload.error) {
      return payload.error;
    }
  }

  return fallbackMessage;
};

const getLegacyApiUrl = path => `${String(serverUrl).replace(/\/$/, '')}/api${path}`;

/** @param {Record<string, any> | undefined} params */
const buildLegacyQueryString = params => {
  const searchParams = new URLSearchParams();

  Object.entries(removeNilValues(params || {})).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      searchParams.set(key, value.join(','));
      return;
    }

    searchParams.set(key, String(value));
  });

  return searchParams.toString();
};

const buildLegacyHeaders = async ({ contentType = null, includeFunctionsVersion = false } = {}) => {
  const headers = {
    Accept: 'application/json',
    'X-App-Id': String(appId),
  };

  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  if (includeFunctionsVersion && functionsVersion) {
    headers[LEGACY_FUNCTIONS_VERSION_HEADER] = functionsVersion;
  }

  const accessToken = getLegacyAccessToken();
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const amplifySession = await getAmplifySession();
  const amplifyIdToken = amplifySession?.tokens?.idToken?.toString?.();
  const amplifyAccessToken = amplifySession?.tokens?.accessToken?.toString?.();
  const amplifyAuthorizationToken = amplifyIdToken || amplifyAccessToken;

  if (amplifyAuthorizationToken) {
    headers['X-Amplify-Authorization'] = `Bearer ${amplifyAuthorizationToken}`;
  }
  if (amplifyIdToken) {
    headers['X-Amplify-Id-Token'] = `Bearer ${amplifyIdToken}`;
  }
  if (amplifyAccessToken) {
    headers['X-Amplify-Access-Token'] = `Bearer ${amplifyAccessToken}`;
  }

  if (typeof window !== 'undefined') {
    headers['X-Origin-URL'] = window.location.href;
  }

  return headers;
};

/** @param {LegacyAppApiRequest} options */
const requestLegacyAppApi = async ({
  path,
  method = 'GET',
  data,
  params,
  includeFunctionsVersion = false,
  unavailableMessage,
  requestName = path,
}) => {
  if (!hasLegacyRuntimeConfig) {
    throw normalizeError(unavailableMessage);
  }

  const normalizedMethod = String(method || 'GET').toUpperCase();
  const hasRequestBody = !['GET', 'HEAD'].includes(normalizedMethod) && data !== undefined;
  const { body, contentType } = hasRequestBody
    ? serializeLegacyPayload('Legacy API', requestName, data)
    : { body: undefined, contentType: null };
  const queryString = buildLegacyQueryString(params);
  const requestPath = queryString ? `${path}${path.includes('?') ? '&' : '?'}${queryString}` : path;

  let response;
  try {
    response = await fetch(getLegacyApiUrl(requestPath), {
      method: normalizedMethod,
      headers: await buildLegacyHeaders({ contentType, includeFunctionsVersion }),
      body,
    });
  } catch (error) {
    throw normalizeError(error?.message || `${requestName} request failed.`, {
      cause: error,
    });
  }

  const responseData = await parseLegacyResponseBody(response);
  if (!response.ok) {
    throw normalizeError(getLegacyErrorMessage(responseData, `${requestName} request failed.`), {
      status: response.status,
      code: responseData?.code,
      data: responseData,
    });
  }

  return {
    data: responseData,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  };
};

const requestLegacyApi = async ({ path, data, kind, name, includeFunctionsVersion = false, unavailableMessage }) => {
  if (!hasLegacyRuntimeConfig) {
    throw normalizeError(unavailableMessage);
  }

  const { body, contentType } = serializeLegacyPayload(kind, name, data);

  let response;
  try {
    response = await fetch(getLegacyApiUrl(path), {
      method: 'POST',
      headers: await buildLegacyHeaders({ contentType, includeFunctionsVersion }),
      body,
    });
  } catch (error) {
    throw normalizeError(error?.message || `${kind} ${name} request failed.`, {
      cause: error,
    });
  }

  const responseData = await parseLegacyResponseBody(response);
  if (!response.ok) {
    throw normalizeError(getLegacyErrorMessage(responseData, `${kind} ${name} request failed.`), {
      status: response.status,
      code: responseData?.code,
      data: responseData,
    });
  }

  return {
    data: responseData,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  };
};

const invokeLegacyFunction = (functionName, data) =>
  requestLegacyApi({
    path: `/apps/${appId}/functions/${functionName}`,
    data,
    kind: 'Function',
    name: functionName,
    includeFunctionsVersion: true,
    unavailableMessage: `The functions.${String(functionName)} operation is not available in Amplify mode without legacy runtime configuration.`,
  });

const getLegacyIntegrationPath = (packageName, endpointName) =>
  packageName === 'Core'
    ? `/apps/${appId}/integration-endpoints/Core/${endpointName}`
    : `/apps/${appId}/integration-endpoints/installable/${packageName}/integration-endpoints/${endpointName}`;

const invokeLegacyIntegration = (packageName, endpointName, data) =>
  requestLegacyApi({
    path: getLegacyIntegrationPath(packageName, endpointName),
    data,
    kind: 'Integration',
    name: `${packageName}.${endpointName}`,
    unavailableMessage: `The integrations.${String(packageName)}.${String(endpointName)} operation is not available in Amplify mode without legacy runtime configuration.`,
  });

const invokeIntegrationEndpoint = async (packageName, endpointName, data) => {
  const response = await invokeLegacyIntegration(packageName, endpointName, data);
  return response.data;
};

const removeNilValues = input => Object.fromEntries(Object.entries(input || {}).filter(([, value]) => value !== undefined));

const isPlainObject = value => Boolean(value && typeof value === 'object' && !Array.isArray(value));

const cloneJsonObject = value => (isPlainObject(value) ? { ...value } : {});

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

/** @param {LegacyEntityParamsInput} [options] */
const buildLegacyEntityParams = ({ query, sort, limit, skip, fields } = {}) => {
  const params = removeNilValues({
    q: query === undefined ? undefined : JSON.stringify(query),
    sort,
    limit,
    skip,
    fields: Array.isArray(fields) ? fields.join(',') : fields,
  });

  return Object.keys(params).length ? params : undefined;
};

/** @param {LegacyCurrentUserRequest} [options] */
const requestLegacyCurrentUser = async ({ method = 'GET', data } = {}) => {
  const response = await requestLegacyAppApi({
    path: `/apps/${appId}/entities/User/me`,
    method,
    data,
    unavailableMessage: 'The current user operation is not available without legacy runtime configuration.',
    requestName: `auth.${method === 'PUT' ? 'updateMe' : 'me'}`,
  });

  return response.data;
};

const createLegacyEntityAdapter = entityName => ({
  list: async (sort, limit, skip, fields) => {
    const response = await requestLegacyAppApi({
      path: `/apps/${appId}/entities/${entityName}`,
      method: 'GET',
      params: buildLegacyEntityParams({ sort, limit, skip, fields }),
      unavailableMessage: `The ${entityName}.list operation is not available without legacy runtime configuration.`,
      requestName: `${entityName}.list`,
    });

    return response.data;
  },
  filter: async (query, sort, limit, skip, fields) => {
    const response = await requestLegacyAppApi({
      path: `/apps/${appId}/entities/${entityName}`,
      method: 'GET',
      params: buildLegacyEntityParams({ query, sort, limit, skip, fields }),
      unavailableMessage: `The ${entityName}.filter operation is not available without legacy runtime configuration.`,
      requestName: `${entityName}.filter`,
    });

    return response.data;
  },
  get: async id => {
    const response = await requestLegacyAppApi({
      path: `/apps/${appId}/entities/${entityName}/${id}`,
      method: 'GET',
      unavailableMessage: `The ${entityName}.get operation is not available without legacy runtime configuration.`,
      requestName: `${entityName}.get`,
    });

    return response.data;
  },
  create: async input => {
    const response = await requestLegacyAppApi({
      path: `/apps/${appId}/entities/${entityName}`,
      method: 'POST',
      data: input,
      unavailableMessage: `The ${entityName}.create operation is not available without legacy runtime configuration.`,
      requestName: `${entityName}.create`,
    });

    return response.data;
  },
  update: async (id, input) => {
    const response = await requestLegacyAppApi({
      path: `/apps/${appId}/entities/${entityName}/${id}`,
      method: 'PUT',
      data: input,
      unavailableMessage: `The ${entityName}.update operation is not available without legacy runtime configuration.`,
      requestName: `${entityName}.update`,
    });

    return response.data;
  },
  delete: async id => {
    const response = await requestLegacyAppApi({
      path: `/apps/${appId}/entities/${entityName}/${id}`,
      method: 'DELETE',
      unavailableMessage: `The ${entityName}.delete operation is not available without legacy runtime configuration.`,
      requestName: `${entityName}.delete`,
    });

    return response.data;
  },
});

const COMPONENT_DATA_FIELDS = [
  'description',
  'estimated_lifetime_years',
  'replacement_cost',
  'residual_value',
  'maintenance_notes',
  'ai_insights',
  'ai_insights_generated_date',
];

const TASK_DATA_FIELDS = [
  'component_id',
  'estimated_cost',
  'ai_recommendations',
  'recommendations_generated_date',
  'sent_to_providers',
  'ai_generated',
];

const LEGACY_METADATA_SENTINEL = '\n\n__HX_LEGACY_META__:';

const BOOKING_LEGACY_FIELDS = [
  'booking_type',
  'status',
  'service_name',
  'check_in_date',
  'check_out_date',
  'lease_months',
  'number_of_nights',
  'number_of_guests',
  'nightly_rate',
  'monthly_rate',
  'special_requests',
  'owner_response',
  'confirmed_date',
  'redeemed_date',
];

const OFFER_LEGACY_FIELDS = [
  'property_address',
  'buyer_phone',
  'buyer_address',
  'earnest_money_deposit',
  'down_payment_percent',
  'financing_type',
  'financing_details',
  'inspection_contingency',
  'inspection_period_days',
  'appraisal_contingency',
  'financing_contingency',
  'closing_date',
  'expiration_date',
  'closing_cost_responsibility',
  'additional_terms',
  'contingencies',
  'counter_offer_amount',
  'counter_offer_terms',
  'seller_response',
  'accepted_date',
];

const USER_EMAIL_DEFAULT_MODELS = new Set(['PropertyComponent', 'MaintenanceTask', 'Report', 'SavedDeal', 'Transaction']);

const conditionRatingToLabel = rating => {
  const numericRating = Number(rating);
  if (Number.isNaN(numericRating)) {
    return undefined;
  }
  if (numericRating >= 4.5) return 'excellent';
  if (numericRating >= 3.5) return 'good';
  if (numericRating >= 2.5) return 'fair';
  return 'poor';
};

const conditionLabelToRating = label => {
  if (label == null || label === '') {
    return null;
  }

  return {
    excellent: 5,
    good: 4,
    fair: 3,
    poor: 2,
  }[String(label).toLowerCase()] ?? null;
};

const SORT_FIELD_ALIASES = {
  created_date: 'createdAt',
  updated_date: 'updatedAt',
};

const parseSortSpec = value => {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const descending = value.startsWith('-');
  const rawField = descending ? value.slice(1) : value;
  return {
    descending,
    field: SORT_FIELD_ALIASES[rawField] || rawField,
  };
};

const compareValues = (left, right) => {
  if (left == null && right == null) return 0;
  if (left == null) return 1;
  if (right == null) return -1;

  const leftDate = Date.parse(left);
  const rightDate = Date.parse(right);
  if (!Number.isNaN(leftDate) && !Number.isNaN(rightDate)) {
    return leftDate - rightDate;
  }

  if (typeof left === 'number' && typeof right === 'number') {
    return left - right;
  }

  return String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: 'base' });
};

const sortRecords = (records, sortValue) => {
  const sortSpec = parseSortSpec(sortValue);
  if (!sortSpec) {
    return records;
  }

  const sorted = [...records].sort((left, right) => compareValues(left?.[sortSpec.field], right?.[sortSpec.field]));
  return sortSpec.descending ? sorted.reverse() : sorted;
};

const toGraphQLFilter = criteria => {
  const clauses = Object.entries(criteria || {})
    .filter(([, value]) => value !== undefined)
    .map(([field, value]) => {
      if (field === 'service_id') {
        return { service_listing_id: { eq: value } };
      }
      if (field === 'offer_amount') {
        return { offered_price: { eq: value } };
      }
      return { [field]: { eq: value } };
    });

  if (clauses.length === 0) return undefined;
  if (clauses.length === 1) return clauses[0];
  return { and: clauses };
};

const splitLegacyMetadataText = value => {
  if (typeof value !== 'string') {
    return { text: value, metadata: {} };
  }

  const markerIndex = value.lastIndexOf(LEGACY_METADATA_SENTINEL);
  if (markerIndex === -1) {
    return { text: value, metadata: {} };
  }

  const text = value.slice(0, markerIndex);
  const rawMetadata = value.slice(markerIndex + LEGACY_METADATA_SENTINEL.length);

  try {
    const metadata = JSON.parse(rawMetadata);
    return {
      text,
      metadata: isPlainObject(metadata) ? metadata : {},
    };
  } catch {
    return { text: value, metadata: {} };
  }
};

const packLegacyMetadataText = (textValue, metadata) => {
  const baseText = textValue == null ? '' : String(textValue);
  const cleanMetadata = removeNilValues(cloneJsonObject(metadata));

  if (Object.keys(cleanMetadata).length === 0) {
    return baseText;
  }

  return `${baseText}${LEGACY_METADATA_SENTINEL}${JSON.stringify(cleanMetadata)}`;
};

const mergeParticipantOwnerIds = (...values) => {
  const emails = values.flatMap(value => {
    if (Array.isArray(value)) {
      return value;
    }
    return value == null ? [] : [value];
  });

  return [...new Set(emails
    .map(email => (typeof email === 'string' ? email.trim().toLowerCase() : ''))
    .filter(Boolean))];
};

const coerceAmplifyBookingType = bookingType => {
  switch (bookingType) {
    case 'property_sales':
      return 'deal_purchase';
    case 'long_term_rent':
      return 'short_term_rent';
    case 'short_term_rent':
    case 'deal_purchase':
    case 'property_viewing':
    case 'service':
      return bookingType;
    default:
      return 'service';
  }
};

const coerceAmplifyBookingStatus = status => {
  switch (status) {
    case 'rejected':
      return 'cancelled';
    case 'redeemed':
      return 'completed';
    case 'pending':
    case 'paid':
    case 'confirmed':
    case 'completed':
    case 'cancelled':
      return status;
    default:
      return status || 'pending';
  }
};

const normalizeRecord = (modelName, record) => {
  if (!record) {
    return record;
  }

  const normalized = { ...record };

  if (record.createdAt && !normalized.created_date) {
    normalized.created_date = record.createdAt;
  }
  if (record.updatedAt && !normalized.updated_date) {
    normalized.updated_date = record.updatedAt;
  }
  if (modelName === 'LeadCharge' && normalized.paid_at && !normalized.payment_date) {
    normalized.payment_date = normalized.paid_at;
  }
  if (modelName === 'ServiceListing') {
    if (normalized.years_experience == null && normalized.years_in_business != null) {
      normalized.years_experience = normalized.years_in_business;
    }
    if (normalized.years_in_business == null && normalized.years_experience != null) {
      normalized.years_in_business = normalized.years_experience;
    }
    if (typeof normalized.certifications === 'string') {
      normalized.certifications = normalized.certifications ? [normalized.certifications] : [];
    }
  } else if (modelName === 'Booking') {
    const { text: unpackedMessage, metadata } = splitLegacyMetadataText(normalized.message);
    normalized.message = unpackedMessage;
    Object.assign(normalized, metadata);
    if (normalized.service_id == null && normalized.service_listing_id != null) {
      normalized.service_id = normalized.service_listing_id;
    }
    if (normalized.check_in_date == null && normalized.service_date != null) {
      normalized.check_in_date = normalized.service_date;
    }
    if (normalized.redeemed && normalized.status === 'completed' && !metadata.status) {
      normalized.status = 'redeemed';
    }
  } else if (modelName === 'Offer') {
    const { text: unpackedMessage, metadata } = splitLegacyMetadataText(normalized.message);
    normalized.message = unpackedMessage;
    Object.assign(normalized, metadata);
    if (normalized.offer_amount == null && normalized.offered_price != null) {
      normalized.offer_amount = normalized.offered_price;
    }
    if (normalized.offered_price == null && normalized.offer_amount != null) {
      normalized.offered_price = normalized.offer_amount;
    }
  } else if (modelName === 'PropertyComponent') {
    const componentData = cloneJsonObject(normalized.component_data);

    if (normalized.brand == null && normalized.manufacturer != null) {
      normalized.brand = normalized.manufacturer;
    }
    if (normalized.model == null && normalized.model_number != null) {
      normalized.model = normalized.model_number;
    }
    if (normalized.installation_year == null) {
      if (componentData.installation_year != null) {
        normalized.installation_year = componentData.installation_year;
      } else if (normalized.install_date) {
        const parsedYear = Number.parseInt(String(normalized.install_date).slice(0, 4), 10);
        if (!Number.isNaN(parsedYear)) {
          normalized.installation_year = parsedYear;
        }
      }
    }
    if (normalized.current_condition == null) {
      normalized.current_condition = componentData.current_condition || conditionRatingToLabel(normalized.condition_rating);
    }

    COMPONENT_DATA_FIELDS.forEach(field => {
      if (normalized[field] == null && componentData[field] !== undefined) {
        normalized[field] = componentData[field];
      }
    });
  } else if (modelName === 'MaintenanceTask') {
    const taskData = cloneJsonObject(normalized.task_data);
    TASK_DATA_FIELDS.forEach(field => {
      if (normalized[field] == null && taskData[field] !== undefined) {
        normalized[field] = taskData[field];
      }
    });
  } else if (modelName === 'Report') {
    const reportData = cloneJsonObject(normalized.report_data);
    if (normalized.summary == null) {
      normalized.summary = reportData.summary || reportData.executive_summary;
    }
  }

  return normalized;
};

const normalizeModelInput = (modelName, input, existingRecord = null) => {
  const normalized = removeNilValues({ ...(input || {}) });

  delete normalized.created_date;
  delete normalized.updated_date;

  if (modelName === 'LeadCharge') {
    if (hasOwn(normalized, 'payment_date') && !hasOwn(normalized, 'paid_at')) {
      normalized.paid_at = normalized.payment_date;
    }
    delete normalized.payment_date;
    delete normalized.payment_method;
  } else if (modelName === 'ProviderSettings') {
    delete normalized.total_amount_billed;
  } else if (modelName === 'Booking') {
    const existingPacked = splitLegacyMetadataText(existingRecord?.message);
    const legacyMetadata = {
      ...existingPacked.metadata,
    };
    const nextVisibleMessage = hasOwn(normalized, 'message') ? normalized.message : existingPacked.text;
    const originalBookingType = normalized.booking_type ?? legacyMetadata.booking_type ?? existingRecord?.booking_type;
    const originalStatus = normalized.status ?? legacyMetadata.status ?? existingRecord?.status;

    if (hasOwn(normalized, 'service_id') && !hasOwn(normalized, 'service_listing_id')) {
      normalized.service_listing_id = normalized.service_id;
    }
    if (hasOwn(normalized, 'check_in_date') && !hasOwn(normalized, 'service_date')) {
      normalized.service_date = normalized.check_in_date;
    }

    BOOKING_LEGACY_FIELDS.forEach(field => {
      if (hasOwn(normalized, field)) {
        legacyMetadata[field] = normalized[field];
        delete normalized[field];
      }
    });

    delete normalized.service_id;

    normalized.booking_type = coerceAmplifyBookingType(originalBookingType);
    normalized.status = coerceAmplifyBookingStatus(originalStatus);
    if (normalized.payment_status == null && normalized.status === 'paid') {
      normalized.payment_status = 'paid';
    }
    if (originalStatus === 'redeemed') {
      normalized.redeemed = true;
    }
    if (!hasOwn(normalized, 'redeemed') && existingRecord?.redeemed != null) {
      normalized.redeemed = existingRecord.redeemed;
    }
    if (originalBookingType && originalBookingType !== normalized.booking_type) {
      legacyMetadata.booking_type = originalBookingType;
    }
    if (originalStatus && originalStatus !== normalized.status) {
      legacyMetadata.status = originalStatus;
    }

    normalized.participant_owner_ids = mergeParticipantOwnerIds(
      normalized.participant_owner_ids,
      existingRecord?.participant_owner_ids,
      normalized.renter_email,
      normalized.owner_email,
      existingRecord?.renter_email,
      existingRecord?.owner_email,
    );

    normalized.message = packLegacyMetadataText(nextVisibleMessage, legacyMetadata);
  } else if (modelName === 'ServiceListing') {
    if (normalized.years_experience != null && normalized.years_in_business == null) {
      normalized.years_in_business = normalized.years_experience;
    }
    if (normalized.years_in_business != null && normalized.years_experience == null) {
      normalized.years_experience = normalized.years_in_business;
    }
    if (typeof normalized.certifications === 'string') {
      normalized.certifications = normalized.certifications
        .split(',')
        .map(value => value.trim())
        .filter(Boolean);
    }
  } else if (modelName === 'PropertyComponent') {
    const componentData = {
      ...cloneJsonObject(existingRecord?.component_data),
      ...cloneJsonObject(normalized.component_data),
    };

    if (hasOwn(normalized, 'brand') && !hasOwn(normalized, 'manufacturer')) {
      normalized.manufacturer = normalized.brand;
    }
    if (hasOwn(normalized, 'model') && !hasOwn(normalized, 'model_number')) {
      normalized.model_number = normalized.model;
    }

    if (hasOwn(normalized, 'installation_year')) {
      const installationYear = normalized.installation_year == null || normalized.installation_year === ''
        ? null
        : Number.parseInt(String(normalized.installation_year), 10);
      normalized.install_date = Number.isNaN(installationYear) || installationYear == null ? null : `${installationYear}-01-01`;
      componentData.installation_year = Number.isNaN(installationYear) ? null : installationYear;
      delete normalized.installation_year;
    }

    if (hasOwn(normalized, 'current_condition')) {
      componentData.current_condition = normalized.current_condition;
      if (!hasOwn(normalized, 'condition_rating')) {
        normalized.condition_rating = conditionLabelToRating(normalized.current_condition);
      }
      delete normalized.current_condition;
    }

    COMPONENT_DATA_FIELDS.forEach(field => {
      if (hasOwn(normalized, field)) {
        componentData[field] = normalized[field];
        delete normalized[field];
      }
    });

    delete normalized.brand;
    delete normalized.model;

    if (Object.keys(componentData).length > 0) {
      normalized.component_data = componentData;
    } else {
      delete normalized.component_data;
    }
  } else if (modelName === 'MaintenanceTask') {
    const taskData = {
      ...cloneJsonObject(existingRecord?.task_data),
      ...cloneJsonObject(normalized.task_data),
    };

    TASK_DATA_FIELDS.forEach(field => {
      if (hasOwn(normalized, field)) {
        taskData[field] = normalized[field];
        delete normalized[field];
      }
    });

    if (Object.keys(taskData).length > 0) {
      normalized.task_data = taskData;
    } else {
      delete normalized.task_data;
    }
  } else if (modelName === 'Report') {
    const shouldIncludeReportData = hasOwn(normalized, 'report_data') || hasOwn(normalized, 'summary');
    if (shouldIncludeReportData) {
      const reportData = {
        ...cloneJsonObject(existingRecord?.report_data),
        ...cloneJsonObject(normalized.report_data),
      };
      if (hasOwn(normalized, 'summary')) {
        reportData.summary = normalized.summary;
      }
      normalized.report_data = reportData;
    }
    delete normalized.summary;
  } else if (modelName === 'Offer') {
    const existingPacked = splitLegacyMetadataText(existingRecord?.message);
    const legacyMetadata = {
      ...existingPacked.metadata,
    };
    const nextVisibleMessage = hasOwn(normalized, 'message') ? normalized.message : existingPacked.text;

    if (hasOwn(normalized, 'offer_amount') && !hasOwn(normalized, 'offered_price')) {
      normalized.offered_price = normalized.offer_amount;
    }

    OFFER_LEGACY_FIELDS.forEach(field => {
      if (hasOwn(normalized, field)) {
        legacyMetadata[field] = normalized[field];
        delete normalized[field];
      }
    });

    delete normalized.offer_amount;

    if (normalized.status == null) {
      normalized.status = existingRecord?.status || 'pending';
    }

    normalized.participant_owner_ids = mergeParticipantOwnerIds(
      normalized.participant_owner_ids,
      existingRecord?.participant_owner_ids,
      normalized.buyer_email,
      normalized.seller_email,
      existingRecord?.buyer_email,
      existingRecord?.seller_email,
    );

    normalized.message = packLegacyMetadataText(nextVisibleMessage, legacyMetadata);
  } else if (modelName === 'Message') {
    if (normalized.is_read == null) {
      normalized.is_read = existingRecord?.is_read ?? false;
    }

    normalized.participant_owner_ids = mergeParticipantOwnerIds(
      normalized.participant_owner_ids,
      existingRecord?.participant_owner_ids,
      normalized.sender_email,
      normalized.recipient_email,
      existingRecord?.sender_email,
      existingRecord?.recipient_email,
    );
  } else if (modelName === 'Review') {
    if (normalized.status == null) {
      normalized.status = 'published';
    }
  }

  return normalized;
};

const getModelDefinition = entityName => {
  const modelName = ENTITY_TO_MODEL[entityName];
  return modelName ? { modelName, ...MODEL_DEFINITIONS[modelName] } : null;
};

const buildListQuery = definition => `
  query ${definition.listOperation}($filter: Model${definition.modelName}FilterInput, $limit: Int, $nextToken: String) {
    ${definition.listOperation}(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items { ${definition.selectionSet} }
      nextToken
    }
  }
`;

const buildCreateMutation = definition => `
  mutation ${definition.createOperation}($input: Create${definition.modelName}Input!) {
    ${definition.createOperation}(input: $input) {
      ${definition.selectionSet}
    }
  }
`;

const buildUpdateMutation = definition => `
  mutation ${definition.updateOperation}($input: Update${definition.modelName}Input!) {
    ${definition.updateOperation}(input: $input) {
      ${definition.selectionSet}
    }
  }
`;

const buildDeleteMutation = definition => `
  mutation ${definition.deleteOperation}($input: Delete${definition.modelName}Input!) {
    ${definition.deleteOperation}(input: $input) {
      ${definition.selectionSet}
    }
  }
`;

const extractGraphQLData = (payload, operationName) => {
  if (payload?.errors?.length) {
    const [firstError] = payload.errors;
    throw normalizeError(firstError?.message || `Amplify GraphQL request failed for ${operationName}.`, {
      details: payload.errors,
    });
  }

  return payload?.data?.[operationName];
};

const getAmplifySession = async () => {
  if (!isAmplifyRuntimeEnabled) {
    return null;
  }

  try {
    const session = await fetchAuthSession();
    const hasUserPoolTokens = Boolean(session?.tokens?.accessToken || session?.tokens?.idToken);
    return hasUserPoolTokens ? session : null;
  } catch (error) {
    return null;
  }
};

const hasAmplifySession = async () => Boolean(await getAmplifySession());

const hasAmplifyAdminGroup = groups => {
  const normalizedGroups = Array.isArray(groups) ? groups : [groups].filter(Boolean);
  return normalizedGroups.includes('ADMINS');
};

const resolveAmplifyAppRole = groups => (hasAmplifyAdminGroup(groups) ? 'admin' : 'member');

const getReadAuthMode = async definition => {
  const session = await getAmplifySession();
  if (session) {
    return 'userPool';
  }

  if (definition.readAccess === 'public' && amplifyRuntimeConfig.apiKey) {
    return 'apiKey';
  }

  return null;
};

const canUseAmplifyEntity = async (definition, operation) => {
  if (!isAmplifyRuntimeEnabled || !definition) {
    return false;
  }

  if (operation === 'list' || operation === 'filter') {
    return Boolean(await getReadAuthMode(definition));
  }

  return hasAmplifySession();
};

const shouldUseAmplifyEntityOperation = async (definition, operation) => {
  if (definition?.legacyOperations?.includes(operation)) {
    return false;
  }

  return canUseAmplifyEntity(definition, operation);
};

const graphql = async ({ query, variables, authMode, operationName }) => {
  const payload = await getGraphQLClient().graphql({ query, variables, authMode });
  return extractGraphQLData(payload, operationName);
};

const listModelRecords = async (definition, options = {}) => {
  const { filter, sort, limit } = /** @type {any} */ (options);
  const authMode = await getReadAuthMode(definition);
  if (!authMode) {
    throw normalizeError(`No usable Amplify auth mode is available for ${definition.modelName} reads.`);
  }

  const targetLimit = Math.min(limit || 1000, 1000);
  const pageSize = Math.min(targetLimit, 200);
  const items = [];
  let nextToken = null;

  do {
    const connection = await graphql({
      query: buildListQuery(definition),
      variables: {
        filter,
        limit: pageSize,
        ...(nextToken ? { nextToken } : {}),
      },
      authMode,
      operationName: definition.listOperation,
    });

    items.push(...(connection?.items || []));
    nextToken = connection?.nextToken || null;
  } while (nextToken && items.length < targetLimit);

  return sortRecords(items.slice(0, targetLimit).map(item => normalizeRecord(definition.modelName, item)), sort);
};

const parseListArgs = (sortOrLimit, limitArg) => {
  const limit = typeof limitArg === 'number' ? limitArg : typeof sortOrLimit === 'number' ? sortOrLimit : undefined;
  const sort = typeof sortOrLimit === 'string' ? sortOrLimit : undefined;
  return { limit, sort };
};

const parseFilterArgs = (criteria, sortOrLimit, limitArg) => {
  const { limit, sort } = parseListArgs(sortOrLimit, limitArg);
  return {
    filter: toGraphQLFilter(criteria),
    sort,
    limit,
  };
};

const resolveUserContext = async () => {
  const session = await getAmplifySession();
  if (!session) {
    throw normalizeError('Authentication required', { status: 401 });
  }

  const [currentUser, rawAttributes] = await Promise.all([
    getCurrentUser(),
    fetchUserAttributes().catch(() => ({})),
  ]);
  const attributes = /** @type {Record<string, string | undefined>} */ (rawAttributes || {});

  const email = attributes.email || session?.tokens?.idToken?.payload?.email || currentUser?.signInDetails?.loginId;
  const groups = session?.tokens?.accessToken?.payload?.['cognito:groups'] || session?.tokens?.idToken?.payload?.['cognito:groups'] || [];

  return {
    session,
    currentUser,
    attributes,
    email,
    groups: Array.isArray(groups) ? groups : [groups].filter(Boolean),
  };
};

const findUserProfileByEmail = async email => {
  const definition = getModelDefinition('User');
  const records = await listModelRecords(definition, {
    filter: toGraphQLFilter({ email }),
    limit: 1,
  });
  return records[0] || null;
};

const getAmplifyMe = async () => {
  const userContext = await resolveUserContext();
  const profile = userContext.email ? await findUserProfileByEmail(userContext.email) : null;
  return {
    ...profile,
    id: profile?.id || userContext.currentUser?.userId,
    email: userContext.email,
    full_name:
      profile?.full_name ||
      userContext.attributes?.name ||
      [userContext.attributes?.given_name, userContext.attributes?.family_name].filter(Boolean).join(' ') ||
      userContext.email,
    phone: profile?.phone || userContext.attributes?.phone_number || null,
    role: resolveAmplifyAppRole(userContext.groups),
  };
};

const findModelRecordById = async (definition, id) => {
  const records = await listModelRecords(definition, {
    filter: toGraphQLFilter({ id }),
    limit: 1,
  });
  return records[0] || null;
};

const maybeAddCurrentUserEmail = async (modelName, input) => {
  if (!USER_EMAIL_DEFAULT_MODELS.has(modelName) || input.user_email != null) {
    return input;
  }

  const userContext = await resolveUserContext();
  return userContext.email ? { ...input, user_email: userContext.email } : input;
};

const upsertAmplifyUserProfile = async input => {
  const definition = getModelDefinition('User');
  const userContext = await resolveUserContext();
  const normalizedInput = normalizeModelInput(definition.modelName, input);
  const existingProfile = userContext.email ? await findUserProfileByEmail(userContext.email) : null;
  const baseInput = {
    ...normalizedInput,
    email: userContext.email,
    full_name: normalizedInput.full_name || existingProfile?.full_name || userContext.attributes?.name || userContext.email,
    phone: normalizedInput.phone || existingProfile?.phone || userContext.attributes?.phone_number,
    role: resolveAmplifyAppRole(userContext.groups),
  };

  const operationName = existingProfile ? definition.updateOperation : definition.createOperation;
  const query = existingProfile ? buildUpdateMutation(definition) : buildCreateMutation(definition);
  const response = await graphql({
    query,
    variables: {
      input: existingProfile ? { id: existingProfile.id, ...baseInput } : baseInput,
    },
    authMode: 'userPool',
    operationName,
  });

  return normalizeRecord(definition.modelName, response);
};

export const getCurrentUserProfile = async () => {
  if (isAmplifyRuntimeEnabled && (await hasAmplifySession())) {
    return getAmplifyMe();
  }

  return requestLegacyCurrentUser();
};

/** @param {Record<string, any>} input */
export const updateCurrentUserProfile = async input => {
  if (isAmplifyRuntimeEnabled && (await hasAmplifySession())) {
    return upsertAmplifyUserProfile(input);
  }

  return requestLegacyCurrentUser({ method: 'PUT', data: input });
};

export const hasAuthenticatedUser = async () => {
  if (isAmplifyRuntimeEnabled && (await hasAmplifySession())) {
    return true;
  }

  if (!hasLegacyRuntimeConfig || !getLegacyAccessToken()) {
    return false;
  }

  try {
    await requestLegacyCurrentUser();
    return true;
  } catch {
    return false;
  }
};

/** @param {string | null | undefined} redirectUrl */
export const redirectToLogin = async redirectUrl => {
  if (typeof window !== 'undefined') {
    const targetUrl = redirectUrl || window.location.href;
    window.location.assign(buildLoginUrl(targetUrl));
  }
};

/** @param {string | null | undefined} redirectUrl */
export const redirectToAppLogin = redirectUrl => {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  const targetUrl = redirectUrl || window.location.href;
  window.location.assign(buildLoginUrl(targetUrl));
  return Promise.resolve();
};

/** @param {string | null | undefined} redirectUrl */
export const logoutCurrentUser = async redirectUrl => {
  if (isAmplifyRuntimeEnabled && (await hasAmplifySession())) {
    await signOut();
    if (redirectUrl) {
      window.location.assign(redirectUrl);
    }
    return;
  }

  clearLegacyAccessToken();

  if (typeof window === 'undefined') {
    return;
  }

  const fromUrl = redirectUrl || window.location.href;

  if (hasLegacyRuntimeConfig) {
    window.location.assign(getLegacyApiUrl(`/apps/auth/logout?from_url=${encodeURIComponent(fromUrl)}`));
    return;
  }

  window.location.assign(fromUrl);
};

const createEntityAdapter = entityName => {
  const definition = getModelDefinition(entityName);

  if (!definition) {
    return createLegacyEntityAdapter(entityName);
  }

  const legacyEntity = createLegacyEntityAdapter(entityName);

  return {
    list: async (sortOrLimit, limitArg) => {
      if (!(await shouldUseAmplifyEntityOperation(definition, 'list'))) {
        return legacyEntity.list(sortOrLimit, limitArg);
      }
      return listModelRecords(definition, parseListArgs(sortOrLimit, limitArg));
    },
    filter: async (criteria, sortOrLimit, limitArg) => {
      if (!(await shouldUseAmplifyEntityOperation(definition, 'filter'))) {
        return legacyEntity.filter(criteria, sortOrLimit, limitArg);
      }
      return listModelRecords(definition, parseFilterArgs(criteria, sortOrLimit, limitArg));
    },
    create: async input => {
      if (!(await shouldUseAmplifyEntityOperation(definition, 'create'))) {
        return legacyEntity.create(input);
      }
      const createInput = normalizeModelInput(
        definition.modelName,
        await maybeAddCurrentUserEmail(definition.modelName, input),
      );
      const created = await graphql({
        query: buildCreateMutation(definition),
        variables: { input: createInput },
        authMode: 'userPool',
        operationName: definition.createOperation,
      });
      return normalizeRecord(definition.modelName, created);
    },
    update: async (id, input) => {
      if (!(await shouldUseAmplifyEntityOperation(definition, 'update'))) {
        return legacyEntity.update(id, input);
      }
      const existingRecord = ['PropertyComponent', 'MaintenanceTask', 'Report', 'Booking', 'Offer', 'Message'].includes(definition.modelName)
        ? await findModelRecordById(definition, id)
        : null;
      const updated = await graphql({
        query: buildUpdateMutation(definition),
        variables: { input: { id, ...normalizeModelInput(definition.modelName, input, existingRecord) } },
        authMode: 'userPool',
        operationName: definition.updateOperation,
      });
      return normalizeRecord(definition.modelName, updated);
    },
    delete: async id => {
      if (!(await shouldUseAmplifyEntityOperation(definition, 'delete'))) {
        return legacyEntity.delete(id);
      }
      const deleted = await graphql({
        query: buildDeleteMutation(definition),
        variables: { input: { id } },
        authMode: 'userPool',
        operationName: definition.deleteOperation,
      });
      return normalizeRecord(definition.modelName, deleted);
    },
  };
};

const entityAdapterCache = new Map();

export const auth = new Proxy(
  {
    me: getCurrentUserProfile,
    updateMe: updateCurrentUserProfile,
    isAuthenticated: hasAuthenticatedUser,
    redirectToLogin,
    redirectToAppLogin,
    logout: logoutCurrentUser,
    setToken: async (accessToken, saveToStorage = true) => {
      setLegacyAccessToken(accessToken, { persist: saveToStorage !== false });
      return null;
    },
    verifyOtp: async payload => {
      const response = await requestLegacyAppApi({
        path: `/apps/${appId}/auth/verify-otp`,
        method: 'POST',
        data: {
          email: payload?.email,
          otp_code: payload?.otpCode,
        },
        unavailableMessage: 'OTP verification is only available through the legacy auth flow.',
        requestName: 'auth.verifyOtp',
      });

      if (response?.data?.access_token) {
        setLegacyAccessToken(response.data.access_token);
      }

      return response.data;
    },
  },
  {
    get(target, property) {
      if (property in target) {
        return target[property];
      }

      return undefined;
    },
  },
);

export const entities = new Proxy(
  {
    Query: {},
  },
  {
    get(target, property) {
      if (property in target) {
        return target[property];
      }

      if (!entityAdapterCache.has(property)) {
        entityAdapterCache.set(property, createEntityAdapter(property));
      }

      return entityAdapterCache.get(property);
    },
  },
);

export const functions = new Proxy(
  {
    invoke: (functionName, data) => invokeLegacyFunction(functionName, data),
  },
  {
    get(target, property) {
      if (property in target) {
        return target[property];
      }

      if (typeof property !== 'string' || property === 'then' || property.startsWith('_')) {
        return undefined;
      }

      return data => invokeLegacyFunction(property, data);
    },
  },
);

const createIntegrationEndpointProxy = packageName =>
  new Proxy(
    {},
    {
      get(_target, endpointName) {
        if (typeof endpointName !== 'string' || endpointName === 'then' || endpointName.startsWith('_')) {
          return undefined;
        }

        return data => invokeIntegrationEndpoint(packageName, endpointName, data);
      },
    },
  );

export const integrations = new Proxy(
  {},
  {
    get(_target, packageName) {
      if (typeof packageName !== 'string' || packageName === 'then' || packageName.startsWith('_')) {
        return undefined;
      }

      return createIntegrationEndpointProxy(packageName);
    },
  },
);

const agentConversationStore = new Map();

const agentConversationSubscribers = new Map();

const cloneAgentConversation = conversation => ({
  ...conversation,
  metadata: isPlainObject(conversation?.metadata) ? { ...conversation.metadata } : {},
  messages: Array.isArray(conversation?.messages) ? conversation.messages.map(message => ({ ...message })) : [],
});

const generateAgentConversationId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `conversation-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const getAgentConversation = conversationOrId => {
  const conversationId = typeof conversationOrId === 'string' ? conversationOrId : conversationOrId?.id;

  if (!conversationId) {
    throw normalizeError('A conversation id is required for agents operations.');
  }

  const conversation = agentConversationStore.get(conversationId);
  if (!conversation) {
    throw normalizeError(`Conversation ${conversationId} was not found.`);
  }

  return conversation;
};

const notifyAgentConversationSubscribers = conversationId => {
  const subscribers = agentConversationSubscribers.get(conversationId);
  const conversation = agentConversationStore.get(conversationId);

  if (!subscribers?.size || !conversation) {
    return;
  }

  const snapshot = cloneAgentConversation(conversation);
  subscribers.forEach(callback => {
    try {
      callback(snapshot);
    } catch {
      // Ignore subscriber errors so they do not break chat updates.
    }
  });
};

const getAgentSiteName = () => {
  if (typeof window === 'undefined') {
    return 'HomeXLink';
  }

  const hostPrefix = window.location.hostname.split('.')[0] || 'HomeXLink';
  return hostPrefix.charAt(0).toUpperCase() + hostPrefix.slice(1);
};

const buildAgentConversationPrompt = conversation => {
  const currentUrl = typeof window !== 'undefined' ? window.location.href : null;
  const recentMessages = conversation.messages
    .slice(-12)
    .map(message => `${message.role === 'assistant' ? 'Assistant' : 'User'}: ${message.content}`)
    .join('\n\n');

  return [
    `You are a helpful website assistant for ${getAgentSiteName()}, a home management and real estate platform.`,
    conversation?.metadata?.description ? `Conversation context: ${conversation.metadata.description}` : null,
    currentUrl ? `Current page URL: ${currentUrl}` : null,
    'Help users with navigation, features, onboarding, services, deals, insights, and property-management workflows.',
    'Keep replies concise, practical, and accurate to the app as described by the conversation.',
    'When suggesting internal navigation, use markdown links with href values like /Dashboard, /Services, /Deals, /Insights, /Profile, /Messages, or /PropertyCapture.',
    'Do not claim you completed actions in the app. If unsure, say so briefly and offer the closest helpful next step.',
    'Conversation so far:',
    recentMessages || 'No prior messages yet.',
    'Reply as the assistant to the latest user message.',
  ].filter(Boolean).join('\n\n');
};

const extractAgentResponseText = response => {
  if (typeof response === 'string') {
    return response.trim();
  }

  if (!response || typeof response !== 'object') {
    return '';
  }

  return [response.content, response.response, response.text, response.answer, response.message]
    .find(value => typeof value === 'string' && value.trim()) || '';
};

const agentMethods = {
  createConversation: async input => {
    const conversation = {
      id: generateAgentConversationId(),
      agent_name: input?.agent_name || 'website_assistant',
      metadata: isPlainObject(input?.metadata) ? { ...input.metadata } : {},
      messages: [],
    };

    agentConversationStore.set(conversation.id, conversation);
    return cloneAgentConversation(conversation);
  },
  getConversation: async conversationOrId => cloneAgentConversation(getAgentConversation(conversationOrId)),
  subscribeToConversation: (conversationOrId, callback) => {
    const conversation = getAgentConversation(conversationOrId);
    const conversationId = conversation.id;
    const subscribers = agentConversationSubscribers.get(conversationId) || new Set();

    subscribers.add(callback);
    agentConversationSubscribers.set(conversationId, subscribers);
    callback(cloneAgentConversation(conversation));

    return () => {
      subscribers.delete(callback);
      if (subscribers.size === 0) {
        agentConversationSubscribers.delete(conversationId);
      }
    };
  },
  addMessage: async (conversationOrId, message) => {
    const conversation = getAgentConversation(conversationOrId);
    const content = String(message?.content || '').trim();

    if (!content) {
      throw normalizeError('Message content is required.');
    }

    conversation.messages = [...conversation.messages, {
      role: message?.role === 'assistant' ? 'assistant' : 'user',
      content,
    }];
    notifyAgentConversationSubscribers(conversation.id);

    try {
      const response = await invokeIntegrationEndpoint('Core', 'InvokeLLM', {
        prompt: buildAgentConversationPrompt(conversation),
      });

      const assistantReply = extractAgentResponseText(response) || 'I’m sorry, I couldn’t generate a response right now.';
      conversation.messages = [...conversation.messages, {
        role: 'assistant',
        content: assistantReply,
      }];
    } catch {
      conversation.messages = [...conversation.messages, {
        role: 'assistant',
        content: 'I’m sorry, I’m having trouble responding right now. Please try again in a moment.',
      }];
    }

    notifyAgentConversationSubscribers(conversation.id);
    return cloneAgentConversation(conversation);
  },
};

export const agents = new Proxy(agentMethods, {
  get(target, property) {
    if (property in target) {
      return target[property];
    }

    return async () => {
      throw normalizeError(`The agents.${String(property)} operation is not available in Amplify mode without legacy runtime configuration.`);
    };
  },
});

export const appLogs = {
  logUserInApp: async () => null,
};

