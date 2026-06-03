import ProductCard from './ProductCard'

const CATEGORIES = ['Toutes', 'Naked', 'Sport', 'Trail', 'Cruiser']

export default function ProductGrid({ products, activeCategory, onCategoryChange, onSelect, onAddToCart, loading }) {
  return (
    <>
      <section className="hero">
        <h1>Trouvez la moto de vos rêves</h1>
        <p>Sélection des meilleures motos neuves — Sport, Naked, Trail & Cruiser</p>
      </section>

      <div className="filters" id="motos">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`filter-btn ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => onCategoryChange(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <section className="product-section">
        <h2>
          {activeCategory === 'Toutes' ? `${products.length} motos disponibles` : `${products.length} moto${products.length > 1 ? 's' : ''} — ${activeCategory}`}
        </h2>

        {loading ? (
          <div className="loading">
            <div className="spinner" />
            Chargement du catalogue…
          </div>
        ) : (
          <div className="product-grid">
            {products.map(p => (
              <ProductCard key={p._id} product={p} onSelect={onSelect} onAddToCart={onAddToCart} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
