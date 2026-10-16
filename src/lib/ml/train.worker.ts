// The worker the demos train in. All of it is in training.ts, so a Node test drives the same handler.
import { type In, trainingHandler } from './training.ts';

const receive = trainingHandler({
  post: (message, transfer) => postMessage(message, { transfer }),
  read: (path) => fetch(path),
});

addEventListener('message', (event: MessageEvent<In>) => void receive(event.data));
