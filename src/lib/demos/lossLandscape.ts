import {
  type FareRule,
  fareBox,
  leastSquares,
  meanSquaredError,
  predict,
  rides,
} from './taxiFares.ts';

/** A walk stops where the two knobs' slopes together are under this. */
export const flat = 0.01;

export const rates = { crawl: 0.03, good: 0.2, zigzag: 0.325, tooBig: 0.38 } as const;
export type Rate = keyof typeof rates;

export function gradient(rule: FareRule): FareRule {
  let fee = 0;
  let price = 0;
  for (const ride of rides) {
    const miss = predict(rule, ride.km) - ride.paid;
    fee += 2 * miss;
    price += 2 * miss * ride.km;
  }
  return { fee: fee / rides.length, price: price / rides.length };
}

export function descend(rule: FareRule, rate: number): FareRule {
  const slope = gradient(rule);
  return { fee: rule.fee - rate * slope.fee, price: rule.price - rate * slope.price };
}

const km = rides.reduce((sum, ride) => sum + ride.km, 0) / rides.length;
const km2 = rides.reduce((sum, ride) => sum + ride.km ** 2, 0) / rides.length;
const spread = Math.hypot(1 - km2, 2 * km);

// Away from the bottom by d = (fee, price), the loss grows by d · [[1, km], [km, km²]] · d, with
// km and km² as means over the rides. So every contour is an ellipse around the bottom, its axes
// along that matrix's two eigenvectors, and steep and shallow are the eigenvalues.
export const valley = {
  bottom: leastSquares(),
  floor: meanSquaredError(leastSquares()),
  steep: (1 + km2 + spread) / 2,
  shallow: (1 + km2 - spread) / 2,
  /** The steep axis's angle from the fee axis, in radians. */
  angle: Math.atan2((1 + km2 + spread) / 2 - 1, km),
};

/** The contour where the loss equals `loss`, as its half widths across and along the valley. */
export const contour = (loss: number) => ({
  across: Math.sqrt((loss - valley.floor) / valley.steep),
  along: Math.sqrt((loss - valley.floor) / valley.shallow),
});

// A step moves the loss along the steep axis by a factor of 1 - 2 * rate * steep each time, so
// above 1 / steep that factor is under -1 and the overshoot grows.
export const rateLimit = 1 / valley.steep;

const squeeze = (loss: number) => Math.log1p(loss / 0.6);
const peak = Math.max(
  ...[fareBox.fee.min, fareBox.fee.max].flatMap((fee) =>
    [fareBox.price.min, fareBox.price.max].map((price) =>
      squeeze(meanSquaredError({ fee, price })),
    ),
  ),
);

/** The loss squeezed to 0 for a perfect fit and 1 at the map's highest corner, so the valley fits. */
export const lift = (rule: FareRule) => squeeze(meanSquaredError(rule)) / peak;

/** The loss whose lift is `t`. */
export const lossAtLift = (t: number) => 0.6 * Math.expm1(t * peak);

export const isFlat = (rule: FareRule) => {
  const slope = gradient(rule);
  return Math.hypot(slope.fee, slope.price) < flat;
};

export const onMap = ({ fee, price }: FareRule) =>
  fee >= fareBox.fee.min &&
  fee <= fareBox.fee.max &&
  price >= fareBox.price.min &&
  price <= fareBox.price.max;

/** `up` and `down` say what the last step did to the loss. `off` means the next step leaves the map. */
export type Walk = {
  readonly at: FareRule;
  readonly steps: number;
  readonly status: 'ready' | 'down' | 'up' | 'flat' | 'off';
};

export const walkFrom = (at: FareRule): Walk => ({
  at,
  steps: 0,
  status: isFlat(at) ? 'flat' : 'ready',
});

export const ended = (walk: Walk) => walk.status === 'flat' || walk.status === 'off';

export function step(walk: Walk, rate: number): Walk {
  if (ended(walk)) return walk;
  const at = descend(walk.at, rate);
  if (!onMap(at)) return { ...walk, status: 'off' };
  const status = isFlat(at)
    ? 'flat'
    : meanSquaredError(at) > meanSquaredError(walk.at)
      ? 'up'
      : 'down';
  return { at, steps: walk.steps + 1, status };
}

export function walkToEnd(walk: Walk, rate: number) {
  while (!ended(walk)) walk = step(walk, rate);
  return walk;
}
