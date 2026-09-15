export interface TimezoneOption {
  code: string;
  name: string;
  iananame: string;
  offsetMinutes: number; // Offset from UTC in minutes
  badge: string;
}

export const TIMEZONES: TimezoneOption[] = [
  {
    code: 'UTC',
    name: 'UTC — GAO Server Standard',
    iananame: 'UTC',
    offsetMinutes: 0,
    badge: 'UTC+00:00',
  },
  {
    code: 'LOCAL',
    name: `Local Browser Time (${Intl.DateTimeFormat().resolvedOptions().timeZone})`,
    iananame: Intl.DateTimeFormat().resolvedOptions().timeZone,
    offsetMinutes: -new Date().getTimezoneOffset(),
    badge: `Local (${new Date().getTimezoneOffset() <= 0 ? '+' : ''}${-new Date().getTimezoneOffset() / 60}:00)`,
  },
  {
    code: 'EST',
    name: 'EST / EDT — US Eastern Time',
    iananame: 'America/New_York',
    offsetMinutes: -240, // EDT UTC-4
    badge: 'UTC-04:00',
  },
  {
    code: 'CST',
    name: 'CST / CDT — US Central Time',
    iananame: 'America/Chicago',
    offsetMinutes: -300, // CDT UTC-5
    badge: 'UTC-05:00',
  },
  {
    code: 'MST',
    name: 'MST / MDT — US Mountain Time',
    iananame: 'America/Denver',
    offsetMinutes: -360, // MDT UTC-6
    badge: 'UTC-06:00',
  },
  {
    code: 'PST',
    name: 'PST / PDT — US Pacific Time',
    iananame: 'America/Los_Angeles',
    offsetMinutes: -420, // PDT UTC-7
    badge: 'UTC-07:00',
  },
  {
    code: 'GMT',
    name: 'GMT / BST — London / Western Europe',
    iananame: 'Europe/London',
    offsetMinutes: 60, // BST UTC+1
    badge: 'UTC+01:00',
  },
  {
    code: 'CET',
    name: 'CET / CEST — Paris / Berlin / Central Europe',
    iananame: 'Europe/Paris',
    offsetMinutes: 120, // CEST UTC+2
    badge: 'UTC+02:00',
  },
  {
    code: 'PKT',
    name: 'PKT — Pakistan Standard Time',
    iananame: 'Asia/Karachi',
    offsetMinutes: 300, // UTC+5
    badge: 'UTC+05:00',
  },
  {
    code: 'IST',
    name: 'IST — India Standard Time',
    iananame: 'Asia/Kolkata',
    offsetMinutes: 330, // UTC+5:30
    badge: 'UTC+05:30',
  },
  {
    code: 'JST',
    name: 'JST — Tokyo / Japan Standard Time',
    iananame: 'Asia/Tokyo',
    offsetMinutes: 540, // UTC+9
    badge: 'UTC+09:00',
  },
  {
    code: 'AEST',
    name: 'AEST — Sydney / Australia Eastern',
    iananame: 'Australia/Sydney',
    offsetMinutes: 600, // UTC+10
    badge: 'UTC+10:00',
  },
];

export function getSelectedTimezone(code: string): TimezoneOption {
  return TIMEZONES.find((tz) => tz.code === code) || TIMEZONES[0];
}

/**
 * Parses any date string (ISO 8601, GAO string "yyyy-MM-dd HH:mm:ss", or timestamp)
 * as a UTC Date object.
 */
export function parseAsUtcDate(dateInput: string | Date | number | null | undefined): Date | null {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? null : dateInput;

  if (typeof dateInput === 'number') {
    return new Date(dateInput);
  }

  const str = String(dateInput).trim();
  if (!str) return null;

  // GAO format e.g. "2026-09-07 13:10:25" or "2026-09-07 13:10:25.123"
  // If it doesn't contain 'Z' or offset, treat it as UTC
  let isoString = str;
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/.test(str)) {
    isoString = str.replace(' ', 'T');
    if (!isoString.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(isoString)) {
      isoString += 'Z';
    }
  }

  const parsed = new Date(isoString);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Formats a date string in the target timezone with clean formatting.
 */
export function formatInTimezone(
  dateInput: string | Date | number | null | undefined,
  tzCode: string = 'UTC',
  options: { includeSeconds?: boolean; includeDate?: boolean; shortFormat?: boolean } = {}
): string {
  const date = parseAsUtcDate(dateInput);
  if (!date) return 'N/A';

  const tz = getSelectedTimezone(tzCode);

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz.iananame,
      year: options.includeDate !== false ? 'numeric' : undefined,
      month: options.includeDate !== false ? (options.shortFormat ? 'numeric' : 'short') : undefined,
      day: options.includeDate !== false ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit',
      second: options.includeSeconds ? '2-digit' : undefined,
      hour12: true,
    });

    const formatted = formatter.format(date);
    return `${formatted} (${tz.code})`;
  } catch {
    // Fallback using manual offset
    const utcMs = date.getTime();
    const targetMs = utcMs + tz.offsetMinutes * 60 * 1000;
    const targetDate = new Date(targetMs);

    const year = targetDate.getUTCFullYear();
    const month = String(targetDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getUTCDate()).padStart(2, '0');
    let hours = targetDate.getUTCHours();
    const minutes = String(targetDate.getUTCMinutes()).padStart(2, '0');
    const seconds = String(targetDate.getUTCSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;

    const datePart = `${year}-${month}-${day}`;
    const timePart = `${String(hours).padStart(2, '0')}:${minutes}${options.includeSeconds ? `:${seconds}` : ''} ${ampm}`;

    return options.includeDate !== false ? `${datePart} ${timePart} (${tz.code})` : `${timePart} (${tz.code})`;
  }
}
