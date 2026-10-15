import { type Rgb, type Tokens, css, defineScene } from './stage';
import {
  type FareRule,
  fareBox,
  fareRule,
  meanSquaredError,
  money,
  predict,
  rides,
  start,
} from './taxiFares';

const chart = { km: 3, fare: 14 };

type Label = {
  text: string;
  x: number;
  y: number;
  align: 'left' | 'center' | 'right';
  baseline: 'middle' | 'top';
};

export type FareFigure = ReturnType<typeof fareFigure>;

// In CSS pixels. The live canvas and the no-JavaScript still both print this, so they can't drift.
export function fareFigure(rule: FareRule, width: number, height: number, compact = false) {
  const pad = compact ? { l: 2, r: 2, t: 2, b: 2 } : { l: 36, r: 6, t: 12, b: 26 };
  const plotWidth = width - pad.l - pad.r;
  const plotHeight = height - pad.t - pad.b;
  const perKm = plotWidth / chart.km;
  const perDollar = plotHeight / chart.fare;
  const x = (km: number) => pad.l + km * perKm;
  const y = (fare: number) => pad.t + plotHeight - fare * perDollar;
  const floor = y(0);
  const dot = compact ? 4 : 6;
  const labels: Label[] = compact
    ? []
    : [
        ...[0, 4, 8, 12].map(
          (fare): Label => ({
            text: `$${fare}`,
            x: pad.l - 8,
            y: y(fare),
            align: 'right',
            baseline: 'middle',
          }),
        ),
        { text: 'fare', x: 0, y: 5, align: 'left', baseline: 'middle' },
        ...[0, 1, 2].map(
          (km): Label => ({
            text: km ? `${km} km` : '0',
            x: x(km),
            y: floor + 8,
            align: 'center',
            baseline: 'top',
          }),
        ),
        { text: 'distance', x: width - pad.r, y: floor + 8, align: 'right', baseline: 'top' },
      ];
  return {
    width,
    height,
    axis: { x: pad.l, y: Math.round(floor), width: plotWidth },
    labels,
    clip: { x: pad.l, y: 0, width: plotWidth + pad.r, height: floor },
    squareTone: compact ? 0.4 : 0.45,
    squares: rides.flatMap((ride) => {
      const miss = predict(rule, ride.km) - ride.paid;
      const side = Math.round(Math.abs(miss) * perDollar);
      if (side < 1) return [];
      const top = Math.round(Math.min(y(ride.paid), y(ride.paid + miss)));
      return [{ x: Math.round(x(ride.km)) + 0.5, y: top + 0.5, side }];
    }),
    line: {
      x1: x(0),
      y1: y(predict(rule, 0)),
      x2: width,
      y2: y(predict(rule, chart.km + pad.r / perKm)),
      width: compact ? 1 : 1.5,
    },
    dot,
    dots: rides.map((ride) => ({
      x: Math.round(x(ride.km) - dot / 2),
      y: Math.round(y(ride.paid) - dot / 2),
    })),
  };
}

const mix = (from: Rgb, to: Rgb, t: number): Rgb => [
  from[0] + (to[0] - from[0]) * t,
  from[1] + (to[1] - from[1]) * t,
  from[2] + (to[2] - from[2]) * t,
];

