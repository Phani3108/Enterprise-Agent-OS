# GitHub OAuth Setup for Zeta Prompt Library

## Quick Fix for Login Error

You're seeing `error=Configuration` because GitHub OAuth isn't configured yet.

## Step 1: Create GitHub OAuth App

1. Go to: https://github.com/settings/developers
2. Click **"New OAuth App"** (or "Register a new application")
3. Fill in the form:

   **Application name:** `Zeta Prompt Library (Local Dev)`
   
   **Homepage URL:** `http://localhost:4444`
   
   **Authorization callback URL:** `http://localhost:4444/api/auth/callback/github`
   
   **Description:** (Optional) `Local development instance of Zeta Prompt Library`

4. Click **"Register application"**

5. You'll see:
   - **Client ID:** Copy this (looks like: `Ov23li1A2B3C4D5E6F7G`)
   - **Client Secret:** Click "Generate a new client secret" → Copy it (looks like: `1234567890abcdef1234567890abcdef12345678`)

⚠️ **IMPORTANT:** Copy the Client Secret immediately - you can't see it again!

## Step 2: Update Your .env File

Edit `.env` in the project root:

```bash
# Replace these placeholder values with your real GitHub OAuth credentials:
AUTH_GITHUB_ID=Ov23li1A2B3C4D5E6F7G                    # ← Your Client ID
AUTH_GITHUB_SECRET=1234567890abcdef1234567890abcdef12345678  # ← Your Client Secret

# Also generate a proper AUTH_SECRET (run this command):
# openssl rand -base64 32
AUTH_SECRET=your-generated-secret-here
```

## Step 3: Restart Docker Compose

```bash
make compose-down
make compose-up
```

Or just restart:
```bash
docker compose restart zeta-prompt-library
```

## Step 4: Test Login

1. Go to: http://localhost:4444
2. Click **"Sign in with GitHub"**
3. Authorize the app
4. You should be logged in! ✅

## Troubleshooting

### Error: "Configuration"
- **Cause:** Missing or invalid `AUTH_GITHUB_ID` or `AUTH_GITHUB_SECRET`
- **Fix:** Double-check your .env file has the correct credentials

### Error: "OAuthCallback Error"
- **Cause:** Callback URL mismatch
- **Fix:** Ensure callback URL is exactly: `http://localhost:4444/api/auth/callback/github`

### Error: "redirect_uri_mismatch"
- **Cause:** GitHub OAuth app callback URL doesn't match
- **Fix:** Go back to GitHub OAuth app settings and verify callback URL

### Error: "UntrustedHost"
- **Cause:** NextAuth.js doesn't trust the URL
- **Fix:** This is expected in local dev without HTTPS - usually safe to ignore
- **Production Fix:** Use proper domain with HTTPS

## For Production Deployment

When deploying to production (e.g., `https://prompts.zeta.tech`):

1. Create a **separate** GitHub OAuth App for production:
   - **Homepage URL:** `https://prompts.zeta.tech`
   - **Callback URL:** `https://prompts.zeta.tech/api/auth/callback/github`

2. Store credentials in **Vault** (not .env):
   ```bash
   # vault kv put secret/cluster/zeta-prompt-library/application \
   #   AUTH_GITHUB_ID="production-client-id" \
   #   AUTH_GITHUB_SECRET="production-client-secret"
   ```

3. Update `helm-chart/values.yaml` (already configured):
   ```yaml
   envProperties:
     AUTH_GITHUB_ID: vault:secrets/data/cluster/zeta-prompt-library/application#AUTH_GITHUB_ID
     AUTH_GITHUB_SECRET: vault:secrets/data/cluster/zeta-prompt-library/application#AUTH_GITHUB_SECRET
   ```

## Alternative: Use GitHub Organization OAuth App

For Zeta organization-wide auth:

1. Go to: `https://github.com/organizations/YOUR_ZETA_ORG/settings/applications`
2. Create OAuth App there
3. All Zeta members can use it
4. Can restrict access to organization members only

## Quick Test Script

After configuration, test with:

```bash
# Check environment variables are loaded
docker exec zeta-prompt-library env | grep AUTH_GITHUB

# Test health check
curl http://localhost:4444/api/health

# Check auth configuration (should show github provider)
curl http://localhost:4444/api/auth/providers
```

## Current Status

Run this to see if GitHub OAuth is configured:

```bash
docker exec zeta-prompt-library node -e "console.log('AUTH_GITHUB_ID:', process.env.AUTH_GITHUB_ID ? 'Set ✅' : 'Missing ❌'); console.log('AUTH_GITHUB_SECRET:', process.env.AUTH_GITHUB_SECRET ? 'Set ✅' : 'Missing ❌')"
```

Expected output after configuration:
```
AUTH_GITHUB_ID: Set ✅
AUTH_GITHUB_SECRET: Set ✅
```
