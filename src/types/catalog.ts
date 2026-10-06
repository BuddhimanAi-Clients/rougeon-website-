export type ProductVariant = {
  id: string
  sku: string
  size: string
  color: string
  price: string
  available: boolean
  stockQty: number
}

export type Product = {
  id: string
  name: string
  slug: string
  description: string
  images: string[]
  /** Photos with the colour they show; a null colour suits every colour. */
  media?: Array<{ url: string; color: string | null }>
  createdAt: string
  category: {
    id: string
    name: string
    slug: string
  }
  variants: ProductVariant[]
  minPrice: string | null
  available: boolean
}

export type PaginatedProducts = {
  data: Product[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
