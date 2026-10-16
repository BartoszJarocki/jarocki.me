export type Ride = { km: number; paid: number };

export type FareRule = { readonly fee: number; readonly price: number };

export const rides: readonly Ride[] = [
  { km: 0.3, paid: 6.25 },
  { km: 0.5, paid: 5.35 },
  { km: 0.8, paid: 6.6 },
  { km: 1.1, paid: 6.15 },
  { km: 1.4, paid: 8.2 },
  { km: 1.8, paid: 7.5 },
  { km: 2.1, paid: 7.85 },
  { km: 2.4, paid: 9.2 },
];

export const start: FareRule = { fee: 2, price: 2.5 };

export const fareBox = {
  fee: { min: 0, max: 10, step: 0.01 },
  price: { min: -2, max: 5, step: 0.01 },
} as const;

const minusSign = '−';

// toFixed prints a tiny negative as -0.00.
export const show = (value: number, digits = 2) =>
  (Math.abs(value) < 0.5 * 10 ** -digits ? 0 : value).toFixed(digits).replace('-', minusSign);

export function money(dollars: number, digits = 2) {
  const amount = show(dollars, digits);
  return amount.startsWith(minusSign) ? `${minusSign}$${amount.slice(1)}` : `$${amount}`;
}

export function factor(value: number) {
  const amount = show(value);
  return amount.startsWith(minusSign) ? `(${amount})` : amount;
}

export const predict = (rule: FareRule, km: number) => rule.fee + rule.price * km;

const mean = (f: (ride: Ride) => number) =>
  rides.reduce((sum, ride) => sum + f(ride), 0) / rides.length;

export const meanSquaredError = (rule: FareRule) =>
  mean((ride) => (predict(rule, ride.km) - ride.paid) ** 2);

export function leastSquares(): FareRule {
  const km = mean((ride) => ride.km);
  const paid = mean((ride) => ride.paid);
  const price =
    (mean((ride) => ride.km * ride.paid) - km * paid) / (mean((ride) => ride.km ** 2) - km ** 2);
  return { fee: paid - price * km, price };
}

const cents = (dollars: number) => Math.round(dollars * 100) / 100;

export const inCents = ({ fee, price }: FareRule): FareRule => ({
  fee: cents(fee),
  price: cents(price),
});

export const sameRule = (a: FareRule, b: FareRule) => a.fee === b.fee && a.price === b.price;

let rule = start;
const listeners = new Set<() => void>();

export const fareRule = {
  get: () => rule,
  set(next: FareRule) {
    const shown = inCents(next);
    if (sameRule(shown, rule)) return;
    rule = shown;
    for (const listener of listeners) listener();
  },
  subscribe(listener: () => void, signal: AbortSignal) {
    if (signal.aborted) return;
    listeners.add(listener);
    signal.addEventListener('abort', () => listeners.delete(listener), { once: true });
  },
};
