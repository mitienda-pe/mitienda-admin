# Auditoría de seguridad — Backoffice `mitienda-backoffice-Vue3`

**Fecha:** 2026-06-11
**Alcance:** Panel administrativo Vue 3 / PrimeVue (SPA estática, deploy Cloudflare Pages). Fase 3 del plan de auditoría plataforma (después del backend — Fase 1 — y el storefront — Fase 2, ambas cerradas).
**Modo:** recon read-only. Remediación se planifica hallazgo por hallazgo con confirmación previa.

## Resumen ejecutivo

El backoffice ya tiene una base defensiva razonable: **CSP + HSTS + X-Frame-Options DENY + frame-ancestors 'none'** en `public/_headers` (Cloudflare Pages), logout que limpia todas las llaves, validación de expiración de token, sanitización con DOMPurify en todos los `v-html`, y los valores reales de prod vienen de **GitHub repo variables** (no del `.env.production` versionado). Sourcemaps off por defecto de Vite.

Lo que queda abierto se concentra en **dos ejes**: (1) los tokens de sesión viven en `localStorage`, legibles por cualquier XSS y por todo script same-origin (Tawk, GTM, OneSignal, Cloudflare Stream) — y la CSP todavía permite `'unsafe-inline'` en `script-src`, que es justo el vector que explotaría ese riesgo; (2) **7 vulnerabilidades en dependencias de producción** (1 crítica, 2 high), incluyendo DOMPurify —el linchpin de todo el saneamiento XSS— y axios.

| Área | Estado |
|------|--------|
| Security headers / CSP | HSTS + XFO DENY + frame-ancestors none ✓; **`'unsafe-inline'` en script-src** ✗ |
| Tokens de sesión | `localStorage` (access + refresh + impersonation_context) — expuesto a XSS / scripts 3rd-party |
| Route guards | `requiresAuth` fail-closed ✓; `requiresSuperAdmin` deriva de localStorage tamperable (depende de enforcement backend) |
| `v-html` / DOMPurify | Todos saneados ✓; 4 sitios con config default permisiva (defense-in-depth) |
| Secretos / env | Valores prod en GitHub vars ✓; `.env.production` versionado solo con IDs públicos (INFO) |
| Sourcemaps | Off por defecto de Vite ✓ |
| Dependencias | **7 vulns prod: 1 critical (jspdf), 2 high (axios, lodash-es), dompurify moderate** |

---

## Hallazgos por severidad

### HIGH

#### H1 — Tokens de sesión en `localStorage` (access + refresh + impersonation_context)
**Archivos:** `src/stores/auth.store.ts:39,41,133`, `src/api/axios.ts:16,128-129`, `src/stores/admin.store.ts:100,103`

`access_token`, `refresh_token`, `user`, `selected_store`, `superadmin_info` e `impersonation_context` se guardan en `localStorage`. Cualquier XSS (o cualquier script de tercero same-origin) puede leerlos. El más grave es el **`refresh_token`**: si se filtra, permite mintear access tokens indefinidamente. El `impersonation_context.original_token` (token de superadmin) tiene el mismo problema.

**Riesgo agravado por H3 (CSP `'unsafe-inline'`) y por los scripts 3rd-party same-origin** (Tawk.to, GTM, OneSignal, Cloudflare Stream) — todos corren en el mismo origen y pueden leer `localStorage`.

**Severidad:** ALTA (un token de merchant/superadmin robado da acceso al panel completo + impersonation). Mayor impacto que el equivalente del storefront (que era un buyer).

**Opciones (decisión arquitectónica — no implementar sin acuerdo):**
- **A — Cookie httpOnly.** Como en storefront 2B, pero **más complejo aquí**: el backoffice es SPA estática en Cloudflare Pages, sin proxy server-side donde pegar la cookie. Requeriría que el backend setee la cookie httpOnly directo en login/refresh (y CORS con `credentials`), o introducir una capa server (CF Pages Functions / Worker) que haga de proxy como hace el Nitro del storefront.
- **B — Quedarse en localStorage pero blindar XSS al 100%:** quitar `'unsafe-inline'` de la CSP (H3), bump de DOMPurify (H4), endurecer configs de sanitización (M4), y considerar sacar/aislar los scripts 3rd-party.

