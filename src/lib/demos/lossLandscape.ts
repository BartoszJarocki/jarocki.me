import { type FareRule, fareBox, meanSquaredError, predict, rides } from './taxiFares.ts';

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

// The loss curves by 2 * [[1, mean km], [mean km, mean km²]]. A step above 2 over its larger
// eigenvalue overshoots along that direction by more than it gains, so the loss grows.
export const rateLimit = (() => {
  const km = rides.reduce((sum, ride) => sum + ride.km, 0) / rides.length;
  const km2 = rides.reduce((sum, ride) => sum + ride.km ** 2, 0) / rides.length;
  const trace = 2 + 2 * km2;
  const det = 4 * (km2 - km ** 2);
  return 4 / (trace + Math.sqrt(trace ** 2 - 4 * det));
})();

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
