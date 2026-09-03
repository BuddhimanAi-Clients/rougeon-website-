import { Route, Routes } from 'react-router-dom'
import { StoreLayout } from './components/StoreLayout'
import { AccountPage } from './pages/AccountPage'
import { AuthPage } from './pages/AuthPage'
import { CartPage } from './pages/CartPage'
import { CatalogPage } from './pages/CatalogPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { HomePage } from './pages/HomePage'
import { OrderDetailPage } from './pages/OrderDetailPage'
import { OrdersPage } from './pages/OrdersPage'
import { PaymentPage } from './pages/PaymentPage'
import { ProductDetailPage } from './pages/ProductDetailPage'
import './App.css'

function App() {
  return (
    <Routes>
      <Route element={<StoreLayout />}>
        <Route index element={<HomePage />} />
        <Route path="shop" element={<CatalogPage />} />
        <Route path="products/:slug" element={<ProductDetailPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="payment/:orderId" element={<PaymentPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:orderId" element={<OrderDetailPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="auth/sign-in" element={<AuthPage />} />
        <Route path="auth/sign-up" element={<AuthPage />} />
        <Route path="auth/reset-password" element={<AuthPage />} />
        <Route path="*" element={<div className="collection-state page-state"><p>PAGE NOT FOUND</p><a href="/">Return home</a></div>} />
      </Route>
    </Routes>
  )
}

export default App
