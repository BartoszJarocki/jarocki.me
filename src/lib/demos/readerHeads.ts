import type { HeadWeights, HeadsReply, HeadsRequest } from '../ml/heads';
import { text } from './sentenceHeads';
import type { Stage } from './stage';
import { type Trainer, openTrainer } from './trainer';

export async function readerHeads(
  stage: Stage,
  changed: (found: HeadWeights, step: number) => void,
) {
  const worker = new Worker(new URL('../ml/heads.worker.ts', import.meta.url), { type: 'module' });
  stage.defer(() => worker.terminate());
  let trainer: Trainer | undefined;
  let pending = false;
  let revision = 0;
  let requested = -1;
  let step = 0;
  const refresh = () => {
    if (!trainer || pending || requested === revision) return;
    pending = true;
    requested = revision;
    trainer.weights();
  };
  const first = new Promise<void>((resolve, reject) => {
    worker.addEventListener('message', (event: MessageEvent<HeadsReply>) => {
      if (event.data.type === 'error') {
        const error = new Error(event.data.message);
        reject(error);
        stage.fail(error);
        return;
      }
      changed(event.data.found, step);
      pending = false;
      resolve();
      if (stage.live) refresh();
    });
    worker.addEventListener('error', (event) => {
      const error = new Error(event.message || 'The attention worker failed to load');
      reject(error);
      stage.fail(error);
    });
    worker.addEventListener('messageerror', () => {
      const error = new Error('The attention worker returned an unreadable message');
      reject(error);
      stage.fail(error);
    });
  });
  trainer = await openTrainer(stage, 'gpt', {
    snapshot() {
      revision++;
      if (stage.live) refresh();
    },
    weights(exported) {
      step = exported.step;
      worker.postMessage({ text, exported } satisfies HeadsRequest);
    },
  });
  refresh();
  stage.onLive((live) => {
    if (live) refresh();
  });
  await first;
}
