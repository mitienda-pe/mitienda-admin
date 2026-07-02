<template>
  <div>
    <!-- Validation banners (rojo solo críticos, amarillo aspiracionales, verde sin issues) -->
    <div
      v-if="criticalIssues.length"
      class="mb-4 rounded-lg border border-red-200 bg-red-50 p-4"
    >
      <div class="flex items-start gap-3">
        <i class="pi pi-exclamation-triangle text-red-600 text-xl"></i>
        <div class="flex-1">
          <h3 class="font-semibold text-red-800">
            {{ criticalIssues.length }} problema(s) crítico(s)
          </h3>
          <p class="text-sm text-red-700 mt-1">
            Hay datos en uso que están fallando — el sync NetSuite está bloqueado.
          </p>
          <ul class="mt-3 space-y-1 text-sm text-red-700 list-disc list-inside">
            <li v-for="(issue, idx) in criticalIssues" :key="idx">{{ issue.message }}</li>
          </ul>
        </div>
      </div>
    </div>

    <div
      v-if="warningIssues.length"
      class="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4"
    >
      <div class="flex items-start gap-3">
        <i class="pi pi-info-circle text-yellow-600 text-xl"></i>
        <div class="flex-1">
          <h3 class="font-semibold text-yellow-800">
            {{ warningIssues.length }} aviso(s) — config aspiracional
          </h3>
          <p class="text-sm text-yellow-700 mt-1">
            Estos IDs faltan pero no afectan ventas activas. Configurar solo si vas a
            empezar a usarlos.
          </p>
          <details class="mt-2 text-sm text-yellow-700">
            <summary class="cursor-pointer underline">Ver detalle</summary>
            <ul class="mt-2 space-y-1 list-disc list-inside">
              <li v-for="(issue, idx) in warningIssues" :key="idx">{{ issue.message }}</li>
            </ul>
          </details>
        </div>
      </div>
    </div>

    <div
      v-if="credentials && !isValidating && !criticalIssues.length && !warningIssues.length"
      class="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 flex items-start gap-3"
    >
      <i class="pi pi-check-circle text-green-600 text-xl"></i>
      <div>
        <h3 class="font-semibold text-green-800">Configuración NetSuite completa</h3>
        <p class="text-sm text-green-700 mt-1">
          Todos los IDs requeridos están registrados. La tienda puede sincronizar sin
          observaciones.
        </p>
      </div>
    </div>

    <div
      v-else-if="credentials && !isValidating && !criticalIssues.length && warningIssues.length"
      class="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 flex items-start gap-3"
    >
      <i class="pi pi-check-circle text-green-600 text-xl"></i>
      <div>
        <h3 class="font-semibold text-green-800">Tienda operativa</h3>
        <p class="text-sm text-green-700 mt-1">
          Sin críticos. Revisa los avisos amarillos si quieres habilitar más sucursales,
          métodos de pago o cajeros.
        </p>
      </div>
    </div>

    <!-- Estado actual -->
    <div v-if="credentials" class="mb-6 p-4 rounded-lg" :class="Number(credentials.tiendacredencialerp_estado) === 1 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'">
      <div class="flex items-start gap-3">
        <i :class="Number(credentials.tiendacredencialerp_estado) === 1 ? 'pi pi-check-circle text-green-600' : 'pi pi-exclamation-triangle text-yellow-600'" class="text-xl"></i>
        <div>
          <h3 class="font-semibold" :class="Number(credentials.tiendacredencialerp_estado) === 1 ? 'text-green-800' : 'text-yellow-800'">
            {{ Number(credentials.tiendacredencialerp_estado) === 1 ? 'NetSuite configurado' : 'NetSuite inactivo' }}
          </h3>
          <p class="text-sm mt-1" :class="Number(credentials.tiendacredencialerp_estado) === 1 ? 'text-green-700' : 'text-yellow-700'">
            {{ Number(credentials.tiendacredencialerp_estado) === 1
              ? 'Tus credenciales están guardadas. Puedes actualizarlas o probar la conexión.'
              : 'Las credenciales están configuradas pero desactivadas.'
            }}
          </p>
        </div>
      </div>
    </div>

    <!-- Formulario -->
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Credenciales OAuth -->
      <div>
        <h3 class="text-lg font-semibold text-secondary-800 mb-4">Credenciales OAuth 1.0</h3>

        <div class="space-y-4">
          <div>
            <label for="account_id" class="block text-sm font-medium text-secondary-700 mb-2">
              Account ID <span class="text-red-500">*</span>
            </label>
            <InputText
              id="account_id"
              v-model="formData.account_id"
              placeholder="6460294_SB1"
              class="w-full"
              :class="{ 'p-invalid': errors.account_id }"
            />
            <small v-if="errors.account_id" class="text-red-500">{{ errors.account_id }}</small>
            <small class="text-secondary-600 mt-1 block">
              Formato: XXXXXXX_SB1 (sandbox) o XXXXXXX (producción)
            </small>
          </div>

          <div>
            <label for="consumer_key" class="block text-sm font-medium text-secondary-700 mb-2">
              Consumer Key <span class="text-red-500">*</span>
            </label>
            <InputText
              id="consumer_key"
              v-model="formData.consumer_key"
              placeholder="Consumer Key de NetSuite"
              class="w-full"
              :class="{ 'p-invalid': errors.consumer_key }"
            />
            <small v-if="errors.consumer_key" class="text-red-500">{{ errors.consumer_key }}</small>
          </div>

          <div>
            <label for="consumer_secret" class="block text-sm font-medium text-secondary-700 mb-2">
              Consumer Secret {{ isEdit ? '' : '*' }}
            </label>
            <Password
              id="consumer_secret"
              v-model="formData.consumer_secret"
              :placeholder="isEdit ? 'Dejar vacío para mantener actual' : 'Consumer Secret de NetSuite'"
              class="w-full"
              :class="{ 'p-invalid': errors.consumer_secret }"
              :feedback="false"
              toggleMask
            />
            <small v-if="errors.consumer_secret" class="text-red-500">{{ errors.consumer_secret }}</small>
            <div v-if="isEdit" class="mt-2">
              <div v-if="hasConsumerSecret" class="flex items-center gap-2 text-sm">
                <i class="pi pi-check-circle text-green-600"></i>
                <span class="text-green-700">Secret guardado: {{ credentials?.tiendacredencialerp_consumer_secret_masked || '***' }}</span>
              </div>
              <div v-else class="flex items-center gap-2 text-sm p-2 bg-red-50 border border-red-200 rounded">
                <i class="pi pi-exclamation-triangle text-red-600"></i>
                <span class="text-red-700 font-medium">No hay secret guardado. Debes proporcionar uno para probar la conexión.</span>
              </div>
            </div>
          </div>

          <div>
            <label for="token_id" class="block text-sm font-medium text-secondary-700 mb-2">
              Token ID <span class="text-red-500">*</span>
            </label>
            <InputText
              id="token_id"
              v-model="formData.token_id"
              placeholder="Token ID de NetSuite"
              class="w-full"
              :class="{ 'p-invalid': errors.token_id }"
            />
            <small v-if="errors.token_id" class="text-red-500">{{ errors.token_id }}</small>
          </div>

          <div>
            <label for="token_secret" class="block text-sm font-medium text-secondary-700 mb-2">
              Token Secret {{ isEdit ? '' : '*' }}
            </label>
            <Password
              id="token_secret"
              v-model="formData.token_secret"
              :placeholder="isEdit ? 'Dejar vacío para mantener actual' : 'Token Secret de NetSuite'"
              class="w-full"
              :class="{ 'p-invalid': errors.token_secret }"
              :feedback="false"
              toggleMask
            />
            <small v-if="errors.token_secret" class="text-red-500">{{ errors.token_secret }}</small>
            <div v-if="isEdit" class="mt-2">
              <div v-if="hasTokenSecret" class="flex items-center gap-2 text-sm">
                <i class="pi pi-check-circle text-green-600"></i>
                <span class="text-green-700">Secret guardado: {{ credentials?.tiendacredencialerp_token_secret_masked || '***' }}</span>
              </div>
              <div v-else class="flex items-center gap-2 text-sm p-2 bg-red-50 border border-red-200 rounded">
                <i class="pi pi-exclamation-triangle text-red-600"></i>
                <span class="text-red-700 font-medium">No hay secret guardado. Debes proporcionar uno para probar la conexión.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Divider />

      <!-- Configuración NetSuite -->
      <div>
        <h3 class="text-lg font-semibold text-secondary-800 mb-4">Configuración de NetSuite</h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label for="subsidiary_id" class="block text-sm font-medium text-secondary-700 mb-2">
              Subsidiary ID <span class="text-red-500">*</span>
            </label>
            <InputText
              id="subsidiary_id"
              v-model="formData.subsidiary_id"
              class="w-full"
              :class="{ 'p-invalid': isFieldMissing('tiendacredencialerp_subsidiary_id') }"
            />
            <small class="text-secondary-600 mt-1 block">ID de la subsidiaria en NetSuite</small>
          </div>

          <div>
            <label for="ubicacion_serie_id" class="block text-sm font-medium text-secondary-700 mb-2">
              Ubicación Serie ID <span class="text-red-500">*</span>
            </label>
            <InputText
              id="ubicacion_serie_id"
              v-model="formData.ubicacion_serie_id"
              class="w-full"
              :class="{ 'p-invalid': isFieldMissing('tiendacredencialerp_ubicacion_serie_id') }"
            />
            <small class="text-secondary-600 mt-1 block">Para custbody_pe_ubicacion_para_serie</small>
          </div>

          <div>
            <label for="generic_customer_id" class="block text-sm font-medium text-secondary-700 mb-2">
              Generic Customer ID <span class="text-red-500">*</span>
            </label>
            <InputText
              id="generic_customer_id"
              v-model="formData.generic_customer_id"
              class="w-full"
              :class="{ 'p-invalid': isFieldMissing('tiendacredencialerp_generic_customer_id') }"
            />
            <small class="text-secondary-600 mt-1 block">Cliente genérico para ventas &lt;700 soles sin DNI</small>
          </div>

          <div>
            <label for="bonification_item_id" class="block text-sm font-medium text-secondary-700 mb-2">
              Bonification Item ID <span class="text-red-500">*</span>
            </label>
            <InputText
              id="bonification_item_id"
              v-model="formData.bonification_item_id"
              class="w-full"
              :class="{ 'p-invalid': isFieldMissing('tiendacredencialerp_bonification_item_id') }"
            />
            <small class="text-secondary-600 mt-1 block">Item para productos bonificados (gratis)</small>
          </div>

          <div>
            <label for="price_level_id" class="block text-sm font-medium text-secondary-700 mb-2">
              Price Level ID <span class="text-red-500">*</span>
            </label>
            <InputNumber
              id="price_level_id"
              v-model="formData.price_level_id"
              class="w-full"
              :min="1"
              :class="{ 'p-invalid': isFieldMissing('tiendacredencialerp_price_level_id') }"
            />
            <small class="text-secondary-600 mt-1 block">Nivel de precio en NetSuite (ej: 4 = Tiendas / Ecommerce)</small>
          </div>

          <div>
            <label for="customer_category_id" class="block text-sm font-medium text-secondary-700 mb-2">
              Customer Category ID
              <span v-if="isFieldMissing('tiendacredencialerp_customer_category_id')" class="text-red-500 text-xs">(obligatorio sin valor)</span>
            </label>
            <InputText
              id="customer_category_id"
              v-model="formData.customer_category_id"
              placeholder="ID de NetSuite"
              class="w-full"
              :class="{ 'p-invalid': isFieldMissing('tiendacredencialerp_customer_category_id') }"
            />
            <small class="text-secondary-600 mt-1 block">Categoría de cliente en NetSuite para filtrar promociones (ej: 4 = TIENDAS)</small>
          </div>
        </div>

        <Divider />

        <h4 class="text-base font-semibold text-secondary-800 mb-3">
          Identidad y entorno del invoice
        </h4>
        <p class="text-sm text-secondary-600 -mt-2 mb-4">
          IDs estructurales de NetSuite que solían estar hardcoded en el backend.
          Cada uno es <strong>obligatorio</strong>.
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label for="department_id" class="block text-sm font-medium text-secondary-700 mb-2">
              Department ID <span class="text-red-500">*</span>
            </label>
            <InputText id="department_id" v-model="formData.department_id" class="w-full" :class="{ 'p-invalid': isFieldMissing('tiendacredencialerp_department_id') }" />
          </div>
          <div>
            <label for="class_id" class="block text-sm font-medium text-secondary-700 mb-2">
              Class ID <span class="text-red-500">*</span>
            </label>
            <InputText id="class_id" v-model="formData.class_id" class="w-full" :class="{ 'p-invalid': isFieldMissing('tiendacredencialerp_class_id') }" />
          </div>
          <div>
            <label for="currency_id" class="block text-sm font-medium text-secondary-700 mb-2">
              Currency ID <span class="text-red-500">*</span>
            </label>
            <InputText id="currency_id" v-model="formData.currency_id" placeholder="1 = PEN, 2 = USD" class="w-full" :class="{ 'p-invalid': isFieldMissing('tiendacredencialerp_currency_id') }" />
          </div>
          <div>
            <label for="country_id" class="block text-sm font-medium text-secondary-700 mb-2">
              Country ID <span class="text-red-500">*</span>
            </label>
            <InputText id="country_id" v-model="formData.country_id" placeholder="269 = Perú" class="w-full" :class="{ 'p-invalid': isFieldMissing('tiendacredencialerp_country_id') }" />
          </div>
          <div>
            <label for="terms_id" class="block text-sm font-medium text-secondary-700 mb-2">
              Payment Terms ID <span class="text-red-500">*</span>
            </label>
            <InputText id="terms_id" v-model="formData.terms_id" placeholder="ej: 7 = CONTADO" class="w-full" :class="{ 'p-invalid': isFieldMissing('tiendacredencialerp_terms_id') }" />
          </div>
          <div>
            <label for="tax_item_id" class="block text-sm font-medium text-secondary-700 mb-2">
              Tax Code ID <span class="text-red-500">*</span>
            </label>
            <InputText id="tax_item_id" v-model="formData.tax_item_id" placeholder="ej: 6 = S-PE Standard IGV" class="w-full" :class="{ 'p-invalid': isFieldMissing('tiendacredencialerp_tax_item_id') }" />
          </div>
          <div>
            <label for="edoc_standard_id" class="block text-sm font-medium text-secondary-700 mb-2">
              PE eDoc Standard ID <span class="text-red-500">*</span>
            </label>
            <InputText id="edoc_standard_id" v-model="formData.edoc_standard_id" placeholder="2 = PE E-invoicing" class="w-full" :class="{ 'p-invalid': isFieldMissing('tiendacredencialerp_edoc_standard_id') }" />
          </div>
          <div>
            <label for="receivables_account_id" class="block text-sm font-medium text-secondary-700 mb-2">
              Receivables Account ID <span class="text-red-500">*</span>
            </label>
            <InputText id="receivables_account_id" v-model="formData.receivables_account_id" class="w-full" :class="{ 'p-invalid': isFieldMissing('tiendacredencialerp_receivables_account_id') }" />
          </div>
          <div>
            <label for="entity_status_id" class="block text-sm font-medium text-secondary-700 mb-2">
              Customer Entity Status ID <span class="text-red-500">*</span>
            </label>
            <InputText id="entity_status_id" v-model="formData.entity_status_id" class="w-full" :class="{ 'p-invalid': isFieldMissing('tiendacredencialerp_entity_status_id') }" />
          </div>
          <div>
            <label for="payment_method_id" class="block text-sm font-medium text-secondary-700 mb-2">
              Default Payment Method ID <span class="text-red-500">*</span>
            </label>
            <InputText id="payment_method_id" v-model="formData.payment_method_id" class="w-full" :class="{ 'p-invalid': isFieldMissing('tiendacredencialerp_payment_method_id') }" />
          </div>
          <div>
            <label for="default_zip_id" class="block text-sm font-medium text-secondary-700 mb-2">
              Default Ubigeo / Zip ID <span class="text-red-500">*</span>
            </label>
            <InputText id="default_zip_id" v-model="formData.default_zip_id" class="w-full" :class="{ 'p-invalid': isFieldMissing('tiendacredencialerp_default_zip_id') }" />
            <small class="text-secondary-600 mt-1 block">Se usa al crear customers nuevos sin dirección.</small>
          </div>
          <div>
            <label for="discount_item_id" class="block text-sm font-medium text-secondary-700 mb-2">
              Discount Item ID <span class="text-red-500">*</span>
            </label>
            <InputText id="discount_item_id" v-model="formData.discount_item_id" class="w-full" :class="{ 'p-invalid': isFieldMissing('tiendacredencialerp_discount_item_id') }" />
            <small class="text-secondary-600 mt-1 block">Item para líneas de descuento (ej: 537).</small>
          </div>
          <div class="md:col-span-2">
            <label for="default_salesrep_id" class="block text-sm font-medium text-secondary-700 mb-2">
              Default Sales Rep ID <span class="text-secondary-400 text-xs">(opcional)</span>
            </label>
            <InputText id="default_salesrep_id" v-model="formData.default_salesrep_id" class="w-full" />
            <small class="text-secondary-600 mt-1 block">
              Empleado NetSuite que se usa cuando un cajero no tiene
              <code>empleado_netsuite_id</code> mapeado. Vacío = se omite el salesrep.
            </small>
          </div>
        </div>

        <!-- Locations Section -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <div>
              <h4 class="text-base font-semibold text-secondary-800">Sucursales (Branches)</h4>
              <p class="text-sm text-secondary-600">Asigna NetSuite Location IDs a tus sucursales</p>
            </div>
          </div>

          <!-- Info Message -->
          <div class="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div class="flex gap-2">
              <i class="pi pi-info-circle text-primary mt-0.5"></i>
              <div class="text-sm text-primary">
                <p class="font-medium mb-1">Configuración por sucursal:</p>
                <ul class="list-disc list-inside ml-2 space-y-1">
                  <li><strong>Location ID</strong>: ubicación NetSuite (inventario + facturación)</li>
                  <li><strong>Series</strong> y <strong>Generic Customer</strong>: opcionales, sobrescriben el default de tienda</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="isLoadingLocations" class="flex justify-center items-center py-8">
            <i class="pi pi-spin pi-spinner text-2xl text-secondary-400"></i>
            <span class="ml-2 text-secondary-600">Cargando sucursales...</span>
          </div>

          <!-- Branches Table -->
          <div v-else-if="locations.length > 0" class="border border-secondary-200 rounded-lg overflow-hidden">
            <table class="w-full">
              <thead class="bg-secondary-50">
                <tr>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-secondary-700">Sucursal</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-secondary-700">Location ID</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-secondary-700">Serie Boleta</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-secondary-700">Serie Factura</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-secondary-700">Generic Customer</th>
                  <th class="px-4 py-3 text-center text-sm font-semibold text-secondary-700 w-20">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-secondary-200">
                <tr v-for="(location, index) in locations" :key="location.tiendadireccion_id" class="hover:bg-secondary-50">
                  <td class="px-4 py-3 text-sm font-medium text-secondary-800">
                    <div>{{ location.branch_name }}</div>
                    <div class="text-xs text-secondary-500">{{ location.branch_address || '-' }}</div>
                  </td>
                  <td class="px-4 py-3 text-sm">
                    <span v-if="location.netsuite_location_id" class="inline-flex items-center px-2 py-1 rounded-md bg-green-100 text-green-800 font-mono text-xs">
                      {{ location.netsuite_location_id }}
                    </span>
                    <span v-else class="text-secondary-400 italic text-xs">Sin asignar</span>
                  </td>
                  <td class="px-4 py-3 text-sm">
                    <template v-if="getBranchConfig(location.tiendadireccion_id)?.serie_boleta_is_override">
                      <span class="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800 font-mono text-xs">
                        {{ getBranchConfig(location.tiendadireccion_id)?.serie_boleta_netsuite_id }}
                      </span>
                      <div class="text-xs text-secondary-500 mt-0.5">override</div>
                    </template>
                    <template v-else-if="branchesDefaults.serie_boleta_netsuite_id">
                      <span class="font-mono text-xs text-secondary-500">{{ branchesDefaults.serie_boleta_netsuite_id }}</span>
                      <div class="text-xs text-secondary-400">de tienda</div>
                    </template>
                    <span v-else class="text-secondary-400 italic text-xs">—</span>
                  </td>
                  <td class="px-4 py-3 text-sm">
                    <template v-if="getBranchConfig(location.tiendadireccion_id)?.serie_factura_is_override">
                      <span class="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800 font-mono text-xs">
                        {{ getBranchConfig(location.tiendadireccion_id)?.serie_factura_netsuite_id }}
                      </span>
                      <div class="text-xs text-secondary-500 mt-0.5">override</div>
                    </template>
                    <template v-else-if="branchesDefaults.serie_factura_netsuite_id">
                      <span class="font-mono text-xs text-secondary-500">{{ branchesDefaults.serie_factura_netsuite_id }}</span>
                      <div class="text-xs text-secondary-400">de tienda</div>
                    </template>
                    <span v-else class="text-secondary-400 italic text-xs">—</span>
                  </td>
                  <td class="px-4 py-3 text-sm">
                    <template v-if="getBranchConfig(location.tiendadireccion_id)?.generic_customer_is_override">
                      <span class="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800 font-mono text-xs">
                        {{ getBranchConfig(location.tiendadireccion_id)?.generic_customer_id }}
                      </span>
                      <div class="text-xs text-secondary-500 mt-0.5">override</div>
                    </template>
                    <template v-else-if="branchesDefaults.generic_customer_id">
                      <span class="font-mono text-xs text-secondary-500">{{ branchesDefaults.generic_customer_id }}</span>
                      <div class="text-xs text-secondary-400">de tienda</div>
                    </template>
                    <span v-else class="text-secondary-400 italic text-xs">—</span>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <Button
                      icon="pi pi-pencil"
                      size="small"
                      text
                      severity="secondary"
                      @click="openLocationDialog(index)"
                      v-tooltip.top="'Editar configuración'"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="p-6 text-center border-2 border-dashed border-secondary-300 rounded-lg">
            <i class="pi pi-map-marker text-3xl text-secondary-400 mb-2"></i>
            <p class="text-secondary-600">No hay sucursales disponibles</p>
            <p class="text-sm text-secondary-500 mt-1">Las sucursales se gestionan desde el módulo de Branches</p>
          </div>
        </div>
      </div>

      <Divider />

      <!-- Opciones -->
      <div>
        <h3 class="text-lg font-semibold text-secondary-800 mb-4">Opciones</h3>

        <div class="space-y-4">
          <div class="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
            <div>
              <label for="autosync_enabled" class="font-medium text-secondary-800 cursor-pointer">
                Sincronización Automática
              </label>
              <p class="text-sm text-secondary-600 mt-1">
                Sincronizar automáticamente al cambiar orden a estado PAGADO
              </p>
            </div>
            <InputSwitch
              id="autosync_enabled"
              v-model="formData.autosync_enabled"
            />
          </div>

          <div class="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
            <div>
              <label for="delegate_billing" class="font-medium text-secondary-800 cursor-pointer">
                Delegar Facturación a NetSuite
              </label>
              <p class="text-sm text-secondary-600 mt-1">
                NetSuite emite los comprobantes. No se usa Nubefact para facturación automática.
              </p>
            </div>
            <InputSwitch
              id="delegate_billing"
              v-model="formData.delegate_billing"
            />
          </div>

          <!-- Modo de sincronización -->
          <div class="p-4 bg-secondary-50 rounded-lg">
            <div class="flex items-center justify-between gap-4">
              <div>
                <label for="sync_mode" class="font-medium text-secondary-800">
                  Modo de sincronización
                </label>
                <p class="text-sm text-secondary-600 mt-1">
                  Cómo se sincroniza cada orden con NetSuite.
                </p>
              </div>
              <Dropdown
                id="sync_mode"
                v-model="formData.sync_mode"
                :options="syncModeOptions"
                option-label="label"
                option-value="value"
                class="w-64 shrink-0"
              />
            </div>
            <ul class="text-xs text-secondary-500 mt-3 ml-1 list-disc list-inside space-y-1">
              <li><strong>Factura directa (POS)</strong>: crea Invoice + pago. Sin guía de remisión.</li>
              <li><strong>Sales Order (web)</strong>: crea solo la Orden de Venta; NetSuite genera el despacho, la guía de remisión y la factura.</li>
            </ul>

            <!-- Custom Form del Sales Order (solo en modo sales_order) -->
            <div
              v-if="formData.sync_mode === 'sales_order'"
              class="mt-4 pt-4 border-t border-secondary-200"
            >
              <label for="so_custom_form_id" class="block text-sm font-medium text-secondary-700 mb-2">
                Custom Form ID del Sales Order
                <span class="text-secondary-400 text-xs">(opcional)</span>
              </label>
              <InputText
                id="so_custom_form_id"
                v-model="formData.so_custom_form_id"
                class="w-full md:w-64"
                placeholder="ej: 225"
              />
              <small class="text-secondary-600 mt-1 block">
                Custom Form de NetSuite para la Orden de Venta (ej: <code>225</code> = "PE Orden de Venta").
                Vacío = form por defecto de la cuenta.
              </small>
            </div>
          </div>

          <div class="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
            <div>
              <label for="stock_validation" class="font-medium text-secondary-800 cursor-pointer">
                Validación de Stock en NetSuite
              </label>
              <p class="text-sm text-secondary-600 mt-1">
                Validar disponibilidad de stock en NetSuite antes de confirmar ventas
              </p>
            </div>
            <InputSwitch
              id="stock_validation"
              v-model="stockValidationEnabled"
              :disabled="isTogglingStockValidation"
              @change="handleStockValidationToggle"
            />
          </div>

          <div class="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
            <div>
              <label for="estado" class="font-medium text-secondary-800 cursor-pointer">
                Estado
              </label>
              <p class="text-sm text-secondary-600 mt-1">
                Activar o desactivar las credenciales de NetSuite
              </p>
            </div>
            <InputSwitch
              id="estado"
              v-model="estadoBoolean"
            />
          </div>
        </div>
      </div>

      <!-- Mensajes de error -->
      <Message v-if="error" severity="error" :closable="false">
        {{ error }}
      </Message>

      <!-- Botones de acción -->
      <div class="flex gap-3 pt-4">
        <Button
          type="submit"
          :label="isEdit ? 'Actualizar credenciales' : 'Guardar credenciales'"
          icon="pi pi-save"
          :loading="isSaving"
          size="large"
        />
        <Button
          v-if="isEdit"
          type="button"
          label="Probar conexión"
          icon="pi pi-bolt"
          severity="info"
          outlined
          :loading="isTesting"
          @click="handleTest"
          size="large"
        />
        <Button
          v-if="isEdit && credentials"
          type="button"
          label="Eliminar"
          icon="pi pi-trash"
          severity="danger"
          outlined
          @click="handleDelete"
          size="large"
        />
      </div>
    </form>

    <!-- Location Dialog -->
    <Dialog
      v-model:visible="locationDialogVisible"
      header="Configuración NetSuite por sucursal"
      :modal="true"
      :closable="true"
      :style="{ width: '600px' }"
    >
      <div class="space-y-4 py-4">
        <!-- Branch Info (Read-only) -->
        <div class="p-4 bg-secondary-50 rounded-lg">
          <div class="text-sm">
            <p class="font-medium text-secondary-800 mb-1">Sucursal</p>
            <p class="text-secondary-700">{{ locationForm.branch_name }}</p>
            <p class="text-xs text-secondary-600 mt-1">{{ locationForm.branch_address }}</p>
          </div>
        </div>

        <!-- NetSuite Location ID -->
        <div>
          <label for="dialog_location_id" class="block text-sm font-medium text-secondary-700 mb-2">
            NetSuite Location ID <span class="text-red-500">*</span>
          </label>
          <InputText
            id="dialog_location_id"
            v-model="locationForm.netsuite_location_id"
            placeholder="323"
            class="w-full"
            :class="{ 'p-invalid': locationErrors.netsuite_location_id }"
          />
          <small v-if="locationErrors.netsuite_location_id" class="text-red-500">{{ locationErrors.netsuite_location_id }}</small>
          <small v-else class="text-secondary-600 mt-1 block">
            Inventario + ubicación para serie de facturación
          </small>
        </div>

        <Divider />
        <p class="text-xs text-secondary-600 -mt-2">
          Los siguientes campos son opcionales. Si los dejas vacíos, esta sucursal usa la configuración general de la tienda.
        </p>

        <!-- Serie Boleta override -->
        <div>
          <label for="dialog_serie_boleta" class="block text-sm font-medium text-secondary-700 mb-2">
            Serie Boleta
          </label>
          <Dropdown
            id="dialog_serie_boleta"
            v-model="locationForm.serie_boleta_netsuite_id"
            :options="boletaSerieOptions"
            option-label="label"
            option-value="value"
            class="w-full"
          />
          <small class="text-secondary-600 mt-1 block">
            <template v-if="locationForm.serie_boleta_netsuite_id">
              Esta sucursal usa una serie propia. Elige "Heredar de la tienda" para volver al default.
            </template>
            <template v-else>
              Hereda la serie boleta de la tienda. Elige otra solo si esta sucursal debe usar una distinta.
            </template>
            Se configuran en la pestaña <strong>Series</strong>.
          </small>
        </div>

        <!-- Serie Factura override -->
        <div>
          <label for="dialog_serie_factura" class="block text-sm font-medium text-secondary-700 mb-2">
            Serie Factura
          </label>
          <Dropdown
            id="dialog_serie_factura"
            v-model="locationForm.serie_factura_netsuite_id"
            :options="facturaSerieOptions"
            option-label="label"
            option-value="value"
            class="w-full"
          />
          <small class="text-secondary-600 mt-1 block">
            <template v-if="locationForm.serie_factura_netsuite_id">
              Esta sucursal usa una serie propia. Elige "Heredar de la tienda" para volver al default.
            </template>
            <template v-else>
              Hereda la serie factura de la tienda. Elige otra solo si esta sucursal debe usar una distinta.
            </template>
            Se configuran en la pestaña <strong>Series</strong>.
          </small>
        </div>

        <!-- Generic Customer override -->
        <div>
          <label for="dialog_generic_customer" class="block text-sm font-medium text-secondary-700 mb-2">
            Generic Customer ID
          </label>
          <InputText
            id="dialog_generic_customer"
            v-model="locationForm.generic_customer_id"
            :placeholder="branchesDefaults.generic_customer_id ? `Hereda: ${branchesDefaults.generic_customer_id}` : 'Sin valor de tienda'"
            class="w-full"
          />
          <small class="text-secondary-600 mt-1 block">
            Cliente genérico para ventas &lt; 700 sin DNI.
            <template v-if="locationForm.generic_customer_id">
              Override activo. Deja vacío para volver a heredar el de la tienda<template v-if="branchesDefaults.generic_customer_id"> ({{ branchesDefaults.generic_customer_id }})</template>.
            </template>
            <template v-else>
              Hereda de la tienda<template v-if="branchesDefaults.generic_customer_id">: <span class="font-mono font-medium text-secondary-700">{{ branchesDefaults.generic_customer_id }}</span></template>. Escribe un valor solo si esta sucursal debe usar otro.
            </template>
          </small>
        </div>
      </div>

      <template #footer>
        <div class="flex gap-2 justify-end">
          <Button
            label="Cancelar"
            severity="secondary"
            outlined
            @click="closeLocationDialog"
          />
          <Button
            label="Guardar"
            :loading="isSavingLocation"
            @click="saveLocationId"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { useNetsuite } from '@/composables/useNetsuite'
