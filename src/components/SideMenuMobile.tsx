import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Drawer, { drawerClasses } from '@mui/material/Drawer';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import MenuButton from './MenuButton';
import MenuContent from './MenuContent';
import CardAlert from './CardAlert';
import { useAuth } from '../auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { clearSession } from '../auth/session';

interface SideMenuMobileProps {
  open: boolean | undefined;
  toggleDrawer: (newOpen: boolean) => () => void;
  selectedIndex?: number;
  onMenuSelect?: (index: number) => void;
}

export default function SideMenuMobile({ open, toggleDrawer, selectedIndex = 0, onMenuSelect }: SideMenuMobileProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const displayName = user?.displayName || user?.email || 'User';
  const email = user?.email || '';

  // Wrap onMenuSelect to close drawer after selection
  const handleMenuSelect = (index: number) => {
    if (onMenuSelect) onMenuSelect(index);
    toggleDrawer(false)();
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      clearSession();
      toggleDrawer(false)();
      navigate('/login', { replace: true });
    }
  };
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={toggleDrawer(false)}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        [`& .${drawerClasses.paper}`]: {
          backgroundImage: 'none',
          backgroundColor: 'background.paper',
        },
      }}
    >
      <Stack
        sx={{
          maxWidth: '70dvw',
          height: '100%',
        }}
      >
        <Stack direction="row" sx={{ p: 2, pb: 0, gap: 1 }}>
          <Stack
            direction="row"
            sx={{ gap: 1, alignItems: 'center', flexGrow: 1, p: 1 }}
          >
            <Avatar
              sizes="small"
              alt={displayName}
              src={user?.photoURL ?? undefined}
              sx={{ width: 24, height: 24 }}
            />
            <Stack sx={{ minWidth: 0 }}>
              <Typography component="p" variant="h6" noWrap>
                {displayName}
              </Typography>
              {!!email && (
                <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
                  {email}
                </Typography>
              )}
            </Stack>
          </Stack>
          <MenuButton showBadge>
            <NotificationsRoundedIcon />
          </MenuButton>
        </Stack>
        <Divider />
        <Stack sx={{ flexGrow: 1 }}>
          <MenuContent selectedIndex={selectedIndex} onMenuSelect={handleMenuSelect} />
          <Divider />
        </Stack>
        <CardAlert />
        <Stack sx={{ p: 2 }}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<LogoutRoundedIcon />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Stack>
      </Stack>
    </Drawer>
  );
}
