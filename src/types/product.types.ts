// Tipos de productos
export interface Product {
  id: number
  sku: string
  name: string
  description?: string
  price: number
  compare_price?: number
  cost?: number
  stock: number
  min_stock?: number
  weight?: number
  published: boolean
  featured: boolean
  images: ProductImage[]
  category?: Category
  brand?: Brand
  created_at: string
  updated_at: string
}

export interface ProductImage {
  id: number
  url: string
  thumbnail?: string
  position: number
  is_main: boolean
}

export interface Category {
  id: number
  name: string
  slug: string
  parent_id?: number
  image?: string
}

export interface Brand {
  id: number
  name: string
  slug: string
  logo?: string
}

export interface ProductFilters {
  search: string
  categoryId: number | null
  brandId: number | null
  published: boolean | null
  stockStatus: 'all' | 'in_stock' | 'limited' | 'out_of_stock'
}

export interface ProductsState {
  products: Product[]
  currentProduct: Product | null
  isLoading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
  filters: ProductFilters
}
