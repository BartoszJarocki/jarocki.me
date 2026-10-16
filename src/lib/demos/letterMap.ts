export type View = { yaw: number; pitch: number };
type Box = { readonly width: number; readonly height: number };
type Rect = { left: number; top: number; right: number; bottom: number };
type Segment = { x1: number; y1: number; x2: number; y2: number };

export type Label = { text: string; x: number; y: number; leader: Segment | null };
export type Spot = { turn: number; ring: number };
type Claim = Spot & { label: Label; rect: Rect };
type LeaderRule = 'crossesNothing' | 'missesLabels' | 'crossesAnything';
type Anchor = {
  key: string;
  text: string;
  x: number;
  y: number;
  around: number;
  beside: readonly number[];
  away: readonly number[];
};

export const restView: View = { yaw: -30, pitch: 20 };
export const side = 5;
const margin = 18;
const vowels = 'aeiou';
const deg = Math.PI / 180;

const letterWidth = 6.6;
const letterReach = 5;
const gap = 3;
const leaderLengths = [0, 8, 16, 26, 38, 52, 70, 90, 115];
const turnStep = 22.5 * deg;
const besideTurns = [0, 8, 2, 14, 6, 10, 4, 12, 1, 15, 7, 9, 3, 13, 5, 11];
const arrows = ['→', '↗', '↑', '↖', '←', '↙', '↓', '↘'];
const roomForNewSpot = 3;
const roomToMoveCloser = 6;

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

