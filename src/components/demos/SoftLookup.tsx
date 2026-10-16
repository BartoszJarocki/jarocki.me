import { type DemoProps, DemoStage } from './DemoStage';

const scene = () => import('../../lib/demos/softLookupScene');

export default function SoftLookup(props: DemoProps) {
  return (
    <DemoStage
      {...props}
      scene={scene}
      render={(part) => ({
        body: (
          <div className="grid gap-x-[3ch] gap-y-[16px] sm:grid-cols-[minmax(0,1fr)_28ch]">
            <div className="relative">
              <canvas ref={part('keys')} className="aspect-square w-full touch-pan-y" />
              <div
                ref={part('query')}
                role="slider"
                tabIndex={0}
                aria-label="The query for small. Drag it or use the arrow keys to move it."
                aria-valuenow={0}
                className="absolute left-0 top-0 h-[28px] w-[28px] cursor-grab touch-none active:cursor-grabbing [@media(scripting:none)]:hidden"
              />
            </div>
            <div className="tabular-nums [@media(scripting:none)]:hidden">
              <div className="text-faint">How much small reads</div>
              <div ref={part('bars')} className="mt-[6px] grid gap-y-[2px]" />
              <div className="mt-[16px] text-faint">What small gets back</div>
              <canvas ref={part('values')} className="mt-[6px] aspect-square w-full max-w-[28ch]" />
            </div>
          </div>
        ),
        caption: (
          <>
            <span>
              <span className="text-faint">Small reads</span>&nbsp;
              <span ref={part('reads')} />
            </span>
            <span className="[@container(max-width:478px)]:hidden">4 earlier words</span>
          </>
        ),
        controls: null,
      })}
    />
  );
}
