import { getTodayEST } from '@/utils/dateUtils'
import { getDaysInMonth, getMonthsInRange, getUpcomingBillRows } from '@/utils/upcomingBills'
import { dateStrToDayCount, dayCountToDateStr, getUpcomingIncomeRows } from '@/utils/upcomingIncome'
import { simulateDebtPlan } from '@/utils/debtPayoff'

/**
 * Formats an EST Date object as YYYY-MM-DD
 * @param {Date} date
 * @returns {string}
 */
export function formatESTDateYYYYMMDD(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Returns the Friday-through-Thursday pay weeks covering every day of selectedMonth.
 * Starts from the Friday on or before the 1st of selectedMonth and continues through
 * every Friday inside selectedMonth.
 *
 * @param {string} selectedMonth - 'YYYY-MM'
 * @returns {Array<{ weekIndex: number, startDate: string, endDate: string }>}
 */
export function getPayWeeksForMonth(selectedMonth) {
  if (!selectedMonth || typeof selectedMonth !== 'string' || selectedMonth.length < 7) {
    return []
  }
  const ym = selectedMonth.slice(0, 7)
  const [year, month] = ym.split('-').map(Number)
  if (!year || !month) return []

  const firstOfMonthStr = `${ym}-01`
  const maxDay = getDaysInMonth(year, month)
  const lastOfMonthStr = `${ym}-${String(maxDay).padStart(2, '0')}`

  const firstDayCount = dateStrToDayCount(firstOfMonthStr)
  const lastDayCount = dateStrToDayCount(lastOfMonthStr)
  if (firstDayCount === null || lastDayCount === null) return []

  // UTC day of week: 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat
  const firstDow = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
  // Days to step back from the 1st to reach the Friday on or before the 1st:
  // Fri(5)->0, Sat(6)->1, Sun(0)->2, Mon(1)->3, Tue(2)->4, Wed(3)->5, Thu(4)->6
  const offsetToFriday = (firstDow - 5 + 7) % 7
  const firstFridayCount = firstDayCount - offsetToFriday

  const weeks = []
  let idx = 1
  for (let fri = firstFridayCount; fri <= lastDayCount; fri += 7) {
    const startDate = dayCountToDateStr(fri)
    const endDate = dayCountToDateStr(fri + 6)
    weeks.push({
      weekIndex: idx++,
      startDate,
      endDate
    })
  }

  return weeks
}

/**
 * Projects active bills onto their clamped due dates across [rangeStart, rangeEnd]
 * by reusing getUpcomingBillRows from upcomingBills.js.
 * Includes already-paid bills (with paid = true) so they still appear in the planning view.
 * Marks bills with null/0 amount with amount = 0 and noAmount = true.
 *
 * @param {Array} rawBills - Bills array from billsStore
 * @param {Object} billMonthStatus - { [billId]: { [YYYY-MM]: { paid, amount } } }
 * @param {string} rangeStart - 'YYYY-MM-DD'
 * @param {string} rangeEnd - 'YYYY-MM-DD'
 * @returns {Array}
 */
export function projectBillsForDateRange(rawBills = [], billMonthStatus = {}, rangeStart, rangeEnd) {
  if (!Array.isArray(rawBills) || !rangeStart || !rangeEnd || rangeStart > rangeEnd) {
    return []
  }

  const startYm = rangeStart.slice(0, 7)
  // Pass {} for billMonthStatus and startYm for currentMonthOverride so getUpcomingBillRows
  // projects all active (non-archived, non-deletedAfter) bills for all months in the range,
  // including already-paid bills and past months.
  const rows = getUpcomingBillRows(
    rawBills,
    {},
    { start: rangeStart, end: rangeEnd },
    startYm
  )

  return rows
    .filter(row => row.date >= rangeStart && row.date <= rangeEnd)
    .map(row => {
      const bill = row.bill || {}
      const monthStatus = billMonthStatus?.[row.billId]?.[row.month]
      const paid = Boolean(monthStatus?.paid)

      // Match Bills.vue getBillAmount(bill) logic: use per-month amount if set & non-zero
      let resolvedRaw = bill.amount
      const perMonthAmt = monthStatus?.amount
      if (perMonthAmt !== null && perMonthAmt !== undefined && perMonthAmt !== '') {
        if (!(perMonthAmt === 0 && bill.amount !== 0 && bill.amount !== null && bill.amount !== undefined)) {
          resolvedRaw = perMonthAmt
        }
      }

      const numAmt = Number(resolvedRaw)
      const hasAmount =
        resolvedRaw !== null &&
        resolvedRaw !== undefined &&
        resolvedRaw !== '' &&
        !isNaN(numAmt) &&
        numAmt > 0
      const amount = hasAmount ? Math.abs(numAmt) : 0
      const noAmount = !hasAmount

      return {
        id: row.id,
        billId: row.billId,
        name: row.description,
        category: row.category || 'Other',
        automatic: Boolean(bill.automatic),
        date: row.date,
        month: row.month,
        amount,
        noAmount,
        paid
      }
    })
    .sort((a, b) => (a.date === b.date ? a.name.localeCompare(b.name) : a.date.localeCompare(b.date)))
}

/**
 * Projects recurring income paychecks across [rangeStart, rangeEnd]
 * by reusing getUpcomingIncomeRows from upcomingIncome.js.
 * Includes already-confirmed and earlier-in-month occurrences for full-month planning.
 *
 * @param {Array} sources - Recurring income sources from recurringIncomeStore
 * @param {Object} confirmedOccurrences - { [sourceId]: { [YYYY-MM-DD]: { amount, paidDate } } }
 * @param {string} rangeStart - 'YYYY-MM-DD'
 * @param {string} rangeEnd - 'YYYY-MM-DD'
 * @returns {Array}
 */
export function projectIncomeForDateRange(sources = [], confirmedOccurrences = {}, rangeStart, rangeEnd) {
  if (!Array.isArray(sources) || !rangeStart || !rangeEnd || rangeStart > rangeEnd) {
    return []
  }

  // Move shallow-copied source startDates back to or before rangeStart (aligned by step) so paychecks before a schedule's saved creation date are still projected.
  const minDay = dateStrToDayCount(rangeStart)
  const firstOfRangeMonth = `${rangeStart.slice(0, 7)}-01`
  const adjustedSources = sources.map(source => {
    if (!source || !source.startDate || !source.frequency) return source
    let newStartDate = source.startDate

    if (source.startDate > rangeStart) {
      if (source.frequency === 'weekly' || source.frequency === 'biweekly') {
        const step = source.frequency === 'weekly' ? 7 : 14
        const anchorDay = dateStrToDayCount(source.startDate)
        if (anchorDay !== null && minDay !== null && anchorDay > minDay) {
          const stepsBack = Math.ceil((anchorDay - minDay) / step)
          newStartDate = dayCountToDateStr(anchorDay - stepsBack * step)
        }
      } else if (source.frequency === 'semimonthly' || source.frequency === 'monthly') {
        if (firstOfRangeMonth < source.startDate) {
          newStartDate = firstOfRangeMonth
        }
      }
    }

    if (newStartDate > source.startDate) {
      newStartDate = source.startDate
    }

    return {
      ...source,
      startDate: newStartDate
    }
  })

  // Pass {} for confirmedOccurrences and rangeStart for todayDate so all scheduled occurrences
  // in [rangeStart, rangeEnd] are returned while respecting source.endDate.
  const rows = getUpcomingIncomeRows(adjustedSources, {}, rangeStart, rangeEnd, rangeStart)

  return rows
    .filter(row => row.date >= rangeStart && row.date <= rangeEnd)
    .map(row => {
      const confirmed = confirmedOccurrences?.[row.sourceId]?.[row.scheduledDate]
      const confirmedAmt = Number(confirmed?.amount)
      const amount =
        confirmed && !isNaN(confirmedAmt) && confirmedAmt > 0
          ? Math.abs(confirmedAmt)
          : Math.abs(Number(row.amount) || 0)

      return {
        id: row.id,
        sourceId: row.sourceId,
        name: row.description,
        category: row.category || 'Pay Day - Pay Day',
        date: row.date,
        amount,
        confirmed: Boolean(confirmed)
      }
    })
    .sort((a, b) => (a.date === b.date ? a.name.localeCompare(b.name) : a.date.localeCompare(b.date)))
}

/**
 * Returns the active (non-archived, non-deletedAfter for selectedMonth) bills.
 * If selectedMonth is provided, excludes bills with deletedAfter <= selectedMonth.
 * @param {Array} rawBills
 * @param {string} [selectedMonth]
 * @returns {Array}
 */
export function getActiveBillsForMonth(rawBills = [], selectedMonth = null) {
  if (!Array.isArray(rawBills)) return []
  const ym = selectedMonth && typeof selectedMonth === 'string' ? selectedMonth.slice(0, 7) : null
  return rawBills.filter(bill => {
    if (!bill || bill.archived) return false
    if (ym && bill.deletedAfter && ym >= bill.deletedAfter) return false
    return true
  })
}

/**
 * Filters logged transactions down to non-bill extra spending inside [rangeStart, rangeEnd]:
 * - Expense transactions only (amount < 0 and !isIncome)
 * - Not 'starting balance'
 * - Description does not match any active bill's normalized name
 * - Category does not match any active bill's normalized category
 *
 * @param {Array} transactions
 * @param {Array} activeBills
 * @param {string} rangeStart - 'YYYY-MM-DD'
 * @param {string} rangeEnd - 'YYYY-MM-DD'
 * @returns {Array}
 */
export function filterExtraSpendingTransactions(transactions = [], activeBills = [], rangeStart, rangeEnd) {
  if (!Array.isArray(transactions) || !rangeStart || !rangeEnd || rangeStart > rangeEnd) {
    return []
  }
  const billList = Array.isArray(activeBills) ? activeBills : []

  const billNames = new Set(
    billList
      .map(b => (b?.name || '').toLowerCase().trim())
      .filter(Boolean)
  )

  const billCategories = new Set(
    billList
      .map(b => (b?.category || '').toLowerCase().trim())
      .filter(Boolean)
  )

  return transactions.filter(tx => {
    if (!tx || !tx.date) return false
    const amt = Number(tx.amount)
    if (isNaN(amt) || amt >= 0 || tx.isIncome) return false

    const normalizedDesc = (tx.description || '').toLowerCase().trim()
    if (normalizedDesc === 'starting balance') return false
    if (billNames.has(normalizedDesc)) return false

    const normalizedCat = (tx.category || '').toLowerCase().trim()
    if (normalizedCat && billCategories.has(normalizedCat)) return false

    if (tx.date < rangeStart || tx.date > rangeEnd) return false
    return true
  })
}

/**
 * Sums extra spending transactions inside [rangeStart, rangeEnd].
 * @param {Array} transactions
 * @param {Array} activeBills
 * @param {string} rangeStart - 'YYYY-MM-DD'
 * @param {string} rangeEnd - 'YYYY-MM-DD'
 * @returns {number}
 */
export function calculateExtraSpendingForRange(transactions = [], activeBills = [], rangeStart, rangeEnd) {
  const matching = filterExtraSpendingTransactions(transactions, activeBills, rangeStart, rangeEnd)
  return matching.reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0)
}

