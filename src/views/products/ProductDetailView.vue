<template>
  <div>
    <!-- Breadcrumb -->
    <div class="mb-4 flex items-center justify-between">
      <Button label="Volver a productos" icon="pi pi-arrow-left" text @click="router.push('/products')" />
      <div v-if="product" class="flex gap-2">
        <Button
          v-if="isDirty"
          label="Descartar"
          icon="pi pi-undo"
          severity="secondary"
          outlined
          @click="resetForm"
        />
        <Button
          label="Guardar Cambios"
          icon="pi pi-save"
          :loading="saving"
          :disabled="!isDirty"
          @click="handleSave"
        />
        <Button v-if="storeUrl && product.seo?.slug" label="Ver en tienda" icon="pi pi-external-link"
          severity="secondary" outlined @click="openProductInStore" />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="productsStore.isLoading" class="flex justify-center py-20">
      <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
    </div>

    <!-- Error -->
    <Message v-else-if="productsStore.error" severity="error">
      {{ productsStore.error }}
    </Message>

    <!-- Detalle del producto -->
    <div v-else-if="product" class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <!-- Columna Izquierda: 2/3 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Información del Producto (editable) -->
        <Card>
          <template #title>
            <span class="text-lg">Informacion del Producto</span>
          </template>
          <template #content>
            <div class="space-y-5">
              <!-- Nombre -->
              <div>
                <label for="edit-name" class="block text-sm font-medium text-secondary-700 mb-1">
                  Nombre <span class="text-red-500">*</span>
                </label>
                <InputText
                  id="edit-name"
                  v-model="form.name"
                  class="w-full"
                  :class="{ 'p-invalid': validationErrors.name }"
                />
                <small v-if="validationErrors.name" class="text-red-500">{{ validationErrors.name }}</small>
              </div>

              <!-- SKU + Barcode -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label for="edit-sku" class="block text-sm font-medium text-secondary-700 mb-1">SKU</label>
                  <InputText id="edit-sku" v-model="form.sku" class="w-full" />
                </div>
                <div>
                  <label for="edit-barcode" class="block text-sm font-medium text-secondary-700 mb-1">Codigo de barras</label>
                  <InputText id="edit-barcode" v-model="form.barcode" placeholder="Ej: 7501234567890" class="w-full" />
                </div>
              </div>

              <!-- Descripcion corta -->
              <div>
                <label for="edit-desc-short" class="block text-sm font-medium text-secondary-700 mb-1">
                  Descripcion corta
                </label>
                <Textarea
                  id="edit-desc-short"
                  v-model="form.description_short"
                  rows="3"
                  class="w-full"
                  placeholder="Resumen breve del producto..."
                />
              </div>

              <!-- MercadoLibre (read-only) -->
              <div v-if="product.external_categories?.mercadolibre" class="border-t border-gray-200 pt-4">
                <div class="flex items-start gap-2">
                  <i class="pi pi-shopping-cart text-yellow-500 mt-0.5"></i>
                  <span class="text-sm text-secondary-600">
                    <span class="font-semibold">MercadoLibre: </span>{{ product.external_categories.mercadolibre.name }}
                  </span>
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Descripcion -->
        <Card v-if="product.description_html || product.description">
          <template #title>
            <div class="flex items-center justify-between w-full">
              <span class="text-lg">Descripcion</span>
              <div class="flex gap-2">
                <Button label="Editar Texto" icon="pi pi-file-edit" size="small" severity="secondary" outlined
                  @click="openDescriptionEditor('wysiwyg')" />
                <Button label="Editar Codigo" icon="pi pi-code" size="small" severity="secondary" outlined
                  @click="openDescriptionEditor('code')" />
              </div>
            </div>
          </template>
          <template #content>
            <div v-if="product.description_html" class="text-secondary-600 prose prose-sm max-w-none"
              v-html="product.description_html"></div>
            <p v-else class="text-secondary-600">{{ product.description }}</p>
          </template>
        </Card>

        <!-- Galeria de imagenes -->
        <ProductImageGallery
          v-if="product"
          :images="product.images"
          :product-id="product.id"
          :product-name="product.name"
          @add-image="showImageUploader = true"
          @delete-image="handleImageDelete"
        />

        <!-- Video del producto -->
        <Card>
          <template #title>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <i class="pi pi-video"></i>
                Video
              </div>
              <Button v-if="!hasVideo" label="Anadir Video" icon="pi pi-plus" size="small"
                @click="showVideoUploader = true" />
            </div>
          </template>
          <template #content>
            <ProductVideoPlayer v-if="hasVideo" :video="product.video || null" :product-id="product.id"
              @delete="handleVideoDelete" @refresh="handleVideoRefresh" />
            <div v-else class="text-center py-8 text-gray-500">
              <i class="pi pi-video text-4xl mb-3 block"></i>
              <p>No hay video disponible</p>
            </div>
          </template>
        </Card>

        <!-- Documentos del producto -->
        <Card>
          <template #title>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <i class="pi pi-file-pdf"></i>
                Documentos
                <span class="text-sm text-gray-600 font-normal">
                  ({{ product.documents?.length || 0 }}/3)
                </span>
              </div>
              <Button v-if="(product.documents?.length || 0) < 3" label="Agregar Documento" icon="pi pi-plus"
                size="small" @click="showDocumentUploader = true" />
            </div>
          </template>
          <template #content>
            <ProductDocumentList :product-id="product.id" :documents="product.documents || []"
              @delete-success="handleDocumentDelete" @delete-error="handleDocumentError" />
          </template>
        </Card>

        <!-- SEO -->
        <Card>
          <template #title>
            <span class="text-lg">SEO</span>
          </template>
          <template #content>
            <div class="space-y-4">
              <!-- Meta Title -->
              <div>
                <label for="edit-meta-title" class="block text-sm font-medium text-secondary-700 mb-1">
                  Meta Title
                </label>
                <InputText
                  id="edit-meta-title"
                  v-model="form.meta_title"
                  class="w-full"
                  :placeholder="form.name || 'Titulo para buscadores'"
                  maxlength="150"
                />
                <small class="text-gray-400">
                  {{ (form.meta_title || '').length }}/150 caracteres
                  <span v-if="!form.meta_title" class="text-secondary-400"> — se usara el nombre del producto</span>
                </small>
              </div>

              <!-- Meta Description -->
              <div>
                <label for="edit-meta-desc" class="block text-sm font-medium text-secondary-700 mb-1">
                  Meta Description
                </label>
                <Textarea
                  id="edit-meta-desc"
                  v-model="form.meta_description"
                  rows="3"
                  class="w-full"
                  placeholder="Descripcion para buscadores (max 160 caracteres)"
                  maxlength="160"
                />
                <small class="text-gray-400">
                  {{ (form.meta_description || '').length }}/160 caracteres
                  <span v-if="!form.meta_description && form.description_short" class="text-secondary-400"> — se usara la descripcion corta</span>
                </small>
              </div>

              <!-- Slug (URL) -->
              <div>
                <label for="edit-slug" class="block text-sm font-medium text-secondary-700 mb-1">
                  Slug (URL)
                </label>
                <InputText
                  id="edit-slug"
                  v-model="form.slug"
                  class="w-full font-mono text-sm"
                  placeholder="mi-producto-ejemplo"
                />
                <small class="text-yellow-600">
                  <i class="pi pi-exclamation-triangle mr-1"></i>
                  Cambiar el slug puede romper enlaces existentes
                </small>
              </div>

              <!-- OpenGraph Image -->
              <div>
                <label class="block text-sm font-medium text-secondary-700 mb-1">
                  OpenGraph Image
                </label>
                <div v-if="form.meta_image" class="relative">
                  <img
                    :src="form.meta_image"
                    alt="OpenGraph Image"
                    class="w-full rounded border aspect-[1200/630] object-cover"
                  />
                  <div class="flex gap-2 mt-2">
                    <Button
                      label="Reemplazar"
                      icon="pi pi-refresh"
                      size="small"
                      outlined
                      @click="ogImageInput?.click()"
                    />
                    <Button
                      label="Eliminar"
                      icon="pi pi-trash"
                      size="small"
                      severity="danger"
                      outlined
                      @click="handleDeleteOgImage"
                    />
                  </div>
                </div>
                <div
                  v-else
                  class="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary hover:bg-gray-50 aspect-[1200/630]"
                  @click="ogImageInput?.click()"
                >
                  <i class="pi pi-image text-3xl text-gray-400"></i>
                  <span class="text-sm text-gray-500 mt-2">Subir imagen</span>
                  <span class="text-xs text-gray-400">1200x630 px recomendado</span>
                </div>
                <input
                  :ref="(el: any) => { ogImageInput = el }"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  class="hidden"
                  @change="handleOgImageSelect"
                />
              </div>

              <!-- Vista previa en buscadores -->
              <div class="border-t border-gray-200 pt-4">
                <h4 class="text-xs font-semibold text-secondary-500 uppercase mb-2">Vista previa en buscadores</h4>
                <div class="bg-white border rounded-lg p-3">
                  <div class="text-blue-700 text-base font-medium truncate">
                    {{ form.meta_title || form.name || 'Sin titulo' }}
                  </div>
                  <div class="text-green-700 text-xs truncate">
                    {{ storeUrl || 'https://mitienda.pe' }}/producto/{{ form.slug || '...' }}
                  </div>
                  <div class="text-gray-600 text-sm mt-1 line-clamp-2">
                    {{ form.meta_description || (form.description_short || '').substring(0, 160) || 'Sin descripcion' }}
                  </div>
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Dimensiones y Peso -->
        <Card>
          <template #title>
            <span class="text-lg">Dimensiones y Peso</span>
          </template>
          <template #content>
            <div class="space-y-4">
              <!-- Dimensiones -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <h4 class="text-sm font-semibold text-secondary-700">Dimensiones</h4>
                  <Dropdown
                    id="edit-dim-unit"
                    v-model="form.dimensions_unit"
                    :options="dimensionUnitOptions"
                    optionLabel="label"
                    optionValue="value"
                    class="w-40"
                  />
                </div>
                <div class="grid grid-cols-3 gap-3">
                  <div>
                    <label for="edit-height" class="block text-xs font-medium text-secondary-600 mb-1">Altura</label>
                    <InputNumber
                      id="edit-height"
                      v-model="form.height"
                      :min="0"
                      :minFractionDigits="0"
                      :maxFractionDigits="2"
                      class="w-full"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label for="edit-width" class="block text-xs font-medium text-secondary-600 mb-1">Ancho</label>
                    <InputNumber
                      id="edit-width"
                      v-model="form.width"
                      :min="0"
                      :minFractionDigits="0"
                      :maxFractionDigits="2"
                      class="w-full"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label for="edit-length" class="block text-xs font-medium text-secondary-600 mb-1">Largo</label>
                    <InputNumber
                      id="edit-length"
                      v-model="form.length"
                      :min="0"
                      :minFractionDigits="0"
                      :maxFractionDigits="2"
                      class="w-full"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <Divider />

              <!-- Peso -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <h4 class="text-sm font-semibold text-secondary-700">Peso</h4>
                  <Dropdown
                    id="edit-weight-unit"
                    v-model="form.weight_unit"
                    :options="weightUnitOptions"
                    optionLabel="label"
                    optionValue="value"
                    class="w-40"
                  />
                </div>
                <InputNumber
                  id="edit-weight"
                  v-model="form.weight"
                  :min="0"
                  :minFractionDigits="0"
                  :maxFractionDigits="2"
                  class="w-full"
                  placeholder="0"
                />
              </div>

              <!-- Peso volumetrico (calculado) -->
              <div v-if="calculatedVolumetricWeight" class="bg-gray-50 rounded-lg p-3">
                <div class="flex justify-between items-center">
                  <span class="text-sm text-secondary-600">Peso volumetrico (calculado):</span>
                  <span class="font-medium">{{ calculatedVolumetricWeight.toFixed(2) }} kg</span>
                </div>
                <small class="text-gray-400">Alto x Ancho x Largo / 5000</small>
              </div>
            </div>
          </template>
        </Card>

        <!-- Opciones de Envio por Producto -->
        <Card v-if="showProductShipping">
          <template #title>
            <span class="text-lg">Opciones de Envío</span>
          </template>
          <template #content>
            <div class="space-y-4">
              <p class="text-sm text-gray-500">
                El costo de envío de este producto se calcula multiplicando el factor por la tarifa de envío del destino.
              </p>

              <!-- Factor de conversion -->
              <div>
                <label for="edit-shipping-factor" class="block text-sm font-medium text-secondary-700 mb-1">
                  Factor de conversión de envío
                </label>
                <InputNumber
                  id="edit-shipping-factor"
                  v-model="form.shipping_conversion_factor"
                  :min="0"
                  :minFractionDigits="2"
                  :maxFractionDigits="2"
                  :step="0.1"
                  class="w-full"
                  placeholder="1.00"
                />
                <small class="text-gray-400 mt-1 block">
                  Ej: 1.00 = tarifa normal, 1.50 = 50% más, 0.50 = mitad de la tarifa
                </small>
              </div>

              <!-- Envio por unidad -->
              <div class="flex items-center justify-between border-t border-gray-100 pt-4">
                <div>
                  <p class="text-sm font-medium text-secondary-700">Cobrar envío por unidad</p>
                  <p class="text-xs text-gray-500">
                    Si está activo, el costo de envío se multiplica por la cantidad del producto en el carrito
                  </p>
                </div>
                <InputSwitch v-model="form.shipping_per_unit" />
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Columna Derecha: Sidebar 1/3 -->
      <div class="space-y-6">
        <!-- Card Estado, Precios y Stock -->
        <Card>
          <template #title>
            <span class="text-lg">Estado, Precios y Stock</span>
          </template>
          <template #content>
            <div class="space-y-4">
              <!-- Publicado + Orden -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <InputSwitch
                    id="edit-published"
                    v-model="form.published"
                  />
                  <label for="edit-published" class="text-sm font-medium text-secondary-700 cursor-pointer">
                    Publicado
                  </label>
                </div>
                <div class="flex items-center gap-2">
                  <label for="edit-order" class="text-sm text-secondary-700">Orden:</label>
                  <InputNumber
                    id="edit-order"
                    v-model="form.order"
                    :min="0"
                    :useGrouping="false"
                    class="w-20"
                  />
                </div>
              </div>

              <!-- Precios -->
              <div class="border-t border-gray-200 pt-4">
                <h4 class="text-sm font-semibold text-secondary-700 mb-3">Precios e Impuestos</h4>

                <div class="mb-3">
                  <label for="edit-tax" class="block text-xs font-medium text-secondary-600 mb-1">
                    Afectacion IGV
                  </label>
                  <Dropdown
                    id="edit-tax"
                    v-model="form.tax_affectation"
                    :options="taxAffectationOptions"
                    optionLabel="label"
                    optionValue="value"
                    class="w-full"
                    @change="onTaxAffectationChange"
                  />
                </div>

                <div class="space-y-3">
                  <div>
                    <label for="edit-price" class="block text-xs font-medium text-secondary-600 mb-1">
                      Precio con IGV (S/)
                    </label>
                    <InputNumber
                      id="edit-price"
                      :modelValue="form.price"
                      @update:modelValue="onPriceChange"
                      mode="currency"
                      currency="PEN"
                      locale="es-PE"
                      :min="0"
                      :minFractionDigits="2"
                      :maxFractionDigits="2"
                      class="w-full"
                    />
                  </div>
                  <div>
                    <label for="edit-price-no-tax" class="block text-xs font-medium text-secondary-600 mb-1">
                      Precio sin IGV (S/)
                    </label>
                    <InputNumber
                      id="edit-price-no-tax"
                      :modelValue="form.price_without_tax"
                      @update:modelValue="onPriceWithoutTaxChange"
                      :min="0"
                      :minFractionDigits="2"
                      :maxFractionDigits="8"
                      class="w-full"
                    />
                    <small class="text-gray-400">Hasta 8 decimales</small>
                  </div>
                </div>

                <p v-if="product.price_range?.has_range" class="text-xs text-secondary-400 mt-2">
                  Variantes: S/ {{ product.price_range.min?.toFixed(2) }} - S/ {{ product.price_range.max?.toFixed(2) }}
                </p>
                <div class="flex gap-3 mt-2 text-xs text-secondary-500">
                  <span v-if="product.compare_price">
                    Comparacion: {{ formatCurrency(product.compare_price) }}
                  </span>
                  <span v-if="product.cost">
                    Costo: {{ formatCurrency(product.cost) }}
                  </span>
                </div>
              </div>

              <!-- Stock -->
              <div class="border-t border-gray-200 pt-4">
                <h4 class="text-sm font-semibold text-secondary-700 mb-3">Stock</h4>
                <div class="flex items-center gap-3">
                  <InputNumber
                    id="edit-stock"
                    v-model="form.stock"
                    :min="0"
                    :useGrouping="false"
                    :disabled="form.unlimited_stock"
                    class="w-24"
                  />
                  <div class="flex items-center gap-2">
                    <Checkbox
                      id="edit-unlimited"
                      v-model="form.unlimited_stock"
                      :binary="true"
                    />
                    <label for="edit-unlimited" class="text-sm text-secondary-700 cursor-pointer">
                      Ilimitado
                    </label>
                  </div>
                  <i
                    v-if="!form.unlimited_stock"
                    class="pi pi-circle-fill text-xs"
                    :class="{
                      'text-red-500': (form.stock ?? 0) === 0,
                      'text-yellow-500': (form.stock ?? 0) > 0 && (form.stock ?? 0) <= 5,
                      'text-green-500': (form.stock ?? 0) > 5,
                    }"
                  ></i>
                </div>

                <!-- NetSuite sync (solo si la tienda tiene ERP) -->
                <div v-if="hasErpIntegration" class="flex flex-wrap items-center gap-2 mt-3">
                  <Button
                    icon="pi pi-search"
                    label="Consultar"
                    size="small"
                    severity="info"
                    outlined
                    @click="queryNetsuiteStock"
                    :disabled="form.unlimited_stock"
                  />
                  <Button
                    icon="pi pi-sync"
                    label="Sincronizar"
                    size="small"
                    severity="success"
                    outlined
                    :loading="isSyncingStock"
                    @click="syncStockWithNetsuite"
                    :disabled="form.unlimited_stock"
                  />
                  <span v-if="netsuiteStock !== null" class="text-xs text-gray-500">
                    NetSuite: {{ netsuiteStock }}
                  </span>
                </div>
              </div>

              <!-- Fechas -->
              <div class="border-t border-gray-200 pt-4 text-xs text-secondary-500 space-y-1">
                <p><span class="font-medium">Creado:</span> {{ formatDate(product.created_at) }}</p>
                <p><span class="font-medium">Actualizado:</span> {{ formatDate(product.updated_at) }}</p>
              </div>
            </div>
          </template>
        </Card>

        <!-- Card Marca y Gamma -->
        <Card>
          <template #title>
            <span class="text-lg">Marca y Gamma</span>
          </template>
          <template #content>
            <div class="space-y-4">
              <div>
                <label for="edit-brand" class="block text-sm font-medium text-secondary-700 mb-1">
                  Marca
                </label>
                <Dropdown
                  id="edit-brand"
                  v-model="form.brand_id"
                  :options="catalogStore.brands"
                  optionLabel="name"
                  optionValue="id"
                  placeholder="Seleccionar marca"
                  showClear
                  class="w-full"
                  @change="handleBrandChange"
                />
              </div>
              <div>
                <label for="edit-gamma" class="block text-sm font-medium text-secondary-700 mb-1">
                  Gamma (sub-marca)
                </label>
                <Dropdown
                  id="edit-gamma"
                  v-model="form.gamma_id"
                  :options="gammaOptions"
                  optionLabel="tiendagamma_nombre"
                  optionValue="tiendagamma_id"
                  placeholder="Seleccionar gamma"
                  showClear
                  class="w-full"
                  :disabled="!form.brand_id || gammaOptions.length === 0"
                />
                <small v-if="form.brand_id && gammaOptions.length === 0" class="text-gray-500">
                  Esta marca no tiene gammas
                </small>
              </div>
            </div>
          </template>
        </Card>

        <!-- Card Categorias -->
        <Card>
          <template #title>
            <span class="text-lg">Categorias</span>
          </template>
          <template #content>
            <Tree
              v-model:selectionKeys="selectedCategoryKeys"
              :value="categoryTreeNodes"
              v-model:expandedKeys="expandedCategoryKeys"
              selectionMode="checkbox"
              class="p-0 border-none"
            />
          </template>
        </Card>

        <!-- Etiquetas del producto -->
        <ProductTagAssignment v-if="product" :product-id="product.id" />

        <!-- Categorias Externas -->
        <Card>
          <template #title>
            <span class="text-lg">Categorias Externas</span>
          </template>
          <template #content>
            <div class="space-y-4">
              <!-- Facebook -->
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <i class="pi pi-facebook text-blue-600"></i>
                  <span class="text-sm font-semibold text-secondary-700">Facebook</span>
                </div>
                <div v-if="facebookCategoryDisplay" class="flex items-center gap-2">
                  <span class="text-sm text-secondary-600 flex-1 truncate" :title="facebookCategoryDisplay">{{ facebookCategoryDisplay }}</span>
                  <Button icon="pi pi-pencil" text size="small" @click="openExtCategoryDialog('facebook')" v-tooltip="'Cambiar'" />
                  <Button icon="pi pi-times" text size="small" severity="danger" @click="unlinkExtCategory('facebook')" v-tooltip="'Desvincular'" />
                </div>
                <div v-else>
                  <Button label="Vincular" icon="pi pi-link" text size="small" @click="openExtCategoryDialog('facebook')" />
                </div>
              </div>

              <!-- Google -->
              <div class="border-t border-gray-200 pt-4">
                <div class="flex items-center gap-2 mb-1">
                  <i class="pi pi-google text-red-600"></i>
                  <span class="text-sm font-semibold text-secondary-700">Google</span>
                </div>
                <div v-if="googleCategoryDisplay" class="flex items-center gap-2">
                  <span class="text-sm text-secondary-600 flex-1 truncate" :title="googleCategoryDisplay">{{ googleCategoryDisplay }}</span>
                  <Button icon="pi pi-pencil" text size="small" @click="openExtCategoryDialog('google')" v-tooltip="'Cambiar'" />
                  <Button icon="pi pi-times" text size="small" severity="danger" @click="unlinkExtCategory('google')" v-tooltip="'Desvincular'" />
                </div>
                <div v-else>
                  <Button label="Vincular" icon="pi pi-link" text size="small" @click="openExtCategoryDialog('google')" />
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Opiniones del producto -->
        <ProductReviewsCard v-if="product" :product-id="product.id" />
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="bg-white rounded-lg shadow p-12 text-center">
      <i class="pi pi-box text-6xl text-secondary-300 mb-4"></i>
      <h3 class="text-xl font-semibold text-secondary mb-2">Producto no encontrado</h3>
      <Button label="Volver a productos" @click="router.push('/products')" />
    </div>

    <!-- Modal de subida de imagen -->
    <ProductImageUploader v-if="product" v-model:visible="showImageUploader" :product-id="product.id"
      @upload-success="handleImageUploadSuccess" @upload-error="handleImageUploadError" />

    <!-- Modal de subida de video -->
    <ProductVideoUploader v-if="product" v-model:visible="showVideoUploader" :product-id="product.id"
      @upload-success="handleVideoUploadSuccess" @upload-error="handleVideoUploadError" />

    <!-- Modal de subida de documentos -->
    <ProductDocumentUploader v-if="product" v-model:visible="showDocumentUploader" :product-id="product.id"
      @upload-success="handleDocumentUpload" @upload-error="handleDocumentError" />

    <!-- Modal de edicion de descripcion -->
    <ProductDescriptionEditor v-if="product" v-model="showDescriptionEditor"
      :content="product.description_html || product.description || ''" :mode="editorMode"
      @save="handleSaveDescription" />

    <!-- Dialog de seleccion de categoria externa -->
    <Dialog
      v-model:visible="showExtCategoryDialog"
      :header="`Seleccionar Categoria ${extCategoryPlatformLabel}`"
      :style="{ width: '600px' }"
      modal
    >
      <div class="space-y-3">
        <!-- Breadcrumb de seleccion actual -->
        <div v-if="extCategorySelectedPath.length" class="flex flex-wrap items-center gap-1 text-sm bg-gray-50 p-2 rounded">
          <i :class="extCategoryPlatformIcon" class="mr-1"></i>
          <template v-for="(cat, i) in extCategorySelectedPath" :key="i">
            <span v-if="i > 0" class="text-secondary-400">&gt;</span>
            <span class="text-secondary-700 font-medium">{{ cat.name }}</span>
          </template>
        </div>

        <!-- Cascading dropdowns -->
        <div v-for="(levelOptions, levelIndex) in extCategoryLevels" :key="levelIndex" class="relative">
          <label class="block text-xs font-medium text-secondary-500 mb-1">
            Nivel {{ levelIndex + 1 }}
          </label>
          <Dropdown
            :model-value="extCategorySelectedPath[levelIndex]?.id || null"
            :options="levelOptions"
            option-label="name"
            option-value="id"
            :placeholder="`Seleccionar...`"
            class="w-full"
            :filter="levelOptions.length > 10"
            filter-placeholder="Buscar..."
            @change="(e: any) => {
              const option = levelOptions.find((o: ExternalCategoryOption) => o.id === e.value)
              if (option) selectExtCategory(option, levelIndex)
            }"
          />
        </div>

        <!-- Loading -->
        <div v-if="extCategoryLoading" class="flex items-center gap-2 text-sm text-secondary-500">
          <i class="pi pi-spinner pi-spin"></i>
          <span>Cargando subcategorias...</span>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button label="Cancelar" severity="secondary" text @click="showExtCategoryDialog = false" />
          <Button
            label="Confirmar"
            icon="pi pi-check"
            :disabled="!extCategorySelectedPath.length"
            @click="confirmExtCategory"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductsStore } from '@/stores/products.store'
