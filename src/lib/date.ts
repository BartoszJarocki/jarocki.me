// Formats the date string itself, so server and browser time zones can't disagree on the day.
export function dotDate(isoDate: string) {
  return isoDate.slice(0, 10).replaceAll('-', '.');
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function dayMonth(isoDate: string) {
  const [, month, day] = isoDate.split('-');
  return `${Number(day)} ${months[Number(month) - 1]}`;
}

export function monthYear(isoDate: string) {
  const [year, month] = isoDate.split('-');
  return `${months[Number(month) - 1]} ${year}`;
}
