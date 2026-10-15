// run() drains the steps in reverse, each one even if an earlier one threw, then rethrows the first
// error. A step added after run() runs at once.
export type Teardown = { add: (step: () => void) => void; run: () => void };

export function teardown(): Teardown {
  const steps: (() => void)[] = [];
  let drained = false;
  return {
    add: (step) => {
      if (drained) step();
      else steps.push(step);
    },
    run: () => {
      drained = true;
      const errors: unknown[] = [];
      while (steps.length) {
        try {
          steps.pop()!();
        } catch (error) {
          errors.push(error);
        }
      }
      if (errors.length) throw errors[0];
    },
  };
}

// Owners call this in effect cleanups, where a throw takes down the whole page, so it logs instead.
export function release(scene: { destroy: () => void } | null) {
  try {
    scene?.destroy();
  } catch (error) {
    console.error(error);
  }
}