import { useCatalogStore } from '@/stores/catalog.store'
import { useGammaStore } from '@/stores/gamma.store'
import { useAuthStore } from '@/stores/auth.store'
import { useFormatters } from '@/composables/useFormatters'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Divider from 'primevue/divider'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Dropdown from 'primevue/dropdown'
import Tree from 'primevue/tree'
import Checkbox from 'primevue/checkbox'
import InputSwitch from 'primevue/inputswitch'
import Dialog from 'primevue/dialog'
import ProductImageGallery from '@/components/products/ProductImageGallery.vue'
import ProductImageUploader from '@/components/products/ProductImageUploader.vue'
import ProductVideoUploader from '@/components/products/ProductVideoUploader.vue'
import ProductVideoPlayer from '@/components/products/ProductVideoPlayer.vue'
import ProductDocumentUploader from '@/components/products/ProductDocumentUploader.vue'
import ProductDocumentList from '@/components/products/ProductDocumentList.vue'
import ProductDescriptionEditor from '@/components/products/ProductDescriptionEditor.vue'
import ProductTagAssignment from '@/components/ProductTagAssignment.vue'
import ProductReviewsCard from '@/components/reviews/ProductReviewsCard.vue'
import type { ProductUpdatePayload, ExternalCategoryOption } from '@/types/product.types'
import { useShippingConfigStore } from '@/stores/shipping-config.store'
import { productsApi } from '@/api/products.api'

