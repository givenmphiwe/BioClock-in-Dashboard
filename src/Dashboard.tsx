import type {} from '@mui/x-date-pickers/themeAugmentation';
import type {} from '@mui/x-charts/themeAugmentation';
import type {} from '@mui/x-data-grid-pro/themeAugmentation';
import type {} from '@mui/x-tree-view/themeAugmentation';
import { alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import React from 'react';

import AppNavbar from './components/AppNavbar';
import Header from './components/Header';
import MainGrid from './components/MainGrid';
import SideMenu from './components/SideMenu';
import Analytics from './pages/Analytics';
import Employees from './pages/Employees';           // <-- NEW
import AppTheme from './theme/AppTheme';

import {
  chartsCustomizations,
  dataGridCustomizations,
  datePickersCustomizations,
  treeViewCustomizations,
} from './theme/customizations';

type DashboardProps = {
  disableCustomTheme?: boolean;
};

const xThemeComponents = {
  ...chartsCustomizations,
  ...dataGridCustomizations,
  ...datePickersCustomizations,
  ...treeViewCustomizations,
};

const Dashboard: React.FC<DashboardProps> = (props) => {
 
  const getInitialIndex = () => {
    const stored = localStorage.getItem('selectedMenuIndex');
    const idx = stored !== null ? parseInt(stored, 10) : 0;
    return Number.isNaN(idx) ? 0 : idx;
  };

  const [selectedIndex, setSelectedIndex] = React.useState<number>(getInitialIndex);

  React.useEffect(() => {
    localStorage.setItem('selectedMenuIndex', selectedIndex.toString());
  }, [selectedIndex]);

  let mainContent: React.ReactNode;
  switch (selectedIndex) {
    case 1:
      mainContent = <Analytics />;
      break;
    case 2:
      mainContent = <Employees />;   
      break;
    default:
      mainContent = (
        <Stack
          spacing={2}
          sx={{
            alignItems: 'center',
            mx: 3,
            pb: 5,
            mt: { xs: 8, md: 0 },
          }}
        >
          <Header />
          <MainGrid />
        </Stack>
      );
  }

  return (
    <AppTheme {...props} themeComponents={xThemeComponents}>
      <CssBaseline enableColorScheme />
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        {/* Side menu controls the selected page */}
        <SideMenu selectedIndex={selectedIndex} onMenuSelect={setSelectedIndex} />

        {/* Optional top navbar */}
        <AppNavbar />

        {/* Main content */}
        <Box
          component="main"
          sx={(theme) => ({
            flexGrow: 1,
            backgroundColor: theme.vars
              ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
              : alpha(theme.palette.background.default, 1),
            overflow: 'auto',
          })}
        >
          {mainContent}
        </Box>
      </Box>
    </AppTheme>
  );
};

export default Dashboard;
