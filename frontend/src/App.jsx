/**
 * App.jsx — Root component
 *
 * Wraps the Aura-Slurry industrial control center with:
 *   - MUI ThemeProvider (dark SCADA theme)
 *   - CssBaseline (global resets)
 *   - SnackbarProvider (notistack alerts)
 *   - ControlRoomLayout (single-view control room)
 */
import { ThemeProvider, CssBaseline, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { SnackbarProvider, closeSnackbar } from 'notistack';
import auraTheme from './theme/auraTheme';
import ControlRoomLayout from './components/layout/ControlRoomLayout';
import FleetView from './components/layout/FleetView';
import useUiStore from './stores/useUiStore';

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
  // Navegación de flota: null = dashboard general; un id = detalle de bomba
  const selectedPump = useUiStore((s) => s.selectedPump);

  return (
    <ThemeProvider theme={auraTheme}>
      <CssBaseline />
      <SnackbarProvider
        maxSnack={3}
        autoHideDuration={4000}
        // abajo al centro: arriba tapaban los botones de acción de la barra
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        dense
        preventDuplicate
        // toda notificación se puede cerrar con la X
        action={(key) => (
          <IconButton size="small" onClick={() => closeSnackbar(key)} sx={{ color: 'inherit' }}>
            <CloseIcon sx={{ fontSize: 15 }} />
          </IconButton>
        )}
      >
        {selectedPump ? <ControlRoomLayout /> : <FleetView />}
      </SnackbarProvider>
    </ThemeProvider>
  );
}
