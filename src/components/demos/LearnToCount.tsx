import { type DemoProps, DemoStage } from './DemoStage';

const scene = () => import('../../lib/demos/learnToCountScene');

export default function LearnToCount(props: DemoProps) {
  return (
    <DemoStage
      {...props}
      scene={scene}
      render={(part) => ({
        body: (
          <>
            <canvas ref={part('chart')} className="aspect-[672/309] max-h-[320px] min-h-[220px]" />
            <div className="mt-[10px] text-faint">
              Training stops at 1,762 steps, twice the 881 the slowest of five trial runs needed to
              come within 0.02 of 2.45.
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
            <span>32,033 names</span>
          </>
        ),
        controls: (
          <div className="flex items-baseline gap-x-[3ch]">
            <button ref={part('train')} type="button" className="demo-button">
              Train
            </button>
            <button ref={part('reset')} type="button" className="demo-button">
              Reset
            </button>
          </div>
        ),
      })}
    />
  );
}
