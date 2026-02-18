<template>
  <button
    type="button"
    class="inline-flex items-center gap-1 text-xs text-primary hover:text-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    :disabled="disabled || loading"
    :title="label"
    @click="handleGenerate"
  >
    <i :class="loading ? 'pi pi-spin pi-spinner' : 'pi pi-sparkles'" class="text-xs" />
    <span>{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
import { useLlmProxy } from '@/composables/useLlmProxy'

const PRESETS: Record<string, { system: string; user: string }> = {
  'meta-description': {
    system: `Eres un experto en SEO para tiendas en línea en Perú. Genera una meta description optimizada para buscadores. Reglas:
- Entre 50 y 160 caracteres obligatoriamente
- Incluir la palabra clave principal (nombre del producto)
- Ser persuasiva e invitar al click
- Usar español neutro/peruano
- Solo responde con la meta description, sin comillas ni explicaciones adicionales`,
    user: 'Genera una meta description SEO para este producto'
  },
  'meta-title': {
    system: `Eres un experto en SEO para tiendas en línea en Perú. Genera un meta title optimizado. Reglas:
- Máximo 60 caracteres
- Incluir el nombre del producto y la marca si aplica
- Formato sugerido: "Producto - Marca" o "Producto | Categoría"
- Solo responde con el meta title, sin comillas ni explicaciones adicionales`,
    user: 'Genera un meta title SEO para este producto'
  },
  'short-description': {
    system: `Eres un experto en redacción de productos para tiendas en línea en Perú. Genera una descripción corta y atractiva. Reglas:
- Entre 1 y 3 oraciones (máximo 300 caracteres)
- Destacar el beneficio principal del producto
- Tono profesional y persuasivo
- Adaptado al mercado peruano
- Solo responde con la descripción, sin comillas ni explicaciones adicionales`,
    user: 'Genera una descripción corta atractiva para este producto'
  }
}

interface Props {
  modelValue?: string
  context?: string
  preset?: string
  systemPrompt?: string
  userPrompt?: string
  maxLength?: number
  buttonId?: string
  label?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  context: '',
  label: 'Generar con IA',
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { generate, loading } = useLlmProxy()

const handleGenerate = async () => {
  if (props.modelValue?.trim()) {
    const ok = confirm('El campo ya tiene contenido. ¿Deseas reemplazarlo con texto generado por IA?')
    if (!ok) return
  }

  const config = props.preset && PRESETS[props.preset]
    ? PRESETS[props.preset]
    : { system: props.systemPrompt || '', user: props.userPrompt || '' }

  if (!config.system) return

  try {
    const result = await generate(
      {
        systemPrompt: config.system,
        userPrompt: config.user,
        context: props.context,
        buttonId: props.buttonId
      },
      accumulated => {
        const text = props.maxLength ? accumulated.slice(0, props.maxLength) : accumulated
        emit('update:modelValue', text)
      }
    )

    const finalText = props.maxLength ? result.slice(0, props.maxLength) : result
    emit('update:modelValue', finalText)
  } catch {
    // error is already tracked in the composable
  }
}
</script>
