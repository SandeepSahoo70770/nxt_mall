import { useMemo, useState } from 'react'
import lockupLogo from './assets/nxt-lockup.png'
import minimalLogo from './assets/nxt-minimal.png'
import brandMark from './assets/nxt-mark.png'
import './App.css'

type Product = { id: number; name: string; category: string; price: number; oldPrice?: number; rating: string; reviews: number; image: string; badge?: string; color: string }

const products: Product[] = [
  { id: 1, name: 'Studio Wireless Headphones', category: 'Electronics', price: 7399, oldPrice: 10699, rating: '4.9', reviews: 128, image: 'photo-1505740420928-5e560c06d30e', badge: 'BESTSELLER', color: 'sand' },
  { id: 2, name: 'Everyday Leather Tote', category: 'Accessories', price: 6149, rating: '4.8', reviews: 86, image: 'photo-1590874103328-eac38a683ce7', color: 'pink' },
  { id: 3, name: 'Cloud Knit Sneakers', category: 'Fashion', price: 7999, oldPrice: 9999, rating: '4.7', reviews: 204, image: 'photo-1542291026-7eec264c27ff', badge: '−20%', color: 'blue' },
  { id: 4, name: 'Ceramic Morning Set', category: 'Home', price: 3499, rating: '4.9', reviews: 63, image: 'photo-1514228742587-6b1558fcca3d', color: 'green' },
  { id: 5, name: 'Sculpted Sun Glasses', category: 'Accessories', price: 4799, rating: '4.6', reviews: 51, image: 'photo-1511499767150-a48a237f0083', color: 'yellow' },
  { id: 6, name: 'Instant Film Camera', category: 'Electronics', price: 9899, rating: '4.8', reviews: 142, image: 'photo-1516035069371-29a1b244cc32', badge: 'POPULAR', color: 'lavender' },
  { id: 7, name: 'Soft Form Lounge Chair', category: 'Home', price: 15699, oldPrice: 19999, rating: '4.9', reviews: 37, image: 'photo-1506439773649-6e0eb8cfb237', color: 'orange' },
  { id: 8, name: 'Essential Daily Watch', category: 'Fashion', price: 11199, rating: '4.7', reviews: 93, image: 'photo-1523275335684-37898b6baf30', color: 'teal' },
]
const categories = ['All products', 'Fashion', 'Electronics', 'Home', 'Accessories']
const imageUrl = (id: string, width = 680) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`
const formatINR = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true as const }
  if (name === 'search') return <svg {...common}><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></svg>
  if (name === 'user') return <svg {...common}><circle cx="12" cy="8" r="3.5"/><path d="M4.8 20c.7-3.6 3.2-5.5 7.2-5.5s6.5 1.9 7.2 5.5"/></svg>
  if (name === 'bag') return <svg {...common}><path d="M5 8h14l1 12H4L5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></svg>
  if (name === 'arrow') return <svg {...common}><path d="M5 12h14M13 5l7 7-7 7"/></svg>
  if (name === 'heart') return <svg {...common}><path d="M20.8 8.8c0 5.4-8.8 10.3-8.8 10.3S3.2 14.2 3.2 8.8a4.5 4.5 0 0 1 8.8-1.3 4.5 4.5 0 0 1 8.8 1.3Z"/></svg>
  if (name === 'menu') return <svg {...common}><path d="M4 7h16M4 12h16M4 17h16"/></svg>
  return <svg {...common}><path d="m7 10 5 5 5-5"/></svg>
}

function App() {
  const [activeCategory, setActiveCategory] = useState('All products')
  const [query, setQuery] = useState('')
  const [cartCount, setCartCount] = useState(0)
  const [cartOpen, setCartOpen] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [sort, setSort] = useState('Featured')
  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => (activeCategory === 'All products' || product.category === activeCategory) && product.name.toLowerCase().includes(query.toLowerCase()))
    if (sort === 'Price: low to high') result = [...result].sort((a, b) => a.price - b.price)
    if (sort === 'Top rated') result = [...result].sort((a, b) => Number(b.rating) - Number(a.rating))
    return result
  }, [activeCategory, query, sort])

  return (
    <div className="site-shell">
      <div className="announcement" aria-label="Store announcements"><div className="announcement-track"><div className="announcement-group"><span>GOOD THINGS, RIGHT ON TIME.</span><a href="#shop">Free shipping on orders over ₹6,000 <span aria-hidden="true">↗</span></a><span className="announcement-right">Thoughtfully picked. Happily yours.</span></div><div className="announcement-group" aria-hidden="true"><span>GOOD THINGS, RIGHT ON TIME.</span><a href="#shop" tabIndex={-1}>Free shipping on orders over ₹6,000 <span aria-hidden="true">↗</span></a><span className="announcement-right">Thoughtfully picked. Happily yours.</span></div></div></div>
      <header className="header">
        <button className="mobile-menu icon-button" onClick={() => setMobileNav(!mobileNav)} aria-label="Toggle navigation"><Icon name="menu" /></button>
        <a className="brand-lockup" href="#top" aria-label="NxT Mall home"><picture><source media="(max-width: 760px)" srcSet={minimalLogo} /><img src={lockupLogo} alt="NxT Mall — Discover, Shop, Enjoy" /></picture></a>
        <nav className={mobileNav ? 'main-nav open' : 'main-nav'} aria-label="Main navigation">
          <a className="nav-active" href="#shop" onClick={() => setMobileNav(false)}>Shop</a><a href="#categories" onClick={() => setMobileNav(false)}>Categories</a><a href="#story" onClick={() => setMobileNav(false)}>Our story</a><a href="#footer" onClick={() => setMobileNav(false)}>Contact</a>
        </nav>
        <div className="header-actions">
          <label className="search-box"><Icon name="search" size={18} /><input aria-label="Search products" value={query} onChange={(event) => { setQuery(event.target.value); document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' }) }} placeholder="Search anything..." /></label>
          <button className="icon-button account-button" aria-label="Account"><Icon name="user" /></button>
          <button className="icon-button cart-button" onClick={() => setCartOpen(true)} aria-label={`Shopping bag, ${cartCount} items`}><Icon name="bag" /><span className="cart-count">{cartCount}</span></button>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-dot" /> THE LITTLE THINGS, FOUND</div><h1>A better kind<br />of <em>everyday.</em></h1><p>Good design, good quality, good prices.<br className="desktop-break" /> Meet your new favorite things.</p><a className="button button-dark" href="#shop">Explore the collection <Icon name="arrow" size={17} /></a><div className="hero-note"><span className="note-stars">★★★★★</span><span>Loved by 12,000+ happy customers</span></div></div>
          <div className="hero-visual"><div className="hero-image" role="img" aria-label="Curated home and lifestyle products" /><div className="hero-sticker"><span>GOOD<br />FINDS</span><span className="sticker-spark">✳</span><span>GOOD<br />FEELING</span></div><div className="hero-caption"><span>01 / 04</span><span>Objects for the everyday</span></div></div>
          <div className="hero-side-note">A LITTLE MORE YOU <span>—</span> A LITTLE LESS ORDINARY</div>
        </section>

        <section className="trust-strip" aria-label="Shopping benefits"><div><span className="trust-icon">✳</span><span>Curated with care</span></div><div><span className="trust-icon">↗</span><span>Free shipping over $75</span></div><div><span className="trust-icon">♡</span><span>Easy 30-day returns</span></div><div><span className="trust-icon">✦</span><span>Small joys, big impact</span></div></section>

        <section className="category-section" id="categories"><div className="category-shortcuts">
          {[{name:'Fashion', icon:'👕'}, {name:'Electronics', icon:'📱'}, {name:'Home', icon:'🏠'}, {name:'Accessories', icon:'👜'}].map((category) => <button className="category-shortcut" key={category.name} onClick={() => { setActiveCategory(category.name); document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' }) }}><span className="category-emoji" aria-hidden="true">{category.icon}</span><span>{category.name}</span></button>)}
        </div></section>

        <section className="shop-section" id="shop"><div className="section-heading shop-heading"><div><div className="eyebrow">THE GOOD STUFF</div><h2>Good finds, <em>right here.</em></h2></div><div className="sort-control"><span>Sort by</span><select aria-label="Sort products" value={sort} onChange={(event) => setSort(event.target.value)}><option>Featured</option><option>Price: low to high</option><option>Top rated</option></select><Icon name="chevron" size={15} /></div></div>
          <div className="shop-toolbar"><div className="filter-tabs" role="tablist" aria-label="Filter by category">{categories.map((category) => <button key={category} role="tab" aria-selected={activeCategory === category} className={activeCategory === category ? 'filter-tab selected' : 'filter-tab'} onClick={() => setActiveCategory(category)}>{category}</button>)}</div><span className="result-count">{filteredProducts.length} lovely things</span></div>
          <div className="featured-layout">
            <aside className="offer-panel">
              <span className="offer-kicker">A LITTLE EXTRA</span>
              <h3>Good finds.<br /><strong>Good savings.</strong></h3>
              <p>Take 10% off your first order and make something lovely yours.</p>
              <a href="#newsletter" className="offer-link">Get your 10% off <Icon name="arrow" size={15} /></a>
              <div className="offer-images" aria-hidden="true">
                <img src={imageUrl('photo-1505740420928-5e560c06d30e', 240)} alt="" />
                <img src={imageUrl('photo-1516035069371-29a1b244cc32', 240)} alt="" />
                <img src={imageUrl('photo-1542291026-7eec264c27ff', 240)} alt="" />
              </div>
            </aside>
            <div className="product-grid">
              {filteredProducts.map((product) => <article className="product-card" key={product.id}>
                <div className={`product-image ${product.color}`}>
                  <img src={imageUrl(product.image)} alt={product.name} loading="lazy" />
                  {product.badge && <span className={`product-badge ${product.badge.includes('%') ? 'sale-badge' : product.badge === 'POPULAR' ? 'offer-badge' : 'popular-badge'}`}>{product.badge}</span>}
                  <button className="wishlist-button" aria-label={`Save ${product.name}`}><Icon name="heart" size={19} /></button>
                </div>
                <div className="product-meta">
                  <div><p className="product-category">{product.category}</p><h3>{product.name}</h3><div className="rating"><span>★</span> {product.rating} <span className="review-count">({product.reviews})</span></div></div>
                  <div className="product-price">{product.oldPrice && <del>{formatINR(product.oldPrice)}</del>}<strong>{formatINR(product.price)}</strong></div>
                </div>
                <button className="quick-add" onClick={() => setCartCount(cartCount + 1)}>Add to cart <span>+</span></button>
              </article>)}
            </div>
          </div>
          {filteredProducts.length === 0 && <div className="empty-results"><span>Nothing here just yet.</span><p>Try another search or browse all the good finds.</p><button onClick={() => { setQuery(''); setActiveCategory('All products') }}>Show everything</button></div>}
          <div className="shop-more"><span>That’s a good start. There’s more to love.</span><button className="button button-outline" onClick={() => setActiveCategory('All products')}>View all products <Icon name="arrow" size={17} /></button></div>
        </section>

        <section className="story-section" id="story"><div className="story-image"><img src={imageUrl('photo-1441986300917-64674bd600d8', 1000)} alt="A light-filled independent shop" loading="lazy" /><span className="story-stamp">GOOD<br />THINGS<br /><i>LIVE HERE</i></span></div><div className="story-copy"><div className="eyebrow"><span className="eyebrow-dot" /> A NOTE FROM US</div><h2>Life’s too short<br />for <em>just okay.</em></h2><p>We believe the things you bring into your life should make it a little brighter. So we search high and low for pieces that feel special, work hard, and make you smile every time.</p><p>Thoughtfully chosen. Fairly priced. Ready to be yours.</p><a className="text-link" href="#footer">A little more about us <Icon name="arrow" size={16} /></a><div className="story-signature">With love, <span>the NxT team</span> <i>♡</i></div></div></section>

        <section className="newsletter" id="newsletter"><div className="newsletter-spark">✳</div><div className="eyebrow">A LITTLE NOTE FROM US</div><h2>Good things in your <em>inbox.</em></h2><p>New finds, little surprises, and 10% off your first order.</p>{subscribed ? <p className="success-message" role="status">You’re on the list! Keep an eye on your inbox. ✳</p> : <form className="newsletter-form" onSubmit={(event) => { event.preventDefault(); setSubscribed(true) }}><input type="email" required placeholder="Your email address" aria-label="Your email address" /><button type="submit">Count me in <Icon name="arrow" size={17} /></button></form>}<small>Just the good stuff. Unsubscribe any time.</small></section>
      </main>

      <footer id="footer"><div className="footer-main"><div className="footer-brand"><a className="footer-lockup" href="#top"><img src={brandMark} alt="" /><span><strong>NxT</strong> Mall</span></a><p>Good things for your everyday.<br />Picked with care, sent with love.</p><div className="social-links"><a href="#footer" aria-label="Instagram">ig</a><a href="#footer" aria-label="Pinterest">p</a><a href="#footer" aria-label="TikTok">tk</a></div></div><div className="footer-column"><strong>Take a look</strong><a href="#shop">Shop all</a><a href="#categories">Categories</a><a href="#shop">New arrivals</a><a href="#shop">Best sellers</a></div><div className="footer-column"><strong>Here to help</strong><a href="#footer">Shipping & returns</a><a href="#footer">FAQs</a><a href="#footer">Get in touch</a><a href="#footer">Track your order</a></div><div className="footer-column"><strong>The small print</strong><a href="#footer">Our story</a><a href="#footer">Privacy policy</a><a href="#footer">Terms of service</a><a href="#footer">Accessibility</a></div></div><div className="footer-bottom"><span>© 2025 NxT Mall. Made for the everyday.</span><span>GOOD THINGS ARE AROUND THE CORNER <i>✳</i></span><span>Made with a little extra care ♡</span></div></footer>

      {cartOpen && <div className="overlay" role="presentation" onClick={() => setCartOpen(false)}><aside className="cart-drawer" role="dialog" aria-modal="true" aria-label="Your shopping bag" onClick={(event) => event.stopPropagation()}><div className="drawer-heading"><div><div className="eyebrow">YOUR GOOD FINDS</div><h2>Your bag <span>({cartCount})</span></h2></div><button className="drawer-close" onClick={() => setCartOpen(false)} aria-label="Close bag">×</button></div>{cartCount === 0 ? <div className="cart-empty"><span className="empty-bag">♡</span><h3>It’s a little empty in here.</h3><p>Your next favorite thing is waiting to be found.</p><button className="button button-dark" onClick={() => { setCartOpen(false); document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' }) }}>Find something lovely <Icon name="arrow" size={17} /></button></div> : <div className="cart-filled"><p>{cartCount} lovely {cartCount === 1 ? 'find' : 'finds'} in your bag.</p><div className="cart-total"><span>Subtotal</span><strong>Calculated at checkout</strong></div><button className="button button-dark checkout-button" onClick={() => window.alert('Checkout will be available soon.')}>Continue to checkout <Icon name="arrow" size={17} /></button></div>}<div className="drawer-note">✳ &nbsp; Free shipping on orders over ₹6,000</div></aside></div>}
    </div>
  )
}

export default App
