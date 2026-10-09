export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

// Formats the date string itself, so server and browser time zones can't disagree on the day.
export function dotDate(isoDate: string) {
  return isoDate.slice(0, 10).replaceAll('-', '.');
}
