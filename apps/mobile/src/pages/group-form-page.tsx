import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  AppBar,
  Box,
  Button,
  CircularProgress,
  Container,
  IconButton,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';
import { FiArrowLeft } from 'react-icons/fi';
import {
  ContactPicker,
  SelectAllContactsControl,
} from '../components/contact-picker';
import { trpc } from '../lib/trpc';

export function GroupFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const utils = trpc.useUtils();

  const { data: group, isLoading } = trpc.getContactGroup.useQuery(
    { id: id ?? '' },
    { enabled: isEditing },
  );
  const { data: contacts } = trpc.listContacts.useQuery();
  const createGroup = trpc.createContactGroup.useMutation();
  const updateGroup = trpc.updateContactGroup.useMutation();

  const [name, setName] = useState('');
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (group) {
      setName(group.name);
      setSelectedContactIds(new Set(group.members.map((member) => member.id)));
    }
  }, [group]);

  const toggleContact = (contactId: string) => {
    setSelectedContactIds((current) => {
      const next = new Set(current);

      if (next.has(contactId)) {
        next.delete(contactId);
      } else {
        next.add(contactId);
      }

      return next;
    });
  };

  const handleSubmit = async () => {
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Enter a group name.');
      return;
    }

    if (selectedContactIds.size === 0) {
      setErrorMessage('Select at least one contact for this group.');
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        contactIds: [...selectedContactIds],
      };

      if (isEditing && id) {
        await updateGroup.mutateAsync({ id, data: payload });
      } else {
        await createGroup.mutateAsync(payload);
      }

      await utils.listContactGroups.invalidate();
      navigate('/groups');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to save group.',
      );
    }
  };

  const isPending = createGroup.isPending || updateGroup.isPending;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" elevation={0} color="transparent">
        <Toolbar>
          <IconButton edge="start" onClick={() => navigate('/groups')} aria-label="back">
            <FiArrowLeft />
          </IconButton>
          <Typography variant="h6" fontWeight={700}>
            {isEditing ? 'Edit group' : 'New group'}
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: 3, pb: 12 }}>
        {isLoading && isEditing ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={3}>
            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

            <TextField
              label="Group name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              fullWidth
            />

            <Box>
              <Typography variant="h6" gutterBottom>
                Contacts
              </Typography>

              {contacts && contacts.length > 0 && (
                <SelectAllContactsControl
                  contacts={contacts}
                  selectedIds={selectedContactIds}
                  onChange={setSelectedContactIds}
                />
              )}

              <ContactPicker
                selectedIds={selectedContactIds}
                onToggle={toggleContact}
              />
            </Box>

            <Button
              variant="contained"
              size="large"
              onClick={handleSubmit}
              disabled={isPending}
              fullWidth
            >
              {isPending ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                `${isEditing ? 'Update' : 'Create'} group (${selectedContactIds.size})`
              )}
            </Button>
          </Stack>
        )}
      </Container>
    </Box>
  );
}
