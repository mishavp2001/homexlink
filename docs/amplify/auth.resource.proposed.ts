import { defineAuth } from '@aws-amplify/backend';

// Proposal only: move to amplify/auth/resource.ts during implementation.
// Keep Cognito groups minimal; model-level ownership handles homeowner/provider data.
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  groups: ['ADMINS'],
});