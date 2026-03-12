import { defineAuth, secret } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: true,
    externalProviders: {
       callbackUrls: [
        'https://homexlink.com',
        'https://localhost.com',
      ],
      logoutUrls: [
        'https://homexlink.com',
        'https://localhost.com',
      ],
      google: { clientId: secret('GOOGLE_CLIENT_ID'), clientSecret: secret('GOOGLE_CLIENT_SECRET') },
      facebook: { clientId: secret('FACEBOOK_CLIENT_ID'), clientSecret: secret('FACEBOOK_CLIENT_SECRET') },
/*     signInWithApple: {
        clientId: secret('APPLE_CLIENT_ID'),
        keyId: secret('APPLE_KEY_ID'),
        privateKey: secret('APPLE_PRIVATE_KEY'),
        teamId: secret('APPLE_TEAM_ID'),
      }, */
    },
  },
  groups: ['ADMINS'],
});