/**
 * Computes extra spending by main category for the selected calendar month (1st through last day).
 * Excludes recurring bills by exact normalized name and any category matching an active bill's category.
 *
 * @param {Array} transactions - Logged transactions
 * @param {Array} activeBills - Active bills
 * @param {string} selectedMonth - 'YYYY-MM'
 * @returns {{
 *   categories: Array<{ name: string, total: number, transactionCount: number, isHighest: boolean }>,
 *   totalExtraSpending: number,
 *   highestCategory: string|null,
 *   startDateStr: string,
 *   endDateStr: string
 * }}
 */
export function calculateMonthlyCategoryExtraSpending(transactions = [], activeBills = [], selectedMonth = '') {
  if (!selectedMonth || typeof selectedMonth !== 'string' || selectedMonth.length < 7) {
    return {
      categories: [],
      totalExtraSpending: 0,
      highestCategory: null,
      startDateStr: '',
      endDateStr: ''
    }
  }

  const ym = selectedMonth.slice(0, 7)
  const [year, month] = ym.split('-').map(Number)
  if (!year || !month) {
    return {
      categories: [],
      totalExtraSpending: 0,
      highestCategory: null,
      startDateStr: '',
      endDateStr: ''
    }
  }

  const maxDay = getDaysInMonth(year, month)
  const startDateStr = `${ym}-01`
  const endDateStr = `${ym}-${String(maxDay).padStart(2, '0')}`

  const filtered = filterExtraSpendingTransactions(transactions, activeBills, startDateStr, endDateStr)
  const groups = {}

  for (const tx of filtered) {
    const amt = Math.abs(Number(tx.amount) || 0)
    const rawCategory = (tx.category || 'Other').trim()
    const sepIdx = rawCategory.indexOf(' - ')
    const mainCategory = sepIdx === -1 ? (rawCategory || 'Other') : (rawCategory.slice(0, sepIdx).trim() || 'Other')

    if (!groups[mainCategory]) {
      groups[mainCategory] = {
        total: 0,
        transactionCount: 0
      }
    }

    groups[mainCategory].total += amt
    groups[mainCategory].transactionCount += 1
  }

  const sorted = Object.entries(groups)
    .map(([name, data]) => ({
      name,
      total: data.total,
      transactionCount: data.transactionCount,
      isHighest: false
    }))
    .sort((a, b) => b.total - a.total)

  let highestCategory = null
  if (sorted.length > 0 && sorted[0].total > 0) {
    sorted[0].isHighest = true
    highestCategory = sorted[0].name
  }

  const totalExtraSpending = sorted.reduce((sum, cat) => sum + cat.total, 0)

  return {
    categories: sorted,
    totalExtraSpending,
    highestCategory,
    startDateStr,
    endDateStr
  }
}

