import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/animation";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function AnimatedCounter({
  value,
  duration = 1200,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion) {
      const formatted =
        decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
      el.textContent = `${prefix}${formatted}${suffix}`;
      return;
    }

    let cancelled = false;

    import("animejs").then(({ animate }) => {
      if (cancelled) return;
      const obj = { value: 0 };
      animate(obj, {
        value,
        duration,
        ease: "outExpo",
        onUpdate: () => {
          if (el) {
            const formatted =
              decimals > 0
                ? obj.value.toFixed(decimals)
                : Math.round(obj.value).toString();
            el.textContent = `${prefix}${formatted}${suffix}`;
          }
        },
      });
    });

    return () => {
      cancelled = true;
    };
  }, [value, duration, decimals, prefix, suffix, prefersReducedMotion]);

  const initial =
    decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();

  return (
    <span ref={ref} className={className}>
      {prefix}
      {prefersReducedMotion ? initial : "0"}
      {suffix}
    </span>
  );
}
