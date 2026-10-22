// Parses a YYYY-MM-DD birthday (what <input type="date"> submits) into a UTC
// midnight Date, matching how the DATE column round-trips. Returns null for
// anything malformed, impossible (Feb 30), in the future, or before 1900.
export function parseBirthday(value: unknown): Date | null {
  if (typeof value !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  if (year < 1900 || date.getTime() > Date.now()) return null;
  return date;
}

// Formats a stored birthday for display without letting the viewer's time
// zone shift it to the previous day.
export function formatBirthday(value: string | Date): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function toDateInputValue(value: string | Date | null | undefined): string {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}