const grow = (rect: Rect, by: number): Rect => ({
  left: rect.left - by,
  top: rect.top - by,
  right: rect.right + by,
  bottom: rect.bottom + by,
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

function meets(a: Segment, b: Segment) {
  const turn = (s: Segment, x: number, y: number) =>
    (s.x2 - s.x1) * (y - s.y1) - (s.y2 - s.y1) * (x - s.x1);
  return (
    turn(a, b.x1, b.y1) * turn(a, b.x2, b.y2) < 0 && turn(b, a.x1, a.y1) * turn(b, a.x2, a.y2) < 0
  );
}

const textRect = (text: string, x: number, y: number): Rect => ({
  left: x,
  top: y - letterReach,
  right: x + text.length * letterWidth,
  bottom: y + letterReach,
});

function turnsAway(dx: number, dy: number) {
  const start = Math.round(Math.atan2(-dy, dx) / turnStep);
  return Array.from({ length: 16 }, (_, i) => {
    const step = Math.ceil(i / 2) * (i % 2 ? 1 : -1);
    return (((start + step) % 16) + 16) % 16;
  });
}

function placeLabels(
  anchors: readonly Anchor[],
  squares: readonly { key: string; rect: Rect }[],
  box: Box,
  previous: ReadonlyMap<string, Spot>,
) {
  const claims = new Map<string, Claim>();

  const claimAt = (anchor: Anchor, { turn, ring }: Spot, room: number, rule: LeaderRule) => {
    const ux = Math.cos(turn * turnStep);
    const uy = -Math.sin(turn * turnStep);
    const out = anchor.around + gap + leaderLengths[ring];
    const ax = anchor.x + ux * out;
    const ay = anchor.y + uy * out;
    const width = anchor.text.length * letterWidth;
    const x = ax - (width / 2) * (1 - Math.sign(Math.round(ux * 10)));
    const y = ay + letterReach * Math.sign(Math.round(uy * 10));
    const rect = textRect(anchor.text, x, y);
    if (rect.left < 0 || rect.top < 0 || rect.right > box.width || rect.bottom > box.height) {
      return null;
    }
    const roomy = grow(rect, room);
    const leader =
      ring === 0
        ? null
        : {
            x1: anchor.x + ux * (anchor.around + 1),
            y1: anchor.y + uy * (anchor.around + 1),
            x2: ax - ux * 2,
            y2: ay - uy * 2,
          };
    for (const square of squares) {
      if (square.key === anchor.key) {
        if (overlaps(rect, square.rect)) return null;
      } else if (
        overlaps(roomy, square.rect) ||
        (rule === 'crossesNothing' && leader && crosses(leader, square.rect))
      ) {
        return null;
      }
    }
    for (const [key, other] of claims) {
      if (key === anchor.key) continue;
      if (overlaps(roomy, other.rect)) return null;
      if (rule === 'crossesAnything') continue;
      if (other.label.leader && crosses(other.label.leader, roomy)) return null;
      if (leader && crosses(leader, other.rect)) return null;
      if (
        rule === 'crossesNothing' &&
        leader &&
        other.label.leader &&
        meets(leader, other.label.leader)
      ) {
        return null;
      }
    }
    return { turn, ring, rect, label: { text: anchor.text, x, y, leader } };
  };

  const search = (
    anchor: Anchor,
    rings: number,
    first: Spot | undefined,
    tries: readonly (readonly [room: number, rule: LeaderRule])[],
  ) => {
    for (const [room, rule] of tries) {
      for (let ring = 0; ring < rings; ring++) {
        const turns = ring === 0 ? anchor.beside : anchor.away;
        for (const turn of first ? [first.turn, ...turns.filter((t) => t !== first.turn)] : turns) {
          const claim = claimAt(anchor, { turn, ring }, room, rule);
          if (claim) return claim;
        }
      }
    }
    return null;
  };

  const keepLastSpots = () => {
    for (const anchor of anchors) {
      const last = previous.get(anchor.key);
      const claim = last && claimAt(anchor, last, 0, 'missesLabels');
      if (claim) claims.set(anchor.key, claim);
    }
  };

  const moveCloser = () => {
    const withLeaders = anchors
      .filter((anchor) => claims.get(anchor.key)!.ring > 0)
      .sort((a, b) => claims.get(b.key)!.ring - claims.get(a.key)!.ring);
    for (const anchor of withLeaders) {
      const now = claims.get(anchor.key)!;
      claims.delete(anchor.key);
      const closer = search(anchor, now.ring, now, [[roomToMoveCloser, 'crossesNothing']]);
      claims.set(anchor.key, closer ?? now);
    }
  };

  keepLastSpots();
  let tangled = 0;
  for (const anchor of anchors) {
    if (claims.has(anchor.key)) continue;
    const first = previous.get(anchor.key);
    const claim = search(anchor, leaderLengths.length, first, [
      [roomForNewSpot, 'crossesNothing'],
      [roomForNewSpot, 'missesLabels'],
      [0, 'missesLabels'],
    ]);
    if (claim) {
      claims.set(anchor.key, claim);
      continue;
    }
    tangled++;
    const x = anchor.x + anchor.around + gap;
    claims.set(
      anchor.key,
      search(anchor, leaderLengths.length, first, [[0, 'crossesAnything']]) ?? {
        turn: 0,
        ring: 0,
        label: { text: anchor.text, x, y: anchor.y, leader: null },
        rect: textRect(anchor.text, x, anchor.y),
      },
    );
  }
  moveCloser();
  return { claims, tangled };
}

const squareBox = ({ x, y }: { x: number; y: number }): Rect => ({
  left: x - side / 2 - 1,
  top: y - side / 2 - 1,
  right: x + side / 2 + 1,
  bottom: y + side / 2 + 1,
});

export type MapFigure = ReturnType<typeof mapFigure>;

export function mapFigure(
  places: ArrayLike<number>,
  symbols: string,
  view: View,
  box: Box,
  reach: number,
  previous: ReadonlyMap<string, Spot> = new Map(),
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

  const middle = {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
  };
  const crowd = (point: { x: number; y: number }) =>
    points.filter((other) => Math.hypot(other.x - point.x, other.y - point.y) < 16).length;
  const letters = [...points].sort(
    (m, n) =>
      Number(n.vowel) - Number(m.vowel) ||
      Number(n.beyond) - Number(m.beyond) ||
      crowd(n) - crowd(m) ||
      symbols.indexOf(m.symbol) - symbols.indexOf(n.symbol),
  );
  const anchors: Anchor[] = [
    ...axes.map((axis) => {
      const away = turnsAway(axis.x2 - center.x, axis.y2 - center.y);
      return {
        key: `axis ${axis.text}`,
        text: axis.text,
        x: axis.x2,
        y: axis.y2,
        around: 4,
        beside: away,
        away,
      };
    }),
    ...letters.map((point) => ({
      key: point.symbol,
      text: point.text,
      x: point.x,
      y: point.y,
      around: side / 2,
      beside: besideTurns,
      away: turnsAway(point.x - middle.x, point.y - middle.y),
    })),
  ];
  const squares = points.map((point) => ({ key: point.symbol, rect: squareBox(point) }));
  let { claims, tangled } = placeLabels(anchors, squares, box, previous);
  if (tangled > 0 && previous.size > 0) {
    const fresh = placeLabels(anchors, squares, box, new Map());
    if (fresh.tangled < tangled) claims = fresh.claims;
  }
  return {
    points: points.map((point) => ({ ...point, label: claims.get(point.symbol)!.label })),
    axes: axes.map((axis) => ({ ...axis, label: claims.get(`axis ${axis.text}`)!.label })),
    spots: new Map([...claims].map(([key, { turn, ring }]) => [key, { turn, ring }])),
  };
}
