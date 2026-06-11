import { useState } from 'react';
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
  Toolbar,
  Typography,
} from '@mui/material';
import { FiArrowLeft } from 'react-icons/fi';
import { ContactForm, type ContactFormValues } from '../components/contact-form';
import { trpc } from '../lib/trpc';

export function EditContactPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const utils = trpc.useUtils();
  const { data: contact, isLoading, error } = trpc.getContact.useQuery(
    { id },
    { enabled: Boolean(id) },
  );
  const updateContact = trpc.updateContact.useMutation();
  const deleteContact = trpc.deleteContact.useMutation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (values: ContactFormValues) => {
    setErrorMessage(null);

    try {
      await updateContact.mutateAsync({
        id,
        data: {
          name: values.name,
          phoneNumber: values.phoneNumber,
          email: values.email || undefined,
        },
      });
      await utils.listContacts.invalidate();
      await utils.getContactStats.invalidate();
      navigate('/phonebook');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to update contact.',
      );
    }
  };

  const handleDelete = async () => {
    setErrorMessage(null);

    try {
      await deleteContact.mutateAsync({ id });
      await utils.listContacts.invalidate();
      await utils.getContactStats.invalidate();
      navigate('/phonebook');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to delete contact.',
      );
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" elevation={0} color="transparent">
        <Toolbar>
          <IconButton edge="start" onClick={() => navigate('/phonebook')} aria-label="back">
            <FiArrowLeft />
          </IconButton>
          <Typography variant="h6" fontWeight={700}>
            Edit contact
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: 3 }}>
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {error && <Alert severity="error">{error.message}</Alert>}

        {contact && (
          <Stack spacing={2}>
            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
            <ContactForm
              defaultValues={{
                name: contact.name,
                phoneNumber: contact.phoneNumber,
                email: contact.email ?? '',
              }}
              submitLabel="Update contact"
              isSubmitting={updateContact.isPending}
              onSubmit={handleSubmit}
            />
            <Button
              color="error"
              variant="outlined"
              onClick={handleDelete}
              disabled={deleteContact.isPending}
            >
              Delete contact
            </Button>
          </Stack>
        )}
      </Container>
    </Box>
  );
}
