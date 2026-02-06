export interface Review {
  id: number
  product_id: number
  product_name: string | null
  product_sku: string | null
  customer_id: number
  customer_name: string
  customer_email: string | null
  order_id: number | null
  rating: number
  comment: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  moderated_at: string | null
}

export interface ReviewFilters {
  search: string
  status: 'pending' | 'approved' | 'rejected' | ''
  rating: number | null
  product_id: number | null
}

export interface ReviewStats {
  total: number
  pending: number
  approved: number
  rejected: number
  avg_rating: number
}

export interface ProductRating {
  total: number
  avg_rating: number
  distribution: Record<number, number>
}

export interface ProductReview {
  id: number
  customer_name: string
  rating: number
  comment: string | null
  created_at: string
}

export interface OrderItemReview {
  product_id: number
  product_name: string
  product_sku: string
  has_review: boolean
  review: {
    id: number
    rating: number
    status: string
    comment: string | null
    created_at: string
  } | null
}
