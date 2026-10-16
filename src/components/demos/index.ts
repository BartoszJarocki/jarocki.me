import { type ComponentType, Suspense, createElement, lazy } from 'react';

import type { DemoProps } from './DemoStage';
import type { FareProps } from './Fare';

// Each shell is its own chunk, so a note loads only the demos its MDX uses. The boundary lets
// React hydrate the rest of the page before the shell's chunk arrives. If the chunk fails, the
// note shows the demo's description in its place. React recovers from a server error inside the
// boundary, so the label check sits outside it, where it fails the build.
function demo(load: () => Promise<{ default: ComponentType<DemoProps> }>) {
  const Shell = lazy(() =>
    load().catch(() => ({ default: ({ children }: DemoProps) => children })),
  );
  return function Demo(props: DemoProps) {
    if (typeof window === 'undefined' && !(props.label && props.children)) {
      throw new Error('A demo needs a label and a description');
    }
    return createElement(Suspense, null, createElement(Shell, props));
  };
}

export const TaxiFares = demo(() => import('./TaxiFares'));
export const FareReceipt = demo(() => import('./FareReceipt'));
export const LossLandscape = demo(() => import('./LossLandscape'));

// React keeps the server's children of an element with dangerouslySetInnerHTML when it hydrates, so a
// failed chunk leaves the server's numbers in place.
const LiveFare = lazy<ComponentType<FareProps>>(() =>
  import('./Fare').catch(() => ({
    default: () =>
      createElement('span', {
        dangerouslySetInnerHTML: { __html: '' },
        suppressHydrationWarning: true,
      }),
  })),
);
export const Fare = (props: FareProps) =>
  createElement(Suspense, null, createElement(LiveFare, props));
