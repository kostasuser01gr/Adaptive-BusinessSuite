import { useCallback } from "react";
import { celebrateBurst, confettiBurst } from "../../lib/animation/mojs-effects";
import { useReducedMotion } from "../../lib/animation/use-reduced-motion";

type CelebrationOrigin = MouseEvent | { x: number; y: number };

function getCoords(origin: CelebrationOrigin): { x: number; y: number } {
  if (origin instanceof MouseEvent) {
    return { x: origin.clientX, y: origin.clientY };
  }
  return origin;
}

/**
 * Hook that returns a `celebrate` function to trigger mo.js burst effects
 * for success actions (booking confirmed, payment received, task completed).
 *
 * Automatically respects reduced-motion preference.
 */
export function useCelebration() {
  const reducedMotion = useReducedMotion();

  const celebrate = useCallback(
    async (origin: CelebrationOrigin, type: "burst" | "confetti" = "burst") => {
      if (reducedMotion) return;

      const coords = getCoords(origin);

      if (type === "confetti") {
        await confettiBurst(coords);
      } else {
        await celebrateBurst(coords);
      }
    },
    [reducedMotion],
  );

  return { celebrate };
}
