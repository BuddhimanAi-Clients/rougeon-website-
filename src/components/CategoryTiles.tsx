import type { CSSProperties } from 'react'
import { ArrowRight } from 'lucide-react'
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
  const count = tiles.length + 1

  return (
    <div className="category-tiles" style={{ '--tile-count': count } as CSSProperties}>
      {tiles.map(({ category, image }, index) => (
        <Link className="category-tile" style={{ '--reveal-delay': `${index * 90}ms` } as CSSProperties} data-reveal to={`/shop?categorySlug=${encodeURIComponent(category.slug)}`} key={category.id}>
          <img src={image} alt="" loading="lazy" />
          <span className="category-tile-label">
            <strong>{category.name}</strong>
            <em>Shop now <ArrowRight aria-hidden="true" /></em>
          </span>
        </Link>
      ))}
      <Link className="category-tile" style={{ '--reveal-delay': `${tiles.length * 90}ms` } as CSSProperties} data-reveal to="/shop">
        <img src={allImage} alt="" loading="lazy" />
        <span className="category-tile-label">
          <strong>Shop all</strong>
          <em>View everything <ArrowRight aria-hidden="true" /></em>
        </span>
      </Link>
    </div>
  )
}
