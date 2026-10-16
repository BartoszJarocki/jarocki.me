import { useSyncExternalStore } from 'react';

import { factor, fareRule, predict, show, start } from '../../lib/demos/taxiFares';

export type FareProps = { show: 'fee' | 'price'; factor?: boolean } | { km: string };

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
      {'km' in props
        ? show(predict(rule, Number(props.km)))
        : (props.factor ? factor : show)(rule[props.show])}
    </span>
  );
}
