import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Check, Heart, Minus, Plus, ShieldCheck, ShoppingBag } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { cartQueryKey } from '../hooks/useCart'
import { apiRequest } from '../lib/api'
import { authClient } from '../lib/auth-client'
import type { Product } from '../types/catalog'
import type { ApiData, Cart } from '../types/commerce'

const money = new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR', maximumFractionDigits: 0 })

export function ProductDetailPage() {
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: session } = authClient.useSession()
  const [variantId, setVariantId] = useState('')
  const [quantity, setQuantity] = useState(1)

  const product = useQuery({
    queryKey: ['product', slug],
    queryFn: async () => (await apiRequest<ApiData<Product>>(`/api/v1/products/${encodeURIComponent(slug)}`)).data,
  })
  const selectedVariant = product.data?.variants.find((variant) => variant.id === variantId) ?? product.data?.variants[0]

  const addToCart = useMutation({
    mutationFn: async () => (await apiRequest<ApiData<Cart>>('/api/v1/cart/items', { method: 'POST', body: JSON.stringify({ variantId: selectedVariant!.id, qty: quantity }) })).data,
    onSuccess: (cart) => {
      queryClient.setQueryData(cartQueryKey, cart)
      toast.success('Added to your bag')
    },
    onError: (error) => toast.error(error.message),
  })
  const addToWishlist = useMutation({
    mutationFn: () => apiRequest('/api/v1/wishlist/items', { method: 'POST', body: JSON.stringify({ variantId: selectedVariant!.id }) }),
    onSuccess: () => toast.success('Saved to wishlist'),
    onError: (error) => toast.error(error.message),
  })

  if (product.isPending) return <div className="detail-loading"><div className="product-skeleton" /><div className="product-skeleton" /></div>
  if (product.isError || !product.data) return <div className="collection-state page-state"><p>PRODUCT NOT FOUND</p><Link to="/shop">Return to shop</Link></div>

  const images = product.data.images.length ? product.data.images : [null]

  return (
    <div className="product-detail-page">
      <div className="product-gallery">
        {images.map((image, index) => image ? <img src={image} alt={`${product.data.name} view ${index + 1}`} key={image} /> : <div className="detail-image-fallback" key="fallback"><span>R</span></div>)}
      </div>
      <aside className="product-purchase">
        <Link className="back-link" to="/shop"><ArrowLeft /> Back to shop</Link>
        <p className="eyebrow">{product.data.category.name} / {selectedVariant?.sku}</p>
        <h1>{product.data.name}</h1>
        <p className="detail-price">{selectedVariant ? money.format(Number(selectedVariant.price)) : '—'}</p>
        <p className="detail-description">{product.data.description}</p>

        <fieldset className="variant-picker">
          <legend>Select variant</legend>
          <div>{product.data.variants.map((variant) => (
            <button className={(selectedVariant?.id === variant.id ? 'selected ' : '') + (!variant.available ? 'unavailable' : '')} type="button" key={variant.id} disabled={!variant.available} onClick={() => setVariantId(variant.id)}>
              <span>{variant.size}</span><small>{variant.color}</small>{selectedVariant?.id === variant.id && <Check />}
            </button>
          ))}</div>
        </fieldset>

        <div className="purchase-actions">
          <div className="quantity-stepper"><button type="button" aria-label="Decrease quantity" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus /></button><span>{quantity}</span><button type="button" aria-label="Increase quantity" onClick={() => setQuantity(Math.min(999, quantity + 1))}><Plus /></button></div>
          <button className="solid-button" type="button" disabled={!selectedVariant?.available || addToCart.isPending} onClick={() => addToCart.mutate()}><ShoppingBag /> {addToCart.isPending ? 'Adding…' : 'Add to bag'}</button>
          <button className="square-button" type="button" aria-label="Save to wishlist" disabled={!selectedVariant?.available || addToWishlist.isPending} onClick={() => session ? addToWishlist.mutate() : navigate('/auth/sign-in')}><Heart /></button>
        </div>
        <div className="purchase-note"><ShieldCheck /><span><strong>Server verified</strong>Price and stock are checked again before checkout.</span></div>
      </aside>
    </div>
  )
}
