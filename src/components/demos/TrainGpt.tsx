import { type DemoProps, DemoStage } from './DemoStage';

const scene = () => import('../../lib/demos/trainGptScene');

export default function TrainGpt(props: DemoProps) {
  return (
    <DemoStage
      {...props}
      scene={scene}
      render={(part) => ({
        body: (
          <div>
            <canvas ref={part('chart')} className="h-[220px] w-full" />
            <div
              ref={part('samples')}
              className="h-[280px] overflow-auto whitespace-pre-wrap text-[12px] text-body"
            />
          </div>
        ),
        caption: (
          <div className="flex w-full flex-wrap gap-x-[2ch]">
            <span>
              Step{' '}
              <span ref={part('step')} className="text-ink">
                0
              </span>
            </span>
            <span>
              Practice <span ref={part('practice')} className="text-ink" />
            </span>
            <span>
              Exam <span ref={part('exam')} className="text-ink" />
            </span>
            <span ref={part('status')}>Ready to train</span>
            <span
              ref={part('announcement')}
              className="sr-only"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            />
          </div>
        ),
        controls: (
          <div className="flex flex-wrap gap-x-[3ch] gap-y-2">
            <button ref={part('train')} type="button" className="demo-button">
              Train
            </button>
            <button ref={part('pause')} type="button" className="demo-button">
              Pause
            </button>
            <button ref={part('load')} type="button" className="demo-button">
              Load the trained one
            </button>
          </div>
        ),
      })}
    />
  );
}
