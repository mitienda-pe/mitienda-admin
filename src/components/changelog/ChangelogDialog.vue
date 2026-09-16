<template>
  <Dialog
    :visible="visible"
    modal
    dismissable-mask
    header="Novedades"
    :style="{ width: '640px' }"
    :breakpoints="{ '768px': '95vw' }"
    @update:visible="emit('update:visible', $event)"
  >
    <div v-if="loading" class="flex items-center justify-center py-16">
      <i class="pi pi-spin pi-spinner text-2xl text-gray-400"></i>
    </div>

    <AppErrorState
      v-else-if="error"
      title="No se pudo cargar el historial de cambios"
      message="Revisa tu conexión e inténtalo de nuevo."
      @retry="load"
    />

    <AppEmptyState
      v-else-if="releases.length === 0"
      title="Todavía no hay cambios publicados"
    />

    <div v-else class="space-y-6">
      <section v-for="release in shownReleases" :key="release.version">
        <header class="flex items-center gap-2 mb-2">
          <h2 class="text-base font-semibold text-gray-900">{{ release.version }}</h2>
          <AppBadge v-if="release.version === currentTag" variant="success">
            Tu versión
          </AppBadge>
          <span class="ml-auto text-xs text-gray-500">{{ formatDate(release.date) }}</span>
        </header>
        <div
          class="prose prose-sm max-w-none prose-h3:text-sm prose-h3:text-gray-600 prose-h3:mt-3 prose-h3:mb-1 prose-ul:my-1 prose-li:my-0"
          v-html="release.html"
        ></div>
      </section>

      <div v-if="shownCount < releases.length" class="text-center">
        <AppButton variant="secondary" size="small" @click="shownCount += PAGE_SIZE">
          Ver versiones anteriores
        </AppButton>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import { marked } from 'marked'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppErrorState from '@/components/ui/AppErrorState.vue'
import { parseChangelog, type ChangelogRelease } from '@/utils/changelog'
import { sanitizeHtml } from '@/utils/sanitize'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ 'update:visible': [value: boolean] }>()

const PAGE_SIZE = 10
const currentTag = `v${__APP_VERSION__}`

const releases = ref<(ChangelogRelease & { html: string })[]>([])
const loading = ref(false)
const error = ref(false)
const shownCount = ref(PAGE_SIZE)

const shownReleases = computed(() => releases.value.slice(0, shownCount.value))

// El changelog pesa ~150 KB: va en su propio chunk y solo se descarga la
// primera vez que alguien abre el diálogo.
async function load() {
  loading.value = true
  error.value = false
  try {
    const { default: md } = await import('../../../CHANGELOG.md?raw')
    releases.value = parseChangelog(md).map((r) => ({
      ...r,
      html: sanitizeHtml(String(marked.parse(r.markdown, { async: false, gfm: true }))),
    }))
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

watch(
  () => props.visible,
  (open) => {
    if (open && releases.value.length === 0 && !loading.value) load()
  }
)

function formatDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
</script>
