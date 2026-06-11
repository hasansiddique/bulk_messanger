import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Container,
  Fab,
  ListItemIcon,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import {
  FiBook,
  FiDownload,
  FiLayers,
  FiList,
  FiLogOut,
  FiMessageSquare,
  FiPlus,
  FiUserPlus,
  FiUsers,
} from 'react-icons/fi';
import { authClient } from '../lib/auth';
import { trpc } from '../lib/trpc';
import { useAuthStore } from '../stores/auth-store';

export function HomePage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const { data: profile } = trpc.getProfile.useQuery(undefined, {
    retry: false,
  });
  const { data: contactStats } = trpc.getContactStats.useQuery();
  const { data: groups } = trpc.listContactGroups.useQuery();
  const { data: campaigns } = trpc.listCampaigns.useQuery({ limit: 5 });

  const handleSignOut = async () => {
    await authClient.signOut();
    setUser(null);
    navigate('/login');
  };

  const displayUser = profile ?? user;

  const phonebookActions = [
    {
      title: 'Sent campaigns',
      description: 'Track queued messages and delivery progress',
      icon: <FiList size={22} />,
      path: '/campaigns',
      chip: campaigns?.length ? `${campaigns.length} recent` : undefined,
    },
    {
      title: 'WhatsApp templates',
      description: 'Browse approved templates and send campaigns',
      icon: <FiMessageSquare size={22} />,
      path: '/templates',
    },
    {
      title: 'Contact groups',
      description: 'Organize contacts into groups for bulk sending',
      icon: <FiLayers size={22} />,
      path: '/groups',
      chip: groups ? `${groups.length} groups` : undefined,
    },
    {
      title: 'View phonebook',
      description: 'Browse, search, and manage saved contacts',
      icon: <FiUsers size={22} />,
      path: '/phonebook',
      chip: contactStats ? `${contactStats.total} saved` : undefined,
    },
    {
      title: 'Add contact',
      description: 'Create a new contact in your app phonebook',
      icon: <FiUserPlus size={22} />,
      path: '/phonebook/new',
    },
    {
      title: 'Import from device',
      description: 'Pull contacts from your phone and save them here',
      icon: <FiDownload size={22} />,
      path: '/phonebook/import',
      chip: contactStats ? `${contactStats.imported} imported` : undefined,
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" elevation={0} color="transparent">
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" color="primary" fontWeight={700}>
            Bulk Messanger
          </Typography>
          <Button
            variant="outlined"
            startIcon={<FiLogOut />}
            onClick={handleSignOut}
          >
            Sign out
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: 3, pb: 10 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              {displayUser?.name}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Phonebook & campaigns
            </Typography>
          </Box>

          <Stack spacing={2}>
            {phonebookActions.map((action) => (
              <Card key={action.path}>
                <CardActionArea onClick={() => navigate(action.path)}>
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
                        {action.icon}
                      </Box>
                      <Box sx={{ flexGrow: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="h6">{action.title}</Typography>
                          {action.chip && (
                            <Chip label={action.chip} size="small" color="primary" variant="outlined" />
                          )}
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {action.description}
                        </Typography>
                      </Box>
                      <ListItemIcon sx={{ minWidth: 0, color: 'text.secondary' }}>
                        <FiBook />
                      </ListItemIcon>
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </Stack>

          {contactStats && (
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip label={`${contactStats.total} total`} />
                  <Chip label={`${contactStats.manual} manual`} variant="outlined" />
                  <Chip label={`${contactStats.imported} imported`} variant="outlined" />
                </Stack>
              </CardContent>
            </Card>
          )}
        </Stack>
      </Container>

      <Fab
        color="primary"
        aria-label="send template campaign"
        onClick={() => navigate('/templates')}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
        }}
      >
        <FiPlus size={24} />
      </Fab>
    </Box>
  );
}
