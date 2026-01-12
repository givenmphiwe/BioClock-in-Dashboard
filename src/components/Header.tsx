import Stack from '@mui/material/Stack';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import dayjs, { type Dayjs } from 'dayjs';
import CustomDatePicker from './CustomDatePicker';
import NavbarBreadcrumbs from './NavbarBreadcrumbs';
import MenuButton from './MenuButton';
import ColorModeIconDropdown from '.././theme/ColorModeIconDropdown';

interface HeaderProps {
  currentPage?: string;
  selectedDate?: Dayjs | null;
  onDateChange?: (d: Dayjs | null) => void;
}

export default function Header({ currentPage, selectedDate, onDateChange }: HeaderProps) {
  return (
    <Stack
      direction="row"
      sx={{
        display: { xs: 'none', md: 'flex' },
        width: '100%',
        alignItems: { xs: 'flex-start', md: 'center' },
        justifyContent: 'space-between',
        maxWidth: { sm: '100%', md: '1700px' },
        pt: 1.5,
      }}
      spacing={2}
    >
      <NavbarBreadcrumbs current={currentPage} />
      <Stack direction="row" sx={{ gap: 1 }}>
        {/* <Search /> */}
        <CustomDatePicker value={selectedDate ?? dayjs()} onChange={onDateChange} />
        <MenuButton showBadge aria-label="Open notifications">
          <NotificationsRoundedIcon />
        </MenuButton>
        <ColorModeIconDropdown />
      </Stack>
    </Stack>
  );
}
