<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useDomainStore } from '@/stores/domain.store'
import { AppButton, AppBadge } from '@/components/ui'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'

const store = useDomainStore()
const toast = useToast()

const showDnsHelp = ref(false)

// Local domain type detection (mirrors backend logic)
const TWO_PART_TLDS = [
  'com.pe','net.pe','org.pe','gob.pe','edu.pe',
  'com.br','com.ar','com.co','com.mx','com.cl',
  'co.uk','com.au','com.ec','com.bo','com.uy',
]

const localDomainType = computed(() => {
  const domain = store.draftDomain.trim().toLowerCase()
  if (!domain || !domain.includes('.')) return null

  let effectiveTldParts = 1
  for (const tld of TWO_PART_TLDS) {
    if (domain.endsWith('.' + tld)) {
      effectiveTldParts = 2
      break
    }
  }

  const parts = domain.split('.')
  const labelCount = parts.length - effectiveTldParts
  return labelCount <= 1 ? 'root' : 'subdomain'
})

// Auto-clean domain on blur
function cleanDomainInput() {
  let val = store.draftDomain.trim()
  val = val.replace(/^https?:\/\//i, '')
  val = val.replace(/\/+$/, '')
  val = val.toLowerCase()
  store.draftDomain = val
}

// Copy to clipboard
async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.add({ severity: 'success', summary: 'Copiado', life: 2000 })
  } catch {
    toast.add({ severity: 'error', summary: 'No se pudo copiar', life: 3000 })
  }
}

async function save() {
  const ok = await store.saveDomain()
  if (ok) {
    toast.add({ severity: 'success', summary: 'Dominio guardado', life: 3000 })
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: store.error || 'No se pudo guardar',
      life: 5000
    })
  }
}

async function verify() {
  const ok = await store.verifyDns()
  if (ok) {
    toast.add({
      severity: 'success',
      summary: 'DNS verificado',
      detail: 'Tu dominio apunta correctamente a nuestros servidores',
      life: 5000
    })
  } else {
    toast.add({
      severity: 'warn',
      summary: 'DNS no configurado',
      detail: 'Los registros DNS aun no apuntan a nuestros servidores',
      life: 5000
    })
  }
}

async function removeDomain() {
  store.draftDomain = ''
  const ok = await store.saveDomain()
  if (ok) {
    store.verificationResult = null
    toast.add({ severity: 'success', summary: 'Dominio eliminado', life: 3000 })
  }
}