/**
 * Projects a loan payment day (1-31) onto a given YYYY-MM month, clamping to the last day of the month.
 * @param {string} ym - 'YYYY-MM'
 * @param {number|string} loanPaymentDay - 1..31
 * @returns {string|null} 'YYYY-MM-DD'
 */
export function projectLoanPaymentDateForMonth(ym, loanPaymentDay) {
  if (!ym || typeof ym !== 'string' || ym.length < 7) return null
  const dayNum = parseInt(loanPaymentDay, 10)
  if (isNaN(dayNum) || dayNum < 1) return null
  const [year, month] = ym.slice(0, 7).split('-').map(Number)
  if (!year || !month) return null
  const maxDay = getDaysInMonth(year, month)
  const clamped = Math.min(Math.max(1, dayNum), maxDay)
  return `${ym.slice(0, 7)}-${String(clamped).padStart(2, '0')}`
}

/**
 * Builds the complete pay-week and calendar-month Before vs. After plan for selectedMonth
 * using actual logged non-bill extra spending for each week and for the calendar month.
 *
 * @param {{
 *   selectedMonth: string,
 *   rawBills: Array,
 *   billMonthStatus: Object,
 *   incomeSources: Array,
 *   confirmedOccurrences: Object,
 *   transactions: Array,
 *   paidOffBillIds: Set|Array,
 *   monthlyLoanPayment: number|string,
 *   loanPaymentDay: number|string,
 *   todayDateStr?: string|null
 * }} params
 */
