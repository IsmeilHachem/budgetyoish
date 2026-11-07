import { getTodayEST } from '@/utils/dateUtils'
import { getDaysInMonth, getMonthsInRange } from '@/utils/upcomingBills'

const MS_PER_DAY = 86400000

/**
 * Converts a 'YYYY-MM-DD' string into an integer day number (days since 1970-01-01 UTC).
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @returns {number|null}
 */
export function dateStrToDayCount(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null
  const parts = dateStr.split('-').map(Number)
  if (parts.length !== 3 || parts.some(isNaN)) return null
  const [y, m, d] = parts
  return Math.floor(Date.UTC(y, m - 1, d) / MS_PER_DAY)
}

/**
 * Formats an integer day count (days since 1970-01-01 UTC) back into 'YYYY-MM-DD'.
 * @param {number} dayCount
 * @returns {string}
 */
export function dayCountToDateStr(dayCount) {
  const dt = new Date(dayCount * MS_PER_DAY)
  const y = dt.getUTCFullYear()
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const d = String(dt.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Normalizes a range start ('YYYY-MM' or 'YYYY-MM-DD') to 'YYYY-MM-DD'.
 * @param {string} rangeStart
 * @returns {string|null}
 */
export function normalizeRangeStart(rangeStart) {
  if (!rangeStart || typeof rangeStart !== 'string') return null
  if (rangeStart.length === 7) {
    return `${rangeStart}-01`
  }
  return rangeStart.slice(0, 10)
}

/**
 * Normalizes a range end ('YYYY-MM' or 'YYYY-MM-DD') to its inclusive last 'YYYY-MM-DD'.
 * @param {string} rangeEnd
 * @returns {string|null}
 */
export function normalizeRangeEnd(rangeEnd) {
  if (!rangeEnd || typeof rangeEnd !== 'string') return null
  if (rangeEnd.length === 7) {
    const [y, m] = rangeEnd.split('-').map(Number)
    if (!y || !m) return null
    const maxDay = getDaysInMonth(y, m)
    return `${y}-${String(m).padStart(2, '0')}-${String(maxDay).padStart(2, '0')}`
  }
  return rangeEnd.slice(0, 10)
}

function resolveTodayDateStr(todayDate) {
  if (typeof todayDate === 'string' && todayDate.length >= 10) {
    return todayDate.slice(0, 10)
  }
  const d = todayDate instanceof Date ? todayDate : getTodayEST()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Generates display-only upcoming income rows for the selected date range.
 * Never mutates store state or saves anything.
 *
 * @param {Array} sources - Array of recurring income source objects
 * @param {Object} confirmedOccurrences - { [sourceId]: { [YYYY-MM-DD]: { amount, paidDate } } }
 * @param {string} rangeStart - 'YYYY-MM' or 'YYYY-MM-DD'
 * @param {string} rangeEnd - 'YYYY-MM' or 'YYYY-MM-DD'
 * @param {string|Date} [todayDate] - Optional 'YYYY-MM-DD' string or Date for today (defaults to today in EST)
 * @returns {Array}
 */
export function getUpcomingIncomeRows(sources, confirmedOccurrences = {}, rangeStart, rangeEnd, todayDate = null) {
  if (!Array.isArray(sources) || !rangeStart || !rangeEnd) {
    return []
  }

  const startStr = normalizeRangeStart(rangeStart)
  const endStr = normalizeRangeEnd(rangeEnd)
  if (!startStr || !endStr || startStr > endStr) {
    return []
  }

  const todayStr = resolveTodayDateStr(todayDate)
  const rows = []

  for (const source of sources) {
    if (!source || !source.id || !source.name || !source.startDate || !source.frequency) continue
    const amount = Math.abs(Number(source.amount))
    if (!amount || isNaN(amount) || amount <= 0) continue

    const effectiveMinStr = [startStr, todayStr, source.startDate].reduce((a, b) => (a > b ? a : b))
    const effectiveMaxStr = source.endDate && source.endDate < endStr ? source.endDate : endStr
    if (effectiveMinStr > effectiveMaxStr) continue

    const candidateDates = []

    if (source.frequency === 'weekly' || source.frequency === 'biweekly') {
      const step = source.frequency === 'weekly' ? 7 : 14
      const anchorDay = dateStrToDayCount(source.startDate)
      const minDay = dateStrToDayCount(effectiveMinStr)
      const maxDay = dateStrToDayCount(effectiveMaxStr)
      if (anchorDay === null || minDay === null || maxDay === null) continue

      let firstDay = anchorDay
      if (firstDay < minDay) {
        const diff = minDay - firstDay
        const steps = Math.ceil(diff / step)
        firstDay = anchorDay + steps * step
      }

      for (let d = firstDay; d <= maxDay; d += step) {
        candidateDates.push(dayCountToDateStr(d))
      }
    } else if (source.frequency === 'semimonthly' || source.frequency === 'monthly') {
      const rawDays = Array.isArray(source.days)
        ? source.days.map(Number).filter(n => !isNaN(n) && n >= 1 && n <= 31)
        : []
      if (rawDays.length === 0) continue

      const targetDays = source.frequency === 'monthly' ? [rawDays[0]] : rawDays.slice(0, 2)
      const months = getMonthsInRange(effectiveMinStr, effectiveMaxStr)

      for (const ym of months) {
        const [yearNum, monthNum] = ym.split('-').map(Number)
        const maxDayInMonth = getDaysInMonth(yearNum, monthNum)
        const seenDatesInMonth = new Set()

        const sortedDays = [...targetDays].sort((a, b) => a - b)
        for (const dayNum of sortedDays) {
          const clampedDay = Math.min(Math.max(1, dayNum), maxDayInMonth)
          const dateStr = `${ym}-${String(clampedDay).padStart(2, '0')}`
          if (dateStr < effectiveMinStr || dateStr > effectiveMaxStr) continue
          if (seenDatesInMonth.has(dateStr)) continue
          seenDatesInMonth.add(dateStr)
          candidateDates.push(dateStr)
        }
      }
    }

    for (const scheduledDate of candidateDates) {
      if (confirmedOccurrences?.[source.id]?.[scheduledDate]) continue

      rows.push({
        id: `upcoming-income-${source.id}-${scheduledDate}`,
        sourceId: source.id,
        scheduledDate,
        date: scheduledDate,
        description: source.name,
        category: source.category || 'Pay Day - Pay Day',
        amount,
        isUpcoming: true,
        isIncome: true
      })
    }
  }

  return rows
}

