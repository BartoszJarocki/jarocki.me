import type { Activity } from './githubActivity';

export const LEVELS = 12;

const count = new Intl.NumberFormat('en-US');
const compact = (n: number) =>
  n >= 1e6
    ? `${(n / 1e6).toFixed(2).replace(/0$/, '')}M`
    : n >= 1e4
      ? `${Math.round(n / 1e3)}k`
      : count.format(n);
const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

const linear = (value: number, peak: number) => value / peak;
const log = (value: number, peak: number) => Math.log1p(value) / Math.log1p(peak);

type StatSpec = {
  label: string;
  total: (n: number) => string;
  day: (n: number) => [value: string, unit: string];
  scale: (value: number, peak: number) => number;
  values: (activity: Activity) => number[] | undefined;
};

const specs: StatSpec[] = [
  {
    label: 'contributions',
    total: (n) => `${count.format(n)} ${plural(n, 'contribution', 'contributions')}`,
    day: (n) => [count.format(n), plural(n, 'contribution', 'contributions')],
    scale: linear,
    values: (activity) => activity.contributions,
  },
  {
    label: 'prs merged',
    total: (n) => `${count.format(n)} ${plural(n, 'pr merged', 'prs merged')}`,
    day: (n) => [count.format(n), 'merged'],
    scale: linear,
    values: (activity) => activity.pullRequests?.merged,
  },
  {
    label: 'lines added',
    total: (n) => `${compact(n)} ${plural(n, 'line added', 'lines added')}`,
    day: (n) => [`+${count.format(n)}`, plural(n, 'line', 'lines')],
    scale: log,
    values: (activity) => activity.pullRequests?.additions,
  },
];

export type Stat = {
  label: string;
  total: string;
  day: (i: number) => [value: string, unit: string];
  heights: number[];
};

export function activityStats(activity: Activity): Stat[] {
  return specs.flatMap((spec) => {
    const values = spec.values(activity);
    if (!values) return [];
    const peak = Math.max(...values);
    return {
      label: spec.label,
      total: spec.total(values.reduce((sum, value) => sum + value, 0)),
      day: (i: number) => spec.day(values[i]),
      heights: values.map((value) =>
        value ? Math.max(1, Math.round(spec.scale(value, peak) * LEVELS)) : 0,
      ),
    };
  });
}