const route = useRoute()
const router = useRouter()
const productsStore = useProductsStore()
const catalogStore = useCatalogStore()
const gammaStore = useGammaStore()
const authStore = useAuthStore()
const toast = useToast()
const shippingConfigStore = useShippingConfigStore()
const { formatCurrency, formatDate } = useFormatters()

const product = computed(() => productsStore.currentProduct)

// ── Modal visibility ──
const showImageUploader = ref(false)
const showVideoUploader = ref(false)
const showDocumentUploader = ref(false)
const showDescriptionEditor = ref(false)
const editorMode = ref<'wysiwyg' | 'code'>('wysiwyg')
const isSyncingStock = ref(false)
const netsuiteStock = ref<number | null>(null)
const hasErpIntegration = ref(false)

// ── Form state ──
const saving = ref(false)
const isDirty = ref(false)
const skipDirtyWatch = ref(false)
const validationErrors = ref<Record<string, string>>({})

interface FormState extends ProductUpdatePayload {
  categories?: number[]
}

const form = ref<FormState>({
  name: '',
  sku: '',
  barcode: '',
  description_short: '',
  price: undefined,
  price_without_tax: undefined,
  tax_affectation: 1,
  igv_percent: 18,
  stock: undefined,
  unlimited_stock: false,
  published: true,
  order: undefined,
  brand_id: null,
  gamma_id: null,
  categories: [],
  // SEO
  meta_title: '',
  meta_description: '',
  meta_image: null,
  slug: '',
  // Dimensiones y peso
  height: null,
  width: null,
  length: null,
  dimensions_unit: 'centimetros',
  weight: null,
  weight_unit: 'kilogramos',
  // External categories
  facebook_category_id: null,
  google_category_id: null,
  // Shipping per product
  shipping_conversion_factor: 1,
  shipping_per_unit: false,
})