#### H2 — Dependencias de producción con vulnerabilidades
`npm audit --omit=dev` → **7 vulnerabilidades (1 critical, 2 high, 3 moderate, 1 low)**. 6 de 7 con fix **no-breaking** (`npm audit fix`):

| Severidad | Paquete | Rango vulnerable | Fix | Nota |
|-----------|---------|------------------|-----|------|
| CRITICAL | `jspdf` | <=4.2.0 | `npm audit fix` | usado en `useOrderDownloads.ts` (descarga de pedidos) |
| HIGH | `axios` | 1.0.0–1.15.2 | `npm audit fix` | cliente HTTP de TODA la app |
| HIGH | `lodash-es` | <=4.17.23 | `npm audit fix` | code-injection `_.template` + prototype pollution |
| MODERATE | **`dompurify`** | <=3.3.3 | `npm audit fix` | **linchpin del saneamiento de TODOS los v-html** — prioridad pese a "moderate" |
| MODERATE | `follow-redirects` | <=1.15.11 | `npm audit fix` | transitivo |
| MODERATE | `postcss` | <8.5.10 | `npm audit fix` | build-time mayormente |
| LOW | `quill` | =2.0.3 | `npm audit fix --force` (→2.0.2) | ver M3 |

**Acción recomendada:** `npm audit fix` (no-breaking) cierra 6/7 de golpe; `quill` se evalúa aparte (M3). Bump de DOMPurify y axios es lo más urgente.

#### H3 — CSP permite `'unsafe-inline'` en `script-src`
**Archivo:** `public/_headers:7`

La CSP es fuerte en casi todo (HSTS, `frame-ancestors 'none'`, `default-src 'self'`), pero `script-src` incluye `'unsafe-inline'`. Eso reabre el vector de inline-script XSS — exactamente lo que robaría los tokens de H1. Es el complemento necesario de la opción B de H1.

**Severidad:** ALTA en combinación con H1. **Gotcha:** Vite puede emitir algún script/JSON inline; quitar `'unsafe-inline'` requiere migrar a nonce/hash y probar el bundle con `pnpm preview` antes de desplegar.

---

### MEDIUM

#### M1 — Sentry sin scrubbing (`beforeSend`)
**Archivo:** `src/main.ts:29-38,47-59`

`Sentry.init` no define `beforeSend` ni `sendDefaultPii:false` explícito. El `errorHandler` hace `Sentry.captureException(err, { extra: { info } })` sin sanitizar. Si un error arrastra contexto sensible (header `Authorization`, body de request, datos de usuario), se manda a Sentry sin filtrar.

**Remediación:** agregar `beforeSend` que strippee headers `authorization`/cookies y campos token-like; `sendDefaultPii:false` explícito.

#### M2 — `requiresSuperAdmin` deriva de `localStorage` tamperable
**Archivos:** `src/router/index.ts:1055,1078`, `auth.store.ts:22` (`isSuperAdmin` ← `superadmin_info`)

El guard `requiresSuperAdmin` se evalúa con `authStore.isSuperAdmin`, que sale de `superadmin_info.is_superadmin` en `localStorage`. Un merchant puede editar esa llave en DevTools y **renderizar el shell de `/admin/*`**. Esto es cosmético **solo si** el backend valida rol en TODOS los endpoints `/superadmin/*` (la fuente de verdad). Cross-ref con **Fase 1.5** (se endureció `SuperAdminBillingController` con `_remap`+`requireSuperAdmin`; conviene confirmar cobertura en el resto de controladores superadmin).

**Severidad:** MEDIA (sin datos reales si el backend enforce; pero la elevación visual confunde y, si algún endpoint superadmin no valida, escala a crítico).

#### M3 — `quill` 2.0.3 — XSS vía HTML export
**Archivos:** `src/components/ui/QuillEditor.vue` + consumidores (ProductDescriptionEditor, PageContentEditor, MessagesView, LegalPageEditView)

Quill es el editor rich-text que alimenta descripciones/blog/páginas. CVE de XSS en la exportación HTML. **Mitigado** porque la salida pasa por DOMPurify antes de cualquier `v-html`. `npm audit fix --force` instala 2.0.2 (marcado breaking) — evaluar manualmente.

