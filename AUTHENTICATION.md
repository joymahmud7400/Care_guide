# Local authentication and Google sign-in

LedgerLens starts with a one-time Admin setup when the user database is empty. Set the Admin name, email, password (at least 12 characters), and a 6–12 digit Admin PIN. The Admin PIN is stored as a salted one-way scrypt hash. Later, Admin sign-in requires the email, password, and PIN. Admins can create Employee accounts from **Manage employees** in the workspace. Employee account creation is not open to the public.

Admins can view and review every workspace document. Employees can view, upload, search, compare, edit, and reprocess only documents they uploaded. Document ownership is enforced by the local API, including document details and original-file downloads. Existing documents in an older database are assigned to the migrated Admin account.

Passwords are stored as per-account salts and scrypt hashes. The browser receives a random HttpOnly, SameSite=Strict session cookie; only its hash is saved in SQLite. Sessions expire after seven days. Ten failed sign-in attempts from one address are rate-limited for 15 minutes. Employees use their account password; Google sign-in, if configured, is available to Employee accounts. Admins must sign in with email, password, and the Admin PIN. There is no password reset flow yet, so keep account credentials safe.

## Configure Google sign-in

Google sign-in is optional. It uses the OpenID Connect `openid email profile` scopes to authenticate a Google account; it does not request Gmail message access. The backend verifies the signed ID token with Google's official Node.js authentication library. A verified Google account with the same email can be linked to the local owner account.

1. In [Google Cloud Console](https://console.cloud.google.com/), select or create a project and configure its OAuth consent screen. Add your own account as a test user if the app remains in testing mode.
2. Create an OAuth client with application type **Web application**.
3. Add this authorized JavaScript origin: `http://localhost:3000`.
4. Add this exact authorized redirect URI: `http://localhost:3000/api/auth/google/callback`.
5. In the OCR project, copy `.env.example` to `.env` and place the OAuth client ID and client secret in the matching variables. Keep the secret out of source files, screenshots, and GitHub.
6. Restart LedgerLens with `npm start`. The sign-in screen will then offer **Continue with Google**.

Google's web-server guide documents local redirect URIs for development and explains credential setup: [OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server). The callback exchanges Google's one-time authorization code on the server. Google ID tokens must be verified on the backend before they identify a signed-in user: [Verify the Google ID token on your server](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token).

Do not expose this local app to the public internet. This role-based setup separates accounts within one local database on this computer; it is not a hosted multi-device authentication service.
