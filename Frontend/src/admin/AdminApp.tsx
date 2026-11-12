import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import brandMark from '../assets/nxt-mark.png'
import './admin.css'

type Page = 'Dashboard' | 'Products' | 'Orders' | 'Customers' | 'Categories' | 'Coupons' | 'Reports' | 'Settings' | 'Profile'
type Product = { id: number; name: string; category: string; category_id: number; description: string; price: number; oldPrice: number; rating: string; reviews: string; discount?: string | null; image: string; stock: number; active: boolean }
type Category = { id: number; name: string; image: string; product_count: number }
type Customer = { id: number; email: string; full_name: string; address: string; is_active: boolean }
type Order = { id: number; customer: string; status: string; total: number; created_at: string | null }
type Coupon = { id: number; code: string; discount_type: string; discount_value: number; active: boolean; expires_at: string | null }
type Overview = { products: number; customers: number; orders: number; revenue: number; recent_orders: Order[] }
type Profile = { id: number; email: string; full_name: string | null; address: string | null }
type ProductForm = { name: string; category_id: string; description: string; price: string; old_price: string; image: string; stock: string; discount: string; active: boolean }
type CategoryForm = { name: string; image: string }
type CouponForm = { code: string; discount_type: 'percent' | 'amount'; discount_value: string; active: boolean; expires_at: string }

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const nav: { label: Page; icon: string }[] = [
  { label: 'Dashboard', icon: '⌂' }, { label: 'Products', icon: '▣' }, { label: 'Orders', icon: '▤' },
  { label: 'Customers', icon: '♙' }, { label: 'Categories', icon: '◫' }, { label: 'Coupons', icon: '％' },
  { label: 'Reports', icon: '⌁' }, { label: 'Settings', icon: '⚙' }, { label: 'Profile', icon: '◎' },
]
const emptyProduct: ProductForm = { name: '', category_id: '', description: '', price: '', old_price: '', image: '', stock: '0', discount: '', active: true }

async function api<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, { ...init, headers: { ...(init?.body ? { 'Content-Type': 'application/json' } : {}), Authorization: `Bearer ${token}`, ...init?.headers } })
  if (response.status === 401) {
    localStorage.removeItem('nxtmall_access_token')
    localStorage.removeItem('nxtmall_user')
    window.location.assign('/admin')
    throw new Error('Your session expired. Please sign in again.')
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { detail?: string }
    throw new Error(body.detail || `Request failed (${response.status})`)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

function money(value: number) { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value) }

