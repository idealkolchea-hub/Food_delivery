import { useEffect, useState } from 'react';

export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const pointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const sync = () => {
      setEnabled(pointerQuery.matches && !reducedMotionQuery.matches && window.innerWidth >= 1024);
    };

    sync();
    pointerQuery.addEventListener('change', sync);
    reducedMotionQuery.addEventListener('change', sync);
    window.addEventListener('resize', sync, { passive: true });

    return () => {
      pointerQuery.removeEventListener('change', sync);
      reducedMotionQuery.removeEventListener('change', sync);
      window.removeEventListener('resize', sync);
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const dot = document.querySelector('.custom-cursor-dot');
    const ring = document.querySelector('.custom-cursor-ring');

    if (!dot || !ring) {
      return undefined;
    }

    let pointerX = -40;
    let pointerY = -40;
    let visible = false;

    const handleMove = (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!visible) {
        dot.style.opacity = '1';
        ring.style.opacity = '1';
        visible = true;
      }
      dot.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0)`;
      ring.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0)`;
    };

    const handleLeave = () => {
      dot.style.opacity = '0';
      ring.style.opacity = '0';
      visible = false;
    };

    window.addEventListener('mousemove', handleMove, { passive: true });
    window.addEventListener('mouseout', handleLeave);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseout', handleLeave);
    };
  }, [enabled]);

  if (!enabled) {
    return null;
  }

  return (
    <>
      <div className="custom-cursor-dot" />
      <div className="custom-cursor-ring" />
    </>
  );
}
