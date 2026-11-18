import { useState, useEffect, useCallback } from 'react'
import { Box, TextField, Button, Typography, Container } from '@mui/material'
import MarkdownEditor from '../components/MarkdownEditor'
import ImageUpload from '../components/ImageUpload'
import { api } from '../lib/api'
import { useAI } from '../services/ai/index.jsx'
import { useProfile } from '../contexts/ProfileContext'

function getFullLogoUrl(filename) {
  if (!filename) return null
  if (filename.startsWith('http')) return filename
  const base = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || ''
  return base ? `${base}/media/profile_logos/${filename}` : '/images/gg-logo.jpg'
}

const UserProfile = () => {
  const [username, setUsername] = useState('')
  const [resume, setResume] = useState('')
  const [logo, setLogo] = useState(null)
  const [tagline, setTagline] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const ai = useAI()
  const { fetchProfiles } = useProfile()

  const getProfile = useCallback(async () => {
    try {
      const data = await api.getProfileMe()
      if (data) {
        setUsername(data.username || '')
        setResume(data.resume || '')
        setLogo(data.logo ? getFullLogoUrl(data.logo) : null)
        setTagline(data.tagline || '')
      }
    } catch (error) {
      console.error('Error fetching profile:', error.message)
      setMessage('Error fetching profile')
    }
  }, [])

  useEffect(() => {
    getProfile()
  }, [getProfile])

  const handleLogoUpload = (uploadedImages) => {
    if (uploadedImages && uploadedImages.length > 0) {
      setLogo(uploadedImages[0])
    }
  }

  const handleLogoRemove = async () => {
    setLogo(null)
  }

  const updateProfile = async () => {
    try {
      setLoading(true)
      if (!username.trim()) {
        throw new Error('Username is required')
      }

      let logoFilename = null
      if (logo) {
        const matches = logo.match(/\/([^/]+)$/)
        logoFilename = matches ? matches[1] : null
      }

      await api.patchProfileMe({
        username: username.trim().toLowerCase(),
        tagline,
        resume,
        logo: logoFilename,
      })

      if (ai?.loadServices) {
        await ai.loadServices()
      }

      await fetchProfiles()

      setMessage('Profile updated successfully')
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage(`Error updating profile: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          User Profile
        </Typography>
        {message && (
          <Typography color={message.includes('Error') ? 'error' : 'success'} gutterBottom>
            {message}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          LLM API keys belong in server environment variables for this stack — they are not stored from the web app.
        </Typography>
      </Box>

      <Box component="form" noValidate sx={{ mt: 1 }}>
        <TextField
          margin="normal"
          required
          fullWidth
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={loading}
        />

        <TextField
          margin="normal"
          fullWidth
          label="Tagline"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          disabled={loading}
          helperText="A brief description that appears on the home page"
        />

        <Box sx={{ mt: 2, mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Resume (Markdown)
          </Typography>
          <MarkdownEditor value={resume} onChange={setResume} />
        </Box>

        <Box sx={{ mt: 2, mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Logo
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            File upload to Nest media is not wired yet; local preview only.
          </Typography>
          <ImageUpload
            onUpload={handleLogoUpload}
            onRemove={handleLogoRemove}
            existingImages={logo ? [logo] : []}
            bucket="profile_logos"
            showCopyOption={false}
          />
        </Box>

        <Button
          fullWidth
          variant="contained"
          onClick={updateProfile}
          disabled={loading}
          sx={{ mt: 3, mb: 2 }}
        >
          {loading ? 'Saving...' : 'Save Profile'}
        </Button>
      </Box>
    </Container>
  )
}

export default UserProfile
