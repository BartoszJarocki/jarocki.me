import { type FareRule, leastSquares, meanSquaredError, predict, rides } from './taxiFares.ts';

const flatSlope = 0.01;

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

function symmetricEigen(a: number, b: number, d: number) {
  const middle = (a + d) / 2;
  const spread = Math.hypot((a - d) / 2, b);
  return {
    large: middle + spread,
    small: middle - spread,
    largeAngle: Math.atan2(spread + middle - a, b),
  };
}

const km = rides.reduce((sum, ride) => sum + ride.km, 0) / rides.length;
const km2 = rides.reduce((sum, ride) => sum + ride.km ** 2, 0) / rides.length;
const curvature = symmetricEigen(1, km, km2);

export const valley = {
  bottom: leastSquares(),
  floor: meanSquaredError(leastSquares()),
  steep: curvature.large,
  shallow: curvature.small,
  /** The steep axis's angle from the fee axis, in radians. */
  angle: curvature.largeAngle,
};

/** The contour where the loss equals `loss`, as its half widths across and along the valley. */
export const contour = (loss: number) => ({
  across: Math.sqrt((loss - valley.floor) / valley.steep),
  along: Math.sqrt((loss - valley.floor) / valley.shallow),
});

export const rateLimit = 1 / valley.steep;

/**
 * The settings the valley draws. Past a fee of about $7.70 the valley floor runs below $0 a km, so the
 * prices go down to -$2. A step at crawl or good from any spot on this map lands on it again.
 */
export const mapBox = {
  fee: { min: 0, max: 10 },
  price: { min: -2, max: 5 },
} as const;

const squeeze = (loss: number) => Math.log1p(loss / 0.6);
const peak = Math.max(
  ...[mapBox.fee.min, mapBox.fee.max].flatMap((fee) =>
    [mapBox.price.min, mapBox.price.max].map((price) => squeeze(meanSquaredError({ fee, price }))),
  ),
);

/** The loss squeezed to 0 for a perfect fit and 1 at the map's highest corner, so the valley fits. */
export const lift = (rule: FareRule) => squeeze(meanSquaredError(rule)) / peak;

export const lossAtLift = (t: number) => 0.6 * Math.expm1(t * peak);

export const isFlat = (rule: FareRule) => {
  const slope = gradient(rule);
  return Math.hypot(slope.fee, slope.price) < flatSlope;
};

export const onMap = ({ fee, price }: FareRule) =>
  fee >= mapBox.fee.min &&
  fee <= mapBox.fee.max &&
  price >= mapBox.price.min &&
  price <= mapBox.price.max;

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

export const rounded = (rule: FareRule) => ({
  fee: rule.fee.toFixed(2),
  price: rule.price.toFixed(2),
});

export function fareFromRounded(rule: FareRule, km: number) {
  const { fee, price } = rounded(rule);
  return (Number(fee) + km * Number(price)).toFixed(2);
}
