import { type Point, clampQuery, lookup, queryBox, words } from './softLookup';
import { type Stage, type Tokens, css, defineScene } from './stage';

type Fitted = ReturnType<Stage['canvas']>;

const pad = 22;
const valueReach = 1.4;

/** Where the key chart draws each arrow on a square of `side` pixels, and back. */
export function keyFigure(side: number, query: Point) {
  const scale = (side / 2 - pad) / queryBox.reach;
  const at = ([x, y]: Point): Point => [side / 2 + x * scale, side / 2 - y * scale];
  return {
    side,
    middle: at([0, 0]),
    keys: words.map(({ text, key }) => ({ text, tip: at(key), toward: key })),
    query: at(query),
    point: ([px, py]: Point): Point => [(px - side / 2) / scale, (side / 2 - py) / scale],
  };
}

function valueFigure(side: number, found: Point) {
  const scale = (side / 2 - pad) / valueReach;
  const at = ([x, y]: Point): Point => [side / 2 + x * scale, side / 2 - y * scale];
  return { values: words.map(({ text, value }) => ({ text, at: at(value) })), found: at(found) };
}

const percent = (weight: number) => `${(weight * 100).toFixed(1)}%`;
const coordinate = (n: number) => (Math.round(n * 10) / 10).toFixed(1);

function arrow(ctx: CanvasRenderingContext2D, from: Point, to: Point, head: number) {
  const angle = Math.atan2(to[1] - from[1], to[0] - from[0]);
  const back = (turn: number): Point => [
    to[0] - head * Math.cos(angle + turn),
    to[1] - head * Math.sin(angle + turn),
  ];
  ctx.beginPath();
  ctx.moveTo(...from);
  ctx.lineTo(...back(0));
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(...to);
  ctx.lineTo(...back(0.45));
  ctx.lineTo(...back(-0.45));
  ctx.closePath();
  ctx.fill();
}

/** A label just past the end of an arrow, pushed out along its direction. */
function labelAt(tip: Point, toward: Point): Point {
  const length = Math.hypot(...toward) || 1;
  return [tip[0] + (toward[0] / length) * 14, tip[1] - (toward[1] / length) * 14];
}

/** The query's label sits beside its tip, so it never lands on a key's label. */
function queryLabelAt(tip: Point, query: Point): Point {
  const length = Math.hypot(...query);
  const [x, y] = length ? [query[0] / length, query[1] / length] : [0, 1];
  return [tip[0] + y * 26, tip[1] + x * 26];
}

function drawKeys(ctx: Fitted, query: Point, tokens: Tokens, font: string) {
  const figure = keyFigure(ctx.width, query);
  const { side, middle } = figure;
  ctx.fillStyle = css(tokens.bg);
  ctx.fillRect(0, 0, side, side);
  ctx.fillStyle = css(tokens.rule);
  ctx.fillRect(Math.round(middle[0]), pad, 1, side - 2 * pad);
  ctx.fillRect(pad, Math.round(middle[1]), side - 2 * pad, 1);
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = ctx.fillStyle = css(tokens.body);
  for (const { tip } of figure.keys) arrow(ctx, middle, tip, 7);
  ctx.fillStyle = css(tokens.faint);
  for (const { text, tip, toward } of figure.keys) ctx.fillText(text, ...labelAt(tip, toward));
  ctx.lineWidth = 2;
  ctx.strokeStyle = ctx.fillStyle = css(tokens.ink);
  arrow(ctx, middle, figure.query, 8);
  ctx.fillRect(figure.query[0] - 6, figure.query[1] - 6, 12, 12);
  ctx.fillStyle = css(tokens.faint);
  ctx.fillText('small', ...queryLabelAt(figure.query, query));
}

function drawValues(ctx: Fitted, found: Point, tokens: Tokens, font: string) {
  const side = ctx.width;
  const figure = valueFigure(side, found);
  ctx.fillStyle = css(tokens.bg);
  ctx.fillRect(0, 0, side, side);
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 1;
  ctx.strokeStyle = css(tokens.body);
  for (const { text, at } of figure.values) {
    ctx.strokeRect(Math.round(at[0]) - 4.5, Math.round(at[1]) - 4.5, 9, 9);
    ctx.fillStyle = css(tokens.faint);
    ctx.fillText(text, at[0], at[1] + (at[1] < side / 2 ? -14 : 14));
  }
  ctx.fillStyle = css(tokens.ink);
  ctx.fillRect(Math.round(figure.found[0]) - 5, Math.round(figure.found[1]) - 5, 10, 10);
}

