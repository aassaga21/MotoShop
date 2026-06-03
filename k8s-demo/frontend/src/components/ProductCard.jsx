export default function ProductCard({ product, onSelect, onAddToCart }) {
  const { name, brand, category, price, description, image } = product
  const badgeClass = `badge badge-${category.toLowerCase()}`

  return (
    <div className="card" onClick={() => onSelect(product)}>
      <img className="card-img" src={image} alt={name} loading="lazy" />

      <div className="card-body">
        <div className="card-badges">
          <span className={badgeClass}>{category}</span>
          <span className="badge badge-brand">{brand}</span>
        </div>

        <h3 className="card-name">{name}</h3>
        <p className="card-desc">{description}</p>

        <div className="card-footer">
          <span className="card-price">{price.toLocaleString('fr-FR')} €</span>
          <div className="card-actions" onClick={e => e.stopPropagation()}>
            <button className="btn-detail" onClick={() => onSelect(product)}>Détails</button>
            <button className="btn-cart" onClick={() => onAddToCart(product)}>+ Panier</button>
          </div>
        </div>
      </div>
    </div>
  )
}
