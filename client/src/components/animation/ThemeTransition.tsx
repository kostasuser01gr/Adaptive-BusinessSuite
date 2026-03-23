import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ThemeTransitionProps {
  /** Toggle key — change this to trigger the circular reveal */
  themeKey: string;
  /** Origin point for the reveal circle (button position) */
  origin?: { x: number; y: number };
  children: React.ReactNode;
}

/**
 * Wraps children with a circular clip-path reveal animation
 * when the themeKey changes — used for dark/light theme switches.
 */
export function ThemeTransition({
  themeKey,
  origin,
  children,
}: ThemeTransitionProps) {
  const [revealing, setRevealing] = useState(false);
  const prevKey = useRef(themeKey);

  useEffect(() => {
    if (prevKey.current !== themeKey) {
      prevKey.current = themeKey;
      setRevealing(true);
      const timer = setTimeout(() => setRevealing(false), 500);
      return () => clearTimeout(timer);
    }
  }, [themeKey]);

  const cx = origin?.x ?? (typeof window !== "undefined" ? window.innerWidth / 2 : 500);
  const cy = origin?.y ?? 0;
  const maxRadius = Math.sqrt(
    Math.max(cx, window?.innerWidth - cx) ** 2 +
      Math.max(cy, window?.innerHeight - cy) ** 2,
  );

  return (
    <div className="relative">
      {children}
      <AnimatePresence>
        {revealing && (
          <motion.div
            className="fixed inset-0 z-[9999] pointer-events-none"
            initial={{
              clipPath: `circle(0px at ${cx}px ${cy}px)`,
              opacity: 0.4,
            }}
            animate={{
              clipPath: `circle(${maxRadius}px at ${cx}px ${cy}px)`,
              opacity: 0,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{ background: "var(--background)" }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