export function buildMonthlyPayWeekPlan({
  selectedMonth,
  rawBills = [],
  billMonthStatus = {},
  incomeSources = [],
  confirmedOccurrences = {},
  transactions = [],
  paidOffBillIds = [],
  monthlyLoanPayment = 0,
  loanPaymentDay = 1,
  todayDateStr = null
} = {}) {
  const paidOffSet = paidOffBillIds instanceof Set ? paidOffBillIds : new Set(paidOffBillIds || [])
  const rawLoanAmt = Number(monthlyLoanPayment)
  const loanAmount = !isNaN(rawLoanAmt) && rawLoanAmt > 0 ? rawLoanAmt : 0
  const parsedDay = parseInt(loanPaymentDay, 10)
  const normalizedLoanDay = !isNaN(parsedDay) && parsedDay >= 1 ? Math.min(31, parsedDay) : 1
  const resolvedTodayStr = todayDateStr || formatESTDateYYYYMMDD(getTodayEST())

  const activeBills = getActiveBillsForMonth(rawBills, selectedMonth)
  const payWeeks = getPayWeeksForMonth(selectedMonth)

  if (payWeeks.length === 0) {
    return {
      payWeeks: [],
      monthlySummary: {
        month: selectedMonth || '',
        startDate: '',
        endDate: '',
        incomeTotal: 0,
        extraSpendingTotal: 0,
        isLoggedSoFar: false,
        before: {
          billsTotal: 0,
          leftAfterBills: 0,
          leftAfterSpending: 0
        },
        after: {
          uncheckedBillsTotal: 0,
          paidOffBillsTotal: 0,
          loanPayment: loanAmount,
          billsPlusLoanTotal: loanAmount,
          leftAfterBills: -loanAmount,
          leftAfterSpending: -loanAmount
        }
      }
    }
  }

  const overallStart = payWeeks[0].startDate
  const overallEnd = payWeeks[payWeeks.length - 1].endDate

  const allProjectedBills = projectBillsForDateRange(rawBills, billMonthStatus, overallStart, overallEnd)
  const allProjectedIncome = projectIncomeForDateRange(incomeSources, confirmedOccurrences, overallStart, overallEnd)

  // Project loan payment dates across all months touched by the pay weeks
  const spannedMonths = getMonthsInRange(overallStart, overallEnd)
  const loanDates = spannedMonths
    .map(ym => projectLoanPaymentDateForMonth(ym, normalizedLoanDay))
    .filter(Boolean)

  const enrichedWeeks = payWeeks.map(week => {
    const paychecks = allProjectedIncome.filter(
      inc => inc.date >= week.startDate && inc.date <= week.endDate
    )
    const incomeTotal = paychecks.reduce((sum, p) => sum + p.amount, 0)

    const bills = allProjectedBills
      .filter(b => b.date >= week.startDate && b.date <= week.endDate)
      .map(b => ({
        ...b,
        isPaidOff: paidOffSet.has(b.billId)
      }))

    const matchingLoanDates = loanAmount > 0
      ? loanDates.filter(d => d >= week.startDate && d <= week.endDate)
      : []
    const loanPaymentThisWeek = matchingLoanDates.length * loanAmount
    const loanPaymentDate = matchingLoanDates[0] || null

    const weekExtraSpending = calculateExtraSpendingForRange(
      transactions,
      activeBills,
      week.startDate,
      week.endDate
    )

    // Any pay week whose endDate is >= today includes today or a future date
    const isLoggedSoFar = week.endDate >= resolvedTodayStr

    const beforeBillsTotal = bills.reduce((sum, b) => sum + b.amount, 0)
    const beforeLeftAfterBills = incomeTotal - beforeBillsTotal
    const beforeLeftAfterSpending = beforeLeftAfterBills - weekExtraSpending

    const uncheckedBillsTotal = bills
      .filter(b => !b.isPaidOff)
      .reduce((sum, b) => sum + b.amount, 0)
    const paidOffBillsTotal = bills
      .filter(b => b.isPaidOff)
      .reduce((sum, b) => sum + b.amount, 0)
    const afterBillsPlusLoanTotal = uncheckedBillsTotal + loanPaymentThisWeek
    const afterLeftAfterBills = incomeTotal - afterBillsPlusLoanTotal
    const afterLeftAfterSpending = afterLeftAfterBills - weekExtraSpending

    return {
      ...week,
      paychecks,
      incomeTotal,
      bills,
      extraSpending: weekExtraSpending,
      isLoggedSoFar,
      loanPaymentDate,
      loanPaymentThisWeek,
      before: {
        billsTotal: beforeBillsTotal,
        leftAfterBills: beforeLeftAfterBills,
        leftAfterSpending: beforeLeftAfterSpending
      },
      after: {
        uncheckedBillsTotal,
        paidOffBillsTotal,
        loanPayment: loanPaymentThisWeek,
        billsPlusLoanTotal: afterBillsPlusLoanTotal,
        leftAfterBills: afterLeftAfterBills,
        leftAfterSpending: afterLeftAfterSpending
      }
    }
  })

  // Calendar-month summary (1st through last day of selectedMonth)
  const ym = selectedMonth.slice(0, 7)
  const [year, month] = ym.split('-').map(Number)
  const maxDay = getDaysInMonth(year, month)
  const calStart = `${ym}-01`
  const calEnd = `${ym}-${String(maxDay).padStart(2, '0')}`

  const monthIncomeRows = projectIncomeForDateRange(incomeSources, confirmedOccurrences, calStart, calEnd)
  const monthBillRows = projectBillsForDateRange(rawBills, billMonthStatus, calStart, calEnd)
  const monthExtraSpending = calculateExtraSpendingForRange(transactions, activeBills, calStart, calEnd)

  const monthIncomeTotal = monthIncomeRows.reduce((sum, r) => sum + r.amount, 0)
  const monthBeforeBillsTotal = monthBillRows.reduce((sum, b) => sum + b.amount, 0)
  const monthUncheckedBillsTotal = monthBillRows
    .filter(b => !paidOffSet.has(b.billId))
    .reduce((sum, b) => sum + b.amount, 0)
  const monthPaidOffBillsTotal = monthBillRows
    .filter(b => paidOffSet.has(b.billId))
    .reduce((sum, b) => sum + b.amount, 0)

  const monthAfterBillsPlusLoan = monthUncheckedBillsTotal + loanAmount
  const monthLoanDate = loanAmount > 0 ? projectLoanPaymentDateForMonth(ym, normalizedLoanDay) : null

  const monthlySummary = {
    month: ym,
    startDate: calStart,
    endDate: calEnd,
    incomeTotal: monthIncomeTotal,
    extraSpendingTotal: monthExtraSpending,
    isLoggedSoFar: true,
    loanPaymentDate: monthLoanDate,
    before: {
      billsTotal: monthBeforeBillsTotal,
      leftAfterBills: monthIncomeTotal - monthBeforeBillsTotal,
      leftAfterSpending: monthIncomeTotal - monthBeforeBillsTotal - monthExtraSpending
    },
    after: {
      uncheckedBillsTotal: monthUncheckedBillsTotal,
      paidOffBillsTotal: monthPaidOffBillsTotal,
      loanPayment: loanAmount,
      billsPlusLoanTotal: monthAfterBillsPlusLoan,
      leftAfterBills: monthIncomeTotal - monthAfterBillsPlusLoan,
      leftAfterSpending: monthIncomeTotal - monthAfterBillsPlusLoan - monthExtraSpending
    }
  }

  return {
    payWeeks: enrichedWeeks,
    monthlySummary
  }
}

