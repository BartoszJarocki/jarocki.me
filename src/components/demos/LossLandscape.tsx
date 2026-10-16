import { useId } from 'react';

import { type DemoProps, DemoStage } from './DemoStage';

const scene = () => import('../../lib/demos/lossLandscapeScene');

export default function LossLandscape(props: DemoProps) {
  const rateLabel = useId();
  return (
    <DemoStage
      {...props}
      scene={scene}
      render={(part) => ({
        body: (
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-[3ch] max-[640px]:grid-cols-1 max-[640px]:gap-y-4">
            <div
              ref={part('view')}
              tabIndex={0}
              role="img"
              aria-label="The valley. The arrow keys turn it."
              className="relative h-[360px] touch-pan-y select-none data-[dragging]:cursor-grabbing max-[640px]:h-[230px] [[data-phase=ready]_&]:cursor-grab"
            >
              <canvas ref={part('valley')} className="absolute inset-0 h-full w-full" />
            </div>
            <div className="flex flex-col gap-2 text-faint max-[640px]:flex-row max-[640px]:items-end max-[640px]:gap-x-[2ch]">
              <canvas
                ref={part('inset')}
                aria-hidden="true"
                className="h-[137px] w-[176px] max-[640px]:h-[117px] max-[640px]:w-[150px]"
              />
              <span>
                The line at
                <br />
                the cube
              </span>
            </div>
          </div>
        ),
        caption: (
          <span className="flex w-full flex-wrap justify-between gap-x-[3ch] max-[640px]:flex-col">
            <span>
              Loss <span ref={part('loss')} className="text-ink" /> ·{' '}
              <span ref={part('steps')} className="text-ink" /> <span ref={part('unit')} />
            </span>
            <span ref={part('status')} aria-live="polite" className="min-h-[1.72em]" />
          </span>
        ),
        controls: (
          <>
            <div className="demo-actions">
              <button ref={part('step')} type="button" className="demo-button">
                Step
              </button>
              <button ref={part('walk')} type="button" className="demo-button">
                Walk
              </button>
              <button ref={part('fog')} type="button" className="demo-button">
                Fog
              </button>
              <button ref={part('reset')} type="button" className="demo-button">
                Reset
              </button>
            </div>
            <div role="group" aria-labelledby={rateLabel} className="flex flex-wrap gap-x-[3ch]">
              <span id={rateLabel} className="text-faint max-[640px]:basis-full">
                Step size
              </span>
              <button ref={part('crawl')} type="button" className="demo-button">
                Crawl
              </button>
              <button ref={part('good')} type="button" className="demo-button">
                Good
              </button>
              <button ref={part('zigzag')} type="button" className="demo-button">
                Zigzag
              </button>
              <button ref={part('tooBig')} type="button" className="demo-button">
                Too big
              </button>
            </div>
          </>
        ),
      })}
    />
  );
}
