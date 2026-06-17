# Role-Based Access Control (RBAC)

Wato uses a centralized permission system in `lib/permissions.ts` with enforcement helpers in `lib/auth-guards.ts`.

## Roles

| Role | Purpose |
|------|---------|
| `USER` | Default — challenges, attempts, social engagement |
| `MODERATOR` | Review and approve/reject submissions |
| `ADMIN` | Full moderation + reports + challenge management |

Roles are stored on `User.role`, included in the JWT session via NextAuth, and typed in `types/next-auth.d.ts`.

## Permissions

| Permission | Description | USER | MOD | ADMIN |
|------------|-------------|:----:|:---:|:-----:|
| `attempts.verify` | Approve/reject pending submissions | | ✓ | ✓ |
| `attempts.view_any` | View any attempt (any status) | | ✓ | ✓ |
| `reports.view` | View open reports dashboard | | | ✓ |
| `reports.resolve` | Resolve/dismiss reports | | | ✓ |
| `challenges.hide` | Hide challenges from feed | | | ✓ |
| `challenges.view_admin` | Admin challenges tab | | | ✓ |

## Usage

### Server components (redirect if denied)

```typescript
import { requirePermission } from '@/lib/auth-guards'
import { Permissions } from '@/lib/permissions'

const session = await requirePermission(Permissions.ATTEMPTS_VERIFY)
```

### Server actions (throw if denied)

```typescript
import { requireActionPermission } from '@/lib/auth-guards'
import { Permissions } from '@/lib/permissions'

await requireActionPermission(Permissions.REPORTS_RESOLVE)
```

### API routes

```typescript
import { requireApiPermission, requireApiUser } from '@/lib/auth-guards'
import { Permissions } from '@/lib/permissions'

const session = await requireApiUser()
if (session instanceof NextResponse) return session

const denied = requireApiPermission(session.user.role, Permissions.ATTEMPTS_VERIFY)
if (denied) return denied
```

### UI checks

```typescript
import { hasPermission, Permissions } from '@/lib/permissions'

if (hasPermission(session.user.role, Permissions.REPORTS_VIEW)) { ... }
```

## Enforcement map

| Surface | Guard |
|---------|-------|
| `POST /api/attempts/[id]/verify` | `attempts.verify` |
| `app/admin/actions.ts` | Per-action permission |
| `app/admin/page.tsx` | `attempts.verify` (page), UI gated by `reports.view` |
| `lib/attempt-access.ts` | `attempts.view_any` for staff visibility |

## Assigning roles

Roles are set via database or seed (`prisma/seed.ts`). There is no in-app role management UI yet.

- `demo1@test.com` → `ADMIN`
- `demo2@test.com` → `MODERATOR`

## Adding a new permission

1. Add to `Permissions` in `lib/permissions.ts`
2. Assign to roles in `ROLE_PERMISSIONS`
3. Enforce with `requireActionPermission` / `requireApiPermission` / `requirePermission`
4. Add tests in `tests/unit/lib/permissions.test.ts`
