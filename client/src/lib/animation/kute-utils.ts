/**
 * KUTE.js utilities for SVG morphing and color transitions.
 * KUTE is imported dynamically to keep the bundle lean.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let kuteModule: any = null;

async function getKute() {
  if (!kuteModule) {
    const mod = await import("kute.js");
    // KUTE.js exports named exports; the main API is Animation
    kuteModule = mod;
  }
  return kuteModule;
}

/**
 * Morph one SVG path to another.
 */
export async function morphPath(
  fromEl: SVGPathElement,
  toPath: string,
  options: { duration?: number } = {},
) {
  const KUTE = await getKute();
  const { duration = 600 } = options;
  const tween = new KUTE.Animation(
    fromEl,
    { path: toPath },
    { duration },
  );
  tween.start();
  return tween;
}

/**
 * Animate background color transition.
 */
export async function colorTransition(
  element: HTMLElement,
  toColor: string,
  options: { duration?: number } = {},
) {
  const KUTE = await getKute();
  const { duration = 400 } = options;
  const tween = new KUTE.Animation(
    element,
    { backgroundColor: toColor },
    { duration },
  );
  tween.start();
  return tween;
}