const taxAffectationOptions = [
  { label: 'Gravado (con IGV)', value: 1 },
  { label: 'Exonerado', value: 2 },
  { label: 'Inafecto', value: 3 },
]

const dimensionUnitOptions = [
  { label: 'Centimetros (cm)', value: 'centimetros' },
  { label: 'Metros (m)', value: 'metros' },
  { label: 'Pulgadas (in)', value: 'pulgadas' },
]

const weightUnitOptions = [
  { label: 'Kilogramos (kg)', value: 'kilogramos' },
  { label: 'Gramos (g)', value: 'gramos' },
  { label: 'Libras (lb)', value: 'libras' },
]

// ── Category tree for TreeSelect ──
interface TreeNode {
  key: string
  label: string
  children?: TreeNode[]
}

const toTreeNodes = (cats: any[]): TreeNode[] =>
  cats.map(c => ({
    key: String(c.id),
    label: c.name,
    ...(c.sub?.length ? { children: toTreeNodes(c.sub) } : {}),
  }))

const categoryTreeNodes = computed(() => toTreeNodes(catalogStore.categories))

const collectAllKeys = (nodes: TreeNode[]): Record<string, boolean> => {
  const keys: Record<string, boolean> = {}
  const walk = (list: TreeNode[]) => {
    for (const n of list) {
      keys[n.key] = true
      if (n.children) walk(n.children)
    }
  }
  walk(nodes)
  return keys
}

