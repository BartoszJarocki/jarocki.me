import type { ReactNode, RefCallback } from 'react';

import { type Line, lines } from '../../lib/demos/receiptLines';

export function ReceiptTable({
  row,
  span,
  printed,
}: {
  row?: (line: Line) => RefCallback<HTMLTableRowElement>;
  span?: (name: 'km' | 'paid') => RefCallback<HTMLSpanElement>;
  printed?: { km: string; paid: string; amount: (line: Line) => string };
}) {
  const ride = (name: 'km' | 'paid') => <span ref={span?.(name)}>{printed?.[name]}</span>;
  const words: Record<Line, { label: ReactNode; note?: string; className?: string }> = {
    price: { label: 'Price per km', className: 'demo-knob' },
    fee: { label: 'Starting fee', className: 'demo-knob' },
    ride: { label: <>{ride('km')} km × price per km</> },
    fare: { label: '+ starting fee', note: 'The guessed fare' },
    miss: { label: <>- what the rider paid, {ride('paid')}</>, note: 'The miss' },
    loss: { label: 'Miss × miss', note: "This ride's loss" },
  };
  const group = (part: readonly Line[]) => (
    <tbody>
      {part.map((line) => (
        <tr key={line} ref={row?.(line)} data-line={line} className={words[line].className}>
          <th scope="row">
            {words[line].label}
            {words[line].note && <small> {words[line].note}</small>}
          </th>
          <td>{printed?.amount(line)}</td>
          <td />
        </tr>
      ))}
    </tbody>
  );
  return (
    <table className={printed ? 'demo-receipt demo-still' : 'demo-receipt demo-receipt-live'}>
      <caption>
        One ride, the receipt at your current settings
        <span className="mt-2 block">
          Amounts, slopes, and nudge results are rounded for display. Calculations keep all digits,
          so using the printed numbers can give a slightly different answer.
        </span>
      </caption>
      <thead>
        <tr>
          <th scope="col">Line</th>
          <th scope="col">Amount</th>
          <th scope="col">Slope</th>
        </tr>
      </thead>
      {group(lines.slice(0, 2))}
      {group(lines.slice(2))}
    </table>
  );
}
