import { useEffect, useRef, useState } from 'react';

import type { BackdropHandle } from '../lib/embeddingsScene';

export function EmbeddingsBackdrop() {
  const stage = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const unmount = new AbortController();
    let scene: BackdropHandle | null = null;
    import('../lib/embeddingsScene')
      .then(async ({ mountEmbeddings }) => {
        if (unmount.signal.aborted) return;
        scene = await mountEmbeddings(element, unmount.signal);
        setReady(scene !== null);
      })
      .catch((error) => {
        if (!unmount.signal.aborted) console.error(error);
      });
    return () => {
      unmount.abort();
      scene?.destroy();
    };
  }, []);

  return (
    <div
      ref={stage}
      aria-hidden="true"
      className="backdrop font-mono"
      data-phase={ready ? 'ready' : 'loading'}
    />
  );
}
