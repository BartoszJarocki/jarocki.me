import { useEffect, useRef, useState } from 'react';

import { chunkLoadFailed } from '../lib/chunkLoad';
import type { BackdropHandle } from '../lib/embeddingsScene';
import { release } from '../lib/teardown';

export function EmbeddingsBackdrop() {
  const stage = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const unmount = new AbortController();
    let scene: BackdropHandle | null = null;
    import('../lib/embeddingsScene')
      .then(
        async ({ mountEmbeddings }) => {
          if (unmount.signal.aborted) return;
          const handle = await mountEmbeddings(element, unmount.signal);
          // An unmount after the mount's last check of the signal still delivers the scene.
          if (unmount.signal.aborted) {
            release(handle);
            return;
          }
          scene = handle;
          setReady(handle !== null);
        },
        (error) => {
          if (!chunkLoadFailed(error)) throw error;
        },
      )
      .catch((error) => {
        if (!unmount.signal.aborted) console.error(error);
      });
    return () => {
      unmount.abort();
      release(scene);
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