onMounted(() => {
  store.fetchSettings()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-3xl font-bold text-secondary">Dominio propio</h1>
        <p class="text-sm text-secondary-500 mt-1">
          Conecta tu dominio personalizado a tu tienda
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="store.isLoading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Error -->
    <div
      v-else-if="store.error && !store.savedSettings.default_url"
      class="bg-red-50 border border-red-200 rounded-lg p-6 text-center"
    >
      <i class="pi pi-exclamation-triangle text-3xl text-red-400 mb-2" />
      <p class="text-red-600">{{ store.error }}</p>
      <AppButton variant="outlined" class="mt-4" @click="store.fetchSettings()">
        Reintentar
      </AppButton>
    </div>

    <!-- Content -->
    <div v-else class="space-y-6">
      <!-- Card 1: Tu dominio -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
          <i class="pi pi-globe text-primary" />
          Tu dominio
        </h2>

        <div class="space-y-5">
          <!-- Default URL -->
          <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p class="text-xs text-gray-500 mb-1">URL por defecto (siempre disponible)</p>
            <div class="flex items-center gap-2">
              <code class="text-sm text-primary font-medium">
                {{ store.savedSettings.default_url }}
              </code>
              <button
                type="button"
                class="text-gray-400 hover:text-primary transition-colors"
                title="Copiar"
                @click="copyToClipboard(store.savedSettings.default_url)"
              >
                <i class="pi pi-copy text-sm" />
              </button>
            </div>
          </div>

          <!-- Custom domain input -->
          <div>
            <div class="flex items-center gap-2 mb-1">
              <label class="block text-sm font-medium text-secondary-700">
                Dominio personalizado
              </label>
              <AppBadge v-if="localDomainType === 'root'" variant="info">
                Dominio raiz
              </AppBadge>
              <AppBadge v-else-if="localDomainType === 'subdomain'" variant="info">
                Subdominio
              </AppBadge>
            </div>
            <p class="text-xs text-gray-400 mb-2">
              Ingresa tu dominio sin http:// ni www (a menos que quieras usar www como subdominio)
            </p>
            <div class="flex gap-2">
              <input
                v-model="store.draftDomain"
                type="text"
                class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                placeholder="ejemplo.com.pe"
                @blur="cleanDomainInput"
              />
              <AppButton
                v-if="store.savedSettings.tienda_dominio"
                variant="text"
                size="small"
                class="text-red-600"
                @click="removeDomain"
              >
                <i class="pi pi-trash" />
              </AppButton>
            </div>
          </div>
        </div>

        <!-- Save button -->
        <div class="flex items-center gap-3 mt-5">
          <AppButton
            variant="primary"
            :loading="store.isSaving"
            :disabled="!store.hasChanges"
            @click="save"
          >
            <i class="pi pi-check mr-2" />
            Guardar dominio
          </AppButton>
          <span v-if="store.hasChanges" class="text-xs text-amber-600">
            Tienes cambios sin guardar
          </span>
        </div>
      </div>

      <!-- Card 2: Configuracion DNS (only show when domain is saved) -->
      <div v-if="store.savedSettings.tienda_dominio" class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
          <i class="pi pi-sitemap text-primary" />
          Configuracion DNS
        </h2>

        <p class="text-sm text-gray-500 mb-4">
          Configura los siguientes registros DNS en tu proveedor de dominio para que
          <strong>{{ store.savedSettings.tienda_dominio }}</strong> apunte a tu tienda.
        </p>

        <!-- DNS Instructions table -->
        <div
          v-if="store.savedSettings.dns_instructions"
          class="space-y-4"
        >
          <!-- Required records -->
          <div class="overflow-x-auto">
            <table class="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-2 text-left text-xs font-semibold text-gray-600">Tipo</th>
                  <th class="px-4 py-2 text-left text-xs font-semibold text-gray-600">Nombre</th>
                  <th class="px-4 py-2 text-left text-xs font-semibold text-gray-600">Valor</th>
                  <th class="px-4 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(record, idx) in store.savedSettings.dns_instructions.records"
                  :key="idx"
                  class="border-t border-gray-100"
                >
                  <td class="px-4 py-2">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700">
                      {{ record.type }}
                    </span>
                  </td>
                  <td class="px-4 py-2 font-mono text-gray-700">{{ record.name }}</td>
                  <td class="px-4 py-2 font-mono text-gray-700">{{ record.value }}</td>
                  <td class="px-4 py-2">
                    <button
                      type="button"
                      class="text-gray-400 hover:text-primary transition-colors"
                      title="Copiar valor"
                      @click="copyToClipboard(record.value)"
                    >
                      <i class="pi pi-copy text-sm" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Optional records (for root domains: CNAME www) -->
          <div
            v-if="store.savedSettings.dns_instructions.optional_records?.length"
          >
            <p class="text-sm text-gray-500 mb-2">
              {{ store.savedSettings.dns_instructions.note }}
            </p>
            <div class="overflow-x-auto">
              <table class="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-2 text-left text-xs font-semibold text-gray-600">Tipo</th>
                    <th class="px-4 py-2 text-left text-xs font-semibold text-gray-600">Nombre</th>
                    <th class="px-4 py-2 text-left text-xs font-semibold text-gray-600">Valor</th>
                    <th class="px-4 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(record, idx) in store.savedSettings.dns_instructions.optional_records"
                    :key="idx"
                    class="border-t border-gray-100"
                  >
                    <td class="px-4 py-2">
                      <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700">
                        {{ record.type }}
                      </span>
                    </td>
                    <td class="px-4 py-2 font-mono text-gray-700">{{ record.name }}</td>
                    <td class="px-4 py-2 font-mono text-gray-700">{{ record.value }}</td>
                    <td class="px-4 py-2">
                      <button
                        type="button"
                        class="text-gray-400 hover:text-primary transition-colors"
                        title="Copiar valor"
                        @click="copyToClipboard(record.value)"
                      >
                        <i class="pi pi-copy text-sm" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- DNS Help expandable -->
        <div class="mt-5">
          <button
            type="button"
            class="flex items-center gap-2 text-sm text-primary hover:underline"
            @click="showDnsHelp = !showDnsHelp"
          >
            <i :class="showDnsHelp ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" class="text-xs" />
            ¿Como configuro los DNS?
          </button>

          <div v-if="showDnsHelp" class="mt-3 bg-gray-50 rounded-lg p-4 space-y-3 text-sm text-gray-600">
            <div>
              <h4 class="font-medium text-secondary-700">Cloudflare</h4>
              <p class="text-xs mt-0.5">
                Ve a DNS &gt; Records &gt; Add record. Selecciona el tipo, ingresa el nombre y valor
                indicados arriba. Desactiva el proxy (icono naranja) para que funcione correctamente.
              </p>
            </div>
            <div>
              <h4 class="font-medium text-secondary-700">GoDaddy</h4>
              <p class="text-xs mt-0.5">
                Ve a My Products &gt; DNS &gt; Manage. Agrega un nuevo registro con los datos de arriba.
              </p>
            </div>
            <div>
              <h4 class="font-medium text-secondary-700">Namecheap</h4>
              <p class="text-xs mt-0.5">
                Ve a Domain List &gt; Manage &gt; Advanced DNS. Agrega los registros indicados.
              </p>
            </div>
            <div>
              <h4 class="font-medium text-secondary-700">Punto.pe / NIC.pe</h4>
              <p class="text-xs mt-0.5">
                Ingresa a tu panel de administracion del dominio en nic.pe, ve a la seccion de
                DNS y agrega los registros indicados.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Card 3: Verificacion y SSL -->
      <div v-if="store.savedSettings.tienda_dominio" class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
          <i class="pi pi-shield text-primary" />
          Verificacion y SSL
        </h2>

        <div class="space-y-5">
          <!-- Verify button -->
          <div>
            <AppButton
              variant="outlined"
              :loading="store.isVerifying"
              @click="verify"
            >
              <i class="pi pi-sync mr-2" />
              Verificar configuracion DNS
            </AppButton>
          </div>

          <!-- Verification result -->
          <div v-if="store.verificationResult" class="space-y-3">
            <!-- Success -->
            <div
              v-if="store.verificationResult.dns_configured"
              class="bg-green-50 border border-green-200 rounded-lg p-4"
            >
              <div class="flex items-center gap-2 mb-1">
                <i class="pi pi-check-circle text-green-600" />
                <span class="text-sm font-medium text-green-800">DNS configurado correctamente</span>
              </div>
              <p class="text-xs text-green-600">
                Tu dominio apunta a nuestros servidores.
              </p>
            </div>

            <!-- Failure -->
            <div
              v-else
              class="bg-red-50 border border-red-200 rounded-lg p-4"
            >
              <div class="flex items-center gap-2 mb-1">
                <i class="pi pi-times-circle text-red-600" />
                <span class="text-sm font-medium text-red-800">DNS no configurado</span>
              </div>
              <p class="text-xs text-red-600 mb-3">
                Los registros actuales no apuntan a nuestros servidores.
              </p>

              <!-- Records found vs expected -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p class="text-xs font-medium text-gray-600 mb-1">Registros encontrados:</p>
                  <div
                    v-if="store.verificationResult.records_found.length"
                    class="space-y-1"
                  >
                    <div
                      v-for="(r, i) in store.verificationResult.records_found"
                      :key="i"
                      class="text-xs font-mono bg-white rounded px-2 py-1 border border-red-100"
                    >
                      {{ r.type }}: {{ r.value }}
                    </div>
                  </div>
                  <p v-else class="text-xs text-gray-400 italic">Ninguno</p>
                </div>
                <div>
                  <p class="text-xs font-medium text-gray-600 mb-1">Registros esperados:</p>
                  <div class="space-y-1">
                    <div
                      v-for="(r, i) in store.verificationResult.expected_records"
                      :key="i"
                      class="text-xs font-mono bg-white rounded px-2 py-1 border border-green-100"
                    >
                      {{ r.type }}: {{ r.value }}
                    </div>
                  </div>
                </div>
              </div>

              <p class="text-xs text-gray-400 mt-3">
                Los cambios de DNS pueden tardar entre 15 minutos y 48 horas en propagarse.
              </p>
            </div>
          </div>

          <!-- SSL Status -->
          <div class="border-t border-gray-100 pt-4">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-sm font-medium text-secondary-700">Certificado SSL</span>
              <AppBadge
                v-if="store.savedSettings.tienda_ssl === 1"
                variant="success"
              >
                SSL Activo
              </AppBadge>
              <AppBadge
                v-else-if="store.savedSettings.tienda_dominio_verificado === 1"
                variant="warning"
              >
                SSL Pendiente
              </AppBadge>
              <AppBadge v-else variant="neutral">
                SSL No disponible
              </AppBadge>
            </div>
            <p class="text-xs text-gray-400">
              El certificado SSL se configura automaticamente una vez que el DNS esta verificado.
            </p>
          </div>
        </div>
      </div>

      <!-- Card 4: Email desde tu dominio (Proximamente) -->
      <div class="bg-white rounded-lg shadow p-6 opacity-75">
        <div class="flex items-center gap-2 mb-4">
          <h2 class="text-lg font-semibold text-secondary flex items-center gap-2">
            <i class="pi pi-envelope text-primary" />
            Email desde tu dominio
          </h2>
          <AppBadge variant="info">Proximamente</AppBadge>
        </div>

        <p class="text-sm text-gray-500 mb-4">
          Actualmente los correos de notificacion a tus clientes se envian desde nuestro dominio
          (<code class="text-xs bg-gray-100 px-1 py-0.5 rounded">ventas@from.mitienda.pe</code>)
          con responder-a tu email. Pronto podras enviar correos directamente desde tu dominio
          personalizado configurando los siguientes registros DNS.
        </p>

        <!-- Preview DNS records (informational) -->
        <div class="overflow-x-auto">
          <table class="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-semibold text-gray-600">Tipo</th>
                <th class="px-4 py-2 text-left text-xs font-semibold text-gray-600">Nombre</th>
                <th class="px-4 py-2 text-left text-xs font-semibold text-gray-600">Valor</th>
              </tr>
            </thead>
            <tbody class="text-gray-400">
              <tr class="border-t border-gray-100">
                <td class="px-4 py-2">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-500">TXT</span>
                </td>
                <td class="px-4 py-2 font-mono">@</td>
                <td class="px-4 py-2 font-mono text-xs">v=spf1 include:amazonses.com ~all</td>
              </tr>
              <tr class="border-t border-gray-100">
                <td class="px-4 py-2">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-500">CNAME</span>
                </td>
                <td class="px-4 py-2 font-mono">selector._domainkey</td>
                <td class="px-4 py-2 font-mono text-xs italic">Por definir</td>
              </tr>
              <tr class="border-t border-gray-100">
                <td class="px-4 py-2">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-500">TXT</span>
                </td>
                <td class="px-4 py-2 font-mono">_dmarc</td>
                <td class="px-4 py-2 font-mono text-xs">v=DMARC1; p=none;</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p class="text-xs text-gray-400 mt-3">
          Esta funcionalidad estara disponible pronto. Te notificaremos cuando este lista.
        </p>
      </div>
    </div>
  </div>
</template>
