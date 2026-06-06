# ADR 0003 — Multi-tenant shared schema

Status: Accepted

## Context

Gardina is SaaS for many independent curtain salons. Each salon is a tenant
(`organizations`) whose users, clients, deals, measurements, catalog, payments, and
analytics must be strictly isolated from other tenants. We need isolation that is safe by
default, cheap to operate at the current scale, and uniform across all repositories.

Options considered:
- **Database-per-tenant** — strongest isolation, heavy operational cost (migrations,
  connections, provisioning per signup).
- **Schema-per-tenant** — moderate isolation, still per-tenant migration fan-out.
- **Shared schema with `organization_id`** on every table — simplest to operate, isolation
  enforced in application code.

## Decision

Use a **single shared schema**: every business table carries `organization_id`, and tenant
scoping is enforced at request scope via Node `AsyncLocalStorage`.

- `infrastructure/tenant/tenantContext.js` holds the request's `organizationId`.
- The auth middleware binds it after loading the user.
- Repositories call `getTenantId()` and add `organization_id` to every `WHERE` clause.
- `getTenantId()` **throws** if the context is missing — a query cannot accidentally run
  un-scoped.

## Consequences

**Positive**
- One schema, one migration path, one connection pool → low operational overhead; new
  tenant signup is just an `organizations` row.
- Cross-tenant analytics/ops queries are possible when explicitly intended.
- Tenant scoping is centralized and fail-closed (throws when unset).

**Negative**
- Isolation depends on application correctness; a repository that forgets the
  `organization_id` filter is a cross-tenant leak. (Mitigated by `getTenantId()` throwing
  and by centralizing scoping in repository helpers.)
- No physical separation — a single DB outage affects all tenants; noisy-neighbor load is
  shared.
- "Hard delete a tenant's data" / per-tenant restore is more work than dropping a database.

**Mitigations**
- Route all queries through repository helpers that inject the tenant filter; never write
  ad-hoc un-scoped SQL.
- Consider PostgreSQL Row-Level Security as defense-in-depth if the tenant count or
  compliance bar grows.
- Revisit schema-per-tenant or DB-per-tenant only if a large enterprise tenant requires
  physical isolation.
