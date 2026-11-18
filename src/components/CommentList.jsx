import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import Comment from './Comment'
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material'
import { Send as SendIcon } from '@mui/icons-material'

function CommentList({ postId, onCountChange }) {
  const { user } = useAuth()
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchComments = useCallback(async () => {
    try {
      setError(null)
      const commentsData = (await api.getComments(postId)) || []

      const commentMap = new Map()
      const rootComments = []

      commentsData.forEach((comment) => {
        comment.user_email = comment.profile?.email
        comment.username = comment.profile?.username
        comment.replies = []
        commentMap.set(String(comment.id), comment)
      })

      commentsData.forEach((comment) => {
        const pid = comment.parent_id ? String(comment.parent_id) : null
        if (pid) {
          const parent = commentMap.get(pid)
          if (parent) {
            parent.replies.push(comment)
          } else {
            rootComments.push(comment)
          }
        } else {
          rootComments.push(comment)
        }
      })

      setComments(rootComments)
    } catch (error) {
      console.error('Error fetching comments:', error)
      setError('Failed to load comments. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [postId])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  useEffect(() => {
    if (onCountChange) {
      onCountChange(comments.length)
    }
  }, [comments.length, onCountChange])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!user || !newComment.trim()) return

    setSubmitting(true)
    setError(null)

    try {
      await api.createComment(postId, { content: newComment.trim() })
      setNewComment('')
      await fetchComments()
    } catch (error) {
      console.error('Error adding comment:', error)
      setError(error.message || 'Failed to add comment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(commentId) {
    try {
      setError(null)
      await api.deleteComment(commentId)
      await fetchComments()
    } catch (error) {
      console.error('Error deleting comment:', error)
      setError(error.message || 'Failed to delete comment. Please try again.')
    }
  }

  const handleReply = async (parentId, content) => {
    try {
      setError(null)
      await api.createComment(postId, {
        content: content.trim(),
        parent_id: parentId,
      })
      await fetchComments()
    } catch (error) {
      console.error('Error adding reply:', error)
      setError(error.message || 'Failed to add reply. Please try again.')
    }
  }

  const renderComments = (commentList, depth = 0) => {
    return commentList.map(comment => (
      <Box key={comment.id}>
        <Comment
          comment={comment}
          onDelete={handleDelete}
          onReply={handleReply}
          depth={depth}
        />
        {comment.replies && comment.replies.length > 0 && (
          renderComments(comment.replies, depth + 1)
        )}
      </Box>
    ))
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ mt: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {user ? (
        <Paper 
          component="form" 
          onSubmit={handleSubmit}
          elevation={1}
          sx={{ 
            p: 3,
            mb: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2
          }}
        >
          <TextField
            multiline
            rows={3}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            variant="outlined"
            fullWidth
            disabled={submitting}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'background.default',
                '&:hover': {
                  backgroundColor: 'background.default',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                  },
                },
                '&.Mui-focused': {
                  backgroundColor: 'background.default',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                    borderWidth: 2,
                  },
                },
              },
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting || !newComment.trim()}
              endIcon={<SendIcon />}
              sx={{
                px: 3,
                py: 1,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              }}
            >
              {submitting ? 'Posting...' : 'Post Comment'}
            </Button>
          </Box>
        </Paper>
      ) : (
        <Alert severity="info" sx={{ mb: 4 }}>
          Please log in to comment.
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {comments.length > 0 ? (
          renderComments(comments)
        ) : (
          <Typography color="text.secondary" align="center">
            No comments yet. Be the first to comment!
          </Typography>
        )}
      </Box>
    </Box>
  )
}

export default CommentList