import { describe, it, expect } from 'vitest'
import { simulateDebtPlan, savingsAt, addMonths, STRATEGIES } from '../src/utils/debtPayoff'

const samplePlan = () => ({
  startMonth: '2026-10',
  months: 31, // through April 2029
  strategy: STRATEGIES.avalanche,
  shortfallDebtId: 'card_b',
  debts: [
    { id: 'card_a', name: 'Credit Card A', balance: 8000, apr: 20, minPayment: 150 },
    { id: 'card_b', name: 'Credit Card B', balance: 6000, apr: 24, minPayment: 100 },
    { id: 'card_c', name: 'Credit Card C', balance: 9000, apr: 25, minPayment: 100 },
    { id: 'card_d', name: 'Credit Card D', balance: 1500, apr: 30, minPayment: 50 },
    { id: 'card_e', name: 'Credit Card E', balance: 300, apr: 30, minPayment: 40 },
    { id: 'loan_a', name: 'Loan A', balance: 10000, apr: 18, minPayment: 300 },
    { id: 'loan_b', name: 'Loan B', balance: 30000, apr: 12, minPayment: 800 }
  ],
  income: [
    { label: 'Job income', amount: 4000, end: '2027-08' },
    { label: 'New job income', amount: 7000, start: '2027-08' },
    { label: 'Tax savings', amount: 200, start: '2027-11' },
    { label: 'Side income A', amount: 500, start: '2027-01' },
    { label: 'Side income B', amount: 1500, start: '2028-03' }
  ],
  expenses: [
    { label: 'Rent', amount: 2000, end: '2027-11' },
    { label: 'Reduced rent', amount: 500, start: '2027-11' },
    { label: 'Living expenses', amount: 1200 },
    { label: 'Tuition', amount: 1000, start: '2027-03', end: '2028-03' }
  ]
})

describe('addMonths', () => {
  it('rolls over years', () => {
    expect(addMonths('2026-11', 3)).toBe('2027-02')
    expect(addMonths('2027-01', -1)).toBe('2026-12')
  })
})

describe('simulateDebtPlan', () => {
  it('matches the baseline plan', () => {
    const result = simulateDebtPlan(samplePlan())
    expect(result.debtFreeMonth).toBe('2028-09')
    expect(savingsAt(result, '2029-04')).toBeGreaterThan(56000)
    expect(savingsAt(result, '2029-04')).toBeLessThan(60000)
  })

  it('pays off highest-APR debts first and the smaller balance is paid first on an APR tie', () => {
    const { payoffOrder } = simulateDebtPlan(samplePlan())
    const order = payoffOrder.map(d => d.id)
    expect(order.indexOf('card_e')).toBeLessThan(order.indexOf('card_d'))
    expect(order.indexOf('card_e')).toBeLessThan(order.indexOf('card_c'))
    expect(order.indexOf('card_c')).toBeLessThan(order.indexOf('card_b'))
    expect(order.at(-1)).toBe('loan_b')
  })

  it('puts monthly shortfalls on the chosen card so debt grows before the new job', () => {
    const result = simulateDebtPlan(samplePlan())
    const nov = result.rows.find(r => r.month === '2026-11')
    expect(nov.shortfall).toBeGreaterThan(0)
    expect(result.peakDebt.month).toBe('2027-07')
  })

  it('never lets balances go negative', () => {
    const result = simulateDebtPlan(samplePlan())
    for (const row of result.rows) {
      for (const bal of Object.values(row.balances)) expect(bal).toBeGreaterThanOrEqual(0)
    }
  })

  it('snowball clears the smallest balance first', () => {
    const plan = { ...samplePlan(), strategy: STRATEGIES.snowball }
    const { payoffOrder } = simulateDebtPlan(plan)
    expect(payoffOrder[0].id).toBe('card_e')
  })

  it('a disabled income line is ignored (scenario toggle)', () => {
    const baseline = simulateDebtPlan(samplePlan())
    const plan = samplePlan()
    plan.income.find(i => i.label === 'Side income B').enabled = false
    const result = simulateDebtPlan(plan)
    expect(result.debtFreeMonth > baseline.debtFreeMonth).toBe(true)
  })

  it('avalanche pays no more interest than snowball', () => {
    const a = simulateDebtPlan(samplePlan())
    const s = simulateDebtPlan({ ...samplePlan(), strategy: STRATEGIES.snowball })
    expect(a.totalInterest).toBeLessThanOrEqual(s.totalInterest)
  })
})
