import { useState, useEffect, useCallback } from 'react'
import {
  Container,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import { api } from '../lib/api'
import { useProfile } from '../contexts/ProfileContext'

const emptyForm = {
  title: '',
  name: '',
  description: '',
  route_path: '',
  sequence: 0,
  is_active: true,
}

export default function ManageInterests() {
  const { userProfile, blogProfile } = useProfile()
  const username = userProfile?.username || blogProfile?.username
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!username) {
      setRows([])
      setLoading(false)
      return
    }
    setError(null)
    try {
      const data = await api.getInterestsByUsername(String(username).toLowerCase(), true)
      setRows(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message || 'Failed to load interests')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [username])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (row) => {
    setEditingId(row.id)
    setForm({
      title: row.title ?? '',
      name: row.name ?? '',
      description: row.description ?? '',
      route_path: row.route_path ?? '',
      sequence: row.sequence ?? 0,
      is_active: row.is_active !== false,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError('Title is required')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const body = {
        title: form.title.trim(),
        name: form.name?.trim() || undefined,
        description: form.description || undefined,
        route_path: form.route_path || undefined,
        sequence: Number(form.sequence) || 0,
        is_active: form.is_active,
      }
      if (editingId) {
        await api.patchInterest(editingId, body)
      } else {
        await api.createInterest(body)
      }
      setDialogOpen(false)
      await load()
    } catch (e) {
      setError(e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this interest?')) return
    setError(null)
    try {
      await api.deleteInterest(id)
      await load()
    } catch (e) {
      setError(e.message || 'Delete failed')
    }
  }

  if (!username) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="info">Set up your profile (username) before managing interests.</Alert>
      </Container>
    )
  }

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Manage interests</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Add interest
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Sequence</TableCell>
              <TableCell>Active</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography color="text.secondary">No interests yet.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.title}</TableCell>
                  <TableCell>{row.name ?? '—'}</TableCell>
                  <TableCell>{row.sequence}</TableCell>
                  <TableCell>{row.is_active ? 'yes' : 'no'}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEdit(row)} aria-label="edit">
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(row.id)}
                      aria-label="delete"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingId ? 'Edit interest' : 'New interest'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            fullWidth
            required
          />
          <TextField
            label="Name (slug)"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            fullWidth
            helperText="Used when tagging posts (optional)"
          />
          <TextField
            label="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            fullWidth
            multiline
            minRows={2}
          />
          <TextField
            label="Route path"
            value={form.route_path}
            onChange={(e) => setForm((f) => ({ ...f, route_path: e.target.value }))}
            fullWidth
          />
          <TextField
            label="Sequence"
            type="number"
            value={form.sequence}
            onChange={(e) => setForm((f) => ({ ...f, sequence: e.target.value }))}
            fullWidth
          />
          <FormControlLabel
            control={
              <Switch
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              />
            }
            label="Active"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
