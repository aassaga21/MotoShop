export default function Header({ cartCount, onCartClick, page, onNavigate }) {
  return (
    <header className="header">
      <button className="header-logo" onClick={() => onNavigate('home')}>
        Moto<span>Shop</span>
      </button>

      <nav className="header-nav">
        <button
          className={`nav-link ${page === 'home' ? 'nav-active' : ''}`}
          onClick={() => onNavigate('home')}
        >
          Accueil
        </button>

        <button
          className="nav-link"
          onClick={() => {
            onNavigate('home')
            setTimeout(() => document.getElementById('motos')?.scrollIntoView({ behavior: 'smooth' }), 100)
          }}
        >
          Nos Motos
        </button>

        <button
          className={`nav-link ${page === 'contact' ? 'nav-active' : ''}`}
          onClick={() => onNavigate('contact')}
        >
          Contact
        </button>

        <button className="cart-btn" onClick={onCartClick}>
          🛒 Panier
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </button>

        <button
          className={`admin-btn ${page === 'admin' ? 'admin-btn-active' : ''}`}
          onClick={() => onNavigate('admin')}
          title="Administration"
        >
          ⚙
        </button>
      </nav>
    </header>
  )
}
