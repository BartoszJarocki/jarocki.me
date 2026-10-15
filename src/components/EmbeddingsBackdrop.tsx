import { useEffect, useRef, useState } from 'react';

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
        // A chunk that fails to load, which webpack reports as a ChunkLoadError, leaves the page
        // without a backdrop and logs nothing, like the skyline's. Any other import error is logged.
        (error) => {
          if (error?.name !== 'ChunkLoadError') throw error;
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
