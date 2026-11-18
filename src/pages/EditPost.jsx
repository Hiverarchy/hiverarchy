import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { Box, TextField, Button, Container, Paper, Typography, Divider, Grid, Stack, Chip, List, ListItem, ListItemText } from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import MarkdownEditor from '../components/MarkdownEditor'
import CommentList from '../components/CommentList'
import RefutationList from '../components/RefutationList'
import ImageUpload from '../components/ImageUpload'
import { useProfile } from '../contexts/ProfileContext'

export default function EditPost() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentUsername } = useProfile()
  const [post, setPost] = useState({
    title: '',
    brief_description: '',
    content: '',
    tag_names: [],
    interest_names: [],
    completeness: 3
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [tagInput, setTagInput] = useState('')
  const [tagSuggestions, setTagSuggestions] = useState([])
  const [availableInterests, setAvailableInterests] = useState([])

  const getPost = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.getPost(id)
      setPost({
        ...data,
        images: data.images || [],
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [id])

  const fetchTagSuggestions = useCallback(async () => {
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

  const fetchAvailableInterests = useCallback(async () => {
    try {
      if (!currentUsername) return
      const data = await api.getInterestsByUsername(currentUsername.toLowerCase(), true)
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

  useEffect(() => {
    getPost()
    fetchTagSuggestions()
    fetchAvailableInterests()
  }, [getPost, fetchTagSuggestions, fetchAvailableInterests])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      await api.updatePost(id, {
        title: post.title,
        brief_description: post.brief_description,
        content: post.content,
        tag_names: post.tag_names,
        tag_ids: post.tag_ids,
        interest_names: post.interest_names,
        interest_ids: post.interest_ids,
      })

      navigate(`/${currentUsername}/post/${id}`)
    } catch (error) {
      console.error('Error updating post:', error)
      setError('Failed to update post. Please try again.')
    } finally {
      setSaving(false)
    }
  }

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
    if (e.key === 'Enter' && tagInput.trim()) {
      handleTagSelect(tagInput.trim())
      setTagInput('')
    }
  }

  const handleTagSelect = async (tag) => {
    setPost((prev) => {
      if (prev.tag_names.includes(tag)) {
        return prev
      }
      return {
        ...prev,
        tag_names: [...prev.tag_names, tag],
      }
    })
    setTagInput('')
  }

  const removeTag = (tagToRemove) => {
    setPost(prev => {
      const index = prev.tag_names.indexOf(tagToRemove)
      const newTagNames = prev.tag_names.filter(tag => tag !== tagToRemove)
      const newTagIds = [...(prev.tag_ids || [])]
      if (index !== -1) {
        newTagIds.splice(index, 1)
      }
      return {
        ...prev,
        tag_names: newTagNames,
        tag_ids: newTagIds
      }
    })
  }

  const handleImageUpload = async (urls) => {
    const list = Array.isArray(urls) ? urls : [urls]
    setPost((prev) => ({
      ...prev,
      images: [...(prev.images || []), ...list],
    }))
  }

  const handleRemoveImage = async (target) => {
    setPost((prev) => ({
      ...prev,
      images: (prev.images || []).filter((img) => {
        if (typeof img === 'string') return img !== target
        return img.id !== target && img.url !== target
      }),
    }))
  }

  const filteredSuggestions = tagSuggestions.filter(tag =>
    tag.toLowerCase().includes(tagInput.toLowerCase()) &&
    !post.tag_names.includes(tag)
  )

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  if (!post) {
    return <div>Post not found</div>
  }

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 4, mt: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Edit Post
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </Box>
        </Box>

        <Box component="form" noValidate sx={{ mt: 1 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Title"
                value={post.title}
                onChange={(e) => setPost(prev => ({ ...prev, title: e.target.value }))}
                disabled={saving}
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
              <TextField
                type="number"
                required
                label="Completeness"
                value={post.completeness || 3}
                onChange={(e) => {
                  const value = Math.min(Math.max(parseInt(e.target.value) || 0, 0), 10)
                  setPost(prev => ({ ...prev, completeness: value }))
                }}
                inputProps={{
                  min: 0,
                  max: 10,
                  step: 1
                }}
                helperText="Rate the completeness of this post from 0 to 10"
                sx={{ width: 200 }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Interests
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {availableInterests.map((interest) => (
                  <Chip
                    key={interest.value}
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
              <Box sx={{ mt: 2 }}>
                <MarkdownEditor
                  value={post.content}
                  onChange={(value) => setPost(prev => ({ ...prev, content: value }))}
                />
              </Box>
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
                existingImages={(post.images || []).map((i) =>
                  typeof i === 'string' ? i : i.url,
                )}
                showCopyOption={true}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Comments Section */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Comments
          </Typography>
          <CommentList postId={post.id} />
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Refutations Section */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Refutations
          </Typography>
          <RefutationList postId={post.id} />
        </Box>
      </Paper>

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={() => navigate(-1)}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>
    </Container>
  )
}