const expandedCategoryKeys = ref<Record<string, boolean>>({})

watch(categoryTreeNodes, nodes => {
  expandedCategoryKeys.value = collectAllKeys(nodes)
}, { immediate: true })

// Bridge: form.categories (number[]) <-> TreeSelect selectedKeys ({key: true})
const selectedCategoryKeys = computed({
  get() {
    const obj: Record<string, any> = {}
    for (const id of form.value.categories || []) {
      obj[String(id)] = { checked: true, partialChecked: false }
    }
    return obj
  },
  set(val: Record<string, any> | null) {
    if (!val) {
      form.value.categories = []
      return
    }
    form.value.categories = Object.entries(val)
      .filter(([, v]) => v.checked)
      .map(([k]) => Number(k))
  },
})

// ── Populate form from product ──
const populateForm = async () => {
  const p = product.value
  if (!p) return

  skipDirtyWatch.value = true

  form.value = {
    name: p.name || '',
    sku: p.sku || '',
    barcode: p.barcode || '',
    description_short: p.description_short || '',
    price: p.price ?? undefined,
    price_without_tax: p.price_without_tax ?? undefined,
    tax_affectation: p.tax_affectation || 1,
    igv_percent: p.igv_percent || 18,
    stock: p.stock ?? undefined,
    unlimited_stock: p.unlimited_stock || false,
    published: p.published,
    order: p.order ?? undefined,
    brand_id: p.brand?.id || null,
    gamma_id: p.gamma?.id || null,
    categories: p.categories?.map(c => c.id) || [],
    // SEO
    meta_title: p.seo?.meta_title || '',
    meta_description: p.seo?.meta_description || '',
    meta_image: p.seo?.meta_image || null,
    slug: p.seo?.slug || '',
    // Dimensiones y peso
    height: p.height ?? null,
    width: p.width ?? null,
    length: p.length ?? null,
    dimensions_unit: p.dimensions_unit || 'centimetros',
    weight: p.weight ?? null,
    weight_unit: p.weight_unit || 'kilogramos',
    // External categories
    facebook_category_id: p.external_categories?.facebook?.id || null,
    google_category_id: p.external_categories?.google?.id || null,
    // Shipping per product
    shipping_conversion_factor: p.shipping_conversion_factor ?? 1,
    shipping_per_unit: p.shipping_per_unit ?? false,
  }

  // Load gammas for current brand
  if (p.brand?.id) {
    await gammaStore.fetchByBrand(p.brand.id)
  } else {
    gammaStore.clearGammasByBrand()
  }

  await nextTick()
  isDirty.value = false
  skipDirtyWatch.value = false
}

