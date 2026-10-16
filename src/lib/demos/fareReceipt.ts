import { type Value, add, backward, multiply, value } from '../ml/value.ts';
import type { Line } from './receiptLines.ts';
import { type FareRule, rides } from './taxiFares.ts';

export const ride = rides[0];
export const cent = 0.01;

export function receipt(rule: FareRule): Record<Line, Value> {
  const price = value(rule.price);
  const fee = value(rule.fee);
  const charge = multiply(price, ride.km);
  const fare = add(charge, fee);
  const miss = add(fare, -ride.paid);
  const loss = multiply(miss, miss);
  backward(loss);
  return { price, fee, ride: charge, fare, miss, loss };
}

export function nudge(rule: FareRule) {
  const price = rule.price + cent;
  const before = receipt(rule).loss.data;
  const after = receipt({ ...rule, price }).loss.data;
  const change = after - before;
  return { price, before, after, change, ratio: change / cent };
}
