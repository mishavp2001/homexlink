import { createClient } from '@base44/sdk';
import { generateClient } from 'aws-amplify/api';
import { fetchAuthSession, fetchUserAttributes, getCurrentUser, signInWithRedirect, signOut } from 'aws-amplify/auth';
import { appParams } from '@/lib/app-params';
import { amplifyRuntimeConfig, canUseManagedAmplifyLogin, isAmplifyRuntimeEnabled } from '@/lib/amplify-config';

const { appId, serverUrl, token, functionsVersion } = appParams;

export const hasLegacyBase44Config = Boolean(appId && serverUrl);

const legacyBase44 = hasLegacyBase44Config
  ? createClient({
      appId,
      serverUrl,
      token,
      functionsVersion,
      requiresAuth: false,
    })
  : null;

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
      'id', 'page_name', 'meta_title', 'meta_description', 'meta_keywords', 'is_auto_generated',
      'last_generated_date', 'createdAt', 'updatedAt'
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
  SavedDeal: {
    aliases: ['SavedDeal'],
    listOperation: 'listSavedDeals',
    createOperation: 'createSavedDeal',
    updateOperation: 'updateSavedDeal',
    deleteOperation: 'deleteSavedDeal',
    readAccess: 'private',
    selectionSet: 'id deal_id user_email notes createdAt updatedAt',
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

const normalizeError = (message, extra = {}) => Object.assign(new Error(message), extra);

const LEGACY_ACCESS_TOKEN_STORAGE_KEYS = ['base44_access_token', 'token'];

const getLegacyAccessToken = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return token || null;
  }

  try {
    for (const storageKey of LEGACY_ACCESS_TOKEN_STORAGE_KEYS) {
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

const requestLegacyApi = async ({ path, data, kind, name, includeFunctionsVersion = false, unavailableMessage }) => {
  if (!hasLegacyBase44Config) {
    throw normalizeError(unavailableMessage);
  }

  const { body, contentType } = serializeLegacyPayload(kind, name, data);
  const headers = {
    Accept: 'application/json',
    'X-App-Id': String(appId),
  };

  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  if (includeFunctionsVersion && functionsVersion) {
    headers['Base44-Functions-Version'] = functionsVersion;
  }

  const accessToken = getLegacyAccessToken();
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  if (typeof window !== 'undefined') {
    headers['X-Origin-URL'] = window.location.href;
  }

  let response;
  try {
    response = await fetch(getLegacyApiUrl(path), {
      method: 'POST',
      headers,
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
    unavailableMessage: `The functions.${String(functionName)} operation is not available in Amplify mode without legacy Base44 runtime configuration.`,
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
    unavailableMessage: `The integrations.${String(packageName)}.${String(endpointName)} operation is not available in Amplify mode without legacy Base44 runtime configuration.`,
  });

const ensureLegacyMethod = (group, method, entityName) => {
  const target = entityName ? legacyBase44?.[group]?.[entityName]?.[method] : legacyBase44?.[group]?.[method];
  if (typeof target !== 'function') {
    throw normalizeError(
      `The ${entityName ? `${entityName}.` : ''}${method} operation is not available without legacy Base44 runtime configuration.`,
    );
  }
  return target;
};

const callLegacyAuth = (method, ...args) => ensureLegacyMethod('auth', method).apply(legacyBase44.auth, args);

const callLegacyEntity = (entityName, method, ...args) =>
  ensureLegacyMethod('entities', method, entityName).apply(legacyBase44.entities[entityName], args);

const removeNilValues = input => Object.fromEntries(Object.entries(input || {}).filter(([, value]) => value !== undefined));

const isPlainObject = value => Boolean(value && typeof value === 'object' && !Array.isArray(value));

const cloneJsonObject = value => (isPlainObject(value) ? { ...value } : {});

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

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
    .map(([field, value]) => ({ [field]: { eq: value } }));

  if (clauses.length === 0) return undefined;
  if (clauses.length === 1) return clauses[0];
  return { and: clauses };
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

  if (modelName === 'ServiceListing') {
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
    id: profile?.id || userContext.currentUser?.userId,
    email: userContext.email,
    full_name:
      profile?.full_name ||
      userContext.attributes?.name ||
      [userContext.attributes?.given_name, userContext.attributes?.family_name].filter(Boolean).join(' ') ||
      userContext.email,
    phone: profile?.phone || userContext.attributes?.phone_number || null,
    role: userContext.groups.includes('ADMINS') ? 'admin' : profile?.role || 'member',
    ...profile,
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
    email: userContext.email,
    full_name: normalizedInput.full_name || existingProfile?.full_name || userContext.attributes?.name || userContext.email,
    phone: normalizedInput.phone || existingProfile?.phone || userContext.attributes?.phone_number,
    role: userContext.groups.includes('ADMINS') ? 'admin' : normalizedInput.role || existingProfile?.role || 'member',
    ...normalizedInput,
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

const createEntityAdapter = entityName => {
  const definition = getModelDefinition(entityName);

  if (!definition) {
    return legacyBase44?.entities?.[entityName] || {
      list: (...args) => callLegacyEntity(entityName, 'list', ...args),
      filter: (...args) => callLegacyEntity(entityName, 'filter', ...args),
      create: (...args) => callLegacyEntity(entityName, 'create', ...args),
      update: (...args) => callLegacyEntity(entityName, 'update', ...args),
      delete: (...args) => callLegacyEntity(entityName, 'delete', ...args),
    };
  }

  return {
    list: async (sortOrLimit, limitArg) => {
      if (!(await canUseAmplifyEntity(definition, 'list'))) {
        return callLegacyEntity(entityName, 'list', sortOrLimit, limitArg);
      }
      return listModelRecords(definition, parseListArgs(sortOrLimit, limitArg));
    },
    filter: async (criteria, sortOrLimit, limitArg) => {
      if (!(await canUseAmplifyEntity(definition, 'filter'))) {
        return callLegacyEntity(entityName, 'filter', criteria, sortOrLimit, limitArg);
      }
      return listModelRecords(definition, parseFilterArgs(criteria, sortOrLimit, limitArg));
    },
    create: async input => {
      if (!(await canUseAmplifyEntity(definition, 'create'))) {
        return callLegacyEntity(entityName, 'create', input);
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
      if (!(await canUseAmplifyEntity(definition, 'update'))) {
        return callLegacyEntity(entityName, 'update', id, input);
      }
      const existingRecord = ['PropertyComponent', 'MaintenanceTask', 'Report'].includes(definition.modelName)
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
      if (!(await canUseAmplifyEntity(definition, 'delete'))) {
        return callLegacyEntity(entityName, 'delete', id);
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

const auth = new Proxy(
  {
    me: async () => {
      if (isAmplifyRuntimeEnabled && (await hasAmplifySession())) {
        return getAmplifyMe();
      }
      return callLegacyAuth('me');
    },
    updateMe: async input => {
      if (isAmplifyRuntimeEnabled && (await hasAmplifySession())) {
        return upsertAmplifyUserProfile(input);
      }
      return callLegacyAuth('updateMe', input);
    },
    isAuthenticated: async () => {
      if (isAmplifyRuntimeEnabled && (await hasAmplifySession())) {
        return true;
      }
      if (legacyBase44?.auth?.isAuthenticated) {
        return legacyBase44.auth.isAuthenticated();
      }
      return false;
    },
    redirectToLogin: async redirectUrl => {
      if (isAmplifyRuntimeEnabled && canUseManagedAmplifyLogin) {
        const targetUrl = redirectUrl || window.location.href;
        sessionStorage.setItem('amplify_post_login_redirect', targetUrl);
        await signInWithRedirect();
        return;
      }
      if (legacyBase44?.auth?.redirectToLogin) {
        return legacyBase44.auth.redirectToLogin(redirectUrl);
      }
      window.location.assign(window.location.origin);
    },
    logout: async redirectUrl => {
      if (isAmplifyRuntimeEnabled && (await hasAmplifySession())) {
        await signOut();
        if (redirectUrl) {
          window.location.assign(redirectUrl);
        }
        return;
      }
      if (legacyBase44?.auth?.logout) {
        return legacyBase44.auth.logout(redirectUrl);
      }
      if (redirectUrl) {
        window.location.assign(redirectUrl);
      }
    },
    setToken: async accessToken => {
      if (legacyBase44?.auth?.setToken) {
        return legacyBase44.auth.setToken(accessToken);
      }
      throw normalizeError('Manual token injection is only available through the legacy Base44 auth flow.');
    },
    verifyOtp: async payload => {
      if (legacyBase44?.auth?.verifyOtp) {
        return legacyBase44.auth.verifyOtp(payload);
      }
      throw normalizeError('OTP verification is only available through the legacy Base44 auth flow.');
    },
  },
  {
    get(target, property) {
      if (property in target) {
        return target[property];
      }
      const legacyValue = legacyBase44?.auth?.[property];
      return typeof legacyValue === 'function' ? legacyValue.bind(legacyBase44.auth) : legacyValue;
    },
  },
);

const entities = new Proxy(
  {
    Query: legacyBase44?.entities?.Query || {},
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

const functions = new Proxy(
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

        return async data => {
          const response = await invokeLegacyIntegration(packageName, endpointName, data);
          return response.data;
        };
      },
    },
  );

const integrations = new Proxy(
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

const fallbackProxy = groupName =>
  new Proxy(
    {},
    {
      get(_target, property) {
        const legacyValue = legacyBase44?.[groupName]?.[property];
        if (legacyValue !== undefined) {
          return typeof legacyValue === 'function' ? legacyValue.bind(legacyBase44[groupName]) : legacyValue;
        }
        return async () => {
          throw normalizeError(`The ${groupName}.${String(property)} operation is not available in Amplify mode without legacy Base44 runtime configuration.`);
        };
      },
    },
  );

export const base44 = {
  auth,
  entities,
  functions,
  integrations,
  agents: fallbackProxy('agents'),
  appLogs: legacyBase44?.appLogs || {
    logUserInApp: async () => null,
  },
};
