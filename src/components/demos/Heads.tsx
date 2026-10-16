import { type DemoProps, DemoStage } from './DemoStage';

const scene = () => import('../../lib/demos/headsScene');
const readerScene = () => import('../../lib/demos/readerHeadsScene');

export default function Heads({ reader = false, ...props }: DemoProps & { reader?: boolean }) {
  return (
    <DemoStage
      {...props}
      scene={reader ? readerScene : scene}
      render={(part) => ({
        body: (
          <div className="relative">
            <canvas
              ref={part('arcs')}
              className="h-[496px] w-full [@container(max-width:478px)]:h-[432px]"
            />
            <div
              ref={part('letters')}
              role="listbox"
              aria-orientation="horizontal"
              aria-label="Letters of the sentence. Use the left and right arrow keys to see where each head looks from each letter."
              className="absolute inset-0"
            />
            <div className="sr-only">
              <table>
                <caption>The letter each head reads most</caption>
                <thead>
                  <tr>
                    <th scope="col">Head</th>
                    <th scope="col">Reads most</th>
                  </tr>
                </thead>
                <tbody ref={part('table')} />
              </table>
            </div>
          </div>
        ),
        caption: (
          <>
            <span>
              <span className="text-faint">From</span>&nbsp;
              <span ref={part('letter')} />
            </span>
            <span className="[@container(max-width:478px)]:hidden">2 blocks of 4 heads</span>
          </>
        ),
        controls: null,
      })}
    />
  );
}
