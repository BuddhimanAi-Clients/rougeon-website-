import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Copy, ImageOff, RefreshCw, ShieldAlert } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { apiRequest } from '../lib/api'
import type { ApiData, CheckoutResult, Order, PaymentInstructions } from '../types/commerce'

const money = new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR', maximumFractionDigits: 0 })

export function PaymentPage() {
  const { orderId = '' } = useParams()
  const location = useLocation()
  const queryClient = useQueryClient()
  const proofInput = useRef<HTMLInputElement>(null)
  const [proof, setProof] = useState<File | null>(null)
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
      setProof(null)
      if (proofInput.current) proofInput.current.value = ''
      void queryClient.invalidateQueries({ queryKey: ['order', orderId] })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Could not upload payment proof'),
  })

  async function copy(value: string, label: string) {
    await navigator.clipboard.writeText(value)
    toast.success(`${label} copied`)
  }

  if (instructions.isPending) return <div className="page-loading">Preparing payment instructions…</div>
  if (instructions.isError || !instructions.data) return <div className="collection-state page-state"><p>PAYMENT VIEW UNAVAILABLE</p><span>{instructions.error?.message}</span><Link to={`/orders/${orderId}`}>View order</Link></div>

  const data = instructions.data
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
          <div className="payment-amount"><span>Exact amount</span><strong>{money.format(Number(data.amount))}</strong></div>
          <dl><div><dt>Reference</dt><dd><button type="button" onClick={() => copy(data.reference, 'Reference')}>{data.reference}<Copy /></button></dd></div><div><dt>Method</dt><dd>Static QR</dd></div><div><dt>Order status</dt><dd>{order.data?.status ?? checkout?.order.status ?? 'pending'}</dd></div></dl>
          <p className="instruction-copy">{data.instructions}</p>
          {order.data?.payments[0]?.status === 'pending_verification' ? <div className="proof-unavailable"><Check /><div><strong>Proof received</strong><p>Your payment proof is awaiting a staff review. Refresh later for the updated status.</p></div></div> : <div className="proof-upload"><ShieldAlert /><div><strong>Upload your payment screenshot</strong><p>JPEG, PNG, or WebP only, up to 8 MB. Staff will review it before the order is confirmed.</p><input ref={proofInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setProof(event.target.files?.[0] ?? null)} />{proof && <small>{proof.name}</small>}</div></div>}
          <div className="payment-actions"><button className="solid-button" type="button" disabled={!proof || submitProof.isPending || order.data?.payments[0]?.status === 'pending_verification'} onClick={() => submitProof.mutate()}><Check /> {submitProof.isPending ? 'Uploading…' : 'Upload payment proof'}</button><button className="outline-button" type="button" onClick={() => { instructions.refetch(); order.refetch() }}><RefreshCw /> Refresh status</button></div>
          <Link className="text-link" to={`/orders/${orderId}`}>View complete order</Link>
        </section>
      </div>
    </div>
  )
}
