import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { api } from '../lib/api'
import ImageUpload from '../components/ImageUpload'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../contexts/ProfileContext'
import { shouldShowUsernameInUrl } from '../utils/urlUtils'
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Grid,
  Chip,
  Stack,
  List,
  ListItem,
  ListItemText
} from '@mui/material'

function CreatePost() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { user } = useAuth()
  const { currentUsername } = useProfile()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [tagSuggestions, setTagSuggestions] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [availableInterests, setAvailableInterests] = useState([])
  const [post, setPost] = useState({
    title: '',
    brief_description: '',
    content: '',
    tag_names: [],
    tag_ids: [],
    interest_names: [],
    interest_ids: [],
    images: []
  })

  const fetchInterests = useCallback(async () => {
    try {
      if (!currentUsername) {
        console.log('No username for fetching interests')
        return
      }

      const data = await api.getInterestsByUsername(
        currentUsername.toLowerCase(),
        true,
      )

      setAvailableInterests(
        (data || []).map((interest) => ({
          id: interest.id,
          value: interest.name,
          label: interest.title,
        })),
      )
    } catch (error) {
      console.error('Error fetching interests:', error)
    }
  }, [currentUsername])

  const fetchAllTags = useCallback(async () => {
    try {
      if (!currentUsername) {
        setTagSuggestions([])
        return
      }
      const data = await api.getTagsByUsername(currentUsername.toLowerCase())
      const names = (data || []).map((t) => t.name).filter(Boolean)
      setTagSuggestions(names)
    } catch (e) {
      console.error('Error fetching tags:', e)
      setTagSuggestions([])
    }
  }, [currentUsername])

  useEffect(() => {
    if (!user) {
      navigate('/')
      return
    }

    fetchAllTags()
    fetchInterests()
  }, [user, navigate, fetchAllTags, fetchInterests])

  const handleInterestChange = (interest) => {
    setPost(prev => {
      const interestId = interest.id
      const interestName = interest.value

      // If interest is already selected, remove it
      if (prev.interest_names.includes(interestName)) {
        return {
          ...prev,
          interest_ids: prev.interest_ids.filter(id => id !== interestId),
          interest_names: prev.interest_names.filter(name => name !== interestName)
        }
      }

      // Otherwise, add it
      return {
        ...prev,
        interest_ids: [...prev.interest_ids, interestId],
        interest_names: [...prev.interest_names, interestName]
      }
    })
  }

  const handleTagInputChange = (e) => {
    setTagInput(e.target.value)
  }

  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag(e)
    }
  }

  const handleAddTag = async (event) => {
    const trimmedInput = event.target.value.trim().toLowerCase()

    if (trimmedInput && !post.tag_names.includes(trimmedInput)) {
      setPost((prev) => ({
        ...prev,
        tag_names: [...prev.tag_names, trimmedInput],
      }))
      event.target.value = ''
    }
  }

  const handleTagSelect = async (tagName) => {
    if (!post.tag_names.includes(tagName)) {
      setPost((prev) => ({
        ...prev,
        tag_names: [...prev.tag_names, tagName],
      }))
    }
    setTagInput('')
  }

  const removeTag = (tagToRemove) => {
    setPost(prev => ({
      ...prev,
      tag_names: prev.tag_names.filter(tag => tag !== tagToRemove),
      tag_ids: prev.tag_ids.filter((_, index) => prev.tag_names[index] !== tagToRemove)
    }))
  }

  const handleImageUpload = (uploadedImages) => {
    setPost(prev => ({ ...prev, images: [...prev.images, ...uploadedImages] }))
  }

  const handleRemoveImage = (imageUrl) => {
    setPost(prev => ({ ...prev, images: prev.images.filter(img => img !== imageUrl) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const newPost = await api.createPost({
        title: post.title,
        brief_description: post.brief_description,
        content: post.content,
        tag_names: post.tag_names,
        tag_ids: post.tag_ids,
        interest_names: post.interest_names,
        interest_ids: post.interest_ids,
        arc_id: state?.parentPost?.arc_id,
        parent_id: state?.parentPost?.id || undefined,
        post_writer: {
          status: 'child_posts',
          version: 1,
          content: post.brief_description || '',
          ideas: {
            ideas: [],
            relatedTopics: [],
            audiences: [],
            childPosts: [],
            futurePosts: [],
          },
          research_findings: null,
          refutations: null,
          post_outline: null,
          post_images: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      })

      const postId = newPost.id.includes(':')
        ? newPost.id.split(':').pop()
        : newPost.id
      navigate(`/${currentUsername}/post/${postId}`)
    } catch (error) {
      console.error('Error creating post:', error)
      setError('Failed to create post. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const filteredSuggestions = tagSuggestions.filter(tag => 
    tag.toLowerCase().includes(tagInput.toLowerCase()) && 
    !post.tag_names.includes(tag)
  )

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Create New Post
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {state?.parentPost && (
              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Creating child post for: <Link to={shouldShowUsernameInUrl() ? `/${currentUsername}/post/${state.parentPost.id}` : `/post/${state.parentPost.id}`} style={{ color: 'inherit', textDecoration: 'underline' }}>
                      {state.parentPost.title}
                    </Link>
                  </Typography>
                </Box>
              </Grid>
            )}

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Title"
                value={post.title}
                onChange={(e) => setPost(prev => ({ ...prev, title: e.target.value }))}
                error={!post.title}
                helperText={!post.title ? 'Title is required' : ''}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                multiline
                rows={3}
                label="Brief Description"
                placeholder="Enter a brief description of your post"
                value={post.brief_description}
                onChange={(e) => setPost(prev => ({ ...prev, brief_description: e.target.value }))}
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Interests
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {availableInterests.map((interest) => (
                  <Chip
                    key={interest.id}
                    label={interest.label}
                    onClick={() => handleInterestChange(interest)}
                    color={post.interest_names.includes(interest.value) ? 'primary' : 'default'}
                    variant={post.interest_names.includes(interest.value) ? 'filled' : 'outlined'}
                  />
                ))}
              </Stack>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Tags
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Previously used tags:
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {tagSuggestions.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    onClick={() => handleTagSelect(tag)}
                    variant="outlined"
                    color={post.tag_names.includes(tag) ? 'primary' : 'default'}
                  />
                ))}
              </Stack>
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label="Add tags"
                  value={tagInput}
                  onChange={handleTagInputChange}
                  onKeyDown={handleTagInputKeyDown}
                  helperText="Press Enter to add a tag"
                />
                {filteredSuggestions.length > 0 && tagInput && (
                  <Paper sx={{ mt: 1, maxHeight: 200, overflow: 'auto' }}>
                    <List dense>
                      {filteredSuggestions.map((suggestion, index) => (
                        <ListItem
                          key={index}
                          button
                          onClick={() => handleTagSelect(suggestion)}
                        >
                          <ListItemText primary={suggestion} />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                )}
              </Box>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {post.tag_names.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    onDelete={() => removeTag(tag)}
                  />
                ))}
              </Stack>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Content
              </Typography>
              <TextField
                required
                fullWidth
                multiline
                rows={10}
                value={post.content}
                onChange={(e) => setPost(prev => ({ ...prev, content: e.target.value }))}
                error={!post.content}
                helperText={!post.content ? 'Content is required' : ''}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Images
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Tip: Hover over an uploaded image and click the "Copy" icon to get the markdown code for embedding the image in your post.
              </Typography>
              <ImageUpload
                onUpload={handleImageUpload}
                onRemove={handleRemoveImage}
                existingImages={post.images}
                bucket="post-images"
                folder="post-images"
                showCopyOption={true}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate(-1)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading || !post.title || !post.content}
                >
                  {loading ? 'Creating...' : 'Create Post'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  )
}

export default CreatePost