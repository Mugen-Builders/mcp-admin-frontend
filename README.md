# Cartesi MCP Admin Frontend

Admin web application for managing Cartesi MCP knowledge-base metadata: **resources**, **documentation routes**, **repositories**, **sources**, **tags**, and **admin users**, with **email OTP** sign-in against a backend Admin API.

Built with **React 19**, **TypeScript**, **Vite 6**, and **Tailwind CSS 4**.

---

## Table of contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Development](#development)
- [Production build](#production-build)
- [Docker](#docker)
- [Project structure](#project-structure)
- [API integration](#api-integration)
- [Security practices](#security-practices)
- [Troubleshooting](#troubleshooting)

---

## Features

- **OTP authentication** — Request and verify a one-time code; session stored in the browser.
- **Resources & doc routes** — CRUD, CSV uploads, and audit history per resource.
- **Repositories, sources, tags** — Manage catalog metadata used by the MCP surface.
- **Administration** — Invite/manage admin users (superuser flags, activation) when authorized.
- **Responsive layout** — Sidebar and bottom navigation for smaller viewports.

## Prerequisites

| Requirement   | Notes                                                                                           |
| ------------- | ----------------------------------------------------------------------------------------------- |
| **Node.js**   | **22.x** recommended (matches the Docker builder image). 20+ may work but is not guaranteed.    |
| **npm**       | Comes with Node; this repo uses `package-lock.json` — prefer `npm ci` in CI and clean installs. |
| **Admin API** | A running backend exposing the documented REST routes under `/api/v1/...`.                      |

---

## Getting started

1. **Clone the repository** and enter this directory.

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment**

   Copy the example file and adjust the API URL (no trailing slash):

   ```bash
   cp .env.example .env.local
   ```

   See [Configuration](#configuration) for all variables.

4. **Start the dev server**

   ```bash
   npm run dev
   ```

   The app listens on **port 3000** and binds to **all interfaces** (`0.0.0.0`), which is convenient for containers and LAN testing.

5. **Open the app** at `http://localhost:3000` (or your host’s IP on the same port).

---

## Configuration

### Local development (Vite)

| Variable                  | Required    | Description                                                                                                                               |
| ------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_ADMIN_API_BASE_URL` | Recommended | Base URL of the Admin API, e.g. `http://localhost:8000`. No trailing slash. If omitted, the client falls back to `http://localhost:8000`. |

Vite only exposes variables prefixed with `VITE_` to the client. Use `.env`, `.env.local`, or mode-specific files (`.env.development`, etc.). Secrets that must not ship to the browser do **not** belong in `VITE_*` variables.

**Optional (template / tooling):** `GEMINI_API_KEY` may appear in `vite.config.ts` from an earlier scaffold. The current application code does not call Gemini; you can ignore it unless you add features that need it.

### Docker / production runtime

These are **not** read by Vite at build time for the nginx image; they configure the generated `config.js`:

| Variable             | Description                                                                                                                                                                                                                                  |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ADMIN_API_BASE_URL` | Written into `window.__APP_CONFIG__` at container start. Use your public API origin, or an empty value if the UI should use **same-origin** paths (e.g. when nginx proxies `/api/` and the browser should call `/api/...` on the same host). |

The entrypoint runs `envsubst` on `env.template.js` → `/usr/share/nginx/html/config.js`. Coordinate this with your orchestration (for example compose `admin-web.env` as noted in `.env.example`).

---

## Development

### Scripts

| Command           | Purpose                                                               |
| ----------------- | --------------------------------------------------------------------- |
| `npm run dev`     | Vite dev server (port **3000**, host `0.0.0.0`).                      |
| `npm run build`   | Production build to `dist/`.                                          |
| `npm run preview` | Serve the production build locally for smoke tests.                   |
| `npm run clean`   | Remove `dist/`.                                                       |
| `npm run lint`    | Typecheck with `tsc --noEmit` (no separate ESLint step in this repo). |

### Path aliases

`tsconfig.json` maps `@/*` to the repository root. Prefer consistent imports with the existing codebase style.

### Hot module replacement (HMR)

If `DISABLE_HMR=true`, Vite disables HMR (useful in some hosted editor environments to avoid reload flicker). Omit it for normal local development.

### Git and secrets

- **Never commit** `.env`, `.env.local`, or any file containing API keys or tokens. The repo ignores `.env*` except `.env.example` (see `.gitignore`).
- Commit **lockfile** changes together with `package.json` updates.

### Code quality practices

- Run **`npm run lint`** before opening a PR.
- Keep API types and client helpers in `src/lib/` aligned with the backend contract.
- Prefer small, focused components under `src/components/` and shared UI under `src/components/shared/`.
- Match existing patterns for error handling (`ApiError`, user-facing messages via existing toast/state flows).

---

## Production build

```bash
npm run build
```

Output is written to **`dist/`**. The built `index.html` references `/config.js`; for static hosting without Docker, ensure `public/config.js` (or a generated equivalent) is served so `window.__APP_CONFIG__` exists before the app bundle runs.

---

## Docker

The **multi-stage** `Dockerfile`:

1. **Builder** — `npm ci`, `npm run build`.
2. **Runtime** — `nginx:1.27-alpine` serves `dist/`, uses `nginx.conf`, and runs `docker-entrypoint.sh` to render `config.js` from `env.template.js`.

**Notable behavior in `nginx.conf`:**

- **`/api/`** is proxied to `http://admin-api:8000` — service name must match your compose network.
- **`client_max_body_size 20m`** — supports CSV uploads from the UI.

Build and run (example — adjust tags and env):

```bash
docker build -t cartesi-mcp-admin-web .
docker run --rm -p 8080:80 \
  -e ADMIN_API_BASE_URL= \
  cartesi-mcp-admin-web
```

Setting `ADMIN_API_BASE_URL` empty (as above) encourages same-origin `/api/...` requests through nginx; set an explicit URL if the API is on another host and not proxied.

---

## Project structure

```text
.
├── public/
│   └── config.js              # Dev fallback; production copy generated in container
├── src/
│   ├── components/            # Screens and layout
│   ├── lib/
│   │   ├── api.ts             # HTTP client + Admin API wrappers
│   │   ├── auth.ts            # Session persistence (localStorage)
│   │   ├── types.ts           # Shared TypeScript types
│   │   └── utils.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── env.template.js            # Template for runtime `window.__APP_CONFIG__`
├── docker-entrypoint.sh
├── nginx.conf
├── vite.config.ts
├── tsconfig.json
└── .env.example
```

---

## API integration

- Base URL resolution order: **`window.__APP_CONFIG__.ADMIN_API_BASE_URL`** → **`import.meta.env.VITE_ADMIN_API_BASE_URL`** → default `http://localhost:8000`.
- Trailing slashes on the base URL are stripped before requests.
- Authenticated calls send **`Authorization: Bearer <token>`** from the stored session after OTP verification.

When the backend or routes change, update **`src/lib/api.ts`** and **`src/lib/types.ts`** together to avoid drift.

---

## Security practices

- **HTTPS** in production for both the admin UI and the API.
- **CORS** — Restrict admin API origins to known front-end hosts; avoid `*` in production.
- **Session storage** — Tokens live in **localStorage** under a fixed key (`cartesi-admin-web-session`). Treat XSS as a critical risk; follow React’s safe patterns and sanitize any future rich content.
- **OTP and admin actions** — Rely on server-side authorization; the UI only reflects what the API allows.
- **Uploads** — Validate file types and sizes on the server; the UI enforces UX limits but is not authoritative.

---

## Troubleshooting

| Symptom                                          | Things to check                                                                                                                              |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Network / CORS errors** in the browser console | API URL in `.env.local`, API CORS config, and whether you need same-origin proxying (Docker nginx) instead of a cross-origin URL.            |
| **401 / 403 on API calls**                       | OTP flow completed, token present, clock skew, API user permissions.                                                                         |
| **Blank config / wrong API in Docker**           | `ADMIN_API_BASE_URL` passed into the container; entrypoint logs; confirm `/config.js` is loaded before the module bundle (see `index.html`). |
| **Type errors after dependency updates**         | `npm run lint`, align `@types/*` with React/TypeScript versions.                                                                             |
| **Large upload failures**                        | nginx `client_max_body_size` and API body limits.                                                                                            |

---

## Contributing

1. Branch from the main integration branch used by your team.
2. Keep changes scoped and consistent with existing UI and naming.
3. Run **`npm run lint`** and manually exercise login, list views, and any flows you touch.
4. Document new environment variables in **`.env.example`** and in this README when behavior is user-visible.

For broader Cartesi MCP context (repositories, docs, tutorials), see the Cartesi developer resources and your deployment’s Admin API documentation.
