import { type DemoProps, DemoStage } from './DemoStage';

const scene = () => import('../../lib/demos/attentionTriangleScene');

export default function AttentionTriangle(props: DemoProps) {
  return (
    <DemoStage
      {...props}
      scene={scene}
      render={(part) => ({
        body: (
          <div className="relative">
            <canvas ref={part('triangle')} className="aspect-square w-full" />
            <div
              ref={part('rows')}
              role="listbox"
              aria-label="Rows of the triangle, one for each letter. Use the up and down arrow keys to read them."
              className="absolute inset-0"
            />
            <div className="mt-[16px] tabular-nums [@container(min-width:479px)]:absolute [@container(min-width:479px)]:right-0 [@container(min-width:479px)]:top-[40px] [@container(min-width:479px)]:mt-0 [@container(min-width:479px)]:w-[28ch] [@media(scripting:none)]:hidden">
              <div ref={part('heading')} className="text-faint">
                Point at a row to read it
              </div>
              <div ref={part('reads')} className="mt-[6px] grid gap-y-[2px]" />
              <div className="sr-only">
                <table>
                  <caption>The three letters each letter reads most</caption>
                  <thead>
                    <tr>
                      <th scope="col">Letter</th>
                      <th scope="col">Reads most</th>
                      <th scope="col">Then</th>
                      <th scope="col">Then</th>
                    </tr>
                  </thead>
                  <tbody ref={part('table')} />
                </table>
              </div>
            </div>
          </div>
        ),
        caption: (
          <>
            <span ref={part('head')} />
            <span ref={part('size')} className="[@container(max-width:478px)]:hidden" />
          </>
        ),
        controls: null,
      })}
    />
  );
}
