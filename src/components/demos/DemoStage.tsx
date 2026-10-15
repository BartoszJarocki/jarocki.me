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

export type Phase = 'shell' | 'loading' | 'ready' | 'still' | 'fallback';

const quiet = ['ChunkLoadError', 'Unsupported'];

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
  // React never renders what is inside a noscript on the client, so the client loads Still only
  // after a failed mount, when the scene's code is already there.
  const [{ parts, Still }] = useState(() => ({
    parts: {} as Partial<P>,
    Still: lazy(() => scene().then((module) => ({ default: module.Still }))),
  }));
  const [failed, setFailed] = useState(false);

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
        let loaded = false;
        scene()
          .then((module) => {
            loaded = true;
            return module.default.start(element, parts, unmount.signal, () => setPhase('ready'));
          })
          .catch((error) => {
            if (unmount.signal.aborted) return;
            if (!quiet.includes(error?.name)) console.error(error);
            setPhase(loaded ? 'still' : 'fallback');
            setFailed(loaded);
          });
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
        {failed ? (
          <Suspense>
            <Still />
          </Suspense>
        ) : (
          <noscript>
            <Suspense>
              <Still />
            </Suspense>
          </noscript>
        )}
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
