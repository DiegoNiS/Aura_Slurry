/**
 * AnimatedNumber — smoothly tweens between numeric values.
 * Used for HMI readouts so metrics roll instead of snapping.
 */
import { useEffect, useRef, useState } from 'react';

export default function AnimatedNumber({
  value,
  decimals = 0,
  duration = 500,
  format,
}) {
  const [display, setDisplay] = useState(value ?? 0);
  const fromRef = useRef(value ?? 0);
  const startRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = Number(value) || 0;
    if (from === to) return undefined;

    startRef.current = performance.now();

    const tick = (now) => {
      const p = Math.min((now - startRef.current) / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - p, 3);
      const current = from + (to - from) * eased;
      setDisplay(current);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  const num = Number(display).toFixed(decimals);
  return <>{format ? format(Number(num)) : num}</>;
}
