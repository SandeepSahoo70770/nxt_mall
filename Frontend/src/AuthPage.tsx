import { useState, type FormEvent } from 'react'
import brandMark from './assets/nxt-mark.png'
import './AuthPage.css'

export default function AuthPage() {
  const [mode, setMode] = useState<'signup' | 'login'>('signup')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [mobile, setMobile] = useState('')
  const [phoneOpen, setPhoneOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('Authentication is not connected yet. Your details have not been sent.')
  }
  return <main className="auth-page">
    <section className="auth-layout" aria-label="NxT Mall account access">
      <aside className="auth-brand-panel">
        <a className="auth-brand" href="/" aria-label="NxT Mall home"><img src={brandMark} alt="" /><span><b>NxT Mall</b><small>Shop Smarter. Live Better.</small></span></a>
        <div className="auth-brand-copy"><span className="auth-kicker">DISCOVER • SHOP • ENJOY</span><h1>Your next favorite<br />find is waiting.</h1><p>A thoughtful little corner for everything you love.</p></div>
        <div className="auth-benefits"><span>Wide selection</span><i/><span>Fast &amp; safe delivery</span><i/><span>Trusted shopping</span></div>
        <div className="auth-orb auth-orb-one"/><div className="auth-orb auth-orb-two"/>
      </aside>
      <section className="auth-card">
        <a className="auth-mobile-brand" href="/" aria-label="NxT Mall home"><img src={brandMark} alt=""/><b>NxT Mall</b></a>
        <div className="auth-heading"><h2>Welcome to NxT Mall</h2><p>Sign in or create an account to continue.</p></div>
        <div className="auth-tabs" role="tablist" aria-label="Account type"><button role="tab" aria-selected={mode==='login'} className={mode==='login'?'active':''} onClick={()=>{setMode('login');setMessage('')}}>Log in</button><button role="tab" aria-selected={mode==='signup'} className={mode==='signup'?'active':''} onClick={()=>{setMode('signup');setMessage('')}}>Sign up</button></div>
        <form className="auth-form" onSubmit={submit}>
          <label htmlFor="auth-email">Email</label><input id="auth-email" className="auth-input" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/>
          <div className="password-label"><label htmlFor="auth-password">Password</label><button type="button" className="forgot-link" onClick={()=>setMessage('Password reset is not connected yet.')}>Forgot password?</button></div>
          <div className="password-field"><input id="auth-password" className="auth-input" type={showPassword?'text':'password'} minLength={8} autoComplete={mode==='login'?'current-password':'new-password'} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters"/><button type="button" aria-label={showPassword?'Hide password':'Show password'} onClick={()=>setShowPassword(!showPassword)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.2-6 9.5-6 9.5 6 9.5 6-3.2 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg></button></div>
          <button className="auth-submit" type="submit">{mode==='signup'?'Create Account':'Log In'} <span aria-hidden="true">→</span></button>
        </form>
        <div className="auth-divider"><span>or continue with</span></div>
        <div className="auth-alternatives">
          <button className="social-button google-button" onClick={()=>setMessage('Google sign-in is not configured yet.')}><span className="google-g">G</span>Continue with Google</button>
          <button className="social-button facebook-button" onClick={()=>setMessage('Facebook sign-in is not configured yet.')}><span className="facebook-f">f</span>Continue with Facebook</button>
          <button className="social-button phone-option" aria-expanded={phoneOpen} onClick={()=>{setPhoneOpen(!phoneOpen);setMessage('')}}><span aria-hidden="true">＋91</span>Continue with Phone</button>
          {phoneOpen&&<div className="phone-field"><span>🇮🇳 &nbsp;+91</span><input inputMode="numeric" autoComplete="tel-national" maxLength={10} value={mobile} onChange={e=>setMobile(e.target.value.replace(/\D/g,'').slice(0,10))} placeholder="Enter 10-digit mobile number" aria-label="10-digit Indian mobile number"/><button type="button" className="otp-button" onClick={()=>setMessage(mobile.length===10?'OTP delivery is not connected yet.':'Enter a valid 10-digit mobile number.')}>Send OTP</button></div>}
        </div>
        {message&&<p className="auth-message" role="status">{message}</p>}
        <p className="auth-terms">By continuing, you agree to NxT Mall’s <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a>.</p>
        <p className="auth-switch">{mode==='signup'?'Already have an account?':'New to NxT Mall?'} <button onClick={()=>{setMode(mode==='signup'?'login':'signup');setMessage('')}}>{mode==='signup'?'Log in':'Create an account'}</button></p>
      </section>
    </section>
  </main>
}
