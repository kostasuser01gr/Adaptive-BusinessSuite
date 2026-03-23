/**
 * mo.js particle effects - dynamically loaded.
 * Falls back gracefully if mo.js is unavailable.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mojsModule: any = null;
let loadFailed = false;

async function getMojs() {
  if (loadFailed) return null;
  if (mojsModule) return mojsModule;
  try {
    const mod = await import("./mo.umd.js");
    mojsModule = mod.default || mod;
    return mojsModule;
  } catch {
    loadFailed = true;
    return null;
  }
}

/**
 * Create a success celebration burst at the given element.
 */
export async function celebrateBurst(
  origin: { x: number; y: number },
  options: { color?: string; count?: number; radius?: number } = {},
) {
  const mojs = await getMojs();
  if (!mojs) return null;

  const {
    color = "oklch(0.72 0.19 142)",
    count = 8,
    radius = 50,
  } = options;

  const burst = new mojs.Burst({
    left: origin.x,
    top: origin.y,
    radius: { 0: radius },
    count,
    children: {
      shape: "circle",
      fill: [color, "oklch(0.80 0.15 85)", "oklch(0.65 0.20 250)"],
      radius: { 4: 0 },
      duration: 700,
      easing: "cubic.out",
    },
  });

  burst.play();
  return burst;
}

/**
 * Error shake + red particle scatter.
 */
export async function errorBurst(origin: { x: number; y: number }) {
  const mojs = await getMojs();
  if (!mojs) return null;

  const burst = new mojs.Burst({
    left: origin.x,
    top: origin.y,
    radius: { 0: 30 },
    count: 6,
    children: {
      shape: "circle",
      fill: "oklch(0.60 0.24 25)",
      radius: { 3: 0 },
      duration: 500,
      easing: "cubic.out",
    },
  });

  burst.play();
  return burst;
}

/**
 * Confetti celebration for milestone events.
 */
export async function confettiBurst(origin: { x: number; y: number }) {
  const mojs = await getMojs();
  if (!mojs) return null;

  const colors = [
    "oklch(0.72 0.19 142)",
    "oklch(0.80 0.15 85)",
    "oklch(0.65 0.20 250)",
    "oklch(0.75 0.18 40)",
    "oklch(0.70 0.22 310)",
  ];

  const burst = new mojs.Burst({
    left: origin.x,
    top: origin.y,
    radius: { 0: 80 },
    count: 12,
    children: {
      shape: "rect",
      fill: colors,
      radius: { 5: 0 },
      scale: { 1: 0 },
      duration: 900,
      easing: "cubic.out",
    },
  });

  burst.play();
  return burst;
}
