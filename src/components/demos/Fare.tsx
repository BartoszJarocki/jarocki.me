import { useSyncExternalStore } from 'react';

import { fareFromRounded, rounded } from '../../lib/demos/lossLandscape';
import { fareRule, start } from '../../lib/demos/taxiFares';

export type FareProps = { show: 'fee' | 'price' } | { km: string };

const subscribe = (listener: () => void) => {
  const done = new AbortController();
  fareRule.subscribe(listener, done.signal);
  return () => done.abort();
};

// The server renders the starting settings, so hydration starts there even if a slider moved first.
const served = () => start;

export default function Fare(props: FareProps) {
  const rule = useSyncExternalStore(subscribe, fareRule.get, served);
  return (
    <span>
      {'km' in props ? fareFromRounded(rule, Number(props.km)) : rounded(rule)[props.show]}
    </span>
  );
}
