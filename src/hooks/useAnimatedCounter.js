import { useEffect } from 'react';
import { useSpring } from 'framer-motion';

export function useAnimatedCounter(value) {
  const spring = useSpring(value, {
    stiffness: 120,
    damping: 24,
    mass: 0.8,
  });

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return spring;
}
