import { defineAuth, secret } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: true,    
    externalProviders: {
      callbackUrls: ['http://localhost:3000/'],
      logoutUrls: ['http://localhost:3000/'],
      google: { clientId: secret('GOOGLE_CLIENT_ID'), clientSecret: secret('GOOGLE_CLIENT_SECRET') },
      facebook: { clientId: secret('FACEBOOK_CLIENT_ID'), clientSecret: secret('FACEBOOK_CLIENT_SECRET') }
    },
  },
 groups: ['ADMINS'],
});