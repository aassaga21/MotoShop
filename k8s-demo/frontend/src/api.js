const BASE = '/api'

export async function getProducts(category = '') {
  const url = category ? `${BASE}/products?category=${encodeURIComponent(category)}` : `${BASE}/products`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch products')
  return res.json()
}

export async function createOrder(order) {
  const res = await fetch(`${BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
  })
  if (!res.ok) throw new Error('Failed to create order')
  return res.json()
}

export async function getOrders() {
  const res = await fetch(`${BASE}/orders`)
  if (!res.ok) throw new Error('Failed to fetch orders')
  return res.json()
}

export async function updateOrderStatus(id, status) {
  const res = await fetch(`${BASE}/orders/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  if (!res.ok) throw new Error('Failed to update status')
  return res.json()
}

export async function sendContact(data) {
  const res = await fetch(`${BASE}/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to send message')
  return res.json()
}
