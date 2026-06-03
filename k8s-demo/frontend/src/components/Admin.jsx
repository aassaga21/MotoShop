import { useState, useEffect } from 'react'
import { getOrders, updateOrderStatus } from '../api'

const STATUS = {
  pending:   { label: 'En attente',  cls: 'status-pending' },
  confirmed: { label: 'Confirmée',   cls: 'status-confirmed' },
  shipped:   { label: 'Expédiée',    cls: 'status-shipped' },
  delivered: { label: 'Livrée',      cls: 'status-delivered' },
  cancelled: { label: 'Annulée',     cls: 'status-cancelled' },
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtPrice(n) {
  return (n || 0).toLocaleString('fr-FR') + ' €'
}

function buildCustomers(orders) {
  const map = {}
  orders.forEach(o => {
    const email = o.customer?.email || 'inconnu'
    if (!map[email]) {
      map[email] = {
        email,
        name: o.customer?.name || 'Inconnu',
        phone: o.customer?.phone || '—',
        address: o.customer?.address || '—',
        orders: [],
      }
    }
    map[email].orders.push(o)
  })
  return Object.values(map)
}

export default function Admin({ onNavigate }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('orders')
  const [search, setSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)

  const load = () => {
    setLoading(true)
    getOrders()
      .then(data => { setOrders(data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const customers = buildCustomers(orders)
  const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0)
  const avgBasket = orders.length ? Math.round(totalRevenue / orders.length) : 0

  const q = search.toLowerCase()
  const filteredOrders = orders.filter(o =>
    (o.customer?.name || '').toLowerCase().includes(q) ||
    (o.customer?.email || '').toLowerCase().includes(q) ||
    (o._id || '').toLowerCase().includes(q)
  )
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
  )

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId)
    try {
      await updateOrderStatus(orderId, newStatus)
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o))
    } catch {
      alert('Erreur lors de la mise à jour du statut')
    } finally {
      setUpdatingId(null)
    }
  }

  const selectCustomer = c => {
    setSelectedCustomer(prev => prev?.email === c.email ? null : c)
  }

  return (
    <div className="admin-page">

      {/* Top bar */}
      <div className="admin-topbar">
        <div>
          <h1 className="admin-title">Administration</h1>
          <p className="admin-subtitle">Gestion des commandes et clients</p>
        </div>
        <div className="admin-topbar-actions">
          <button className="btn-admin-action" onClick={load}>↻ Actualiser</button>
          <button className="btn-admin-back" onClick={() => onNavigate('home')}>← Retour au site</button>
        </div>
      </div>

      {/* Stats */}
      <div className="admin-stats">
        <div className="stat-card">
          <span className="stat-number">{orders.length}</span>
          <span className="stat-label">Commandes totales</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{customers.length}</span>
          <span className="stat-label">Clients uniques</span>
        </div>
        <div className="stat-card accent-card">
          <span className="stat-number">{fmtPrice(totalRevenue)}</span>
          <span className="stat-label">Chiffre d'affaires</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{fmtPrice(avgBasket)}</span>
          <span className="stat-label">Panier moyen</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="admin-tabs">
          <button
            className={`admin-tab ${tab === 'orders' ? 'active' : ''}`}
            onClick={() => setTab('orders')}
          >
            Commandes ({orders.length})
          </button>
          <button
            className={`admin-tab ${tab === 'customers' ? 'active' : ''}`}
            onClick={() => setTab('customers')}
          >
            Clients ({customers.length})
          </button>
        </div>
        <input
          className="admin-search"
          placeholder="Rechercher par nom, email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /><p>Chargement…</p></div>
      ) : tab === 'orders' ? (

        /* ─── Onglet Commandes ─── */
        <div className="admin-content">
          {filteredOrders.length === 0 ? (
            <div className="admin-empty">
              {orders.length === 0
                ? 'Aucune commande pour le moment.'
                : 'Aucune commande ne correspond à la recherche.'}
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Référence</th>
                    <th>Date</th>
                    <th>Client</th>
                    <th>Email</th>
                    <th>Articles</th>
                    <th>Total</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(o => (
                    <tr key={o._id}>
                      <td>
                        <span className="order-ref">#{o._id.slice(-6).toUpperCase()}</span>
                      </td>
                      <td>{fmtDate(o.created_at)}</td>
                      <td>
                        <span
                          className="table-link"
                          onClick={() => {
                            const c = customers.find(c => c.email === o.customer?.email)
                            if (c) { selectCustomer(c); setTab('customers') }
                          }}
                        >
                          {o.customer?.name || '—'}
                        </span>
                      </td>
                      <td className="text-muted">{o.customer?.email || '—'}</td>
                      <td>{(o.items || []).length} art.</td>
                      <td className="text-accent">{fmtPrice(o.total)}</td>
                      <td>
                        <select
                          className={`status-select ${STATUS[o.status]?.cls || 'status-pending'}`}
                          value={o.status || 'pending'}
                          disabled={updatingId === o._id}
                          onChange={e => handleStatusChange(o._id, e.target.value)}
                        >
                          {Object.entries(STATUS).map(([v, { label }]) => (
                            <option key={v} value={v}>{label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      ) : (

        /* ─── Onglet Clients ─── */
        <div className="admin-content customers-layout">
          <div className="admin-table-wrap">
            {filteredCustomers.length === 0 ? (
              <div className="admin-empty">
                {customers.length === 0
                  ? 'Aucun client pour le moment.'
                  : 'Aucun client ne correspond à la recherche.'}
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Téléphone</th>
                    <th>Commandes</th>
                    <th>Total dépensé</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map(c => (
                    <tr
                      key={c.email}
                      className={`clickable-row ${selectedCustomer?.email === c.email ? 'row-selected' : ''}`}
                      onClick={() => selectCustomer(c)}
                    >
                      <td className="customer-name">{c.name}</td>
                      <td className="text-muted">{c.email}</td>
                      <td>{c.phone}</td>
                      <td>
                        <span className="order-count-badge">{c.orders.length}</span>
                      </td>
                      <td className="text-accent">
                        {fmtPrice(c.orders.reduce((s, o) => s + (o.total || 0), 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {selectedCustomer && (
            <aside className="customer-detail">
              <div className="customer-detail-header">
                <div>
                  <h3>{selectedCustomer.name}</h3>
                  <p className="text-muted">{selectedCustomer.email}</p>
                </div>
                <button className="close-btn" onClick={() => setSelectedCustomer(null)}>✕</button>
              </div>

              <div className="customer-meta">
                <div className="meta-row"><span>Téléphone</span><strong>{selectedCustomer.phone}</strong></div>
                <div className="meta-row"><span>Adresse</span><strong>{selectedCustomer.address}</strong></div>
                <div className="meta-row">
                  <span>Total dépensé</span>
                  <strong className="text-accent">
                    {fmtPrice(selectedCustomer.orders.reduce((s, o) => s + (o.total || 0), 0))}
                  </strong>
                </div>
                <div className="meta-row">
                  <span>Commandes</span>
                  <strong>{selectedCustomer.orders.length}</strong>
                </div>
              </div>

              <h4 className="customer-history-title">Historique des commandes</h4>
              <div className="customer-orders-list">
                {selectedCustomer.orders.map(o => (
                  <div className="customer-order-card" key={o._id}>
                    <div className="co-header">
                      <span className="order-ref">#{o._id.slice(-6).toUpperCase()}</span>
                      <span className={`status-badge ${STATUS[o.status]?.cls || 'status-pending'}`}>
                        {STATUS[o.status]?.label || 'En attente'}
                      </span>
                    </div>
                    <div className="co-info">
                      <span className="text-muted">{fmtDate(o.created_at)}</span>
                      <span className="text-accent">{fmtPrice(o.total)}</span>
                    </div>
                    <ul className="co-items">
                      {(o.items || []).map((item, i) => (
                        <li key={i}>{item.name} × {item.quantity}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  )
}
