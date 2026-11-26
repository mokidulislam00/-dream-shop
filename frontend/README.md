# Dream Shop – Frontend

React + TypeScript + Vite + Tailwind CSS storefront and admin panel for the
Dream Shop backend.

## Requirements

- Node.js 18.18 or newer

## Run locally

```bash
cd frontend
cp .env.example .env     # Windows CMD: copy .env.example .env
npm install
npm run dev              # http://localhost:5173
```

Start the backend too (`npm run dev` inside `backend`). In the backend `.env`,
`FRONTEND_URL` must include `http://localhost:5173`, otherwise the backend
rejects requests with 403 (CSRF origin check).

In development the browser talks to `/api` on the Vite server, which proxies
to `VITE_DEV_PROXY_TARGET` (default `http://localhost:5000`).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run typecheck` | TypeScript check only |
| `npm run build` | Typecheck + production build into `dist/` |
| `npm run preview` | Serve the production build locally |

## Deploy to Vercel (free)

1. Push the repo to GitHub (the project lives in the `frontend` folder).
2. Vercel → Add New Project → import the repo.
3. **Root Directory:** `frontend`. Framework preset: Vite.
4. Environment variable: `VITE_API_URL` = `/api`
5. Deploy.
6. Copy the production URL (for example `https://dream-shop.vercel.app`) and set
   it as `FRONTEND_URL` in the Render backend environment (no trailing slash,
   no path). Keep `http://localhost:5173` after a comma if you still develop locally.

`vercel.json` proxies `/api/*` to the Render backend, so the login cookie is
first-party and works in Safari and other strict browsers. It also rewrites
all other paths to `index.html` for client-side routing.

## Structure

```
src/
  components/{ui,common,layout}   Reusable UI
  constants/                      Status labels, order transitions
  contexts/AuthContext.tsx        Session restoration and auth actions
  layouts/                        Public and admin layouts
  lib/                            Query client and query keys
  pages/                          Page components (public, auth, customer, admin)
  routes/                         Router and route guards
  services/                       One typed module per backend resource
  styles/index.css                Design tokens
  types/                          Models and API response types
  utils/                          Formatting, errors, class names
```

## Conventions

- All HTTP goes through `src/services/api.ts` (cookies, CSRF header, errors).
- Server state lives in TanStack Query; never filter or sort on the client when
  the API supports it.
- Prices are shown in BDT (৳). Only Cash on Delivery is offered at checkout.
