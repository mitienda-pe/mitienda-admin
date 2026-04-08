<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center">
      <h1 class="text-6xl font-bold text-gray-300 mb-4">404</h1>
      <p class="text-xl text-secondary-700 mb-2">Pagina no encontrada</p>
      <p class="text-sm text-gray-500 mb-8">La pagina que buscas no existe o fue movida.</p>
      <router-link
        to="/dashboard"
        class="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
      >
        <i class="pi pi-home" />
        Ir al inicio
      </router-link>
    </div>
  </div>
</template>