import { netsuiteApi } from '@/api/netsuite.api'
import type {
  SaveNetsuiteCredentialsRequest,
  NetsuiteLocation,
  NetsuiteConfigIssue,
  NetsuiteSerie,
} from '@/types/netsuite.types'

import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Password from 'primevue/password'
import InputSwitch from 'primevue/inputswitch'
import Dropdown from 'primevue/dropdown'
import Divider from 'primevue/divider'
import Message from 'primevue/message'
import Dialog from 'primevue/dialog'

const props = defineProps<{
  tiendaId: number | null
}>()

const emit = defineEmits<{
  (e: 'credentials-saved'): void
}>()

const toast = useToast()
const confirm = useConfirm()

const {
  isSaving,
  isTesting,
  error,
  credentials,
  getCredentials,
  saveCredentials,
  testConnection,
  deleteCredentials,
  clearError
} = useNetsuite()

const isEdit = ref(false)

// Stock validation toggle
const stockValidationEnabled = ref(false)
const isTogglingStockValidation = ref(false)

const formData = reactive<Partial<SaveNetsuiteCredentialsRequest>>({
  tienda_id: props.tiendaId || 0,
  account_id: '',
  consumer_key: '',
  consumer_secret: '',
  token_id: '',
  token_secret: '',
  subsidiary_id: '',
  location_id: '',
  ubicacion_serie_id: '',
  generic_customer_id: '',
  bonification_item_id: '',
  price_level_id: undefined,
  customer_category_id: '',
  // Required NetSuite IDs (no longer hardcoded in PHP)
  department_id: '',
  class_id: '',
  currency_id: '',
  country_id: '',
  terms_id: '',
  tax_item_id: '',
  edoc_standard_id: '',
  receivables_account_id: '',
  entity_status_id: '',
  payment_method_id: '',
  default_zip_id: '',
  discount_item_id: '',
  default_salesrep_id: '',
  autosync_enabled: false,
  delegate_billing: false,
  sync_mode: 'invoice_direct',
  so_custom_form_id: '',
  estado: 1
})

