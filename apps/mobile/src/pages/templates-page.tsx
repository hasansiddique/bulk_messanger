import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import { FiEdit3 } from 'react-icons/fi';
import { MobileAppBar } from '../components/mobile-app-bar';
import { useTemplates } from '../hooks/use-templates';

export function TemplatesPage() {
  const navigate = useNavigate();
  const { templates, isLoading, isRefreshing, error, refresh } = useTemplates();

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default' }}>
      <MobileAppBar title="WhatsApp templates" onBack={() => navigate('/home')} />

      <Container maxWidth="sm" sx={{ py: 3, pb: 12 }}>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Approved templates from your WhatsApp Business dashboard.
          </Typography>

          <Card sx={{ borderColor: 'primary.main', borderWidth: 1, borderStyle: 'solid' }}>
            <CardActionArea onClick={() => navigate('/templates/custom')}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <FiEdit3 size={20} />
                  </Box>
                  <Box>
                    <Typography variant="h6">Custom message</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Send a free-form text to groups or contacts
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </CardActionArea>
          </Card>

          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Alert
              severity="error"
              action={
                <Button color="inherit" size="small" onClick={() => void refresh()}>
                  Retry
                </Button>
              }
            >
              {error}
            </Alert>
          )}

          {!isLoading && !error && templates.length === 0 && (
            <Alert severity="info">
              No approved templates found. Create and approve templates in Meta Business
              Manager first.
            </Alert>
          )}

          {templates.map((template) => (
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

          {isRefreshing && (
            <Typography variant="caption" color="text.secondary" textAlign="center">
              Refreshing templates...
            </Typography>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
