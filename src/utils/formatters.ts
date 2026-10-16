/**
 * Helper utility to normalize external web links.
 * Ensures URLs have http:// or https:// protocol so browser doesn't treat them as relative routes.
 */
export function formatExternalUrl(url?: string | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Format phone number for WhatsApp link
 */
export function formatWhatsAppUrl(phone?: string | null): string {
  if (!phone) return '';
  const digitsOnly = phone.replace(/[^0-9]/g, '');
  return `https://wa.me/${digitsOnly}`;
}

/**
 * Format phone number for tel: link
 */
export function formatTelUrl(phone?: string | null): string {
  if (!phone) return '';
  return `tel:${phone.trim()}`;
}

/**
 * Format a date string (ISO or YYYY-MM-DD) into a localized, timezone-safe display string.
 * Prevents UTC date shift on laptops located in timezones west of UTC.
 */
export function formatDisplayDate(dateStr?: string | null): string {
  if (!dateStr) return 'TBD';
  const trimmed = dateStr.trim();
  if (!trimmed) return 'TBD';

  // If it starts with YYYY-MM-DD (e.g. "2026-10-25" or "2026-10-25T..."), parse the year, month, day directly
  const dateMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateMatch) {
    const year = parseInt(dateMatch[1], 10);
    const month = parseInt(dateMatch[2], 10) - 1; // 0-indexed
    const day = parseInt(dateMatch[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  }

  const d = new Date(trimmed);
  if (isNaN(d.getTime())) return trimmed;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format date value specifically for <input type="date"> (YYYY-MM-DD)
 * without timezone day-shift.
 */
export function formatDateForInput(dateStr?: string | null): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  const d = new Date(trimmed);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Sanitize username for profile paths
 */
export function sanitizeUsername(username?: string | null): string {
  if (!username) return '';
  return username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
}