// Opciones del modo de sincronización con NetSuite.
const syncModeOptions = [
  { label: 'Factura directa (POS)', value: 'invoice_direct' },
  { label: 'Sales Order (web / guía de remisión)', value: 'sales_order' }
]

// Configuration validation report from /netsuite-config/validate.
const validationIssues = ref<NetsuiteConfigIssue[]>([])
const isValidating = ref(false)

const credentialsIssues = computed(() =>
  validationIssues.value.filter(i => i.category === 'credentials')
)

// Solo los críticos pintan los inputs en rojo. Warnings (aspiracionales)
// no marcan campos individuales.
const missingCredentialFields = computed(() => {
  const set = new Set<string>()
  for (const issue of credentialsIssues.value) {
    if (issue.severity === 'warning') continue
    if (issue.field) set.add(issue.field)
  }
  return set
})

const isFieldMissing = (column: string) => missingCredentialFields.value.has(column)

const criticalIssues = computed(() =>
  validationIssues.value.filter(i => (i.severity || 'critical') === 'critical')
)
const warningIssues = computed(() =>
  validationIssues.value.filter(i => i.severity === 'warning')
)

// Locations management
const locations = ref<NetsuiteLocation[]>([])
const locationDialogVisible = ref(false)
const editingLocationIndex = ref<number | null>(null)

