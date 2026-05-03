# Gardina — frontend (React + Vite)

CRM/PWA for curtain salons. API base URL must end with `/api` (see `.env.example`).

## Marketing landing

The public marketing site lives in **`public/`**:

- `landing.html` — main static page (also embedded in the SPA at `/` for guests via `src/screens/Landing.jsx`)
- `styles.css`, `images/`, favicons — same folder

Edit those files only here; Docker/nginx mount `gardina-frontend/public` for `gardina.kz`.

## Scripts

- `npm run dev` — Vite dev server
- `npm run build` — production build to `dist/`