export default function AdminApp() {
  const [token, setToken] = useState(() => localStorage.getItem('nxtmall_access_token') || '')
  const [authReady, setAuthReady] = useState(false)
  const [authError, setAuthError] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [authSubmitting, setAuthSubmitting] = useState(false)
  const [page, setPage] = useState<Page>('Dashboard')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [overview, setOverview] = useState<Overview | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [productModal, setProductModal] = useState<{ item?: Product; form: ProductForm } | null>(null)
  const [categoryModal, setCategoryModal] = useState<{ item?: Category; form: CategoryForm } | null>(null)
  const [couponModal, setCouponModal] = useState(false)
  const [couponForm, setCouponForm] = useState<CouponForm>({ code: '', discount_type: 'percent', discount_value: '', active: true, expires_at: '' })
  const [profileForm, setProfileForm] = useState({ full_name: '', address: '' })

  const load = useCallback(async (selected: Page, authToken: string) => {
    setLoading(true); setError('')
    try {
      if (selected === 'Dashboard' || selected === 'Reports') {
        const result = await Promise.all([api<Overview>('/api/admin/overview', authToken), api<Order[]>('/api/admin/orders', authToken)])
        setOverview({ ...result[0], recent_orders: result[1].slice(0, 6) }); setOrders(result[1])
      }
      if (selected === 'Products') { const [p, c] = await Promise.all([api<Product[]>('/api/admin/products', authToken), api<Category[]>('/api/admin/categories', authToken)]); setProducts(p); setCategories(c) }
      if (selected === 'Categories') setCategories(await api<Category[]>('/api/admin/categories', authToken))
      if (selected === 'Customers') setCustomers(await api<Customer[]>('/api/admin/customers', authToken))
      if (selected === 'Orders') setOrders(await api<Order[]>('/api/admin/orders', authToken))
      if (selected === 'Coupons') setCoupons(await api<Coupon[]>('/api/admin/coupons', authToken))
      if (selected === 'Settings') setSettings(await api<Record<string, string>>('/api/admin/settings', authToken))
      if (selected === 'Profile') { const data = await api<Profile>('/api/admin/auth/me', authToken); setProfile(data); setProfileForm({ full_name: data.full_name || '', address: data.address || '' }) }
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load this section.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (!token) { setAuthReady(true); setLoading(false); return }
    let active = true
    api<Profile>('/api/admin/auth/me', token).then((data) => { if (active) { setProfile(data); setAuthReady(true); void load(page, token) } }).catch((e: unknown) => { if (active) { localStorage.removeItem('nxtmall_access_token'); localStorage.removeItem('nxtmall_user'); setToken(''); setAuthReady(true); setLoading(false); setAuthError(e instanceof Error ? e.message : 'Sign in with an administrator account.') } })
    return () => { active = false }
  }, [token, load])

  const signInAdmin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setAuthError(''); setAuthSubmitting(true)
    try {
      const response = await fetch(`${apiBase}/api/admin/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: adminEmail, password: adminPassword }) })
      const result = await response.json() as { access_token?: string; user?: Profile; detail?: string }
      if (!response.ok || !result.access_token) throw new Error(result.detail || 'Admin email or password is incorrect.')
      localStorage.setItem('nxtmall_access_token', result.access_token)
      if (result.user) localStorage.setItem('nxtmall_user', JSON.stringify(result.user))
      setAdminPassword(''); setProfile(result.user || null); setToken(result.access_token)
    } catch (e) { setAuthError(e instanceof Error ? e.message : 'Could not sign in.') }
    finally { setAuthSubmitting(false) }
  }

  const changePage = (next: Page) => { setPage(next); setSearch(''); void load(next, token) }
  const logout = () => { localStorage.removeItem('nxtmall_access_token'); localStorage.removeItem('nxtmall_user'); setProfile(null); setToken(''); setAuthReady(true) }
  const action = async (work: () => Promise<unknown>, message: string, reloadPage = page) => {
    setError(''); setNotice('')
    try { await work(); setNotice(message); await load(reloadPage, token) }
    catch (e) { setError(e instanceof Error ? e.message : 'The change could not be saved.') }
  }

  const filteredProducts = useMemo(() => products.filter(p => `${p.name} ${p.category}`.toLowerCase().includes(search.toLowerCase())), [products, search])
  const filteredCustomers = useMemo(() => customers.filter(c => `${c.full_name} ${c.email}`.toLowerCase().includes(search.toLowerCase())), [customers, search])
  const filteredOrders = useMemo(() => orders.filter(o => `${o.id} ${o.customer} ${o.status}`.toLowerCase().includes(search.toLowerCase())), [orders, search])

  const saveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!productModal) return
    const f = productModal.form
    const payload = { name: f.name, category_id: Number(f.category_id), description: f.description, price: Number(f.price), old_price: Number(f.old_price), image: f.image, stock: Number(f.stock), discount: f.discount || null, active: f.active }
    const path = productModal.item ? `/api/admin/products/${productModal.item.id}` : '/api/admin/products'
    await action(() => api(path, token, { method: productModal.item ? 'PUT' : 'POST', body: JSON.stringify(payload) }), productModal.item ? 'Product updated.' : 'Product added.')
    setProductModal(null)
  }
  const saveCategory = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!categoryModal) return; const path = categoryModal.item ? `/api/admin/categories/${categoryModal.item.id}` : '/api/admin/categories'; await action(() => api(path, token, { method: categoryModal.item ? 'PUT' : 'POST', body: JSON.stringify(categoryModal.form) }), categoryModal.item ? 'Category updated.' : 'Category added.', 'Categories'); setCategoryModal(null) }
  const saveCoupon = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const payload = { ...couponForm, discount_value: Number(couponForm.discount_value), expires_at: couponForm.expires_at || null }; await action(() => api('/api/admin/coupons', token, { method: 'POST', body: JSON.stringify(payload) }), 'Coupon added.', 'Coupons'); setCouponModal(false); setCouponForm({ code: '', discount_type: 'percent', discount_value: '', active: true, expires_at: '' }) }

  const metricCards = overview ? [
    { name: 'Products', value: overview.products.toLocaleString(), note: 'Current catalog', icon: '▣', tint: 'violet' },
    { name: 'Customers', value: overview.customers.toLocaleString(), note: 'Registered accounts', icon: '♙', tint: 'orange' },
    { name: 'Orders', value: overview.orders.toLocaleString(), note: 'Recorded orders', icon: '▤', tint: 'green' },
    { name: 'Revenue', value: money(overview.revenue), note: 'From recorded orders', icon: '₹', tint: 'rose' },
  ] : []

  if (!authReady) return <div className="admin-auth-loading">Checking administrator access…</div>
  if (!token) return <main className="admin-login-page"><section className="admin-login-card"><a className="admin-login-brand" href="/"><img src={brandMark} alt=""/><span><b>NxT Mall</b><small>ADMIN WORKSPACE</small></span></a><p className="admin-eyebrow">SECURE ADMIN ACCESS</p><h1>Sign in to Admin</h1><p className="admin-login-subtitle">Use the separate administrator credential created for this store.</p>{authError && <div className="admin-alert error" role="alert">{authError}</div>}<form className="admin-form" onSubmit={signInAdmin}><label>Admin email<input type="email" autoComplete="username" required value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="admin@example.com"/></label><label>Password<input type="password" autoComplete="current-password" required value={adminPassword} onChange={e => setAdminPassword(e.target.value)} placeholder="Enter admin password"/></label><button className="primary-button" disabled={authSubmitting}>{authSubmitting ? 'Signing in…' : 'Sign in securely'}</button></form><a className="admin-login-store" href="/">← Return to NxT Mall</a></section></main>

  return <div className="admin-shell">
    <aside className="admin-sidebar"><a className="admin-brand" href="/"><img src={brandMark} alt=""/><span><b>NxT Mall</b><small>ADMIN WORKSPACE</small></span></a><div className="admin-nav-caption">WORKSPACE</div><nav aria-label="Admin navigation">{nav.map(item => <button key={item.label} className={page === item.label ? 'active' : ''} onClick={() => changePage(item.label)}><span className="admin-nav-icon">{item.icon}</span>{item.label}{item.label === 'Orders' && overview?.orders ? <i>{overview.orders}</i> : null}</button>)}</nav><div className="sidebar-bottom"><div className="sidebar-note"><span>✦</span><strong>Store health</strong><small>Live database connection</small><div><i /></div></div><button className="admin-logout" onClick={logout}>↪ <span>Log out</span></button></div></aside>
    <main className="admin-main"><header className="admin-topbar"><div className="admin-breadcrumb"><span>Workspace</span><b>/</b><strong>{page}</strong></div><div className="admin-top-actions"><label className="admin-search"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search this section" aria-label="Search this section"/></label><a className="store-link" href="/" title="Open storefront">↗<span>View store</span></a><button className="admin-avatar" title={profile?.email || 'Account'} onClick={() => changePage('Profile')}>{(profile?.full_name || profile?.email || 'N').slice(0,1).toUpperCase()}</button></div></header>
      <div className="admin-content"><div className="admin-page-heading"><div><p className="admin-eyebrow">NXT MALL / MANAGEMENT</p><h1>{page === 'Dashboard' ? 'Store overview' : page}</h1><p className="admin-subtitle">{page === 'Dashboard' ? 'A live view of your store, powered by your database.' : page === 'Products' ? 'Manage your live catalog and stock.' : page === 'Orders' ? 'Review orders currently recorded in your database.' : page === 'Customers' ? 'Customer accounts registered with NxT Mall.' : page === 'Categories' ? 'Organize the categories in your catalog.' : page === 'Coupons' ? 'Manage saved discount codes.' : page === 'Reports' ? 'Revenue and activity based on recorded orders.' : page === 'Settings' ? 'Store settings saved in your database.' : 'Your account details and delivery profile.'}</p></div><div className="heading-right"><span className="live-pill"><i/> Database live</span><button className="admin-refresh" onClick={() => void load(page, token)}>↻ <span>Refresh</span></button></div></div>
        {(error || notice) && <div className={error ? 'admin-alert error' : 'admin-alert success'} role="status">{error || notice}<button onClick={() => { setError(''); setNotice('') }} aria-label="Dismiss">×</button></div>}
        {loading ? <div className="admin-empty loading">Loading {page.toLowerCase()} from MySQL…</div> : <>
          {page === 'Dashboard' && <>
            <div className="metric-grid">{metricCards.map(card => <article className="metric-card" key={card.name}><div className="metric-top"><span>{card.name}</span><i className={card.tint}>{card.icon}</i></div><strong>{card.value}</strong><small>{card.note}</small><div className="metric-foot"><span className="metric-dot"/> Updated from MySQL</div></article>)}</div>
            <div className="dashboard-grid"><section className="admin-panel revenue-panel"><div className="panel-heading"><div><h2>Revenue activity</h2><p>Based on completed database records</p></div><span className="panel-period">All recorded orders</span></div>{orders.length ? <div className="revenue-bars">{orders.slice(0, 10).reverse().map(order => <div className="revenue-bar" key={order.id} title={`Order #${order.id}: ${money(order.total)}`}><div style={{ height: `${Math.max(6, Math.min(100, overview?.revenue ? order.total / overview.revenue * 100 : 6))}%` }}/><small>#{order.id}</small></div>)}</div> : <div className="chart-empty"><span>⌁</span><strong>No order data yet</strong><p>Revenue activity will appear here when real orders are recorded.</p></div>}</section>
              <section className="admin-panel status-panel"><div className="panel-heading"><div><h2>Order status</h2><p>Current distribution</p></div><span className="panel-icon">◷</span></div>{orders.length ? <div className="status-list">{['pending','processing','shipped','delivered','cancelled'].map(status => <div key={status}><span><i className={`status-dot ${status}`}/>{status}</span><strong>{orders.filter(o => o.status === status).length}</strong></div>)}</div> : <div className="chart-empty compact"><strong>No orders yet</strong><p>This summary will populate from live order records.</p></div>}</section></div>
            <section className="admin-panel data-panel"><div className="panel-heading"><div><h2>Recent orders</h2><p>Latest orders saved in MySQL</p></div><button className="text-link" onClick={() => changePage('Orders')}>View all →</button></div><OrderTable rows={overview?.recent_orders || []} onStatus={async (id, status) => action(() => api(`/api/admin/orders/${id}/status?status=${status}`, token, { method: 'PATCH' }), 'Order status updated.', 'Dashboard')}/></section>
          </>}
          {page === 'Products' && <section className="admin-panel data-panel"><PanelHeading title="Product catalog" detail={`${products.length} records`} action="Add product" onAction={() => setProductModal({ form: { ...emptyProduct, category_id: categories[0] ? String(categories[0].id) : '' } })}/><div className="table-scroll"><table><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Visibility</th><th>Actions</th></tr></thead><tbody>{filteredProducts.map(p => <tr key={p.id}><td><div className="product-cell"><img src={p.image.startsWith('http') || p.image.startsWith('/') ? p.image : `https://images.unsplash.com/${p.image}?auto=format&fit=crop&w=120&q=75`} alt=""/><span><b>{p.name}</b><small>ID {p.id}</small></span></div></td><td>{p.category}</td><td><b>{money(p.price)}</b><small className="table-muted"> / {money(p.oldPrice)}</small></td><td><span className={p.stock < 5 ? 'stock low' : 'stock'}>{p.stock} in stock</span></td><td><span className={`visibility ${p.active ? 'shown' : 'hidden'}`}>{p.active ? 'Active' : 'Hidden'}</span></td><td><div className="row-actions"><button onClick={() => setProductModal({ item: p, form: { name: p.name, category_id: String(p.category_id), description: p.description, price: String(p.price), old_price: String(p.oldPrice), image: p.image, stock: String(p.stock), discount: p.discount || '', active: p.active } })}>Edit</button><button className="danger-action" onClick={() => { if (confirm(`Delete ${p.name}?`)) void action(() => api(`/api/admin/products/${p.id}`, token, { method: 'DELETE' }), 'Product deleted.') }}>Delete</button></div></td></tr>)}</tbody></table>{!filteredProducts.length && <Empty title="No products found" body="The product list is read from your live catalog. Add a product or adjust the search."/>}</div></section>}
          {page === 'Categories' && <section className="admin-panel data-panel"><PanelHeading title="Categories" detail={`${categories.length} records`} action="Add category" onAction={() => setCategoryModal({ form: { name: '', image: '' } })}/><div className="table-scroll"><table><thead><tr><th>Category</th><th>Image asset</th><th>Products</th><th>Actions</th></tr></thead><tbody>{categories.filter(c => `${c.name} ${c.image}`.toLowerCase().includes(search.toLowerCase())).map(c => <tr key={c.id}><td><b>{c.name}</b><small className="table-muted">ID {c.id}</small></td><td>{c.image}</td><td>{c.product_count}</td><td><div className="row-actions"><button onClick={() => setCategoryModal({ item: c, form: { name: c.name, image: c.image } })}>Edit</button><button className="danger-action" onClick={() => { if (confirm(`Delete category ${c.name}?`)) void action(() => api(`/api/admin/categories/${c.id}`, token, { method: 'DELETE' }), 'Category deleted.', 'Categories') }}>Delete</button></div></td></tr>)}</tbody></table>{!categories.length && <Empty title="No categories found" body="No category records exist in the database yet."/>}</div></section>}
          {page === 'Customers' && <section className="admin-panel data-panel"><PanelHeading title="Customer accounts" detail={`${customers.length} records`}/><div className="table-scroll"><table><thead><tr><th>Customer</th><th>Email</th><th>Delivery address</th><th>Account</th></tr></thead><tbody>{filteredCustomers.map(c => <tr key={c.id}><td><b>{c.full_name || 'Name not provided'}</b><small className="table-muted">Customer #{c.id}</small></td><td>{c.email}</td><td className="address-cell">{c.address || 'No address saved'}</td><td><span className={`visibility ${c.is_active ? 'shown' : 'hidden'}`}>{c.is_active ? 'Active' : 'Disabled'}</span></td></tr>)}</tbody></table>{!filteredCustomers.length && <Empty title="No customers found" body="Customer rows appear here after people register."/>}</div></section>}
          {page === 'Orders' && <section className="admin-panel data-panel"><PanelHeading title="Orders" detail={`${orders.length} records`}/><OrderTable rows={filteredOrders} onStatus={async (id, status) => action(() => api(`/api/admin/orders/${id}/status?status=${status}`, token, { method: 'PATCH' }), 'Order status updated.')}/></section>}
          {page === 'Coupons' && <section className="admin-panel data-panel"><PanelHeading title="Coupons & offers" detail={`${coupons.length} records`} action="Create coupon" onAction={() => setCouponModal(true)}/><div className="table-scroll"><table><thead><tr><th>Code</th><th>Discount</th><th>Expires</th><th>Status</th><th/></tr></thead><tbody>{coupons.filter(c => c.code.toLowerCase().includes(search.toLowerCase())).map(c => <tr key={c.id}><td><b className="coupon-code">{c.code}</b></td><td>{c.discount_type === 'percent' ? `${c.discount_value}%` : money(c.discount_value)}</td><td>{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : 'No expiry'}</td><td><span className={`visibility ${c.active ? 'shown' : 'hidden'}`}>{c.active ? 'Active' : 'Inactive'}</span></td><td><button className="danger-action" onClick={() => { if (confirm(`Delete coupon ${c.code}?`)) void action(() => api(`/api/admin/coupons/${c.id}`, token, { method: 'DELETE' }), 'Coupon deleted.') }}>Delete</button></td></tr>)}</tbody></table>{!coupons.length && <Empty title="No coupons yet" body="Create a coupon to save it to the database."/>}</div></section>}
          {page === 'Reports' && <><div className="metric-grid report-metrics"><article className="metric-card"><span>Recorded revenue</span><strong>{money(overview?.revenue || 0)}</strong><small>Sum of saved order totals</small></article><article className="metric-card"><span>Recorded orders</span><strong>{overview?.orders || 0}</strong><small>All order records</small></article><article className="metric-card"><span>Catalog items</span><strong>{overview?.products || 0}</strong><small>All product records</small></article><article className="metric-card"><span>Customers</span><strong>{overview?.customers || 0}</strong><small>Registered accounts</small></article></div><section className="admin-panel data-panel"><PanelHeading title="Order ledger" detail="Revenue figures are computed from database orders"/><OrderTable rows={filteredOrders}/></section></>}
          {page === 'Settings' && <section className="admin-panel form-panel"><div className="panel-heading"><div><h2>Store configuration</h2><p>Only saved values are shown. Empty values remain empty.</p></div></div><form className="admin-form settings-form" onSubmit={e => { e.preventDefault(); void action(() => api('/api/admin/settings', token, { method: 'PUT', body: JSON.stringify({ values: settings }) }), 'Settings saved.') }}><label>Store name<input value={settings.store_name || ''} onChange={e => setSettings({ ...settings, store_name: e.target.value })} placeholder="Enter store name"/></label><label>Support email<input type="email" value={settings.support_email || ''} onChange={e => setSettings({ ...settings, support_email: e.target.value })} placeholder="Enter support email"/></label><label>Shipping threshold (₹)<input type="number" min="0" value={settings.shipping_threshold || ''} onChange={e => setSettings({ ...settings, shipping_threshold: e.target.value })} placeholder="Enter threshold"/></label><button className="primary-button">Save settings</button></form></section>}
          {page === 'Profile' && <section className="admin-panel form-panel profile-panel"><div className="panel-heading"><div><h2>Administrator profile</h2><p>Your existing JWT account profile</p></div></div><div className="profile-email"><span className="profile-avatar">{profile?.full_name?.slice(0,1).toUpperCase() || 'N'}</span><span><b>{profile?.full_name || 'NxT Mall account'}</b><small>{profile?.email}</small></span><span className="visibility shown">Signed in</span></div><form className="admin-form" onSubmit={e => { e.preventDefault(); void action(async () => { const updated = await api<Profile>('/api/admin/profile', token, { method: 'PUT', body: JSON.stringify(profileForm) }); setProfile(updated) }, 'Profile saved.', 'Profile') }}><label>Full name<input required minLength={2} value={profileForm.full_name} onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })}/></label><label>Delivery address<textarea required minLength={5} value={profileForm.address} onChange={e => setProfileForm({ ...profileForm, address: e.target.value })}/></label><button className="primary-button">Save profile</button></form></section>}
        </>}</div>
    </main>
    {productModal && <Modal title={productModal.item ? 'Edit product' : 'Add product'} onClose={() => setProductModal(null)}><form className="admin-form modal-form" onSubmit={saveProduct}><label>Product name<input required minLength={2} value={productModal.form.name} onChange={e => setProductModal({ ...productModal, form: { ...productModal.form, name: e.target.value } })}/></label><label>Category<select required value={productModal.form.category_id} onChange={e => setProductModal({ ...productModal, form: { ...productModal.form, category_id: e.target.value } })}><option value="">Select category</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Description<input value={productModal.form.description} onChange={e => setProductModal({ ...productModal, form: { ...productModal.form, description: e.target.value } })}/></label><div className="form-row"><label>Price (₹)<input required type="number" min="1" step="0.01" value={productModal.form.price} onChange={e => setProductModal({ ...productModal, form: { ...productModal.form, price: e.target.value } })}/></label><label>Original price (₹)<input required type="number" min="1" step="0.01" value={productModal.form.old_price} onChange={e => setProductModal({ ...productModal, form: { ...productModal.form, old_price: e.target.value } })}/></label></div><div className="form-row"><label>Stock<input required type="number" min="0" value={productModal.form.stock} onChange={e => setProductModal({ ...productModal, form: { ...productModal.form, stock: e.target.value } })}/></label><label>Discount label<input value={productModal.form.discount} onChange={e => setProductModal({ ...productModal, form: { ...productModal.form, discount: e.target.value } })} placeholder="Optional"/></label></div><label>Image URL or asset path<input required value={productModal.form.image} onChange={e => setProductModal({ ...productModal, form: { ...productModal.form, image: e.target.value } })}/></label><label className="check-label"><input type="checkbox" checked={productModal.form.active} onChange={e => setProductModal({ ...productModal, form: { ...productModal.form, active: e.target.checked } })}/> Visible in storefront</label><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setProductModal(null)}>Cancel</button><button className="primary-button">Save product</button></div></form></Modal>}
    {categoryModal && <Modal title={categoryModal.item ? 'Edit category' : 'Add category'} onClose={() => setCategoryModal(null)}><form className="admin-form modal-form" onSubmit={saveCategory}><label>Category name<input required value={categoryModal.form.name} onChange={e => setCategoryModal({ ...categoryModal, form: { ...categoryModal.form, name: e.target.value } })}/></label><label>Image asset name<input required value={categoryModal.form.image} onChange={e => setCategoryModal({ ...categoryModal, form: { ...categoryModal.form, image: e.target.value } })} placeholder="Enter an existing or uploaded image path"/></label><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setCategoryModal(null)}>Cancel</button><button className="primary-button">Save category</button></div></form></Modal>}
    {couponModal && <Modal title="Create coupon" onClose={() => setCouponModal(false)}><form className="admin-form modal-form" onSubmit={saveCoupon}><label>Coupon code<input required value={couponForm.code} onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}/></label><div className="form-row"><label>Discount type<select value={couponForm.discount_type} onChange={e => setCouponForm({ ...couponForm, discount_type: e.target.value as CouponForm['discount_type'] })}><option value="percent">Percent</option><option value="amount">Fixed amount</option></select></label><label>Discount value<input required type="number" min="0.01" step="0.01" value={couponForm.discount_value} onChange={e => setCouponForm({ ...couponForm, discount_value: e.target.value })}/></label></div><label>Expiry (optional)<input type="date" value={couponForm.expires_at} onChange={e => setCouponForm({ ...couponForm, expires_at: e.target.value ? `${e.target.value}T23:59:59` : '' })}/></label><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setCouponModal(false)}>Cancel</button><button className="primary-button">Save coupon</button></div></form></Modal>}
  </div>
}

