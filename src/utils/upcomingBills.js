import { getTodayEST } from '@/utils/dateUtils'

/**
 * Returns the number of days in a given month (1-12) of a given year.
 * @param {number} year
 * @param {number} month - 1-indexed (1 = Jan, 12 = Dec)
 * @returns {number}
 */
export function getDaysInMonth(year, month) {
  if (month === 2) {
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
    return isLeap ? 29 : 28
  }
  if ([4, 6, 9, 11].includes(month)) {
    return 30
  }
  return 31
}

/**
 * Returns an array of 'YYYY-MM' strings between startMonth and endMonth inclusive.
 * @param {string} startStr - 'YYYY-MM' or 'YYYY-MM-DD'
 * @param {string} endStr - 'YYYY-MM' or 'YYYY-MM-DD'
 * @returns {string[]}
 */
export function getMonthsInRange(startStr, endStr) {
  if (!startStr || !endStr) return []
  const startYm = startStr.slice(0, 7)
  const endYm = endStr.slice(0, 7)
  if (startYm > endYm) return []

  const [sy, sm] = startYm.split('-').map(Number)
  const [ey, em] = endYm.split('-').map(Number)
  if (!sy || !sm || !ey || !em) return []

  const months = []
  let y = sy
  let m = sm
  while (y < ey || (y === ey && m <= em)) {
    months.push(`${y}-${String(m).padStart(2, '0')}`)
    m++
    if (m > 12) {
      m = 1
      y++
    }
  }
  return months
}

/**
 * Generates display-only upcoming bill rows for a selected date range.
 * Never mutates store state or saves anything.
 *
 * @param {Array} bills - Array of bill objects from billsStore
 * @param {Object} billMonthStatus - Map { [billId]: { [YYYY-MM]: { paid, amount } } }
 * @param {Object} dateRange - { start: 'YYYY-MM' | 'YYYY-MM-DD', end: 'YYYY-MM' | 'YYYY-MM-DD' }
 * @param {string} [currentMonthOverride] - Optional 'YYYY-MM' override for current month (defaults to today in EST)
 * @returns {Array} Array of upcoming bill transaction-like rows
 */
export function getUpcomingBillRows(bills, billMonthStatus = {}, dateRange, currentMonthOverride = null) {
  if (!Array.isArray(bills) || !dateRange || !dateRange.start || !dateRange.end) {
    return []
  }

  let currentMonth = currentMonthOverride
  if (!currentMonth) {
    const todayEST = getTodayEST()
    currentMonth = `${todayEST.getFullYear()}-${String(todayEST.getMonth() + 1).padStart(2, '0')}`
  }

  const months = getMonthsInRange(dateRange.start, dateRange.end)
  const rows = []

  for (const bill of bills) {
    if (!bill || bill.archived) continue
    if (!bill.dueDate || typeof bill.dueDate !== 'string') continue

    const parts = bill.dueDate.split('-')
    if (parts.length < 3) continue
    const billStartMonth = `${parts[0]}-${parts[1]}`
    const dueDay = parseInt(parts[2], 10)
    if (isNaN(dueDay)) continue

    for (const ym of months) {
      // Only current month and later are generated; never generate rows for past months
      if (ym < currentMonth) continue
      // Must be >= bill's start month
      if (ym < billStartMonth) continue
      // Must be < bill.deletedAfter (if set)
      if (bill.deletedAfter && ym >= bill.deletedAfter) continue
      // Must not be paid for this month
      if (billMonthStatus?.[bill.id]?.[ym]?.paid === true) continue

      const [yearNum, monthNum] = ym.split('-').map(Number)
      const maxDay = getDaysInMonth(yearNum, monthNum)
      const clampedDay = Math.min(Math.max(1, dueDay), maxDay)
      const rowDate = `${ym}-${String(clampedDay).padStart(2, '0')}`

      const rawAmount = Number(bill.amount)
      const hasValidAmount = bill.amount !== null && bill.amount !== undefined && bill.amount !== '' && !isNaN(rawAmount) && rawAmount !== 0
      const rowAmount = hasValidAmount ? -Math.abs(rawAmount) : 0
      const noAmount = !hasValidAmount

      rows.push({
        id: `upcoming-${bill.id}-${ym}`,
        billId: bill.id,
        bill,
        month: ym,
        date: rowDate,
        description: bill.name,
        category: bill.category || 'Other',
        amount: rowAmount,
        noAmount,
        isUpcoming: true,
        isIncome: false
      })
    }
  }

  return rows
}

