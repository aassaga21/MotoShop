import { useState } from 'react'
import { sendContact } from '../api'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setSending(true)
    setError(null)
    try {
      await sendContact(form)
      setSent(true)
      setForm({ name: '', email: '', subject: '', message: '' })
      setTimeout(() => setSent(false), 5000)
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="contact-page">
      <div className="contact-hero">
        <h1>Contactez-nous</h1>
        <p>Notre équipe de passionnés vous répond sous 24h</p>
      </div>

      <div className="contact-container">
        <aside className="contact-info">
          <h2>Nos coordonnées</h2>

          <div className="contact-info-item">
            <span className="contact-icon">📍</span>
            <div>
              <h3>Adresse</h3>
              <p>12 Avenue des Motards<br />75001 Paris, France</p>
            </div>
          </div>

          <div className="contact-info-item">
            <span className="contact-icon">📞</span>
            <div>
              <h3>Téléphone</h3>
              <p>+33 1 23 45 67 89</p>
            </div>
          </div>

          <div className="contact-info-item">
            <span className="contact-icon">✉️</span>
            <div>
              <h3>Email</h3>
              <p>contact@motoshop.fr</p>
            </div>
          </div>

          <div className="contact-info-item">
            <span className="contact-icon">🕐</span>
            <div>
              <h3>Horaires</h3>
              <p>Lun–Ven : 9h–19h<br />Samedi : 10h–17h<br />Dimanche : Fermé</p>
            </div>
          </div>

          <div className="contact-socials">
            <h3>Suivez-nous</h3>
            <div className="social-links">
              <a href="#" className="social-link">Instagram</a>
              <a href="#" className="social-link">Facebook</a>
              <a href="#" className="social-link">YouTube</a>
            </div>
          </div>
        </aside>

        <form className="contact-form" onSubmit={handleSubmit}>
          <h2>Envoyez-nous un message</h2>

          <div className="form-row">
            <div className="form-group">
              <label>Nom *</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Jean Dupont"
                required
              />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="jean@exemple.fr"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Sujet *</label>
            <input
              name="subject"
              value={form.subject}
              onChange={handleChange}
              placeholder="Renseignement sur une moto"
              required
            />
          </div>

          <div className="form-group">
            <label>Message *</label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="Décrivez votre demande..."
              rows={6}
              required
            />
          </div>

          {sent && (
            <div className="contact-success">
              ✓ Message envoyé ! Nous vous répondrons sous 24h.
            </div>
          )}
          {error && <div className="contact-error">{error}</div>}

          <button className="btn-submit" type="submit" disabled={sending}>
            {sending ? 'Envoi en cours...' : '✉️  Envoyer le message'}
          </button>
        </form>
      </div>
    </div>
  )
}