#### M4 — 4 sitios `v-html` con DOMPurify config default (permisiva)
**Archivos:** `views/products/ProductDetailView.vue:124`, `views/blog/BlogPostPreviewView.vue:52`, `views/pages/PagePreviewView.vue:69`, `composables/useHelpDocs.ts:52` (HelpDrawer)

Usan `DOMPurify.sanitize(html)` sin config → whitelist default (permite `<img>/<iframe>/<video>`). **No hay XSS directo** (DOMPurify quita `on*`/script/`javascript:`), pero por defense-in-depth conviene alinear con el patrón estricto de `utils/broadcast-markdown.ts` (whitelist acotada de tags). Los broadcasts (BroadcastBar/Modal) ya están bien.

---

### LOW / INFO

- **L1 — Sourcemaps:** Vite default `build.sourcemap=false`; `dist/` sin `.map`. OK. Recomendado: poner `build: { sourcemap: false }` explícito en `vite.config.ts` como candado.
- **L2 — `.env.production` versionado:** solo IDs públicos (Google OAuth client ID, FB app ID, OneSignal, WhatsApp app/config). Son públicos por diseño (van al bundle). Los valores reales de prod vienen de **GitHub repo variables** (`deploy.yml`), así que el archivo no filtra secretos. INFO — opcional sacarlo del repo para evitar confusión.
- **L3 — Scripts 3rd-party same-origin** (Tawk, GTM, OneSignal, Cloudflare Stream): riesgo supply-chain inherente; amplifican H1. Se mitiga con H1-A (httpOnly) o reduciendo/aislando los scripts.

---

## Plan de remediación

### Bloque mecánico — IMPLEMENTADO (2026-06-11)

1. **Dependencias (H2) — ✅ 6/7 cerradas.** Bump de directas en `package.json` (axios `^1.17.0`, dompurify `^3.4.9`, jspdf `^4.2.1`) + overrides de transitivas en `pnpm-workspace.yaml` (lodash-es `>=4.18.1`, follow-redirects `>=1.16.0`, postcss `>=8.5.10`). `pnpm audit --prod` → de 7 vulns (1 crit, 2 high, 3 mod) a **1 low**. Queda solo `quill` (sin versión parcheada real; su salida pasa por DOMPurify → **riesgo aceptado/mitigado**, M3).
2. **Sentry scrubbing (M1) — ✅.** `sendDefaultPii:false` + `beforeSend` que borra headers `Authorization`/`Cookie`/`X-CSRF-Token` y cookies del evento (`src/main.ts`).
3. **DOMPurify endurecido (M4) — ✅.** Saneamiento centralizado en `src/utils/sanitize.ts` con `FORBID_TAGS` (form/input/button/textarea/select/option/base/link/meta/object/embed) + `FORBID_ATTR` (formaction/action/ping). Consumidores (`useHelpDocs`, `BlogPostPreviewView`, `PagePreviewView`, ya `ProductDetailView`) repuntados al util. No restringe img/iframe/video/tablas/estilos para no romper contenido rico legítimo.
4. **Sourcemaps (L1) — ✅.** `build.sourcemap:false` explícito en `vite.config.ts`. `dist/assets/*.map` vacío.

> Build validado: `pnpm build` (vue-tsc + vite) verde tras todos los cambios.

### Coordinado / decisión (pendiente)
5. **H1 — token a httpOnly (opción A) vs blindaje XSS (opción B).** Requiere acuerdo: A toca backend + capa server en CF Pages; B = quitar `'unsafe-inline'` (H3) + sacar/aislar 3rd-party.
6. **H3 — CSP sin `'unsafe-inline'`** (nonce/hash; probar bundle Vite).
7. **M2 — confirmar enforcement backend** en todos los endpoints `/superadmin/*` (cierra el riesgo de elevación visual).
8. **M3 — quill** upgrade evaluado aparte (breaking).

## Verificación
- `npm audit --omit=dev` → 0 high/critical tras el fix.
- `curl -I https://admin.mitienda.pe/` → CSP sin `'unsafe-inline'` (cuando se cierre H3), HSTS, XFO DENY.
- `document.cookie` / `localStorage` sin token (cuando se cierre H1-A).
- `ls dist/assets/*.map` → vacío.
