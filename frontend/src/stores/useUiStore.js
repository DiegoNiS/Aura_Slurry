/**
 * useUiStore — Floating panel / dock manager
 *
 * The whole app is a single view. Secondary features never navigate;
 * they open as floating inspector panels. Multiple panels can be docked
 * open at once (stacked on the right), and one is "focused" (z-top).
 */
import { create } from 'zustand';

// Max panels docked side-by-side at once. Two of the widest panels (560px)
// still fit on a ~1280px viewport without overlapping; opening a third
// evicts the oldest so the dock never overflows or stacks on itself.
export const MAX_OPEN_PANELS = 2;

const useUiStore = create((set, get) => ({
  // Ordered list of open panel ids (last = most recent, docked rightmost/top)
  openPanels: [],
  focusedPanel: null,

  openPanel: (id) => {
    const { openPanels } = get();
    if (openPanels.includes(id)) {
      // already open → just bring to front
      set({ focusedPanel: id });
      return;
    }
    let next = [...openPanels, id];
    if (next.length > MAX_OPEN_PANELS) next = next.slice(next.length - MAX_OPEN_PANELS);
    set({ openPanels: next, focusedPanel: id });
  },

  closePanel: (id) => {
    const next = get().openPanels.filter((p) => p !== id);
    set({ openPanels: next, focusedPanel: next[next.length - 1] ?? null });
  },

  togglePanel: (id) => {
    const { openPanels } = get();
    if (openPanels.includes(id)) get().closePanel(id);
    else get().openPanel(id);
  },

  focusPanel: (id) => set({ focusedPanel: id }),

  closeAll: () => set({ openPanels: [], focusedPanel: null }),

  isOpen: (id) => get().openPanels.includes(id),
}));

export default useUiStore;
