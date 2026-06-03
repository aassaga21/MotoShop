export default function ProductModal({ product, onClose, onAddToCart }) {
  const { name, brand, category, price, description, image, engine, power, weight, max_speed, year, stock } = product
  const badgeClass = `badge badge-${category.toLowerCase()}`

  const specs = [
    { label: 'Moteur', value: engine },
    { label: 'Puissance', value: power },
    { label: 'Poids', value: weight },
    { label: 'Vitesse max', value: max_speed },
    { label: 'Année', value: year },
    { label: 'En stock', value: `${stock} unité${stock > 1 ? 's' : ''}` },
  ]

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="card-badges" style={{ marginBottom: '0.5rem' }}>
              <span className={badgeClass}>{category}</span>
              <span className="badge badge-brand">{brand}</span>
            </div>
            <h2>{name}</h2>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <img className="modal-img" src={image} alt={name} />

        <div className="modal-body">
          <p className="modal-desc">{description}</p>

          <div className="specs-grid">
            {specs.map(s => (
              <div className="spec-item" key={s.label}>
                <div className="spec-label">{s.label}</div>
                <div className="spec-value">{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <span className="modal-price">{price.toLocaleString('fr-FR')} €</span>
          <button className="btn-add-cart" onClick={() => onAddToCart(product)}>
            Ajouter au panier
          </button>
        </div>
      </div>
    </div>
  )
}
