import { type ComponentType, Suspense, createElement, lazy } from 'react';

import type { DemoProps } from './DemoStage';

// Each shell is its own chunk, so a note loads only the demos its MDX uses. The boundary lets
// React hydrate the rest of the page before the shell's chunk arrives. If the chunk fails, the
// note shows the demo's description in its place.
function demo(load: () => Promise<{ default: ComponentType<DemoProps> }>) {
  const Shell = lazy(() =>
    load().catch(() => ({ default: ({ children }: DemoProps) => children })),
  );
  return function Demo(props: DemoProps) {
    return createElement(Suspense, null, createElement(Shell, props));
  };
}

export const TaxiFares = demo(() => import('./TaxiFares'));