function PanelHeading({ title, detail, action, onAction }: { title: string; detail: string; action?: string; onAction?: () => void }) { return <div className="panel-heading"><div><h2>{title}</h2><p>{detail}</p></div>{action && <button className="primary-button" onClick={onAction}>＋ {action}</button>}</div> }
function Empty({ title, body }: { title: string; body: string }) { return <div className="table-empty"><span>⌁</span><strong>{title}</strong><p>{body}</p></div> }
function OrderTable({ rows, onStatus }: { rows: Order[]; onStatus?: (id: number, status: string) => void }) { return <div className="table-scroll"><table><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th></tr></thead><tbody>{rows.map(order => <tr key={order.id}><td><b>#{order.id}</b></td><td>{order.customer || 'Customer record unavailable'}</td><td>{order.created_at ? new Date(order.created_at).toLocaleDateString() : '—'}</td><td><b>{money(order.total)}</b></td><td>{onStatus ? <select className={`status-select ${order.status}`} aria-label={`Status for order ${order.id}`} value={order.status} onChange={e => onStatus(order.id, e.target.value)}>{['pending','processing','shipped','delivered','cancelled'].map(status => <option key={status}>{status}</option>)}</select> : <span className={`order-status ${order.status}`}>{order.status}</span>}</td></tr>)}</tbody></table>{!rows.length && <Empty title="No orders yet" body="Order records will appear here when they exist in the database."/>}</div> }
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) { return <div className="admin-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}><section className="admin-modal" role="dialog" aria-modal="true" aria-label={title}><div className="modal-heading"><div><span className="admin-eyebrow">NXT MALL / CATALOG</span><h2>{title}</h2></div><button onClick={onClose} aria-label="Close dialog">×</button></div>{children}</section></div> }
