export type Ride = { km: number; paid: number };

// The model's two knobs: the starting fee is the bias and the price per km is the weight.
export type FareRule = { fee: number; price: number };

// Made up: a fee near 5 and a price near 1.5 per km, plus traffic, so no line touches every ride.
// Short rides keep the loss valley wide enough to walk down in tens of steps.
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
