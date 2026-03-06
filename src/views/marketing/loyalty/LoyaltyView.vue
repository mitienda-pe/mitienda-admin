<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-3xl font-bold text-secondary">Programa de Fidelización</h1>
        <p class="text-sm text-secondary-500 mt-1">Configura y gestiona tu programa de sellos o puntos</p>
      </div>
    </div>

    <!-- Tabs -->
    <TabView v-model:activeIndex="activeTab" class="loyalty-tabs">
      <!-- Tab 1: Configuración -->
      <TabPanel header="Configuración">
        <div v-if="store.isLoadingProgram" class="flex justify-center py-20">
          <ProgressSpinner />
        </div>
        <div v-else class="space-y-6 mt-4">
          <!-- Activar/Desactivar -->
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-semibold text-secondary">Estado del programa</h3>
                <p class="text-sm text-secondary-500 mt-1">Activa o desactiva el programa para tus clientes</p>
              </div>
              <InputSwitch v-model="form.is_active" />
            </div>
          </div>

          <!-- Modalidad -->
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-secondary mb-4">Modalidad del programa</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                class="border-2 rounded-lg p-4 cursor-pointer transition-all"
                :class="form.type === 'stamps' ? 'border-primary bg-primary-50' : 'border-secondary-200 hover:border-secondary-300'"
                @click="form.type = 'stamps'"
              >
                <div class="flex items-center gap-3 mb-2">
                  <i class="pi pi-star-fill text-2xl" :class="form.type === 'stamps' ? 'text-primary' : 'text-secondary-400'"></i>
                  <span class="font-semibold text-secondary">Tarjeta de sellos</span>
                </div>
                <p class="text-sm text-secondary-500">
                  Cada compra = 1 sello. Al completar la tarjeta, el cliente recibe un cupón de descuento automático.
                </p>
              </div>
              <div
                class="border-2 rounded-lg p-4 cursor-pointer transition-all"
                :class="form.type === 'points' ? 'border-primary bg-primary-50' : 'border-secondary-200 hover:border-secondary-300'"
                @click="form.type = 'points'"
              >
                <div class="flex items-center gap-3 mb-2">
                  <i class="pi pi-bolt text-2xl" :class="form.type === 'points' ? 'text-primary' : 'text-secondary-400'"></i>
                  <span class="font-semibold text-secondary">Puntos</span>
                </div>
                <p class="text-sm text-secondary-500">
                  Los clientes acumulan puntos por cada sol gastado y los usan como método de pago directo en el checkout.
                </p>
              </div>
            </div>
          </div>

          <!-- Parámetros comunes -->
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-secondary mb-4">Parámetros generales</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-secondary-700 mb-1">Monto mínimo de compra (S/)</label>
                <InputNumber v-model="form.min_order_amount" :min="0" :maxFractionDigits="2" mode="decimal" class="w-full" />
                <p class="text-xs text-secondary-400 mt-1">Compra mínima para que cuente en el programa</p>
              </div>
            </div>
          </div>

          <!-- Parámetros de sellos -->
          <div v-if="form.type === 'stamps'" class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-secondary mb-4">Configuración de sellos</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-secondary-700 mb-1">Sellos para completar tarjeta</label>
                <InputNumber v-model="form.stamps_required" :min="2" :max="50" class="w-full" />
              </div>
              <div>
                <label class="block text-sm font-medium text-secondary-700 mb-1">Valor del cupón generado (S/)</label>
                <InputNumber v-model="form.stamp_reward_amount" :min="1" :maxFractionDigits="2" mode="decimal" class="w-full" />
              </div>
              <div>
                <label class="block text-sm font-medium text-secondary-700 mb-1">Vigencia del cupón (días)</label>
                <InputNumber v-model="form.coupon_expiry_days" :min="1" :max="365" class="w-full" />
              </div>
            </div>
            <!-- Preview tarjeta -->
            <div class="mt-6 p-4 bg-secondary-50 rounded-lg">
              <p class="text-sm text-secondary-600">
                <strong>Vista previa:</strong> Tus clientes necesitarán <strong>{{ form.stamps_required }}</strong> compras
                de S/ {{ form.min_order_amount?.toFixed(2) || '0.00' }} o más para ganar un cupón de
                <strong>S/ {{ form.stamp_reward_amount?.toFixed(2) || '0.00' }}</strong>
                (válido por {{ form.coupon_expiry_days }} días).
              </p>
            </div>
          </div>

          <!-- Parámetros de puntos -->
          <div v-if="form.type === 'points'" class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-secondary mb-4">Configuración de puntos</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-secondary-700 mb-1">Puntos por sol gastado</label>
                <InputNumber v-model="form.points_per_sol" :min="0.01" :maxFractionDigits="4" mode="decimal" class="w-full" />
                <p class="text-xs text-secondary-400 mt-1">Ej: 5 = S/50 genera 250 puntos</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-secondary-700 mb-1">Valor de cada punto (S/)</label>
                <InputNumber v-model="form.point_value_soles" :min="0.001" :maxFractionDigits="4" mode="decimal" class="w-full" />
                <p class="text-xs text-secondary-400 mt-1">Ej: 0.20 = 250 pts valen S/50</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-secondary-700 mb-1">Mínimo de puntos para pagar</label>
                <InputNumber v-model="form.min_points_to_pay" :min="1" class="w-full" />
                <p class="text-xs text-secondary-400 mt-1">Puntos mínimos para habilitar pago en checkout</p>
              </div>
            </div>
            <!-- Preview puntos -->
            <div v-if="form.points_per_sol && form.point_value_soles" class="mt-6 p-4 bg-secondary-50 rounded-lg">
              <p class="text-sm text-secondary-600">
                <strong>Ejemplo:</strong> Una compra de <strong>S/ 50.00</strong> genera
                <strong>{{ Math.floor(50 * (form.points_per_sol || 0)) }} puntos</strong>,
                equivalentes a <strong>S/ {{ (Math.floor(50 * (form.points_per_sol || 0)) * (form.point_value_soles || 0)).toFixed(2) }}</strong>
                de descuento en una compra futura.
              </p>
            </div>
          </div>

          <!-- Botón guía contable -->
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <i class="pi pi-chart-bar text-primary text-xl"></i>
                <div>
                  <h3 class="text-lg font-semibold text-secondary">Contabilidad y facturación</h3>
                  <p class="text-sm text-secondary-500">Guía completa para tu contador sobre cómo registrar el programa</p>
                </div>
              </div>
              <Button
                label="Ver guía"
                icon="pi pi-book"
                outlined
                @click="showAccountingDrawer = true"
              />
            </div>
          </div>

          <!-- Guardar -->
          <div class="flex justify-end">
            <Button
              label="Guardar configuración"
              icon="pi pi-save"
              :loading="store.isSavingProgram"
              @click="saveConfig"
            />
          </div>
        </div>
      </TabPanel>

      <!-- Tab 2: Dashboard -->
      <TabPanel header="Dashboard">
        <div v-if="store.isLoadingDashboard" class="flex justify-center py-20">
          <ProgressSpinner />
        </div>
        <div v-else-if="store.dashboard" class="space-y-6 mt-4">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-white rounded-lg shadow p-5">
              <p class="text-sm text-secondary-500">Clientes activos</p>
              <p class="text-3xl font-bold text-secondary mt-1">{{ formatNumber(store.dashboard.active_customers) }}</p>
            </div>
            <div class="bg-white rounded-lg shadow p-5">
              <p class="text-sm text-secondary-500">{{ program?.type === 'stamps' ? 'Sellos' : 'Puntos' }} emitidos (30 días)</p>
              <p class="text-3xl font-bold text-secondary mt-1">{{ formatNumber(parseFloat(store.dashboard.earned_last_30days)) }}</p>
            </div>
            <div class="bg-white rounded-lg shadow p-5">
              <p class="text-sm text-secondary-500">Total canjeado</p>
              <p class="text-3xl font-bold text-secondary mt-1">{{ formatNumber(parseFloat(store.dashboard.total_redeemed)) }}</p>
            </div>
            <div class="bg-white rounded-lg shadow p-5">
              <p class="text-sm text-secondary-500">Pasivo estimado</p>
              <p class="text-3xl font-bold text-primary mt-1">S/ {{ store.dashboard.liability_soles }}</p>
              <p class="text-xs text-secondary-400 mt-1">{{ formatNumber(parseFloat(store.dashboard.total_liability)) }} {{ program?.type === 'stamps' ? 'sellos' : 'puntos' }}</p>
            </div>
          </div>

          <div v-if="program?.type === 'stamps'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-white rounded-lg shadow p-5">
              <p class="text-sm text-secondary-500">Recompensas emitidas</p>
              <p class="text-3xl font-bold text-secondary mt-1">{{ store.dashboard.rewards_issued }}</p>
            </div>
            <div class="bg-white rounded-lg shadow p-5">
              <p class="text-sm text-secondary-500">Cupones usados</p>
              <p class="text-3xl font-bold text-secondary mt-1">{{ store.dashboard.rewards_used }}</p>
            </div>
          </div>
        </div>
        <div v-else class="bg-white rounded-lg shadow p-12 text-center mt-4">
          <i class="pi pi-chart-bar text-6xl text-secondary-300 mb-4 block"></i>
          <h3 class="text-xl font-semibold text-secondary">No hay datos aún</h3>
          <p class="text-sm text-secondary-500 mt-2">Activa el programa para empezar a ver estadísticas</p>
        </div>
      </TabPanel>

      <!-- Tab 3: Clientes -->
      <TabPanel header="Clientes">
        <div class="space-y-4 mt-4">
          <!-- Search -->
          <div class="bg-white rounded-lg shadow p-4">
            <div class="flex gap-3">
              <span class="p-input-icon-left flex-1">
                <i class="pi pi-search" />
                <InputText
                  v-model="customerSearch"
                  placeholder="Buscar por nombre o email..."
                  class="w-full"
                  @keyup.enter="searchCustomers"
                />
              </span>
              <Button label="Buscar" icon="pi pi-search" @click="searchCustomers" />
            </div>
          </div>

          <!-- Loading -->
          <div v-if="store.isLoadingCustomers" class="flex justify-center py-12">
            <ProgressSpinner />
          </div>

          <!-- Table -->
          <div v-else-if="store.customers.length > 0" class="bg-white rounded-lg shadow overflow-hidden">
            <DataTable :value="store.customers" :rows="20" responsiveLayout="scroll">
              <Column header="Cliente">
                <template #body="{ data }">
                  <div>
                    <p class="font-medium text-secondary">{{ data.tiendacliente_nombres }} {{ data.tiendacliente_apellidos }}</p>
                    <p class="text-xs text-secondary-400">{{ data.tiendacliente_correo_electronico }}</p>
                  </div>
                </template>
              </Column>
              <Column header="Saldo disponible" class="text-right">
                <template #body="{ data }">
                  <span class="font-semibold text-secondary">{{ formatNumber(parseFloat(data.balance_available)) }}</span>
                  <span class="text-xs text-secondary-400 ml-1">{{ program?.type === 'stamps' ? 'sellos' : 'pts' }}</span>
                </template>
              </Column>
              <Column header="Reservado" class="text-right">
                <template #body="{ data }">
                  <span v-if="parseFloat(data.balance_reserved) > 0" class="text-yellow-600 font-medium">
                    {{ formatNumber(parseFloat(data.balance_reserved)) }}
                  </span>
                  <span v-else class="text-secondary-300">—</span>
                </template>
              </Column>
              <Column header="Acciones" :style="{ width: '120px' }">
                <template #body="{ data }">
                  <Button
                    icon="pi pi-eye"
                    text
                    rounded
                    severity="secondary"
                    v-tooltip="'Ver detalle'"
                    @click="openCustomerDetail(data)"
                  />
                  <Button
                    icon="pi pi-pencil"
                    text
                    rounded
                    severity="secondary"
                    v-tooltip="'Ajuste manual'"
                    @click="openCorrectionDialog(data)"
                  />
                </template>
              </Column>
            </DataTable>

            <!-- Pagination -->
            <div v-if="store.customersPagination.pages > 1" class="flex justify-center p-4 border-t border-secondary-100">
              <Paginator
                :rows="store.customersPagination.per_page"
                :totalRecords="store.customersPagination.total"
                :first="(store.customersPagination.page - 1) * store.customersPagination.per_page"
                @page="onCustomerPageChange"
              />
            </div>
          </div>

          <!-- Empty -->
          <div v-else class="bg-white rounded-lg shadow p-12 text-center">
            <i class="pi pi-users text-6xl text-secondary-300 mb-4 block"></i>
            <h3 class="text-xl font-semibold text-secondary">No hay clientes en el programa</h3>
            <p class="text-sm text-secondary-500 mt-2">Los clientes aparecerán aquí cuando realicen compras con el programa activo</p>
          </div>
        </div>
      </TabPanel>
    </TabView>

    <!-- Dialog: Detalle cliente -->
    <Dialog v-model:visible="showCustomerDetail" header="Detalle del cliente" :modal="true" :style="{ width: '700px' }">
      <div v-if="store.isLoadingCustomerDetail" class="flex justify-center py-8">
        <ProgressSpinner />
      </div>
      <div v-else-if="selectedCustomer" class="space-y-4">
        <!-- Info -->
        <div class="flex items-center justify-between bg-secondary-50 rounded-lg p-4">
          <div>
            <p class="font-semibold text-secondary">{{ selectedCustomer.tiendacliente_nombres }} {{ selectedCustomer.tiendacliente_apellidos }}</p>
            <p class="text-sm text-secondary-500">{{ selectedCustomer.tiendacliente_correo_electronico }}</p>
          </div>
          <div class="text-right">
            <p class="text-2xl font-bold text-primary">{{ formatNumber(parseFloat(selectedCustomer.balance_available)) }}</p>
            <p class="text-xs text-secondary-500">{{ program?.type === 'stamps' ? 'sellos' : 'puntos' }} disponibles</p>
          </div>
        </div>

        <!-- History -->
        <h4 class="font-semibold text-secondary">Historial de movimientos</h4>
        <div v-if="store.customerHistory.length > 0" class="max-h-80 overflow-y-auto">
          <div
            v-for="entry in store.customerHistory"
            :key="entry.id"
            class="flex items-center justify-between py-3 px-2 border-b border-secondary-100 last:border-0"
          >
            <div class="flex items-center gap-3">
              <i
                :class="entryIcon(entry.type)"
                class="text-lg"
                :style="{ color: entryColor(entry.type) }"
              ></i>
              <div>
                <p class="text-sm font-medium text-secondary">{{ entryLabel(entry.type) }}</p>
                <p class="text-xs text-secondary-400">{{ entry.reference }}</p>
                <p v-if="entry.note" class="text-xs text-secondary-400 italic">{{ entry.note }}</p>
              </div>
            </div>
            <div class="text-right">
              <p v-if="parseFloat(entry.credit) > 0" class="text-sm font-semibold text-green-600">+{{ formatNumber(parseFloat(entry.credit)) }}</p>
              <p v-if="parseFloat(entry.debit) > 0" class="text-sm font-semibold text-red-600">-{{ formatNumber(parseFloat(entry.debit)) }}</p>
              <p v-if="parseFloat(entry.credit) === 0 && parseFloat(entry.debit) === 0" class="text-sm text-secondary-400">0</p>
              <p class="text-xs text-secondary-400">{{ formatDate(entry.created_at) }}</p>
            </div>
          </div>
        </div>
        <p v-else class="text-sm text-secondary-400 text-center py-4">Sin movimientos</p>

        <!-- Integrity check -->
        <div class="flex items-center justify-between pt-2 border-t border-secondary-100">
          <Button label="Verificar integridad" icon="pi pi-shield" text size="small" @click="checkIntegrity" />
          <div v-if="store.integrityResult">
            <Tag v-if="store.integrityResult.valid" severity="success" value="Cadena íntegra" icon="pi pi-check" />
            <Tag v-else severity="danger" :value="`Error en entrada #${store.integrityResult.broken_at_entry_id}`" icon="pi pi-times" />
          </div>
        </div>
      </div>
    </Dialog>

    <!-- Dialog: Corrección manual -->
    <Dialog v-model:visible="showCorrectionDialog" header="Ajuste manual" :modal="true" :style="{ width: '450px' }">
      <div class="space-y-4">
        <Message severity="info" :closable="false" class="text-xs">
          Los ajustes manuales quedan registrados en el ledger con tu ID de administrador.
        </Message>

        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-1">Tipo de ajuste</label>
          <div class="flex gap-3">
            <div
              class="flex-1 border-2 rounded-lg p-3 cursor-pointer text-center transition-all"
              :class="correctionType === 'credit' ? 'border-green-500 bg-green-50' : 'border-secondary-200'"
              @click="correctionType = 'credit'"
            >
              <i class="pi pi-plus-circle text-xl" :class="correctionType === 'credit' ? 'text-green-600' : 'text-secondary-400'"></i>
              <p class="text-sm font-medium mt-1">Agregar</p>
            </div>
            <div
              class="flex-1 border-2 rounded-lg p-3 cursor-pointer text-center transition-all"
              :class="correctionType === 'debit' ? 'border-red-500 bg-red-50' : 'border-secondary-200'"
              @click="correctionType = 'debit'"
            >
              <i class="pi pi-minus-circle text-xl" :class="correctionType === 'debit' ? 'text-red-600' : 'text-secondary-400'"></i>
              <p class="text-sm font-medium mt-1">Quitar</p>
            </div>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-1">Cantidad</label>
          <InputNumber v-model="correctionAmount" :min="1" class="w-full" />
        </div>

        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-1">Nota (obligatoria)</label>
          <Textarea v-model="correctionNote" rows="3" class="w-full" placeholder="Motivo del ajuste..." />
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" text @click="showCorrectionDialog = false" />
        <Button
          label="Aplicar ajuste"
          icon="pi pi-check"
          :loading="isSavingCorrection"
          :disabled="!correctionNote || correctionNote.length < 5 || !correctionAmount"
          @click="submitCorrection"
        />
      </template>
    </Dialog>

    <!-- Drawer: Guía contable y facturación -->
    <Sidebar v-model:visible="showAccountingDrawer" position="right" class="w-full md:w-[560px]">
      <template #header>
        <div class="flex items-center gap-3">
          <i class="pi pi-book text-primary text-xl"></i>
          <span class="text-lg font-semibold text-secondary">Contabilidad y Facturación</span>
        </div>
      </template>

      <div class="space-y-6 text-sm text-secondary-700 leading-relaxed">
        <!-- Intro -->
        <Message severity="warn" :closable="false">
          MiTienda provee la infraestructura y los datos del programa. El registro contable y la responsabilidad tributaria son de tu empresa. Comparte esta guía con tu contador antes de activar el módulo.
        </Message>

        <!-- Modelo recomendado -->
        <section>
          <h3 class="text-base font-semibold text-secondary mb-2">Modelo recomendado: Pasivo Diferido (NIIF 15)</h3>
          <p class="mb-3">
            Cuando tu tienda acumula y canjea puntos, creas una <strong>obligación económica con tus clientes</strong>.
            El modelo de Pasivo Diferido es el más preciso y auditable.
          </p>
          <div class="overflow-x-auto">
            <table class="w-full text-xs border border-secondary-200 rounded">
              <thead class="bg-secondary-50">
                <tr>
                  <th class="text-left p-2 border-b border-secondary-200">Modelo</th>
                  <th class="text-left p-2 border-b border-secondary-200">Descripción</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="p-2 border-b border-secondary-100">Descuento directo</td>
                  <td class="p-2 border-b border-secondary-100 text-secondary-500">Distorsiona el revenue. Puede alertar a SUNAT.</td>
                </tr>
                <tr>
                  <td class="p-2 border-b border-secondary-100">Gasto de marketing</td>
                  <td class="p-2 border-b border-secondary-100 text-secondary-500">Sobreestima gastos. No refleja breakage.</td>
                </tr>
                <tr class="bg-primary-50">
                  <td class="p-2 font-medium">Pasivo diferido ✓</td>
                  <td class="p-2">Porción del ingreso se difiere al emitir y se reconoce al canjear.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Puntos -->
        <section v-if="form.type === 'points' || !store.program">
          <h3 class="text-base font-semibold text-secondary mb-3">Modalidad Puntos — Ejemplos</h3>

          <!-- Caso 1 -->
          <div class="bg-secondary-50 rounded-lg p-4 mb-3">
            <p class="font-medium text-secondary mb-2">Caso 1: Cliente compra S/ 50.00 y gana {{ Math.floor(50 * (form.points_per_sol || 5)) }} puntos</p>
            <div class="font-mono text-xs space-y-1 text-secondary-600">
              <p>Dr. Caja / Yape ............... 50.00</p>
              <p>&nbsp;&nbsp;Cr. Ventas (4100) ........... {{ (50 / 1.18).toFixed(2) }}</p>
              <p>&nbsp;&nbsp;Cr. IGV por pagar (4011) .... {{ (50 - 50 / 1.18).toFixed(2) }}</p>
              <p>&nbsp;&nbsp;Cr. Pasivo 2311 ............. {{ pointsLiabilityExample }}</p>
              <p>Dr. Ventas (4100) ajuste ..... {{ pointsLiabilityExample }}</p>
            </div>
            <p class="text-xs text-secondary-500 mt-2">Reclasificación de Ventas a Pasivo 2311. El IGV no cambia.</p>
          </div>

          <!-- Caso 2 -->
          <div class="bg-secondary-50 rounded-lg p-4 mb-3">
            <p class="font-medium text-secondary mb-2">Caso 2: Pago total con puntos ({{ Math.floor(50 * (form.points_per_sol || 5)) }} pts = S/ 50.00)</p>
            <div class="font-mono text-xs space-y-1 text-secondary-600">
              <p>Dr. Pasivo 2311 .............. 50.00</p>
              <p>&nbsp;&nbsp;Cr. Ventas (4100) ........... {{ (50 / 1.18).toFixed(2) }}</p>
              <p>&nbsp;&nbsp;Cr. IGV por pagar (4011) .... {{ (50 - 50 / 1.18).toFixed(2) }}</p>
            </div>
            <Message severity="warn" :closable="false" class="mt-2 text-xs">
              El IGV aplica aunque el cliente pague con puntos. SUNAT grava el valor del bien, no el medio de pago.
            </Message>
          </div>

          <!-- Caso 3 -->
          <div class="bg-secondary-50 rounded-lg p-4 mb-3">
            <p class="font-medium text-secondary mb-2">Caso 3: Pago mixto — 100 pts (S/ 20.00) + S/ 30.00 Yape</p>
            <div class="font-mono text-xs space-y-1 text-secondary-600">
              <p>Dr. Caja / Yape .............. 30.00</p>
              <p>Dr. Pasivo 2311 .............. 20.00</p>
              <p>&nbsp;&nbsp;Cr. Ventas (4100) ........... {{ (50 / 1.18).toFixed(2) }}</p>
              <p>&nbsp;&nbsp;Cr. IGV por pagar (4011) .... {{ (50 - 50 / 1.18).toFixed(2) }}</p>
            </div>
          </div>

          <!-- Caso 4 -->
          <div class="bg-secondary-50 rounded-lg p-4">
            <p class="font-medium text-secondary mb-2">Caso 4: Reembolso de pedido pagado con puntos</p>
            <div class="font-mono text-xs space-y-1 text-secondary-600">
              <p>Dr. Ventas (4100) ............ {{ (50 / 1.18).toFixed(2) }}</p>
              <p>Dr. IGV por pagar (4011) ..... {{ (50 - 50 / 1.18).toFixed(2) }}</p>
              <p>&nbsp;&nbsp;Cr. Pasivo 2311 ............. 50.00</p>
            </div>
            <p class="text-xs text-secondary-500 mt-2">Los puntos regresan al wallet del cliente automáticamente.</p>
          </div>
        </section>

        <!-- Sellos -->
        <section v-if="form.type === 'stamps' || !store.program">
          <h3 class="text-base font-semibold text-secondary mb-3">Modalidad Sellos — Ejemplos</h3>

          <div class="bg-secondary-50 rounded-lg p-4 mb-3">
            <p class="font-medium text-secondary mb-2">Al emitir el cupón (tarjeta completada)</p>
            <p class="text-secondary-600">No hay asiento contable. Se registra como pasivo contingente en notas a los EEFF.</p>
          </div>

          <div class="bg-secondary-50 rounded-lg p-4">
            <p class="font-medium text-secondary mb-2">Al usar el cupón en compra de S/ 40.00 (descuento S/ 15.00)</p>
            <div class="font-mono text-xs space-y-1 text-secondary-600">
              <p>Dr. Caja / Yape .............. 25.00</p>
              <p>Dr. Gasto promo (6310) ....... 12.71</p>
              <p>Dr. IGV crédito (1611) ....... 2.29</p>
              <p>&nbsp;&nbsp;Cr. Ventas (4100) ........... 33.90</p>
              <p>&nbsp;&nbsp;Cr. IGV por pagar (4011) .... 6.10</p>
            </div>
            <p class="text-xs text-secondary-500 mt-2">El descuento es deducible como gasto de marketing con sustento en el programa documentado.</p>
          </div>
        </section>

        <!-- Cuenta 2311 -->
        <section>
          <h3 class="text-base font-semibold text-secondary mb-2">Cuenta 2311 — Puntos por canjear</h3>
          <div class="bg-secondary-50 rounded-lg p-4 font-mono text-xs text-secondary-600">
            <p>2000 &nbsp;Pasivos corrientes</p>
            <p>&nbsp;&nbsp;2300 &nbsp;Ingresos diferidos</p>
            <p>&nbsp;&nbsp;&nbsp;&nbsp;<strong>2311 &nbsp;Puntos de fidelización por canjear</strong></p>
          </div>
          <p class="mt-2 text-xs text-secondary-500">
            El backoffice muestra en el dashboard el saldo estimado de esta cuenta:
            Total puntos activos × valor por punto. Compara mensualmente con tu sistema contable.
          </p>
        </section>

        <!-- Breakage -->
        <section>
          <h3 class="text-base font-semibold text-secondary mb-2">Puntos que nunca se canjean (Breakage)</h3>
          <p class="mb-2">Entre el 20% y 40% de los puntos emitidos nunca se canjean. Cuando sea remoto que el cliente los use (inactivos &gt; 12 meses), puedes liberar el pasivo:</p>
          <div class="bg-secondary-50 rounded-lg p-4 font-mono text-xs text-secondary-600">
            <p>Dr. Pasivo 2311 .............. X.XX</p>
            <p>&nbsp;&nbsp;Cr. Ingreso vencimiento (7410) X.XX</p>
          </div>
          <p class="mt-2 text-xs text-secondary-500">
            Revisa el saldo de la cuenta 2311 con tu contador al menos cada 6 meses.
          </p>
        </section>

        <!-- NetSuite -->
        <section>
          <h3 class="text-base font-semibold text-secondary mb-2">Integración con ERP (NetSuite)</h3>
          <p class="mb-2">Si tu tienda tiene integración con NetSuite activa, MiTienda envía automáticamente:</p>
          <ul class="list-disc pl-5 space-y-1 text-xs">
            <li><strong>Al emitir puntos:</strong> Journal Entry — Dr. Ventas 4100 / Cr. Pasivo 2311</li>
            <li><strong>Al canjear puntos:</strong> Sales Order con descuento + Journal Entry — Dr. Pasivo 2311 / Cr. Ventas + IGV</li>
          </ul>
          <div class="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3">
            <p class="text-xs text-amber-800">
              <strong>Requisito:</strong> Crear ítem "Loyalty Pay" tipo Discount mapeado a cuenta 2311, y crear la cuenta 2311 en NetSuite antes de activar.
            </p>
          </div>
        </section>

        <!-- FAQ -->
        <section>
          <h3 class="text-base font-semibold text-secondary mb-3">Preguntas frecuentes</h3>
          <div class="space-y-3">
            <div>
              <p class="font-medium text-secondary">¿Debo emitir factura cuando un cliente paga 100% con puntos?</p>
              <p class="text-xs text-secondary-500 mt-1">Sí. La obligación nace con la transferencia del bien, independientemente del medio de pago.</p>
            </div>
            <div>
              <p class="font-medium text-secondary">¿El IGV aplica en ventas con puntos?</p>
              <p class="text-xs text-secondary-500 mt-1">Sí. El IGV grava el valor de la operación, no el flujo de caja.</p>
            </div>
            <div>
              <p class="font-medium text-secondary">¿Puedo deducir el costo del programa como gasto?</p>
              <p class="text-xs text-secondary-500 mt-1">Puntos: se reconoce al canjear. Sellos: gasto de promoción deducible. Necesitas la documentación del programa como sustento.</p>
            </div>
            <div>
              <p class="font-medium text-secondary">¿Qué pasa si desactivo el programa con puntos activos?</p>
              <p class="text-xs text-secondary-500 mt-1">Los puntos emitidos siguen siendo un pasivo. MiTienda mantiene el ledger histórico. Decide con tu contador si honrar, vencer o liberar como breakage.</p>
            </div>
          </div>
        </section>
      </div>
    </Sidebar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useLoyaltyStore } from '@/stores/loyalty.store'
