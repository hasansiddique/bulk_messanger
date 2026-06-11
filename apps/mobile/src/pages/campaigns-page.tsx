import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
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
  LinearProgress,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import { FiArrowLeft } from 'react-icons/fi';
import { trpc } from '../lib/trpc';

const statusColor = {
  QUEUED: 'default',
  PROCESSING: 'primary',
  COMPLETED: 'success',
  FAILED: 'error',
  PARTIAL: 'warning',
} as const;

export function CampaignsPage() {
  const navigate = useNavigate();
  const { data: campaigns, isLoading, error } = trpc.listCampaigns.useQuery({
    limit: 50,
  });

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" elevation={0} color="transparent">
        <Toolbar>
          <IconButton edge="start" onClick={() => navigate('/home')} aria-label="back">
            <FiArrowLeft />
          </IconButton>
          <Typography variant="h6" fontWeight={700}>
            Sent campaigns
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

        {!isLoading && !error && campaigns?.length === 0 && (
          <Alert severity="info">
            No campaigns yet. Send a WhatsApp template to see progress here.
          </Alert>
        )}

        <Stack spacing={2}>
          {campaigns?.map((campaign) => (
            <Card key={campaign.id}>
              <CardActionArea onClick={() => navigate(`/campaigns/${campaign.id}`)}>
                <CardContent>
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Typography variant="h6">
                        {campaign.templateName ?? 'Text message'}
                      </Typography>
                      <Chip
                        label={campaign.status}
                        size="small"
                        color={statusColor[campaign.status]}
                      />
                    </Stack>

                    <Typography variant="body2" color="text.secondary">
                      {campaign.sentCount}/{campaign.totalCount} sent
                      {campaign.failedCount > 0 ? ` · ${campaign.failedCount} failed` : ''}
                      {campaign.groupName ? ` · ${campaign.groupName}` : ''}
                    </Typography>

                    <LinearProgress
                      variant="determinate"
                      value={campaign.progress}
                      sx={{ height: 8, borderRadius: 4 }}
                    />

                    <Typography variant="caption" color="text.secondary">
                      {format(new Date(campaign.createdAt), 'PPpp')}
                    </Typography>
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}
