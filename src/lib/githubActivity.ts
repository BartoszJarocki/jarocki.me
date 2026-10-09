export type ContributionDay = { date: string; count: number };
export type ContributionWeek = { start: string; total: number };
export type Activity = { total: number; weeks: ContributionWeek[] };

function attr(tag: string, name: string) {
  return tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
}

function parseCount(text: string) {
  if (text.startsWith('No contributions')) return 0;
  const digits = text.match(/^([\d,]+) contributions?\b/)?.[1];
  return digits === undefined ? undefined : Number(digits.replaceAll(',', ''));
}

// GitHub renders a day as <td data-date id> and puts its count only in <tool-tip for={id}>, e.g. "1,234 contributions on May 3rd."
export function parseContributionDays(html: string): ContributionDay[] {
  const tooltips = Array.from(html.matchAll(/<tool-tip\b([^>]*)>([^<]*)<\/tool-tip>/g));
  const cells = Array.from(html.matchAll(/<td\b[^>]*>/g));

  const counts = new Map<string, number>();
  for (const [, attrs, text] of tooltips) {
    const id = attr(attrs, 'for');
    const count = parseCount(text.trim());
    if (id !== undefined && count !== undefined) counts.set(id, count);
  }

  const days: ContributionDay[] = [];
  for (const [tag] of cells) {
    const date = attr(tag, 'data-date');
    const count = counts.get(attr(tag, 'id') ?? '');
    if (date !== undefined && count !== undefined) days.push({ date, count });
  }
  return days.sort((a, b) => a.date.localeCompare(b.date));
}

function sundayOf(date: string) {
  const day = new Date(`${date}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() - day.getUTCDay());
  return day.toISOString().slice(0, 10);
}

export function toActivity(days: ContributionDay[]): Activity {
  const weeks: ContributionWeek[] = [];
  let total = 0;
  for (const { date, count } of days) {
    const start = sundayOf(date);
    const week = weeks.at(-1);
    if (week?.start === start) week.total += count;
    else weeks.push({ start, total: count });
    total += count;
  }
  return { total, weeks };
}

export async function fetchActivity(user: string): Promise<Activity | null> {
  try {
    const response = await fetch(`https://github.com/users/${user}/contributions`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(5000),
    });
    if (response.status !== 200) return null;
    const days = parseContributionDays(await response.text());
    return days.length < 300 ? null : toActivity(days);
  } catch {
    return null;
  }
}
