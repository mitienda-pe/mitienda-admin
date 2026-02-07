# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MiTienda Backoffice — a multitenant admin panel for MiTienda.pe e-commerce stores. Built with Vue 3 + TypeScript + Vite. The UI is in Spanish (es-PE locale).

## Commands

```bash
npm run dev          # Dev server on http://localhost:3001
npm run build        # Type-check (vue-tsc) + Vite production build
npm run lint         # ESLint with auto-fix
npm run format       # Prettier on src/
npm run test         # Vitest unit tests
npm run test:ui      # Vitest with browser UI
npm run test:coverage
```

## Architecture

### Data Flow

View (`views/`) → Store (`stores/`) → API (`api/`) → Backend REST API

- **API layer** (`src/api/`): Each domain has a `*.api.ts` file exporting an object with async methods. All use the configured Axios client from `api/axios.ts`.
- **Stores** (`src/stores/`): Pinia stores using Composition API (`defineStore` with `setup()` function). Each store calls its corresponding API module.
- **Views** (`src/views/`): Smart components that use stores, handle routing params, and orchestrate data fetching.
- **Components** (`src/components/`): Presentational/reusable components. Feature-grouped in subdirectories.
- **Layouts** (`src/layouts/`): `AuthLayout` for login pages, `DashboardLayout` for authenticated pages (sidebar + header).
- **Types** (`src/types/`): One `*.types.ts` file per domain.
- **Composables** (`src/composables/`): `useFormatters` (currency/date/number in es-PE), `useNetsuite`, `useOrderDownloads`.

### Axios Interceptors (api/axios.ts)

- Request: Injects Bearer token from localStorage; sets 5min timeout for FormData uploads.
- Response: **Normalizes API format** — backend sends `{ error: 0, data }`, interceptor converts to `{ success: true, data }`. Handles 401 with a token refresh queue to prevent race conditions.

### API Response Types

All API methods return `ApiResponse<T>` or `PaginatedResponse<T>` (defined in `types/api.types.ts`). Pagination uses `{ page, limit }` params and returns `meta` with `{ page, total, totalPages, hasMore }`.

### Routing

Routes defined in `src/router/index.ts`. All views are lazy-loaded. Route meta fields `requiresAuth` and `requiresStore` control guards. Two layouts: auth routes use `AuthLayout`, dashboard routes use `DashboardLayout`.

### Authentication (Multitenant, 2-Token Flow)

1. `POST /auth/login` → Token #1 (initial)
2. `GET /user/stores` → list of user's stores
3. `POST /user/store-select` → Token #2 (scoped to selected store) — **this token is required for all CRUD operations**
4. `store_id` is embedded in the JWT and injected server-side

## Code Conventions

### Component Style

All components use `<script setup lang="ts">`. Props typed with interfaces and `withDefaults()`. Emits typed with `defineEmits<>()`.

### Naming

- Stores: `use[Feature]Store` (e.g., `useProductsStore`)
- API files: `[feature].api.ts`
- Type files: `[feature].types.ts`
- Store files: `[feature].store.ts`

### Formatting (Prettier)

No semicolons, single quotes, 2-space indent, no trailing commas, 100 char width, no parens on single arrow params.

### Design System — Use App Components, Not Raw HTML

```vue
<!-- Use these instead of raw HTML elements -->
import { AppButton, AppInput, AppBadge, AppEmptyState, AppErrorState } from '@/components/ui'
```

- `AppButton` variants: `primary | secondary | danger | outlined | text`
- `AppBadge` variants: `success | warning | danger | info | neutral`
- Brand color is teal `#00b2a6`, use `text-primary` / `bg-primary` classes. **Do not use** `indigo-*` or `blue-*` for links/actions.
- PrimeVue for complex components (DataTable, Dialog, Calendar, etc.)
- TailwindCSS for layout and utilities

### View Pattern: Loading → Error → Empty → Content

```vue
<div v-if="loading">spinner</div>
<AppErrorState v-else-if="error" :message="error" @retry="fetch" />
<AppEmptyState v-else-if="!items.length" title="Sin datos" />
<div v-else><!-- content --></div>
```

## Environment

Dev proxy in `vite.config.ts` forwards `/api/v1` and `/auth` to `https://api2.mitienda.pe`. Path alias `@` → `./src`. TypeScript strict mode enabled.

## Deployment

Frontend deploys to Netlify automatically on `git push origin main`.
