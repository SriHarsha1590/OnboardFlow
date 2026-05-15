import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, Send } from 'lucide-react'
import { Card, Button, Input, PageHeader } from '../components/UI'
import api from '../api/client'
import toast from 'react-hot-toast'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return toast.error('Please enter your email address')

    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
      toast.success('Reset link sent to your email')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send reset link')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-4">
        <Card className="w-full max-w-md text-center p-8">
          <div className="w-16 h-16 bg-[var(--cyan-dim)] text-[var(--cyan)] rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail size={32} />
          </div>
          <h2 className="text-2xl font-bold text-[var(--text)] mb-2">Check your email</h2>
          <p className="text-[var(--text-muted)] mb-8">
            We've sent a password reset link to <strong>{email}</strong>.
            Please check your inbox and follow the instructions.
          </p>
          <Link to="/login">
            <Button variant="ghost" className="w-full">
              <ArrowLeft size={18} className="mr-2" /> Back to Login
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-4">
      <Card className="w-full max-w-md p-8">
        <Link to="/login" className="inline-flex items-center text-sm text-[var(--text-muted)] hover:text-[var(--cyan)] mb-8 transition-colors">
          <ArrowLeft size={16} className="mr-1" /> Back to Login
        </Link>
        
        <h2 className="text-2xl font-bold text-[var(--text)] mb-2">Forgot Password?</h2>
        <p className="text-[var(--text-muted)] mb-8 text-sm">
          No worries! Enter your email address and we'll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Email Address"
            type="email"
            placeholder="name@company.com"
            icon={<Mail size={18} />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />

          <Button 
            type="submit" 
            className="w-full" 
            loading={loading}
            icon={<Send size={18} />}
          >
            Send Reset Link
          </Button>
        </form>
      </Card>
    </div>
  )
}
