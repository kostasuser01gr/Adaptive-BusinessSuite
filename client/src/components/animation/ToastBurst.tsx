import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/animation/use-reduced-motion";

interface ToastBurstProps {
  type: "success" | "error" | "info";
  active: boolean;
}

/**
 * Renders a particle burst at its position when `active` flips to true.
 * Uses mo.js via dynamic import. Falls back silently.
 */
export function ToastBurst({ type, active }: ToastBurstProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const firedRef = useRef(false);

  useEffect(() => {
    if (!active || prefersReduced || firedRef.current) return;
    firedRef.current = true;

    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const origin = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };

    if (type === "success") {
      import("@/lib/animation/mojs-effects").then(({ celebrateBurst }) =>
        celebrateBurst(origin, { color: "oklch(0.72 0.19 142)", count: 8 }),
      );
    } else if (type === "error") {
      import("@/lib/animation/mojs-effects").then(({ errorBurst }) =>
        errorBurst(origin),
      );
    }
  }, [active, type, prefersReduced]);

  useEffect(() => {
    if (!active) firedRef.current = false;
  }, [active]);

  return <div ref={ref} className="absolute inset-0 pointer-events-none" />;
}
