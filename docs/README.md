# docs/

La documentación de arquitectura, design system, deployment, NetSuite inventory mapping y features del backoffice se migró al sitio interno del equipo:

**[docs.mitienda.host](https://docs.mitienda.host)** (repo: [`mitienda-docs-internal`](https://github.com/mitienda/mitienda-docs-internal))

Acceso protegido por Cloudflare Access — sólo cuentas `@mitienda.pe`.

## Dónde quedó cada cosa

| Antes (este folder) | Ahora |
| --- | --- |
| `docs/arquitectura/DESIGN_SYSTEM.md` | [/services/backoffice/design-system](https://docs.mitienda.host/services/backoffice/design-system) |
| `docs/arquitectura/GETTING_STARTED.md` | [/services/backoffice/getting-started](https://docs.mitienda.host/services/backoffice/getting-started) |
| `docs/arquitectura/DEPLOYMENT_GUIDE.md` | [/services/backoffice/deployment](https://docs.mitienda.host/services/backoffice/deployment) |
| `docs/arquitectura/PRD_BACKOFFICE_VUE3.md` | [/plans/prd-backoffice-vue3](https://docs.mitienda.host/plans/prd-backoffice-vue3) |
| `docs/cloudflare/*` | [/integrations/cloudflare/](https://docs.mitienda.host/integrations/cloudflare/) |
| `docs/features/SUPERADMIN_IMPLEMENTATION.md` | [/services/backoffice/superadmin](https://docs.mitienda.host/services/backoffice/superadmin) |
| `docs/features/PRODUCT_TAGS_README.md` | [/services/backoffice/product-tags](https://docs.mitienda.host/services/backoffice/product-tags) |
| `docs/features/QUEUE_MANAGEMENT_API.md` | [/api-reference/queue-management](https://docs.mitienda.host/api-reference/queue-management) |
| `docs/netsuite/NETSUITE_INVENTORY_MAPPING_*.md` | [/integrations/netsuite/inventory-mapping/](https://docs.mitienda.host/integrations/netsuite/inventory-mapping/) |
| `docs/netsuite/NETSUITE_INVENTORY_BACKEND_CHECKLIST.md` | [/runbooks/netsuite-inventory-checklist](https://docs.mitienda.host/runbooks/netsuite-inventory-checklist) |
| `docs/netsuite/NETSUITE_CREDENTIALS_MANAGEMENT.md` | [/integrations/netsuite/credentials](https://docs.mitienda.host/integrations/netsuite/credentials) |
| `docs/pendientes/ORDERS_PAGINATION_TODO.md` | [/plans/orders-pagination](https://docs.mitienda.host/plans/orders-pagination) |

## Para contribuir

1. Cloná `mitienda-docs-internal`.
2. Editá Markdown y abrí PR.
3. Push a `main` deploya automáticamente vía GitHub Actions a `docs.mitienda.host`.

Detalle del flujo en [Workflows / Git flow](https://docs.mitienda.host/workflows/git-flow).

## Recuperar contenido borrado

Todo lo que estuvo acá quedó en la historia de git. Ver con:

```bash
git log --diff-filter=D --name-only -- docs/
git show <commit-hash>:docs/<archivo>.md
```
