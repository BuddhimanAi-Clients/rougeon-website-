import { useQuery } from '@tanstack/react-query'
import { ArrowDown, ArrowRight, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ProductCard } from '../components/ProductCard'
import { apiRequest } from '../lib/api'
import type { PaginatedProducts } from '../types/catalog'
import type { ApiData, Category } from '../types/commerce'
import landingVideo from '../assets/landing_page_video.mp4'

export function HomePage() {
  const products = useQuery({
    queryKey: ['products', 'newest'],
    queryFn: () =>
      apiRequest<PaginatedProducts>('/api/v1/products?sort=newest&limit=4'),
  })
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await apiRequest<ApiData<Category[]>>('/api/v1/categories')).data,
  })
  const shopCategories = categories.data?.flatMap((category) => category.children.length ? category.children : [category]).slice(0, 3) ?? []

  return (
    <>
        <section className="hero-section">
          <video className="hero-video" autoPlay muted loop playsInline preload="metadata" aria-hidden="true"><source src={landingVideo} type="video/mp4" /></video>
          <div className="hero-video-overlay" aria-hidden="true" />
          <div className="hero-noise" aria-hidden="true" />
          <div className="hero-copy">
            <p className="eyebrow"><Star aria-hidden="true" /> RGN / DROP 001</p>
            <h1>BREAK RULES.<br />NOT CHARACTER.</h1>
            <p className="hero-note">
              Uniforms for the independently minded. Designed in Nepal for wherever you move next.
            </p>
            <a className="primary-cta" href="#new-drop">
              Shop the drop <ArrowDown aria-hidden="true" />
            </a>
          </div>
          <div className="hero-index" aria-hidden="true">EST. 2026 — KTM</div>
        </section>

        {shopCategories.length > 0 && <section className="category-section" id="categories">
          <div className="section-heading">
            <p>Shop by category</p>
            <h2>EXPLORE THE COLLECTION</h2>
          </div>
          <div className="category-grid">
            {shopCategories.map((category, index) => (
              <Link className={`category-card ${['hoodies', 'tees', 'bottoms'][index] ?? 'tees'}`} to={`/shop?categorySlug=${encodeURIComponent(category.slug)}`} key={category.id}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h3>{category.name}</h3>
                <ArrowRight aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>}

        <section className="products-section" id="new-drop">
          <div className="section-heading section-heading-row">
            <div>
              <p>Recently released</p>
              <h2>NEW DROP</h2>
            </div>
            <Link to="/shop?sort=newest">View collection <ArrowRight aria-hidden="true" /></Link>
          </div>

          {products.isPending ? (
            <div className="product-grid" aria-label="Loading new products">
              {Array.from({ length: 4 }).map((_, index) => (
                <div className="product-skeleton" key={index} />
              ))}
            </div>
          ) : products.isError ? (
            <div className="collection-state">
              <p>THE RACK IS OFFLINE</p>
              <span>Start the backend to load the current collection.</span>
              <button type="button" onClick={() => products.refetch()}>Try again</button>
            </div>
          ) : products.data.data.length === 0 ? (
            <div className="collection-state">
              <p>THE NEXT DROP IS LOADING</p>
              <span>Active products will appear here as soon as they are published.</span>
            </div>
          ) : (
            <div className="product-grid">
              {products.data.data.map((product) => (
                <ProductCard product={product} key={product.id} />
              ))}
            </div>
          )}
        </section>

        <section className="manifesto-section" id="manifesto">
          <div className="manifesto-photo" aria-hidden="true">
            <span>RGN</span>
          </div>
          <div className="manifesto-copy">
            <p className="eyebrow">THE ROGUEON SYNDICATE</p>
            <h2>NOT MADE<br />TO BLEND IN.</h2>
            <p>
              ROGUEON is an independent clothing project built around attitude, restraint and useful form.
              No costumes. No borrowed identity. Just pieces designed to become yours.
            </p>
            <a href="#new-drop">Enter the archive <ArrowRight aria-hidden="true" /></a>
          </div>
        </section>
    </>
  )
}
