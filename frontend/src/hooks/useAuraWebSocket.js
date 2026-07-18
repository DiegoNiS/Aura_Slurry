/**
 * Aura-Slurry — WebSocket Hook
 *
 * Connects to /ws/status (English wire contract).
 * Auto-reconnect with exponential backoff via react-use-websocket.
 * Pushes every valid message into the Zustand store.
 */
import { useEffect, useCallback, useRef } from 'react';
import * as ReactUseWebSocket from 'react-use-websocket';
import { useSnackbar } from 'notistack';

// react-use-websocket ships as CommonJS. Vite's dev optimizer double-wraps
// the default export ({ default: { default: fn, ReadyState } }) while the
// production bundler exposes it directly. Normalize both shapes.
const RUW =
  ReactUseWebSocket.default && ReactUseWebSocket.default.default
    ? ReactUseWebSocket.default
    : ReactUseWebSocket;
const useWebSocket = RUW.default || RUW;
const ReadyState = RUW.ReadyState || ReactUseWebSocket.ReadyState;
import usePumpStore from '../stores/usePumpStore';
import { WS_ENDPOINTS, STATUS_COLOR_MAP, STATUS } from '../utils/constants';

const READY_STATE_LABELS = {
  [ReadyState.CONNECTING]: 'Conectando…',
  [ReadyState.OPEN]: 'Conectado',
  [ReadyState.CLOSING]: 'Cerrando…',
  [ReadyState.CLOSED]: 'Desconectado',
  [ReadyState.UNINSTANTIATED]: 'Sin inicializar',
};

export default function useAuraWebSocket() {
  const updateFromWs = usePumpStore((s) => s.updateFromWs);
  const setWsConnected = usePumpStore((s) => s.setWsConnected);
  const stopMockSimulation = usePumpStore((s) => s.stopMockSimulation);
  const { enqueueSnackbar } = useSnackbar();
  const lastMsgRef = useRef(0);

  const onMessage = useCallback(
    (event) => {
      try {
        const data = JSON.parse(event.data);

        // Validate wire contract shape (English)
        if (
          data.timestamp !== undefined &&
          data.status !== undefined &&
          data.health_score !== undefined
        ) {
          // First real message wins → drop the mock simulation
          if (lastMsgRef.current === 0) stopMockSimulation();
          lastMsgRef.current = Date.now();

          updateFromWs(data);

          if (data.alert) {
            const color = STATUS_COLOR_MAP[data.status];
            enqueueSnackbar(data.alert, {
              variant: data.status === STATUS.FAILURE ? 'error' : 'warning',
              autoHideDuration: 5000,
              anchorOrigin: { vertical: 'top', horizontal: 'right' },
              style: {
                backgroundColor: '#16202D',
                border: `1px solid ${color?.main || '#FF4D5E'}`,
                color: '#EAF1F7',
              },
            });
          }
        }
      } catch {
        // Ignore malformed / heartbeat frames
      }
    },
    [updateFromWs, enqueueSnackbar, stopMockSimulation]
  );

  const { readyState, sendMessage, getWebSocket } = useWebSocket(WS_ENDPOINTS.status, {
    onMessage,
    shouldReconnect: () => true,
    reconnectAttempts: Infinity,
    reconnectInterval: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
    onOpen: () => {
      setWsConnected(true);
      enqueueSnackbar('Enlace de telemetría establecido', {
        variant: 'success',
        autoHideDuration: 2000,
      });
    },
    onClose: () => setWsConnected(false),
    onError: () => setWsConnected(false),
  });

  useEffect(() => {
    setWsConnected(readyState === ReadyState.OPEN);
  }, [readyState, setWsConnected]);

  return {
    readyState,
    readyStateLabel: READY_STATE_LABELS[readyState],
    isConnected: readyState === ReadyState.OPEN,
    sendMessage,
    getWebSocket,
  };
}
