import { Outlet } from 'react-router-dom'
import { StoreFooter } from './StoreFooter'
import { StoreHeader } from './StoreHeader'

export function StoreLayout() {
  return (
    <div className="store-shell">
      <StoreHeader />
      <main><Outlet /></main>
      <StoreFooter />
    </div>
  )
}
