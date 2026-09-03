import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ExternalLink, MapPin, PackageCheck } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { apiRequest } from '../lib/api'
import type { ApiData, Order } from '../types/commerce'

const money = new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR', maximumFractionDigits: 0 })

export function OrderDetailPage() {
  const { orderId = '' } = useParams()
  const order = useQuery({ queryKey: ['order', orderId], queryFn: async () => (await apiRequest<ApiData<Order>>(`/api/v1/orders/${orderId}`)).data })
  if (order.isPending) return <div className="page-loading">Loading order…</div>
  if (order.isError || !order.data) return <div className="collection-state page-state"><p>ORDER NOT FOUND</p><span>This order is not available to the current account or guest browser.</span><Link to="/">Return home</Link></div>
  const currentPayment = order.data.payments[0]
  return (
    <div className="page-shell order-detail-page">
      <Link className="back-link" to="/orders"><ArrowLeft /> Order history</Link>
      <header className="order-detail-head"><div><p>ORDER REFERENCE</p><h1>{order.data.orderNumber}</h1><span>Placed {new Date(order.data.createdAt).toLocaleString()}</span></div><div><em className={`status-pill ${order.data.status}`}>{order.data.status}</em><em className={`status-pill ${order.data.paymentStatus}`}>{order.data.paymentStatus}</em></div></header>
      <div className="order-detail-grid">
        <section className="order-detail-lines"><h2>Items</h2>{order.data.items.map((item) => <article key={item.id}><div className="order-item-image">{item.productImageUrl ? <img src={item.productImageUrl} alt={item.productName} /> : <span>R</span>}</div><div><p>{item.variantSku}</p><h3>{item.productName}</h3><span>{item.variantSize} / {item.variantColor} / Qty {item.qty}</span></div><strong>{money.format(Number(item.lineTotal))}</strong></article>)}</section>
        <aside className="order-detail-aside">
          <section><h2><MapPin /> Delivery</h2><strong>{order.data.delivery.name}</strong><p>{order.data.delivery.fullAddress}<br />{order.data.delivery.city}<br />{order.data.delivery.phone}</p></section>
          <section><h2><PackageCheck /> Tracking</h2><p>{order.data.trackingRef ?? 'Tracking reference has not been assigned.'}</p></section>
          <section className="totals-card"><dl><div><dt>Subtotal</dt><dd>{money.format(Number(order.data.subtotal))}</dd></div><div><dt>Shipping</dt><dd>{money.format(Number(order.data.shippingFee))}</dd></div><div><dt>Total</dt><dd>{money.format(Number(order.data.total))}</dd></div></dl></section>
          {currentPayment?.status === 'awaiting_proof' && <Link className="solid-button" to={`/payment/${order.data.id}`}>View payment instructions <ExternalLink /></Link>}
        </aside>
      </div>
    </div>
  )
}
