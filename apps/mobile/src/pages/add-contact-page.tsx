import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  AppBar,
  Box,
  Container,
  IconButton,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import { FiArrowLeft } from 'react-icons/fi';
import { ContactForm, type ContactFormValues } from '../components/contact-form';
import { trpc } from '../lib/trpc';

export function AddContactPage() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const createContact = trpc.createContact.useMutation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (values: ContactFormValues) => {
    setErrorMessage(null);

    try {
      await createContact.mutateAsync({
        name: values.name,
        phoneNumber: values.phoneNumber,
        email: values.email || undefined,
      });
      await utils.listContacts.invalidate();
      await utils.getContactStats.invalidate();
      navigate('/phonebook');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to save contact.',
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
            Add contact
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: 3 }}>
        <Stack spacing={2}>
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
          <ContactForm
            submitLabel="Save contact"
            isSubmitting={createContact.isPending}
            onSubmit={handleSubmit}
          />
        </Stack>
      </Container>
    </Box>
  );
}
