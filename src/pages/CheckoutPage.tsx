import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, CheckCircle2, MapPin } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useCart } from '../hooks/useCart'
import { apiRequest } from '../lib/api'
import { authClient } from '../lib/auth-client'
import type { Address, ApiData, CheckoutResult } from '../types/commerce'

type MembershipInfo = { eligibleNetSpend: string; tier: { name: string; discountPercent: string; activatedAt: string | null } | null; nextTier: { name: string; remaining: string } | null }
type MembershipProfile = { complete: false; membership?: MembershipInfo } | { id: string; fullName: string; normalizedPhone: string; normalizedEmail: string; birthDate: string; preferredCalendar: 'AD' | 'BS'; membership?: MembershipInfo }

const money = new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR', maximumFractionDigits: 0 })

export function CheckoutPage() {
  const navigate = useNavigate()
  const { data: session, isPending: sessionPending } = authClient.useSession()
  const cart = useCart()
  const [addressId, setAddressId] = useState('')
  const [guest, setGuest] = useState({ name: '', email: '', phone: '', fullAddress: '', city: '' })
  const [guestWarning, setGuestWarning] = useState(false)
  const [guestConfirmed, setGuestConfirmed] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'qr' | 'cod'>('qr')
  const addresses = useQuery({
    queryKey: ['addresses'],
    enabled: Boolean(session),
    queryFn: async () => (await apiRequest<ApiData<Address[]>>('/api/v1/addresses')).data,
  })
  const membershipProfile = useQuery({ queryKey: ['customer-profile'], enabled: Boolean(session), queryFn: () => apiRequest<ApiData<MembershipProfile>>('/api/v1/customers/me') })
  const selectedAddressId = addressId || addresses.data?.find((address) => address.isDefault)?.id || addresses.data?.[0]?.id || ''
  const membership = membershipProfile.data?.data && 'membership' in membershipProfile.data.data ? membershipProfile.data.data.membership : undefined
  const membershipRate = Number(membership?.tier?.discountPercent ?? 0)
  const membershipDiscountPreview = Number(cart.data?.subtotal ?? 0) * membershipRate / 100

  const checkout = useMutation({
    mutationFn: async () => (await apiRequest<ApiData<CheckoutResult>>('/api/v1/checkout', {
      method: 'POST',
      body: JSON.stringify(session ? { shippingAddressId: selectedAddressId, paymentMethod } : { guest, paymentMethod }),
    })).data,
    onSuccess: (result) => navigate(`/payment/${result.order.id}`, { state: { checkout: result } }),
    onError: (error: Error & { code?: string }) => { if (error.code === 'CUSTOMER_PROFILE_REQUIRED') { navigate('/account?tab=profile&returnTo=%2Fcheckout'); return } toast.error(error.message) },
  })

  if (!sessionPending && !cart.isPending && (!cart.data || cart.data.items.length === 0)) return <Navigate to="/cart" replace />

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (session && !selectedAddressId) { toast.error('Add a delivery address first'); return }
    if (session && membershipProfile.data?.data && !('id' in membershipProfile.data.data)) { navigate('/account?tab=profile&returnTo=%2Fcheckout'); return }
    if (!session && !guestConfirmed) { setGuestWarning(true); return }
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
              <label><span>Email for receipt</span><input required type="email" maxLength={320} value={guest.email} onChange={(event) => setGuest({ ...guest, email: event.target.value })} /></label>
              <label><span>Phone</span><input required minLength={5} maxLength={30} inputMode="tel" value={guest.phone} onChange={(event) => setGuest({ ...guest, phone: event.target.value })} /></label>
              <label className="wide"><span>Full address</span><textarea required minLength={5} maxLength={2000} rows={4} value={guest.fullAddress} onChange={(event) => setGuest({ ...guest, fullAddress: event.target.value })} /></label>
              <label className="wide"><span>City</span><input required maxLength={120} value={guest.city} onChange={(event) => setGuest({ ...guest, city: event.target.value })} /></label>
            </div>
          )}
          {!session && <p className="checkout-login-note">Already have saved details? <Link to="/auth/sign-in" state={{ from: '/checkout' }}>Sign in before checkout</Link>.</p>}
          {session && membershipProfile.data?.data && !('id' in membershipProfile.data.data) && <div className="inline-empty membership-profile-callout"><p><strong>One quick step before payment.</strong><br/>Add your name, phone and date of birth so this purchase can earn membership progress.</p><Link className="solid-button" to="/account?tab=profile&returnTo=%2Fcheckout">Complete profile <ArrowRight /></Link></div>}
          <div className="checkout-step-title second"><span>02</span><div><h2>Static QR payment</h2><p>The exact QR, amount and payment reference appear after the order is created.</p></div></div>
          <div className="payment-method-choice" role="radiogroup" aria-label="Payment method"><label className={paymentMethod === 'qr' ? 'selected' : ''}><input type="radio" name="paymentMethod" checked={paymentMethod === 'qr'} onChange={() => setPaymentMethod('qr')} /><strong>Pay in full online</strong><span>Pay the complete order total by QR.</span></label><label className={paymentMethod === 'cod' ? 'selected' : ''}><input type="radio" name="paymentMethod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} /><strong>Cash on delivery</strong><span>Pay shipping now by QR. Any configured merchandise advance is shown before payment; NCM collects the balance on delivery.</span></label></div>
        </section>
        <aside className="order-summary checkout-summary">
          <p className="eyebrow">YOUR ORDER</p>
          <div className="checkout-lines">{cart.data?.items.map((item) => <div key={item.id}><span>{item.qty} × {item.product.name}<small>{item.variant.size} / {item.variant.color}</small></span><strong>{money.format(Number(item.lineTotal))}</strong></div>)}</div>
          <dl><div><dt>Subtotal</dt><dd>{money.format(Number(cart.data?.subtotal ?? 0))}</dd></div>{session && membership && <><div><dt>Membership</dt><dd>{membership.tier?.name ?? 'No membership'} · {membership.tier?.discountPercent ?? '0'}%</dd></div>{membershipRate > 0 && <><div><dt>Member discount (estimated)</dt><dd>−{money.format(membershipDiscountPreview)}</dd></div><div><dt>Merchandise after discount</dt><dd>{money.format(Number(cart.data?.subtotal ?? 0) - membershipDiscountPreview)}</dd></div></>}<div><dt>Eligible this year</dt><dd>{money.format(Number(membership.eligibleNetSpend ?? 0))}</dd></div>{membership.nextTier && <div><dt>Next tier</dt><dd>{membership.nextTier.name}: {money.format(Number(membership.nextTier.remaining))} to go</dd></div>}</>}<div><dt>Shipping</dt><dd>Server calculated</dd></div></dl>
          <button className="solid-button" type="submit" disabled={checkout.isPending || (Boolean(session) && (!selectedAddressId || (membershipProfile.data?.data !== undefined && !('id' in membershipProfile.data.data))))}>{checkout.isPending ? 'Creating order…' : paymentMethod === 'cod' ? 'Continue to COD advance payment' : 'Create order & view QR'} <ArrowRight /></button>
          <small>Submitting consumes the full cart once. Stock is validated now and deducted only after Admin payment confirmation.</small>
        </aside>
      </form>
      {guestWarning && <div className="guest-membership-warning" role="dialog" aria-modal="true" aria-labelledby="guest-membership-title"><section><p>ROGUEON MEMBERSHIP</p><h2 id="guest-membership-title">Continue as guest?</h2><span>Guest purchases do not earn ROGUEON membership progress or member discounts. Sign in or create an account to unlock future rewards.</span><div><button className="outline-button" type="button" onClick={() => navigate('/auth/sign-in', { state: { from: '/checkout' } })}>Sign in / Create account</button><button className="solid-button" type="button" onClick={() => { setGuestConfirmed(true); setGuestWarning(false) }}>Continue as guest</button></div></section></div>}
    </div>
  )
}
