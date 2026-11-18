import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { api } from '../lib/api'
import { useProfile } from './ProfileContext'
import { useAuth } from './AuthContext'

const InterestContext = createContext()

export function useInterests() {
  return useContext(InterestContext)
}

export function InterestProvider({ children }) {
  const [interests, setInterests] = useState([])
  const [loading, setLoading] = useState(true)
  const { username: routeUsername } = useParams()
  const { blogProfile } = useProfile()
  const { user } = useAuth()
  const location = useLocation()
  const isManageRoute = location.pathname.includes('/manage/interests')

  const getUsernameFromPath = useCallback(() => {
    const pathParts = location.pathname.split('/').filter(Boolean)
    return pathParts[0]
  }, [location.pathname])

  const includeInactiveForOwner =
    isManageRoute && user?.email === blogProfile?.email

  useEffect(() => {
    const effectiveUsername = routeUsername || getUsernameFromPath()

    if (blogProfile?.username) {
      setLoading(true)
      const run = async () => {
        try {
          const data = await api.getInterestsByUsername(
            blogProfile.username.toLowerCase(),
            includeInactiveForOwner,
          )
          setInterests(data || [])
        } catch {
          setInterests([])
        } finally {
          setLoading(false)
        }
      }
      run()
      return
    }

    if (effectiveUsername) {
      setLoading(true)
      const run = async () => {
        try {
          const data = await api.getInterestsByUsername(
            effectiveUsername.toLowerCase(),
            includeInactiveForOwner,
          )
          setInterests(data || [])
        } catch {
          setInterests([])
        } finally {
          setLoading(false)
        }
      }
      run()
      return
    }

    setInterests([])
    setLoading(false)
  }, [
    routeUsername,
    blogProfile?.username,
    location.pathname,
    user?.email,
    isManageRoute,
    includeInactiveForOwner,
    getUsernameFromPath,
  ])

  const value = {
    interests,
    loading,
    fetchInterests: async (includeInactive = false) => {
      const effectiveUsername = routeUsername || getUsernameFromPath()
      const u = blogProfile?.username || effectiveUsername
      if (!u) return []
      try {
        return await api.getInterestsByUsername(u.toLowerCase(), includeInactive)
      } catch {
        return []
      }
    },
  }

  return (
    <InterestContext.Provider value={value}>
      {children}
    </InterestContext.Provider>
  )
}
