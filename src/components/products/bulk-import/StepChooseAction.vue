<script setup lang="ts">
interface Props {
  mode: 'create' | 'edit'
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:mode': [value: 'create' | 'edit']
}>()

const options = [
  {
    value: 'create' as const,
    icon: 'pi pi-plus-circle',
    title: 'Crear productos nuevos',
    description:
      'Descarga una plantilla CSV con las columnas disponibles, completa los datos y sube el archivo para crear productos en lote.',
  },
  {
    value: 'edit' as const,
    icon: 'pi pi-pencil',
    title: 'Editar productos existentes',
    description:
      'Selecciona las columnas que deseas editar, descarga una plantilla con los datos actuales de tus productos, modifica los valores y vuelve a subir el archivo.',
  },
]
</script>

<template>
  <div class="space-y-4">
    <h3 class="text-lg font-semibold text-secondary-700">
      ¿Que deseas hacer?
    </h3>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="opt in options"
        :key="opt.value"
        class="border-2 rounded-lg p-6 cursor-pointer transition-all"
        :class="
          props.mode === opt.value
            ? 'border-primary bg-primary/5'
            : 'border-gray-200 hover:border-gray-300'
        "
        @click="emit('update:mode', opt.value)"
      >
        <div class="flex items-start gap-4">
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            :class="
              props.mode === opt.value
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-500'
            "
          >
            <i :class="opt.icon" class="text-lg" />
          </div>
          <div>
            <h4 class="font-semibold text-secondary-700">{{ opt.title }}</h4>
            <p class="text-sm text-gray-500 mt-1">{{ opt.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