// Branch-level overrides (series + generic customer per sucursal)
interface BranchConfig {
  tiendadireccion_id: number
  branch_name: string
  branch_address: string
  netsuite_location_id: string | null
  generic_customer_id: string | null
  generic_customer_is_override: boolean
  serie_boleta_netsuite_id: string | null
  serie_boleta_is_override: boolean
  serie_factura_netsuite_id: string | null
  serie_factura_is_override: boolean
}
const branchesConfig = ref<BranchConfig[]>([])
const branchesDefaults = reactive({
  generic_customer_id: null as string | null,
  serie_boleta_netsuite_id: null as string | null,
  serie_factura_netsuite_id: null as string | null,
})

function getBranchConfig(branchId: number | string): BranchConfig | undefined {
  const id = Number(branchId)
  return branchesConfig.value.find(b => Number(b.tiendadireccion_id) === id)
}

// Series configuradas de la tienda (pestaña Series) — sirven para el override
// por sucursal como opciones de un select en vez de teclear el ID de NetSuite.
const storeSeries = ref<NetsuiteSerie[]>([])

async function loadStoreSeries(tiendaId: number) {
  if (!tiendaId) { storeSeries.value = []; return }
  try {
    const response = await netsuiteApi.getSeries(tiendaId)
    storeSeries.value = response.data || []
  } catch (e) {
    storeSeries.value = []
  }
}

