import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Copy, ImageOff, RefreshCw, ShieldAlert, X } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { apiRequest } from '../lib/api'
import { usePageTitle } from '../hooks/usePageTitle'
import type { ApiData, CheckoutResult, Order, PaymentInstructions } from '../types/commerce'

const money = new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR', maximumFractionDigits: 0 })

export function PaymentPage() {
  usePageTitle('Payment')
  const { orderId = '' } = useParams()
  const location = useLocation()
  const queryClient = useQueryClient()
  const proofInput = useRef<HTMLInputElement>(null)
  const [proof, setProof] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)
  const [proofError, setProofError] = useState<string | null>(null)
  const checkout = (location.state as { checkout?: CheckoutResult } | null)?.checkout
  const instructions = useQuery({
    queryKey: ['payment-instructions', orderId],
    initialData: checkout?.paymentInstructions,
    queryFn: async () => (await apiRequest<ApiData<PaymentInstructions>>(`/api/v1/orders/${orderId}/payment-instructions`)).data,
  })
  const order = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => (await apiRequest<ApiData<Order>>(`/api/v1/orders/${orderId}`)).data,
  })
  const submitProof = useMutation({
    mutationFn: async () => {
      if (!proof) throw new Error('Choose a JPEG, PNG, or WebP payment screenshot first')
      const body = new FormData()
      body.append('screenshot', proof)
      return apiRequest(`/api/v1/orders/${orderId}/payment-proof`, { method: 'POST', body })
    },
    onSuccess: () => {
      toast.success('Payment proof submitted for verification')
      clearProof()
      void queryClient.invalidateQueries({ queryKey: ['order', orderId] })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Could not upload payment proof'),
  })

  async function copy(value: string, label: string) {
    await navigator.clipboard.writeText(value)
    toast.success(`${label} copied`)
  }
  function clearProof() {
    if (proofPreview) URL.revokeObjectURL(proofPreview)
    setProof(null); setProofPreview(null); setProofError(null)
    if (proofInput.current) proofInput.current.value = ''
  }
  function selectProof(next: File | undefined) {
    clearProof()
    if (!next) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(next.type)) { setProofError('Choose a JPEG, PNG, or WebP image.'); return }
    if (next.size > 8 * 1024 * 1024) { setProofError('Payment proof must be 8 MB or smaller.'); return }
    setProof(next); setProofPreview(URL.createObjectURL(next))
  }

  if (instructions.isPending && order.isPending) return <div className="page-loading">Preparing payment instructions…</div>
  // A proof in staff review is deliberately no longer payment-eligible. That is
  // a normal state, not a broken payment page, including after a refresh.
  if ((instructions.isError || !instructions.data) && order.data?.payments[0]?.status === 'pending_verification') return <div className="payment-page page-shell"><header className="payment-heading"><p>ORDER {order.data.orderNumber}</p><h1>PROOF<br />SUBMITTED.</h1></header><div className="proof-unavailable"><Check /><div><strong>Pending verification</strong><p>Your payment screenshot has been received. Staff will verify it before marking this order as paid. You do not need to upload it again.</p></div></div><Link className="solid-button" to={`/orders/${orderId}`}>View order status</Link></div>
  if (instructions.isError || !instructions.data) return <div className="collection-state page-state"><p>PAYMENT VIEW UNAVAILABLE</p><span>{instructions.error instanceof Error ? instructions.error.message : 'Payment instructions could not be loaded.'}</span><Link to={`/orders/${orderId}`}>View order</Link></div>

  const data = instructions.data
  const displayedOrder = order.data ?? checkout?.order
  const isCod = displayedOrder?.paymentMethod === 'cod'
  const codMerchandiseAdvance = Math.max(0, Number(displayedOrder?.advancePaymentAmount ?? 0) - Number(displayedOrder?.shippingFee ?? 0))
  const unavailableItem = order.data?.items.find((item) => !item.stockAvailable)
  return (
    <div className="payment-page page-shell">
      <header className="payment-heading"><p>ORDER {data.reference}</p><h1>SCAN.<br />PAY EXACTLY.<br />KEEP PROOF.</h1></header>
      <div className="payment-layout">
        <section className="qr-panel">
          <div className="qr-frame">{data.qrImageUrl ? <img src={data.qrImageUrl} alt={`Payment QR for ${data.providerName}`} /> : <ImageOff />}</div>
          <p>{data.providerName}</p><strong>{data.accountName}</strong>
          <button type="button" onClick={() => copy(data.accountIdentifier, 'Account identifier')}>{data.accountIdentifier} <Copy /></button>
        </section>
        <section className="payment-details">
          <p className="eyebrow">PAYMENT INSTRUCTIONS</p>
          <div className="payment-amount"><span>{isCod ? 'COD advance due now' : 'Exact amount'}<small>Only pay the stated amount.</small></span><strong>{money.format(Number(data.amount))}</strong></div>{isCod && <><div className="payment-breakdown"><div><span>Delivery</span><strong>{money.format(Number(displayedOrder?.shippingFee ?? 0))}</strong></div><div><span>Merchandise advance · {Number(displayedOrder?.codMerchandiseAdvancePercent ?? 0)}%</span><strong>{money.format(codMerchandiseAdvance)}</strong></div><div className="payment-breakdown-total"><span>Total QR advance</span><strong>{money.format(Number(displayedOrder?.advancePaymentAmount ?? 0))}</strong></div><div><span>{displayedOrder?.shippingDeliveryType === 'Door2Branch' ? 'Pay NCM at collection' : 'Pay NCM on delivery'}</span><strong>{money.format(Number(displayedOrder?.codCollectionAmount ?? 0))}</strong></div></div><div className="proof-unavailable"><ShieldAlert /><div><strong>Cash on delivery</strong><p>After this advance is verified, pay {money.format(Number(displayedOrder?.codCollectionAmount ?? 0))} {displayedOrder?.shippingDeliveryType === 'Door2Branch' ? `at the Nepal Can Move ${displayedOrder.shippingBranch ?? ''} branch when you collect your order.` : 'to Nepal Can Move when your order is delivered.'}</p></div></div></>}
          <dl><div><dt>Reference</dt><dd><button type="button" onClick={() => copy(data.reference, 'Reference')}>{data.reference}<Copy /></button></dd></div><div><dt>Method</dt><dd>Static QR</dd></div><div><dt>Order status</dt><dd>{order.data?.status ?? checkout?.order.status ?? 'pending'}</dd></div></dl>
          <p className="instruction-copy">{data.instructions}</p>
          {unavailableItem && <div className="proof-unavailable stock-warning"><ShieldAlert /><div><strong>This unpaid order can no longer be paid</strong><p>{unavailableItem.productName} now has {unavailableItem.currentStockQty} in stock, but this order needs {unavailableItem.qty}. Update your bag and create a new order instead.</p></div></div>}
          {order.data?.payments[0]?.status === 'pending_verification' ? <div className="proof-unavailable"><Check /><div><strong>Proof received</strong><p>Your payment proof is awaiting a staff review. Refresh later for the updated status.</p></div></div> : <div className="proof-upload"><ShieldAlert /><div><strong>Upload your payment screenshot</strong><p>JPEG, PNG, or WebP only, up to 8 MB. Staff will review it before the order is confirmed.</p><input ref={proofInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => selectProof(event.target.files?.[0])}/>{proofError && <small role="alert">{proofError}</small>}{proof && <div className="selected-upload">{proofPreview && <img src={proofPreview} alt="Selected payment proof preview"/>}<span><strong>{proof.name}</strong><small>{Math.ceil(proof.size / 1024)} KB</small></span><button type="button" aria-label="Remove selected payment proof" onClick={clearProof}><X/></button></div>}</div></div>}
          <div className="payment-actions"><button className="solid-button" type="button" disabled={!proof || Boolean(unavailableItem) || submitProof.isPending || order.data?.payments[0]?.status === 'pending_verification'} onClick={() => submitProof.mutate()}><Check /> {submitProof.isPending ? 'Uploading…' : 'Upload payment proof'}</button><button className="outline-button" type="button" onClick={() => { instructions.refetch(); order.refetch() }}><RefreshCw /> Refresh status</button></div>
          <Link className="text-link" to={`/orders/${orderId}`}>View complete order</Link>
        </section>
      </div>
    </div>
  )
}
