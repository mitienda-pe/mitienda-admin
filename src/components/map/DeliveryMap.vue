<template>
  <div class="delivery-map">
    <div ref="mapContainer" class="map-container rounded-lg border border-gray-200"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface Props {
  latitude: number | string
  longitude: number | string
  address?: string
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  height: '300px'
})

const mapContainer = ref<HTMLElement | null>(null)
let map: L.Map | null = null
let marker: L.Marker | null = null

// Fix para los iconos de Leaflet en Vite
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
})

const initMap = () => {
  if (!mapContainer.value) return

  const lat = typeof props.latitude === 'string' ? parseFloat(props.latitude) : props.latitude
  const lng = typeof props.longitude === 'string' ? parseFloat(props.longitude) : props.longitude

  // Validar coordenadas
  if (isNaN(lat) || isNaN(lng)) {
    console.error('Coordenadas inválidas:', { lat: props.latitude, lng: props.longitude })
    return
  }

  // Crear mapa
  map = L.map(mapContainer.value).setView([lat, lng], 15)

  // Agregar capa de tiles de OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map)

  // Agregar marcador
  marker = L.marker([lat, lng]).addTo(map)

  // Agregar popup con la dirección si está disponible
  if (props.address) {
    marker.bindPopup(`
      <div class="text-sm">
        <p class="font-semibold mb-1">Dirección de entrega</p>
        <p class="text-gray-700">${props.address}</p>
        <p class="text-xs text-gray-500 mt-1 font-mono">${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
      </div>
    `).openPopup()
  }
}

const updateMarker = () => {
  if (!map || !marker) return

  const lat = typeof props.latitude === 'string' ? parseFloat(props.latitude) : props.latitude
  const lng = typeof props.longitude === 'string' ? parseFloat(props.longitude) : props.longitude

  if (isNaN(lat) || isNaN(lng)) return

  marker.setLatLng([lat, lng])
  map.setView([lat, lng], 15)

  if (props.address) {
    marker.bindPopup(`
      <div class="text-sm">
        <p class="font-semibold mb-1">Dirección de entrega</p>
        <p class="text-gray-700">${props.address}</p>
        <p class="text-xs text-gray-500 mt-1 font-mono">${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
      </div>
    `).openPopup()
  }
}

onMounted(() => {
  // Esperar un tick para asegurar que el DOM esté listo
  setTimeout(() => {
    initMap()
  }, 100)
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})

// Watch para cambios en las coordenadas
watch([() => props.latitude, () => props.longitude, () => props.address], () => {
  updateMarker()
})
</script>

<style scoped>
.map-container {
  height: v-bind(height);
  width: 100%;
  z-index: 0;
}

:deep(.leaflet-popup-content) {
  margin: 8px;
}

:deep(.leaflet-popup-content-wrapper) {
  border-radius: 8px;
}
</style>
