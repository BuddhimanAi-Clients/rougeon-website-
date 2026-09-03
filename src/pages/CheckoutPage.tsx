import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, CheckCircle2, MapPin } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useCart } from '../hooks/useCart'
import { apiRequest } from '../lib/api'
import { authClient } from '../lib/auth-client'
import type { Address, ApiData, CheckoutResult } from '../types/commerce'

const money = new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR', maximumFractionDigits: 0 })

export function CheckoutPage() {
  const navigate = useNavigate()
  const { data: session, isPending: sessionPending } = authClient.useSession()
  const cart = useCart()
  const [addressId, setAddressId] = useState('')
  const [guest, setGuest] = useState({ name: '', phone: '', fullAddress: '', city: '' })
  const addresses = useQuery({
    queryKey: ['addresses'],
    enabled: Boolean(session),
    queryFn: async () => (await apiRequest<ApiData<Address[]>>('/api/v1/addresses')).data,
  })
  const selectedAddressId = addressId || addresses.data?.find((address) => address.isDefault)?.id || addresses.data?.[0]?.id || ''

  const checkout = useMutation({
    mutationFn: async () => (await apiRequest<ApiData<CheckoutResult>>('/api/v1/checkout', {
      method: 'POST',
      body: JSON.stringify(session ? { shippingAddressId: selectedAddressId } : { guest }),
    })).data,
    onSuccess: (result) => navigate(`/payment/${result.order.id}`, { state: { checkout: result } }),
    onError: (error) => toast.error(error.message),
  })

  if (!sessionPending && !cart.isPending && (!cart.data || cart.data.items.length === 0)) return <Navigate to="/cart" replace />

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (session && !selectedAddressId) { toast.error('Add a delivery address first'); return }
    checkout.mutate()
  }

  return (
    <div className="page-shell checkout-page">
      <Link className="back-link" to="/cart"><ArrowLeft /> Return to bag</Link>
      <header className="checkout-heading"><p>SECURE CHECKOUT / FULL CART</p><h1>DELIVERY.<br />THEN PAYMENT.</h1></header>
      <form className="checkout-layout" onSubmit={submit}>
        <section className="checkout-form-panel">
          <div className="checkout-step-title"><span>01</span><div><h2>Delivery details</h2><p>{session ? 'Choose one of your saved addresses.' : 'Guest details are used for this order only.'}</p></div></div>
          {session ? (
            addresses.isPending ? <div className="form-loading">Loading saved addresses…</div> : addresses.data?.length ? (
              <div className="address-options">{addresses.data.map((address) => (
                <label className={selectedAddressId === address.id ? 'selected' : ''} key={address.id}>
                  <input type="radio" name="address" value={address.id} checked={selectedAddressId === address.id} onChange={() => setAddressId(address.id)} />
                  <MapPin /><span><strong>{address.label}{address.isDefault && <em>Default</em>}</strong>{address.fullAddress}<small>{address.city} / {address.phone}</small></span>{selectedAddressId === address.id && <CheckCircle2 />}
                </label>
              ))}</div>
            ) : (
              <div className="inline-empty"><MapPin /><p>No saved delivery address.</p><Link to="/account?tab=addresses">Add an address</Link></div>
            )
          ) : (
            <div className="guest-grid">
              <label><span>Full name</span><input required maxLength={120} value={guest.name} onChange={(event) => setGuest({ ...guest, name: event.target.value })} /></label>
              <label><span>Phone</span><input required minLength={5} maxLength={30} inputMode="tel" value={guest.phone} onChange={(event) => setGuest({ ...guest, phone: event.target.value })} /></label>
              <label className="wide"><span>Full address</span><textarea required minLength={5} maxLength={2000} rows={4} value={guest.fullAddress} onChange={(event) => setGuest({ ...guest, fullAddress: event.target.value })} /></label>
              <label className="wide"><span>City</span><input required maxLength={120} value={guest.city} onChange={(event) => setGuest({ ...guest, city: event.target.value })} /></label>
            </div>
          )}
          {!session && <p className="checkout-login-note">Already have saved details? <Link to="/auth/sign-in" state={{ from: '/checkout' }}>Sign in before checkout</Link>.</p>}
          <div className="checkout-step-title second"><span>02</span><div><h2>Static QR payment</h2><p>The exact QR, amount and payment reference appear after the order is created.</p></div></div>
        </section>
        <aside className="order-summary checkout-summary">
          <p className="eyebrow">YOUR ORDER</p>
          <div className="checkout-lines">{cart.data?.items.map((item) => <div key={item.id}><span>{item.qty} × {item.product.name}<small>{item.variant.size} / {item.variant.color}</small></span><strong>{money.format(Number(item.lineTotal))}</strong></div>)}</div>
          <dl><div><dt>Subtotal</dt><dd>{money.format(Number(cart.data?.subtotal ?? 0))}</dd></div><div><dt>Shipping</dt><dd>Server calculated</dd></div></dl>
          <button className="solid-button" type="submit" disabled={checkout.isPending || (Boolean(session) && !selectedAddressId)}>{checkout.isPending ? 'Creating order…' : 'Create order & view QR'} <ArrowRight /></button>
          <small>Submitting consumes the full cart once. Stock is validated now and deducted only after Admin payment confirmation.</small>
        </aside>
      </form>
    </div>
  )
}
