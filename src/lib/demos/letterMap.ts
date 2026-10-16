export type View = { yaw: number; pitch: number };
type Box = { readonly width: number; readonly height: number };
type Rect = { left: number; top: number; right: number; bottom: number };
type Segment = { x1: number; y1: number; x2: number; y2: number };
export type Label = { text: string; x: number; y: number };

export const restView: View = { yaw: -30, pitch: 20 };
export const side = 5;
const margin = 18;
const vowels = 'aeiou';
const deg = Math.PI / 180;
const arrows = ['→', '↗', '↑', '↖', '←', '↙', '↓', '↘'];
export const labelFontSize = 11;
const letterWidth = labelFontSize * 0.6;
const letterReach = labelFontSize / 2;

export function fitReach(places: ArrayLike<number>) {
  const radii: number[] = [];
  for (let i = 0; i < places.length; i += 3) {
    radii.push(Math.hypot(places[i], places[i + 1], places[i + 2]));
  }
  radii.sort((a, b) => a - b);
  const median = radii[radii.length >> 1];
  return Math.max(1, Math.min(1.15 * radii[radii.length - 1], 3 * median));
}

const overlaps = (a: Rect, b: Rect) =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

export const labelRect = ({ text, x, y }: Label): Rect => ({
  left: x,
  right: x + text.length * letterWidth,
  top: y - letterReach,
  bottom: y + letterReach,
});

function crosses({ x1, y1, x2, y2 }: Segment, rect: Rect) {
  let from = 0;
  let to = 1;
  const dx = x2 - x1;
  const dy = y2 - y1;
  for (const [p, q] of [
    [-dx, x1 - rect.left],
    [dx, rect.right - x1],
    [-dy, y1 - rect.top],
    [dy, rect.bottom - y1],
  ]) {
    if (p === 0) {
      if (q < 0) return false;
    } else if (p < 0) from = Math.max(from, q / p);
    else to = Math.min(to, q / p);
  }
  return from < to;
}

export type MapFigure = ReturnType<typeof mapFigure>;

export function mapFigure(
  places: ArrayLike<number>,
  symbols: string,
  view: View,
  box: Box,
  reach: number,
) {
  const cosYaw = Math.cos(view.yaw * deg);
  const sinYaw = Math.sin(view.yaw * deg);
  const cosPitch = Math.cos(view.pitch * deg);
  const sinPitch = Math.sin(view.pitch * deg);
  const scale = (Math.min(box.width, box.height) / 2 - margin) / reach;
  const place = (a: number, b: number, c: number) => {
    const across = a * cosYaw + c * sinYaw;
    const toward = c * cosYaw - a * sinYaw;
    return {
      x: box.width / 2 + across * scale,
      y: box.height / 2 - (b * cosPitch - toward * sinPitch) * scale,
      depth: 0.5 + (b * sinPitch + toward * cosPitch) / (2 * reach),
    };
  };
  const center = place(0, 0, 0);
  const points = Array.from(symbols, (symbol, i) => {
    const [a, b, c] = [places[i * 3], places[i * 3 + 1], places[i * 3 + 2]];
    const beyond = Math.hypot(a, b, c) > reach;
    const pull = beyond ? reach / Math.hypot(a, b, c) : 1;
    const point = place(a * pull, b * pull, c * pull);
    const turn = Math.atan2(center.y - point.y, point.x - center.x);
    return {
      ...point,
      symbol,
      text: beyond ? symbol + arrows[(Math.round(turn / (45 * deg)) + 8) % 8] : symbol,
      vowel: vowels.includes(symbol),
      beyond,
    };
  }).sort((m, n) => m.depth - n.depth);

  const axes = [
    [reach, 0, 0],
    [0, reach, 0],
    [0, 0, reach],
  ].map(([a, b, c], i) => {
    const tip = place(a, b, c);
    const tail = place(-a, -b, -c);
    return { x1: tail.x, y1: tail.y, x2: tip.x, y2: tip.y, text: String(i + 1) };
  });

  const occupied: Rect[] = points.map(({ x, y }) => ({
    left: x - side / 2 - 1,
    right: x + side / 2 + 1,
    top: y - side / 2 - 1,
    bottom: y + side / 2 + 1,
  }));
  const labelledAxes = axes.map((axis) => {
    let label: Label | null = null;
    for (let turn = 0; turn < 16; turn++) {
      const angle = (turn * Math.PI) / 8;
      const candidate = {
        text: axis.text,
        x: axis.x2 + 12 * Math.cos(angle) - letterWidth / 2,
        y: axis.y2 + 12 * Math.sin(angle),
      };
      const rect = labelRect(candidate);
      if (rect.left < 0 || rect.top < margin || rect.right > box.width || rect.bottom > box.height)
        continue;
      if (
        axes.some((line) => crosses(line, rect)) ||
        occupied.some((other) => overlaps(rect, other))
      )
        continue;
      label = candidate;
      occupied.push(rect);
      break;
    }
    return { ...axis, label };
  });
  return { points, axes: labelledAxes };
}

export function followLabel(text: string): Label {
  return { text: `following ${text}`, x: 12, y: 8 };
}
