import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import {
  HELP_DOCS_BASE_URL,
  getDocSlugForRoute,
} from '@/config/help-docs.config'

// Module-level shared state — all callers of useHelpDocs() share these refs
const cache = new Map<string, string>()
const html = ref('')
const loading = ref(false)
const error = ref(false)
const isOpen = ref(false)

export function useHelpDocs() {
  const route = useRoute()

  const currentSlug = computed(() => getDocSlugForRoute(route.path))
  const docUrl = computed(
    () => `${HELP_DOCS_BASE_URL}/${currentSlug.value}.md`
  )

  async function fetchDoc() {
    const slug = currentSlug.value

    if (cache.has(slug)) {
      html.value = cache.get(slug)!
      return
    }

    loading.value = true
    error.value = false

    try {
      const res = await fetch(docUrl.value)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      let md = await res.text()

      // Strip YAML frontmatter (--- ... ---)
      md = md.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '')

      // Rewrite relative image paths to absolute CDN URLs
      md = md.replace(
        /!\[([^\]]*)\]\((?!https?:\/\/)([^)]+)\)/g,
        `![$1](${HELP_DOCS_BASE_URL}/$2)`
      )

      const raw = await marked.parse(md)
      const clean = DOMPurify.sanitize(raw)

      cache.set(slug, clean)
      html.value = clean
    } catch {
      error.value = true
      html.value = ''
    } finally {
      loading.value = false
    }
  }

  function open() {
    isOpen.value = true
    fetchDoc()
  }

  function close() {
    isOpen.value = false
  }

  // Re-fetch when route changes while drawer is open
  watch(currentSlug, () => {
    if (isOpen.value) fetchDoc()
  })

  return { html, loading, error, isOpen, currentSlug, open, close, fetchDoc }
}
