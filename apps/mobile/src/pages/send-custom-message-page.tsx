import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  ContactPicker,
  SelectAllContactsControl,
} from '../components/contact-picker';
import { MobileAppBar } from '../components/mobile-app-bar';
import { useContacts } from '../hooks/use-contacts';
import { trpc } from '../lib/trpc';

export function SendCustomMessagePage() {
  const navigate = useNavigate();
  const { data: groups } = trpc.listContactGroups.useQuery();
  const { allContacts: contacts } = useContacts();
  const sendMessage = trpc.sendWhatsAppMessage.useMutation();

  const [message, setMessage] = useState('');
  const [groupId, setGroupId] = useState('');
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const recipientCount = useMemo(() => {
    const phoneNumbers = new Set<string>();

    if (groupId) {
      const group = groups?.find((entry) => entry.id === groupId);
      for (const member of group?.members ?? []) {
        phoneNumbers.add(member.phoneNumber);
      }
    }

    for (const contactId of selectedContactIds) {
      const contact = contacts?.find((entry) => entry.id === contactId);
      if (contact) {
        phoneNumbers.add(contact.phoneNumber);
      }
    }

    return phoneNumbers.size;
  }, [groupId, groups, selectedContactIds, contacts]);

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

  const handleSend = async () => {
    setStatusMessage(null);

    if (!message.trim()) {
      setStatusMessage('Write a message before sending.');
      return;
    }

    if (!groupId && selectedContactIds.size === 0) {
      setStatusMessage('Select a group or at least one contact.');
      return;
    }

    try {
      const result = await sendMessage.mutateAsync({
        message: message.trim(),
        groupId: groupId || undefined,
        contactIds: [...selectedContactIds],
      });

      navigate(`/campaigns/${result.id}`);
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : 'Failed to send messages.',
      );
    }
  };

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default' }}>
      <MobileAppBar title="Custom message" onBack={() => navigate('/templates')} />

      <Container maxWidth="sm" sx={{ py: 3, pb: 12 }}>
        <Stack spacing={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Send a free-form text message. Recipients must have an open WhatsApp
                session with your business number (24-hour window).
              </Typography>
            </CardContent>
          </Card>

          <TextField
            label="Message"
            placeholder="Type your WhatsApp message..."
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            multiline
            minRows={6}
            fullWidth
            inputProps={{ maxLength: 4096 }}
            helperText={`${message.length}/4096`}
          />

          <Box>
            <Typography variant="h6" gutterBottom>
              Recipients
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="group-select-label">Contact group</InputLabel>
              <Select
                labelId="group-select-label"
                label="Contact group"
                value={groupId}
                onChange={(event) => setGroupId(event.target.value)}
              >
                <MenuItem value="">
                  <em>No group selected</em>
                </MenuItem>
                {groups?.map((group) => (
                  <MenuItem key={group.id} value={group.id}>
                    {group.name} ({group.memberCount})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {!groups?.length && (
              <Alert severity="info" sx={{ mb: 2 }}>
                No groups yet.{' '}
                <Typography
                  component="button"
                  sx={{ cursor: 'pointer', border: 0, bgcolor: 'transparent', color: 'primary.main' }}
                  onClick={() => navigate('/groups/new')}
                >
                  Create a group
                </Typography>
              </Alert>
            )}

            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Or select individual contacts
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
            onClick={handleSend}
            disabled={sendMessage.isPending || recipientCount === 0}
            fullWidth
          >
            {sendMessage.isPending ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              `Send to ${recipientCount} recipient${recipientCount === 1 ? '' : 's'}`
            )}
          </Button>

          {statusMessage && (
            <Alert
              severity={
                sendMessage.isError ||
                statusMessage.includes('Failed') ||
                statusMessage.includes('Select') ||
                statusMessage.includes('Write')
                  ? 'error'
                  : 'success'
              }
            >
              {statusMessage}
            </Alert>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
