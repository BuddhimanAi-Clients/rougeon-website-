import { useEffect } from 'react'
import type { CSSProperties } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowDown, ArrowRight, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CategoryTiles } from '../components/CategoryTiles'
import { ProductCard } from '../components/ProductCard'
import { apiRequest } from '../lib/api'
import type { PaginatedProducts } from '../types/catalog'
import type { ApiData, Category } from '../types/commerce'
import { usePageTitle } from '../hooks/usePageTitle'
import landingVideo from '../assets/landing_page_video.mp4'
import manifestoPhoto from '../assets/campaign/street.jpg'

// `contentKey` changes when API data arrives, so sections rendered after the
// first paint (categories, products) are observed too instead of staying hidden.
function useScrollReveal(contentKey: string) {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-visible)'))
    if (!elements.length) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) {
      elements.forEach((element) => element.classList.add('is-visible'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        })
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.16 },
    )

    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [contentKey])
}

export function HomePage() {
  usePageTitle()
  const products = useQuery({
    queryKey: ['products', 'newest'],
    queryFn: () =>
      apiRequest<PaginatedProducts>('/api/v1/products?sort=newest&limit=4'),
  })
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await apiRequest<ApiData<Category[]>>('/api/v1/categories')).data,
  })
  useScrollReveal(`${products.status}:${products.dataUpdatedAt}:${categories.status}:${categories.dataUpdatedAt}`)
  const shopCategories = categories.data?.flatMap((category) => category.children.length ? category.children : [category]).slice(0, 3) ?? []

  return (
    <>
        <section className="hero-section">
          <div className="hero-media" aria-hidden="true">
            <video className="hero-video" autoPlay muted loop playsInline preload="metadata"><source src={landingVideo} type="video/mp4" /></video>
          </div>
          <div className="hero-video-overlay" aria-hidden="true" />
          <div className="hero-noise" aria-hidden="true" />
          <div className="hero-copy" data-reveal="hero">
            <p className="eyebrow"><Star aria-hidden="true" /> New season / Built for movement</p>
            <h1><b>BREAK <span aria-hidden="true">★</span></b> <b>RULES <span aria-hidden="true">★</span></b> <b>REPEAT</b></h1>
            <p className="hero-note">
              Clean streetwear with bold proportion, sharp graphics and everyday confidence. Cut in Nepal for city days, late nights and everything after.
            </p>
            <a className="primary-cta" href="#new-arrivals">
              Shop collection <ArrowDown aria-hidden="true" />
            </a>
          </div>
          <div className="hero-index" aria-hidden="true">EST. 2026 / KTM</div>
        </section>

        {shopCategories.length > 0 && <section className="category-section" id="categories">
          <div className="section-heading" data-reveal>
            <p>The collection</p>
            <h2>SHOP BY CATEGORY</h2>
          </div>
          <CategoryTiles categories={shopCategories} />
        </section>}

        <section className="products-section" id="new-arrivals">
          <div className="section-heading section-heading-row" data-reveal>
            <div>
              <p>Recently released</p>
              <h2>NEW ARRIVALS</h2>
            </div>
            <Link to="/shop">View collection <ArrowRight aria-hidden="true" /></Link>
          </div>

          {products.isPending ? (
            <div className="product-grid" aria-label="Loading new products">
              {Array.from({ length: 4 }).map((_, index) => (
                <div className="product-skeleton" key={index} />
              ))}
            </div>
          ) : products.isError ? (
            <div className="collection-state">
              <p>WE COULDN'T LOAD THE COLLECTION</p>
              <span>Please check your connection and try again.</span>
              <button type="button" onClick={() => products.refetch()}>Try again</button>
            </div>
          ) : products.data.data.length === 0 ? (
            <div className="collection-state">
              <p>NEW PIECES ARE ON THE WAY</p>
              <span>Check back soon for the next drop.</span>
            </div>
          ) : (
            <div className="product-grid">
              {products.data.data.map((product, index) => (
                <div className="reveal-product" style={{ '--reveal-delay': `${index * 80}ms` } as CSSProperties} data-reveal key={product.id}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="manifesto-section" id="manifesto" data-reveal>
          <div className="manifesto-photo" aria-hidden="true">
            <img src={manifestoPhoto} alt="" loading="lazy" />
          </div>
          <div className="manifesto-copy" data-reveal>
            <p className="eyebrow">THE ROGUEON SYNDICATE</p>
            <h2>NOT MADE<br />TO BLEND IN.</h2>
            <p>
              ROGUEON is an independent clothing project built around attitude, restraint and useful form.
              No costumes. No borrowed identity. Just pieces designed to become yours.
            </p>
            <Link to="/shop">Shop the collection <ArrowRight aria-hidden="true" /></Link>
          </div>
        </section>
    </>
  )
}
