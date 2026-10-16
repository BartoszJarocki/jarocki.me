import type { HeadWeights } from '../ml/heads';
import { headsStill } from './headsStill';
import { letterPicker } from './letterPicker';
import { readerHeads } from './readerHeads';
import { letterName, readingOf, sentenceHeads, shown, text } from './sentenceHeads';
import { type Rgb, css, defineScene } from './stage';

const n = text.length;
const blocks = 2;
const heads = 4;

/** Where the strips, the letters, and the arcs sit. One strip per head, in reading order. */
export function headsFigure(width: number, compact: boolean) {
  const pitch = width / n;
  const strip = { gap: 6, label: 14, arcs: compact ? 20 : 28, letters: 14 };
  const tall = strip.gap + strip.label + strip.arcs + strip.letters;
  const x = (i: number) => (i + 0.5) * pitch;
  return {
    pitch,
    height: blocks * heads * tall,
    strips: Array.from({ length: blocks * heads }, (_, i) => {
      const top = i * tall + strip.gap;
      return {
        label: `block ${Math.floor(i / heads) + 1}, head ${(i % heads) + 1}`,
        labelY: top + strip.label / 2,
        base: top + strip.label + strip.arcs - 1,
        lettersY: top + strip.label + strip.arcs + strip.letters / 2,
      };
    }),
    /** The arc from letter t back to letter s, as a quadratic curve above the letters. */
    arc(t: number, s: number, base: number) {
      const peak = Math.min(strip.arcs - 3, 3 + (t - s) * pitch * 0.3);
      return { from: x(t), to: x(s), control: (x(t) + x(s)) / 2, top: base - 2 * peak };
    },
    x,
  };
}

const mix = (from: Rgb, to: Rgb, t: number): Rgb => [
  from[0] + (to[0] - from[0]) * t,
  from[1] + (to[1] - from[1]) * t,
  from[2] + (to[2] - from[2]) * t,
];

const percent = (weight: number) => `${(weight * 100).toFixed(1)}%`;

function mostRead(found: HeadWeights, block: number, head: number, t: number) {
  const row = readingOf(found, block, head, t);
  const s = row.indexOf(Math.max(...row));
  return `${letterName(s)}, ${percent(row[s])}`;
}

export function headsScene(reader = false) {
  return defineScene({
    parts: {
      arcs: 'canvas',
      letters: 'div',
      table: 'tbody',
      letter: 'span',
    },
    async mount(stage, p) {
      let found: HeadWeights;
      let selected = n - 1;

      const describe = () => {
        p.letter.textContent = letterName(selected);
        p.table.replaceChildren(
          ...Array.from({ length: blocks * heads }, (_, i) => {
            const row = document.createElement('tr');
            row.insertCell().textContent = `Block ${Math.floor(i / heads) + 1}, head ${(i % heads) + 1}`;
            row.insertCell().textContent = mostRead(
              found,
              Math.floor(i / heads),
              i % heads,
              selected,
            );
            return row;
          }),
        );
      };
      if (reader) {
        await readerHeads(stage, (next, step) => {
          found = next;
          p.arcs.dataset.step = String(step);
          p.arcs.dataset.weights = Array.from(next.weights).join(',');
          describe();
          stage.wake();
        });
      } else {
        found = await sentenceHeads();
      }
      const items = letterPicker(p.letters, {
        count: n,
        picked: selected,
        keys: ['ArrowLeft', 'ArrowRight'],
        signal: stage.signal,
        pick(t) {
          selected = t;
          describe();
          stage.wake();
        },
      });
      items.forEach((item, t) => item.setAttribute('aria-label', letterName(t)));
      describe();

      let placedFor = 0;
      return () => {
        const ctx = stage.canvas(p.arcs);
        const figure = headsFigure(ctx.width, ctx.width < 479);
        if (placedFor !== ctx.width) {
          placedFor = ctx.width;
          items.forEach((item, i) =>
            Object.assign(item.style, {
              top: '0px',
              height: `${ctx.height}px`,
              left: `${i * figure.pitch}px`,
              width: `${figure.pitch}px`,
            }),
          );
        }
        const { bg, ink, faint } = stage.tokens;
        ctx.fillStyle = css(bg);
        ctx.fillRect(0, 0, ctx.width, ctx.height);
        ctx.font = stage.font(11);
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 1.5;
        figure.strips.forEach((strip, i) => {
          ctx.textAlign = 'left';
          ctx.fillStyle = css(faint);
          ctx.fillText(strip.label, 0, strip.labelY);
          ctx.textAlign = 'center';
          for (let l = 0; l < n; l++) {
            ctx.fillStyle = css(l === selected ? ink : faint);
            ctx.fillText(shown(text[l]), figure.x(l), strip.lettersY);
          }
          const row = readingOf(found, Math.floor(i / heads), i % heads, selected);
          const order = Array.from(row.keys()).sort((a, b) => row[a] - row[b]);
          for (const s of order) {
            if (row[s] < 0.02) continue;
            ctx.strokeStyle = css(mix(bg, ink, row[s]));
            ctx.beginPath();
            if (s === selected) {
              ctx.arc(figure.x(s), strip.base - 4, 3.5, 0, 2 * Math.PI);
            } else {
              const arc = figure.arc(selected, s, strip.base);
              ctx.moveTo(arc.from, strip.base);
              ctx.quadraticCurveTo(arc.control, arc.top, arc.to, strip.base);
            }
            ctx.stroke();
          }
        });
      };
    },
  });
}

