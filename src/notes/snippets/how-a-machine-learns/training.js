const rides = [
  [0.3, 6.25],
  [0.5, 5.35],
  [0.8, 6.6],
  [1.1, 6.15],
  [1.4, 8.2],
  [1.8, 7.5],
  [2.1, 7.85],
  [2.4, 9.2],
];
function measure(rule, rides) {
  let loss = 0,
    fee = 0,
    price = 0;
  for (const [km, paid] of rides) {
    const miss = rule.fee + rule.price * km - paid;
    loss += (miss * miss) / rides.length;
    fee += (2 * miss) / rides.length;
    price += (2 * miss * km) / rides.length;
  }
  return { loss, fee, price };
}
function step(rule, rides, rate) {
  const slopes = measure(rule, rides);
  return { fee: rule.fee - rate * slopes.fee, price: rule.price - rate * slopes.price };
}
let rule = { fee: 2, price: 2.5 };
for (let turn = 0; turn <= 100; turn++) {
  if (turn % 25 === 0) console.log('Step', turn, 'loss:', measure(rule, rides).loss.toFixed(4));
  rule = step(rule, rides, 0.1);
}
