import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { StoreFooter } from './StoreFooter'
import { StoreHeader } from './StoreHeader'

// A new page starts at the top; a link such as /#manifesto scrolls to that section.
function useScrollOnNavigate() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0)
      return
    }
    const timer = window.setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 80)
    return () => window.clearTimeout(timer)
  }, [pathname, hash])
}

export function StoreLayout() {
  useScrollOnNavigate()
  return (
    <div className="store-shell">
      <StoreHeader />
      <main><Outlet /></main>
      <StoreFooter />
    </div>
  )
}
