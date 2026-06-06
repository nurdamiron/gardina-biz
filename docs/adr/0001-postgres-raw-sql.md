# ADR 0001 — PostgreSQL with raw SQL (no ORM)

Status: Accepted

## Context

Gardina is a relational ERP: clients, deals (a lifecycle aggregate with many statuses),
measurements with per-window dimensions, proposals, production orders, installations,
payments, and tenant-scoped analytics. The data is highly relational and the reporting
endpoints (`/api/analytics/*`) require non-trivial aggregate queries (funnels, KPIs,
revenue breakdowns, retention). The backend follows DDD with explicit repository ports.

Options considered:
- A full ORM (e.g. Sequelize/TypeORM/Prisma) for productivity and migrations.
- A query builder.
- **Raw parameterized SQL via `pg`** behind repository interfaces.

## Decision

Use **PostgreSQL accessed with raw, parameterized SQL through `pg`**, implemented in
`infrastructure/repositories/` against domain repository interfaces. No ORM.

- Domain stays persistence-agnostic (depends only on repository ports).
- Multi-tenant scoping is applied uniformly: every query injects `organization_id` from
  the AsyncLocalStorage tenant context.
- Migrations are plain SQL under `infrastructure/database`.

## Consequences

**Positive**
- Full control over complex analytics SQL; no ORM query-translation surprises or N+1.
- Predictable performance; easy to read the exact query in `EXPLAIN`.
- Thin dependency surface; no ORM version churn.
- Clean DDD boundary — swapping the persistence layer means reimplementing repositories
  only.

**Negative**
- More boilerplate per repository; mapping rows to objects is manual.
- Migrations and schema drift are hand-managed (the team has already hit and fixed
  enum-drift bugs in analytics, e.g. `deal_status`).
- No compile-time query type-safety — relies on tests and discipline.

**Mitigations**
- Centralize tenant scoping and parameter binding in repository helpers.
- Keep enums defined once in the DB and mirrored in `ER.md`; treat enum changes as
  migrations + a contract update.