// Opciones del select de override de serie por sucursal. El primer item hereda
// de la tienda (value ''); luego las series mapeadas del tipo. Si el override
// actual apunta a un ID que ya no está en la lista, se agrega para no perderlo.
function serieOptions(tipo: 'BOLETA' | 'FACTURA', currentValue: string) {
  const heredaId = tipo === 'BOLETA'
    ? branchesDefaults.serie_boleta_netsuite_id
    : branchesDefaults.serie_factura_netsuite_id
  const options: Array<{ label: string; value: string }> = [
    { label: heredaId ? `Heredar de la tienda (${heredaId})` : 'Heredar de la tienda', value: '' },
  ]
  for (const s of storeSeries.value) {
    if (s.tiendaserieerp_tipo_documento === tipo && s.tiendaserieerp_netsuite_id) {
      options.push({
        label: `${s.tiendaserieerp_codigo} → ${s.tiendaserieerp_netsuite_id}`,
        value: String(s.tiendaserieerp_netsuite_id),
      })
    }
  }
  if (currentValue && !options.some(o => o.value === currentValue)) {
    options.push({ label: `${currentValue} (actual)`, value: currentValue })
  }
  return options
}

const boletaSerieOptions = computed(() =>
  serieOptions('BOLETA', locationForm.serie_boleta_netsuite_id)
)
const facturaSerieOptions = computed(() =>
  serieOptions('FACTURA', locationForm.serie_factura_netsuite_id)
)

