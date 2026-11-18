import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
} from '@mui/material'
import { api } from '../lib/api'
import { useIsMobile } from '../utils/responsive'
export default function PostTree({ arcId, currentPostId, onPostSelect, isArcMode = false }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const isMobile = useIsMobile()

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Ensure we have a valid arcId before fetching
        if (!arcId) {
          if (isArcMode) {
            setError('No arc selected.')
          }
          setLoading(false)
          return
        }
        
        const data = await api.getPostsByArc(arcId)
        setPosts(data || [])
      } catch (err) {
        console.error('Unexpected error:', err)
        setError('An unexpected error occurred. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [arcId, isArcMode])

  const containerStyles = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflowY: 'auto',
    backgroundColor: 'background.paper',
    borderRadius: 1,
    p: 0
  }

  const selectedItemStyles = {
    backgroundColor: 'action.selected',
    '&:hover': {
      backgroundColor: 'action.selected',
    }
  }

  const renderPostItem = (post) => (
    <ListItem
      key={post.id}
      disablePadding
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <ListItemButton
        selected={post.id === currentPostId}
        onClick={() => onPostSelect(post)}
        sx={post.id === currentPostId ? selectedItemStyles : {}}
      >
        <ListItemText
          primary={post.title}
          primaryTypographyProps={{
            fontWeight: post.id === currentPostId ? 'bold' : 'regular',
            fontSize: isMobile ? '0.875rem' : '1rem',
            noWrap: true
          }}
          secondary={post.username}
          secondaryTypographyProps={{
            fontSize: isMobile ? '0.75rem' : '0.875rem'
          }}
          sx={{ my: 0.5 }}
        />
      </ListItemButton>
    </ListItem>
  )

  // Loading state
  if (loading) {
    return (
      <Paper elevation={2} sx={containerStyles}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3, height: '100%' }}>
          <CircularProgress size={24} sx={{ mr: 2 }} />
          <Typography variant="body2">Loading posts...</Typography>
        </Box>
      </Paper>
    )
  }

  // Error state
  if (error) {
    return (
      <Paper elevation={2} sx={containerStyles}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3, height: '100%' }}>
          <Typography variant="body2" color="error" align="center">{error}</Typography>
        </Box>
      </Paper>
    )
  }

  // Empty state
  if (posts.length === 0) {
    return (
      <Paper elevation={2} sx={containerStyles}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3, height: '100%' }}>
          <Typography variant="body2" align="center">
            {isArcMode ? 'No posts found in this arc.' : 'No related posts found.'}
          </Typography>
        </Box>
      </Paper>
    )
  }

  // Normal state with posts
  return (
    <Paper elevation={2} sx={containerStyles}>
      <List disablePadding>
        {posts.map(post => renderPostItem(post))}
      </List>
    </Paper>
  )
} 