<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ProductCardConfig } from '@/types/product-card.types'

interface Props {
  config: ProductCardConfig
}

const props = defineProps<Props>()

const previewImages = [
  'https://picsum.photos/seed/mitienda-preview/400/400',
  'https://picsum.photos/seed/mitienda-preview2/400/400',
  'https://picsum.photos/seed/mitienda-preview3/400/400'
]

const currentImageIndex = ref(0)

function nextImage() {
  currentImageIndex.value = (currentImageIndex.value + 1) % previewImages.length
}

function prevImage() {
  currentImageIndex.value =
    (currentImageIndex.value - 1 + previewImages.length) % previewImages.length
}

function goToImage(index: number) {
  currentImageIndex.value = index
}

const cardClasses = computed(() => {
  const classes: string[] = ['pc-preview']

  // Card style
  if (props.config.card_style !== 'default') {
    const styleMap: Record<string, string> = {
      bordered: 'pc-bordered',
      'border-image': 'pc-border-image',
      'transparent-info': 'pc-transparent-info',
      'shadow-image': 'pc-shadow-image'
    }
    if (styleMap[props.config.card_style]) {
      classes.push(styleMap[props.config.card_style])
    }
  }

  // Border radius
  classes.push(`pc-radius-${props.config.border_radius}`)

  // Hover effect
  const hoverMap: Record<string, string> = {
    'translate-y': 'pc-hover-translate',
    scale: 'pc-hover-scale',
    zoom: 'pc-hover-zoom',
    'ken-burns': 'pc-hover-kenburns',
    combo: 'pc-hover-combo',
    'info-slide': 'pc-hover-slideup'
  }
  if (hoverMap[props.config.hover_effect]) {
    classes.push(hoverMap[props.config.hover_effect])
  }

  // Image display mode
  if (props.config.image_display === 'hover-swap') {
    classes.push('pc-hover-swap')
  }

  return classes
})

const buttonLabel = computed(() => {
  const labels: Record<number, string> = {
    0: '',
    1: 'Ver más',
    2: '',
    3: '+',
    4: 'Agregar al carrito'
  }
  return labels[props.config.button_type] ?? ''
})
</script>

