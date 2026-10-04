import { Link } from 'react-router-dom'

export function StoreFooter() {
  return (
    <footer className="store-footer">
      <div className="footer-brand">
        <Link className="wordmark" to="/">ROGUEON®</Link>
        <span className="footer-meta">Sambala Complex, Boudha, Kathmandu</span>
      </div>
      <p>Break ★ rules ★ repeat</p>
      <div>
        <Link to="/shop">Shop</Link>
        <Link to="/orders">Orders</Link>
        <Link to="/#manifesto">About</Link>
        <a href="https://www.instagram.com/rogueonofficial/" target="_blank" rel="noreferrer">Instagram</a>
        <a href="mailto:rogueonnepal@gmail.com">Contact</a>
      </div>
    </footer>
  )
}
