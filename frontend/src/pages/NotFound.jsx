import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/UI'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div style={{
      textAlign: 'center', padding: '80px 24px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '80vh',
    }}>
      <div style={{
        fontSize: 120, fontWeight: 900, lineHeight: 1,
        background: 'var(--gradient-text)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        marginBottom: 16, letterSpacing: '-4px',
        textShadow: 'none',
        filter: 'drop-shadow(0 0 30px rgba(6,182,212,0.2))',
      }}>404</div>
      <div style={{
        fontSize: 22, fontWeight: 700, color: 'var(--text)',
        marginBottom: 8, letterSpacing: '-0.3px',
      }}>Page not found</div>
      <div style={{
        fontSize: 14, color: 'var(--text-muted)', marginBottom: 32,
        maxWidth: 360, lineHeight: 1.6,
      }}>
        The page you're looking for doesn't exist or has been moved.
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <Button variant="primary" icon={<Home size={14} />} onClick={() => navigate('/')}>
          Back to Dashboard
        </Button>
        <Button variant="ghost" icon={<ArrowLeft size={14} />} onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    </div>
  )
}
