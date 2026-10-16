import { ReceiptTable } from '../../components/demos/ReceiptTable';
import { nudge, receipt, ride } from './fareReceipt';
import { lines } from './receiptLines';
import { defineScene } from './stage';
import { fareRule, show, start } from './taxiFares';

const rowMs = 420;

const put = (element: HTMLElement, text: string) => {
  if (element.textContent !== text) element.textContent = text;
};

export default defineScene({
  parts: {
    price: 'tr',
    fee: 'tr',
    ride: 'tr',
    fare: 'tr',
    miss: 'tr',
    loss: 'tr',
    km: 'span',
    paid: 'span',
    readout: 'dl',
    readPrice: 'dd',
    readLoss: 'dd',
    readChange: 'dd',
    readRatio: 'dd',
    nudge: 'button',
    backward: 'button',
    clear: 'button',
  },
  mount(stage, p) {
    p.km.textContent = String(ride.km);
    p.paid.textContent = show(ride.paid);
    let nudged = false;
    let walkStart: number | null = null;
    const filled = (now: number) =>
      walkStart === null
        ? 0
        : stage.reducedMotion
          ? lines.length
          : Math.min(lines.length, 1 + Math.floor((now - walkStart) / rowMs));

    const write = (count: number) => {
      const rule = fareRule.get();
      const values = receipt(rule);
      lines.forEach((line, index) => {
        const { data, grad } = values[line];
        const row = p[line];
        const slopeShown = index >= lines.length - count;
        put(row.cells[1], show(data));
        put(row.cells[2], slopeShown ? show(grad) : '');
        row.dataset.amount = String(data);
        if (slopeShown) row.dataset.slope = String(grad);
        else delete row.dataset.slope;
      });

      p.readout.hidden = !nudged;
      if (nudged) {
        const n = nudge(rule);
        put(p.readPrice, `${show(rule.price)} → ${show(n.price)}`);
        put(p.readLoss, `${show(n.before, 4)} → ${show(n.after, 4)}`);
        put(p.readChange, show(n.change, 4));
        put(p.readRatio, show(n.ratio));
        p.readout.dataset.change = String(n.change);
        p.readout.dataset.ratio = String(n.ratio);
      }
    };
    const writeNow = () => write(filled(performance.now()));

    const on = { signal: stage.signal };
    p.nudge.addEventListener(
      'click',
      () => {
        nudged = true;
        writeNow();
      },
      on,
    );
    p.backward.addEventListener(
      'click',
      () => {
        walkStart = performance.now();
        stage.wake();
        writeNow();
      },
      on,
    );
    p.clear.addEventListener(
      'click',
      () => {
        nudged = false;
        walkStart = null;
        writeNow();
      },
      on,
    );
    fareRule.subscribe(writeNow, stage.signal);

    return () => {
      const count = filled(performance.now());
      write(count);
      return count > 0 && count < lines.length;
    };
  },
});

export function Still() {
  const values = receipt(start);
  return (
    <ReceiptTable
      printed={{
        km: String(ride.km),
        paid: show(ride.paid),
        amount: (line) => show(values[line].data),
      }}
    />
  );
}
