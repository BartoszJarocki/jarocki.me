import { type HeadsReply, headWeights, trainedGpt } from './heads.ts';

const reply = (message: HeadsReply, transfer: Transferable[] = []) =>
  postMessage(message, { transfer });

addEventListener('message', async (event: MessageEvent<string>) => {
  try {
    const found = headWeights(await trainedGpt((path) => fetch(path)), event.data);
    reply({ type: 'weights', found }, [found.weights.buffer]);
  } catch (error) {
    reply({ type: 'error', message: error instanceof Error ? error.message : String(error) });
  }
});