import { useToast } from 'primevue/usetoast'
import { useFormatters } from '@/composables/useFormatters'
import type { LoyaltyAccount } from '@/types/loyalty.types'

import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import InputSwitch from 'primevue/inputswitch'
import Textarea from 'primevue/textarea'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import Sidebar from 'primevue/sidebar'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import Paginator from 'primevue/paginator'
import ProgressSpinner from 'primevue/progressspinner'

const store = useLoyaltyStore()
const toast = useToast()
const { formatDate, formatNumber } = useFormatters()

// State
const activeTab = ref(0)
const showAccountingDrawer = ref(false)
const customerSearch = ref('')
const showCustomerDetail = ref(false)
const showCorrectionDialog = ref(false)
const selectedCustomer = ref<LoyaltyAccount | null>(null)
const isSavingCorrection = ref(false)

// Correction form
const correctionType = ref<'credit' | 'debit'>('credit')
const correctionAmount = ref<number | null>(null)
const correctionNote = ref('')

// Program form
const form = ref({
  type: 'stamps' as 'stamps' | 'points',
  is_active: false,
  min_order_amount: 0 as number | null,
  stamps_required: 5 as number | null,
  stamp_reward_amount: 15 as number | null,
  coupon_expiry_days: 30,
  points_per_sol: 5 as number | null,
  point_value_soles: 0.2 as number | null,
  min_points_to_pay: 50 as number | null,
})

