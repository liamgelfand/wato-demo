# Security Policy

## Reporting a vulnerability

If you discover a security issue, please report it responsibly via GitHub Issues (mark as security-related) rather than opening a public issue with exploit details.

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact

## Security measures

Wato implements:

- **Authentication** — NextAuth with bcrypt password hashing
- **Authorization** — Centralized RBAC (`lib/permissions.ts`, `lib/auth-guards.ts`). See [RBAC.md](./RBAC.md).
- **Input validation** — Zod schemas on all API inputs
- **Content moderation** — Banned word filtering on challenges
- **Rate limiting** — Per-endpoint limits on API routes
- **Security headers** — CSP, HSTS, X-Frame-Options via Next.js config
- **Reporting** — User-submitted content reports with admin review

## Best practices for users

- Use a strong, unique password
- Only accept friend requests from people you know
- Report inappropriate challenges or attempts
- Never attempt challenges that feel unsafe

## For contributors

- Never commit `.env` files or secrets
- Run `npm audit` before submitting PRs
- Validate all user input server-side
- Use parameterized queries (Prisma handles this)
