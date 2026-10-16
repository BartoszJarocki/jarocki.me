import { type DemoProps, DemoStage } from './DemoStage';
import { ReceiptTable } from './ReceiptTable';

const scene = () => import('../../lib/demos/fareReceiptScene');

export default function FareReceipt(props: DemoProps) {
  return (
    <DemoStage
      {...props}
      scene={scene}
      render={(part) => ({
        body: (
          <>
            <ReceiptTable row={(line) => part(line)} span={(name) => part(name)} />
            <div aria-live="polite" aria-atomic="true">
              <dl ref={part('readout')} className="demo-readout" hidden>
                <dt>Price per km</dt>
                <dd ref={part('readPrice')} />
                <dt>This ride&apos;s loss</dt>
                <dd ref={part('readLoss')} />
                <dt>Change</dt>
                <dd ref={part('readChange')} />
                <dt>Change divided by one cent</dt>
                <dd ref={part('readRatio')} />
              </dl>
            </div>
          </>
        ),
        caption: null,
        controls: (
          <div className="demo-actions">
            <button ref={part('nudge')} type="button" className="demo-button">
              Nudge
            </button>
            <button ref={part('backward')} type="button" className="demo-button">
              Backward
            </button>
            <button ref={part('clear')} type="button" className="demo-button">
              Clear
            </button>
          </div>
        ),
      })}
    />
  );
}
