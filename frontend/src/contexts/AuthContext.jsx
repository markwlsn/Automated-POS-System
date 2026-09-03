import { createContext, useContext, useEffect, useState } from 'react'
import { authApi, getToken } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function restoreSession() {
    const token = getToken()
    if (!token) {
      setUser(null)
      setProfile(null)
      setLoading(false)
      return
    }

    try {
      const data = await authApi.getMe()
      if (data?.user) {
        setUser(data.user)
        setProfile(data.user)
      } else {
        authApi.logout()
        setUser(null)
        setProfile(null)
      }
    } catch {
      authApi.logout()
      setUser(null)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    restoreSession()
  }, [])

  async function signUp({ email, password, fullName, phoneNumber }) {
    try {
      const data = await authApi.signup({ email, password, fullName, phoneNumber })
      setUser(data.user)
      setProfile(data.user)
      return { data, error: null }
    } catch (err) {
      return { data: null, error: { message: err.message, code: err.code } }
    }
  }

  async function signIn({ email, password }) {
    try {
      const data = await authApi.login({ email, password })
      setUser(data.user)
      setProfile(data.user)
      return { data, error: null }
    } catch (err) {
      return { data: null, error: { message: err.message, code: err.code } }
    }
  }

  async function signOut() {
    authApi.logout()
    setUser(null)
    setProfile(null)
  }

  const value = { user, profile, loading, signUp, signIn, signOut }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside an AuthProvider')
  return ctx
}
