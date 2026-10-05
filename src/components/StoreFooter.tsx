import { Link } from 'react-router-dom'

export function StoreFooter() {
  return (
    <footer className="store-footer">
      <div className="footer-brand">
        <Link className="wordmark" to="/"><i className="brand-star" aria-hidden="true" />ROGUEON®</Link>
        <span className="footer-meta">Sambala Complex, Boudha, Kathmandu</span>
        <a className="footer-meta" href="tel:+9779761846811">+977 9761846811</a>
      </div>
      <p>Break ★ rules ★ repeat</p>
      <div>
        <Link to="/shop">Shop</Link>
        <Link to="/orders">Orders</Link>
        <Link to="/#manifesto">About</Link>
        <a href="https://www.instagram.com/rogueonofficial/" target="_blank" rel="noreferrer">Instagram</a>
        <a href="https://wa.me/9779761846811" target="_blank" rel="noreferrer">WhatsApp</a>
        <a href="mailto:rogueonnepal@gmail.com">Email</a>
      </div>
    </footer>
  )
}
