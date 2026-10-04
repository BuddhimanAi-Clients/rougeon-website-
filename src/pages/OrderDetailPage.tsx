import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ExternalLink, MapPin, PackageCheck } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { apiRequest } from '../lib/api'
import { usePageTitle } from '../hooks/usePageTitle'
import type { ApiData, Order } from '../types/commerce'

const money = new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR', maximumFractionDigits: 0 })

export function OrderDetailPage() {
  usePageTitle('Order details')
  const { orderId = '' } = useParams()
  const order = useQuery({ queryKey: ['order', orderId], refetchInterval: 30_000, queryFn: async () => (await apiRequest<ApiData<Order>>('/api/v1/orders/' + orderId)).data })
  if (order.isPending) return <div className="page-loading">Loading order…</div>
  if (order.isError || !order.data) return <div className="collection-state page-state"><p>ORDER NOT FOUND</p><span>This order is not available to the current account or guest browser.</span><Link to="/">Return home</Link></div>
  const data = order.data
  const currentPayment = data.payments[0]
  return <div className="page-shell order-detail-page">
    <Link className="back-link" to="/orders"><ArrowLeft /> Order history</Link>
    <header className="order-detail-head"><div><p>ORDER REFERENCE</p><h1>{data.orderNumber}</h1><span>Placed {new Date(data.createdAt).toLocaleString()}</span></div><div><em className={'status-pill ' + data.status}>{data.status}</em><em className={'status-pill ' + (currentPayment?.status === 'pending_verification' ? 'pending' : data.paymentStatus)}>{currentPayment?.status === 'pending_verification' ? 'proof submitted — pending verification' : data.paymentStatus}</em></div></header>
    <div className="order-detail-grid">
      <section className="order-detail-lines"><h2>Items</h2>{data.status === 'pending' && <p className="pending-stock-note">Unpaid orders do not reserve stock. Availability below is checked live before you upload payment proof.</p>}{data.items.map(item => <article key={item.id}><div className="order-item-image">{item.productImageUrl ? <img src={item.productImageUrl} alt={item.productName} /> : <span>R</span>}</div><div><p>{item.variantSku}</p><h3>{item.productName}</h3><span>{item.variantSize} / {item.variantColor} / Qty {item.qty}</span>{data.status === 'pending' && <small className={item.stockAvailable ? 'item-stock available' : 'item-stock unavailable'}>{item.stockAvailable ? item.currentStockQty + ' in stock now' : 'Sold out / insufficient stock now'} · you need {item.qty}</small>}</div><strong>{money.format(Number(item.lineTotal))}</strong></article>)}</section>
      <aside className="order-detail-aside">
        <section><h2><MapPin /> Delivery</h2><strong>{data.delivery.name}</strong><p>{data.delivery.fullAddress}<br />{data.delivery.city}<br />{data.delivery.phone}</p></section>
        <section><h2><PackageCheck /> Tracking</h2><p>{data.shipment?.carrierOrderId ? 'Nepal Can Move: ' + data.shipment.carrierOrderId : data.trackingRef ?? 'Tracking reference has not been assigned.'}</p>{data.shipment?.events?.length ? <ol>{data.shipment.events.map(event => <li key={event.event + '-' + event.receivedAt}><strong>{event.status}</strong><small>{new Date(event.occurredAt ?? event.receivedAt).toLocaleString()}</small></li>)}</ol> : data.shipment?.bookingStatus === 'booked' ? <p>Shipment booked. Tracking updates will appear here after pickup.</p> : null}</section>
        {data.refundStatus && <section><h2>COD advance refund</h2><p><strong>{data.refundStatus === 'completed' ? 'Refund completed' : 'Refund pending'}</strong><br />{money.format(Number(data.refundAmount ?? 0))} · {data.refundReason ?? 'Manual refund'}</p><small>{data.refundStatus === 'completed' ? 'Staff has recorded the manual refund as completed.' : 'Staff will return the prepaid advance manually and update this order when done.'}</small></section>}
        <section className="totals-card"><dl><div><dt>Merchandise subtotal</dt><dd>{money.format(Number(data.subtotal))}</dd></div><div><dt>Membership</dt><dd>{data.membershipTierSnapshot?.name ?? 'No membership'} ({Number(data.membershipDiscountPercent)}%)</dd></div><div><dt>Member discount</dt><dd>−{money.format(Number(data.merchandiseDiscount))}</dd></div><div><dt>NCM delivery fee</dt><dd>{money.format(Number(data.shippingDeliveryFee))}</dd></div><div><dt>NCM pickup charge</dt><dd>{money.format(Number(data.shippingPickupFee))}</dd></div><div><dt>Shipping total</dt><dd>{money.format(Number(data.shippingFee))}</dd></div>{data.paymentMethod === 'cod' && <><div><dt>Merchandise advance · {Number(data.codMerchandiseAdvancePercent)}%</dt><dd>{money.format(Math.max(0, Number(data.advancePaymentAmount) - Number(data.shippingFee)))}</dd></div><div><dt>COD advance paid now</dt><dd>{money.format(Number(data.advancePaymentAmount))}</dd></div><div><dt>Pay NCM on delivery</dt><dd>{money.format(Number(data.codCollectionAmount))}</dd></div></>}<div><dt>Total</dt><dd>{money.format(Number(data.total))}</dd></div></dl></section>
        {currentPayment?.status === 'awaiting_proof' && <Link className="solid-button" to={'/payment/' + data.id}>View payment instructions <ExternalLink /></Link>}
      </aside>
    </div>
  </div>
}