<template>
  <div class="pc-preview-wrapper">
    <p class="text-xs text-gray-400 mb-3 text-center">
      Pasa el cursor sobre la tarjeta para ver el efecto
    </p>
    <div :class="cardClasses">
      <!-- Image -->
      <div class="pc-image-wrapper">
        <!-- Default / hover-swap -->
        <template v-if="config.image_display === 'none' || config.image_display === 'hover-swap'">
          <img
            :src="previewImages[0]"
            alt="Producto de ejemplo"
            class="pc-img pc-img-default"
          />
          <img
            v-if="config.image_display === 'hover-swap'"
            :src="previewImages[1]"
            alt="Producto de ejemplo (hover)"
            class="pc-img pc-img-hover"
          />
        </template>

        <!-- Carousel -->
        <template v-else-if="config.image_display === 'carousel'">
          <img
            v-for="(src, i) in previewImages"
            :key="i"
            :src="src"
            alt="Producto de ejemplo"
            class="pc-img pc-carousel-img"
            :class="{ 'pc-carousel-active': i === currentImageIndex }"
          />
          <button class="pc-carousel-nav pc-carousel-prev" @click.stop="prevImage">
            ‹
          </button>
          <button class="pc-carousel-nav pc-carousel-next" @click.stop="nextImage">
            ›
          </button>
          <div class="pc-carousel-dots">
            <span
              v-for="(_, i) in previewImages"
              :key="i"
              class="pc-carousel-dot"
              :class="{ 'pc-carousel-dot-active': i === currentImageIndex }"
              @click.stop="goToImage(i)"
            />
          </div>
        </template>

        <!-- Thumbnails -->
        <template v-else-if="config.image_display === 'thumbnails'">
          <img
            :src="previewImages[currentImageIndex]"
            alt="Producto de ejemplo"
            class="pc-img pc-img-default"
          />
        </template>

        <!-- Discount badge -->
        <span class="pc-badge">-20%</span>
      </div>

      <!-- Thumbnails strip -->
      <div
        v-if="config.image_display === 'thumbnails'"
        class="pc-thumbnails"
      >
        <div
          v-for="(src, i) in previewImages"
          :key="i"
          class="pc-thumb"
          :class="{ 'pc-thumb-active': i === currentImageIndex }"
          @click.stop="goToImage(i)"
        >
          <img :src="src" alt="" />
        </div>
      </div>

      <!-- Info -->
      <div class="pc-info">
        <span class="pc-category">Categoría</span>
        <h3 class="pc-name">Producto de ejemplo</h3>
        <div class="pc-prices">
          <span class="pc-price-original">S/ 120.00</span>
          <span class="pc-price">S/ 96.00</span>
        </div>

        <!-- Button type 1: Ver más -->
        <button
          v-if="config.button_type === 1"
          class="pc-btn pc-btn-outline"
        >
          {{ buttonLabel }}
        </button>

        <!-- Button type 2: Quantity -->
        <div
          v-else-if="config.button_type === 2"
          class="pc-quantity"
        >
          <button class="pc-qty-btn">−</button>
          <input type="text" value="1" readonly class="pc-qty-input" />
          <button class="pc-qty-btn">+</button>
        </div>

        <!-- Button type 3: Quick add (+) -->
        <button
          v-else-if="config.button_type === 3"
          class="pc-btn pc-btn-primary pc-btn-icon"
        >
          <i class="pi pi-plus" />
        </button>

        <!-- Button type 4: Add to cart -->
        <button
          v-else-if="config.button_type === 4"
          class="pc-btn pc-btn-primary"
        >
          {{ buttonLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Preview wrapper ── */
.pc-preview-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* ── Card base ── */
.pc-preview {
  width: 220px;
  background: #fff;
  border-radius: 12px;
  overflow: visible;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* ── Card Styles ── */
.pc-bordered {
  border: 2px solid #bbb;
  box-shadow: none;
}
.pc-bordered:hover {
  box-shadow: none;
  border-color: #999;
}

.pc-border-image {
  background: transparent;
  box-shadow: none;
}
.pc-border-image .pc-image-wrapper {
  border: 2px solid #bbb;
}
.pc-border-image:hover {
  box-shadow: none;
}

.pc-transparent-info {
  background: transparent;
  box-shadow: none;
}
.pc-transparent-info .pc-image-wrapper {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}
.pc-transparent-info:hover {
  box-shadow: none;
}
.pc-transparent-info:hover .pc-image-wrapper {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.pc-shadow-image {
  background: transparent;
  box-shadow: none;
}
.pc-shadow-image .pc-image-wrapper {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}
.pc-shadow-image:hover {
  box-shadow: none;
}
.pc-shadow-image:hover .pc-image-wrapper {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

/* ── Border Radius ── */
.pc-radius-0 { border-radius: 0; }
.pc-radius-0 .pc-image-wrapper { border-radius: 0; }
.pc-radius-0 .pc-btn,
.pc-radius-0 .pc-quantity { border-radius: 0; }

.pc-radius-4 { border-radius: 4px; }
.pc-radius-4 .pc-image-wrapper { border-radius: 4px 4px 0 0; }
.pc-radius-4 .pc-btn,
.pc-radius-4 .pc-quantity { border-radius: 3px; }

.pc-radius-8 { border-radius: 8px; }
.pc-radius-8 .pc-image-wrapper { border-radius: 8px 8px 0 0; }
.pc-radius-8 .pc-btn,
.pc-radius-8 .pc-quantity { border-radius: 6px; }

.pc-radius-12 { border-radius: 12px; }
.pc-radius-12 .pc-image-wrapper { border-radius: 12px 12px 0 0; }
.pc-radius-12 .pc-btn,
.pc-radius-12 .pc-quantity { border-radius: 8px; }

/* ── Hover Effects ── */
.pc-hover-translate:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.pc-hover-scale:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.pc-hover-zoom .pc-image-wrapper {
  overflow: hidden;
}
.pc-hover-zoom .pc-image-wrapper .pc-img-default {
  transition: transform 0.5s ease;
}
.pc-hover-zoom:hover .pc-image-wrapper .pc-img-default {
  transform: scale(1.15);
}

.pc-hover-kenburns .pc-image-wrapper {
  overflow: hidden;
}
.pc-hover-kenburns .pc-image-wrapper .pc-img-default {
  transition: transform 0.8s ease-out;
}
.pc-hover-kenburns:hover .pc-image-wrapper .pc-img-default {
  transform: scale(1.2) translate(-3%, -3%);
}

.pc-hover-combo {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.pc-hover-combo .pc-image-wrapper {
  overflow: hidden;
}
.pc-hover-combo .pc-image-wrapper .pc-img-default {
  transition: transform 0.5s ease;
}
.pc-hover-combo:hover {
  transform: scale(1.03);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}
.pc-hover-combo:hover .pc-image-wrapper .pc-img-default {
  transform: scale(1.1);
}

.pc-hover-slideup {
  overflow: hidden;
}
.pc-hover-slideup .pc-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px;
  background: rgba(255, 255, 255, 0.95);
  transform: translateY(100%);
  transition: transform 0.3s ease;
}
.pc-hover-slideup:hover .pc-info {
  transform: translateY(0);
}
.pc-hover-slideup .pc-image-wrapper {
  border-radius: inherit;
}

/* ── Image Hover Swap ── */
.pc-hover-swap .pc-image-wrapper {
  position: relative;
}
.pc-hover-swap .pc-img-hover {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  opacity: 0;
  transition: opacity 0.3s ease;
}
.pc-hover-swap:hover .pc-img-default {
  opacity: 0;
}
.pc-hover-swap:hover .pc-img-hover {
  opacity: 1;
}

/* ── Image ── */
.pc-image-wrapper {
  aspect-ratio: 1 / 1;
  position: relative;
  overflow: hidden;
  background: #f5f5f5;
  border-radius: 12px 12px 0 0;
}

.pc-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  transition: opacity 0.3s ease;
}

.pc-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: #e63946;
  color: #fff;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 4px;
  z-index: 2;
}

/* ── Info ── */
.pc-info {
  padding: 10px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.pc-category {
  font-size: 10px;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.pc-name {
  font-size: 14px;
  font-weight: 600;
  margin: 0;
  color: #222;
  line-height: 1.3;
}

.pc-prices {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
}

.pc-price-original {
  color: #999;
  font-size: 12px;
  text-decoration: line-through;
}

.pc-price {
  color: #e63946;
  font-size: 16px;
  font-weight: 700;
}

/* ── Buttons ── */
.pc-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 34px;
  padding: 0 12px;
  margin-top: auto;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: background 0.2s ease;
}

.pc-btn-primary {
  background: #00b2a6;
  color: #fff;
}
.pc-btn-primary:hover {
  background: #009e93;
}

.pc-btn-outline {
  color: #00b2a6;
  background: #fff;
  border: 1px solid #00b2a6;
}
.pc-btn-outline:hover {
  background: #f0faf9;
}

.pc-btn-icon {
  width: 34px;
  padding: 0;
  align-self: flex-end;
}

/* ── Quantity Stepper ── */
.pc-quantity {
  display: flex;
  align-items: stretch;
  border: 2px solid #00b2a6;
  border-radius: 8px;
  overflow: hidden;
  height: 34px;
  margin-top: auto;
}

.pc-qty-btn {
  background: #fff;
  color: #00b2a6;
  border: none;
  width: 34px;
  flex-shrink: 0;
  cursor: pointer;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pc-qty-btn:first-child {
  border-right: 2px solid #00b2a6;
}
.pc-qty-btn:last-child {
  border-left: 2px solid #00b2a6;
}

.pc-qty-input {
  flex: 1;
  border: none;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  color: #222;
  background: #eee;
  min-width: 0;
  outline: none;
}

/* ── Carousel ── */
.pc-carousel-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  opacity: 0;
  transition: opacity 0.3s ease;
}
.pc-carousel-img.pc-carousel-active {
  opacity: 1;
  position: relative;
}

.pc-carousel-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  font-weight: 700;
  color: #333;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  z-index: 10;
  line-height: 1;
}
.pc-carousel-nav:hover {
  background: #fff;
}
.pc-carousel-prev { left: 6px; }
.pc-carousel-next { right: 6px; }

.pc-carousel-dots {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 4px;
  z-index: 10;
}
.pc-carousel-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: background 0.2s ease;
}
.pc-carousel-dot-active {
  background: #fff;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
}

/* ── Thumbnails ── */
.pc-thumbnails {
  display: flex;
  gap: 4px;
  padding: 6px 8px;
}
.pc-thumb {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  overflow: hidden;
  border: 2px solid transparent;
  cursor: pointer;
  transition: border-color 0.2s ease;
  flex-shrink: 0;
}
.pc-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.pc-thumb-active {
  border-color: #00b2a6;
}
.pc-thumb:hover:not(.pc-thumb-active) {
  border-color: #ccc;
}
</style>
