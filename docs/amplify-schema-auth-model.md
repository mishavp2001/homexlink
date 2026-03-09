## Amplify Gen 2 schema and auth proposal

This proposal is the target architecture for migrating the current Base44 app to Amplify Gen 2.

### Core decisions

- Use **Cognito User Pool** as the default auth mode.
- Use a single Cognito group: `ADMINS`.
- Use **API key auth only for public reads** (`ServiceListing`, `Deal`, `Insight`, `Category`, `PageMetadata`).
- Keep **shadow email fields** on business records for compatibility and notifications, but use **owner auth** as the real access control.
- Make `ServiceListing` the canonical public provider profile.
- Keep `UserProfile` private and lightweight: account state, role, verification, credits, and minimal provider summary.
- Use `a.json()` for legacy flexible payloads instead of prematurely normalizing every nested structure.

### Auth model

| Concern | Decision |
| --- | --- |
| Admin access | Cognito group `ADMINS`; full read/write across all admin-managed records |
| Homeowner/provider private data | `allow.owner()` on single-owner models |
| Shared two-party records | `allow.ownersDefinedIn('participant_owner_ids')` on `Booking`, `Offer`, `Message` |
| Public marketplace/profile content | `allow.publicApiKey().to(['read'])` |
| Guest onboarding / verification | handled by **functions**, not direct model writes |

### Canonical record ownership

- `UserProfile`, `Property`, `PropertyComponent`, `MaintenanceTask`, `Report`, `SavedDeal`, `Transaction`, `LeadCharge`, `ProviderSettings` use **single owner auth**.
- `ServiceListing` and `Deal` are **owner-managed** but **publicly readable**.
- `Booking`, `Offer`, `Message` store both participants' Cognito identities in `participant_owner_ids`.
- `Review` is publicly readable, reviewer-owned for edits/deletes, admin-moderated.
- `PendingUser` is **not** meant to be openly queryable; it should be created/consumed through functions.

### Function-first flows

These current Base44 flows should stay server-driven in Amplify instead of direct client model mutation:

1. `createPendingUser` / guest lead capture
2. `completePendingUserConversion` after sign-in
3. `searchGooglePlaces`
4. `sendSMSVerification`
5. `verifySMSCode`
6. `verifyEmailCode`
7. `stripeWebhook`
8. email/SMS sending and credit/billing side effects

Reason: these flows need validation, third-party secrets, anti-abuse controls, and cross-model writes.

### Important migration rule

Current code often authorizes by **email equality**. Amplify auth should instead authorize by **Cognito identity**:

- keep `*_email` fields for UX, search, and notifications
- add/store participant owner identities for shared records
- stop relying on client-side filtering of globally readable records for privacy

### Known design tradeoff

`Deal` and `ServiceListing` are currently filtered by `status: 'active'` in the client. If you need **hard enforcement** that only published records are public, move public browsing to custom queries such as `listPublicDeals` / `listPublicServiceListings` instead of raw model reads.

### Proposed files

- `docs/amplify/auth.resource.proposed.ts`
- `docs/amplify/data.resource.proposed.ts`

These are proposal files only; they are intentionally outside `amplify/` so they can be reviewed before package changes and real backend initialization.