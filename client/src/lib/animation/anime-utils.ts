import { animate, stagger } from "animejs";

/**
 * Animate a numeric counter from 0 to target value.
 */
export function animateCounter(
  element: HTMLElement,
  targetValue: number,
  options: {
    duration?: number;
    decimals?: number;
    easing?: string;
    prefix?: string;
    suffix?: string;
  } = {},
) {
  const {
    duration = 1200,
    decimals = 0,
    easing = "outExpo",
    prefix = "",
    suffix = "",
  } = options;

  const obj = { value: 0 };
  return animate(obj, {
    value: targetValue,
    duration,
    ease: easing,
    onUpdate: () => {
      const formatted =
        decimals > 0 ? obj.value.toFixed(decimals) : Math.round(obj.value);
      element.textContent = `${prefix}${formatted}${suffix}`;
    },
  });
}

/**
 * Stagger entrance animation for a set of elements.
 */
export function staggerEntrance(
  targets: string | HTMLElement[],
  options: {
    delay?: number;
    staggerDelay?: number;
    duration?: number;
  } = {},
) {
  const {
    delay = 0,
    staggerDelay = 50,
    duration = 600,
  } = options;

  return animate(targets, {
    opacity: [0, 1],
    translateY: [20, 0],
    scale: [0.95, 1],
    delay: stagger(staggerDelay, { start: delay }),
    duration,
    ease: "outExpo",
  });
}

/**
 * Draw SVG path animation. Requires calling setupDrawable first.
 */
export function drawPath(
  targets: string | SVGPathElement[],
  options: { duration?: number; delay?: number; easing?: string } = {},
) {
  const { duration = 800, delay = 0, easing = "inOutQuad" } = options;

  // Set up the stroke dash for drawing
  const elements =
    typeof targets === "string"
      ? Array.from(document.querySelectorAll<SVGPathElement>(targets))
      : targets;

  for (const el of elements) {
    const length = el.getTotalLength();
    el.style.strokeDasharray = `${length}`;
    el.style.strokeDashoffset = `${length}`;
  }

  return animate(elements as unknown as string, {
    strokeDashoffset: 0,
    duration,
    delay,
    ease: easing,
  });
}
