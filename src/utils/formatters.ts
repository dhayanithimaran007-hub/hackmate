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
 * Sanitize username for profile paths
 */
export function sanitizeUsername(username?: string | null): string {
  if (!username) return '';
  return username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
}