/**
 * Builds the "True Count" summary for the selected calendar month:
 * 1. Actual so far: logged transactions in selectedMonth with date <= today (all categories, excluding 'starting balance').
 * 2. Forecast (full month): Actual so far + Already logged ahead (date > today) + Still expected ahead
 *    (unpaid/unlogged bills due > today and unconfirmed paychecks > today).
 *    Also computes Forecast After Loan (applying checked bills and loan payment only to dates > today).
 * 3. Difference from schedule (Gap): Forecast (Before Loan) minus the scheduled Monthly Summary (Before Loan).
 * 4. Items to check:
 *    - Bills due <= today that are not paid/logged
 *    - Bills marked paid in billMonthStatus for the month with no matching logged expense transaction in the month ("Marked paid but not logged")
 *    - Scheduled paychecks <= today that are not confirmed
 *
 * @param {{
 *   selectedMonth: string,
 *   rawBills: Array,
 *   billMonthStatus: Object,
 *   incomeSources: Array,
 *   confirmedOccurrences: Object,
 *   transactions: Array,
 *   paidOffBillIds: Set|Array,
 *   monthlyLoanPayment: number|string,
 *   loanPaymentDay: number|string,
 *   todayDateStr?: string|null
 * }} params
 */
export function buildTrueCountSummary({
  selectedMonth,
  rawBills = [],
  billMonthStatus = {},
  incomeSources = [],
  confirmedOccurrences = {},
  transactions = [],
  paidOffBillIds = [],
  monthlyLoanPayment = 0,
  loanPaymentDay = 1,
  todayDateStr = null
} = {}) {
  const paidOffSet = paidOffBillIds instanceof Set ? paidOffBillIds : new Set(paidOffBillIds || [])
  const rawLoanAmt = Number(monthlyLoanPayment)
  const loanAmount = !isNaN(rawLoanAmt) && rawLoanAmt > 0 ? rawLoanAmt : 0
  const parsedDay = parseInt(loanPaymentDay, 10)
  const normalizedLoanDay = !isNaN(parsedDay) && parsedDay >= 1 ? Math.min(31, parsedDay) : 1
  const resolvedTodayStr = todayDateStr || formatESTDateYYYYMMDD(getTodayEST())

  if (!selectedMonth || typeof selectedMonth !== 'string' || selectedMonth.length < 7) {
    return {
      month: '',
      todayDateStr: resolvedTodayStr,
      actualSoFar: { income: 0, expenses: 0, net: 0 },
      alreadyLoggedAhead: { income: 0, expenses: 0 },
      stillExpected: { income: 0, billsBefore: 0, billsAfter: 0, loanAfter: 0 },
      forecast: {
        income: 0,
        before: { expenses: 0, net: 0 },
        after: { expenses: 0, net: 0 }
      },
      scheduled: { income: 0, expenses: 0, net: 0 },
      differenceFromSchedule: { income: 0, expenses: 0, net: 0 },
      itemsToCheck: []
    }
  }

  const ym = selectedMonth.slice(0, 7)
  const [year, month] = ym.split('-').map(Number)
  const maxDay = getDaysInMonth(year, month)
  const calStart = `${ym}-01`
  const calEnd = `${ym}-${String(maxDay).padStart(2, '0')}`

  const txList = Array.isArray(transactions) ? transactions : []
  const monthTransactions = txList.filter(tx => {
    if (!tx || !tx.date) return false
    const normDesc = (tx.description || '').toLowerCase().trim()
    if (normDesc === 'starting balance') return false
    return tx.date >= calStart && tx.date <= calEnd
  })

  // Name matching uses ALL logged expense transactions in the calendar month (including dates > today)
  const allMonthLoggedExpenseNames = new Set()
  let actualIncome = 0
  let actualExpenses = 0
  let loggedAheadIncome = 0
  let loggedAheadExpenses = 0

  for (const tx of monthTransactions) {
    const amt = Number(tx.amount)
    if (isNaN(amt) || amt === 0) continue
    const isInc = amt > 0 || Boolean(tx.isIncome)
    const absAmt = Math.abs(amt)

    if (!isInc) {
      const normDesc = (tx.description || '').toLowerCase().trim()
      if (normDesc) {
        allMonthLoggedExpenseNames.add(normDesc)
      }
    }

    if (tx.date <= resolvedTodayStr) {
      if (isInc) {
        actualIncome += absAmt
      } else {
        actualExpenses += absAmt
      }
    } else {
      if (isInc) {
        loggedAheadIncome += absAmt
      } else {
        loggedAheadExpenses += absAmt
      }
    }
  }

  const actualNet = actualIncome - actualExpenses

  // Project bills and income for the calendar month
  const monthBillRows = projectBillsForDateRange(rawBills, billMonthStatus, calStart, calEnd)
  const monthIncomeRows = projectIncomeForDateRange(incomeSources, confirmedOccurrences, calStart, calEnd)

  // Authoritative paid status for bills:
  // If a bill has a paid-status entry for `ym` in billMonthStatus (typeof entry.paid === 'boolean'), use it.
  // Only fall back to normalized-name match against logged expense transactions in the month when there is no status entry.
  const evaluatedBills = monthBillRows.map(bill => {
    const statusEntry = billMonthStatus?.[bill.billId]?.[ym]
    const hasExplicitStatus =
      statusEntry !== null &&
      statusEntry !== undefined &&
      typeof statusEntry === 'object' &&
      typeof statusEntry.paid === 'boolean'

    const normBillName = (bill.name || '').toLowerCase().trim()
    const hasMatchingLoggedTx = Boolean(normBillName && allMonthLoggedExpenseNames.has(normBillName))

    const isSettled = hasExplicitStatus ? statusEntry.paid : hasMatchingLoggedTx
    const markedPaidButNotLogged = Boolean(hasExplicitStatus && statusEntry.paid === true && !hasMatchingLoggedTx)

    return {
      ...bill,
      isSettled,
      hasMatchingLoggedTx,
      markedPaidButNotLogged
    }
  })

  // Still expected bills: due > today and not settled
  const upcomingUnsettledBills = evaluatedBills.filter(
    b => b.date > resolvedTodayStr && !b.isSettled
  )
  const stillExpectedBillsBefore = upcomingUnsettledBills.reduce((sum, b) => sum + b.amount, 0)
  const stillExpectedBillsAfter = upcomingUnsettledBills
    .filter(b => !paidOffSet.has(b.billId))
    .reduce((sum, b) => sum + b.amount, 0)

  // Loan payment in Forecast After Loan: only applies if loan payment date in selectedMonth is > today
  const monthLoanDate = loanAmount > 0 ? projectLoanPaymentDateForMonth(ym, normalizedLoanDay) : null
  const stillExpectedLoanAfter =
    monthLoanDate && monthLoanDate > resolvedTodayStr ? loanAmount : 0

  // Still expected paychecks: scheduled > today and not confirmed
  // Also guard against double-counting if an unconfirmed future paycheck was already logged ahead on or after today
  const upcomingUnconfirmedPaychecks = monthIncomeRows.filter(
    p => p.date > resolvedTodayStr && !p.confirmed
  )
  const stillExpectedIncome = upcomingUnconfirmedPaychecks.reduce((sum, p) => sum + p.amount, 0)

  // Forecast totals (Actual so far + Already logged ahead + Still expected ahead)
  const forecastIncome = actualIncome + loggedAheadIncome + stillExpectedIncome
  const forecastExpensesBefore = actualExpenses + loggedAheadExpenses + stillExpectedBillsBefore
  const forecastNetBefore = forecastIncome - forecastExpensesBefore

  const forecastExpensesAfter =
    actualExpenses + loggedAheadExpenses + stillExpectedBillsAfter + stillExpectedLoanAfter
  const forecastNetAfter = forecastIncome - forecastExpensesAfter

  // Scheduled Plan (Before Loan) numbers from the existing Monthly Summary logic
  const activeBills = getActiveBillsForMonth(rawBills, selectedMonth)
  const monthExtraSpending = calculateExtraSpendingForRange(transactions, activeBills, calStart, calEnd)
  const scheduledIncome = monthIncomeRows.reduce((sum, r) => sum + r.amount, 0)
  const scheduledBillsBefore = monthBillRows.reduce((sum, b) => sum + b.amount, 0)
  const scheduledExpenses = scheduledBillsBefore + monthExtraSpending
  const scheduledNet = scheduledIncome - scheduledExpenses

  const differenceFromSchedule = {
    income: forecastIncome - scheduledIncome,
    expenses: forecastExpensesBefore - scheduledExpenses,
    net: forecastNetBefore - scheduledNet
  }

  // Items to check:
  // 1. Bills due <= today with !isSettled (unpaid & unlogged)
  // 2. Bills marked paid in billMonthStatus with no matching logged transaction in the month ("Marked paid but not logged")
  // 3. Scheduled paychecks <= today that haven't been confirmed
  const itemsToCheck = []

  for (const bill of evaluatedBills) {
    if (bill.markedPaidButNotLogged) {
      itemsToCheck.push({
        id: `check-paid-unlogged-${bill.billId}-${bill.date}`,
        type: 'bill_paid_unlogged',
        label: 'Marked paid but not logged',
        name: bill.name,
        date: bill.date,
        amount: bill.amount
      })
    } else if (bill.date <= resolvedTodayStr && !bill.isSettled) {
      itemsToCheck.push({
        id: `check-bill-unpaid-${bill.billId}-${bill.date}`,
        type: 'bill_unpaid',
        label: 'Bill due with no logged payment',
        name: bill.name,
        date: bill.date,
        amount: bill.amount
      })
    }
  }

  for (const pay of monthIncomeRows) {
    if (pay.date <= resolvedTodayStr && !pay.confirmed) {
      itemsToCheck.push({
        id: `check-income-unconfirmed-${pay.sourceId}-${pay.date}`,
        type: 'income_unconfirmed',
        label: 'Paycheck not yet confirmed',
        name: pay.name,
        date: pay.date,
        amount: pay.amount
      })
    }
  }

  return {
    month: ym,
    startDate: calStart,
    endDate: calEnd,
    todayDateStr: resolvedTodayStr,
    actualSoFar: {
      income: actualIncome,
      expenses: actualExpenses,
      net: actualNet
    },
    alreadyLoggedAhead: {
      income: loggedAheadIncome,
      expenses: loggedAheadExpenses
    },
    stillExpected: {
      income: stillExpectedIncome,
      billsBefore: stillExpectedBillsBefore,
      billsAfter: stillExpectedBillsAfter,
      loanAfter: stillExpectedLoanAfter
    },
    forecast: {
      income: forecastIncome,
      before: {
        expenses: forecastExpensesBefore,
        net: forecastNetBefore
      },
      after: {
        expenses: forecastExpensesAfter,
        net: forecastNetAfter
      }
    },
    scheduled: {
      income: scheduledIncome,
      expenses: scheduledExpenses,
      net: scheduledNet
    },
    differenceFromSchedule,
    itemsToCheck
  }
}

