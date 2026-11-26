# Authentication design

## Implemented

- **Passwords:** Argon2id (19 MiB, t=2, p=1 — OWASP baseline). Minimum length 12, maximum 128.
  Login takes similar time whether or not the account exists (dummy hash verify).
- **Access token:** JWT HS256, 15 minutes, held in memory by the SPA (never localStorage).
  Claims: `sub`, `role`, `typ=access`.
- **Refresh token:** 48 random bytes, sent only as an `HttpOnly; SameSite=Strict; Path=/api/v1/auth`
  cookie (`Secure` in production). Only an HMAC-SHA256 of it is stored.
- **Rotation + reuse detection:** every refresh revokes the used token and issues a new one in the
  same family. Presenting a revoked token revokes the whole family (stolen-token defence).
  Concurrent refreshes with the same token are treated as reuse; the SPA uses a single-flight
  refresh so a normal browser never triggers this.
- **Logout** revokes the token family and clears the cookie.
- **Authorization:** global JWT guard (`@Public()` to opt out), `@Roles()` + RolesGuard, and
  resource ownership checks in services (other users' resources return 404).
- **Abuse protection:** global rate limit + stricter limit on `/auth/*` (per IP, per instance).
- **CSRF:** the only cookie-authenticated endpoints are refresh/logout, protected by
  `SameSite=Strict` + path scoping. All other endpoints use the bearer header.

## Decisions still required per project

- Email verification, password reset, MFA, account lockout and session/device management.
- Cross-site deployments (SPA and API on different sites) need `SameSite=None; Secure` plus a CSRF
  token; the default assumes same-site via the nginx `/api` proxy.
- Rate-limit storage in Redis when running more than one API replica.
- Key rotation for `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` (rotating the refresh secret logs
  everyone out).
