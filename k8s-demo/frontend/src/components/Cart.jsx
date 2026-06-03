export default function Cart({ items, total, onClose, onUpdateQty, onCheckout }) {
  return (
    <>
      <div className="overlay" style={{ justifyContent: 'flex-end', alignItems: 'stretch', padding: 0 }} onClick={onClose}>
        <div className="cart-sidebar" onClick={e => e.stopPropagation()}>
          <div className="cart-head">
            <h2>Votre Panier</h2>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>

          <div className="cart-items">
            {items.length === 0 ? (
              <div className="cart-empty">
                <p>🏍️</p>
                <span>Votre panier est vide</span>
              </div>
            ) : (
              items.map(item => (
                <div className="cart-item" key={item._id}>
                  <img className="cart-item-img" src={item.image} alt={item.name} />
                  <div className="cart-item-info">
                    <div className="cart-item-name">{item.name}</div>
                    <div className="cart-item-price">{(item.price * item.quantity).toLocaleString('fr-FR')} €</div>
                    <div className="cart-item-controls">
                      <button className="qty-btn" onClick={() => onUpdateQty(item._id, item.quantity - 1)}>−</button>
                      <span className="qty-value">{item.quantity}</span>
                      <button className="qty-btn" onClick={() => onUpdateQty(item._id, item.quantity + 1)}>+</button>
                      <button className="btn-remove" onClick={() => onUpdateQty(item._id, 0)}>Supprimer</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="cart-footer">
            <div className="cart-total">
              <span>Total</span>
              <span>{total.toLocaleString('fr-FR')} €</span>
            </div>
            <button className="btn-checkout" onClick={onCheckout} disabled={items.length === 0}>
              Commander →
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