const program = computed(() => store.program)

const pointsLiabilityExample = computed(() => {
  if (!form.value.points_per_sol || !form.value.point_value_soles) return '0.00'
  const pts = Math.floor(50 * form.value.points_per_sol)
  return (pts * form.value.point_value_soles).toFixed(2)
})

// Load program on mount
onMounted(async () => {
  await store.fetchProgram()
  if (store.program) {
    form.value = {
      type: store.program.type,
      is_active: store.program.is_active === 1,
      min_order_amount: parseFloat(store.program.min_order_amount) || 0,
      stamps_required: store.program.stamps_required,
      stamp_reward_amount: store.program.stamp_reward_amount ? parseFloat(store.program.stamp_reward_amount) : null,
      coupon_expiry_days: store.program.coupon_expiry_days || 30,
      points_per_sol: store.program.points_per_sol ? parseFloat(store.program.points_per_sol) : null,
      point_value_soles: store.program.point_value_soles ? parseFloat(store.program.point_value_soles) : null,
      min_points_to_pay: store.program.min_points_to_pay,
    }
  }
})

// Load dashboard/customers when tab changes
watch(activeTab, (tab) => {
  if (tab === 1) store.fetchDashboard()
  if (tab === 2) store.fetchCustomers()
})

// Actions
async function saveConfig() {
  const data = {
    type: form.value.type,
    is_active: form.value.is_active ? 1 : 0,
    min_order_amount: String(form.value.min_order_amount || 0),
    stamps_required: form.value.stamps_required,
    stamp_reward_amount: form.value.stamp_reward_amount != null ? String(form.value.stamp_reward_amount) : null,
    coupon_expiry_days: form.value.coupon_expiry_days,
    points_per_sol: form.value.points_per_sol != null ? String(form.value.points_per_sol) : null,
    point_value_soles: form.value.point_value_soles != null ? String(form.value.point_value_soles) : null,
    min_points_to_pay: form.value.min_points_to_pay,
  }

  const success = await store.saveProgram(data)
  if (success) {
    toast.add({ severity: 'success', summary: 'Guardado', detail: 'Configuración actualizada', life: 3000 })
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: store.error || 'No se pudo guardar', life: 5000 })
  }
}

