import clsx from 'clsx';
import { CSSProperties, ComponentPropsWithoutRef, useState } from 'react';

import { dayMonth } from '../lib/date';
import type { WeekTotal } from '../lib/githubActivity';

const ROWS = 12;
const count = new Intl.NumberFormat('en-US');

const gridStyle = (weeks: WeekTotal[]) =>
  ({ '--weeks': weeks.length, '--rows': ROWS }) as CSSProperties;

type BarsProps = ComponentPropsWithoutRef<'div'> & {
  weeks: WeekTotal[];
  onHover?: (week: WeekTotal | null) => void;
};

function Bars({ weeks, onHover, ...props }: BarsProps) {
  const peak = Math.max(...weeks.map((week) => week.total));
  return (
    <div className="contribution-bars" onMouseLeave={() => onHover?.(null)} {...props}>
      {weeks.map((week) => (
        <span
          key={week.start}
          aria-hidden="true"
          className={week.total ? undefined : 'empty'}
          style={
            {
              '--h': week.total ? Math.max(1, Math.round((week.total / peak) * ROWS)) : 1,
            } as CSSProperties
          }
          onMouseEnter={() => onHover?.(week)}
        />
      ))}
    </div>
  );
}

export function ContributionBars({ weeks }: { weeks: WeekTotal[] }) {
  const [hovered, setHovered] = useState<WeekTotal | null>(null);
  const total = weeks.reduce((sum, week) => sum + week.total, 0);
  const peak = weeks.reduce((a, b) => (b.total > a.total ? b : a));
  const label = `GitHub contributions per week over the past year: ${count.format(total)} total, peak ${count.format(peak.total)} in the week of ${dayMonth(peak.start)}`;

  return (
    <div className="contributions" style={gridStyle(weeks)}>
      <Bars weeks={weeks} onHover={setHovered} role="img" aria-label={label} />
      <p className="contribution-caption mt-2 flex justify-between gap-[3ch]">
        <span className="text-ink">
          {hovered
            ? `week of ${dayMonth(hovered.start).toLowerCase()} · ${count.format(hovered.total)}`
            : `${count.format(total)} contributions`}
        </span>
        <span className="text-faint">past year</span>
      </p>
    </div>
  );
}

export function ContributionBarsPlaceholder({
  weeks,
  className,
}: {
  weeks: WeekTotal[];
  className: string;
}) {
  return (
    <div aria-hidden="true" className={clsx('contributions', className)} style={gridStyle(weeks)}>
      <Bars weeks={weeks} />
    </div>
  );
}
