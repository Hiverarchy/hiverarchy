import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInterests } from '../contexts/InterestContext'
import { useProfile } from '../contexts/ProfileContext'
import { useAuth } from '../contexts/AuthContext'
import {
  Box,
  Container,
  Typography,
  Card,
  CardMedia,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Input
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import { api } from '../lib/api'

function Home() {
  const navigate = useNavigate()
  const { interests, loading: interestsLoading } = useInterests()
  const { blogProfile, loading: profileLoading, currentUsername, getFullLogoUrl, setBlogProfile } = useProfile()
  const { user } = useAuth()
  const [openLogoDialog, setOpenLogoDialog] = useState(false)
  const [openTaglineDialog, setOpenTaglineDialog] = useState(false)
  const [newTagline, setNewTagline] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)

  const getImagePath = (interest) => {
    try {
      return interest.image_path || '/images/default.jpg'
    } catch {
      return '/images/default.jpg'
    }
  }

  const handleInterestClick = (interest) => {
    navigate(`/${currentUsername}/interest/${interest.name}`)
  }

  const handleLogoEdit = () => {
    setOpenLogoDialog(true)
  }

  const handleTaglineEdit = () => {
    setNewTagline(blogProfile?.tagline || '')
    setOpenTaglineDialog(true)
  }

  const handleLogoUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    try {
      const data = await api.uploadMedia(selectedFile)
      const path = data?.url
      if (!path) {
        alert('Upload failed')
        return
      }
      const profile = await api.patchProfileMe({ logo: path })
      setBlogProfile(profile)
      setOpenLogoDialog(false)
      setSelectedFile(null)
    } catch (error) {
      console.error('Error uploading logo:', error)
      alert(error.message || 'Error updating logo. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleTaglineUpdate = async () => {
    try {
      const data = await api.patchProfileMe({ tagline: newTagline })
      setBlogProfile(data)
      setOpenTaglineDialog(false)
    } catch (error) {
      console.error('Error updating tagline:', error)
      alert('Error updating tagline. Please try again.')
    }
  }

  if (interestsLoading || profileLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: 2 }}>
        <CircularProgress />
        <Typography>Loading...</Typography>
      </Box>
    )
  }

  // Sort interests by sequence
  const sortedInterests = [...(interests || [])]
    .sort((a, b) => (a.sequence || 0) - (b.sequence || 0))

  const canEdit = user && blogProfile && user.email === blogProfile.email
  
  console.log('Edit permissions:', {
    userExists: !!user,
    userEmail: user?.email,
    blogProfileExists: !!blogProfile,
    blogProfileEmail: blogProfile?.email,
    canEdit
  })

  return (
    <Box>
      {/* Hero Section */}
      <Box 
        sx={{
          bgcolor: 'background.default',
          color: 'text.primary',
          py: 8,
          mt: 4,
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: 4,
            flexDirection: { xs: 'column', md: 'row' }
          }}>
            <Box sx={{ 
              width: { xs: '200px', md: '300px' },
              height: 'auto',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              '& img': {
                maxWidth: '100%',
                height: 'auto',
                display: 'block',
                margin: 0,
                borderRadius: 2,
                boxShadow: 3
              }
            }}>
              <img 
                src={getFullLogoUrl(blogProfile?.logo)}
                alt={blogProfile?.site_name || 'Site Logo'}
                onError={(e) => {
                  console.log('Logo load error, using default')
                  e.target.src = '/images/gg-logo.jpg'
                }}
              />
              {canEdit && (
                <IconButton
                  onClick={handleLogoEdit}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    boxShadow: 2,
                    '&:hover': {
                      backgroundColor: 'background.paper'
                    }
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
            <Box sx={{ 
              textAlign: { xs: 'center', md: 'left' },
              flex: 1,
              position: 'relative'
            }}>
              <Typography 
                variant="h2" 
                component="h1" 
                gutterBottom 
                sx={{ 
                  color: 'primary.main',
                  fontWeight: 'bold',
                  fontSize: { xs: '2.5rem', md: '3.5rem' }
                }}
              >
                {blogProfile?.site_name || 'Welcome'}
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1, 
                justifyContent: { xs: 'center', md: 'flex-start' }
              }}>
                <Typography 
                  variant="h5" 
                  component="h2" 
                  gutterBottom
                  sx={{ 
                    color: 'text.secondary',
                    fontWeight: 'medium',
                    lineHeight: 1.4
                  }}
                >
                  {blogProfile?.tagline || 'Exploring ideas and sharing experiences'}
                </Typography>
                {canEdit && (
                  <IconButton 
                    onClick={handleTaglineEdit} 
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      boxShadow: 1,
                      ml: 1,
                      '&:hover': {
                        backgroundColor: 'background.paper'
                      }
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Logo Edit Dialog */}
      <Dialog 
        open={openLogoDialog} 
        onClose={() => setOpenLogoDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Change Logo</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Upload an image. It is stored on the API under <code>/media/…</code> (sign in required).
          </Typography>
          <Box sx={{ pt: 1 }}>
            <Input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              accept="image/*"
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLogoDialog(false)}>Cancel</Button>
          <Button
            onClick={handleLogoUpload}
            disabled={!selectedFile || isUploading}
            variant="contained"
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tagline Edit Dialog */}
      <Dialog open={openTaglineDialog} onClose={() => setOpenTaglineDialog(false)}>
        <DialogTitle>Edit Tagline</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Tagline"
            fullWidth
            variant="outlined"
            value={newTagline}
            onChange={(e) => setNewTagline(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTaglineDialog(false)}>Cancel</Button>
          <Button onClick={handleTaglineUpdate} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Interests Section */}
      <Container sx={{ py: 8 }} maxWidth="lg">
        {sortedInterests.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom>
              No interests found
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Check back later for updates!
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {sortedInterests.map((interest, index) => (
              <Card 
                key={interest.id}
                sx={{ 
                  display: 'flex',
                  flexDirection: { xs: 'column', md: index % 2 === 0 ? 'row' : 'row-reverse' },
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'transform 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'scale(1.02)'
                  }
                }}
                onClick={() => handleInterestClick(interest)}
              >
                <CardMedia
                  component="img"
                  sx={{ 
                    width: { xs: '100%', md: '40%' },
                    height: { xs: 200, md: 300 },
                    objectFit: 'cover'
                  }}
                  image={getImagePath(interest)}
                  alt={interest.title}
                />
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    width: { xs: '100%', md: '60%' },
                    p: 4,
                  }}
                >
                  <Typography variant="h4" component="h2" gutterBottom>
                    {interest.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {interest.description}
                  </Typography>
                </Box>
              </Card>
            ))}
          </Box>
        )}
      </Container>
    </Box>
  )
}

export default Home