function searchCustomers() {
  store.fetchCustomers({ search: customerSearch.value, page: 1 })
}

function onCustomerPageChange(event: any) {
  const page = Math.floor(event.first / event.rows) + 1
  store.fetchCustomers({ search: customerSearch.value, page })
}

async function openCustomerDetail(customer: LoyaltyAccount) {
  selectedCustomer.value = customer
  showCustomerDetail.value = true
  store.integrityResult = null
  await Promise.all([
    store.fetchCustomerDetail(customer.customer_id),
    store.fetchCustomerHistory(customer.customer_id),
  ])
}

function openCorrectionDialog(customer: LoyaltyAccount) {
  selectedCustomer.value = customer
  correctionType.value = 'credit'
  correctionAmount.value = null
  correctionNote.value = ''
  showCorrectionDialog.value = true
}

async function submitCorrection() {
  if (!selectedCustomer.value || !correctionAmount.value || !correctionNote.value) return

  isSavingCorrection.value = true
  const payload = {
    credit: correctionType.value === 'credit' ? correctionAmount.value : 0,
    debit: correctionType.value === 'debit' ? correctionAmount.value : 0,
    note: correctionNote.value,
  }

  const success = await store.applyCorrection(selectedCustomer.value.customer_id, payload)
  isSavingCorrection.value = false

  if (success) {
    toast.add({ severity: 'success', summary: 'Ajuste aplicado', detail: 'El saldo fue actualizado', life: 3000 })
    showCorrectionDialog.value = false
    store.fetchCustomers({ search: customerSearch.value, page: store.customersPagination.page })
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: store.error || 'No se pudo aplicar el ajuste', life: 5000 })
  }
}

