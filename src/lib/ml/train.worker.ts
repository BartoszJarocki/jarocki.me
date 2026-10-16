import { type In, trainingHandler } from './training.ts';

const receive = trainingHandler({
  post: (message, transfer) => postMessage(message, { transfer }),
  read: (path) => fetch(path),
});

addEventListener('message', (event: MessageEvent<In>) => void receive(event.data));
