/**
 * MachinePanelContent — asset nameplate & specs (from MACHINE constant).
 */
import { Box, Typography } from '@mui/material';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import { COLORS, MACHINE } from '../../utils/constants';
import { PanelBody, SectionLabel, Field } from '../common/PanelBits';
import PumpSchematic from '../dashboard/PumpSchematic';

export default function MachinePanelContent() {
  return (
    <PanelBody>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ width: 42, height: 42, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${COLORS.accent.cyan}12`, color: COLORS.accent.cyan }}>
          <PrecisionManufacturingIcon />
        </Box>
        <Box>
          <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: COLORS.text.primary }}>{MACHINE.name}</Typography>
          <Typography sx={{ fontSize: '0.66rem', color: COLORS.text.muted }}>{MACHINE.model} · {MACHINE.id}</Typography>
        </Box>
      </Box>

      <Box sx={{ height: 150, borderRadius: 1.5, border: `1px solid ${COLORS.border.subtle}`, overflow: 'hidden' }}>
        <PumpSchematic />
      </Box>

      <Box>
        <SectionLabel>Placa de características</SectionLabel>
        <Field label="Modelo" value={MACHINE.model} />
        <Field label="N.º de serie" value={MACHINE.serial} mono />
        <Field label="Línea" value={MACHINE.line} />
        <Field label="Ubicación" value={MACHINE.location} />
        <Field label="Potencia nominal" value={`${MACHINE.ratedPower} kW`} mono />
        <Field label="Velocidad nominal" value={`${MACHINE.ratedRpm} rpm`} mono />
        <Field label="Impulsor" value={MACHINE.impeller} />
      </Box>
    </PanelBody>
  );
}
