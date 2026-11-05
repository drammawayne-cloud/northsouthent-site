# North South Entertainment — Phase 3 admin setup
The dashboard is available at /admin.html. The API is protected and cannot read customer records without authenticated sessions.

Required Cloudflare Pages secrets (project: northsouthent-site):
- ADMIN_USERNAME — approved administrator username
- ADMIN_PASS_SALT — random salt string
- ADMIN_PASS_HASH — Base64URL-encoded PBKDF2-HMAC-SHA256 of the password with UTF-8 salt, 210000 iterations, 32 bytes, no padding
- ADMIN_SESSION_KEY — random strong signing secret (at least 32 bytes)

Set them using the Cloudflare dashboard (Pages project > Settings > Variables and Secrets) or Wrangler Pages secret commands. Never commit credentials. After the secrets are configured, redeploy the latest deployment so Functions bind the secrets.

Security notes: auth cookies are HttpOnly, Secure, SameSite=Strict and expire in 12h; admin sign-in is rate limited in D1; operations require a signed session; records are only fetched on protected endpoints. Production should add 2FA, verified administrator identities, incident alerts, and privacy/retention policy.