watch(() => product.value, () => {
  populateForm()
}, { immediate: true })

// Track dirty state
watch(form, () => {
  if (!skipDirtyWatch.value) {
    isDirty.value = true
  }
}, { deep: true })

// ── Gamma cascading ──
const gammaOptions = computed(() => gammaStore.gammasByBrand || [])

const handleBrandChange = async () => {
  form.value.gamma_id = null
  gammaStore.clearGammasByBrand()
  if (form.value.brand_id) {
    await gammaStore.fetchByBrand(form.value.brand_id)
  }
}

// ── Price auto-calculation ──
const onPriceChange = (value: number | null) => {
  form.value.price = value ?? undefined
  if (form.value.tax_affectation === 1 && value != null) {
    const igv = (form.value.igv_percent || 18) / 100
    form.value.price_without_tax = parseFloat((value / (1 + igv)).toFixed(8))
  } else if (form.value.tax_affectation !== 1 && value != null) {
    form.value.price_without_tax = value
  }
}

const onPriceWithoutTaxChange = (value: number | null) => {
  form.value.price_without_tax = value ?? undefined
  if (form.value.tax_affectation === 1 && value != null) {
    const igv = (form.value.igv_percent || 18) / 100
    form.value.price = parseFloat((value * (1 + igv)).toFixed(2))
  } else if (form.value.tax_affectation !== 1 && value != null) {
    form.value.price = value
  }
}

const onTaxAffectationChange = () => {
  // Recalculate prices based on new affectation
  if (form.value.tax_affectation === 1) {
    // Gravado: recalculate from current price
    if (form.value.price != null) {
      const igv = (form.value.igv_percent || 18) / 100
      form.value.price_without_tax = parseFloat((form.value.price / (1 + igv)).toFixed(8))
    }
  } else {
    // Exonerado/Inafecto: both prices same
    if (form.value.price != null) {
      form.value.price_without_tax = form.value.price
    }
  }
}

// ── Validation ──
const validate = (): boolean => {
  validationErrors.value = {}
  if (!form.value.name || form.value.name.trim().length < 3) {
    validationErrors.value.name = 'El nombre debe tener al menos 3 caracteres'
  }
  return Object.keys(validationErrors.value).length === 0
}

