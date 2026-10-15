export type Teardown = { add: (step: () => void) => void; run: () => void };

export function teardown(): Teardown {
  const steps: (() => void)[] = [];
  return {
    add: (step) => {
      steps.push(step);
    },
    run: () => {
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
