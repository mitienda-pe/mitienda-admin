import { watch, onBeforeUnmount, type Ref, type ComputedRef } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

const DEFAULT_MESSAGE = '¿Estás seguro de salir? Hay cambios sin guardar que se perderán.'

export function useUnsavedChanges(
  isDirty: Ref<boolean> | ComputedRef<boolean>,
  options?: { message?: string }
) {
  const message = options?.message || DEFAULT_MESSAGE

  // Prevent route navigation when dirty
  onBeforeRouteLeave(() => {
    if (isDirty.value) {
      return window.confirm(message)
    }
    return true
  })

  // Prevent browser tab close/refresh when dirty
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (isDirty.value) {
      e.preventDefault()
      e.returnValue = message
    }
  }

  watch(isDirty, (dirty) => {
    if (dirty) {
      window.addEventListener('beforeunload', handleBeforeUnload)
    } else {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, { immediate: true })

  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
  })
}
