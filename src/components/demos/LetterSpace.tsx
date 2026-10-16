import { type DemoProps, DemoStage } from './DemoStage';

const scene = () => import('../../lib/demos/letterSpaceScene');

export default function LetterSpace(props: DemoProps) {
  return (
    <DemoStage
      {...props}
      scene={scene}
      render={(part) => ({
        body: (
          <>
            <canvas
              ref={part('map')}
              tabIndex={0}
              role="img"
              aria-label="Map of every letter at its three learned numbers. Drag it or use the arrow keys to turn it."
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
            <span className="[@container(max-width:478px)]:hidden">3 numbers per letter</span>
          </>
        ),
        controls: (
          <>
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
              Press sample to write ten names
            </div>
          </>
        ),
      })}
    />
  );
}
