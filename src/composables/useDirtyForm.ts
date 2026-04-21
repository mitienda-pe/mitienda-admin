import { ref, computed, toValue, type MaybeRefOrGetter } from 'vue'

/**
 * Tracks whether a form has unsaved changes vs the last saved snapshot.
 * Works with refs, reactive objects, and getter functions.
 *
 * Usage:
 *   const formData = reactive({ name: '' })
 *   const { isDirty, reset } = useDirtyForm(() => formData)
 *
 *   // After the form finishes loading its initial values, or after a successful save:
 *   reset()
 *
 *   // In the template:
 *   <Button :disabled="!isDirty" @click="save" />
 */
export function useDirtyForm<T>(source: MaybeRefOrGetter<T>) {
  const serialize = () => JSON.stringify(toValue(source) ?? null)
  const baseline = ref(serialize())

  const isDirty = computed(() => baseline.value !== serialize())

  function reset() {
    baseline.value = serialize()
  }

  return { isDirty, reset }
}
