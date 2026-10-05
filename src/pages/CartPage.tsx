import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { cartQueryKey, useCart } from '../hooks/useCart'
import { ApiError, apiRequest } from '../lib/api'
import { authClient } from '../lib/auth-client'
import type { ApiData, Cart } from '../types/commerce'
import { usePageTitle } from '../hooks/usePageTitle'

const money = new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR', maximumFractionDigits: 0 })

export function CartPage() {
  usePageTitle('Your bag')
  const cart = useCart()
  const queryClient = useQueryClient()
  // Clearing the bag cannot be undone, so it takes a second click to confirm.
  const [confirmClear, setConfirmClear] = useState(false)
  const update = useMutation({
    mutationFn: async ({ id, qty }: { id: string; qty: number }) => (await apiRequest<ApiData<Cart>>(`/api/v1/cart/items/${id}`, { method: 'PATCH', body: JSON.stringify({ qty }) })).data,
    onSuccess: (data) => queryClient.setQueryData(cartQueryKey, data),
    onError: (error) => toast.error(error.message),
  })
  const remove = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/v1/cart/items/${id}`, { method: 'DELETE' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: cartQueryKey }); toast.success('Item removed') },
    onError: (error) => toast.error(error.message),
  })
  const clear = useMutation({
    mutationFn: () => apiRequest('/api/v1/cart', { method: 'DELETE' }),
    onSuccess: () => { setConfirmClear(false); queryClient.setQueryData(cartQueryKey, { items: [], itemCount: 0, subtotal: '0.00' }) },
    onError: (error) => toast.error(error.message),
  })

  if (cart.isPending) return <div className="page-loading">Loading your bag…</div>
  // Staff and admin accounts share the sign-in with the store but cannot shop.
  // Say so plainly instead of showing a generic failure.
  if (cart.isError && cart.error instanceof ApiError && cart.error.code === 'CUSTOMER_ACCESS_REQUIRED') {
    return <div className="collection-state page-state"><p>STAFF ACCOUNT</p><span>You are signed in with a staff account, which cannot shop on the store. Sign out to use a bag as a guest or customer.</span><button onClick={async () => { await authClient.signOut(); window.location.assign('/cart') }}>Sign out</button></div>
  }
  if (cart.isError) return <div className="collection-state page-state"><p>WE COULDN'T LOAD YOUR BAG</p><span>Please check your connection and try again.</span><button onClick={() => cart.refetch()}>Try again</button></div>

  return (
    <div className="page-shell cart-page">
      <header className="page-hero compact"><p>YOUR SELECTION</p><h1>BAG / {cart.data.itemCount.toString().padStart(2, '0')}</h1></header>
      {cart.data.items.length === 0 ? (
        <div className="empty-bag"><ShoppingBag /><h2>YOUR BAG IS EMPTY.</h2><p>Build your uniform from the current drop.</p><Link className="solid-button" to="/shop">Browse collection <ArrowRight /></Link></div>
      ) : (
        <div className="cart-layout">
          <section className="cart-items">
            <div className="cart-list-head"><span>{cart.data.itemCount} {cart.data.itemCount === 1 ? 'item' : 'items'}</span><button type="button" className={confirmClear ? 'confirming' : ''} onClick={() => { if (confirmClear) clear.mutate(); else setConfirmClear(true) }} onBlur={() => setConfirmClear(false)} disabled={clear.isPending}>{confirmClear ? 'Tap again to clear' : 'Clear bag'}</button></div>
            {cart.data.items.map((item) => (
              <article className="cart-line" key={item.id}>
                <Link className="cart-line-image" to={`/products/${item.product.slug}`}>{item.product.images[0] ? <img src={item.product.images[0]} alt={item.product.name} /> : <span>R</span>}</Link>
                <div className="cart-line-copy"><p>{item.product.category.name}</p><h2><Link to={`/products/${item.product.slug}`}>{item.product.name}</Link></h2><span>Size {item.variant.size.toUpperCase()} / {item.variant.color}</span>{!item.variant.available && <strong>Only {item.variant.stockQty} units are currently available</strong>}</div>
                <div className="quantity-stepper"><button type="button" aria-label="Decrease quantity" disabled={item.qty <= 1 || update.isPending} onClick={() => update.mutate({ id: item.id, qty: item.qty - 1 })}><Minus /></button><span>{item.qty}</span><button type="button" aria-label="Increase quantity" disabled={update.isPending} onClick={() => { if (item.qty >= item.variant.stockQty) toast.error(`Only ${item.variant.stockQty} units are available`); else update.mutate({ id: item.id, qty: item.qty + 1 }) }}><Plus /></button></div>
                <strong className="cart-line-total">{money.format(Number(item.lineTotal))}</strong>
                <button className="icon-button remove-line" type="button" aria-label={`Remove ${item.product.name}`} onClick={() => remove.mutate(item.id)}><Trash2 /></button>
              </article>
            ))}
          </section>
          <aside className="order-summary">
            <p className="eyebrow">ORDER SUMMARY</p>
            <dl><div><dt>Subtotal</dt><dd>{money.format(Number(cart.data.subtotal))}</dd></div><div><dt>Shipping</dt><dd>Calculated at checkout</dd></div></dl>
            <div className="summary-total"><span>Total before delivery</span><strong>{money.format(Number(cart.data.subtotal))}</strong></div>
            <Link className="solid-button" to="/checkout">Continue to checkout <ArrowRight /></Link>
            <small>The delivery fee is added at checkout.</small>
          </aside>
        </div>
      )}
    </div>
  )
}
