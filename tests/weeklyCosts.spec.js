import { describe, it, expect } from 'vitest'
import {
  getPayWeeksForMonth,
  projectBillsForDateRange,
  projectIncomeForDateRange,
  projectLoanPaymentDateForMonth,
  buildMonthlyPayWeekPlan,
  filterExtraSpendingTransactions,
  calculateExtraSpendingForRange,
  calculateMonthlyCategoryExtraSpending,
  buildPayoffHelperData
} from '../src/utils/weeklyCosts'

describe('weeklyCosts helper (Pay Weeks, Actual Extra Spending, Backdated Income & Payoff Helper)', () => {
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
        // Saved start date is Nov 6, but Pay Week 1 starts Oct 30
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
        // Saved start date is Nov 13 -> stepping back 14 days lands on Oct 30
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
        // Saved start date is Nov 15, projecting for Oct 30 - Nov 5 where day is 31 -> Oct 31
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

    // Original source startDate must not be mutated
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
      // Included: non-bill name and non-bill category
      { id: 't-1', date: '2026-11-02', description: 'Supermarket', category: 'Food - Groceries', amount: -150, isIncome: false },
      { id: 't-2', date: '2026-11-08', description: 'Coffee Shop', category: 'Food - Dining Out', amount: -25, isIncome: false },
      { id: 't-3', date: '2026-11-14', description: 'Fuel Station', category: 'Transportation - Gas', amount: -60, isIncome: false },
      // Excluded by exact normalized bill name (even if logged under a different category)
      { id: 't-4', date: '2026-11-03', description: '  Example Electric ', category: 'Miscellaneous - Other', amount: -120, isIncome: false },
      // Excluded by matching an active bill's category ('Debt - Credit Cards'), even though description doesn't match 'example card a'
      { id: 't-5', date: '2026-11-04', description: 'Unlisted Card Payment #999', category: 'Debt - Credit Cards', amount: -300, isIncome: false },
      // Excluded: Starting Balance & Income
      { id: 't-6', date: '2026-11-01', description: 'Starting Balance', category: 'Miscellaneous - Other', amount: -500, isIncome: false },
      { id: 't-7', date: '2026-11-06', description: 'Example Paycheck', category: 'Pay Day - Pay Day', amount: 1000, isIncome: true }
    ]

    const filtered = filterExtraSpendingTransactions(transactions, activeBills, '2026-11-01', '2026-11-30')
    expect(filtered.map(t => t.id)).toEqual(['t-1', 't-2', 't-3'])

    // Week 1 (Oct 30 - Nov 5): only t-1 ($150)
    expect(calculateExtraSpendingForRange(transactions, activeBills, '2026-10-30', '2026-11-05')).toBe(150)

    // Monthly category breakdown for 2026-11: Food ($175) and Transportation ($60), no division by weeks
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
        // Even if saved with Nov 6 startDate, Week 1 (Oct 30) still receives $1000
        startDate: '2026-11-06',
        days: [],
        endDate: null
      }
    ]

    const transactions = [
      // In Week 1 (Oct 30 – Nov 5): $90 groceries on Nov 2
      { id: 'tx-w1', date: '2026-11-02', description: 'Groceries', category: 'Food - Groceries', amount: -90, isIncome: false },
      // In Week 2 (Nov 6 – Nov 12): $110 dining out on Nov 9
      { id: 'tx-w2', date: '2026-11-09', description: 'Restaurant', category: 'Food - Dining Out', amount: -110, isIncome: false },
      // Bill category match -> excluded from extra spending
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

    // Week 1 (Oct 30 – Nov 5): before today (2026-11-10), so isLoggedSoFar = false
    const week1 = plan.payWeeks[0]
    expect(week1.incomeTotal).toBe(1000)
    expect(week1.extraSpending).toBe(90)
    expect(week1.isLoggedSoFar).toBe(false)
    expect(week1.before.leftAfterBills).toBe(200) // 1000 - 800
    expect(week1.before.leftAfterSpending).toBe(110) // 200 - 90

    // Week 2 (Nov 6 – Nov 12): includes today (2026-11-10), so isLoggedSoFar = true
    const week2 = plan.payWeeks[1]
    expect(week2.isLoggedSoFar).toBe(true)
    expect(week2.extraSpending).toBe(110)
    expect(week2.before.billsTotal).toBe(200)
    expect(week2.before.leftAfterSpending).toBe(690) // 1000 - 200 - 110
    expect(week2.after.billsPlusLoanTotal).toBe(0)
    expect(week2.after.leftAfterSpending).toBe(890) // 1000 - 0 - 110

    // Calendar month summary (Nov 1 – Nov 30): actual extra spending = 90 + 110 = 200
    const ms = plan.monthlySummary
    expect(ms.incomeTotal).toBe(4000)
    expect(ms.extraSpendingTotal).toBe(200)
    expect(ms.before.billsTotal).toBe(1150)
    expect(ms.before.leftAfterSpending).toBe(2650) // 4000 - 1150 - 200
    expect(ms.after.billsPlusLoanTotal).toBe(1050) // 800 + 250 loan
    expect(ms.after.leftAfterSpending).toBe(2750) // 4000 - 1050 - 200
  })

  it('matches debts to active bills, supports both sort modes, avoids double-counting freed payments, guards $0 balance, and warns when balances exceed loan amount', () => {
    const activeBills = [
      { id: 'bill-card-1', name: 'example card alpha', amount: 180, category: 'Debt - Credit Cards' },
      { id: 'bill-loan-1', name: 'example personal loan', amount: 300, category: 'Debt - Personal Loans' },
      { id: 'bill-util-1', name: 'example utility', amount: 100, category: 'Housing - Utilities' }
    ]

    const debts = [
      // Linked to bill-card-1: balance $1800, bill amount $180 -> ratio = 0.10, APR = 19.99%
      { id: 'd-1', name: 'Example Card Alpha', balance: 1800, apr: 19.99, minPayment: 60 },
      // Linked to bill-loan-1: balance $6000, bill amount $300 -> ratio = 0.05, APR = 26.50%
      { id: 'd-2', name: 'Example Personal Loan', balance: 6000, apr: 26.5, minPayment: 300 },
      // Unlinked debt (not on Bills page): balance $1000, minPayment $150 -> ratio = 0.15, APR = 15.00%
      { id: 'd-3', name: 'Example Store Card', balance: 1000, apr: 15.0, minPayment: 150 },
      // $0 balance debt -> guards against divide-by-zero (efficiencyRatio = 0)
      { id: 'd-zero', name: 'Example Paid Card', balance: 0, apr: 29.99, minPayment: 25 }
    ]

    // Check bill-card-1 (linked to d-1), bill-util-1 (not in Debt tab), and d-3 (unlinked debt)
    const paidOffBillIds = new Set(['bill-card-1', 'bill-util-1'])
    const selectedUnlinkedDebtIds = new Set(['d-3'])

    // 1. Default sort: 'efficiency' (Most payment freed per $ of balance)
    // d-3 (0.15) -> d-1 (0.10) -> d-2 (0.05) -> d-zero (0)
    const byEfficiency = buildPayoffHelperData({
      debts,
      activeBills,
      billMonthStatus: {},
      selectedMonth: '2026-11',
      paidOffBillIds,
      selectedUnlinkedDebtIds,
      loanAmountReceived: 2500,
      monthlyLoanPayment: 220,
      sortBy: 'efficiency'
    })

    expect(byEfficiency.debts.map(d => d.id)).toEqual(['d-3', 'd-1', 'd-2', 'd-zero'])
    expect(byEfficiency.debts.find(d => d.id === 'd-zero').efficiencyRatio).toBe(0)

    // Selected balances = checked debts only: d-1 ($1800) + d-3 ($1000) = $2800 (bill-util-1 has no debt balance)
    expect(byEfficiency.summary.selectedBalancesTotal).toBe(2800)
    // Loan amount is $2500 -> exceedsLoanAmount = true, short by $300 (-300)
    expect(byEfficiency.summary.exceedsLoanAmount).toBe(true)
    expect(byEfficiency.summary.loanRemainingOrShort).toBe(-300)
    // 1 checked bill (bill-util-1) has no matching debt on the Debt tab
    expect(byEfficiency.summary.checkedBillsWithoutDebtCount).toBe(1)

    // Monthly payments freed = checked bills ($180 + $100 = $280) + checked unlinked debts ($150) = $430 (d-1 is NOT counted twice)
    expect(byEfficiency.summary.monthlyPaymentsFreed).toBe(430)
    expect(byEfficiency.summary.newLoanPayment).toBe(220)
    expect(byEfficiency.summary.netMonthlyChange).toBe(210) // 430 - 220
    expect(byEfficiency.summary.netWeeklyChange).toBeCloseTo((210 * 12) / 52, 5)

    // 2. Sort by 'apr' (Highest APR)
    // d-zero (29.99) -> d-2 (26.5) -> d-1 (19.99) -> d-3 (15.0)
    const byApr = buildPayoffHelperData({
      debts,
      activeBills,
      paidOffBillIds,
      selectedUnlinkedDebtIds,
      loanAmountReceived: 5000,
      monthlyLoanPayment: 220,
      sortBy: 'apr'
    })
    expect(byApr.debts.map(d => d.id)).toEqual(['d-zero', 'd-2', 'd-1', 'd-3'])
    expect(byApr.summary.exceedsLoanAmount).toBe(false)
    expect(byApr.summary.loanRemainingOrShort).toBe(2200) // 5000 - 2800
  })

  it('clamps loan payment day of month for shorter months', () => {
    expect(projectLoanPaymentDateForMonth('2026-11', 31)).toBe('2026-11-30')
    expect(projectLoanPaymentDateForMonth('2026-02', 31)).toBe('2026-02-28')
  })
})
