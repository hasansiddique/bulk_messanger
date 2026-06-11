import { useNavigate } from 'react-router-dom';
import {
  Alert,
  AppBar,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import { FiArrowLeft } from 'react-icons/fi';
import { trpc } from '../lib/trpc';

export function TemplatesPage() {
  const navigate = useNavigate();
  const { data: templates, isLoading, error, refetch, isFetching } =
    trpc.listWhatsAppTemplates.useQuery();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" elevation={0} color="transparent">
        <Toolbar>
          <IconButton edge="start" onClick={() => navigate('/home')} aria-label="back">
            <FiArrowLeft />
          </IconButton>
          <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
            WhatsApp templates
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: 3, pb: 10 }}>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Approved templates from your WhatsApp Business dashboard.
          </Typography>

          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Alert
              severity="error"
              action={
                <Typography
                  component="button"
                  sx={{ cursor: 'pointer', border: 0, bgcolor: 'transparent' }}
                  onClick={() => refetch()}
                >
                  Retry
                </Typography>
              }
            >
              {error.message}
            </Alert>
          )}

          {!isLoading && !error && templates?.length === 0 && (
            <Alert severity="info">
              No approved templates found. Create and approve templates in Meta Business
              Manager first.
            </Alert>
          )}

          {templates?.map((template) => (
            <Card key={`${template.name}:${template.language}`}>
              <CardActionArea
                onClick={() =>
                  navigate('/templates/send', {
                    state: { template },
                  })
                }
              >
                <CardContent>
                  <Stack spacing={1}>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Typography variant="h6">{template.name}</Typography>
                      <Chip label={template.language} size="small" />
                      {template.category && (
                        <Chip label={template.category} size="small" variant="outlined" />
                      )}
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                      {template.preview}
                    </Typography>
                    {template.variables.length > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        {template.variables.length} variable
                        {template.variables.length === 1 ? '' : 's'} required
                      </Typography>
                    )}
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}

          {isFetching && !isLoading && (
            <Typography variant="caption" color="text.secondary" textAlign="center">
              Refreshing templates...
            </Typography>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
