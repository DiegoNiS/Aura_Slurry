/**
 * Panel registry — maps a panel id to its title-bar icon and content
 * component. Adding a feature = one entry here + one entry in PANELS.
 */
import TuneIcon from '@mui/icons-material/Tune';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import InsightsIcon from '@mui/icons-material/Insights';
import TimelineIcon from '@mui/icons-material/Timeline';
import SensorsIcon from '@mui/icons-material/Sensors';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import BuildIcon from '@mui/icons-material/Build';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import PsychologyIcon from '@mui/icons-material/Psychology';
import TerminalIcon from '@mui/icons-material/Terminal';
import DescriptionIcon from '@mui/icons-material/Description';

import { PANEL_IDS } from '../../utils/constants';
import CalibrationPanelContent from './CalibrationPanelContent';
import AlertsPanelContent from './AlertsPanelContent';
import ReportsPanelContent from './ReportsPanelContent';
import PredictionsPanelContent from './PredictionsPanelContent';
import HistoryPanelContent from './HistoryPanelContent';
import SensorsPanelContent from './SensorsPanelContent';
import MachinePanelContent from './MachinePanelContent';
import MaintenancePanelContent from './MaintenancePanelContent';
import AudioPanelContent from './AudioPanelContent';
import NoisePanelContent from './NoisePanelContent';
import AiPanelContent from './AiPanelContent';
import LogsPanelContent from './LogsPanelContent';

export const PANEL_REGISTRY = {
  [PANEL_IDS.CALIBRATION]: { icon: <TuneIcon fontSize="inherit" />, Component: CalibrationPanelContent },
  [PANEL_IDS.ALERTS]: { icon: <NotificationsActiveIcon fontSize="inherit" />, Component: AlertsPanelContent },
  [PANEL_IDS.REPORTS]: { icon: <DescriptionIcon fontSize="inherit" />, Component: ReportsPanelContent },
  [PANEL_IDS.PREDICTIONS]: { icon: <InsightsIcon fontSize="inherit" />, Component: PredictionsPanelContent },
  [PANEL_IDS.HISTORY]: { icon: <TimelineIcon fontSize="inherit" />, Component: HistoryPanelContent },
  [PANEL_IDS.SENSORS]: { icon: <SensorsIcon fontSize="inherit" />, Component: SensorsPanelContent },
  [PANEL_IDS.MACHINE]: { icon: <PrecisionManufacturingIcon fontSize="inherit" />, Component: MachinePanelContent },
  [PANEL_IDS.MAINTENANCE]: { icon: <BuildIcon fontSize="inherit" />, Component: MaintenancePanelContent },
  [PANEL_IDS.AUDIO]: { icon: <GraphicEqIcon fontSize="inherit" />, Component: AudioPanelContent },
  [PANEL_IDS.NOISE]: { icon: <FilterAltIcon fontSize="inherit" />, Component: NoisePanelContent },
  [PANEL_IDS.AI]: { icon: <PsychologyIcon fontSize="inherit" />, Component: AiPanelContent },
  [PANEL_IDS.LOGS]: { icon: <TerminalIcon fontSize="inherit" />, Component: LogsPanelContent },
};
