<template>
  <div class="s3-migration-view">
    <div class="header">
      <h1>Migración de Imágenes S3 → Cloudflare</h1>
      <p class="subtitle">Fase 2: Listar y migrar imágenes de S3 a Cloudflare Images</p>
    </div>

    <!-- Store Selection -->
    <div class="store-selection card">
      <div class="card-header">
        <h2>Seleccionar Tienda</h2>
      </div>
      <div class="card-body">
        <div class="input-group">
          <label for="storeId">ID de la Tienda:</label>
          <input
            id="storeId"
            v-model.number="selectedStoreId"
            type="number"
            placeholder="Ej: 265"
            @keyup.enter="loadImages"
          />

          <div class="checkbox-group">
            <input
              id="productsOnly"
              v-model="productsOnly"
              type="checkbox"
              @change="loadImages"
            />
            <label for="productsOnly">Solo imágenes de productos</label>
          </div>

          <button
            class="btn btn-primary"
            :disabled="!selectedStoreId || loading"
            @click="loadImages"
          >
            <span v-if="loading">
              <i class="pi pi-spin pi-spinner"></i> Cargando...
            </span>
            <span v-else>
              <i class="pi pi-search"></i> Buscar Imágenes
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="error-message card">
      <i class="pi pi-exclamation-triangle"></i>
      <span>{{ error }}</span>
    </div>

    <!-- Stats -->
    <div v-if="stats" class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon total">
          <i class="pi pi-images"></i>
        </div>
        <div class="stat-content">
          <div class="stat-label">Total Activas</div>
          <div class="stat-value">{{ stats.total_active }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon migrated">
          <i class="pi pi-check-circle"></i>
        </div>
        <div class="stat-content">
          <div class="stat-label">Migradas</div>
          <div class="stat-value">{{ stats.total_migrated }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon pending">
          <i class="pi pi-clock"></i>
        </div>
        <div class="stat-content">
          <div class="stat-label">Pendientes</div>
          <div class="stat-value">{{ stats.total_pending }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon progress">
          <i class="pi pi-chart-line"></i>
        </div>
        <div class="stat-content">
          <div class="stat-label">Progreso</div>
          <div class="stat-value">{{ stats.migration_progress }}%</div>
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: stats.migration_progress + '%' }"
            ></div>
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon products">
          <i class="pi pi-shopping-bag"></i>
        </div>
        <div class="stat-content">
          <div class="stat-label">De Productos</div>
          <div class="stat-value">{{ stats.product_images }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon others">
          <i class="pi pi-image"></i>
        </div>
        <div class="stat-content">
          <div class="stat-label">Otras</div>
          <div class="stat-value">{{ stats.other_images }}</div>
        </div>
      </div>
    </div>

    <!-- Store Info -->
    <div v-if="store" class="store-info card">
      <h3>
        <i class="pi pi-building"></i>
        {{ store.name }}
      </h3>
      <div class="store-meta">
        <span class="badge" :class="store.is_blocked ? 'badge-danger' : 'badge-success'">
          {{ store.is_blocked ? 'Bloqueada' : 'Activa' }}
        </span>
        <span class="store-id">ID: {{ store.id }}</span>
      </div>
    </div>

    <!-- Images Table -->
    <div v-if="images.length > 0" class="images-table card">
      <div class="card-header">
        <h2>
          Imágenes S3 Pendientes de Migración
          <span class="count-badge">{{ pagination.total }}</span>
        </h2>
      </div>

      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Preview</th>
              <th>ID</th>
              <th>Tipo</th>
              <th>SKU(s)</th>
              <th>Título</th>
              <th>Formato</th>
              <th>Fecha Subida</th>
              <th>URL S3</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="image in images" :key="image.id">
              <td>
                <div class="image-preview">
                  <img
                    :src="image.cdn_url"
                    :alt="image.title"
                    @error="handleImageError"
                  />
                </div>
              </td>
              <td>
                <code>{{ image.id }}</code>
              </td>
              <td>
                <span
                  v-if="image.is_product_image"
                  class="badge badge-product"
                  :title="`Usada por ${image.product_count} producto(s)`"
                >
                  <i class="pi pi-shopping-bag"></i> Producto
                </span>
                <span v-else class="badge badge-other">
                  <i class="pi pi-image"></i> Otra
                </span>
              </td>
              <td>
                <div v-if="image.product_skus" class="product-skus">
                  {{ image.product_skus }}
                </div>
                <span v-else class="text-muted">-</span>
              </td>
              <td>{{ image.title || 'Sin título' }}</td>
              <td>
                <span class="format-badge">{{ image.extension.toUpperCase() }}</span>
              </td>
              <td>
                <small>{{ formatDate(image.uploaded_at) }}</small>
              </td>
              <td>
                <a
                  :href="image.cdn_url"
                  target="_blank"
                  class="link-btn"
                  title="Ver en CloudFront"
                >
                  <i class="pi pi-external-link"></i> Ver
                </a>
              </td>
              <td>
                <button
                  class="btn btn-sm btn-success"
                  disabled
                  title="Próximamente: Migrar a Cloudflare"
                >
                  <i class="pi pi-upload"></i> Migrar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.total_pages > 1" class="pagination">
        <button
          class="btn btn-sm"
          :disabled="pagination.page === 1"
          @click="changePage(pagination.page - 1)"
        >
          <i class="pi pi-chevron-left"></i> Anterior
        </button>

        <span class="page-info">
          Página {{ pagination.page }} de {{ pagination.total_pages }}
          ({{ pagination.total }} imágenes)
        </span>

        <button
          class="btn btn-sm"
          :disabled="pagination.page === pagination.total_pages"
          @click="changePage(pagination.page + 1)"
        >
          Siguiente <i class="pi pi-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading && selectedStoreId" class="empty-state card">
      <i class="pi pi-check-circle"></i>
      <h3>¡Todo listo!</h3>
      <p>No hay imágenes pendientes de migración para esta tienda.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'

interface S3Image {
  id: number
  store_id: number
  store_name: string
  name: string
  extension: string
  title: string
  uploaded_at: string
  status: number
  s3_url: string
  cdn_url: string
  cloudflare_id: string | null
  is_migrated: boolean
  is_product_image: boolean
  product_count: number
  product_skus: string | null
}

interface Store {
  id: number
  name: string
  is_blocked: boolean
}

interface Stats {
  total_active: number
  total_migrated: number
  total_pending: number
  migration_progress: number
  product_images: number
  other_images: number
}

interface Pagination {
  total: number
  page: number
  per_page: number
  total_pages: number
}

const toast = useToast()

const selectedStoreId = ref<number | null>(null)
const productsOnly = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)

const store = ref<Store | null>(null)
const images = ref<S3Image[]>([])
const stats = ref<Stats | null>(null)
const pagination = ref<Pagination>({
  total: 0,
  page: 1,
  per_page: 50,
  total_pages: 0
})

const loadImages = async () => {
  if (!selectedStoreId.value) {
    error.value = 'Por favor ingresa un ID de tienda válido'
    return
  }

  loading.value = true
  error.value = null

  try {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('No hay token de autenticación. Por favor inicia sesión.')
    }

    const productsOnlyParam = productsOnly.value ? '&products_only=1' : ''
    const response = await fetch(
      `https://api2.mitienda.pe/api/v1/superadmin/s3-images?store_id=${selectedStoreId.value}&page=${pagination.value.page}&per_page=${pagination.value.per_page}${productsOnlyParam}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.messages?.error || 'Error al cargar imágenes')
    }

    const data = await response.json()

    store.value = data.data.store
    images.value = data.data.images
    stats.value = data.data.stats
    pagination.value = data.data.pagination

    if (images.value.length === 0) {
      toast.add({
        severity: 'success',
        summary: '¡Excelente!',
        detail: 'No hay imágenes pendientes de migración',
        life: 3000
      })
    } else {
      toast.add({
        severity: 'info',
        summary: 'Imágenes cargadas',
        detail: `Se encontraron ${pagination.value.total} imágenes pendientes`,
        life: 3000
      })
    }
  } catch (err: any) {
    error.value = err.message
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.message,
      life: 5000
    })
  } finally {
    loading.value = false
  }
}

const changePage = (page: number) => {
  pagination.value.page = page
  loadImages()
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo disponible%3C/text%3E%3C/svg%3E'
}
</script>

<style scoped>
.s3-migration-view {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  margin-bottom: 2rem;
}

.header h1 {
  font-size: 2rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
}

.subtitle {
  color: #6c757d;
  margin: 0;
}

.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
}

.card-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.card-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.count-badge {
  background: #007bff;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
}

.card-body {
  padding: 1.5rem;
}

.input-group {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.input-group label {
  font-weight: 500;
  color: #495057;
  white-space: nowrap;
}

.input-group input[type="number"] {
  flex: 0 0 200px;
  padding: 0.5rem 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
}

.input-group input[type="number"]:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

.btn-success {
  background: #28a745;
  color: white;
}

.error-message {
  padding: 1rem 1.5rem;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.stat-icon.total {
  background: #e3f2fd;
  color: #1976d2;
}

.stat-icon.migrated {
  background: #e8f5e9;
  color: #388e3c;
}

.stat-icon.pending {
  background: #fff3e0;
  color: #f57c00;
}

.stat-icon.progress {
  background: #f3e5f5;
  color: #7b1fa2;
}

.stat-icon.products {
  background: #e1f5fe;
  color: #0277bd;
}

.stat-icon.others {
  background: #fce4ec;
  color: #c2185b;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 600;
  color: #2c3e50;
}

.progress-bar {
  height: 6px;
  background: #e9ecef;
  border-radius: 3px;
  margin-top: 0.5rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #7b1fa2 0%, #9c27b0 100%);
  transition: width 0.3s ease;
}

.store-info {
  padding: 1rem 1.5rem;
}

.store-info h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.store-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge-success {
  background: #d4edda;
  color: #155724;
}

.badge-danger {
  background: #f8d7da;
  color: #721c24;
}

.store-id {
  color: #6c757d;
  font-size: 0.875rem;
}

.table-responsive {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #f8f9fa;
}

th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: #495057;
  font-size: 0.875rem;
  border-bottom: 2px solid #dee2e6;
}

td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #dee2e6;
}

.image-preview {
  width: 60px;
  height: 60px;
  overflow: hidden;
  border-radius: 4px;
  background: #f8f9fa;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

code {
  background: #f8f9fa;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.875rem;
  color: #e83e8c;
}

.format-badge {
  background: #e9ecef;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #495057;
}

.link-btn {
  color: #007bff;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
}

.link-btn:hover {
  text-decoration: underline;
}

.pagination {
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #e9ecef;
}

.page-info {
  color: #6c757d;
  font-size: 0.875rem;
}

.empty-state {
  padding: 3rem;
  text-align: center;
  color: #6c757d;
}

.empty-state i {
  font-size: 4rem;
  color: #28a745;
  margin-bottom: 1rem;
}

.empty-state h3 {
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  margin: 0;
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.checkbox-group input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.checkbox-group label {
  cursor: pointer;
  margin: 0;
}

.badge-product {
  background: #e1f5fe;
  color: #0277bd;
  border: 1px solid #b3e5fc;
}

.badge-other {
  background: #fce4ec;
  color: #c2185b;
  border: 1px solid #f8bbd0;
}

.product-skus {
  font-size: 0.875rem;
  color: #495057;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.text-muted {
  color: #6c757d;
}
</style>
