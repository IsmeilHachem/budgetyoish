import { describe, it, expect } from 'vitest'
import { calculateMonthlyTrends } from '../src/stores/dashboard.js'

describe('calculateMonthlyTrends', () => {
  const transactions = [
    { date: '2025-04-01', amount: 1000, description: 'Paycheck' },
    { date: '2025-04-15', amount: -200, description: 'Groceries' },
    { date: '2025-04-30', amount: -300, description: 'Debt' },
    { date: '2025-05-01', amount: 1200, description: 'Paycheck' },
    { date: '2025-05-10', amount: -400, description: 'Rent' },
    { date: '2025-06-01', amount: 1300, description: 'Paycheck' },
    { date: '2025-06-15', amount: -500, description: 'Utilities' },
    { date: '2025-06-20', amount: -100, description: 'Groceries' },
    { date: '2025-06-30', amount: -200, description: 'Debt' },
    { date: '2025-07-01', amount: 1400, description: 'Paycheck' },
    { date: '2025-07-10', amount: -600, description: 'Rent' },
    { date: '2025-07-15', amount: -150, description: 'Groceries' },
    { date: '2025-07-31', amount: -250, description: 'Debt' },
    { date: '2025-08-01', amount: 1500, description: 'Paycheck' },
    { date: '2025-08-10', amount: -700, description: 'Rent' },
    { date: '2025-08-15', amount: -200, description: 'Groceries' },
    { date: '2025-08-31', amount: -300, description: 'Debt' },
    { date: '2025-09-01', amount: 1600, description: 'Paycheck' },
    { date: '2025-09-10', amount: -800, description: 'Rent' },
    { date: '2025-09-15', amount: -250, description: 'Groceries' },
    { date: '2025-09-30', amount: -350, description: 'Debt' },
  ]

  it('generates correct monthly trends for all data', () => {
    const result = calculateMonthlyTrends(transactions)
    expect(result.length).toBe(6)
    expect(result[0].income).toBe(1000)
    expect(result[0].expenses).toBe(-500)
    expect(result[1].income).toBe(1200)
    expect(result[1].expenses).toBe(-400)
    expect(result[2].income).toBe(1300)
    expect(result[2].expenses).toBe(-800)
    expect(result[3].income).toBe(1400)
    expect(result[3].expenses).toBe(-1000)
    expect(result[4].income).toBe(1500)
    expect(result[4].expenses).toBe(-1200)
    expect(result[5].income).toBe(1600)
    expect(result[5].expenses).toBe(-1400)
  })

  it('respects date range (May to July)', () => {
    const result = calculateMonthlyTrends(transactions, { start: '2025-05', end: '2025-07' })
    expect(result.length).toBe(3)
    expect(result[0].income).toBe(1200)
    expect(result[0].expenses).toBe(-400)
    expect(result[1].income).toBe(1300)
    expect(result[1].expenses).toBe(-800)
    expect(result[2].income).toBe(1400)
    expect(result[2].expenses).toBe(-1000)
  })

  it('returns empty months for range if no transactions', () => {
    const result = calculateMonthlyTrends([], { start: '2025-01', end: '2025-02' })
    expect(result.length).toBe(2) // Jan and Feb 2025
    expect(result[0].income).toBe(0)
    expect(result[1].income).toBe(0)
  })

  it('ignores starting balance', () => {
    const txs = [
      { date: '2025-04-01', amount: 1000, description: 'starting balance' },
      { date: '2025-04-15', amount: -200, description: 'Groceries' }
    ]
    const result = calculateMonthlyTrends(txs)
    expect(result[0].income).toBe(0)
    expect(result[0].expenses).toBe(-200)
  })

  it('returns all months in a multi-month range, even if some are empty', () => {
    const txs = [
      { date: '2024-12-01', amount: 100, description: 'Paycheck' },
      { date: '2025-02-01', amount: 200, description: 'Paycheck' },
      { date: '2025-05-01', amount: 300, description: 'Paycheck' }
    ]
    const result = calculateMonthlyTrends(txs, { start: '2024-11', end: '2025-05' })
    // Should include Nov 2024 through May 2025 (7 months)
    expect(result.length).toBe(7)
    expect(result[0].date.getMonth()).toBe(10) // Nov
    expect(result[1].income).toBe(100) // Dec
    expect(result[2].income).toBe(0)   // Jan
    expect(result[3].income).toBe(200) // Feb
    expect(result[6].income).toBe(300) // May
  })
}) 