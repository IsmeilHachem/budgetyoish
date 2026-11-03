// Utility functions for EST timezone date handling

/**
 * Creates a Date object in EST timezone from year, month, day
 * @param {number} year - Full year (e.g., 2024)
 * @param {number} month - Month (1-12, not 0-indexed)
 * @param {number} day - Day of month (1-31)
 * @returns {Date} Date object representing the date in EST
 */
export function createESTDate(year, month, day) {
  // Create date in EST (UTC-5)
  // We create a local date and then adjust for EST
  const date = new Date(year, month - 1, day, 5, 0, 0)
  return date
}

/**
 * Gets today's date in EST timezone
 * @returns {Date} Today's date in EST
 */
export function getTodayEST() {
  // Use Date.now() to respect mocked time in tests
  const today = new Date(Date.now())
  return createESTDate(today.getFullYear(), today.getMonth() + 1, today.getDate())
}

/**
 * Generates a unique timestamp string
 * @returns {string} Current timestamp as string
 */
export function generateTimestamp() {
  return new Date().getTime().toString()
}

/**
 * Parses a date string in YYYY-MM-DD format to EST Date
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {Date} Date object in EST timezone
 */
export function parseESTDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return createESTDate(year, month, day)
}
