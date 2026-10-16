import { Value } from '../ml/value.ts';
import type { Line } from './receiptLines.ts';
import { type FareRule, rides } from './taxiFares.ts';

export const ride = rides[0];
export const cent = 0.01;

export function receipt(rule: FareRule): Record<Line, Value> {
  const price = new Value(rule.price);
  const fee = new Value(rule.fee);
  const charge = price.mul(ride.km);
  const fare = charge.add(fee);
  const miss = fare.add(-ride.paid);
  const loss = miss.mul(miss);
  loss.backward();
  return { price, fee, ride: charge, fare, miss, loss };
}

export function nudge(rule: FareRule) {
  const price = rule.price + cent;
  const before = receipt(rule).loss.data;
  const after = receipt({ ...rule, price }).loss.data;
  const change = after - before;
  return { price, before, after, change, ratio: change / cent };
}
