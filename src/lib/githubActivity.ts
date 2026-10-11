export type ContributionDay = { date: string; count: number };
export type WeekTotal = { start: string; total: number };
export type Activity = {
  dates: string[]; // ISO days, consecutive, oldest first
  contributions: number[]; // one per date
  pullRequests: { merged: number[]; additions: number[] } | null; // per date by UTC merge day; null without a working GITHUB_TOKEN
};

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

export function weeklyTotals(dates: string[], values: number[]): WeekTotal[] {
  const weeks: WeekTotal[] = [];
  dates.forEach((date, i) => {
    const start = sundayOf(date);
    const week = weeks.at(-1);
    if (week?.start === start) week.total += values[i];
    else weeks.push({ start, total: values[i] });
  });
  return weeks;
}

async function fetchContributionDays(user: string) {
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
    return days.length < 300 ? null : days;
  } catch {
    return null;
  }
}

const mergedSearch = `query ($q: String!, $after: String) {
  search(type: ISSUE, first: 100, after: $after, query: $q) {
    issueCount
    pageInfo { hasNextPage endCursor }
    nodes { ... on PullRequest { mergedAt additions } }
  }
}`;

type MergedPullRequest = { mergedAt: string; additions: number };
type MergedSearch = {
  data?: {
    search: {
      issueCount: number;
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      nodes: MergedPullRequest[];
    };
  };
  errors?: { message: string }[];
};

// A page of 100 PRs with their additions can take GitHub over 5 seconds, and a search stops at 1,000 results.
// Windows that each hold about a 24th of the contributions keep every search to about one fast page.
function searchWindows(days: ContributionDay[]) {
  const share = days.reduce((sum, day) => sum + day.count, 0) / 24;
  const windows: [string, string][] = [];
  let filled = Infinity;
  for (const { date, count } of days) {
    if (filled + count > share) {
      windows.push([date, date]);
      filled = 0;
    } else windows[windows.length - 1][1] = date;
    filled += count;
  }
  return windows;
}

async function searchMerged(
  user: string,
  [from, to]: [string, string],
  token: string,
  signal: AbortSignal,
) {
  const pullRequests: MergedPullRequest[] = [];
  let after: string | null = null;
  do {
    const response: Response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: mergedSearch,
        variables: { q: `author:${user} is:pr is:merged merged:${from}..${to}`, after },
      }),
      signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const { data, errors }: MergedSearch = await response.json();
    if (errors?.length || !data) throw new Error(errors?.[0]?.message ?? 'no data');
    const { issueCount, pageInfo, nodes } = data.search;
    if (issueCount > 1000) throw new Error(`${issueCount} results for ${from}..${to}`);
    pullRequests.push(...nodes);
    after = pageInfo.hasNextPage ? pageInfo.endCursor : null;
  } while (after);
  return pullRequests;
}

async function fetchPullRequests(
  user: string,
  days: ContributionDay[],
): Promise<Activity['pullRequests']> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;
  try {
    const signal = AbortSignal.timeout(10_000);
    const windows = await Promise.all(
      searchWindows(days).map((window) => searchMerged(user, window, token, signal)),
    );
    const index = new Map(days.map((day, i) => [day.date, i]));
    const merged = days.map(() => 0);
    const additions = days.map(() => 0);
    for (const { mergedAt, additions: added } of windows.flat()) {
      const i = index.get(mergedAt.slice(0, 10));
      if (i === undefined) continue;
      merged[i] += 1;
      additions[i] += added;
    }
    return { merged, additions };
  } catch (error) {
    console.error(`githubActivity: no merged PR stats: ${error}`);
    return null;
  }
}

export async function fetchActivity(user: string): Promise<Activity | null> {
  const days = await fetchContributionDays(user);
  if (!days) return null;
  return {
    dates: days.map((day) => day.date),
    contributions: days.map((day) => day.count),
    pullRequests: await fetchPullRequests(user, days),
  };
}
