import { type DemoProps, DemoStage, Slider } from './DemoStage';

const scene = () => import('../../lib/demos/taxiFaresScene');

export function TaxiFares(props: DemoProps) {
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
              <span className="text-faint">Loss</span> <span ref={part('loss')} />
            </span>
            <span>Eight made-up rides</span>
          </>
        ),
        controls: (
          <>
            <Slider label="Starting fee" input={part('fee')} value={part('feeText')} />
            <Slider label="Price per km" input={part('price')} value={part('priceText')} />
          </>
        ),
      })}
    />
  );
}
