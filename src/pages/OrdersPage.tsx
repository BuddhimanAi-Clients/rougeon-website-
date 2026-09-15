import { useQuery } from '@tanstack/react-query'
import { ArrowRight, PackageOpen } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { apiRequest } from '../lib/api'
import { authClient } from '../lib/auth-client'
import type { Order } from '../types/commerce'

type OrderList = { data: Order[]; pagination: { page: number; limit: number; total: number; totalPages: number } }
const money = new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR', maximumFractionDigits: 0 })

export function OrdersPage() {
  const { data: session } = authClient.useSession()
  const [params, setParams] = useSearchParams()
  const orders = useQuery({
    queryKey: ['orders', params.toString()],
    refetchInterval: 30_000,
    queryFn: () => apiRequest<OrderList>(`/api/v1/orders?${new URLSearchParams({ limit: '10', ...Object.fromEntries(params) })}`),
  })

  return (
    <div className="page-shell orders-page">
      <header className="page-hero compact"><p>{session ? 'ACCOUNT / HISTORY' : 'GUEST / HISTORY'}</p><h1>YOUR ORDERS.</h1><span>{session ? 'Orders from this account.' : 'Orders placed from this browser.'}</span></header>
      <div className="order-filters">{['', 'pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'].map((status) => <button className={(params.get('status') ?? '') === status ? 'active' : ''} type="button" key={status || 'all'} onClick={() => setParams(status ? { status } : {})}>{status || 'All'}</button>)}</div>
      {orders.isPending ? <div className="page-loading">Loading order history…</div> : orders.data?.data.length ? (
        <div className="orders-list">{orders.data.data.map((order) => { const proofPending = order.payments[0]?.status === 'pending_verification'; const paymentLabel = proofPending ? 'proof submitted' : order.paymentStatus; return <Link to={`/orders/${order.id}`} className="order-row" key={order.id}><span className="order-row-number">{order.orderNumber}</span><span><small>Placed</small>{new Date(order.createdAt).toLocaleDateString()}</span><span><small>Order</small><em className={`status-pill ${order.status}`}>{order.status}</em></span><span><small>Payment</small><em className={`status-pill ${proofPending ? 'pending' : order.paymentStatus}`}>{paymentLabel}</em></span><strong>{money.format(Number(order.total))}</strong><ArrowRight /></Link> })}</div>
      ) : (
        <div className="empty-bag"><PackageOpen /><h2>NO ORDERS HERE.</h2><p>{session ? 'Completed website checkouts will appear in this account.' : 'Guest orders are only visible in the browser used at checkout.'}</p><Link className="solid-button" to="/shop">Browse collection <ArrowRight /></Link></div>
      )}
    </div>
  )
}