async function checkIntegrity() {
  if (!selectedCustomer.value) return
  const result = await store.verifyIntegrity(selectedCustomer.value.customer_id)
  if (result?.valid) {
    toast.add({ severity: 'success', summary: 'Integridad verificada', detail: `${result.total_entries} entradas verificadas`, life: 3000 })
  }
}

// Entry display helpers
function entryIcon(type: string): string {
  const icons: Record<string, string> = {
    earn: 'pi pi-arrow-up',
    reserve: 'pi pi-lock',
    release: 'pi pi-lock-open',
    redeem: 'pi pi-check-circle',
    refund: 'pi pi-replay',
    correction: 'pi pi-pencil',
  }
  return icons[type] || 'pi pi-circle'
}

function entryColor(type: string): string {
  const colors: Record<string, string> = {
    earn: '#22c55e',
    reserve: '#eab308',
    release: '#3b82f6',
    redeem: '#00b2a6',
    refund: '#ef4444',
    correction: '#8b5cf6',
  }
  return colors[type] || '#6b7280'
}

function entryLabel(type: string): string {
  const labels: Record<string, string> = {
    earn: 'Acumulación',
    reserve: 'Reserva',
    release: 'Liberación',
    redeem: 'Canje confirmado',
    refund: 'Reembolso',
    correction: 'Ajuste manual',
  }
  return labels[type] || type
}
</script>
