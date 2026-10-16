import { symbols } from '../../lib/ml/tokenizers';
import { type DemoProps, DemoStage } from './DemoStage';

const scene = () => import('../../lib/demos/letterSpaceScene');
const readerScene = () => import('../../lib/demos/gptLetterSpaceScene');

export default function LetterSpace({
  reader = false,
  ...props
}: DemoProps & { reader?: boolean }) {
  return (
    <DemoStage
      {...props}
      scene={reader ? readerScene : scene}
      render={(part) => ({
        body: (
          <>
            <canvas
              ref={part('map')}
              tabIndex={0}
              role="img"
              aria-label={
                reader
                  ? 'Map of all 39 symbols. Their 32 learned numbers are squeezed into three PCA directions. Drag or use the arrow keys to turn it.'
                  : 'Map of every letter at its three learned numbers. Drag it or use the arrow keys to turn it.'
              }
              className="aspect-[672/420] min-h-[300px] w-full cursor-grab touch-pan-y select-none active:cursor-grabbing"
            />
            <div className="sr-only">
              <table>
                <caption>{"Each letter's five nearest letters on the map"}</caption>
                <thead>
                  <tr>
                    <th scope="col">Letter</th>
                    <th scope="col">Five nearest</th>
                  </tr>
                </thead>
                <tbody ref={part('nearest')} />
              </table>
            </div>
          </>
        ),
        caption: (
          <>
            <span>
              <span className="text-faint">Loss</span>&nbsp;
              <span ref={part('loss')} />
              <span className="text-faint"> · step</span>&nbsp;
              <span ref={part('step')} />
            </span>
            <span className="[@container(max-width:478px)]:hidden">
              {reader ? '32 numbers in 3 directions' : '3 numbers per letter'}
            </span>
          </>
        ),
        controls: (
          <>
            <label className="mb-[8px] flex items-baseline gap-x-[2ch] text-faint">
              Follow a letter
              <select ref={part('letter')} defaultValue="a" className="bg-bg text-ink">
                {Array.from(symbols, (symbol) => (
                  <option key={symbol} value={symbol}>
                    {symbol === '.' ? 'the dot' : symbol}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-baseline gap-x-[3ch]">
              <button ref={part('train')} type="button" className="demo-button">
                Train
              </button>
              <button ref={part('reset')} type="button" className="demo-button">
                Reset
              </button>
              <button ref={part('sample')} type="button" className="demo-button">
                Sample
              </button>
            </div>
            <div
              ref={part('names')}
              aria-live="polite"
              className="mt-[8px] flex min-h-[48px] flex-wrap content-start gap-x-[2ch] text-faint [overflow-wrap:anywhere]"
            >
              {reader
                ? 'Press sample to write with your current model'
                : 'Press sample to write ten names'}
            </div>
          </>
        ),
      })}
    />
  );
}
