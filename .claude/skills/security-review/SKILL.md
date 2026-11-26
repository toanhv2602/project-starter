---
name: security-review
description: Review code, API endpoints, authentication, authorization, secrets and deployment changes for security risks.
---

# Security Review

Check:

- Authentication and authorization at every sensitive endpoint.
- IDOR / tenant boundary violations.
- Input validation, injection, unsafe file handling and SSRF.
- Token lifetime, refresh rotation, replay/reuse handling and revocation.
- Password hashing and credential handling.
- Rate limiting and brute-force protections.
- Secret exposure in logs, errors, CI artifacts and source.
- Dependency/container vulnerabilities and excessive permissions.

Report findings by severity with file/line, impact and remediation. Do not claim a system is secure from static review alone.