const locationForm = reactive({
  tiendadireccion_id: 0,
  branch_name: '',
  branch_address: '',
  netsuite_location_id: '',
  serie_boleta_netsuite_id: '',
  serie_factura_netsuite_id: '',
  generic_customer_id: ''
})

const locationErrors = reactive({
  netsuite_location_id: ''
})

const isSavingLocation = ref(false)

const errors = reactive({
  account_id: '',
  consumer_key: '',
  consumer_secret: '',
  token_id: '',
  token_secret: ''
})

// Computed properties para convertir entre boolean y number
const estadoBoolean = computed({
  get: () => formData.estado === 1,
  set: (val: boolean) => { formData.estado = val ? 1 : 0 }
})

// Computed para verificar si existen secrets guardados
const hasConsumerSecret = computed(() => {
  return credentials.value?.tiendacredencialerp_consumer_secret_masked !== null &&
         credentials.value?.tiendacredencialerp_consumer_secret_masked !== undefined &&
         credentials.value?.tiendacredencialerp_consumer_secret_masked !== ''
})

const hasTokenSecret = computed(() => {
  return credentials.value?.tiendacredencialerp_token_secret_masked !== null &&
         credentials.value?.tiendacredencialerp_token_secret_masked !== undefined &&
         credentials.value?.tiendacredencialerp_token_secret_masked !== ''
})

