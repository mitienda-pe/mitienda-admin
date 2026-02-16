// Image validation rules per module
// This allows different modules to have different requirements

export interface ImageValidationRules {
  minWidth: number
  minHeight: number
  maxFileSize: number // in bytes
  allowedFormats: string[]
  aspectRatio: number | null // null = any ratio allowed, number = forced ratio (e.g., 1 for square)
}

export const IMAGE_VALIDATION_RULES: Record<string, ImageValidationRules> = {
  // Product images - Strict requirements for quality
  products: {
    minWidth: 600,
    minHeight: 600,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
    aspectRatio: null // Any ratio allowed, but cropping to square is optional
  },

  // Catalog square image (1:1) — categories, brands, gammas
  catalogSquare: {
    minWidth: 400,
    minHeight: 400,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
    aspectRatio: null // Enforced by cropper
  },

  // Catalog cover image (820x360) — categories, brands, gammas
  catalogCover: {
    minWidth: 820,
    minHeight: 360,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
    aspectRatio: null // Enforced by cropper
  },

  // Catalog OpenGraph image (1200x630) — categories, brands, gammas
  catalogOg: {
    minWidth: 1200,
    minHeight: 630,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
    aspectRatio: null // Enforced by cropper
  },

  // User avatars (future implementation)
  avatars: {
    minWidth: 100,
    minHeight: 100,
    maxFileSize: 1 * 1024 * 1024, // 1MB
    allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
    aspectRatio: 1 // Force square
  },

  // Store logo
  logo: {
    minWidth: 100,
    minHeight: 100,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedFormats: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
    aspectRatio: null
  },

  // Store disabled banner (shown when store is deactivated)
  storeDisabledBanner: {
    minWidth: 300,
    minHeight: 200,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
    aspectRatio: null
  },

  // OpenGraph image (social sharing)
  ogImage: {
    minWidth: 1200,
    minHeight: 630,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
    aspectRatio: null // Recommended 1.91:1 but not forced
  },

  // Store favicon
  favicon: {
    minWidth: 32,
    minHeight: 32,
    maxFileSize: 2 * 1024 * 1024, // 2MB
    allowedFormats: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
    aspectRatio: 1 // Square
  },

  // Carousel desktop images (16:9 or 21:9, enforced by cropper)
  carouselDesktop: {
    minWidth: 1920,
    minHeight: 823,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
    aspectRatio: null // Enforced by cropper per selected preset
  },

  // Carousel mobile images (4:5 or 1:1, enforced by cropper)
  carouselMobile: {
    minWidth: 1080,
    minHeight: 1080,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
    aspectRatio: null // Enforced by cropper per selected preset
  }
}

/**
 * Format file size in human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Get validation rules for a specific module
 */
export const getValidationRules = (module: keyof typeof IMAGE_VALIDATION_RULES): ImageValidationRules => {
  return IMAGE_VALIDATION_RULES[module]
}
