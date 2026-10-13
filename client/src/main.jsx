import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Check, Clock3, Flame, MapPin, Search, ShieldCheck, Sparkles, Star, Utensils, X } from 'lucide-react';
import { getRestaurants, requestOtp, restaurantsFrom, verifyOtp } from './api';
import './styles.css';

const categories = [
  { name: 'All', emoji: '✦' }, { name: 'Pizza', emoji: '🍕' }, { name: 'Burgers', emoji: '🍔' },
  { name: 'Indian', emoji: '🍛' }, { name: 'Healthy', emoji: '🥗' }, { name: 'Desserts', emoji: '🍰' }
];

function restaurantName(item) { return item.restaurant_name || item.name || item.title || 'Restaurant'; }
function restaurantImage(item) { return item.image_url || item.image || item.cover_image || item.banner || item.images?.[0] || ''; }
function restaurantCuisine(item) { return item.cuisine || item.cuisines || item.category || 'Made with care · Freshly prepared'; }
function restaurantRating(item) { return item.avg_rating || item.rating || item.ratings || '4.6'; }
function restaurantLocation(item) { return item.location || item.address || item.locality || 'Nearby'; }

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('fastor_token') || '');
  const [view, setView] = useState(() => localStorage.getItem('fastor_token') ? 'home' : 'home');
  const [showLogin, setShowLogin] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [activeTab, setActiveTab] = useState('Explore');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    getRestaurants(token)
      .then((response) => { if (!cancelled) setRestaurants(restaurantsFrom(response)); })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        if (/401|403|token/i.test(err.message)) {
          localStorage.removeItem('fastor_token'); setToken('');
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  const items = restaurants;
  const filteredItems = useMemo(() => items.filter((item) => {
    const text = `${restaurantName(item)} ${restaurantCuisine(item)} ${restaurantLocation(item)}`.toLowerCase();
    const matchesQuery = text.includes(query.toLowerCase());
    const matchesCategory = category === 'All' || text.includes(category.toLowerCase());
    return matchesQuery && matchesCategory;
  }), [items, query, category]);

  async function handleRequestOtp(event) {
    event.preventDefault(); setError(''); setAuthLoading(true);
    try {
      await requestOtp(phone, '+91'); setOtpStep(true);
    } catch (err) { setError(err.message); }
    finally { setAuthLoading(false); }
  }
  async function handleVerifyOtp(event) {
    event.preventDefault(); setError(''); setAuthLoading(true);
    try {
      const accessToken = await verifyOtp(phone, otp, '+91');
      localStorage.setItem('fastor_token', accessToken); setToken(accessToken); setOtpStep(false); setShowLogin(false); setOtp('');
    } catch (err) { setError(err.message); }
    finally { setAuthLoading(false); }
  }
  function logout() {
    localStorage.removeItem('fastor_token'); setToken(''); setRestaurants([]); setActiveTab('Explore');
  }

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#top" aria-label="Fastor home"><span className="brand-mark"><Utensils size={18} /></span><span>fastor<span className="brand-period">.</span></span></a>
      <nav className="desktop-nav" aria-label="Main navigation"><button className={activeTab === 'Explore' ? 'nav-link selected' : 'nav-link'} onClick={() => setActiveTab('Explore')}>Explore</button><button className={activeTab === 'Offers' ? 'nav-link selected' : 'nav-link'} onClick={() => setActiveTab('Offers')}>Offers</button><button className={activeTab === 'About' ? 'nav-link selected' : 'nav-link'} onClick={() => setActiveTab('About')}>Our story</button></nav>
      <div className="top-actions"><button className="location-pill"><MapPin size={15} /><span>Pune, India</span><ArrowDown size={14} /></button>{token ? <button className="account-btn" onClick={logout} title="Log out">RK <span className="online-dot" /></button> : <button className="signin-btn" onClick={() => { setShowLogin(true); setError(''); }}>Sign in <ArrowRight size={15} /></button>}</div>
    </header>

    <main id="top">
      <section className="hero">
        <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line" /> GOOD FOOD, GOOD MOOD</div><h1>Your next favourite<br /><em>is closer than you think.</em></h1><p className="hero-description">The neighbourhood spots, little-known gems and big-time favourites that make every meal feel special.</p><div className="hero-search"><Search size={19} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Dishes, restaurants, cuisines..." aria-label="Search restaurants" /><span className="search-shortcut">⌘ K</span><button onClick={() => document.getElementById('restaurants')?.scrollIntoView({ behavior: 'smooth' })}>Explore <ArrowRight size={15} /></button></div><div className="social-proof"><div className="avatar-stack"><span>👩🏽</span><span>👨🏻</span><span>👩🏼</span><span>👨🏾</span></div><div><div className="proof-stars">★★★★★ <b>4.9</b></div><span className="proof-caption">Loved by 12,000+ foodies</span></div></div></div>
        <div className="hero-art"><div className="hero-image-wrap"><img src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1100&q=90" alt="Colourful fresh meal on a table" /><div className="image-shade" /><div className="floating-note"><span className="note-icon"><Sparkles size={17} /></span><span><strong>A little taste of joy</strong><small>Curated just for you</small></span></div></div><div className="hero-stamp"><span>FRESH<br />FINDS</span><span className="stamp-star">✳</span></div><div className="hero-scribble">made for<br /><em>sharing</em> <span>↗</span></div></div>
        <div className="hero-bottom-label"><span>01 / 04</span><span className="tiny-line" /><span>THE GOOD STUFF</span></div>
      </section>

      <section className="category-strip"><div><span className="section-kicker">FOLLOW YOUR CRAVING</span><h2>What sounds good?</h2></div><div className="category-list">{categories.map((item) => <button key={item.name} onClick={() => setCategory(item.name)} className={`category-chip ${category === item.name ? 'active' : ''}`}><span>{item.emoji}</span>{item.name}</button>)}</div></section>

      <section className="restaurants-section" id="restaurants"><div className="section-heading"><div><span className="section-kicker">AROUND THE CORNER</span><h2>Good things nearby<span className="orange-dot">.</span></h2><p>A few places we think you’ll love today.</p></div><button className="text-action" onClick={() => { setCategory('All'); setQuery(''); }}>View all places <ArrowUpRight size={17} /></button></div>
        {error && <div className="notice" role="status"><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss"><X size={16} /></button></div>}
        {loading && <div className="loading-label"><span className="loader" /> Finding your next favourite…</div>}
        <div className="restaurant-grid" aria-live="polite">{filteredItems.map((item, index) => <article className="restaurant-card" key={item.id || item.restaurant_id || restaurantName(item) + index}><div className="restaurant-photo">{restaurantImage(item) ? <img src={restaurantImage(item)} alt={restaurantName(item)} loading="lazy" /> : <div className={`food-placeholder food-${index % 4}`}><span>✳</span></div>}<span className="offer-tag">{item.offer || item.offer_text || ['20% OFF', 'FRESH PICK', 'LOCAL FAVOURITE', 'TODAY’S DEAL'][index % 4]}</span><button className="save-btn" aria-label={`Save ${restaurantName(item)}`} onClick={(e) => e.currentTarget.classList.toggle('saved')}>♡</button></div><div className="restaurant-info"><div className="restaurant-title-row"><h3>{restaurantName(item)}</h3><span className="rating"><Star size={13} fill="currentColor" /> {restaurantRating(item)}</span></div><p className="cuisine-line">{restaurantCuisine(item)}</p><div className="restaurant-meta"><span><MapPin size={13} />{restaurantLocation(item)}</span><span className="meta-dot" /><span><Clock3 size={13} />{item.delivery_time || item.deliveryTime || '25–35 min'}</span></div></div></article>)}</div>
        {!filteredItems.length && <div className="empty-state"><span>{token ? '🔎' : '✳'}</span><h3>{token ? 'No spots found just yet' : 'Your next favourite is waiting'}</h3><p>{token ? 'Try another search or pick a different craving.' : 'Sign in with your phone to discover restaurants around you.'}</p><button onClick={() => { if (!token) setShowLogin(true); else { setQuery(''); setCategory('All'); } }}>{token ? 'Clear filters' : 'Sign in to explore'}</button></div>}
      </section>

      <section className="closing-banner"><div><span className="section-kicker">THE BEST TABLE IS YOURS</span><h2>Good food brings<br />us <em>together.</em></h2><p>Find the spot. Bring your people. Make a moment of it.</p><button onClick={() => document.getElementById('restaurants')?.scrollIntoView({ behavior: 'smooth' })}>Find your table <ArrowRight size={16} /></button></div><div className="banner-mark">f<span>.</span></div><div className="banner-sun" /></section>
    </main>
    <footer className="footer"><a className="brand footer-brand" href="#top"><span className="brand-mark"><Utensils size={16} /></span><span>fastor<span className="brand-period">.</span></span></a><span>Good food. Good people. Good days.</span><span>© 2025 Fastor</span></footer>
    <nav className="mobile-tabs" aria-label="Mobile navigation"><button className="tab-active" onClick={() => { setActiveTab('Explore'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><Search size={18} /><span>Explore</span></button><button onClick={() => { setActiveTab('Offers'); setCategory('All'); }}><Flame size={18} /><span>Offers</span></button><button onClick={() => { if (!token) setShowLogin(true); }}><ShieldCheck size={18} /><span>{token ? 'Account' : 'Sign in'}</span></button></nav>

    {showLogin && <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowLogin(false); }}><section className="login-modal" role="dialog" aria-modal="true" aria-labelledby="login-title"><button className="modal-close" onClick={() => setShowLogin(false)} aria-label="Close sign-in"><X size={20} /></button><div className="login-brand"><span className="brand-mark"><Utensils size={18} /></span><span>fastor<span className="brand-period">.</span></span></div><div className="login-symbol">{otpStep ? <Check size={23} /> : <span>✳</span>}</div><span className="section-kicker">{otpStep ? 'ONE LAST STEP' : 'WELCOME TO THE TABLE'}</span><h2 id="login-title">{otpStep ? 'Check your messages.' : 'Good to see you.'}</h2><p>{otpStep ? `We sent a one-time code to +91 ${phone}.` : 'Sign in with your mobile number to find your next favourite.'}</p>{error && <div className="login-error" role="alert">{error}</div>}{!otpStep ? <form onSubmit={handleRequestOtp}><label htmlFor="phone">Mobile number</label><div className="phone-field"><span>🇮🇳 &nbsp;+91</span><input id="phone" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="Enter 10-digit number" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} required minLength={10} maxLength={10} /></div><button className="modal-submit" disabled={authLoading || phone.length !== 10}>{authLoading ? 'Sending code…' : 'Continue with phone'} <ArrowRight size={16} /></button></form> : <form onSubmit={handleVerifyOtp}><label htmlFor="otp">6-digit verification code</label><input id="otp" className="otp-input" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="· · · · · ·" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} required minLength={6} /><span className="otp-hint">For this task, use the default OTP <strong>123456</strong>.</span><button className="modal-submit" disabled={authLoading || otp.length !== 6}>{authLoading ? 'Verifying…' : 'Verify & sign in'} <ArrowRight size={16} /></button><button className="back-phone" type="button" onClick={() => { setOtpStep(false); setError(''); }}><ArrowLeft size={14} /> Change phone number</button></form>}<div className="secure-note"><ShieldCheck size={14} /> Your details are safe and secure.</div></section></div>}
  </div>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
