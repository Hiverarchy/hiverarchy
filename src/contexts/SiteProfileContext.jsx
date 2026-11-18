import { createContext, useContext, useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from './AuthContext'

const SiteProfileContext = createContext({})

export function SiteProfileProvider({ children }) {
  const [siteProfile, setSiteProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const { username } = useParams()
  const { user } = useAuth()
  const defaultUsername = import.meta.env.VITE_DEFAULT_USERNAME

  const fetchProfile = async (profileUsername) => {
    setLoading(true)
    try {
      const data = await api.getProfileByUsername(String(profileUsername).toLowerCase())
      setSiteProfile(data)
    } catch {
      setSiteProfile(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const profileUsername = username || defaultUsername
    if (profileUsername) {
      void fetchProfile(profileUsername)
    }
  }, [username, defaultUsername])

  const isOwner = () => {
    if (!user || !siteProfile) return false
    return user.id === siteProfile.user_id
  }

  const value = {
    siteProfile,
    loading,
    isOwner,
    fetchProfile,
    defaultUsername
  }

  return (
    <SiteProfileContext.Provider value={value}>
      {children}
    </SiteProfileContext.Provider>
  )
}

export function useSiteProfile() {
  return useContext(SiteProfileContext)
}
