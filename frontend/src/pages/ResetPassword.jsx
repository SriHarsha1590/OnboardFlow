import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Lock, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Card, Button, Input } from '../components/UI'
import api from '../api/client'
import toast from 'react-hot-toast'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token || !email) {
      toast.error('Invalid reset link')
      navigate('/login')
    }
  }, [token, email, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (password.length < 6) {
      return toast.error('Password must be at least 6 characters')
    }
    if (password !== confirmPassword) {
      return toast.error('Passwords do not match')
    }

    setLoading(true)
    try {
      await api.post('/auth/reset-password', {
        email,
        token,
        newPassword: password
      })
      setSuccess(true)
      toast.success('Password reset successfully')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-4">
        <Card className="w-full max-w-md text-center p-8">
          <div className="w-16 h-16 bg-[var(--green-dim)] text-[var(--green)] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-2xl font-bold text-[var(--text)] mb-2">Password Reset!</h2>
          <p className="text-[var(--text-muted)] mb-8">
            Your password has been successfully updated. You can now log in with your new password.
          </p>
          <Link to="/login">
            <Button className="w-full">
              Go to Login
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-4">
      <Card className="w-full max-w-md p-8">
        <h2 className="text-2xl font-bold text-[var(--text)] mb-2">Create New Password</h2>
        <p className="text-[var(--text-muted)] mb-8 text-sm">
          Resetting password for <strong>{email}</strong>
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="New Password"
            type="password"
            icon={<Lock size={18} />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="Confirm New Password"
            type="password"
            icon={<Lock size={18} />}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <Button 
            type="submit" 
            className="w-full" 
            loading={loading}
          >
            Update Password
          </Button>
        </form>
      </Card>
    </div>
  )
}
