# MappingBitcoin OSM Bot Account Setup

## Status: Backlog

The backend is ready to support venue submissions via a shared MappingBitcoin OSM account, but the frontend UI is currently hidden until the bot account token is configured.

## What This Enables

Users will be able to submit Bitcoin venues **without creating an OSM account**. The venue gets created under MappingBitcoin's OSM account instead of the user's personal account. This lowers the barrier to entry significantly.

## How to Get an OSM Access Token

1. **Create a dedicated OSM account** for MappingBitcoin (e.g., username "MappingBitcoin") at https://www.openstreetmap.org/user/new
2. Go to https://www.openstreetmap.org/oauth2/applications and click **Register new application**
3. Fill in:
   - Name: `MappingBitcoin Bot`
   - Redirect URIs: your production callback URL (e.g., `https://mappingbitcoin.com/api/auth/osm/callback`)
   - Scopes: check **write_api** (required to create nodes)
4. After creating the app, note the **Client ID** and **Client Secret**
5. To obtain a long-lived access token, perform the OAuth2 authorization flow manually:
   - Visit: `https://www.openstreetmap.org/oauth2/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&response_type=code&scope=write_api`
   - Authorize the application while logged into the MappingBitcoin account
   - You'll be redirected with a `?code=...` parameter
   - Exchange the code for a token:
     ```bash
     curl -X POST https://www.openstreetmap.org/oauth2/token \
       -d grant_type=authorization_code \
       -d code=THE_CODE \
       -d client_id=YOUR_CLIENT_ID \
       -d client_secret=YOUR_CLIENT_SECRET \
       -d redirect_uri=YOUR_REDIRECT_URI
     ```
   - The response contains `access_token` — this is your bot token

6. Set the env var in production:
   ```
   MAPPING_BITCOIN_OSM_ACCESS_TOKEN=your_token_here
   ```

## Backend (Ready)

- `lib/Environment.ts` — `serverEnv.osmBotAccessToken` getter
- `app/api/places/route.ts` — dual-mode token selection (`osmAccountMode: "mappingbitcoin" | "personal"`)
- `utils/OsmHelpers.ts` — `buildTagsFromForm` accepts optional `nostrPubkey` for attribution

## Frontend (Hidden, Ready to Enable)

- `components/place-form/OsmAccountChoice.tsx` — account choice radio cards + Nostr attribution checkbox
- `app/[locale]/places/create/PlaceSubmissionForm/index.tsx` — component is commented out with a TODO marker

### To Enable

1. Set `MAPPING_BITCOIN_OSM_ACCESS_TOKEN` in production env
2. In `PlaceSubmissionForm/index.tsx`:
   - Uncomment the `<OsmAccountChoice>` block (search for "TODO: Uncomment")
   - Change default `osmAccountMode` from `"personal"` to `"mappingbitcoin"` (search for "TODO: Change default")

## Optional: Nostr Attribution

When enabled, users can optionally attribute their venue submission to their Nostr profile. This adds a `note:submitted_by_nostr` tag to the OSM node and tags the user's pubkey in the Nostr announcement event. Attribution is off by default, even if the user is logged in with Nostr.
