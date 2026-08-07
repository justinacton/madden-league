/** Formats a point differential with an explicit sign, e.g. +42, -15, 0. */
export function formatSignedNumber(value: number): string {
  if (value > 0) return `+${value}`;
  if (value < 0) return `${value}`;
  return '0';
}

/** Formats a win percentage as a fixed 3-decimal string, e.g. 0.750, 0.000. */
export function formatWinPercentage(value: number): string {
  return value.toFixed(3);
}

/** Formats a rate stat (e.g. completion %) to one decimal place. */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

/** Formats a per-game average to one decimal place. */
export function formatAverage(value: number): string {
  return value.toFixed(1);
}

const MONTH_DAY_FORMAT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const FULL_DATE_FORMAT = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

export function formatShortDate(iso: string | undefined): string {
  if (!iso) return 'TBD';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'TBD';
  return MONTH_DAY_FORMAT.format(date);
}

export function formatFullDate(iso: string | undefined): string {
  if (!iso) return 'Date to be determined';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Date to be determined';
  return FULL_DATE_FORMAT.format(date);
}
