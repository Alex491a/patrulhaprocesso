/**
 * Utility functions for handling dates without timezone issues.
 * 
 * When parsing date strings like "YYYY-MM-DD", JavaScript's Date constructor
 * interprets them as UTC, which can cause a shift when displaying in local time.
 * These utilities ensure dates are handled correctly in the local timezone.
 */

/**
 * Parse a date string (YYYY-MM-DD) to a Date object in local timezone.
 * This prevents the date from shifting due to UTC interpretation.
 */
export function parseDateString(dateStr: string): Date {
  // Handle both YYYY-MM-DD and ISO formats
  const datePart = dateStr.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  
  // Create date in local timezone (month is 0-indexed)
  return new Date(year, month - 1, day);
}

/**
 * Format a date string (YYYY-MM-DD) to Brazilian format (DD/MM/YYYY).
 * This correctly handles the date without timezone shifts.
 */
export function formatDateBR(dateStr: string): string {
  const date = parseDateString(dateStr);
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
}

/**
 * Get current date in YYYY-MM-DD format (local timezone).
 */
export function getCurrentDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}
