declare module "*/mo.umd.js" {
  interface BurstOptions {
    left?: number;
    top?: number;
    radius?: Record<number, number> | number;
    count?: number;
    children?: Record<string, unknown>;
  }

  class Burst {
    constructor(options: BurstOptions);
    play(): this;
    stop(): this;
  }

  class Shape {
    constructor(options: Record<string, unknown>);
    play(): this;
    then(options: Record<string, unknown>): this;
  }

  const _default: {
    Burst: typeof Burst;
    Shape: typeof Shape;
  };

  export default _default;
}
