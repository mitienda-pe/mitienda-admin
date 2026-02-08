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

  // Category images - Medium requirements (future implementation)
  categories: {
    minWidth: 300,
    minHeight: 300,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
    aspectRatio: 1 // Force square
  },

  // Brand logos - Smaller requirements (future implementation)
  brands: {
    minWidth: 200,
    minHeight: 200,
    maxFileSize: 2 * 1024 * 1024, // 2MB
    allowedFormats: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
    aspectRatio: null // Logos can be any shape
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

  // Store favicon
  favicon: {
    minWidth: 32,
    minHeight: 32,
    maxFileSize: 2 * 1024 * 1024, // 2MB
    allowedFormats: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
    aspectRatio: 1 // Square
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
