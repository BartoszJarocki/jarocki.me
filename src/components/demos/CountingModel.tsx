import { useId } from 'react';

import { type DemoProps, DemoStage } from './DemoStage';

const scene = () => import('../../lib/demos/countingModelScene');

export default function CountingModel(props: DemoProps) {
  const temperatureId = useId();
  return (
    <DemoStage
      {...props}
      scene={scene}
      render={(part) => ({
        body: (
          <div className="grid gap-x-[3ch] gap-y-[16px] sm:grid-cols-[minmax(0,1fr)_28ch]">
            <canvas ref={part('grid')} className="aspect-square w-full" />
            <div className="tabular-nums [@media(scripting:none)]:hidden">
              <div ref={part('heading')} className="text-faint">
                Type a letter to see what comes after it
              </div>
              <div
                ref={part('chances')}
                className="mt-[6px] grid grid-flow-col grid-cols-3 grid-rows-9 gap-x-[2ch]"
              />
              <div ref={part('announce')} aria-live="polite" className="sr-only" />
              <div className="sr-only">
                <table>
                  <caption>The 20 most common pairs in the names</caption>
                  <thead>
                    <tr>
                      <th scope="col">Pair</th>
                      <th scope="col">Count</th>
                    </tr>
                  </thead>
                  <tbody ref={part('pairs')} />
                </table>
              </div>
            </div>
          </div>
        ),
        caption: (
          <>
            <span>
              <span className="text-faint">Loss</span>&nbsp;
              <span ref={part('loss')} />
            </span>
            <span>32,033 names</span>
          </>
        ),
        controls: (
          <>
            <div className="flex items-baseline gap-x-[3ch]">
              <label className="flex items-baseline gap-x-[1.5ch]">
                <span className="text-faint">Letter</span>
                <input
                  ref={part('letter')}
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-[3ch] border-b border-faint bg-transparent py-[2px] text-center lowercase text-ink"
                />
              </label>
              <button ref={part('sample')} type="button" className="demo-button">
                Sample
              </button>
            </div>
            <div className="demo-slider mt-[8px] items-start">
              <label htmlFor={temperatureId}>Temperature</label>
              <div>
                <input ref={part('temperature')} id={temperatureId} type="range" />
                <div aria-hidden="true" className="flex flex-wrap gap-x-[1ch] text-faint">
                  <span>Samey</span>
                  <span className="ml-auto">Strange</span>
                </div>
              </div>
              <span ref={part('temperatureText')} aria-hidden="true" className="demo-value" />
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
