import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Zap, Shield, Users, Loader2, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

export default function Login() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ full_name: '', email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [focusedField, setFocusedField] = useState(null)
  const { login, register, googleLogin, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const googleBtnRef = useRef(null)

  const from = location.state?.from?.pathname || '/'

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true })
  }, [isAuthenticated, navigate, from])

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'your_google_client_id_here') return

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        })
        if (googleBtnRef.current) {
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: mode === 'login' ? 'signin_with' : 'signup_with',
            shape: 'pill',
          })
        }
      }
    }
    document.body.appendChild(script)
    return () => { if (document.body.contains(script)) document.body.removeChild(script) }
  }, [mode])

  async function handleGoogleResponse(response) {
    try {
      setSubmitting(true)
      await googleLogin(response.credential)
      toast.success('Welcome! Signed in with Google')
      navigate(from, { replace: true })
    } catch (err) {
      toast.error(err.message || 'Google sign-in failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)

    try {
      if (mode === 'register') {
        if (!form.full_name.trim()) {
          toast.error('Please enter your full name')
          setSubmitting(false)
          return
        }
        await register(form)
        toast.success('Account created! Welcome to OnboardFlow')
      } else {
        await login(form)
        toast.success('Welcome back!')
      }
      navigate(from, { replace: true })
    } catch (err) {
      toast.error(err.message || 'Authentication failed')
    } finally {
      setSubmitting(false)
    }
  }

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const showGoogleButton = GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'your_google_client_id_here'

  return (
    <div style={styles.page}>
      {/* Animated background */}
      <div style={styles.bgOrb1} />
      <div style={styles.bgOrb2} />
      <div style={styles.bgOrb3} />
      <div style={styles.bgGrid} />
      <div style={styles.bgNoise} />

      <div style={styles.container}>
        {/* Left Panel — Branding */}
        <div style={styles.brandPanel}>
          <div style={styles.brandContent}>
            <div style={styles.logoArea}>
              <div style={styles.logoIcon}><Zap size={28} color="#fff" /></div>
              <h1 style={styles.logoText}>OnboardFlow</h1>
            </div>
            <p style={styles.tagline}>Streamlined Employee Onboarding</p>
            <p style={styles.subtitle}>Powered by Temporal Workflows</p>

            <div style={styles.features}>
              {[
                { icon: Shield, title: 'Secure Process', desc: 'Multi-step approval workflows' },
                { icon: Users, title: 'Team Ready', desc: 'Seamless team integration' },
                { icon: Sparkles, title: 'AI-Powered', desc: 'Intelligent automation' },
              ].map(({ icon: Icon, title, desc }, i) => (
                <div key={title} style={{ ...styles.feature, animationDelay: `${0.2 + i * 0.15}s` }}>
                  <div style={styles.featureIcon}><Icon size={18} /></div>
                  <div>
                    <div style={styles.featureTitle}>{title}</div>
                    <div style={styles.featureDesc}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.stats}>
              <div style={styles.stat}>
                <div style={styles.statNumber}>99.9%</div>
                <div style={styles.statLabel}>Uptime</div>
              </div>
              <div style={styles.statDivider} />
              <div style={styles.stat}>
                <div style={styles.statNumber}>24hr</div>
                <div style={styles.statLabel}>Onboarding</div>
              </div>
              <div style={styles.statDivider} />
              <div style={styles.stat}>
                <div style={styles.statNumber}>100%</div>
                <div style={styles.statLabel}>Automated</div>
              </div>
            </div>
          </div>
          <div style={styles.brandFooter}>
            <span style={styles.footerDot}>●</span> Temporal Technologies
          </div>
        </div>

        {/* Right Panel — Auth Form */}
        <div style={styles.formPanel}>
          <div style={styles.formContent}>
            {/* Mode Tabs */}
            <div style={styles.tabContainer}>
              <button
                onClick={() => setMode('login')}
                style={{ ...styles.tab, ...(mode === 'login' ? styles.tabActive : {}) }}
              >
                Sign In
              </button>
              <button
                onClick={() => setMode('register')}
                style={{ ...styles.tab, ...(mode === 'register' ? styles.tabActive : {}) }}
              >
                Create Account
              </button>
              <div style={{
                ...styles.tabIndicator,
                transform: mode === 'register' ? 'translateX(100%)' : 'translateX(0)',
              }} />
            </div>

            <h2 style={styles.formTitle}>
              {mode === 'login' ? 'Welcome back' : 'Get started'}
            </h2>
            <p style={styles.formSubtitle}>
              {mode === 'login'
                ? 'Sign in with your personal email to continue'
                : 'Create your account with your personal email'}
            </p>

            {/* Google Sign-In */}
            {showGoogleButton ? (
              <>
                <div ref={googleBtnRef} style={styles.googleBtnContainer} />
                <div style={styles.divider}>
                  <span style={styles.dividerLine} />
                  <span style={styles.dividerText}>or continue with email</span>
                  <span style={styles.dividerLine} />
                </div>
              </>
            ) : (
              <button
                style={styles.googleButtonFallback}
                onClick={() => toast('Configure GOOGLE_CLIENT_ID in .env to enable Google Sign-In', { icon: 'ℹ️' })}
                type="button"
              >
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                <span>Continue with Google</span>
              </button>
            )}

            {!showGoogleButton && (
              <div style={styles.divider}>
                <span style={styles.dividerLine} />
                <span style={styles.dividerText}>or continue with email</span>
                <span style={styles.dividerLine} />
              </div>
            )}

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} style={styles.form}>
              {mode === 'register' && (
                <div style={{
                  ...styles.inputGroup,
                  ...(focusedField === 'full_name' ? styles.inputGroupFocused : {}),
                }}>
                  <User size={18} style={styles.inputIcon} />
                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    placeholder="Full Name"
                    value={form.full_name}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('full_name')}
                    onBlur={() => setFocusedField(null)}
                    style={styles.input}
                    autoComplete="name"
                  />
                </div>
              )}

              <div style={{
                ...styles.inputGroup,
                ...(focusedField === 'email' ? styles.inputGroupFocused : {}),
              }}>
                <Mail size={18} style={styles.inputIcon} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Personal Email"
                  value={form.email}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  style={styles.input}
                  autoComplete="email"
                  required
                />
              </div>

              <div style={{
                ...styles.inputGroup,
                ...(focusedField === 'password' ? styles.inputGroupFocused : {}),
              }}>
                <Lock size={18} style={styles.inputIcon} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={mode === 'register' ? 'Create Password (min 6 chars)' : 'Password'}
                  value={form.password}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  style={styles.input}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {mode === 'login' && (
                <div style={{ textAlign: 'right', marginTop: -8, marginBottom: 8 }}>
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    style={{ ...styles.switchBtn, fontSize: 12, textDecoration: 'none' }}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                style={{
                  ...styles.submitBtn,
                  ...(submitting ? styles.submitBtnDisabled : {}),
                }}
              >
                {submitting ? (
                  <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <>
                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <p style={styles.switchText}>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                style={styles.switchBtn}
              >
                {mode === 'login' ? 'Create one' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#06080f',
    position: 'relative',
    overflow: 'hidden',
    padding: 20,
  },
  bgOrb1: {
    position: 'absolute',
    width: 700,
    height: 700,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)',
    top: -250,
    right: -150,
    animation: 'float1 8s ease-in-out infinite',
  },
  bgOrb2: {
    position: 'absolute',
    width: 500,
    height: 500,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
    bottom: -200,
    left: -150,
    animation: 'float2 10s ease-in-out infinite',
  },
  bgOrb3: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
    top: '50%',
    left: '30%',
    animation: 'float3 12s ease-in-out infinite',
  },
  bgGrid: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)`,
    backgroundSize: '40px 40px',
  },
  bgNoise: {
    position: 'absolute',
    inset: 0,
    opacity: 0.02,
    background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
  },
  container: {
    display: 'flex',
    width: '100%',
    maxWidth: 1020,
    minHeight: 640,
    borderRadius: 20,
    overflow: 'hidden',
    boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
    position: 'relative',
    zIndex: 1,
    animation: 'containerIn 0.6s ease forwards',
  },

  // ── Left Branding Panel ──
  brandPanel: {
    flex: '0 0 420px',
    background: 'linear-gradient(160deg, #0c1019 0%, #111827 40%, #06080f 100%)',
    padding: '40px 36px 24px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    borderRight: '1px solid rgba(255,255,255,0.06)',
  },
  brandContent: {
    position: 'relative',
    zIndex: 1,
  },
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    background: 'var(--gradient)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 24px rgba(6,182,212,0.3)',
  },
  logoText: {
    fontSize: 26,
    fontWeight: 800,
    background: 'var(--gradient-text)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: '-0.5px',
    margin: 0,
  },
  tagline: {
    fontSize: 18,
    fontWeight: 600,
    color: 'var(--text)',
    margin: '0 0 4px',
    lineHeight: 1.3,
  },
  subtitle: {
    fontSize: 13,
    color: 'var(--text-muted)',
    margin: '0 0 36px',
    fontFamily: 'var(--mono)',
    letterSpacing: '0.5px',
  },
  features: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    marginBottom: 36,
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    animation: 'slideInLeft 0.5s ease forwards',
    opacity: 0,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--accent-1)',
    flexShrink: 0,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text)',
    marginBottom: 1,
  },
  featureDesc: {
    fontSize: 11,
    color: 'var(--text-muted)',
  },
  stats: {
    display: 'flex',
    alignItems: 'center',
    gap: 20,
    padding: '18px 20px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    border: '1px solid var(--border)',
  },
  stat: { textAlign: 'center', flex: 1 },
  statNumber: {
    fontSize: 22,
    fontWeight: 800,
    background: 'var(--gradient-text)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    lineHeight: 1.2,
  },
  statLabel: {
    fontSize: 10,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontWeight: 600,
  },
  statDivider: {
    width: 1,
    height: 30,
    background: 'var(--border)',
  },
  brandFooter: {
    fontSize: 11,
    color: 'var(--text-dim)',
    fontFamily: 'var(--mono)',
    position: 'relative',
    zIndex: 1,
  },
  footerDot: {
    color: 'var(--green)',
    marginRight: 6,
    fontSize: 8,
  },

  // ── Right Form Panel ──
  formPanel: {
    flex: 1,
    background: 'var(--bg2)',
    padding: '40px 44px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    minWidth: 0,
  },
  formContent: {
    maxWidth: 400,
    width: '100%',
    margin: '0 auto',
  },
  tabContainer: {
    display: 'flex',
    position: 'relative',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 28,
    border: '1px solid var(--border)',
  },
  tab: {
    flex: 1,
    border: 'none',
    background: 'none',
    padding: '10px 0',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-muted)',
    cursor: 'pointer',
    borderRadius: 10,
    fontFamily: 'var(--font)',
    position: 'relative',
    zIndex: 1,
    transition: 'color 0.25s',
  },
  tabActive: {
    color: 'var(--text)',
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 'calc(50% - 4px)',
    height: 'calc(100% - 8px)',
    background: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    border: '1px solid var(--border2)',
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 800,
    color: 'var(--text)',
    margin: '0 0 6px',
    letterSpacing: '-0.5px',
  },
  formSubtitle: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    margin: '0 0 24px',
    lineHeight: 1.5,
  },
  googleBtnContainer: {
    marginBottom: 0,
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
  },
  googleButtonFallback: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: '12px 16px',
    border: '1px solid var(--border2)',
    borderRadius: 12,
    background: 'rgba(255,255,255,0.04)',
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontFamily: 'var(--font)',
    transition: 'all 0.2s',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    margin: '20px 0',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: 'var(--border)',
  },
  dividerText: {
    fontSize: 11,
    color: 'var(--text-dim)',
    fontWeight: 500,
    whiteSpace: 'nowrap',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  inputGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '0 14px',
    border: '1px solid var(--border2)',
    borderRadius: 12,
    background: 'rgba(255,255,255,0.03)',
    transition: 'all 0.2s',
  },
  inputGroupFocused: {
    borderColor: 'var(--accent-1)',
    background: 'rgba(255,255,255,0.05)',
    boxShadow: '0 0 0 3px rgba(6,182,212,0.1)',
  },
  inputIcon: {
    color: 'var(--text-muted)',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    border: 'none',
    background: 'none',
    padding: '14px 0',
    fontSize: 14,
    color: 'var(--text)',
    outline: 'none',
    fontFamily: 'var(--font)',
  },
  eyeBtn: {
    border: 'none',
    background: 'none',
    padding: 4,
    cursor: 'pointer',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    borderRadius: 6,
  },
  submitBtn: {
    width: '100%',
    padding: '14px 16px',
    border: 'none',
    borderRadius: 12,
    background: 'var(--gradient)',
    color: '#fff',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    fontFamily: 'var(--font)',
    transition: 'all 0.2s',
    marginTop: 4,
    boxShadow: '0 4px 14px rgba(6,182,212,0.25)',
  },
  submitBtnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  switchText: {
    textAlign: 'center',
    fontSize: 13,
    color: 'var(--text-secondary)',
    marginTop: 20,
  },
  switchBtn: {
    border: 'none',
    background: 'none',
    color: 'var(--accent-1)',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: 13,
    fontFamily: 'var(--font)',
    textDecoration: 'underline',
    textUnderlineOffset: '2px',
  },
}
