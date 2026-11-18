import { useState } from 'react'
import { Box, Button, Typography, IconButton, Tooltip, Snackbar, Alert } from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteIcon from '@mui/icons-material/Delete'
import { api, mediaUrl } from '../lib/api'

export default function ImageUpload({
  onUpload,
  onRemove,
  existingImages = [],
  showCopyOption = false,
}) {
  const [snackbar, setSnackbar] = useState({ open: false, message: '' })
  const [uploading, setUploading] = useState(false)

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const data = await api.uploadMedia(file)
      const path = data?.url
      if (!path) {
        setSnackbar({ open: true, message: 'Upload failed' })
        e.target.value = ''
        return
      }
      const url = mediaUrl(path)
      if (onUpload) {
        onUpload([url])
      }
    } catch (err) {
      setSnackbar({ open: true, message: err.message || 'Upload failed' })
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const copyMarkdown = (url) => {
    const md = `![image](${url})`
    navigator.clipboard.writeText(md).then(() => {
      setSnackbar({ open: true, message: 'Markdown copied' })
    })
  }

  return (
    <Box>
      <Button variant="outlined" component="label" sx={{ mb: 2 }} disabled={uploading}>
        {uploading ? 'Uploading…' : 'Choose image'}
        <input type="file" hidden accept="image/*" onChange={handleFileChange} disabled={uploading} />
      </Button>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
        Images are stored on the API and served at <code>/media/…</code> (sign in required).
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {existingImages.map((url, i) => (
          <Box key={i} sx={{ position: 'relative', width: 120, height: 120 }}>
            <Box
              component="img"
              src={url}
              alt=""
              sx={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 1 }}
            />
            {showCopyOption && (
              <Tooltip title="Copy markdown">
                <IconButton
                  size="small"
                  sx={{ position: 'absolute', top: 0, right: 24 }}
                  onClick={() => copyMarkdown(url)}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {onRemove && (
              <IconButton
                size="small"
                sx={{ position: 'absolute', top: 0, right: 0 }}
                onClick={() => onRemove(url)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        ))}
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity="success">{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  )
}
