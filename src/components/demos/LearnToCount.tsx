import { type DemoProps, DemoStage } from './DemoStage';

const scene = () => import('../../lib/demos/learnToCountScene');

export default function LearnToCount(props: DemoProps) {
  return (
    <DemoStage
      {...props}
      scene={scene}
      render={(part) => ({
        body: (
          <canvas ref={part('chart')} className="aspect-[672/309] max-h-[320px] min-h-[220px]" />
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
