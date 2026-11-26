# Authentication design

## Intended model
- Short-lived JWT access token.
- Refresh token with rotation and revocation.
- Store only a cryptographic hash of refresh tokens in PostgreSQL.
- Track token family/session and expiry.
- Reuse detection revokes the affected token family.
- Apply rate limiting to login and refresh endpoints.
- Passwords must use a modern password hash (Argon2id preferred) with safe parameters.

## Decisions still required
- Browser token transport: HttpOnly Secure SameSite cookie vs refresh token returned to a trusted native client.
- CSRF strategy if cookies are used.
- Email verification, password reset, MFA and account recovery requirements.
- Session/device management policy.

Do not expose the starter publicly until these flows have implementation and integration tests plus security review.