/**
 * Resolves a bill's monthly amount for a given YYYY-MM month (matching Bills.vue getBillAmount).
 * @param {Object} bill
 * @param {Object} billMonthStatus
 * @param {string} selectedMonth
 * @returns {number}
 */
export function resolveBillMonthlyAmount(bill, billMonthStatus = {}, selectedMonth = '') {
  if (!bill) return 0
  const ym = selectedMonth ? selectedMonth.slice(0, 7) : ''
  let resolvedRaw = bill.amount
  const perMonthAmt = ym ? billMonthStatus?.[bill.id]?.[ym]?.amount : undefined
  if (perMonthAmt !== null && perMonthAmt !== undefined && perMonthAmt !== '') {
    if (!(perMonthAmt === 0 && bill.amount !== 0 && bill.amount !== null && bill.amount !== undefined)) {
      resolvedRaw = perMonthAmt
    }
  }
  const num = Number(resolvedRaw)
  return !isNaN(num) && num > 0 ? Math.abs(num) : 0
}

/**
 * Computes the Loan Cost Comparison for checked debts in the Payoff Helper:
 * - Weighted average APR of checked debts (weighted by balance)
 * - Indicator of whether loan APR is lower, higher, or equal
 * - Standard loan amortization total interest when loanTermMonths > 0
 * - Remaining interest on checked debts at their current monthly payments (reusing simulateDebtPlan read-only)
 *
 * @param {{
 *   checkedDebts: Array,
 *   loanAmountReceived?: number|string,
 *   loanApr?: number|string,
 *   loanTermMonths?: number|string,
 *   currentMonthStr?: string|null
 * }} params
 */
