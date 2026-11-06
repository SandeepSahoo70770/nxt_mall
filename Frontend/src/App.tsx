import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import brandMark from './assets/nxt-mark.png'
import AuthPage from './AuthPage'
import './App.css'

type Product = {
  id: number
  name: string
  category: string
  description: string
  price: number
  oldPrice: number
  rating: string
  reviews: string
  discount?: string
  image: string
}

type Category = { id: number; name: string; image: string }
type HeroSlide = { eyebrow: string; lineOne: string; lineTwo: string; highlight: string; description: string; image: string; alt: string }
type CartLine = { product: Product; quantity: number }

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const getSessionKey = () => {
  let key = localStorage.getItem('nxtmall_session_key')
  if (!key) {
    key = `nxtmall_${crypto.randomUUID()}`
    localStorage.setItem('nxtmall_session_key', key)
  }
  return key
}
const sessionQuery = () => `session_key=${encodeURIComponent(getSessionKey())}`

const imageUrl = (id: string, width = 600) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`
const formatINR = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true as const }
  if (name === 'search') return <svg {...common}><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>
  if (name === 'user') return <svg {...common}><circle cx="12" cy="8" r="3.5" /><path d="M4.8 20c.7-3.6 3.2-5.5 7.2-5.5s6.5 1.9 7.2 5.5" /></svg>
  if (name === 'cart') return <svg {...common}><path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 1.9-1.4L21 8H6" /><circle cx="10" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></svg>
  if (name === 'heart') return <svg {...common}><path d="M20.8 8.8c0 5.4-8.8 10.3-8.8 10.3S3.2 14.2 3.2 8.8a4.5 4.5 0 0 1 8.8-1.3 4.5 4.5 0 0 1 8.8 1.3Z" /></svg>
  if (name === 'truck') return <svg {...common}><path d="M2.5 6h12v11h-12zM14.5 10h4l3 3v4h-7z" /><circle cx="7" cy="19" r="1.7" /><circle cx="18" cy="19" r="1.7" /></svg>
  if (name === 'shield') return <svg {...common}><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></svg>
  if (name === 'return') return <svg {...common}><path d="M3 11a9 9 0 0 1 15.4-6.4L21 7" /><path d="M21 3v4h-4M21 13a9 9 0 0 1-15.4 6.4L3 17" /><path d="M3 21v-4h4" /></svg>
  if (name === 'headset') return <svg {...common}><path d="M3 13v-1a9 9 0 0 1 18 0v1" /><path d="M5 13h3v7H6a3 3 0 0 1-3-3v-1a3 3 0 0 1 2-3ZM19 13h-3v7h2a3 3 0 0 0 3-3v-1a3 3 0 0 0-2-3Z" /><path d="M16 20c-.8 1.2-2 1.8-4 1.8" /></svg>
  if (name === 'menu') return <svg {...common}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
  if (name === 'close') return <svg {...common}><path d="m6 6 12 12M18 6 6 18" /></svg>
  if (name === 'arrow') return <svg {...common}><path d="M5 12h14M13 5l7 7-7 7" /></svg>
  return <svg {...common}><path d="m7 10 5 5 5-5" /></svg>
}

function App() {
  if (window.location.pathname === '/auth') return <AuthPage />
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([])
  const [cart, setCart] = useState<CartLine[]>([])
  const [currentUser, setCurrentUser] = useState<{ id: number; email: string; full_name?: string | null; address?: string | null } | null>(() => {
    try {
      return JSON.parse(localStorage.getItem('nxtmall_user') || 'null') as { id: number; email: string } | null
    } catch {
      return null
    }
  })
  const [profileOpen, setProfileOpen] = useState(false)
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState('')
  const [activeCategory, setActiveCategory] = useState('All products')
  const [query, setQuery] = useState('')
  const [cartOpen, setCartOpen] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [sort, setSort] = useState('Featured')
  const [heroIndex, setHeroIndex] = useState(0)
  const [showAllProducts, setShowAllProducts] = useState(false)
  const [wishlist, setWishlist] = useState<Set<number>>(new Set())
  const [wishlistView, setWishlistView] = useState(false)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const [productResponse, categoryResponse, slideResponse, cartResponse, wishlistResponse] = await Promise.all([
          fetch(`${apiBase}/api/products`),
          fetch(`${apiBase}/api/categories`),
          fetch(`${apiBase}/api/hero-slides`),
          fetch(`${apiBase}/api/cart?${sessionQuery()}`),
          fetch(`${apiBase}/api/wishlist?${sessionQuery()}`),
        ])
        if (![productResponse, categoryResponse, slideResponse, cartResponse, wishlistResponse].every((response) => response.ok)) {
          throw new Error('Could not load storefront data from the database.')
        }
        const [productData, categoryData, slideData, cartData, wishlistData] = await Promise.all([
          productResponse.json() as Promise<Product[]>,
          categoryResponse.json() as Promise<Category[]>,
          slideResponse.json() as Promise<HeroSlide[]>,
          cartResponse.json() as Promise<{ items: CartLine[] }>,
          wishlistResponse.json() as Promise<{ productIds: number[] }>,
        ])
        if (!active) return
        setProducts(productData)
        setCategories(categoryData)
        setHeroSlides(slideData)
        setCart(cartData.items)
        setWishlist(new Set(wishlistData.productIds))
      } catch (error) {
        if (active) setCatalogError(error instanceof Error ? error.message : 'Could not connect to the storefront database.')
      } finally {
        if (active) setCatalogLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('nxtmall_access_token')
    if (!token) return
    let active = true
    void fetch(`${apiBase}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        if (!response.ok) throw new Error('Session expired')
        return await response.json() as { id: number; email: string; full_name?: string | null; address?: string | null }
      })
      .then((user) => {
        if (!active) return
        setCurrentUser(user)
        localStorage.setItem('nxtmall_user', JSON.stringify(user))
      })
      .catch(() => {
        if (!active) return
        localStorage.removeItem('nxtmall_access_token')
        localStorage.removeItem('nxtmall_user')
        setCurrentUser(null)
      })
    return () => { active = false }
  }, [])

  const cartCount = cart.reduce((count, item) => count + item.quantity, 0)

  const filteredProducts = useMemo(() => {
    let result = products.filter((product) =>
      (activeCategory === 'All products' || product.category === activeCategory) &&
      product.name.toLowerCase().includes(query.toLowerCase()),
    )
    if (wishlistView) result = result.filter((product) => wishlist.has(product.id))
    if (sort === 'Price: low to high') result = [...result].sort((a, b) => a.price - b.price)
    if (sort === 'Top rated') result = [...result].sort((a, b) => Number(b.rating) - Number(a.rating))
    return result
  }, [activeCategory, query, sort, wishlist, wishlistView])

  const visibleProducts = activeCategory === 'All products' && !query && !showAllProducts && !wishlistView
    ? filteredProducts.slice(0, 4)
    : filteredProducts

  const selectCategory = (category: string) => {
    setActiveCategory(category)
    setShowAllProducts(category !== 'All products')
    setWishlistView(false)
    setMobileNav(false)
    document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })
  }

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setShowAllProducts(true)
    setWishlistView(false)
    document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })
  }

  const toggleWishlist = async (id: number) => {
    try {
      const response = await fetch(`${apiBase}/api/wishlist/${id}?${sessionQuery()}`, { method: 'PUT' })
      if (!response.ok) throw new Error('Wishlist could not be updated.')
      const result = await response.json() as { saved: boolean }
      setWishlist((saved) => {
        const next = new Set(saved)
        if (result.saved) next.add(id)
        else next.delete(id)
        return next
      })
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : 'Wishlist could not be updated.')
    }
  }

  const addToCart = async (id: number) => {
    try {
      const response = await fetch(`${apiBase}/api/cart?${sessionQuery()}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_id: id, quantity: 1 }),
      })
      if (!response.ok) throw new Error('Could not add this product to your cart.')
      const result = await response.json() as { items: CartLine[] }
      setCart(result.items)
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : 'Could not update your cart.')
    }
  }

  const removeFromCart = async (id: number) => {
    try {
      const response = await fetch(`${apiBase}/api/cart/${id}?${sessionQuery()}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Could not update your cart.')
      const result = await response.json() as { items: CartLine[] }
      setCart(result.items)
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : 'Could not update your cart.')
    }
  }

  const subscribe = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    try {
      const response = await fetch(`${apiBase}/api/newsletter`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: form.get('email') }) })
      if (!response.ok) throw new Error('Subscription could not be saved.')
      setSubscribed(true)
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : 'Subscription could not be saved.')
    }
  }

  const logout = () => {
    localStorage.removeItem('nxtmall_access_token')
    localStorage.removeItem('nxtmall_user')
    setCurrentUser(null)
    setProfileOpen(false)
  }

  const hero = heroSlides[heroIndex]

  return (
    <div className="site-shell" id="top">
      <header className="site-header">
        <div className="header-main page-container">
          <button className="mobile-menu icon-button" onClick={() => setMobileNav(!mobileNav)} aria-label="Toggle navigation"><Icon name="menu" /></button>
          <a className="brand-lockup" href="#top" aria-label="NxT Mall home">
            <img src={brandMark} alt="" />
            <span><strong><b>NxT</b> Mall</strong><small>Shop Smarter. Live Better.</small></span>
          </a>
          <form className="header-search" onSubmit={submitSearch}>
            <Icon name="search" size={18} />
            <input aria-label="Search products and brands" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search for products, brands and more..." />
            <button type="submit">Search <Icon name="search" size={16} /></button>
          </form>
          <div className="header-actions">
            {currentUser
              ? <div className="account-menu-wrap"><button className="header-action account-action account-icon-button" aria-label="Open account menu" aria-expanded={profileOpen} title="Account" onClick={() => setProfileOpen((open) => !open)}><Icon name="user" /></button>{profileOpen && <div className="account-popover"><strong>{currentUser.full_name || 'NxT Mall account'}</strong><span>{currentUser.email}</span>{currentUser.address && <small>{currentUser.address}</small>}<button onClick={logout}>Log out</button></div>}</div>
              : <a className="header-action account-action" href="/auth"><Icon name="user" /><span>Login / Register</span></a>}
            <button className="header-action" onClick={() => { setWishlistView(true); setShowAllProducts(true); document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' }) }} aria-label={`Wishlist, ${wishlist.size} saved items`}><span className="action-icon"><Icon name="heart" /><i>{wishlist.size}</i></span><span>Wishlist</span></button>
            <button className="header-action" onClick={() => setCartOpen(true)} aria-label={`Cart, ${cartCount} items`}><span className="action-icon"><Icon name="cart" /><i>{cartCount}</i></span><span>Cart</span></button>
          </div>
        </div>
        <nav className={mobileNav ? 'category-nav open' : 'category-nav'} aria-label="Shop navigation">
          <div className="category-nav-inner page-container">
            <a className="all-categories" href="#categories"><Icon name="menu" size={17} /> All Categories <Icon name="chevron" size={14} /></a>
            <a className="nav-current" href="#top" onClick={() => setMobileNav(false)}>Home</a>
            <a href="#offer" onClick={() => setMobileNav(false)}>Deals</a>
            <a href="#shop" onClick={() => { setShowAllProducts(true); setMobileNav(false) }}>Best Sellers</a>
            <a href="#shop" onClick={() => { setShowAllProducts(true); setMobileNav(false) }}>New Arrivals</a>
            {['Fashion', 'Electronics', 'Home & Living', 'Beauty'].map((category) => <button key={category} onClick={() => selectCategory(category)}>{category}</button>)}
            <a href="#categories" onClick={() => setMobileNav(false)}>More <Icon name="chevron" size={13} /></a>
          </div>
        </nav>
      </header>

      <main>
        {catalogError && <p className="empty-results" role="status">{catalogError}</p>}
        {hero && <section className="hero page-container" aria-label="Featured deals">
          <div className="hero-copy">
            <div className="hero-eyebrow">{hero.eyebrow}</div>
            <h1><span>{hero.lineOne}</span><span>{hero.lineTwo}<em>{hero.highlight}</em></span></h1>
            <p>{hero.description}</p>
            <a className="shop-now" href="#shop">Shop Now <Icon name="arrow" size={17} /></a>
            <div className="hero-dots" aria-label="Choose banner">
              {heroSlides.map((slide, index) => <button key={slide.eyebrow} className={heroIndex === index ? 'active' : ''} onClick={() => setHeroIndex(index)} aria-label={`Show banner ${index + 1}`} />)}
            </div>
          </div>
          <div className="hero-art"><img src={hero.image} alt={hero.alt} /><button className="hero-arrow hero-prev" onClick={() => setHeroIndex((heroIndex + heroSlides.length - 1) % heroSlides.length)} aria-label="Previous banner">‹</button><button className="hero-arrow hero-next" onClick={() => setHeroIndex((heroIndex + 1) % heroSlides.length)} aria-label="Next banner">›</button></div>
        </section>}

        <section className="trust-strip page-container" aria-label="Shopping benefits">
          <div><Icon name="truck" size={30} /><span><strong>Free Shipping</strong><small>On orders over ₹999</small></span></div>
          <div><Icon name="shield" size={30} /><span><strong>Secure Payments</strong><small>100% protected checkout</small></span></div>
          <div><Icon name="return" size={30} /><span><strong>Easy Returns</strong><small>Hassle-free within 7 days</small></span></div>
          <div><Icon name="headset" size={30} /><span><strong>24/7 Support</strong><small>We’re here to help</small></span></div>
        </section>

        <section className="category-section page-container" id="categories">
          <div className="section-heading category-heading"><div><div className="eyebrow">SHOP BY CATEGORY</div><h2>Explore Our Categories</h2><p>Everything you need, in one place.</p></div><a className="view-all" href="#shop" onClick={() => selectCategory('All products')}>View All Categories <Icon name="arrow" size={16} /></a></div>
          <div className="category-grid">
            {categories.map((category) => <button className={activeCategory === category.name ? 'category-item selected' : 'category-item'} key={category.name} onClick={() => selectCategory(category.name)} aria-label={`Browse ${category.name}`}><img src={`/nxt-design/${category.image}`} alt="" loading="lazy" /></button>)}
          </div>
        </section>

        <section className="featured-section page-container" id="shop">
          <div className="featured-heading">
            <div><div className="eyebrow">FEATURED PRODUCTS</div><h2>{wishlistView ? 'Your Wishlist' : activeCategory === 'All products' ? 'Best Deals Just for You' : activeCategory}</h2><p>Top picks. Great prices. Unbeatable quality.</p></div>
            <div className="featured-actions"><label className="sort-control"><span>Sort by</span><select aria-label="Sort products" value={sort} onChange={(event) => { setSort(event.target.value); setShowAllProducts(true) }}><option>Featured</option><option>Price: low to high</option><option>Top rated</option></select><Icon name="chevron" size={13} /></label><button className="view-all" onClick={() => { setShowAllProducts(true); setWishlistView(false) }}>View All <Icon name="arrow" size={16} /></button></div>
          </div>
          <div className="featured-layout">
            <a className="limited-offer" id="offer" href="#shop" onClick={() => { setShowAllProducts(true); setActiveCategory('All products') }} aria-label="Shop the limited time offer, up to 50 percent off"><img src="/nxt-design/promo-limited-50.png" alt="Limited Time Offer: Up to 50% OFF on top brands. Shop Now." /></a>
            <div className="product-grid">
              {catalogLoading && <div className="empty-results" role="status">Loading products…</div>}
              {!catalogLoading && catalogError && products.length === 0 && <div className="empty-results" role="status"><strong>Store data is unavailable.</strong><span>Start the API and connect MySQL to load the catalog.</span></div>}
              {visibleProducts.map((product) => <article className="product-card" key={product.id}>
                <div className="product-image"><img src={product.image.startsWith('/') || product.image.startsWith('http') ? product.image : imageUrl(product.image, 800)} alt={product.name} loading="lazy" />{product.discount && <span className="discount-badge">{product.discount}</span>}<button className={wishlist.has(product.id) ? 'wishlist-button saved' : 'wishlist-button'} onClick={() => toggleWishlist(product.id)} aria-label={`${wishlist.has(product.id) ? 'Remove from' : 'Add to'} wishlist: ${product.name}`}><Icon name="heart" size={19} /></button></div>
                <div className="product-information"><div><p className="product-category">{product.category}</p><h3>{product.name}</h3><p className="product-description">{product.description}</p><div className="rating"><span>★</span><strong>{product.rating}</strong><small>({product.reviews})</small></div></div><div className="product-price"><strong>{formatINR(product.price)}</strong><del>{formatINR(product.oldPrice)}</del></div></div>
                <button className="add-to-cart" onClick={() => void addToCart(product.id)}><Icon name="cart" size={16} /> Add to Cart</button>
              </article>)}
              {!catalogLoading && !catalogError && visibleProducts.length === 0 && <div className="empty-results"><strong>{wishlistView ? 'Your wishlist is empty.' : 'No products found.'}</strong><span>Try another category or search.</span><button onClick={() => { setQuery(''); setActiveCategory('All products'); setWishlistView(false); setShowAllProducts(false) }}>Show featured products</button></div>}
            </div>
          </div>
        </section>

        <section className="wide-promo page-container"><a href="#shop" aria-label="Shop deals: up to 60 percent off"><img src="/nxt-design/promo-60.png" alt="Big Savings, Bigger Smiles. Up to 60% off on fashion, electronics and more. Shop Deals." loading="lazy" /></a></section>

        <section className="brand-strip page-container" aria-label="Top brands"><img src="/nxt-design/brand-strip.png" alt="Shop from top brands including Samsung, Nike, Adidas, Apple, boAt, and Puma." loading="lazy" /></section>
      </main>

      <footer className="site-footer" id="footer">
        <div className="footer-main page-container">
          <div className="footer-brand"><a className="footer-logo" href="#top"><img src={brandMark} alt="" /><span><strong><b>NxT</b> Mall</strong><small>Shop Smarter. Live Better.</small></span></a><p>Good things for your everyday.</p></div>
          <div className="footer-column"><strong>Quick Links</strong><a href="#top">Home</a><a href="#categories">About Us</a><a href="#footer">Contact Us</a><a href="#footer">FAQs</a></div>
          <div className="footer-column"><strong>Customer Care</strong><a href="#footer">Help Center</a><a href="#footer">Track Order</a><a href="#footer">Shipping Policy</a><a href="#footer">Return Policy</a></div>
          <div className="footer-social"><strong>Follow Us</strong><div><a href="#footer" aria-label="Facebook">f</a><a href="#footer" aria-label="Instagram">◎</a><a href="#footer" aria-label="YouTube">▶</a><a href="#footer" aria-label="X">𝕏</a><a href="#footer" aria-label="Pinterest">p</a></div></div>
          <div className="footer-newsletter"><strong>Subscribe to Our Newsletter</strong><p>Get the latest updates, offers and more.</p>{subscribed ? <div className="subscribe-success" role="status">Thanks for subscribing!</div> : <form onSubmit={(event) => void subscribe(event)}><input name="email" type="email" required aria-label="Email address" placeholder="Enter your email address" /><button aria-label="Subscribe"><Icon name="arrow" size={18} /></button></form>}</div>
        </div>
        <div className="footer-bottom page-container"><span>© 2025 NxT Mall. All rights reserved.</span><span><a href="#footer">Privacy Policy</a><i /> <a href="#footer">Terms & Conditions</a></span></div>
      </footer>

      {cartOpen && <div className="overlay" role="presentation" onClick={() => setCartOpen(false)}><aside className="cart-drawer" role="dialog" aria-modal="true" aria-label="Your shopping cart" onClick={(event) => event.stopPropagation()}><div className="drawer-heading"><div><span className="eyebrow">YOUR BAG</span><h2>Shopping Cart <small>({cartCount})</small></h2></div><button className="drawer-close" onClick={() => setCartOpen(false)} aria-label="Close cart"><Icon name="close" /></button></div>{cartCount === 0 ? <div className="cart-empty"><span className="empty-cart-icon"><Icon name="cart" size={28} /></span><strong>Your cart is empty</strong><p>Find something lovely for your everyday.</p><button className="drawer-shop" onClick={() => { setCartOpen(false); document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' }) }}>Continue Shopping <Icon name="arrow" size={16} /></button></div> : <div className="cart-filled">{cart.map(({ product, quantity }) => <div className="cart-feedback" key={product.id}><span>{product.name} × {quantity}</span><strong>{formatINR(product.price * quantity)}</strong><button onClick={() => void removeFromCart(product.id)} aria-label={`Remove ${product.name} from cart`}>Remove</button></div>)}<div className="cart-total"><span>Subtotal</span><strong>{formatINR(cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0))}</strong></div><button className="drawer-shop" onClick={() => setCartOpen(false)}>Continue Shopping <Icon name="arrow" size={16} /></button></div>}<div className="drawer-note"><Icon name="shield" size={16} /> Secure checkout with trusted payment methods</div></aside></div>}
    </div>
  )
}

export default App
