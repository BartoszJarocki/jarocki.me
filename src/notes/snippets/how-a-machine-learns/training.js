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

function measure(knobs, rides) {
  let loss = 0;
  let fee = 0;
  let price = 0;
  for (const [km, paid] of rides) {
    const guess = knobs.fee + knobs.price * km;
    const miss = guess - paid;
    const slope = 2 * miss;
    loss += (miss * miss) / rides.length;
    fee += slope / rides.length;
    price += (slope * km) / rides.length;
  }
  return { loss, fee, price };
}

function step(knobs, rides, rate) {
  const slopes = measure(knobs, rides);
  const fee = knobs.fee - rate * slopes.fee;
  const price = knobs.price - rate * slopes.price;
  return { fee, price };
}

let knobs = { fee: 2, price: 2.5 };
for (let i = 0; i <= 100; i++) {
  if (i % 25 === 0) {
    const loss = measure(knobs, rides).loss;
    console.log('Step', i, 'loss:', loss.toFixed(2));
  }
  knobs = step(knobs, rides, 0.1);
}
