import { useState } from 'react'

export default function OrderForm({ items, total, onClose, onSubmit }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' })
  const [submitting, setSubmitting] = useState(false)

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit(form)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal order-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Finaliser la commande</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form className="order-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nom complet *</label>
            <input name="name" value={form.name} onChange={handleChange} required placeholder="Jean Dupont" />
          </div>

          <div className="form-group">
            <label>E-mail *</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="jean@exemple.fr" />
          </div>

          <div className="form-group">
            <label>Téléphone</label>
            <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="+33 6 00 00 00 00" />
          </div>

          <div className="form-group">
            <label>Adresse de livraison *</label>
            <textarea name="address" value={form.address} onChange={handleChange} required placeholder="1 rue de la Moto, 75000 Paris" />
          </div>

          <div className="order-summary">
            <h3>Récapitulatif</h3>
            {items.map(i => (
              <div className="order-summary-item" key={i._id}>
                <span>{i.name} × {i.quantity}</span>
                <span>{(i.price * i.quantity).toLocaleString('fr-FR')} €</span>
              </div>
            ))}
            <div className="order-total">
              <span>Total</span>
              <span>{total.toLocaleString('fr-FR')} €</span>
            </div>
          </div>

          <button className="btn-submit" type="submit" disabled={submitting}>
            {submitting ? 'Envoi en cours…' : `Confirmer la commande — ${total.toLocaleString('fr-FR')} €`}
          </button>
        </form>
      </div>
    </div>
  )
}
