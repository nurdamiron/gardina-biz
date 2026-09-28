# Demo salon «Айшторы» for promo videos

Local stand only, never production.

1. DB: `docker run -d --name gardina-demo-db -e POSTGRES_USER=gardina -e POSTGRES_PASSWORD=demo_local_only -p 5433:5432 postgres:16-alpine`,
   then schema: `init-database.js`, `001-catalog-system.js` (without its sample-fabric insert), SQL migrations 002-021, `run-saas-migration.js`.
2. Backend on :5055 with `DATABASE_*` pointing at :5433, `UPLOAD_DRIVER=local`, `UPLOAD_DIR=<tmp dir>`.
3. Frontend: `VITE_API_URL=http://localhost:5055/api npx vite --port 5174`.
4. Salon + team via API: `POST /api/auth/register-salon` (slug `aishtory`), then `POST /api/users/admin/create` per role.
5. `node seed-aishtory.mjs` fills clients, measurements, deals, payments, orders, installations.
6. `node capture.mjs <outDir> [owner manager designer]` logs in per role and saves 860x1864 phone screenshots.
   Copy them to `public/screens/aishtory/`, then render `promo-*` compositions.
