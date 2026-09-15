import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { cartQueryKey, useCart } from '../hooks/useCart'
import { apiRequest } from '../lib/api'
import type { ApiData, Cart } from '../types/commerce'

const money = new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR', maximumFractionDigits: 0 })

export function CartPage() {
  const cart = useCart()
  const queryClient = useQueryClient()
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
    onSuccess: () => queryClient.setQueryData(cartQueryKey, { items: [], itemCount: 0, subtotal: '0.00' }),
    onError: (error) => toast.error(error.message),
  })

  if (cart.isPending) return <div className="page-loading">Loading your bag…</div>
  if (cart.isError) return <div className="collection-state page-state"><p>BAG UNAVAILABLE</p><button onClick={() => cart.refetch()}>Try again</button></div>

  return (
    <div className="page-shell cart-page">
      <header className="page-hero compact"><p>YOUR SELECTION</p><h1>BAG / {cart.data.itemCount.toString().padStart(2, '0')}</h1></header>
      {cart.data.items.length === 0 ? (
        <div className="empty-bag"><ShoppingBag /><h2>YOUR BAG IS EMPTY.</h2><p>Build your uniform from the current drop.</p><Link className="solid-button" to="/shop">Browse collection <ArrowRight /></Link></div>
      ) : (
        <div className="cart-layout">
          <section className="cart-items">
            <div className="cart-list-head"><span>{cart.data.items.length} lines</span><button type="button" onClick={() => clear.mutate()} disabled={clear.isPending}>Clear bag</button></div>
            {cart.data.items.map((item) => (
              <article className="cart-line" key={item.id}>
                <Link className="cart-line-image" to={`/products/${item.product.slug}`}>{item.product.images[0] ? <img src={item.product.images[0]} alt={item.product.name} /> : <span>R</span>}</Link>
                <div className="cart-line-copy"><p>{item.product.category.name}</p><h2><Link to={`/products/${item.product.slug}`}>{item.product.name}</Link></h2><span>{item.variant.size} / {item.variant.color} / {item.variant.sku}</span>{!item.variant.available && <strong>Only {item.variant.stockQty} units are currently available</strong>}</div>
                <div className="quantity-stepper"><button type="button" aria-label="Decrease quantity" disabled={item.qty <= 1 || update.isPending} onClick={() => update.mutate({ id: item.id, qty: item.qty - 1 })}><Minus /></button><span>{item.qty}</span><button type="button" aria-label="Increase quantity" disabled={update.isPending} onClick={() => { if (item.qty >= item.variant.stockQty) toast.error(`Only ${item.variant.stockQty} units are available`); else update.mutate({ id: item.id, qty: item.qty + 1 }) }}><Plus /></button></div>
                <strong className="cart-line-total">{money.format(Number(item.lineTotal))}</strong>
                <button className="icon-button remove-line" type="button" aria-label={`Remove ${item.product.name}`} onClick={() => remove.mutate(item.id)}><Trash2 /></button>
              </article>
            ))}
          </section>
          <aside className="order-summary">
            <p className="eyebrow">ORDER SUMMARY</p>
            <dl><div><dt>Subtotal</dt><dd>{money.format(Number(cart.data.subtotal))}</dd></div><div><dt>Shipping</dt><dd>Calculated at checkout</dd></div></dl>
            <div className="summary-total"><span>Current subtotal</span><strong>{money.format(Number(cart.data.subtotal))}</strong></div>
            <Link className="solid-button" to="/checkout">Continue to checkout <ArrowRight /></Link>
            <small>Prices, availability and the flat shipping fee are recalculated by the server.</small>
          </aside>
        </div>
      )}
    </div>
  )
}
