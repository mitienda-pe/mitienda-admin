<template>
  <div
    ref="monacoContainer"
    class="w-full border border-gray-300 rounded"
    :style="{ height }"
  ></div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import type * as MonacoTypes from 'monaco-editor'

interface Props {
  modelValue: string
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  height: '60vh',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const monacoContainer = ref<HTMLElement | null>(null)
let monacoEditor: MonacoTypes.editor.IStandaloneCodeEditor | null = null
// Evita el bucle watch->setValue->onDidChangeModelContent->emit
let applyingExternal = false

async function initMonaco() {
  if (!monacoContainer.value || monacoEditor) return
  await nextTick()

  const monaco = await import('monaco-editor')

  // Configurar web workers de Monaco para builds de producción
  if (!self.MonacoEnvironment) {
    self.MonacoEnvironment = {
      getWorker(_: string, label: string) {
        if (label === 'css' || label === 'scss' || label === 'less') {
          return new Worker(
            new URL('monaco-editor/esm/vs/language/css/css.worker.js', import.meta.url),
            { type: 'module' }
          )
        }
        return new Worker(
          new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url),
          { type: 'module' }
        )
      },
    }
  }

  monacoEditor = monaco.editor.create(monacoContainer.value, {
    value: props.modelValue,
    language: 'css',
    theme: 'vs',
    automaticLayout: true,
    minimap: { enabled: false },
    wordWrap: 'on',
    fontSize: 14,
    scrollBeyondLastLine: false,
    tabSize: 2,
  })

  monacoEditor.onDidChangeModelContent(() => {
    if (monacoEditor && !applyingExternal) {
      emit('update:modelValue', monacoEditor.getValue())
    }
  })
}

// Sincroniza cambios externos (reset, carga inicial) hacia el editor
watch(
  () => props.modelValue,
  (newValue) => {
    if (monacoEditor && newValue !== monacoEditor.getValue()) {
      applyingExternal = true
      monacoEditor.setValue(newValue ?? '')
      applyingExternal = false
    }
  }
)

onMounted(() => {
  initMonaco()
})

onBeforeUnmount(() => {
  if (monacoEditor) {
    monacoEditor.dispose()
    monacoEditor = null
  }
})
</script>
