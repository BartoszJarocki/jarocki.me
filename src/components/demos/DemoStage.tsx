import {
  type ComponentType,
  type ReactNode,
  type RefCallback,
  type RefObject,
  Suspense,
  lazy,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import type { Scene } from '../../lib/demos/stage';

export type Phase = 'shell' | 'loading' | 'ready' | 'still' | 'fallback';

const quiet = ['ChunkLoadError', 'Unsupported'];

type SceneModule<P> = { default: Scene<P>; Still: ComponentType };

// React runs a removed component's layout cleanup before it clears its children's refs, so the
// scene ends while its parts are attached. The server runs no layout effects and warns about them.
const useStageEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

function retainStillFocus(element: HTMLElement) {
  const still = document.activeElement?.closest('.demo-still');
  if (still && element.contains(still)) {
    element.focus({ preventScroll: true });
  }
}

export type DemoProps = { label: string; children: ReactNode };

type Part<P> = <K extends keyof P>(key: K) => (element: P[K] | null) => void;

export function DemoStage<P>({
  label,
  children,
  scene,
  render,
}: DemoProps & {
  scene: () => Promise<SceneModule<P>>;
  render: (part: Part<P>) => { body: ReactNode; caption: ReactNode; controls: ReactNode };
}) {
  const root = useRef<HTMLDivElement>(null);
  const id = useId();
  const [parts] = useState(() => ({}) as Partial<P>);
  const [Still, setStill] = useState<ComponentType | null>(null);

  useStageEffect(() => {
    const element = root.current!;
    const unmount = new AbortController();
    const setPhase = (phase: Phase) => {
      if (phase === 'ready') retainStillFocus(element);
      element.dataset.phase = phase;
    };
    const near = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        near.disconnect();
        setPhase('loading');
        let arrived = false;
        scene()
          .then((module) => {
            arrived = true;
            setStill(() => module.Still);
            return module.default.start(element, parts, unmount.signal, () => setPhase('ready'));
          })
          .catch((error) => {
            if (unmount.signal.aborted) return;
            if (!quiet.includes(error?.name)) console.error(error);
            setPhase(arrived ? 'still' : 'fallback');
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
      tabIndex={-1}
      aria-label={label}
      aria-describedby={id}
    >
      <div className="demo-stage">
        {body}
        {Still ? <Still /> : <ServerStillSlot scene={scene} focusTarget={root} />}
      </div>
      <div className="demo-caption">{caption}</div>
      <div className="demo-controls">{controls}</div>
      <div id={id} className="demo-description">
        {children}
      </div>
    </div>
  );
}

// React keeps the server's children of an element with dangerouslySetInnerHTML when it hydrates.
function ServerStillSlot({
  scene,
  focusTarget,
}: {
  scene: () => Promise<{ Still: ComponentType }>;
  focusTarget: RefObject<HTMLDivElement>;
}) {
  useStageEffect(
    () => () => {
      if (focusTarget.current) retainStillFocus(focusTarget.current);
    },
    [focusTarget],
  );
  const [Still] = useState(() =>
    typeof window === 'undefined'
      ? lazy(() => scene().then((module) => ({ default: module.Still })))
      : null,
  );
  return Still ? (
    <div>
      <Suspense>
        <Still />
      </Suspense>
    </div>
  ) : (
    <div dangerouslySetInnerHTML={{ __html: '' }} suppressHydrationWarning />
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
