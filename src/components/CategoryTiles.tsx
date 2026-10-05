import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Category } from '../types/commerce'
import denim from '../assets/campaign/denim.jpg'
import graphic from '../assets/campaign/graphic.jpg'
import hoodie from '../assets/campaign/hoodie.jpg'
import jacket from '../assets/campaign/jacket.jpg'
import polo from '../assets/campaign/polo.jpg'
import street from '../assets/campaign/street.jpg'
import stripe from '../assets/campaign/stripe.jpg'
import tee from '../assets/campaign/tee.jpg'

// A category shows the image an administrator uploaded for it. Until one is
// uploaded it falls back to a campaign photo matched by name; anything
// unmatched takes the next unused photo, so two tiles never share an image.
const matchers: Array<[RegExp, string]> = [
  [/hood|zip|sweat/i, hoodie],
  [/polo/i, polo],
  [/strip/i, stripe],
  [/tee|t-?shirt|top/i, tee],
  [/jacket|outer|coat/i, jacket],
  [/pant|jean|denim|bottom|trouser|cargo|short/i, denim],
]
const fallbacks = [graphic, stripe, street, jacket, polo, denim, tee, hoodie]

function assignImages(categories: Category[]) {
  const used = new Set<string>()
  return categories.map((category) => {
    if (category.imageUrl) return { category, image: category.imageUrl }
    const matched = matchers.find(([pattern, image]) => pattern.test(category.name) && !used.has(image))?.[1]
    const image = matched ?? fallbacks.find((candidate) => !used.has(candidate)) ?? street
    used.add(image)
    return { category, image }
  })
}

export function CategoryTiles({ categories }: { categories: Category[] }) {
  const tiles = assignImages(categories)
  const allImage = fallbacks.find((candidate) => !tiles.some((tile) => tile.image === candidate)) ?? street
  const rail = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ start: true, end: true })

  // Arrows only appear when there are more categories than fit on screen.
  const measure = useCallback(() => {
    const element = rail.current
    if (!element) return
    setEdges({
      start: element.scrollLeft <= 2,
      end: element.scrollLeft + element.clientWidth >= element.scrollWidth - 2,
    })
  }, [])

  useEffect(() => {
    measure()
    const element = rail.current
    if (!element || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [measure, categories.length])

  function step(direction: 1 | -1) {
    const element = rail.current
    if (!element) return
    element.scrollBy({ left: direction * element.clientWidth * 0.8, behavior: 'smooth' })
  }

  const scrollable = !(edges.start && edges.end)

  return (
    <>
      <div className="section-heading section-heading-row" data-reveal>
        <div>
          <p>The collection</p>
          <h2>SHOP BY CATEGORY</h2>
        </div>
        {scrollable && (
          <div className="rail-arrows">
            <button type="button" aria-label="Previous categories" disabled={edges.start} onClick={() => step(-1)}><ArrowLeft /></button>
            <button type="button" aria-label="More categories" disabled={edges.end} onClick={() => step(1)}><ArrowRight /></button>
          </div>
        )}
      </div>
      <div className="category-tiles" ref={rail} onScroll={measure}>
        {tiles.map(({ category, image }, index) => (
          <Link className="category-tile" style={{ '--reveal-delay': `${Math.min(index, 3) * 90}ms` } as CSSProperties} data-reveal to={`/shop?categorySlug=${encodeURIComponent(category.slug)}`} key={category.id}>
            <img src={image} alt="" loading="lazy" draggable={false} />
            <span className="category-tile-label">
              <strong>{category.name}</strong>
              <em>Shop now <ArrowRight aria-hidden="true" /></em>
            </span>
          </Link>
        ))}
        <Link className="category-tile" data-reveal to="/shop">
          <img src={allImage} alt="" loading="lazy" draggable={false} />
          <span className="category-tile-label">
            <strong>Shop all</strong>
            <em>View everything <ArrowRight aria-hidden="true" /></em>
          </span>
        </Link>
      </div>
    </>
  )
}
