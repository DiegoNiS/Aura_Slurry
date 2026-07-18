/**
 * PanelHost — renders every open floating panel as a side-by-side dock.
 *
 * Panels tile from the right edge leftwards (newest = rightmost) so they
 * never overlap each other. Positions are computed from each panel's width;
 * useUiStore caps concurrency so the dock always fits.
 */
import { AnimatePresence } from 'framer-motion';
import useUiStore from '../../stores/useUiStore';
import { PANELS } from '../../utils/constants';
import FloatingPanel from '../common/FloatingPanel';
import { PANEL_REGISTRY } from './registry';

const PANEL_BY_ID = Object.fromEntries(PANELS.map((p) => [p.id, p]));
const BASE_RIGHT = 14;
const GAP = 12;

export default function PanelHost() {
  const openPanels = useUiStore((s) => s.openPanels);
  const focusedPanel = useUiStore((s) => s.focusedPanel);
  const closePanel = useUiStore((s) => s.closePanel);
  const focusPanel = useUiStore((s) => s.focusPanel);

  // Cumulative right offset: newest (last) sits at BASE_RIGHT, older ones
  // shift left by the widths of every panel stacked to their right.
  const configs = openPanels.map((id) => PANEL_BY_ID[id]).filter(Boolean);
  const rightOffsets = [];
  let acc = BASE_RIGHT;
  for (let i = configs.length - 1; i >= 0; i--) {
    rightOffsets[i] = acc;
    acc += (configs[i]?.width || 440) + GAP;
  }

  return (
    <AnimatePresence>
      {openPanels.map((id, index) => {
        const config = PANEL_BY_ID[id];
        const entry = PANEL_REGISTRY[id];
        if (!config || !entry) return null;
        const { Component, icon } = entry;
        return (
          <FloatingPanel
            key={id}
            panel={config}
            icon={icon}
            index={index}
            rightOffset={rightOffsets[index]}
            focused={focusedPanel === id}
            onClose={closePanel}
            onFocus={focusPanel}
          >
            <Component />
          </FloatingPanel>
        );
      })}
    </AnimatePresence>
  );
}
