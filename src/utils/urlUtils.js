import { api } from '../lib/api'

const DEFAULT_USERNAME = import.meta.env.VITE_DEFAULT_USERNAME || 'golfergeek'

async function profileExistsForUsername(segment) {
  try {
    await api.getProfileByUsername(String(segment).toLowerCase())
    return true
  } catch {
    return false
  }
}

export const getDomain = () => {
  return window.location.hostname
}

export const getPort = () => {
  return window.location.port
}

export const isHiverarchyDomain = () => {
  const domain = getDomain()
  const port = getPort()

  if (domain === 'localhost' && port === '4021') {
    return true
  }

  return domain.includes('hiverarchy.com')
}

export const isLocalhost = () => {
  const domain = getDomain()
  return domain === 'localhost'
}

export const shouldShowUsernameInUrl = () => {
  return getDomain() !== 'localhost' || getPort() === '4021'
}

export const shouldShowWelcomePage = () => {
  return isHiverarchyDomain() && window.location.pathname === '/'
}

export const extractUsernameFromDomain = () => {
  const domain = getDomain()
  if (domain === 'localhost') return null

  const parts = domain.split('.')
  if (parts.length > 0) {
    return parts[0]
  }

  return null
}

export const getEffectiveUsername = async (blogProfile = null) => {
  if (blogProfile?.username) {
    return blogProfile.username
  }

  if (!isHiverarchyDomain() && !isLocalhost()) {
    const domainUsername = extractUsernameFromDomain()
    if (domainUsername) return domainUsername
  }

  if (isLocalhost() && getPort() !== '4021') {
    return DEFAULT_USERNAME
  }

  const pathParts = window.location.pathname.split('/').filter(Boolean)
  if (pathParts[0]) {
    try {
      if (await profileExistsForUsername(pathParts[0])) {
        return pathParts[0]
      }
    } catch {
      console.log('First URL part is not a valid username:', pathParts[0])
    }
  }

  if (getDomain() === 'localhost' && getPort() === '4021') {
    return null
  }

  return DEFAULT_USERNAME
}

export const formatPath = (path = '', username = null) => {
  const cleanPath = path.split('/').filter(Boolean).join('/')

  if (!shouldShowUsernameInUrl()) {
    return `/${cleanPath}`
  }

  if (username) {
    return `/${username}/${cleanPath}`
  }

  return `/${cleanPath}`
}

export const isValidPath = (path) => {
  const parts = path.split('/').filter(Boolean)

  if (parts.length === 0) {
    return isHiverarchyDomain()
  }

  if (shouldShowUsernameInUrl()) {
    return true
  }

  return true
}

export const getRedirectPath = async (currentPath, blogProfile = null) => {
  let cleanPath = currentPath.split(/[?#]/)[0]

  const parts = cleanPath.split('/').filter(Boolean)
  const username = await getEffectiveUsername(blogProfile)

  console.log('getRedirectPath:', {
    originalPath: currentPath,
    cleanPath,
    parts,
    username,
    isHiverarchyDomain: isHiverarchyDomain(),
    domain: getDomain(),
    port: getPort(),
  })

  if (!username && shouldShowUsernameInUrl()) {
    console.log('Early return: Username required but not available')
    return null
  }

  if (isHiverarchyDomain() && parts.length === 0) {
    return null
  }

  if (shouldShowUsernameInUrl()) {
    if (parts.length === 0 && username) {
      return `/${username}`
    }

    if (parts.length > 0) {
      try {
        if (await profileExistsForUsername(parts[0])) {
          console.log(`Found valid username ${parts[0]} in URL, no redirection needed`)
          return null
        }
      } catch {
        console.log('First URL part is not a valid username:', parts[0])
      }
    }

    if (username) {
      return `/${username}/${parts.join('/')}`
    }
  }

  if (isLocalhost() && getPort() !== '4021') {
    return null
  }

  return null
}

export const removeUsernameFromPath = async (path) => {
  const parts = path.split('/').filter(Boolean)

  if (parts.length === 0 || !shouldShowUsernameInUrl()) {
    return path
  }

  try {
    if (await profileExistsForUsername(parts[0])) {
      return '/' + parts.slice(1).join('/')
    }
  } catch {
    /* not a username */
  }

  return path
}