export default defineScene({
  parts: {
    keys: 'canvas',
    query: 'div',
    bars: 'div',
    values: 'canvas',
    reads: 'span',
  },
  mount(stage, p) {
    let query = queryBox.start;
    const on = { signal: stage.signal };

    const rows = words.map(({ text }) => {
      const row = document.createElement('div');
      row.className = 'grid grid-cols-[8ch_minmax(0,1fr)_7ch] items-center gap-x-[1.5ch]';
      const bar = document.createElement('span');
      bar.className = 'h-[8px] bg-ink';
      const value = document.createElement('span');
      value.className = 'text-right';
      row.append(Object.assign(document.createElement('span'), { textContent: text }), bar, value);
      return { row, bar, value };
    });
    const total = document.createElement('div');
    total.className = 'grid grid-cols-[minmax(0,1fr)_7ch] border-t border-rule pt-[2px] text-faint';
    const totalValue = Object.assign(document.createElement('span'), { className: 'text-right' });
    total.append('Total', totalValue);
    p.bars.replaceChildren(...rows.map(({ row }) => row), total);

    const show = () => {
      const { weights } = lookup(query);
      rows.forEach(({ row, bar, value }, i) => {
        row.dataset.weight = String(weights[i]);
        bar.style.width = percent(weights[i]);
        value.textContent = percent(weights[i]);
      });
      totalValue.textContent = percent(weights.reduce((a, b) => a + b, 0));
      const order = words.map((_, i) => i).sort((a, b) => weights[b] - weights[a]);
      p.reads.textContent = `${words[order[0]].text} ${percent(weights[order[0]])}`;
      const reading = order.map((i) => `${words[i].text} ${percent(weights[i])}`).join(', ');
      p.query.setAttribute(
        'aria-valuetext',
        `${coordinate(query[0])} across, ${coordinate(query[1])} up. Small reads ${reading}`,
      );
      const angle = Math.round((Math.atan2(query[1], query[0]) * 180) / Math.PI + 360) % 360;
      p.query.setAttribute('aria-valuenow', String(angle));
      stage.wake();
    };
    const move = (next: Point) => {
      query = clampQuery(next);
      show();
    };

    const fromPointer = (event: PointerEvent) => {
      const box = p.keys.getBoundingClientRect();
      move(keyFigure(box.width, query).point([event.clientX - box.left, event.clientY - box.top]));
    };
    for (const target of [p.keys, p.query] as HTMLElement[]) {
      target.addEventListener(
        'pointerdown',
        (event) => {
          if (event.button !== 0) return;
          target.setPointerCapture(event.pointerId);
          fromPointer(event);
          if (target === p.query) event.preventDefault();
        },
        on,
      );
      target.addEventListener(
        'pointermove',
        (event) => {
          if (target.hasPointerCapture(event.pointerId)) fromPointer(event);
        },
        on,
      );
    }
    p.query.addEventListener(
      'keydown',
      (event) => {
        const step = event.shiftKey ? 5 * queryBox.step : queryBox.step;
        const moves: Record<string, Point> = {
          ArrowLeft: [-step, 0],
          ArrowRight: [step, 0],
          ArrowUp: [0, step],
          ArrowDown: [0, -step],
        };
        const by = moves[event.key];
        if (!by) return;
        event.preventDefault();
        move([query[0] + by[0], query[1] + by[1]]);
      },
      on,
    );
    p.query.setAttribute('aria-valuemin', '0');
    p.query.setAttribute('aria-valuemax', '359');
    show();

    return () => {
      const keys = stage.canvas(p.keys);
      drawKeys(keys, query, stage.tokens, stage.font(11));
      const [qx, qy] = keyFigure(keys.width, query).query;
      p.query.style.transform = `translate(${qx - 14}px, ${qy - 14}px)`;
      drawValues(stage.canvas(p.values), lookup(query).found, stage.tokens, stage.font(11));
    };
  },
});

const toneOf = (name: keyof Tokens) => `var(--${name})`;

export function Still() {
  const side = 400;
  const figure = keyFigure(side, queryBox.start);
  const { middle } = figure;
  const head = (from: Point, to: Point, size: number) => {
    const angle = Math.atan2(to[1] - from[1], to[0] - from[0]);
    const back = (turn: number) =>
      `${(to[0] - size * Math.cos(angle + turn)).toFixed(1)} ${(to[1] - size * Math.sin(angle + turn)).toFixed(1)}`;
    return `M${to[0].toFixed(1)} ${to[1].toFixed(1)}L${back(0.45)}L${back(-0.45)}Z`;
  };
  const shaft = (to: Point, size: number) => {
    const angle = Math.atan2(to[1] - middle[1], to[0] - middle[0]);
    return {
      x1: middle[0],
      y1: middle[1],
      x2: to[0] - size * Math.cos(angle),
      y2: to[1] - size * Math.sin(angle),
    };
  };
  const [qx, qy] = figure.query;
  const [lx, ly] = queryLabelAt(figure.query, queryBox.start);
  return (
    <svg
      className="demo-still"
      viewBox={`0 0 ${side} ${side}`}
      preserveAspectRatio="xMinYMin meet"
      aria-hidden="true"
    >
      <g style={{ fill: toneOf('rule') }}>
        <rect x={Math.round(middle[0])} y={pad} width={1} height={side - 2 * pad} />
        <rect x={pad} y={Math.round(middle[1])} width={side - 2 * pad} height={1} />
      </g>
      <g style={{ stroke: toneOf('body'), fill: toneOf('body') }} strokeWidth={1.5}>
        {figure.keys.map(({ text, tip }) => (
          <g key={text}>
            <line {...shaft(tip, 7)} />
            <path d={head(middle, tip, 7)} stroke="none" />
          </g>
        ))}
      </g>
      <g className="fill-faint" fontSize={11} textAnchor="middle" dominantBaseline="central">
        {figure.keys.map(({ text, tip, toward }) => {
          const [x, y] = labelAt(tip, toward);
          return (
            <text key={text} x={x} y={y}>
              {text}
            </text>
          );
        })}
        <text x={lx} y={ly}>
          small
        </text>
      </g>
      <g className="fill-ink stroke-ink" strokeWidth={2}>
        <line {...shaft(figure.query, 8)} />
        <path d={head(middle, figure.query, 8)} stroke="none" />
        <rect x={qx - 6} y={qy - 6} width={12} height={12} stroke="none" />
      </g>
    </svg>
  );
}
