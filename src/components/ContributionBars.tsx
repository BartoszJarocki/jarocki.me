import { CSSProperties, useState } from 'react';

import type { Activity, ContributionWeek } from '../lib/githubActivity';

const ROWS = 12;
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const count = new Intl.NumberFormat('en-US');

function dayMonth(isoDate: string) {
  const [, month, day] = isoDate.split('-');
  return `${Number(day)} ${months[Number(month) - 1]}`;
}

export function ContributionBars({ activity }: { activity: Activity }) {
  const [hovered, setHovered] = useState<ContributionWeek | null>(null);
  const peak = activity.weeks.reduce((a, b) => (b.total > a.total ? b : a));
  const label = `GitHub contributions per week over the past year: ${count.format(activity.total)} total, peak ${count.format(peak.total)} in the week of ${dayMonth(peak.start)}`;

  return (
    <div
      className="contributions"
      style={{ '--weeks': activity.weeks.length, '--rows': ROWS } as CSSProperties}
    >
      <div
        role="img"
        aria-label={label}
        className="contribution-bars"
        onMouseLeave={() => setHovered(null)}
      >
        {activity.weeks.map((week) => (
          <span
            key={week.start}
            aria-hidden="true"
            className={week.total ? undefined : 'empty'}
            style={
              {
                '--h': week.total ? Math.max(1, Math.round((week.total / peak.total) * ROWS)) : 1,
              } as CSSProperties
            }
            onMouseEnter={() => setHovered(week)}
          />
        ))}
      </div>
      <p className="contribution-caption mt-2 flex justify-between gap-[3ch]">
        <span className="text-ink">
          {hovered
            ? `week of ${dayMonth(hovered.start).toLowerCase()} · ${count.format(hovered.total)}`
            : `${count.format(activity.total)} contributions`}
        </span>
        <span className="text-faint">past year</span>
      </p>
    </div>
  );
}
