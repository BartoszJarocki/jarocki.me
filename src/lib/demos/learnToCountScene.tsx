import { oneLetterSteps } from '../ml/letters';
import { curve, curveEvery } from './oneLetterCurve';
import { type Rgb, type Tokens, css, defineScene } from './stage';
import { type Trainer, openTrainer } from './trainer';

const chart = { low: 2.3, high: 3.4, counting: 2.45 };

type Label = { text: string; x: number; y: number; align: 'left' | 'center' | 'right' };

export type CurveFigure = ReturnType<typeof curveFigure>;

export function curveFigure(
  losses: ArrayLike<number>,
  every: number,
  width: number,
  height: number,
) {
  const pad = { l: 36, r: 6, t: 12, b: 26 };
  const plotWidth = width - pad.l - pad.r;
  const plotHeight = height - pad.t - pad.b;
  const x = (step: number) => pad.l + (step / oneLetterSteps) * plotWidth;
  const y = (loss: number) => pad.t + ((chart.high - loss) / (chart.high - chart.low)) * plotHeight;
  const floor = y(chart.low);
  const labels: Label[] = [
    ...[2.5, 3].map(
      (loss): Label => ({ text: loss.toFixed(1), x: pad.l - 8, y: y(loss), align: 'right' }),
    ),
    { text: 'loss', x: 0, y: 5, align: 'left' },
    ...[0, 500, 1000, 1500].map(
      (step): Label => ({
        text: step.toLocaleString('en-US'),
        x: x(step),
        y: floor + 14,
        align: 'center',
      }),
    ),
    { text: 'steps', x: width - pad.r, y: floor + 14, align: 'right' },
    {
      text: `counting model ${chart.counting}`,
      x: width - pad.r,
      y: y(chart.counting) + 10,
      align: 'right',
    },
  ];
  const lines: [number, number][][] = [[]];
  for (let i = 0; i < losses.length; i++) {
    if (Number.isFinite(losses[i]))
      lines[lines.length - 1].push([x((i + 1) * every), y(losses[i])]);
    else if (lines[lines.length - 1].length) lines.push([]);
  }
  return {
    width,
    height,
    axis: { x: pad.l, y: Math.round(floor), width: plotWidth },
    counting: { x: pad.l, y: Math.round(y(chart.counting)), width: plotWidth },
    clip: { x: pad.l, y: pad.t, width: plotWidth, height: plotHeight },
    labels,
    lines: lines.filter((line) => line.length > 1),
  };
}

const mix = (from: Rgb, to: Rgb, t: number): Rgb => [
  from[0] + (to[0] - from[0]) * t,
  from[1] + (to[1] - from[1]) * t,
  from[2] + (to[2] - from[2]) * t,
];

function drawCurve(
  ctx: CanvasRenderingContext2D,
  figure: CurveFigure,
  tokens: Tokens,
  font: string,
) {
  const { axis, counting, clip, lines } = figure;
  ctx.fillStyle = css(tokens.bg);
  ctx.fillRect(0, 0, figure.width, figure.height);
  ctx.fillStyle = css(tokens.rule);
  ctx.fillRect(axis.x, axis.y, axis.width, 1);
  ctx.fillStyle = css(mix(tokens.bg, tokens.ink, 0.45));
  ctx.fillRect(counting.x, counting.y, counting.width, 1);
  ctx.font = font;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = css(tokens.faint);
  for (const label of figure.labels) {
    ctx.textAlign = label.align;
    ctx.fillText(label.text, label.x, label.y);
  }
  ctx.save();
  ctx.beginPath();
  ctx.rect(clip.x, clip.y, clip.width, clip.height);
  ctx.clip();
  ctx.strokeStyle = css(tokens.ink);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (const line of lines) {
    ctx.moveTo(...line[0]);
    for (const point of line) ctx.lineTo(...point);
  }
  ctx.stroke();
  ctx.restore();
}

export default defineScene({
  parts: {
    chart: 'canvas',
    loss: 'span',
    step: 'span',
    train: 'button',
    reset: 'button',
  },
  async mount(stage, p) {
    const losses: number[] = [];
    let finished = false;
    let trainer: Trainer | null = null;
    const label = () => {
      p.train.textContent = finished ? 'Train again' : trainer?.training ? 'Pause' : 'Train';
    };
    trainer = await openTrainer(stage, 'oneLetter', {
      progress({ step, newLosses, average, timing, done }) {
        const start = step - newLosses.length;
        if (losses.length > start) losses.length = start;
        while (losses.length < start) losses.push(NaN);
        losses.push(...newLosses);
        finished = done;
        p.loss.textContent = average === null ? '' : average.toFixed(2);
        p.step.textContent = step.toLocaleString('en-US');
        Object.assign(p.chart.dataset, {
          step,
          average: average ?? '',
          steps: timing.steps,
          ms: timing.ms.toFixed(1),
        });
        label();
        stage.wake();
      },
    });
    const run = trainer;
    const on = { signal: stage.signal };
    p.train.addEventListener(
      'click',
      () => {
        if (finished) {
          run.reset();
          finished = false;
        }
        if (run.training) run.pause();
        else run.train();
        label();
      },
      on,
    );
    p.reset.addEventListener(
      'click',
      () => {
        run.reset();
        finished = false;
        label();
      },
      on,
    );
    label();

    return () => {
      const ctx = stage.canvas(p.chart);
      const averages: number[] = [];
      for (let i = 0; i < losses.length; i += curveEvery) {
        const group = losses.slice(i, i + curveEvery);
        averages.push(group.reduce((a, b) => a + b) / group.length);
      }
      drawCurve(
        ctx,
        curveFigure(averages, curveEvery, ctx.width, ctx.height),
        stage.tokens,
        stage.font(11),
      );
    };
  },
});

const anchors = { left: 'start', center: 'middle', right: 'end' } as const;

export function Still() {
  return (
    <>
      <CurveSvg
        figure={curveFigure(curve, curveEvery, 672, 309)}
        className="[@container(max-width:478px)]:hidden"
      />
      <CurveSvg
        figure={curveFigure(curve, curveEvery, 320, 220)}
        className="hidden [@container(max-width:478px)]:block"
      />
    </>
  );
}

function CurveSvg({ figure, className }: { figure: CurveFigure; className: string }) {
  const { width, height, axis, counting, labels, clip, lines } = figure;
  return (
    <svg
      className={`demo-still ${className}`}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMinYMid meet"
      aria-hidden="true"
    >
      <rect className="fill-rule" x={axis.x} y={axis.y} width={axis.width} height={1} />
      <rect
        x={counting.x}
        y={counting.y}
        width={counting.width}
        height={1}
        style={{ fill: 'color-mix(in srgb, var(--ink) 45%, var(--bg))' }}
      />
      <g className="fill-faint" fontSize={11} dominantBaseline="central">
        {labels.map((label) => (
          <text key={label.text} x={label.x} y={label.y} textAnchor={anchors[label.align]}>
            {label.text}
          </text>
        ))}
      </g>
      <svg
        x={clip.x}
        y={clip.y}
        width={clip.width}
        height={clip.height}
        viewBox={`${clip.x} ${clip.y} ${clip.width} ${clip.height}`}
      >
        <path
          className="stroke-ink"
          fill="none"
          strokeWidth={1.5}
          d={lines
            .flatMap((line) =>
              line.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`),
            )
            .join('')}
        />
      </svg>
    </svg>
  );
}
