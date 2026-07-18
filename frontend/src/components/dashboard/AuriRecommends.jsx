/**
 * AuriRecommends — el personaje AURI bajo el semáforo, dando las
 * recomendaciones del backend (Gemini) en una viñeta de diálogo.
 * Si aún no hay recomendación, muestra un estado de escucha.
 */
import { Box, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import usePumpStore from '../../stores/usePumpStore';
import { COLORS } from '../../utils/constants';
import auraBody from '../../assets/aura-body.png';

export default function AuriRecommends() {
  const recommendation = usePumpStore((s) => s.recommendation);
  const texto = recommendation || 'Escuchando la bomba… te aviso si algo requiere acción.';

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, mt: 1 }}>
      {/* AURI flotando suavemente */}
      <Box
        component={motion.img}
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        src={auraBody}
        alt="AURI"
        sx={{ width: 84, flexShrink: 0, filter: 'drop-shadow(0 6px 14px rgba(53,198,244,0.35))' }}
      />

      {/* viñeta de diálogo */}
      <Box
        sx={{
          position: 'relative',
          flex: 1,
          minWidth: 0,
          p: 1.1,
          borderRadius: 2,
          borderBottomLeftRadius: 4,
          backgroundColor: COLORS.bg.elevated,
          border: `1px solid ${COLORS.accent.purple}45`,
        }}
      >
        {/* colita de la viñeta apuntando a AURI */}
        <Box
          sx={{
            position: 'absolute',
            left: -5,
            bottom: 12,
            width: 9,
            height: 9,
            backgroundColor: COLORS.bg.elevated,
            borderLeft: `1px solid ${COLORS.accent.purple}45`,
            borderBottom: `1px solid ${COLORS.accent.purple}45`,
            transform: 'rotate(45deg)',
          }}
        />
        <Typography
          sx={{
            fontSize: '0.54rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: COLORS.accent.purple,
            textTransform: 'uppercase',
            mb: 0.25,
          }}
        >
          AURI · Asistente de confiabilidad
        </Typography>
        <AnimatePresence mode="wait">
          <motion.div
            key={texto}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <Typography sx={{ fontSize: '0.7rem', color: COLORS.text.primary, lineHeight: 1.4 }}>
              {texto}
            </Typography>
          </motion.div>
        </AnimatePresence>
      </Box>
    </Box>
  );
}
