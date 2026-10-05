import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Props = { images: string[]; name: string }

/**
 * Product photos as a horizontal, swipeable carousel. The track is a native
 * scroll-snap container, so a finger swipe on phones and a trackpad swipe on
 * laptops get the browser's own momentum; arrows, thumbnails, dots and the
 * keyboard move the same track.
 */
export function ProductGallery({ images, name }: Props) {
  const track = useRef<HTMLDivElement>(null)
  const frame = useRef(0)
  const [active, setActive] = useState(0)
  const count = images.length

  const goTo = useCallback((index: number) => {
    const element = track.current
    if (!element) return
    const next = Math.max(0, Math.min(count - 1, index))
    element.scrollTo({ left: next * element.clientWidth, behavior: 'smooth' })
  }, [count])

  // A different product starts again from its first photo.
  useEffect(() => {
    setActive(0)
    track.current?.scrollTo({ left: 0, behavior: 'instant' })
  }, [images])

  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  function onScroll() {
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      const element = track.current
      if (!element || !element.clientWidth) return
      setActive(Math.round(element.scrollLeft / element.clientWidth))
    })
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'ArrowRight') { event.preventDefault(); goTo(active + 1) }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); goTo(active - 1) }
  }

  if (count === 0) {
    return <div className="product-carousel"><div className="carousel-stage"><div className="detail-image-fallback carousel-fallback"><span>R</span></div></div></div>
  }

  return (
    <div className="product-carousel" role="group" aria-roledescription="carousel" aria-label={`${name} photos`}>
      <div className="carousel-stage">
        <div className="carousel-track" ref={track} onScroll={onScroll} onKeyDown={onKeyDown} tabIndex={count > 1 ? 0 : -1}>
          {images.map((image, index) => (
            <div className="carousel-slide" key={image} aria-hidden={index !== active}>
              <img src={image} alt={`${name} view ${index + 1}`} loading={index === 0 ? 'eager' : 'lazy'} draggable={false} />
            </div>
          ))}
        </div>
        {count > 1 && <>
          <button type="button" className="carousel-arrow prev" aria-label="Previous photo" disabled={active === 0} onClick={() => goTo(active - 1)}><ChevronLeft /></button>
          <button type="button" className="carousel-arrow next" aria-label="Next photo" disabled={active === count - 1} onClick={() => goTo(active + 1)}><ChevronRight /></button>
          <span className="carousel-count" aria-live="polite">{active + 1} / {count}</span>
          <div className="carousel-dots" aria-hidden="true">{images.map((image, index) => <i className={index === active ? 'active' : ''} key={image} />)}</div>
        </>}
      </div>
      {count > 1 && (
        <div className="carousel-thumbs">
          {images.map((image, index) => (
            <button type="button" className={index === active ? 'active' : ''} aria-label={`Show photo ${index + 1}`} aria-current={index === active} onClick={() => goTo(index)} key={image}>
              <img src={image} alt="" loading="lazy" draggable={false} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