// Watch tiendaId changes and load credentials
watch(() => props.tiendaId, async (tiendaId) => {
  if (!tiendaId) return

  clearError()
  const creds = await getCredentials(tiendaId)

  if (creds) {
    isEdit.value = true

    Object.assign(formData, {
      tienda_id: tiendaId,
      account_id: creds.tiendacredencialerp_account_id,
      consumer_key: creds.tiendacredencialerp_consumer_key,
      consumer_secret: '', // No cargar secrets
      token_id: creds.tiendacredencialerp_token_id,
      token_secret: '',
      subsidiary_id: creds.tiendacredencialerp_subsidiary_id || '',
      location_id: creds.tiendacredencialerp_location_id || '',
      ubicacion_serie_id: creds.tiendacredencialerp_ubicacion_serie_id || '',
      generic_customer_id: creds.tiendacredencialerp_generic_customer_id || '',
      bonification_item_id: creds.tiendacredencialerp_bonification_item_id || '',
      price_level_id: creds.tiendacredencialerp_price_level_id ?? undefined,
      customer_category_id: creds.tiendacredencialerp_customer_category_id || '',
      department_id: creds.tiendacredencialerp_department_id || '',
      class_id: creds.tiendacredencialerp_class_id || '',
      currency_id: creds.tiendacredencialerp_currency_id || '',
      country_id: creds.tiendacredencialerp_country_id || '',
      terms_id: creds.tiendacredencialerp_terms_id || '',
      tax_item_id: creds.tiendacredencialerp_tax_item_id || '',
      edoc_standard_id: creds.tiendacredencialerp_edoc_standard_id || '',
      receivables_account_id: creds.tiendacredencialerp_receivables_account_id || '',
      entity_status_id: creds.tiendacredencialerp_entity_status_id || '',
      payment_method_id: creds.tiendacredencialerp_payment_method_id || '',
      default_zip_id: creds.tiendacredencialerp_default_zip_id || '',
      discount_item_id: creds.tiendacredencialerp_discount_item_id || '',
      default_salesrep_id: creds.tiendacredencialerp_default_salesrep_id || '',
      autosync_enabled: Number(creds.tiendacredencialerp_autosync_enabled) === 1,
      delegate_billing: Number(creds.tiendacredencialerp_delegate_billing) === 1,
      sync_mode: creds.tiendacredencialerp_sync_mode || 'invoice_direct',
      so_custom_form_id: creds.tiendacredencialerp_so_custom_form_id || '',
      estado: Number(creds.tiendacredencialerp_estado)
    })

    // Load stock validation status
    stockValidationEnabled.value = !!creds.stock_validation_enabled
  } else {
    isEdit.value = false
    // Reset form
    Object.assign(formData, {
      tienda_id: tiendaId,
      account_id: '',
      consumer_key: '',
      consumer_secret: '',
      token_id: '',
      token_secret: '',
      subsidiary_id: '',
      location_id: '',
      ubicacion_serie_id: '',
      generic_customer_id: '',
      bonification_item_id: '',
      price_level_id: undefined,
      customer_category_id: '',
      department_id: '',
      class_id: '',
      currency_id: '',
      country_id: '',
      terms_id: '',
      tax_item_id: '',
      edoc_standard_id: '',
      receivables_account_id: '',
      entity_status_id: '',
      payment_method_id: '',
      default_zip_id: '',
      discount_item_id: '',
      default_salesrep_id: '',
      autosync_enabled: false,
      delegate_billing: false,
      sync_mode: 'invoice_direct',
      so_custom_form_id: '',
      estado: 1
    })
  }

  // Load locations and validation report
  await loadLocations(tiendaId)
  await loadBranchesConfig(tiendaId)
  await loadStoreSeries(tiendaId)
  await loadValidation(tiendaId)
}, { immediate: true })

async function loadValidation(tiendaId: number) {
  if (!tiendaId) return
  try {
    isValidating.value = true
    const response = await netsuiteApi.validateConfig(tiendaId)
    validationIssues.value = response.data?.issues || []
  } catch (e) {
    validationIssues.value = []
  } finally {
    isValidating.value = false
  }
}

async function loadBranchesConfig(tiendaId: number) {
  try {
    const response = await netsuiteApi.getBranchesConfig(tiendaId) as any
    if (response.success && response.data) {
      branchesConfig.value = response.data
      const d = response.defaults || {}
      branchesDefaults.generic_customer_id = d.generic_customer_id ?? null
      branchesDefaults.serie_boleta_netsuite_id = d.serie_boleta_netsuite_id ?? null
      branchesDefaults.serie_factura_netsuite_id = d.serie_factura_netsuite_id ?? null
    } else {
      branchesConfig.value = []
    }
  } catch (error) {
    console.error('[NetsuiteCredentials] Error loading branches config:', error)
    branchesConfig.value = []
  }
}

// Load branches with their NetSuite location IDs
const isLoadingLocations = ref(false)
async function loadLocations(tiendaId: number) {
  if (!tiendaId) return

  try {
    isLoadingLocations.value = true
    const response = await netsuiteApi.getLocations(tiendaId)

    if (response.success && response.data) {
      locations.value = response.data
    } else {
      locations.value = []
    }
  } catch (error: any) {
    console.error('[NetsuiteCredentials] Error loading branches:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudieron cargar las sucursales',
      life: 3000
    })
    locations.value = []
  } finally {
    isLoadingLocations.value = false
  }
}

// Location dialog functions
function openLocationDialog(index: number) {
  editingLocationIndex.value = index
  const branch = locations.value[index]
  const config = getBranchConfig(branch.tiendadireccion_id)

  Object.assign(locationForm, {
    tiendadireccion_id: branch.tiendadireccion_id,
    branch_name: branch.branch_name,
    branch_address: branch.branch_address,
    netsuite_location_id: branch.netsuite_location_id || '',
    serie_boleta_netsuite_id: config?.serie_boleta_is_override ? (config.serie_boleta_netsuite_id || '') : '',
    serie_factura_netsuite_id: config?.serie_factura_is_override ? (config.serie_factura_netsuite_id || '') : '',
    generic_customer_id: config?.generic_customer_is_override ? (config.generic_customer_id || '') : ''
  })

  // Clear errors
  locationErrors.netsuite_location_id = ''
  locationDialogVisible.value = true
}

function closeLocationDialog() {
  locationDialogVisible.value = false
  editingLocationIndex.value = null
}

function validateLocationForm(): boolean {
  locationErrors.netsuite_location_id = ''

  if (!locationForm.netsuite_location_id.trim()) {
    locationErrors.netsuite_location_id = 'NetSuite Location ID es obligatorio'
    return false
  }

  return true
}

async function saveLocationId() {
  if (!validateLocationForm()) return
  if (!props.tiendaId) return

  try {
    isSavingLocation.value = true

    // 1. Location ID (siempre actualiza)
    const locResponse = await netsuiteApi.updateBranchLocation(
      locationForm.tiendadireccion_id,
      { netsuite_location_id: locationForm.netsuite_location_id.trim() }
    )

    if (!locResponse.success) {
      throw new Error(locResponse.message || 'No se pudo actualizar el Location ID')
    }

    // 2. Overrides (series + generic customer). Cadena vacía => null borra el override.
    const cfgResponse = await netsuiteApi.updateBranchConfig(
      props.tiendaId,
      locationForm.tiendadireccion_id,
      {
        serie_boleta_netsuite_id: locationForm.serie_boleta_netsuite_id.trim() || null,
        serie_factura_netsuite_id: locationForm.serie_factura_netsuite_id.trim() || null,
        generic_customer_id: locationForm.generic_customer_id.trim() || null,
      }
    )

    if (!cfgResponse.success) {
      throw new Error('No se pudieron guardar los overrides de la sucursal')
    }

    toast.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Configuración de sucursal guardada',
      life: 3000
    })

    // Update local state
    if (editingLocationIndex.value !== null) {
      locations.value[editingLocationIndex.value].netsuite_location_id = locationForm.netsuite_location_id.trim()
    }
    await loadBranchesConfig(props.tiendaId)

    closeLocationDialog()
  } catch (error: any) {
    console.error('[NetsuiteCredentials] Error saving branch config:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || error.message || 'Error al guardar la configuración',
      life: 3000
    })
  } finally {
    isSavingLocation.value = false
  }
}

