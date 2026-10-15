import {
  type ComponentType,
  type ReactNode,
  type RefCallback,
  Suspense,
  lazy,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

import type { Scene } from '../../lib/demos/stage';

export type Phase = 'shell' | 'loading' | 'ready' | 'fallback';

export type DemoProps = { label: string; children: ReactNode };

type Part<P> = <K extends keyof P>(key: K) => (element: P[K] | null) => void;

export function DemoStage<P>({
  label,
  children,
  scene,
  render,
}: DemoProps & {
  scene: () => Promise<{ default: Scene<P>; Still: ComponentType }>;
  render: (part: Part<P>) => { body: ReactNode; caption: ReactNode; controls: ReactNode };
}) {
  if (typeof window === 'undefined' && !(label && children)) {
    throw new Error('A demo needs a label and a description');
  }
  const root = useRef<HTMLDivElement>(null);
  const id = useId();
  // React never renders what is inside a noscript on the client, so only the server loads Still.
  const [{ parts, Still }] = useState(() => ({
    parts: {} as Partial<P>,
    Still: lazy(() => scene().then((module) => ({ default: module.Still }))),
  }));

  useEffect(() => {
    const element = root.current!;
    const unmount = new AbortController();
    const setPhase = (phase: Phase) => {
      element.dataset.phase = phase;
    };
    const near = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        near.disconnect();
        setPhase('loading');
        scene()
          .then((module) => module.default.start(element, parts, unmount.signal))
          .then(
            () => setPhase('ready'),
            (error) => {
              if (unmount.signal.aborted) return;
              if (error?.name !== 'ChunkLoadError') console.error(error);
              setPhase('fallback');
            },
          );
      },
      { rootMargin: '200px' },
    );
    near.observe(element);
    return () => {
      unmount.abort();
      near.disconnect();
    };
  }, [scene, parts]);

  const { body, caption, controls } = render((key) => (element) => {
    parts[key] = element ?? undefined;
  });

  return (
    <div
      ref={root}
      className="demo"
      data-phase="shell"
      role="figure"
      aria-label={label}
      aria-describedby={id}
    >
      <div className="demo-stage">
        {body}
        <noscript>
          <Suspense>
            <Still />
          </Suspense>
        </noscript>
      </div>
      <div className="demo-caption">{caption}</div>
      <div className="demo-controls">{controls}</div>
      <div id={id} className="demo-description">
        {children}
      </div>
    </div>
  );
}

export function Slider({
  label,
  input,
  value,
}: {
  label: string;
  input: RefCallback<HTMLInputElement>;
  value: RefCallback<HTMLSpanElement>;
}) {
  const id = useId();
  return (
    <div className="demo-slider">
      <label htmlFor={id}>{label}</label>
      <input ref={input} id={id} type="range" />
      <span ref={value} aria-hidden="true" className="demo-value" />
    </div>
  );
}