// ── Save ──
const handleSave = async () => {
  if (!product.value || !validate()) return

  saving.value = true

  // Auto-fill SEO fields if empty
  const payload = { ...form.value }
  if (!payload.meta_title && payload.name) {
    payload.meta_title = payload.name
  }
  if (!payload.meta_description && payload.description_short) {
    payload.meta_description = payload.description_short.substring(0, 160)
  }

  const result = await productsStore.updateProduct(product.value.id, payload)

  if (result.success) {
    isDirty.value = false
    toast.add({
      severity: 'success',
      summary: 'Producto actualizado',
      detail: 'Los cambios se guardaron correctamente',
      life: 3000,
    })
    // Refresh to get canonical data
    await productsStore.fetchProduct(product.value.id)
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: productsStore.error || 'No se pudo actualizar el producto',
      life: 5000,
    })
  }
  saving.value = false
}

const resetForm = () => {
  populateForm()
}

// ── Computed helpers ──
const hasVideo = computed(() => !!(product.value?.video?.cloudflare_uid))

// Per-product shipping is enabled when envioporProducto is 1 (highest) or 2 (sum)
const showProductShipping = computed(() => {
  const mode = shippingConfigStore.savedConfig.envioporProducto
  return mode === 1 || mode === 2
})

// ── External category cascading dropdowns ──
const showExtCategoryDialog = ref(false)
const extCategoryPlatform = ref<'facebook' | 'google'>('facebook')
const extCategoryLevels = ref<ExternalCategoryOption[][]>([])
const extCategorySelectedPath = ref<ExternalCategoryOption[]>([])
const extCategoryLoading = ref(false)

const extCategoryPlatformLabel = computed(() =>
  extCategoryPlatform.value === 'facebook' ? 'Facebook' : 'Google'
)

const extCategoryPlatformIcon = computed(() =>
  extCategoryPlatform.value === 'facebook' ? 'pi pi-facebook' : 'pi pi-google'
)

async function openExtCategoryDialog(platform: 'facebook' | 'google') {
  extCategoryPlatform.value = platform
  extCategoryLevels.value = []
  extCategorySelectedPath.value = []
  showExtCategoryDialog.value = true
  await loadExtCategoryLevel(0, 0)
}

async function loadExtCategoryLevel(parentId: number, levelIndex: number) {
  extCategoryLoading.value = true
  try {
    const res = await productsApi.getExternalCategories(extCategoryPlatform.value, parentId)
    if (res.success && res.data) {
      // Trim levels after current
      extCategoryLevels.value = extCategoryLevels.value.slice(0, levelIndex)
      extCategoryLevels.value.push(res.data)
      // Trim selected path
      extCategorySelectedPath.value = extCategorySelectedPath.value.slice(0, levelIndex)
    }
  } finally {
    extCategoryLoading.value = false
  }
}

async function selectExtCategory(option: ExternalCategoryOption, levelIndex: number) {
  // Update selected path
  extCategorySelectedPath.value = extCategorySelectedPath.value.slice(0, levelIndex)
  extCategorySelectedPath.value.push(option)

  if (option.has_children) {
    await loadExtCategoryLevel(option.id, levelIndex + 1)
  } else {
    // Leaf: trim any levels after
    extCategoryLevels.value = extCategoryLevels.value.slice(0, levelIndex + 1)
  }
}

function confirmExtCategory() {
  const selected = extCategorySelectedPath.value[extCategorySelectedPath.value.length - 1]
  if (!selected) return

  if (extCategoryPlatform.value === 'facebook') {
    form.value.facebook_category_id = selected.external_id
  } else {
    form.value.google_category_id = selected.external_id
  }
  showExtCategoryDialog.value = false
}

function unlinkExtCategory(platform: 'facebook' | 'google') {
  if (platform === 'facebook') {
    form.value.facebook_category_id = null
  } else {
    form.value.google_category_id = null
  }
}

const facebookCategoryDisplay = computed(() => {
  if (form.value.facebook_category_id && product.value?.external_categories?.facebook) {
    // If the ID matches what's loaded, use the display name
    if (product.value.external_categories.facebook.id === form.value.facebook_category_id) {
      return product.value.external_categories.facebook.name
    }
  }
  return form.value.facebook_category_id || null
})

const googleCategoryDisplay = computed(() => {
  if (form.value.google_category_id && product.value?.external_categories?.google) {
    if (product.value.external_categories.google.id === form.value.google_category_id) {
      return product.value.external_categories.google.name
    }
  }
  return form.value.google_category_id || null
})

const calculatedVolumetricWeight = computed(() => {
  const { height, width, length, dimensions_unit } = form.value
  if (!height || !width || !length) return null
  let h = height, w = width, l = length
  if (dimensions_unit === 'metros') { h *= 100; w *= 100; l *= 100 }
  if (dimensions_unit === 'pulgadas') { h *= 2.54; w *= 2.54; l *= 2.54 }
  return (h * w * l) / 5000
})

const storeUrl = computed(() => authStore.selectedStore?.url || null)

// ── Store URL ──
const openProductInStore = () => {
  if (storeUrl.value && product.value?.seo?.slug) {
    const baseUrl = storeUrl.value.endsWith('/') ? storeUrl.value : `${storeUrl.value}/`
    window.open(`${baseUrl}producto/${product.value.seo.slug}`, '_blank')
  }
}

// ── Description editor ──
const openDescriptionEditor = (mode: 'wysiwyg' | 'code') => {
  editorMode.value = mode
  showDescriptionEditor.value = true
}

const handleSaveDescription = async (content: string) => {
  if (!product.value) return
  const result = await productsStore.updateProduct(product.value.id, { description_html: content })
  if (result.success) {
    toast.add({ severity: 'success', summary: 'Descripcion actualizada', life: 3000 })
    await productsStore.fetchProduct(product.value.id)
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: productsStore.error || 'No se pudo actualizar', life: 3000 })
  }
}

// ── OG Image handlers ──
const ogImageInput = ref<HTMLInputElement | null>(null)

const handleOgImageSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !product.value) return

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    toast.add({ severity: 'error', summary: 'Formato no valido', detail: 'Use JPG, PNG o WebP', life: 5000 })
    input.value = ''
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    toast.add({ severity: 'error', summary: 'Imagen muy grande', detail: 'Maximo 5MB', life: 5000 })
    input.value = ''
    return
  }

  try {
    const { productsApi } = await import('@/api/products.api')
    const response = await productsApi.uploadOgImage(product.value.id, file)
    if (response.success && response.data) {
      form.value.meta_image = response.data.meta_image
      toast.add({ severity: 'success', summary: 'Imagen OpenGraph subida', life: 3000 })
      await productsStore.fetchProduct(product.value.id)
    }
  } catch (error: any) {
    toast.add({ severity: 'error', summary: 'Error al subir imagen', detail: error.message, life: 5000 })
  }

  input.value = ''
}

const handleDeleteOgImage = async () => {
  if (!product.value) return

  try {
    const { productsApi } = await import('@/api/products.api')
    const response = await productsApi.deleteOgImage(product.value.id)
    if (response.success) {
      form.value.meta_image = null
      toast.add({ severity: 'success', summary: 'Imagen OpenGraph eliminada', life: 3000 })
      await productsStore.fetchProduct(product.value.id)
    }
  } catch (error: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 5000 })
  }
}

// ── Image handlers ──
const handleImageUploadSuccess = async () => {
  toast.add({ severity: 'success', summary: 'Imagen subida', life: 3000 })
  showImageUploader.value = false
  if (product.value) await productsStore.fetchProduct(product.value.id)
}

const handleImageUploadError = (error: string) => {
  toast.add({ severity: 'error', summary: 'Error al subir imagen', detail: error, life: 5000 })
}

const handleImageDelete = async (imageId: number) => {
  if (!product.value) return
  try {
    const { productsApi } = await import('@/api/products.api')
    const response = await productsApi.deleteImage(product.value.id, imageId)
    if (response.success) {
      toast.add({ severity: 'success', summary: 'Imagen eliminada', life: 3000 })
      await productsStore.fetchProduct(product.value.id)
    } else {
      throw new Error(response.message || 'Error al eliminar imagen')
    }
  } catch (error: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 5000 })
  }
}

// ── Video handlers ──
const handleVideoUploadSuccess = async () => {
  toast.add({ severity: 'success', summary: 'Video en proceso', detail: 'El video se esta procesando.', life: 5000 })
  showVideoUploader.value = false
  if (product.value) await productsStore.fetchProduct(product.value.id)
}

const handleVideoUploadError = (error: any) => {
  toast.add({ severity: 'error', summary: 'Error al subir video', detail: error.message, life: 5000 })
}

const handleVideoDelete = async () => {
  toast.add({ severity: 'success', summary: 'Video eliminado', life: 3000 })
  const productId = Number(route.params.id)
  if (productId) await productsStore.fetchProduct(productId)
}

const handleVideoRefresh = async () => {
  const productId = Number(route.params.id)
  if (productId) await productsStore.fetchProduct(productId)
}

// ── Document handlers ──
const handleDocumentUpload = async () => {
  toast.add({ severity: 'success', summary: 'Documento subido', life: 3000 })
  if (product.value) await productsStore.fetchProduct(product.value.id)
}

const handleDocumentDelete = async () => {
  toast.add({ severity: 'success', summary: 'Documento eliminado', life: 3000 })
  if (product.value) await productsStore.fetchProduct(product.value.id)
}

const handleDocumentError = (error: string) => {
  toast.add({ severity: 'error', summary: 'Error', detail: error, life: 5000 })
}

// ── NetSuite Stock ──
const syncStockWithNetsuite = async () => {
  if (!product.value) return
  isSyncingStock.value = true
  try {
    const { netsuiteApi } = await import('@/api/netsuite.api')
    const response = await netsuiteApi.syncProductStock(product.value.id)
    if (response.success && response.data) {
      const { previous_stock, current_stock, difference } = response.data
      if (product.value) product.value.stock = current_stock
      netsuiteStock.value = current_stock
      toast.add({
        severity: 'success',
        summary: 'Stock sincronizado',
        detail: `Stock actualizado de ${previous_stock} a ${current_stock} (${difference >= 0 ? '+' : ''}${difference})`,
        life: 5000,
      })
      await productsStore.fetchProduct(product.value.id)
    } else {
      throw new Error(response.message || 'Error al sincronizar stock')
    }
  } catch (error: any) {
    toast.add({ severity: 'error', summary: 'Error al sincronizar', detail: error.message, life: 5000 })
  } finally {
    isSyncingStock.value = false
  }
}

const queryNetsuiteStock = async () => {
  if (!product.value) return
  try {
    const { netsuiteApi } = await import('@/api/netsuite.api')
    const response = await netsuiteApi.getProductNetsuiteStock(product.value.id)
    if (response.success && response.data) {
      netsuiteStock.value = response.data.netsuite_stock
      toast.add({ severity: 'info', summary: 'Stock en NetSuite', detail: `Stock: ${response.data.netsuite_stock} unidades`, life: 5000 })
    } else {
      throw new Error(response.message || 'Error al consultar stock')
    }
  } catch (error: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 5000 })
  }
}

// ── Init ──
onMounted(async () => {
  const productId = Number(route.params.id)
  if (productId) {
    await productsStore.fetchProduct(productId)
  }

  // Load catalog data
  if (catalogStore.categories.length === 0 || catalogStore.brands.length === 0) {
    await catalogStore.fetchAll()
  }

  // Check ERP integration
  const storeId = authStore.selectedStore?.id
  if (storeId) {
    try {
      const { netsuiteApi } = await import('@/api/netsuite.api')
      const response = await netsuiteApi.getCredentials(storeId)
      hasErpIntegration.value = !!(response.success && response.data)
    } catch {
      hasErpIntegration.value = false
    }
  }

  // Load shipping config to determine if per-product shipping is enabled
  if (!shippingConfigStore.isLoaded) {
    shippingConfigStore.fetchConfig()
  }
})
</script>

<style scoped>
:deep(.p-tree) {
  padding: 0;
}

:deep(.p-tree .p-treenode-children) {
  padding-left: 1.5rem;
}
</style>
