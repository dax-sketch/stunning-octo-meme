import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  CircularProgress,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { noteService, Note } from '../services/noteService';

interface CompanyNotesProps {
  companyId: string;
  companyName: string;
}

interface NoteFormData {
  content: string;
}

export const CompanyNotes: React.FC<CompanyNotesProps> = ({
  companyId,
  companyName,
}) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [formData, setFormData] = useState<NoteFormData>({ content: '' });
  const [submitting, setSubmitting] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  // Load notes on component mount
  useEffect(() => {
    loadNotes();
  }, [companyId]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedNotes = await noteService.getNotesByCompany(companyId);
      setNotes(fetchedNotes);
    } catch (err: any) {
      setError(err.message || 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!formData.content.trim()) {
      setError('Note content is required');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const newNote = await noteService.createNote(companyId, {
        content: formData.content.trim(),
      });
      setNotes([newNote, ...notes]);
      setFormData({ content: '' });
      setIsAddDialogOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create note');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditNote = async () => {
    if (!editingNote || !formData.content.trim()) {
      setError('Note content is required');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const updatedNote = await noteService.updateNote(editingNote.id, {
        content: formData.content.trim(),
      });
      setNotes(
        notes.map((note) => (note.id === editingNote.id ? updatedNote : note))
      );
      setFormData({ content: '' });
      setEditingNote(null);
      setIsEditDialogOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update note');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      setError(null);
      await noteService.deleteNote(noteId);
      setNotes(notes.filter((note) => note.id !== noteId));
      handleCloseMenu();
    } catch (err: any) {
      setError(err.message || 'Failed to delete note');
    }
  };

  const openAddDialog = () => {
    setFormData({ content: '' });
    setError(null);
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (note: Note) => {
    setEditingNote(note);
    setFormData({ content: note.content });
    setError(null);
    setIsEditDialogOpen(true);
    handleCloseMenu();
  };

  const closeAddDialog = () => {
    setIsAddDialogOpen(false);
    setFormData({ content: '' });
    setError(null);
  };

  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingNote(null);
    setFormData({ content: '' });
    setError(null);
  };

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    noteId: string
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedNoteId(noteId);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedNoteId(null);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown Date';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    return (
      date.toLocaleDateString() +
      ' ' +
      date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    );
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        sx={{ pl: 2, pr: 1 }} // Move title right, button left
      >
        <Typography variant="h6" component="h2">
          Notes
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openAddDialog}
        >
          Add Note
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Notes List */}
      {notes.length === 0 ? (
        <Card>
          <CardContent>
            <Typography
              variant="body1"
              color="text.secondary"
              textAlign="center"
            >
              No notes found for this company. Add the first note to get
              started.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ px: 2 }}>
          {notes.map((note) => (
            <Card key={note.id} sx={{ mb: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="flex-start"
                >
                  <Box flex={1}>
                    <Typography
                      variant="body1"
                      sx={{ mb: 2, whiteSpace: 'pre-wrap' }}
                    >
                      {note.content}
                    </Typography>

                    <Box
                      display="flex"
                      alignItems="center"
                      gap={2}
                      flexWrap="wrap"
                    >
                      <Chip
                        icon={<PersonIcon />}
                        label={note.user?.username || 'Unknown User'}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        icon={<TimeIcon />}
                        label={formatDate(note.createdAt)}
                        size="small"
                        variant="outlined"
                      />
                      {note.createdAt !== note.updatedAt && (
                        <Chip
                          label={`Updated: ${formatDate(note.updatedAt)}`}
                          size="small"
                          variant="outlined"
                          color="secondary"
                        />
                      )}
                    </Box>
                  </Box>

                  <IconButton
                    onClick={(e) => handleMenuClick(e, note.id)}
                    size="small"
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem
          onClick={() => {
            const note = notes.find((n) => n.id === selectedNoteId);
            if (note) openEditDialog(note);
          }}
        >
          <EditIcon sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedNoteId) handleDeleteNote(selectedNoteId);
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Add Note Dialog */}
      <Dialog
        open={isAddDialogOpen}
        onClose={closeAddDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add New Note</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Note Content"
            multiline
            rows={4}
            fullWidth
            variant="outlined"
            value={formData.content}
            onChange={(e) => setFormData({ content: e.target.value })}
            placeholder="Enter your note here..."
            error={!!error}
            helperText={error}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAddDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleAddNote}
            variant="contained"
            disabled={submitting || !formData.content.trim()}
          >
            {submitting ? <CircularProgress size={20} /> : 'Add Note'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Note Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onClose={closeEditDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Note</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Note Content"
            multiline
            rows={4}
            fullWidth
            variant="outlined"
            value={formData.content}
            onChange={(e) => setFormData({ content: e.target.value })}
            placeholder="Enter your note here..."
            error={!!error}
            helperText={error}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleEditNote}
            variant="contained"
            disabled={submitting || !formData.content.trim()}
          >
            {submitting ? <CircularProgress size={20} /> : 'Update Note'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
