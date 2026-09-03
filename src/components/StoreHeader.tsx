import { useState } from 'react'
import { Heart, LogOut, Menu, Search, ShoppingBag, UserRound, X } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { authClient } from '../lib/auth-client'
import { useCart } from '../hooks/useCart'

export function StoreHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { data: session } = authClient.useSession()
  const cart = useCart()

  return (
    <>
      <div className="utility-bar">
        <span>ROGUEON / NEPAL</span>
        <span>Built outside the ordinary.</span>
      </div>
      <header className="store-header">
        <button className="icon-button mobile-menu" type="button" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
          <Menu aria-hidden="true" />
        </button>
        <Link className="wordmark" to="/" aria-label="ROGUEON home">
          ROGUEON<span aria-hidden="true">®</span>
        </Link>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <NavLink to="/shop?sort=newest">New drop</NavLink>
          <NavLink to="/shop">Shop</NavLink>
          <Link to="/#manifesto">Archive</Link>
        </nav>
        <div className="header-actions">
          <Link className="icon-button search-button" to="/shop" aria-label="Search">
            <Search aria-hidden="true" />
          </Link>
          <Link className="icon-button desktop-action" to={session ? '/account?tab=wishlist' : '/auth/sign-in'} aria-label="Wishlist">
            <Heart aria-hidden="true" />
          </Link>
          <Link className="icon-button desktop-action" to={session ? '/account' : '/auth/sign-in'} aria-label="Account">
            <UserRound aria-hidden="true" />
          </Link>
          <Link className="bag-button" to="/cart" aria-label={`Open shopping bag with ${cart.data?.itemCount ?? 0} items`}>
            <ShoppingBag aria-hidden="true" />
            <span>{cart.data?.itemCount ?? 0}</span>
          </Link>
        </div>
      </header>

      <div className={`mobile-drawer ${menuOpen ? 'open' : ''}`} aria-hidden={!menuOpen}>
        <div className="mobile-drawer-head">
          <span className="wordmark">ROGUEON®</span>
          <button className="icon-button" type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)}><X /></button>
        </div>
        <nav aria-label="Mobile navigation">
          <Link to="/shop?sort=newest" onClick={() => setMenuOpen(false)}>New drop <span>01</span></Link>
          <Link to="/shop" onClick={() => setMenuOpen(false)}>Shop all <span>02</span></Link>
          <Link to="/orders" onClick={() => setMenuOpen(false)}>Orders <span>03</span></Link>
          <Link to={session ? '/account' : '/auth/sign-in'} onClick={() => setMenuOpen(false)}>{session ? 'Account' : 'Sign in'} <span>04</span></Link>
        </nav>
        {session && (
          <button className="drawer-signout" type="button" onClick={async () => { await authClient.signOut(); setMenuOpen(false) }}>
            Sign out <LogOut />
          </button>
        )}
      </div>
      {menuOpen && <button className="drawer-backdrop" type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}
    </>
  )
}