export function calculateLoanCostComparison({
  checkedDebts = [],
  loanAmountReceived = 0,
  loanApr = null,
  loanTermMonths = null,
  currentMonthStr = null
} = {}) {
  const debtsWithBalance = (Array.isArray(checkedDebts) ? checkedDebts : []).filter(
    d => d && Number(d.balance) > 0
  )

  const totalCheckedBalance = debtsWithBalance.reduce((sum, d) => sum + Number(d.balance), 0)

  const weightedDebtApr =
    totalCheckedBalance > 0
      ? debtsWithBalance.reduce((sum, d) => sum + Number(d.balance) * (Number(d.apr) || 0), 0) /
        totalCheckedBalance
      : null

  const hasLoanAprInput = loanApr !== null && loanApr !== undefined && String(loanApr).trim() !== ''
  const parsedLoanApr = hasLoanAprInput ? Number(loanApr) : null
  const validLoanApr = parsedLoanApr !== null && !isNaN(parsedLoanApr) && parsedLoanApr >= 0 ? parsedLoanApr : null

  let aprComparison = null
  let aprDifference = null
  if (validLoanApr !== null && weightedDebtApr !== null) {
    const diff = validLoanApr - weightedDebtApr
    aprDifference = Math.abs(diff)
    if (Math.abs(diff) < 1e-6) {
      aprComparison = 'same'
    } else if (diff < 0) {
      aprComparison = 'lower'
    } else {
      aprComparison = 'higher'
    }
  }

  const parsedTerm = loanTermMonths !== null && loanTermMonths !== undefined && String(loanTermMonths).trim() !== ''
    ? parseInt(loanTermMonths, 10)
    : null
  const validTermMonths = parsedTerm !== null && !isNaN(parsedTerm) && parsedTerm > 0 ? parsedTerm : null

  const rawPrincipal = Number(loanAmountReceived)
  const principal = !isNaN(rawPrincipal) && rawPrincipal > 0 ? rawPrincipal : 0

  let loanEstimatedInterest = null
  let loanAmortizedMonthlyPayment = null

  if (validTermMonths !== null && validLoanApr !== null && principal > 0) {
    const monthlyRate = validLoanApr / 100 / 12
    if (monthlyRate === 0) {
      loanAmortizedMonthlyPayment = principal / validTermMonths
      loanEstimatedInterest = 0
    } else {
      const factor = Math.pow(1 + monthlyRate, validTermMonths)
      loanAmortizedMonthlyPayment = (principal * (monthlyRate * factor)) / (factor - 1)
      loanEstimatedInterest = loanAmortizedMonthlyPayment * validTermMonths - principal
    }
  }

  // Remaining interest on checked debts at their current monthly payments
  const startMonth =
    currentMonthStr && typeof currentMonthStr === 'string' && currentMonthStr.length >= 7
      ? currentMonthStr.slice(0, 7)
      : formatESTDateYYYYMMDD(getTodayEST()).slice(0, 7)

  let checkedDebtsCannotPayOff = false
  let checkedDebtsEstimatedInterest = null

  if (debtsWithBalance.length > 0) {
    let interestSum = 0
    for (const debt of debtsWithBalance) {
      const bal = Number(debt.balance) || 0
      const apr = Math.max(0, Number(debt.apr) || 0)
      const payment = Math.max(0, Number(debt.monthlyPayment) || 0)
      const firstMonthInterest = bal * (apr / 100 / 12)

      // If payment doesn't cover monthly interest (or payment is 0 on a positive balance), it never pays off
      if (payment <= 0 || (apr > 0 && payment <= firstMonthInterest)) {
        checkedDebtsCannotPayOff = true
        break
      }

      const sim = simulateDebtPlan({
        debts: [
          {
            id: debt.id || 'debt-item',
            name: debt.name || 'Debt',
            balance: bal,
            apr,
            minPayment: payment
          }
        ],
        income: [{ label: 'Current Payment', amount: payment, enabled: true }],
        expenses: [],
        startMonth,
        months: 600
      })

      if (!sim.debtFreeMonth) {
        checkedDebtsCannotPayOff = true
        break
      }

      interestSum += sim.totalInterest
    }

    if (!checkedDebtsCannotPayOff) {
      checkedDebtsEstimatedInterest = interestSum
    }
  }

  return {
    weightedDebtApr,
    loanApr: validLoanApr,
    aprComparison,
    aprDifference,
    loanTermMonths: validTermMonths,
    loanEstimatedInterest,
    loanAmortizedMonthlyPayment,
    checkedDebtsEstimatedInterest,
    checkedDebtsCannotPayOff
  }
}

/**
 * Builds the Payoff Helper data linking debts from debtPlanStore to active bills by normalized name,
 * sorting them by the requested sort mode, and computing the cash-flow & loan-balance summary
 * plus the loan cost comparison.
 *
 * @param {{
 *   debts: Array,
 *   activeBills: Array,
 *   billMonthStatus?: Object,
 *   selectedMonth?: string,
 *   paidOffBillIds?: Set|Array,
 *   selectedUnlinkedDebtIds?: Set|Array,
 *   loanAmountReceived?: number|string,
 *   monthlyLoanPayment?: number|string,
 *   loanApr?: number|string,
 *   loanTermMonths?: number|string,
 *   sortBy?: 'efficiency' | 'apr',
 *   currentMonthStr?: string|null
 * }} params
 */
