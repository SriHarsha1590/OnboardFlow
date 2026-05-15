import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount, check for existing token
  useEffect(() => {
    const token = localStorage.getItem('onboardflow_token')
    const savedUser = localStorage.getItem('onboardflow_user')

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch {
        localStorage.removeItem('onboardflow_token')
        localStorage.removeItem('onboardflow_user')
      }
    }
    setLoading(false)
  }, [])

  const saveAuth = useCallback((userData, token) => {
    localStorage.setItem('onboardflow_token', token)
    localStorage.setItem('onboardflow_user', JSON.stringify(userData))
    setUser(userData)
  }, [])

  const register = useCallback(async ({ full_name, email, password }) => {
    const res = await authApi.register({ full_name, email, password })
    saveAuth(res.data.user, res.data.token)
    return res.data.user
  }, [saveAuth])

  const login = useCallback(async ({ email, password }) => {
    const res = await authApi.login({ email, password })
    saveAuth(res.data.user, res.data.token)
    return res.data.user
  }, [saveAuth])

  const googleLogin = useCallback(async (credential) => {
    const res = await authApi.google({ credential })
    saveAuth(res.data.user, res.data.token)
    return res.data.user
  }, [saveAuth])

  const logout = useCallback(() => {
    localStorage.removeItem('onboardflow_token')
    localStorage.removeItem('onboardflow_user')
    setUser(null)
  }, [])

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    register,
    login,
    googleLogin,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
