import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Fab,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';
import {
  FiArrowLeft,
  FiDownload,
  FiPlus,
  FiSearch,
  FiTrash2,
} from 'react-icons/fi';
import { trpc } from '../lib/trpc';

export function PhonebookPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const { data: contacts, isLoading, error } = trpc.listContacts.useQuery({
    search: search.trim() || undefined,
  });
  const deleteContact = trpc.deleteContact.useMutation({
    onSuccess: async () => {
      await utils.listContacts.invalidate();
      await utils.getContactStats.invalidate();
      setDeleteTargetId(null);
    },
  });

  const emptyMessage = useMemo(() => {
    if (search.trim()) {
      return 'No contacts match your search.';
    }

    return 'Your phonebook is empty. Add a contact or import from your device.';
  }, [search]);

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) {
      return;
    }

    await deleteContact.mutateAsync({ id: deleteTargetId });
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" elevation={0} color="transparent">
        <Toolbar>
          <IconButton edge="start" onClick={() => navigate('/home')} aria-label="back">
            <FiArrowLeft />
          </IconButton>
          <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
            Phonebook
          </Typography>
          <IconButton onClick={() => navigate('/phonebook/import')} aria-label="import contacts">
            <FiDownload />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: 3, pb: 10 }}>
        <Stack spacing={2}>
          <TextField
            placeholder="Search contacts"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FiSearch />
                </InputAdornment>
              ),
            }}
          />

          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Alert severity="error">
              {error.message || 'Failed to load contacts.'}
            </Alert>
          )}

          {!isLoading && !error && contacts?.length === 0 && (
            <Stack spacing={2} sx={{ py: 4 }}>
              <Typography color="text.secondary" textAlign="center">
                {emptyMessage}
              </Typography>
              <Button variant="contained" onClick={() => navigate('/phonebook/new')}>
                Add contact
              </Button>
              <Button variant="outlined" onClick={() => navigate('/phonebook/import')}>
                Import from device
              </Button>
            </Stack>
          )}

          {!isLoading && contacts && contacts.length > 0 && (
            <List
              sx={{
                bgcolor: 'background.paper',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              {contacts.map((contact) => (
                <ListItem
                  key={contact.id}
                  disablePadding
                  secondaryAction={
                    <IconButton
                      edge="end"
                      aria-label={`delete ${contact.name}`}
                      onClick={() => setDeleteTargetId(contact.id)}
                    >
                      <FiTrash2 />
                    </IconButton>
                  }
                >
                  <ListItemButton onClick={() => navigate(`/phonebook/${contact.id}/edit`)}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {contact.name.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={contact.name}
                      secondary={
                        <>
                          +{contact.phoneNumber}
                          {contact.email ? ` · ${contact.email}` : ''}
                        </>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Stack>
      </Container>

      <Fab
        color="primary"
        aria-label="add contact"
        onClick={() => navigate('/phonebook/new')}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
        }}
      >
        <FiPlus size={24} />
      </Fab>

      <Dialog open={Boolean(deleteTargetId)} onClose={() => setDeleteTargetId(null)}>
        <DialogTitle>Delete contact?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This contact will be removed from your phonebook.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTargetId(null)}>Cancel</Button>
          <Button
            color="error"
            onClick={handleConfirmDelete}
            disabled={deleteContact.isPending}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
