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
  }

  return normalized;
};

const normalizeModelInput = (modelName, input) => {
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
      const created = await graphql({
        query: buildCreateMutation(definition),
        variables: { input: normalizeModelInput(definition.modelName, input) },
        authMode: 'userPool',
        operationName: definition.createOperation,
      });
      return normalizeRecord(definition.modelName, created);
    },
    update: async (id, input) => {
      if (!(await canUseAmplifyEntity(definition, 'update'))) {
        return callLegacyEntity(entityName, 'update', id, input);
      }
      const updated = await graphql({
        query: buildUpdateMutation(definition),
        variables: { input: { id, ...normalizeModelInput(definition.modelName, input) } },
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
  functions: fallbackProxy('functions'),
  integrations: fallbackProxy('integrations'),
  agents: fallbackProxy('agents'),
  appLogs: legacyBase44?.appLogs || {
    logUserInApp: async () => null,
  },
};