function validateForm(): boolean {
  // Clear previous errors
  Object.keys(errors).forEach(key => {
    errors[key as keyof typeof errors] = ''
  })

  let valid = true

  if (!formData.account_id?.trim()) {
    errors.account_id = 'Account ID es obligatorio'
    valid = false
  }

  if (!formData.consumer_key?.trim()) {
    errors.consumer_key = 'Consumer Key es obligatorio'
    valid = false
  }

  if (!isEdit.value && !formData.consumer_secret?.trim()) {
    errors.consumer_secret = 'Consumer Secret es obligatorio'
    valid = false
  }

  if (!formData.token_id?.trim()) {
    errors.token_id = 'Token ID es obligatorio'
    valid = false
  }

  if (!isEdit.value && !formData.token_secret?.trim()) {
    errors.token_secret = 'Token Secret es obligatorio'
    valid = false
  }

  return valid
}

async function handleSubmit() {
  if (!validateForm()) return
  if (!props.tiendaId) {
    toast.add({
      severity: 'warn',
      summary: 'Advertencia',
      detail: 'Seleccione una tienda',
      life: 3000
    })
    return
  }

  clearError()

  // Get default location_id for backward compatibility
  const defaultLocation = locations.value.find(loc => loc.is_default)
  const legacyLocationId = defaultLocation?.netsuite_location_id || formData.location_id

  // Preparar payload — incluir todos los IDs (vacío = null para borrarlos).
  const stringOrNull = (value: unknown): string | undefined => {
    if (value === undefined) return undefined
    const trimmed = String(value ?? '').trim()
    return trimmed === '' ? undefined : trimmed
  }

  const payload: SaveNetsuiteCredentialsRequest = {
    tienda_id: props.tiendaId,
    account_id: formData.account_id!,
    consumer_key: formData.consumer_key!,
    token_id: formData.token_id!,
    subsidiary_id: stringOrNull(formData.subsidiary_id),
    location_id: legacyLocationId,
    ubicacion_serie_id: stringOrNull(formData.ubicacion_serie_id),
    generic_customer_id: stringOrNull(formData.generic_customer_id),
    bonification_item_id: stringOrNull(formData.bonification_item_id),
    price_level_id: formData.price_level_id ?? undefined,
    customer_category_id: stringOrNull(formData.customer_category_id),
    department_id: stringOrNull(formData.department_id),
    class_id: stringOrNull(formData.class_id),
    currency_id: stringOrNull(formData.currency_id),
    country_id: stringOrNull(formData.country_id),
    terms_id: stringOrNull(formData.terms_id),
    tax_item_id: stringOrNull(formData.tax_item_id),
    edoc_standard_id: stringOrNull(formData.edoc_standard_id),
    receivables_account_id: stringOrNull(formData.receivables_account_id),
    entity_status_id: stringOrNull(formData.entity_status_id),
    payment_method_id: stringOrNull(formData.payment_method_id),
    default_zip_id: stringOrNull(formData.default_zip_id),
    discount_item_id: stringOrNull(formData.discount_item_id),
    default_salesrep_id: stringOrNull(formData.default_salesrep_id),
    autosync_enabled: formData.autosync_enabled || false,
    delegate_billing: formData.delegate_billing || false,
    sync_mode: formData.sync_mode || 'invoice_direct',
    so_custom_form_id: stringOrNull(formData.so_custom_form_id) ?? null,
    estado: formData.estado || 1,
    locations: locations.value.length > 0 ? locations.value : undefined
  }

  // Solo incluir secrets si se proporcionaron
  if (formData.consumer_secret?.trim()) {
    payload.consumer_secret = formData.consumer_secret
  }
  if (formData.token_secret?.trim()) {
    payload.token_secret = formData.token_secret
  }

  const result = await saveCredentials(payload)

  if (result.success) {
    toast.add({
      severity: 'success',
      summary: 'Éxito',
      detail: isEdit.value ? 'Credenciales actualizadas' : 'Credenciales guardadas',
      life: 3000
    })
    emit('credentials-saved')
    // Re-run the validator so the banner reflects the new state immediately.
    await loadValidation(props.tiendaId)
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: result.error || 'No se pudieron guardar las credenciales',
      life: 5000
    })
  }
}

async function handleTest() {
  if (!props.tiendaId) {
    toast.add({
      severity: 'warn',
      summary: 'Advertencia',
      detail: 'Seleccione una tienda',
      life: 3000
    })
    return
  }

  clearError()

  const result = await testConnection(props.tiendaId)

  if (result.success && result.data) {
    toast.add({
      severity: 'success',
      summary: 'Conexión exitosa',
      detail: `Conectado a cuenta ${result.data.account_id}`,
      life: 3000
    })
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error de conexión',
      detail: result.error || 'No se pudo conectar con NetSuite',
      life: 5000
    })
  }
}

async function handleStockValidationToggle() {
  if (!props.tiendaId) return

  try {
    isTogglingStockValidation.value = true
    const response = await netsuiteApi.updateStockValidation(props.tiendaId, stockValidationEnabled.value)

    if (response.success) {
      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: stockValidationEnabled.value
          ? 'Validación de stock NetSuite habilitada'
          : 'Validación de stock NetSuite deshabilitada',
        life: 3000
      })
    } else {
      // Revert toggle on error
      stockValidationEnabled.value = !stockValidationEnabled.value
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo actualizar la configuración',
        life: 3000
      })
    }
  } catch (error: any) {
    // Revert toggle on error
    stockValidationEnabled.value = !stockValidationEnabled.value
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Error al actualizar configuración',
      life: 3000
    })
  } finally {
    isTogglingStockValidation.value = false
  }
}

function handleDelete() {
  if (!credentials.value) return

  confirm.require({
    message: '¿Estás seguro de eliminar las credenciales de NetSuite?',
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, eliminar',
    rejectLabel: 'Cancelar',
    accept: async () => {
      const result = await deleteCredentials(credentials.value!.tiendacredencialerp_id)

      if (result.success) {
        toast.add({
          severity: 'success',
          summary: 'Eliminadas',
          detail: 'Credenciales eliminadas exitosamente',
          life: 3000
        })
        isEdit.value = false
        locations.value = []
        // Reset form
        Object.assign(formData, {
          account_id: '',
          consumer_key: '',
          consumer_secret: '',
          token_id: '',
          token_secret: '',
          subsidiary_id: '',
          location_id: '',
          ubicacion_serie_id: '',
          autosync_enabled: false,
          estado: 1
        })
      } else {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: result.error || 'No se pudieron eliminar las credenciales',
          life: 5000
        })
      }
    }
  })
}
</script>

<style scoped>
:deep(.p-inputtext),
:deep(.p-password input) {
  border: 1px solid #d1d5db !important;
}
</style>
