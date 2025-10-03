<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-primary mb-2">MiTienda</h1>
        <p class="text-secondary-500">Backoffice</p>
      </div>

      <div class="bg-white rounded-lg shadow-xl p-8">
        <router-view />
      </div>

      <div class="text-center mt-6 text-sm text-secondary-400">
        <p>&copy; {{ new Date().getFullYear() }} MiTienda.pe - Todos los derechos reservados</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>