export function buildPayoffHelperData({
  debts = [],
  activeBills = [],
  billMonthStatus = {},
  selectedMonth = '',
  paidOffBillIds = [],
  selectedUnlinkedDebtIds = [],
  loanAmountReceived = 0,
  monthlyLoanPayment = 0,
  loanApr = null,
  loanTermMonths = null,
  sortBy = 'efficiency',
  currentMonthStr = null
} = {}) {
  const debtList = Array.isArray(debts) ? debts : []
  const billList = Array.isArray(activeBills) ? activeBills : []
  const paidOffSet = paidOffBillIds instanceof Set ? paidOffBillIds : new Set(paidOffBillIds || [])
  const unlinkedSet =
    selectedUnlinkedDebtIds instanceof Set ? selectedUnlinkedDebtIds : new Set(selectedUnlinkedDebtIds || [])

  // Group active bills by normalized name so if several active bills share a debt's name, all are linked
  const billsByName = new Map()
  for (const bill of billList) {
    if (!bill || !bill.id) continue
    const normName = (bill.name || '').toLowerCase().trim()
    if (!normName) continue
    const monthlyAmt = resolveBillMonthlyAmount(bill, billMonthStatus, selectedMonth)
    if (!billsByName.has(normName)) {
      billsByName.set(normName, [])
    }
    billsByName.get(normName).push({
      ...bill,
      resolvedAmount: monthlyAmt
    })
  }

  const matchedBillIdsAcrossAllDebts = new Set()

  const enrichedDebts = debtList.map(debt => {
    const normName = (debt?.name || '').toLowerCase().trim()
    const matchedBills = normName && billsByName.has(normName) ? billsByName.get(normName) : []
    const matchedBillIds = matchedBills.map(b => b.id)
    matchedBillIds.forEach(id => matchedBillIdsAcrossAllDebts.add(id))

    const isLinkedToBill = matchedBillIds.length > 0
    const matchedBillsTotalAmount = matchedBills.reduce((sum, b) => sum + b.resolvedAmount, 0)
    const minPayment = Math.max(0, Number(debt?.minPayment) || 0)

    const monthlyPayment = isLinkedToBill
      ? (matchedBillsTotalAmount > 0 ? matchedBillsTotalAmount : minPayment)
      : minPayment

    const balance = Math.max(0, Number(debt?.balance) || 0)
    const apr = Math.max(0, Number(debt?.apr) || 0)
    // Guard against divide-by-zero when balance is $0
    const efficiencyRatio = balance > 0 ? monthlyPayment / balance : 0

    // Linked debt is checked if all its matched bills are in paidOffBillIds
    const isChecked = isLinkedToBill
      ? matchedBillIds.every(id => paidOffSet.has(id))
      : unlinkedSet.has(debt.id)

    return {
      id: debt.id,
      name: debt.name || 'Unnamed Debt',
      type: debt.type || 'Debt',
      balance,
      apr,
      minPayment,
      monthlyPayment,
      efficiencyRatio,
      isLinkedToBill,
      matchedBillIds,
      isChecked
    }
  })

  const sortedDebts = [...enrichedDebts].sort((a, b) => {
    if (sortBy === 'apr') {
      if (b.apr !== a.apr) return b.apr - a.apr
      return b.efficiencyRatio - a.efficiencyRatio
    }
    // Default: 'efficiency' (Most payment freed per $ of balance)
    if (b.efficiencyRatio !== a.efficiencyRatio) return b.efficiencyRatio - a.efficiencyRatio
    return b.apr - a.apr
  })

  const checkedDebts = enrichedDebts.filter(d => d.isChecked)

  // Selected balances = sum of balances of checked debts only (linked or not)
  const selectedBalancesTotal = checkedDebts.reduce((sum, d) => sum + d.balance, 0)

  // Monthly payments freed = sum of monthly amounts of ALL checked bills (shared paidOffBillIds)
  // + minPayment of checked debts that are NOT on the Bills page (never double-counting linked debts)
  const checkedBillsFreedTotal = billList
    .filter(b => b && paidOffSet.has(b.id))
    .reduce((sum, b) => sum + resolveBillMonthlyAmount(b, billMonthStatus, selectedMonth), 0)

  const checkedUnlinkedDebtsFreedTotal = enrichedDebts
    .filter(d => !d.isLinkedToBill && d.isChecked)
    .reduce((sum, d) => sum + d.minPayment, 0)

  const monthlyPaymentsFreed = checkedBillsFreedTotal + checkedUnlinkedDebtsFreedTotal

  // Count checked bills that have no matching debt in the Debt tab
  const checkedBillsWithoutDebtCount = billList.filter(
    b => b && paidOffSet.has(b.id) && !matchedBillIdsAcrossAllDebts.has(b.id)
  ).length

  const rawLoanAmount = Number(loanAmountReceived)
  const loanAmount = !isNaN(rawLoanAmount) && rawLoanAmount > 0 ? rawLoanAmount : 0

  const rawMonthlyLoanPay = Number(monthlyLoanPayment)
  const newLoanPayment = !isNaN(rawMonthlyLoanPay) && rawMonthlyLoanPay > 0 ? rawMonthlyLoanPay : 0

  const loanRemainingOrShort = loanAmount - selectedBalancesTotal
  const exceedsLoanAmount = selectedBalancesTotal > loanAmount

  const netMonthlyChange = monthlyPaymentsFreed - newLoanPayment
  const netWeeklyChange = (netMonthlyChange * 12) / 52

  const costComparison = calculateLoanCostComparison({
    checkedDebts,
    loanAmountReceived: loanAmount,
    loanApr,
    loanTermMonths,
    currentMonthStr
  })

  return {
    debts: sortedDebts,
    summary: {
      selectedBalancesTotal,
      loanAmount,
      loanRemainingOrShort,
      exceedsLoanAmount,
      monthlyPaymentsFreed,
      newLoanPayment,
      netMonthlyChange,
      netWeeklyChange,
      checkedBillsWithoutDebtCount
    },
    costComparison
  }
}