export function drawFares(
  ctx: CanvasRenderingContext2D,
  figure: FareFigure,
  tokens: Tokens,
  font: string,
) {
  const { axis, clip, line, dot } = figure;
  ctx.fillStyle = css(tokens.bg);
  ctx.fillRect(0, 0, figure.width, figure.height);
  ctx.fillStyle = css(tokens.rule);
  ctx.fillRect(axis.x, axis.y, axis.width, 1);
  ctx.font = font;
  ctx.fillStyle = css(tokens.faint);
  for (const label of figure.labels) {
    ctx.textAlign = label.align;
    ctx.textBaseline = label.baseline;
    ctx.fillText(label.text, label.x, label.y);
  }
  ctx.save();
  ctx.beginPath();
  ctx.rect(clip.x, clip.y, clip.width, clip.height);
  ctx.clip();
  ctx.lineWidth = 1;
  ctx.strokeStyle = css(mix(tokens.bg, tokens.ink, figure.squareTone));
  for (const square of figure.squares) {
    ctx.strokeRect(square.x, square.y, square.side, square.side);
  }
  ctx.strokeStyle = css(tokens.ink);
  ctx.lineWidth = line.width;
  ctx.beginPath();
  ctx.moveTo(line.x1, line.y1);
  ctx.lineTo(line.x2, line.y2);
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = css(tokens.ink);
  for (const point of figure.dots) ctx.fillRect(point.x, point.y, dot, dot);
}

export default defineScene({
  parts: {
    chart: 'canvas',
    loss: 'span',
    fee: 'input',
    feeText: 'span',
    price: 'input',
    priceText: 'span',
  },
  mount(stage, p) {
    const knobs = [
      { key: 'fee', input: p.fee, text: p.feeText },
      { key: 'price', input: p.price, text: p.priceText },
    ] as const;
    const read = () => fareRule.set({ fee: p.fee.valueAsNumber, price: p.price.valueAsNumber });
    for (const { key, input } of knobs) {
      const { min, max, step } = fareBox[key];
      input.min = String(min);
      input.max = String(max);
      input.step = String(step);
      input.addEventListener('input', read, { signal: stage.signal });
    }
    fareRule.subscribe(stage.wake, stage.signal);

    // Every output is written here, so the squares, the loss, and the values change on one frame.
    return () => {
      const rule = fareRule.get();
      for (const { key, input, text } of knobs) {
        if (input.valueAsNumber !== rule[key]) input.value = String(rule[key]);
        text.textContent = money(rule[key]);
        input.setAttribute('aria-valuetext', money(rule[key]));
      }
      p.loss.textContent = meanSquaredError(rule).toFixed(2);
      const ctx = stage.canvas(p.chart);
      drawFares(ctx, fareFigure(rule, ctx.width, ctx.height), stage.tokens, stage.font(11));
    };
  },
});

const anchors = { left: 'start', center: 'middle', right: 'end' } as const;
const baselines = { middle: 'central', top: 'text-before-edge' } as const;

// The figure at the start rule for readers without JavaScript. Only the server renders it.
export function Still() {
  const { width, height, axis, labels, clip, squareTone, squares, line, dot, dots } = fareFigure(
    start,
    672,
    309,
  );
  return (
    <svg className="demo-still" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <rect className="fill-rule" x={axis.x} y={axis.y} width={axis.width} height={1} />
      <g className="fill-faint" fontSize={11}>
        {labels.map((label) => (
          <text
            key={label.text}
            x={label.x}
            y={label.y}
            textAnchor={anchors[label.align]}
            dominantBaseline={baselines[label.baseline]}
          >
            {label.text}
          </text>
        ))}
      </g>
      {/* A nested svg clips like the canvas's clip rect, with no id for two stills to share. */}
      <svg
        x={clip.x}
        y={clip.y}
        width={clip.width}
        height={clip.height}
        viewBox={`${clip.x} ${clip.y} ${clip.width} ${clip.height}`}
      >
        <g
          fill="none"
          style={{
            stroke: `color-mix(in srgb, var(--ink) ${Math.round(squareTone * 100)}%, var(--bg))`,
          }}
        >
          {squares.map((square) => (
            <rect
              key={square.x}
              x={square.x}
              y={square.y}
              width={square.side}
              height={square.side}
            />
          ))}
        </g>
        <line
          className="stroke-ink"
          strokeWidth={line.width}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
        />
      </svg>
      <g className="fill-ink">
        {dots.map((point) => (
          <rect key={point.x} x={point.x} y={point.y} width={dot} height={dot} />
        ))}
      </g>
    </svg>
  );
}
