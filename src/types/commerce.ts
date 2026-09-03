import type { Product, ProductVariant } from './catalog'

export type ApiData<T> = { data: T }

export type CartItem = {
  id: string
  qty: number
  lineTotal: string
  variant: ProductVariant
  product: Pick<Product, 'id' | 'name' | 'slug' | 'images' | 'category'>
}

export type Cart = {
  items: CartItem[]
  itemCount: number
  subtotal: string
}

export type Address = {
  id: string
  userId: string
  label: string
  fullAddress: string
  city: string
  phone: string
  isDefault: boolean
}

export type WishlistItem = {
  id: string
  createdAt: string
  variant: ProductVariant
  product: Pick<Product, 'id' | 'name' | 'slug' | 'images'>
}

export type OrderItem = {
  id: string
  variantId: string
  productName: string
  productImageUrl: string | null
  variantSku: string
  variantSize: string
  variantColor: string
  qty: number
  price: string
  lineTotal: string
}

export type Payment = {
  id: string
  method: 'qr'
  screenshotUrl: string | null
  status: 'awaiting_proof' | 'pending_verification' | 'success' | 'failed'
  amount: string
  verifiedAt: string | null
  paidAt: string | null
  createdAt: string
  updatedAt: string
}

export type Order = {
  id: string
  orderNumber: string
  status: 'pending' | 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'cancelled'
  paymentStatus: 'unpaid' | 'paid' | 'failed'
  subtotal: string
  shippingFee: string
  total: string
  paymentMethod: 'qr'
  delivery: { name: string; phone: string; fullAddress: string; city: string }
  trackingRef: string | null
  createdAt: string
  items: OrderItem[]
  payments: Payment[]
}

export type PaymentInstructions = {
  method: 'qr'
  qrImageUrl: string
  providerName: string
  accountName: string
  accountIdentifier: string
  amount: string
  reference: string
  instructions: string
}

export type CheckoutResult = {
  order: Pick<Order, 'id' | 'orderNumber' | 'status' | 'paymentStatus' | 'subtotal' | 'shippingFee' | 'total' | 'createdAt'>
  payment: Pick<Payment, 'id' | 'status' | 'amount' | 'createdAt'>
  paymentInstructions: PaymentInstructions
}

export type Category = {
  id: string
  name: string
  slug: string
  parentId: string | null
  children: Category[]
}
