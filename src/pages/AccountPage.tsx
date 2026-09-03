import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Heart, LogOut, MapPin, Plus, Star, Trash2 } from 'lucide-react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { apiRequest } from '../lib/api'
import { authClient } from '../lib/auth-client'
import type { Address, ApiData, WishlistItem } from '../types/commerce'

export function AccountPage() {
  const { data: session, isPending } = authClient.useSession()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') ?? 'addresses'
  const queryClient = useQueryClient()
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [address, setAddress] = useState({ label: '', fullAddress: '', city: '', phone: '', isDefault: false })
  const addresses = useQuery({ queryKey: ['addresses'], enabled: Boolean(session), queryFn: async () => (await apiRequest<ApiData<Address[]>>('/api/v1/addresses')).data })
  const wishlist = useQuery({ queryKey: ['wishlist'], enabled: Boolean(session), queryFn: async () => (await apiRequest<ApiData<WishlistItem[]>>('/api/v1/wishlist')).data })
  const createAddress = useMutation({ mutationFn: () => apiRequest('/api/v1/addresses', { method: 'POST', body: JSON.stringify(address) }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['addresses'] }); setShowAddressForm(false); setAddress({ label: '', fullAddress: '', city: '', phone: '', isDefault: false }); toast.success('Address saved') }, onError: (error) => toast.error(error.message) })
  const deleteAddress = useMutation({ mutationFn: (id: string) => apiRequest(`/api/v1/addresses/${id}`, { method: 'DELETE' }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }), onError: (error) => toast.error(error.message) })
  const makeDefault = useMutation({ mutationFn: (id: string) => apiRequest(`/api/v1/addresses/${id}/default`, { method: 'PATCH' }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }), onError: (error) => toast.error(error.message) })
  const removeWishlist = useMutation({ mutationFn: (id: string) => apiRequest(`/api/v1/wishlist/items/${id}`, { method: 'DELETE' }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] }), onError: (error) => toast.error(error.message) })

  if (!isPending && !session) return <Navigate to="/auth/sign-in" state={{ from: '/account' }} replace />
  const user = session?.user as { name?: string; email?: string; phone?: string | null } | undefined

  return (
    <div className="page-shell account-page">
      <header className="account-head"><div><p>ROGUEON MEMBER</p><h1>{user?.name ?? 'ACCOUNT'}</h1><span>{user?.email}</span></div><button className="outline-button" type="button" onClick={async () => { await authClient.signOut(); window.location.assign('/') }}>Sign out <LogOut /></button></header>
      <nav className="account-tabs"><button className={tab === 'addresses' ? 'active' : ''} onClick={() => setParams({ tab: 'addresses' })}>Addresses</button><button className={tab === 'wishlist' ? 'active' : ''} onClick={() => setParams({ tab: 'wishlist' })}>Wishlist</button></nav>
      {tab === 'addresses' ? (
        <section className="account-section">
          <div className="account-section-head"><div><p>DELIVERY BOOK</p><h2>Saved addresses</h2></div><button className="solid-button" type="button" onClick={() => setShowAddressForm(!showAddressForm)}><Plus /> Add address</button></div>
          {showAddressForm && <form className="address-form" onSubmit={(event) => { event.preventDefault(); createAddress.mutate() }}><label><span>Label</span><input required maxLength={80} placeholder="Home" value={address.label} onChange={(event) => setAddress({ ...address, label: event.target.value })} /></label><label><span>Phone</span><input required minLength={5} maxLength={30} value={address.phone} onChange={(event) => setAddress({ ...address, phone: event.target.value })} /></label><label className="wide"><span>Full address</span><textarea required minLength={5} maxLength={2000} rows={3} value={address.fullAddress} onChange={(event) => setAddress({ ...address, fullAddress: event.target.value })} /></label><label><span>City</span><input required maxLength={120} value={address.city} onChange={(event) => setAddress({ ...address, city: event.target.value })} /></label><label className="checkbox-label"><input type="checkbox" checked={address.isDefault} onChange={(event) => setAddress({ ...address, isDefault: event.target.checked })} /> Make default</label><button className="solid-button" type="submit" disabled={createAddress.isPending}>Save address <ArrowRight /></button></form>}
          <div className="address-grid">{addresses.data?.map((item) => <article className="address-card" key={item.id}><MapPin /><div><h3>{item.label}{item.isDefault && <span>Default</span>}</h3><p>{item.fullAddress}<br />{item.city}<br />{item.phone}</p></div><div>{!item.isDefault && <button type="button" aria-label={`Make ${item.label} default`} onClick={() => makeDefault.mutate(item.id)}><Star /></button>}<button type="button" aria-label={`Delete ${item.label}`} onClick={() => deleteAddress.mutate(item.id)}><Trash2 /></button></div></article>)}</div>
          {!addresses.isPending && !addresses.data?.length && !showAddressForm && <div className="inline-empty"><MapPin /><p>No saved addresses.</p></div>}
        </section>
      ) : (
        <section className="account-section"><div className="account-section-head"><div><p>SAVED FOR LATER</p><h2>Your wishlist</h2></div></div>{wishlist.data?.length ? <div className="wishlist-grid">{wishlist.data.map((item) => <article key={item.id}><Link className="wishlist-image" to={`/products/${item.product.slug}`}>{item.product.images[0] ? <img src={item.product.images[0]} alt={item.product.name} /> : <span>R</span>}</Link><div><p>{item.variant.size} / {item.variant.color}</p><h3>{item.product.name}</h3><strong>NPR {Number(item.variant.price).toLocaleString()}</strong></div><button type="button" aria-label={`Remove ${item.product.name} from wishlist`} onClick={() => removeWishlist.mutate(item.variant.id)}><Heart fill="currentColor" /></button></article>)}</div> : !wishlist.isPending && <div className="inline-empty"><Heart /><p>Your wishlist is empty.</p><Link to="/shop">Browse products</Link></div>}</section>
      )}
    </div>
  )
}
