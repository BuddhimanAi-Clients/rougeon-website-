import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Product } from '../types/catalog'

const money = new Intl.NumberFormat('en-NP', {
  style: 'currency',
  currency: 'NPR',
  maximumFractionDigits: 0,
})

export function ProductCard({ product }: { product: Product }) {
  const image = product.images[0]

  return (
    <article className="product-card">
      <Link className="product-visual" to={`/products/${product.slug}`}>
        {image ? (
          <img src={image} alt={product.name} loading="lazy" />
        ) : (
          <div className="product-fallback" aria-hidden="true">
            <span>R</span>
          </div>
        )}
        {!product.available && <span className="availability sold-out">Sold out</span>}
      </Link>
      <div className="product-meta">
        <div>
          <p>{product.category.name}</p>
          <h3>{product.name}</h3>
        </div>
        <div className="product-price">
          <span>{product.minPrice ? money.format(Number(product.minPrice)) : '—'}</span>
          <ArrowUpRight aria-hidden="true" />
        </div>
      </div>
    </article>
  )
}
