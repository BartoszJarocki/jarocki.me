import { type ReactNode, useId } from 'react';

import { type DemoProps, DemoStage } from './DemoStage';

const scene = () => import('../../lib/demos/playgroundScene');

const about = {
  days: 'Made-up days indoors, with the comfortable ones in the middle.',
  switches:
    'In this hallway, the light is on when exactly one switch is up, and no single fence can split that. The dots are repeats of the four switch settings, spread a little so you can see them.',
  groups:
    'Warm calm beach days and cold windy ones sit in two separate groups, so one fence is enough.',
  spiral: 'Two arms wound around each other. The hard one.',
};

const names = Object.keys(about) as (keyof typeof about)[];

export function PlaygroundLayout({ field, hinton }: { field: ReactNode; hinton: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,418px)_auto] items-start gap-x-[3ch] max-[640px]:grid-cols-[minmax(0,1fr)] max-[640px]:gap-y-4">
      {field}
      <div className="flex flex-col gap-y-2 max-[640px]:flex-row max-[640px]:items-end max-[640px]:gap-x-[2ch]">
        {hinton}
        <span className="text-faint">
          First layer,
          <br />
          one row
          <br />
          per neuron
        </span>
      </div>
    </div>
  );
}

const row = 'flex flex-wrap gap-x-[2.5ch] gap-y-0.5 max-[640px]:gap-x-[2ch]';

export default function Playground(props: DemoProps) {
  const data = useId();
  return (
    <DemoStage
      {...props}
      scene={scene}
      render={(part) => ({
        body: (
          <PlaygroundLayout
            field={<canvas ref={part('field')} className="aspect-square w-full" />}
            hinton={
              <canvas
                ref={part('hinton')}
                role="img"
                aria-label="The first layer's knobs, one row per neuron, filled for a positive number and hollow for a negative one, bigger for a number farther from zero. Point at a row, or use the arrow keys, to draw that neuron's fence."
                tabIndex={0}
                className="h-[308px] w-[108px] touch-none"
              />
            }
          />
        ),
        caption: (
          <>
            <span className="max-[640px]:flex max-[640px]:flex-col">
              <span>
                <span ref={part('steps')} /> <span ref={part('stepWord')} className="text-faint" />
              </span>
              <span className="text-faint max-[640px]:hidden"> · </span>
              <span>
                <span className="text-faint">loss</span> <span ref={part('loss')} />{' '}
                <span className="text-faint">·</span> <span ref={part('accuracy')} />{' '}
                <span className="text-faint">right</span>
              </span>
            </span>
            <span ref={part('name')} />
          </>
        ),
        controls: (
          <>
            <div className={row}>
              <button
                ref={part('train')}
                type="button"
                className="demo-button"
                aria-pressed="false"
              >
                Train
              </button>
              <button ref={part('pause')} type="button" className="demo-button" aria-pressed="true">
                Pause
              </button>
              <button ref={part('step')} type="button" className="demo-button">
                Step
              </button>
              <button ref={part('reset')} type="button" className="demo-button">
                Reset
              </button>
            </div>
            <div role="group" aria-labelledby={data} className={row}>
              <span id={data} className="text-faint">
                Data
              </span>
              {names.map((name) => (
                <button
                  key={name}
                  ref={part(name)}
                  type="button"
                  className="demo-button"
                  aria-pressed={name === names[0]}
                >
                  {name}
                </button>
              ))}
            </div>
            <div className="mt-[14px]">
              {names.map((name) => (
                <div
                  key={name}
                  className="grid grid-cols-[9ch_minmax(0,1fr)] gap-x-[3ch] py-0.5 max-[640px]:gap-x-[2ch]"
                >
                  <span>{name}</span>
                  <span className="text-body">{about[name]}</span>
                </div>
              ))}
            </div>
          </>
        ),
      })}
    />
  );
}
