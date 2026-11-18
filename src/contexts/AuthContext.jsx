import { createContext, useContext, useEffect, useState } from 'react'
import { api, clearToken, getToken, parseJwtPayload, setToken } from '../lib/api'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (token) {
      const payload = parseJwtPayload(token)
      if (payload?.sub) {
        setUser({
          id: payload.sub,
          email: payload.email,
        })
      } else {
        clearToken()
        setUser(null)
      }
    } else {
      setUser(null)
    }
    setLoading(false)
  }, [])

  async function signUp({ email, password, username }) {
    const body = { email, password }
    if (username) body.username = username
    const data = await api.register(body)
    setToken(data.access_token)
    const payload = parseJwtPayload(data.access_token)
    setUser({ id: payload.sub, email: payload.email ?? email })
    return { error: null, data }
  }

  async function signIn({ email, password }) {
    const data = await api.login({ email, password })
    setToken(data.access_token)
    const payload = parseJwtPayload(data.access_token)
    setUser({ id: payload.sub, email: payload.email ?? email })
    return { error: null, data }
  }

  async function signOut() {
    clearToken()
    setUser(null)
    return { error: null }
  }

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
}

export const useAuth = () => {
  return useContext(AuthContext)
}
