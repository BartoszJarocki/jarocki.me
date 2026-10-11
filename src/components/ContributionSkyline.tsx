import { useEffect, useMemo, useRef, useState } from 'react';

import { activityStats } from '../lib/activityStats';
import { dayMonth } from '../lib/date';
import { Activity, weeklyTotals } from '../lib/githubActivity';
import type { SkylineHandle } from '../lib/skylineScene';
import { ContributionBars, ContributionBarsPlaceholder } from './ContributionBars';

type Phase = 'loading' | 'ready' | 'fallback';

const weekdays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const count = new Intl.NumberFormat('en-US');

function dayLabel(isoDate: string) {
  const weekday = weekdays[new Date(`${isoDate}T00:00:00Z`).getUTCDay()];
  return `${weekday} ${dayMonth(isoDate).toLowerCase()}`;
}

export function ContributionSkyline({ activity }: { activity: Activity }) {
  const { dates, contributions } = activity;
  const stats = useMemo(() => activityStats(activity), [activity]);
  const weeks = useMemo(() => weeklyTotals(dates, contributions), [dates, contributions]);
  const [phase, setPhase] = useState<Phase>('loading');
  const [selected, setSelected] = useState(0);
  const [day, setDay] = useState<number | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const scene = useRef<SkylineHandle | null>(null);
  const latestSelected = useRef(selected);

  useEffect(() => {
    const element = stage.current!;
    let unmounted = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        import('../lib/skylineScene')
          .then(({ mountSkyline }) => {
            if (unmounted) return;
            const heights = (stats[latestSelected.current] ?? stats[0]).heights;
            scene.current = mountSkyline(element, dates, heights, setDay);
            setPhase(scene.current ? 'ready' : 'fallback');
          })
          .catch(() => {
            if (!unmounted) setPhase('fallback');
          });
      },
      { rootMargin: '200px' },
    );
    observer.observe(element);
    return () => {
      unmounted = true;
      observer.disconnect();
      scene.current?.destroy();
      scene.current = null;
    };
  }, [dates, stats]);

  if (phase === 'fallback') return <ContributionBars weeks={weeks} />;

  function select(i: number) {
    latestSelected.current = i;
    setSelected(i);
    scene.current?.setHeights(stats[i].heights);
  }

  const stat = stats[selected] ?? stats[0];
  const total = contributions.reduce((sum, n) => sum + n, 0);
  const busiest = contributions.indexOf(Math.max(...contributions));
  const label = `GitHub contributions per day over the past year: ${count.format(total)} total, busiest day ${dayMonth(dates[busiest])} with ${count.format(contributions[busiest])}`;

  return (
    <>
      <div
        ref={stage}
        role="img"
        aria-label={label}
        tabIndex={0}
        className="skyline"
        data-phase={phase}
      >
        <ContributionBarsPlaceholder weeks={weeks} className="skyline-placeholder" />
      </div>
      <p className="mt-3 flex justify-between gap-[3ch] tabular-nums">
        <span className="min-w-0 truncate text-ink">
          {day === null ? (
            stat.total
          ) : (
            <>
              {dayLabel(dates[day])}
              {[stat, ...stats.filter((other) => other !== stat)].map((shown) => {
                const [value, unit] = shown.day(day);
                return (
                  <span key={shown.label} className={shown === stat ? undefined : 'skyline-more'}>
                    <span className="text-faint"> · </span>
                    {value} <span className="text-faint">{unit}</span>
                  </span>
                );
              })}
            </>
          )}
        </span>
        <span className="shrink-0 text-faint">{day === null && 'past year'}</span>
      </p>
      {stats.length > 1 && (
        <div
          role="group"
          aria-label="Graph stat"
          className="mt-[18px] flex flex-wrap gap-x-[2.5ch] gap-y-1 [@media(scripting:none)]:hidden"
        >
          {stats.map((option, i) => (
            <button
              key={option.label}
              type="button"
              aria-pressed={i === selected}
              onClick={() => select(i)}
              className="faint-link aria-pressed:text-ink aria-pressed:underline aria-pressed:decoration-1 aria-pressed:underline-offset-[5px]"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
