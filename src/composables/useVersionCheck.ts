import { ref, onMounted, onUnmounted } from 'vue'

declare const __APP_VERSION__: string
declare const __BUILD_ID__: string

const CHECK_INTERVAL = 3 * 60 * 1000 // 3 minutes

const newVersionAvailable = ref(false)
const currentBuildId = __BUILD_ID__
const currentVersion = __APP_VERSION__
let intervalId: ReturnType<typeof setInterval> | null = null
let listening = 0

async function checkVersion() {
  try {
    const res = await fetch('/version.json?_=' + Date.now(), {
      cache: 'no-store',
    })
    if (!res.ok) return
    const data = await res.json()
    if (data.version && data.version !== currentBuildId) {
      newVersionAvailable.value = true
    }
  } catch {
    // network error — ignore silently
  }
}

export function useVersionCheck() {
  onMounted(() => {
    listening++
    if (listening === 1) {
      // Initial check after a short delay
      setTimeout(checkVersion, 10_000)
      intervalId = setInterval(checkVersion, CHECK_INTERVAL)
    }
  })

  onUnmounted(() => {
    listening--
    if (listening === 0 && intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  })

  function reload() {
    window.location.reload()
  }

  function dismiss() {
    newVersionAvailable.value = false
  }

  return {
    newVersionAvailable,
    currentVersion,
    reload,
    dismiss,
  }
}
