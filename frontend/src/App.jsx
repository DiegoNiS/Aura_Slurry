/**
 * App.jsx — Root component
 *
 * Wraps the Aura-Slurry industrial control center with:
 *   - MUI ThemeProvider (dark SCADA theme)
 *   - CssBaseline (global resets)
 *   - SnackbarProvider (notistack alerts)
 *   - ControlRoomLayout (single-view control room)
 */
import { ThemeProvider, CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import auraTheme from './theme/auraTheme';
import ControlRoomLayout from './components/layout/ControlRoomLayout';

// Self-hosted fonts (no external network calls)
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/rajdhani/400.css';
import '@fontsource/rajdhani/500.css';
import '@fontsource/rajdhani/600.css';
import '@fontsource/rajdhani/700.css';

export default function App() {
  return (
    <ThemeProvider theme={auraTheme}>
      <CssBaseline />
      <SnackbarProvider
        maxSnack={4}
        autoHideDuration={4000}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        dense
        preventDuplicate
      >
        <ControlRoomLayout />
      </SnackbarProvider>
    </ThemeProvider>
  );
}
