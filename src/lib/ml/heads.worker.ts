import { createTransformer, shakespeare } from './gpt.ts';
import { type HeadsReply, type HeadsRequest, headWeights, trainedGpt } from './heads.ts';
import { load } from './params.ts';

const reply = (message: HeadsReply, transfer: Transferable[] = []) =>
  postMessage(message, { transfer });

addEventListener('message', async (event: MessageEvent<HeadsRequest>) => {
  try {
    const request = event.data;
    const net =
      typeof request === 'string'
        ? await trainedGpt((path) => fetch(path))
        : createTransformer({ ...shakespeare, symbols: request.exported.symbols });
    if (typeof request !== 'string') load(net.params, request.exported.checkpoint);
    const found = headWeights(net, typeof request === 'string' ? request : request.text);
    reply({ type: 'weights', found }, [found.weights.buffer]);
  } catch (error) {
    reply({ type: 'error', message: error instanceof Error ? error.message : String(error) });
  }
});
