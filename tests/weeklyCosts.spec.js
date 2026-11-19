import { describe, it, expect } from 'vitest'
import {
  getPayWeeksForMonth,
  projectBillsForDateRange,
  projectIncomeForDateRange,
  projectLoanPaymentDateForMonth,
  buildMonthlyPayWeekPlan,
  buildTrueCountSummary,
  filterExtraSpendingTransactions,
  calculateExtraSpendingForRange,
  calculateMonthlyCategoryExtraSpending,
  buildPayoffHelperData,
  calculateLoanCostComparison
} from '../src/utils/weeklyCosts'

describe('weeklyCosts helper (Pay Weeks, Actual Extra Spending, Backdated Income, True Count & Payoff Helper)', () => {
  it('generates Friday-to-Thursday pay weeks starting from the Friday on or before the 1st so every day of the month is covered', () => {
    const weeksNov = getPayWeeksForMonth('2026-11')
    expect(weeksNov).toEqual([
      { weekIndex: 1, startDate: '2026-10-30', endDate: '2026-11-05' },
      { weekIndex: 2, startDate: '2026-11-06', endDate: '2026-11-12' },
      { weekIndex: 3, startDate: '2026-11-13', endDate: '2026-11-19' },
      { weekIndex: 4, startDate: '2026-11-20', endDate: '2026-11-26' },
      { weekIndex: 5, startDate: '2026-11-27', endDate: '2026-12-03' }
    ])

    const weeksMay = getPayWeeksForMonth('2026-05')
    expect(weeksMay[0]).toEqual({ weekIndex: 1, startDate: '2026-05-01', endDate: '2026-05-07' })
    expect(weeksMay[weeksMay.length - 1]).toEqual({ weekIndex: 5, startDate: '2026-05-29', endDate: '2026-06-04' })
  })

  it('projects bills using getUpcomingBillRows: skips archived and deletedAfter bills, clamps day 31, keeps paid bills with paid=true, and flags null amounts with noAmount=true', () => {
    const rawBills = [
      { id: 'b-active', name: 'example utility bill', dueDate: '2026-01-31', amount: 150, category: 'Housing - Utilities', archived: false },
      { id: 'b-no-amt', name: 'example variable bill', dueDate: '2026-01-10', amount: null, category: 'Housing - Utilities', archived: false },
      { id: 'b-archived', name: 'example archived bill', dueDate: '2026-01-05', amount: 90, category: 'Personal - Shopping', archived: true },
      { id: 'b-deleted', name: 'example deleted bill', dueDate: '2026-01-12', amount: 75, category: 'Debt - Credit Cards', deletedAfter: '2026-11' }
    ]

    const billMonthStatus = {
      'b-active': {
        '2026-11': { paid: true, amount: 150 }
      }
    }

    const projected = projectBillsForDateRange(rawBills, billMonthStatus, '2026-11-01', '2026-11-30')
    expect(projected).toHaveLength(2)

    const variableBill = projected.find(b => b.billId === 'b-no-amt')
    expect(variableBill).toMatchObject({
      billId: 'b-no-amt',
      date: '2026-11-10',
      amount: 0,
      noAmount: true,
      paid: false
    })

    const clampedBill = projected.find(b => b.billId === 'b-active')
    expect(clampedBill).toMatchObject({
      billId: 'b-active',
      date: '2026-11-30',
      amount: 150,
      noAmount: false,
      paid: true
    })
  })

  it('projects backdated income schedules (weekly, biweekly, monthly) before their saved startDate while respecting endDate and without mutating sources', () => {
    const sources = [
      {
        id: 'inc-weekly',
        name: 'Example Weekly Pay',
        amount: 1000,
        category: 'Pay Day - Pay Day',
        frequency: 'weekly',
        startDate: '2026-11-06',
        days: [],
        endDate: null
      },
      {
        id: 'inc-biweekly',
        name: 'Example Biweekly Pay',
        amount: 1400,
        category: 'Pay Day - Pay Day',
        frequency: 'biweekly',
        startDate: '2026-11-13',
        days: [],
        endDate: null
      },
      {
        id: 'inc-monthly',
        name: 'Example Monthly Pay',
        amount: 2000,
        category: 'Income - Salary',
        frequency: 'monthly',
        startDate: '2026-11-15',
        days: [31],
        endDate: null
      },
      {
        id: 'inc-ended',
        name: 'Example Ended Pay',
        amount: 500,
        category: 'Income - Other',
        frequency: 'weekly',
        startDate: '2026-11-06',
        days: [],
        endDate: '2026-10-20'
      }
    ]

    const rows = projectIncomeForDateRange(sources, {}, '2026-10-30', '2026-11-05')

    expect(sources[0].startDate).toBe('2026-11-06')
    expect(sources[1].startDate).toBe('2026-11-13')
    expect(sources[2].startDate).toBe('2026-11-15')

    expect(rows.map(r => ({ sourceId: r.sourceId, date: r.date, amount: r.amount }))).toEqual([
      { sourceId: 'inc-biweekly', date: '2026-10-30', amount: 1400 },
      { sourceId: 'inc-weekly', date: '2026-10-30', amount: 1000 },
      { sourceId: 'inc-monthly', date: '2026-10-31', amount: 2000 }
    ])
  })

  it('excludes transactions matching an active bill name OR matching an active bill category from extra spending', () => {
    const activeBills = [
      { id: 'b-1', name: 'example electric', amount: 120, category: 'Housing - Utilities' },
      { id: 'b-2', name: 'example card a', amount: 90, category: 'Debt - Credit Cards' }
    ]

    const transactions = [
      { id: 't-1', date: '2026-11-02', description: 'Supermarket', category: 'Food - Groceries', amount: -150, isIncome: false },
      { id: 't-2', date: '2026-11-08', description: 'Coffee Shop', category: 'Food - Dining Out', amount: -25, isIncome: false },
      { id: 't-3', date: '2026-11-14', description: 'Fuel Station', category: 'Transportation - Gas', amount: -60, isIncome: false },
      { id: 't-4', date: '2026-11-03', description: '  Example Electric ', category: 'Miscellaneous - Other', amount: -120, isIncome: false },
      { id: 't-5', date: '2026-11-04', description: 'Unlisted Card Payment #999', category: 'Debt - Credit Cards', amount: -300, isIncome: false },
      { id: 't-6', date: '2026-11-01', description: 'Starting Balance', category: 'Miscellaneous - Other', amount: -500, isIncome: false },
      { id: 't-7', date: '2026-11-06', description: 'Example Paycheck', category: 'Pay Day - Pay Day', amount: 1000, isIncome: true }
    ]

    const filtered = filterExtraSpendingTransactions(transactions, activeBills, '2026-11-01', '2026-11-30')
    expect(filtered.map(t => t.id)).toEqual(['t-1', 't-2', 't-3'])

    expect(calculateExtraSpendingForRange(transactions, activeBills, '2026-10-30', '2026-11-05')).toBe(150)

    const monthlyCat = calculateMonthlyCategoryExtraSpending(transactions, activeBills, '2026-11')
    expect(monthlyCat.totalExtraSpending).toBe(235)
    expect(monthlyCat.highestCategory).toBe('Food')
    expect(monthlyCat.categories).toEqual([
      { name: 'Food', total: 175, transactionCount: 2, isHighest: true },
      { name: 'Transportation', total: 60, transactionCount: 1, isHighest: false }
    ])
  })

  it('builds Before and After weekly and calendar-month plans using actual logged extra spending per week and per month', () => {
    const rawBills = [
      { id: 'bill-rent', name: 'example rent', dueDate: '2026-01-01', amount: 800, category: 'Housing - Rent/Mortgage' },
      { id: 'bill-card-a', name: 'example card a', dueDate: '2026-01-08', amount: 200, category: 'Debt - Credit Cards' },
      { id: 'bill-card-b', name: 'example card b', dueDate: '2026-01-15', amount: 150, category: 'Debt - Credit Cards' }
    ]

    const incomeSources = [
      {
        id: 'inc-weekly',
        name: 'Example Paycheck',
        amount: 1000,
        category: 'Pay Day - Pay Day',
        frequency: 'weekly',
        startDate: '2026-11-06',
        days: [],
        endDate: null
      }
    ]

    const transactions = [
      { id: 'tx-w1', date: '2026-11-02', description: 'Groceries', category: 'Food - Groceries', amount: -90, isIncome: false },
      { id: 'tx-w2', date: '2026-11-09', description: 'Restaurant', category: 'Food - Dining Out', amount: -110, isIncome: false },
      { id: 'tx-debt', date: '2026-11-10', description: 'Other Card Payment', category: 'Debt - Credit Cards', amount: -400, isIncome: false }
    ]

    const plan = buildMonthlyPayWeekPlan({
      selectedMonth: '2026-11',
      rawBills,
      billMonthStatus: {},
      incomeSources,
      confirmedOccurrences: {},
      transactions,
      paidOffBillIds: new Set(['bill-card-a', 'bill-card-b']),
      monthlyLoanPayment: 250,
      loanPaymentDay: 15,
      todayDateStr: '2026-11-10'
    })

    const week1 = plan.payWeeks[0]
    expect(week1.incomeTotal).toBe(1000)
    expect(week1.extraSpending).toBe(90)
    expect(week1.isLoggedSoFar).toBe(false)
    expect(week1.before.leftAfterBills).toBe(200)
    expect(week1.before.leftAfterSpending).toBe(110)

    const week2 = plan.payWeeks[1]
    expect(week2.isLoggedSoFar).toBe(true)
    expect(week2.extraSpending).toBe(110)
    expect(week2.before.billsTotal).toBe(200)
    expect(week2.before.leftAfterSpending).toBe(690)
    expect(week2.after.billsPlusLoanTotal).toBe(0)
    expect(week2.after.leftAfterSpending).toBe(890)

    const ms = plan.monthlySummary
    expect(ms.incomeTotal).toBe(4000)
    expect(ms.extraSpendingTotal).toBe(200)
    expect(ms.before.billsTotal).toBe(1150)
    expect(ms.before.leftAfterSpending).toBe(2650)
    expect(ms.after.billsPlusLoanTotal).toBe(1050)
    expect(ms.after.leftAfterSpending).toBe(2750)
  })

  it('builds True Count for current, past, and future months with authoritative billMonthStatus, future-dated transactions, what-if ahead only, and items to check', () => {
    const rawBills = [
      // Due Nov 1 ($800) - logged in transactions
      { id: 'bill-1', name: 'example rent', dueDate: '2026-01-01', amount: 800, category: 'Housing - Rent/Mortgage' },
      // Due Nov 5 ($100) - marked paid in billMonthStatus, NOT logged in transactions -> "Marked paid but not logged"
      { id: 'bill-2', name: 'example phone', dueDate: '2026-01-05', amount: 100, category: 'Housing - Phone' },
      // Due Nov 8 ($60) - <= today (Nov 10), unpaid and unlogged -> "Bill due with no logged payment"
      { id: 'bill-3', name: 'example internet', dueDate: '2026-01-08', amount: 60, category: 'Housing - Internet' },
      // Due Nov 20 ($200) - > today, already logged ahead on Nov 18 (no status entry -> falls back to name match across full month, not double counted!)
      { id: 'bill-4', name: 'example car payment', dueDate: '2026-01-20', amount: 200, category: 'Transportation - Car Payment' },
      // Due Nov 22 ($150) - > today, has explicit status { paid: false } even though a transaction with same name exists (authoritative status wins!)
      { id: 'bill-5', name: 'example card alpha', dueDate: '2026-01-22', amount: 150, category: 'Debt - Credit Cards' },
      // Due Nov 25 ($90) - > today, unpaid & unlogged, checked in paidOffBillIds
      { id: 'bill-6', name: 'example card beta', dueDate: '2026-01-25', amount: 90, category: 'Debt - Credit Cards' }
    ]

    const billMonthStatus = {
      'bill-2': { '2026-11': { paid: true, amount: 100 } },
      'bill-5': { '2026-11': { paid: false, amount: 150 } }
    }

    const incomeSources = [
      {
        id: 'inc-1',
        name: 'Example Paycheck',
        amount: 1000,
        category: 'Pay Day - Pay Day',
        frequency: 'weekly',
        startDate: '2026-11-06',
        days: [],
        endDate: null
      }
    ]

    // Nov 6 paycheck is unconfirmed (<= today Nov 10 -> appears in itemsToCheck)
    const confirmedOccurrences = {}

    const transactions = [
      // Actual <= today (2026-11-10):
      { id: 't-inc', date: '2026-11-06', description: 'Example Paycheck', category: 'Pay Day - Pay Day', amount: 1000, isIncome: true },
      { id: 't-rent', date: '2026-11-01', description: 'Example Rent', category: 'Housing - Rent/Mortgage', amount: -800, isIncome: false },
      { id: 't-food', date: '2026-11-04', description: 'Groceries', category: 'Food - Groceries', amount: -120, isIncome: false },
      // Logged ahead (> today 2026-11-10):
      { id: 't-car-ahead', date: '2026-11-18', description: 'Example Car Payment', category: 'Transportation - Car Payment', amount: -200, isIncome: false }
    ]

    // Check bill-1 (due Nov 1 <= today) and bill-6 (due Nov 25 > today).
    // Loan payment of $300 due on day 28 (> today).
    const currentTc = buildTrueCountSummary({
      selectedMonth: '2026-11',
      rawBills,
      billMonthStatus,
      incomeSources,
      confirmedOccurrences,
      transactions,
      paidOffBillIds: new Set(['bill-1', 'bill-6']),
      monthlyLoanPayment: 300,
      loanPaymentDay: 28,
      todayDateStr: '2026-11-10'
    })

    // Actual so far (<= Nov 10): income = 1000, expenses = 800 + 120 = 920, net = 80
    expect(currentTc.actualSoFar).toEqual({ income: 1000, expenses: 920, net: 80 })
    // Already logged ahead (> Nov 10): expenses = 200 (t-car-ahead)
    expect(currentTc.alreadyLoggedAhead).toEqual({ income: 0, expenses: 200 })

    // Still expected ahead (> Nov 10):
    // - bill-4 (Nov 20, $200) is settled via name match against t-car-ahead -> NOT in stillExpected!
    // - bill-5 (Nov 22, $150) has explicit paid:false -> included ($150)
    // - bill-6 (Nov 25, $90) is unsettled -> included in Before ($90), removed in After (checked!)
    expect(currentTc.stillExpected.billsBefore).toBe(240) // 150 + 90
    expect(currentTc.stillExpected.billsAfter).toBe(150) // bill-6 removed, bill-1 was already <= today
    expect(currentTc.stillExpected.loanAfter).toBe(300) // day 28 > Nov 10
    expect(currentTc.stillExpected.income).toBe(3000) // Nov 13, 20, 27 paychecks

    // Forecast Before Loan: income = 1000 + 3000 = 4000; expenses = 920 + 200 + 240 = 1360; net = 2640
    expect(currentTc.forecast.income).toBe(4000)
    expect(currentTc.forecast.before).toEqual({ expenses: 1360, net: 2640 })
    // Forecast After Loan: expenses = 920 + 200 + 150 + 300 = 1570; net = 2430
    expect(currentTc.forecast.after).toEqual({ expenses: 1570, net: 2430 })

    // Scheduled Plan Before Loan: income = 4000, bills = 800+100+60+200+150+90 = 1400, extraSpending = 120 -> expenses = 1520, net = 2480
    expect(currentTc.scheduled).toEqual({ income: 4000, expenses: 1520, net: 2480 })
    expect(currentTc.differenceFromSchedule).toEqual({
      income: 0,
      expenses: 1360 - 1520, // -160 (because bill-2 $100 and bill-3 $60 <= today weren't logged)
      net: 2640 - 2480 // +160
    })

    // Items to check:
    // 1. bill-2: "Marked paid but not logged"
    // 2. bill-3: "Bill due with no logged payment"
    // 3. Nov 6 paycheck: "Paycheck not yet confirmed"
    expect(currentTc.itemsToCheck.map(i => ({ type: i.type, label: i.label, name: i.name }))).toEqual([
      { type: 'bill_paid_unlogged', label: 'Marked paid but not logged', name: 'example phone' },
      { type: 'bill_unpaid', label: 'Bill due with no logged payment', name: 'example internet' },
      { type: 'income_unconfirmed', label: 'Paycheck not yet confirmed', name: 'Example Paycheck' }
    ])

    // Past month test (selectedMonth = '2026-10' when todayDateStr = '2026-11-10'): Forecast === Actual
    const pastTc = buildTrueCountSummary({
      selectedMonth: '2026-10',
      rawBills,
      billMonthStatus: {},
      incomeSources,
      confirmedOccurrences: {},
      transactions: [
        { id: 'oct-inc', date: '2026-10-09', description: 'Paycheck', category: 'Pay Day - Pay Day', amount: 2000, isIncome: true },
        { id: 'oct-exp', date: '2026-10-12', description: 'Food', category: 'Food - Groceries', amount: -500, isIncome: false }
      ],
      paidOffBillIds: new Set(['bill-1']),
      monthlyLoanPayment: 300,
      loanPaymentDay: 15,
      todayDateStr: '2026-11-10'
    })
    expect(pastTc.actualSoFar).toEqual({ income: 2000, expenses: 500, net: 1500 })
    expect(pastTc.forecast.income).toBe(2000)
    expect(pastTc.forecast.before).toEqual({ expenses: 500, net: 1500 })
    expect(pastTc.forecast.after).toEqual({ expenses: 500, net: 1500 })

    // Future month test (selectedMonth = '2026-12' when todayDateStr = '2026-11-10'): Actual === 0, Forecast === Schedule
    const futureTc = buildTrueCountSummary({
      selectedMonth: '2026-12',
      rawBills: [{ id: 'b-dec', name: 'example rent', dueDate: '2026-01-01', amount: 800, category: 'Housing - Rent/Mortgage' }],
      billMonthStatus: {},
      incomeSources,
      confirmedOccurrences: {},
      transactions: [],
      paidOffBillIds: new Set(),
      monthlyLoanPayment: 0,
      loanPaymentDay: 1,
      todayDateStr: '2026-11-10'
    })
    expect(futureTc.actualSoFar).toEqual({ income: 0, expenses: 0, net: 0 })
    expect(futureTc.forecast.income).toBe(futureTc.scheduled.income)
    expect(futureTc.forecast.before.expenses).toBe(futureTc.scheduled.expenses)
    expect(futureTc.differenceFromSchedule).toEqual({ income: 0, expenses: 0, net: 0 })
  })

  it('matches debts to active bills, supports both sort modes, avoids double-counting freed payments, guards $0 balance, and warns when balances exceed loan amount', () => {
    const activeBills = [
      { id: 'bill-card-1', name: 'example card alpha', amount: 180, category: 'Debt - Credit Cards' },
      { id: 'bill-loan-1', name: 'example personal loan', amount: 300, category: 'Debt - Personal Loans' },
      { id: 'bill-util-1', name: 'example utility', amount: 100, category: 'Housing - Utilities' }
    ]

    const debts = [
      { id: 'd-1', name: 'Example Card Alpha', balance: 1800, apr: 19.99, minPayment: 60 },
      { id: 'd-2', name: 'Example Personal Loan', balance: 6000, apr: 26.5, minPayment: 300 },
      { id: 'd-3', name: 'Example Store Card', balance: 1000, apr: 15.0, minPayment: 150 },
      { id: 'd-zero', name: 'Example Paid Card', balance: 0, apr: 29.99, minPayment: 25 }
    ]

    const paidOffBillIds = new Set(['bill-card-1', 'bill-util-1'])
    const selectedUnlinkedDebtIds = new Set(['d-3'])

    const byEfficiency = buildPayoffHelperData({
      debts,
      activeBills,
      billMonthStatus: {},
      selectedMonth: '2026-11',
      paidOffBillIds,
      selectedUnlinkedDebtIds,
      loanAmountReceived: 2500,
      monthlyLoanPayment: 220,
      sortBy: 'efficiency',
      currentMonthStr: '2026-11'
    })

    expect(byEfficiency.debts.map(d => d.id)).toEqual(['d-3', 'd-1', 'd-2', 'd-zero'])
    expect(byEfficiency.debts.find(d => d.id === 'd-zero').efficiencyRatio).toBe(0)
    expect(byEfficiency.summary.selectedBalancesTotal).toBe(2800)
    expect(byEfficiency.summary.exceedsLoanAmount).toBe(true)
    expect(byEfficiency.summary.loanRemainingOrShort).toBe(-300)
    expect(byEfficiency.summary.checkedBillsWithoutDebtCount).toBe(1)
    expect(byEfficiency.summary.monthlyPaymentsFreed).toBe(430)
    expect(byEfficiency.summary.newLoanPayment).toBe(220)
    expect(byEfficiency.summary.netMonthlyChange).toBe(210)
    expect(byEfficiency.summary.netWeeklyChange).toBeCloseTo((210 * 12) / 52, 5)

    const byApr = buildPayoffHelperData({
      debts,
      activeBills,
      paidOffBillIds,
      selectedUnlinkedDebtIds,
      loanAmountReceived: 5000,
      monthlyLoanPayment: 220,
      sortBy: 'apr',
      currentMonthStr: '2026-11'
    })
    expect(byApr.debts.map(d => d.id)).toEqual(['d-zero', 'd-2', 'd-1', 'd-3'])
    expect(byApr.summary.exceedsLoanAmount).toBe(false)
    expect(byApr.summary.loanRemainingOrShort).toBe(2200)
  })

  it('calculates weighted average APR, lower/higher indicator, standard loan amortization (with >0% and 0% APR), and detects debts that do not pay off at current payment', () => {
    const checkedDebts = [
      { id: 'd-a', name: 'Example Debt A', balance: 1000, apr: 20, monthlyPayment: 100 },
      { id: 'd-b', name: 'Example Debt B', balance: 3000, apr: 24, monthlyPayment: 200 }
    ]
    // Weighted APR = (1000*20 + 3000*24) / 4000 = 92000 / 4000 = 23.0%

    // 1. Loan APR = 12% (< 23%), Term = 24 months, Principal = $4000
    const lowerComp = calculateLoanCostComparison({
      checkedDebts,
      loanAmountReceived: 4000,
      loanApr: 12,
      loanTermMonths: 24,
      currentMonthStr: '2026-11'
    })
    expect(lowerComp.weightedDebtApr).toBeCloseTo(23, 5)
    expect(lowerComp.aprComparison).toBe('lower')
    expect(lowerComp.aprDifference).toBeCloseTo(11, 5)
    expect(lowerComp.loanEstimatedInterest).toBeGreaterThan(0)
    expect(lowerComp.checkedDebtsCannotPayOff).toBe(false)
    expect(lowerComp.checkedDebtsEstimatedInterest).toBeGreaterThan(0)

    // 2. Loan APR = 0% (zero interest amortization) and higher APR test
    const zeroRateComp = calculateLoanCostComparison({
      checkedDebts,
      loanAmountReceived: 2400,
      loanApr: 0,
      loanTermMonths: 24,
      currentMonthStr: '2026-11'
    })
    expect(zeroRateComp.loanAmortizedMonthlyPayment).toBeCloseTo(100, 5)
    expect(zeroRateComp.loanEstimatedInterest).toBe(0)

    const higherComp = calculateLoanCostComparison({
      checkedDebts,
      loanAmountReceived: 4000,
      loanApr: 28,
      loanTermMonths: 24,
      currentMonthStr: '2026-11'
    })
    expect(higherComp.aprComparison).toBe('higher')
    expect(higherComp.aprDifference).toBeCloseTo(5, 5)

    // 3. Debt whose monthly payment ($15) does not cover monthly interest ($2000 * 24% / 12 = $40)
    const nonPayoffComp = calculateLoanCostComparison({
      checkedDebts: [
        { id: 'd-bad', name: 'Example Underwater Debt', balance: 2000, apr: 24, monthlyPayment: 15 }
      ],
      loanAmountReceived: 2000,
      loanApr: 10,
      loanTermMonths: 24,
      currentMonthStr: '2026-11'
    })
    expect(nonPayoffComp.checkedDebtsCannotPayOff).toBe(true)
    expect(nonPayoffComp.checkedDebtsEstimatedInterest).toBeNull()
  })

  it('clamps loan payment day of month for shorter months', () => {
    expect(projectLoanPaymentDateForMonth('2026-11', 31)).toBe('2026-11-30')
    expect(projectLoanPaymentDateForMonth('2026-02', 31)).toBe('2026-02-28')
  })
})
