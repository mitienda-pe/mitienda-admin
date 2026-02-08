import type { FontDef, FontCategory } from '@/types/appearance.types'

export const FONT_CATALOG: FontDef[] = [
  // Sans Serif
  { family: 'Inter', category: 'sans-serif', weights: [400, 500, 600, 700] },
  { family: 'Roboto', category: 'sans-serif', weights: [400, 500, 700] },
  { family: 'Open Sans', category: 'sans-serif', weights: [400, 600, 700] },
  { family: 'Lato', category: 'sans-serif', weights: [400, 700] },
  { family: 'Montserrat', category: 'sans-serif', weights: [400, 500, 600, 700] },
  { family: 'Poppins', category: 'sans-serif', weights: [400, 500, 600, 700] },
  { family: 'Nunito', category: 'sans-serif', weights: [400, 600, 700] },
  { family: 'Raleway', category: 'sans-serif', weights: [400, 500, 600, 700] },
  { family: 'Work Sans', category: 'sans-serif', weights: [400, 500, 600, 700] },
  { family: 'DM Sans', category: 'sans-serif', weights: [400, 500, 700] },
  { family: 'Outfit', category: 'sans-serif', weights: [400, 500, 600, 700] },
  { family: 'Manrope', category: 'sans-serif', weights: [400, 500, 600, 700] },
  { family: 'Plus Jakarta Sans', category: 'sans-serif', weights: [400, 500, 600, 700] },
  { family: 'Source Sans 3', category: 'sans-serif', weights: [400, 600, 700] },
  { family: 'Mulish', category: 'sans-serif', weights: [400, 600, 700] },
  { family: 'Quicksand', category: 'sans-serif', weights: [400, 500, 600, 700] },
  { family: 'Rubik', category: 'sans-serif', weights: [400, 500, 700] },
  { family: 'Karla', category: 'sans-serif', weights: [400, 500, 700] },
  { family: 'Cabin', category: 'sans-serif', weights: [400, 500, 600, 700] },
  { family: 'Archivo', category: 'sans-serif', weights: [400, 500, 600, 700] },

  // Serif
  { family: 'Playfair Display', category: 'serif', weights: [400, 500, 600, 700] },
  { family: 'Merriweather', category: 'serif', weights: [400, 700] },
  { family: 'Lora', category: 'serif', weights: [400, 500, 600, 700] },
  { family: 'PT Serif', category: 'serif', weights: [400, 700] },
  { family: 'Libre Baskerville', category: 'serif', weights: [400, 700] },
  { family: 'Crimson Text', category: 'serif', weights: [400, 600, 700] },
  { family: 'Cormorant Garamond', category: 'serif', weights: [400, 500, 600, 700] },
  { family: 'EB Garamond', category: 'serif', weights: [400, 500, 600, 700] },
  { family: 'Noto Serif', category: 'serif', weights: [400, 700] },
  { family: 'Bitter', category: 'serif', weights: [400, 500, 700] },
  { family: 'Spectral', category: 'serif', weights: [400, 500, 600, 700] },
  { family: 'Gentium Book Plus', category: 'serif', weights: [400, 700] },
  { family: 'Zilla Slab', category: 'serif', weights: [400, 500, 600, 700] },
  { family: 'Rufina', category: 'serif', weights: [400, 700] },
  { family: 'Vollkorn', category: 'serif', weights: [400, 500, 600, 700] },

  // Display
  { family: 'Abril Fatface', category: 'display', weights: [400] },
  { family: 'Comfortaa', category: 'display', weights: [400, 500, 600, 700] },
  { family: 'Righteous', category: 'display', weights: [400] },
  { family: 'Bevan', category: 'display', weights: [400] },
  { family: 'Lobster', category: 'display', weights: [400] },
  { family: 'Pacifico', category: 'display', weights: [400] },
  { family: 'Fredoka', category: 'display', weights: [400, 500, 600, 700] },
  { family: 'Alfa Slab One', category: 'display', weights: [400] },
  { family: 'Bungee', category: 'display', weights: [400] },
  { family: 'Titan One', category: 'display', weights: [400] },

  // Handwriting
  { family: 'Dancing Script', category: 'handwriting', weights: [400, 500, 600, 700] },
  { family: 'Caveat', category: 'handwriting', weights: [400, 500, 600, 700] },
  { family: 'Patrick Hand', category: 'handwriting', weights: [400] },
  { family: 'Indie Flower', category: 'handwriting', weights: [400] },
  { family: 'Shadows Into Light', category: 'handwriting', weights: [400] },

  // Monospace
  { family: 'Fira Code', category: 'monospace', weights: [400, 500, 600, 700] },
  { family: 'JetBrains Mono', category: 'monospace', weights: [400, 500, 600, 700] },
  { family: 'Source Code Pro', category: 'monospace', weights: [400, 500, 600, 700] },
  { family: 'IBM Plex Mono', category: 'monospace', weights: [400, 500, 600, 700] },
  { family: 'Space Mono', category: 'monospace', weights: [400, 700] },
]

export const FONT_CATEGORY_LABELS: Record<FontCategory, string> = {
  'sans-serif': 'Sans Serif',
  serif: 'Serif',
  display: 'Display',
  handwriting: 'Manuscrita',
  monospace: 'Monospace',
}

export function getFontsByCategory(category?: FontCategory): FontDef[] {
  if (!category) return FONT_CATALOG
  return FONT_CATALOG.filter(f => f.category === category)
}

export function findFont(family: string): FontDef | undefined {
  return FONT_CATALOG.find(f => f.family === family)
}