export default headsScene();

export function Still() {
  return (
    <>
      <HeadsSvg width={672} compact={false} className="[@container(max-width:478px)]:hidden" />
      <HeadsSvg width={320} compact className="hidden [@container(max-width:478px)]:block" />
    </>
  );
}

function HeadsSvg({
  width,
  compact,
  className,
}: {
  width: number;
  compact: boolean;
  className: string;
}) {
  const figure = headsFigure(width, compact);
  const last = n - 1;
  const letterXs = Array.from({ length: last }, (_, l) => figure.x(l).toFixed(1)).join(' ');
  return (
    <svg
      className={`demo-still ${className}`}
      viewBox={`0 0 ${width} ${figure.height}`}
      preserveAspectRatio="xMinYMin meet"
      aria-hidden="true"
    >
      {figure.strips.map((strip, i) => (
        <g key={strip.label}>
          <text
            className="fill-faint"
            fontSize={11}
            x={0}
            y={strip.labelY}
            dominantBaseline="central"
          >
            {strip.label}
          </text>
          <g fontSize={11} textAnchor="middle" dominantBaseline="central">
            <text className="fill-faint" x={letterXs} y={strip.lettersY}>
              {Array.from(text.slice(0, last), shown).join('')}
            </text>
            <text className="fill-ink" x={figure.x(last)} y={strip.lettersY}>
              {shown(text[last])}
            </text>
          </g>
          <g fill="none" strokeWidth={1.5}>
            {headsStill.arcs[i].map((thousandths, s) => {
              if (thousandths < 20) return null;
              const tone = {
                stroke: `color-mix(in srgb, var(--ink) ${thousandths / 10}%, var(--bg))`,
              };
              if (s === last) {
                return <circle key={s} style={tone} cx={figure.x(s)} cy={strip.base - 4} r={3.5} />;
              }
              const arc = figure.arc(last, s, strip.base);
              return (
                <path
                  key={s}
                  style={tone}
                  d={`M${arc.from.toFixed(1)} ${strip.base}Q${arc.control.toFixed(1)} ${arc.top.toFixed(1)} ${arc.to.toFixed(1)} ${strip.base}`}
                />
              );
            })}
          </g>
        </g>
      ))}
    </svg>
  );
}
