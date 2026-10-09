import { useEffect, useState } from 'react';

const wroclawTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Warsaw',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function readTime() {
  const parts = wroclawTime.formatToParts(new Date());
  const part = (type: 'hour' | 'minute') => parts.find((p) => p.type === type)?.value ?? '--';
  return { hours: part('hour'), minutes: part('minute') };
}

// The server renders --:-- and the time fills in after hydration, so the static HTML never disagrees with the browser.
export function Clock() {
  const [time, setTime] = useState({ hours: '--', minutes: '--' });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setTime(readTime());
      timer = setTimeout(tick, 60_000 - (Date.now() % 60_000));
    };
    tick();
    return () => clearTimeout(timer);
  }, []);

  return (
    <p className="mt-7 flex items-baseline gap-[1.5ch]">
      <span className="font-pixel text-[24px] leading-none text-ink">
        {time.hours}
        <span className="motion-safe:animate-blink">:</span>
        {time.minutes}
      </span>
      <span className="text-faint">in Wrocław</span>
    </p>
  );
}
