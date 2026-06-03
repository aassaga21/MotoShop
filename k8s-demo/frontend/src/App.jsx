import { useState, useEffect } from 'react'
import Header from './components/Header'
import ProductGrid from './components/ProductGrid'
import ProductModal from './components/ProductModal'
import Cart from './components/Cart'
import OrderForm from './components/OrderForm'
import Contact from './components/Contact'
import Admin from './components/Admin'
import { getProducts, createOrder } from './api'

export default function App() {
  const [page, setPage] = useState('home')
  const [products, setProducts] = useState([])
  const [activeCategory, setActiveCategory] = useState('Toutes')
  const [cart, setCart] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showCart, setShowCart] = useState(false)
  const [showOrder, setShowOrder] = useState(false)
  const [loading, setLoading] = useState(true)
  const [flash, setFlash] = useState(null)
  const [orderDone, setOrderDone] = useState(false)

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = activeCategory === 'Toutes'
    ? products
    : products.filter(p => p.category === activeCategory)

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i._id === product._id)
      if (existing) return prev.map(i => i._id === product._id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { ...product, quantity: 1 }]
    })
    setFlash(`${product.name} ajouté au panier !`)
    setTimeout(() => setFlash(null), 2000)
  }

  const updateQty = (id, qty) => {
    if (qty <= 0) return setCart(prev => prev.filter(i => i._id !== id))
    setCart(prev => prev.map(i => i._id === id ? { ...i, quantity: qty } : i))
  }

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)
  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)

  const handleOrder = async (customer) => {
    await createOrder({
      customer,
      items: cart.map(i => ({ product_id: i._id, name: i.name, price: i.price, quantity: i.quantity })),
      total: cartTotal,
    })
    setCart([])
    setShowOrder(false)
    setOrderDone(true)
    setTimeout(() => setOrderDone(false), 5000)
  }

  const headerProps = {
    cartCount,
    onCartClick: () => setShowCart(true),
    page,
    onNavigate: setPage,
  }

  if (page === 'contact') return (
    <div className="app">
      <Header {...headerProps} />
      <Contact />
    </div>
  )

  if (page === 'admin') return (
    <div className="app">
      <Header {...headerProps} />
      <Admin onNavigate={setPage} />
    </div>
  )

  return (
    <div className="app">
      <Header {...headerProps} />

      <ProductGrid
        products={filtered}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        onSelect={setSelectedProduct}
        onAddToCart={addToCart}
        loading={loading}
      />

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={(p) => { addToCart(p); setSelectedProduct(null) }}
        />
      )}

      {showCart && (
        <Cart
          items={cart}
          total={cartTotal}
          onClose={() => setShowCart(false)}
          onUpdateQty={updateQty}
          onCheckout={() => { setShowCart(false); setShowOrder(true) }}
        />
      )}

      {showOrder && (
        <OrderForm
          items={cart}
          total={cartTotal}
          onClose={() => setShowOrder(false)}
          onSubmit={handleOrder}
        />
      )}

      {flash && <div className="cart-added-flash">✓ {flash}</div>}

      {orderDone && (
        <div className="toast">
          ✓ Commande confirmée ! Nous vous contacterons par e-mail.
        </div>
      )}
    </div>
  )
}
