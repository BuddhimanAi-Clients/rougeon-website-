import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Check, Heart, Minus, Plus, ShieldCheck, ShoppingBag } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { cartQueryKey } from '../hooks/useCart'
import { apiRequest } from '../lib/api'
import { authClient } from '../lib/auth-client'
import type { Product } from '../types/catalog'
import type { ApiData, Cart } from '../types/commerce'
import { ProductGallery } from '../components/ProductGallery'
import { usePageTitle } from '../hooks/usePageTitle'

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
  useEffect(() => {
    if (variantId || !product.data) return
    // Open with a buyable option selected so the primary action is immediately
    // understandable; fall back to the first variant only when all are sold out.
    setVariantId(product.data.variants.find((variant) => variant.available)?.id ?? product.data.variants[0]?.id ?? '')
  }, [product.data, variantId])
  // A variant must be chosen deliberately. Falling back to the first variant made
  // the visible selection and the item actually added to the bag disagree.
  const selectedVariant = product.data?.variants.find((variant) => variant.id === variantId)
  usePageTitle(product.data?.name ?? 'Product')

  const addToCart = useMutation({
    mutationFn: async () => {
      if (!selectedVariant) throw new Error('Select a variant before adding this item to your bag')
      return (await apiRequest<ApiData<Cart>>('/api/v1/cart/items', { method: 'POST', body: JSON.stringify({ variantId: selectedVariant.id, qty: quantity }) })).data
    },
    onSuccess: (cart) => {
      queryClient.setQueryData(cartQueryKey, cart)
      // Stay on the product so the customer can keep browsing; the bag is one tap away.
      toast.success('Added to your bag', { action: { label: 'View bag', onClick: () => navigate('/cart') } })
    },
    onError: (error) => toast.error(error.message),
  })
  const addToWishlist = useMutation({
    mutationFn: () => selectedVariant ? apiRequest('/api/v1/wishlist/items', { method: 'POST', body: JSON.stringify({ variantId: selectedVariant.id }) }) : Promise.reject(new Error('Select a variant before saving this item')),
    onSuccess: () => toast.success('Saved to wishlist'),
    onError: (error) => toast.error(error.message),
  })

  if (product.isPending) return <div className="detail-loading"><div className="product-skeleton" /><div className="product-skeleton" /></div>
  if (product.isError || !product.data) return <div className="collection-state page-state"><p>PRODUCT NOT FOUND</p><Link to="/shop">Return to shop</Link></div>


  return (
    <div className="product-detail-page">
      <ProductGallery images={product.data.images} name={product.data.name} />
      <aside className="product-purchase">
        <Link className="back-link" to="/shop"><ArrowLeft /> Back to shop</Link>
        <p className="eyebrow">{product.data.category.name}</p>
        <h1>{product.data.name}</h1>
        <p className="detail-price">{selectedVariant ? money.format(Number(selectedVariant.price)) : '—'}</p>
        <p className="detail-description">{product.data.description}</p>

        <fieldset className="variant-picker">
          <legend>Select size</legend>
          <div>{product.data.variants.map((variant) => (
            <button className={(selectedVariant?.id === variant.id ? 'selected ' : '') + (!variant.available ? 'unavailable' : '')} type="button" key={variant.id} disabled={!variant.available} onClick={() => setVariantId(variant.id)}>
              <span>{variant.size}</span><small>{variant.color}</small>{selectedVariant?.id === variant.id && <Check />}
            </button>
          ))}</div>
        </fieldset>

        <div className="purchase-actions">
          <div className="quantity-stepper"><button type="button" aria-label="Decrease quantity" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus /></button><span>{quantity}</span><button type="button" aria-label="Increase quantity" disabled={!selectedVariant} onClick={() => { if (selectedVariant && quantity >= selectedVariant.stockQty) toast.error(`Only ${selectedVariant.stockQty} units are available`); else setQuantity(quantity + 1) }}><Plus /></button></div>
          <button className="solid-button" type="button" disabled={!selectedVariant?.available || addToCart.isPending} onClick={() => addToCart.mutate()}><ShoppingBag /> {addToCart.isPending ? 'Adding…' : 'Add to bag'}</button>
          <button className="square-button" type="button" aria-label="Save to wishlist" disabled={!selectedVariant?.available || addToWishlist.isPending} onClick={() => session ? addToWishlist.mutate() : navigate('/auth/sign-in')}><Heart /></button>
        </div>
        <div className="purchase-note"><ShieldCheck /><span><strong>{!selectedVariant ? 'Choose a size' : !selectedVariant.available ? 'Sold out' : selectedVariant.stockQty <= 5 ? `Only ${selectedVariant.stockQty} left` : 'In stock'}</strong>Delivery across Nepal. Pay in full by QR, or choose cash on delivery at checkout.</span></div>
      </aside>
    </div>
  )
}
