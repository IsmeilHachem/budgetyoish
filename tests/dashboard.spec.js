import { calculateMonthlyTrends } from '../src/stores/dashboard'

describe('calculateMonthlyTrends', () => {
  const baseTransactions = [
    { date: '2025-04-01', amount: 1000, description: 'Paycheck' },
    { date: '2025-04-10', amount: -500, description: 'Rent' },
    { date: '2025-05-01', amount: 1200, description: 'Paycheck' },
    { date: '2025-05-10', amount: -800, description: 'Rent' },
    { date: '2025-05-15', amount: -200, description: 'Groceries' },
    { date: '2025-03-01', amount: 0, description: 'Zero' },
    { date: '2025-03-10', amount: -100, description: 'Misc' },
    { date: '2025-03-15', amount: 100, description: 'Gift' },
    { date: '2025-02-01', amount: -50, description: 'Misc' },
    { date: '2025-02-10', amount: 0, description: 'Zero' },
    { date: '2025-01-01', amount: 0, description: 'Zero' },
    { date: '2025-01-10', amount: 0, description: 'Zero' },
    { date: '2025-01-15', amount: 0, description: 'Zero' },
    { date: '2025-04-01', amount: 0, description: 'starting balance' },
  ]

  it('returns correct monthly trends for a 3-month range', () => {
    const range = { start: '2025-03', end: '2025-05' }
    const result = calculateMonthlyTrends(baseTransactions, range)
    expect(result.length).toBe(3)
    expect(result[0].date.getMonth()).toBe(2) // March
    expect(result[1].date.getMonth()).toBe(3) // April
    expect(result[2].date.getMonth()).toBe(4) // May
    expect(result[0].income).toBe(100)
    expect(result[0].expenses).toBe(-100)
    expect(result[1].income).toBe(1000)
    expect(result[1].expenses).toBe(-500)
    expect(result[2].income).toBe(1200)
    expect(result[2].expenses).toBe(-1000)
  })

  it('returns zeroes for months with no data', () => {
    const range = { start: '2025-01', end: '2025-02' }
    const result = calculateMonthlyTrends(baseTransactions, range)
    expect(result.length).toBe(2)
    expect(result[0].income).toBe(0)
    expect(result[0].expenses).toBe(0)
    expect(result[1].income).toBe(0)
    expect(result[1].expenses).toBe(-50)
  })

  it('returns empty array for invalid range', () => {
    const range = { start: '', end: '' }
    const result = calculateMonthlyTrends(baseTransactions, range)
    expect(result).toEqual([])
  })

  it('ignores starting balance transactions', () => {
    const range = { start: '2025-04', end: '2025-04' }
    const result = calculateMonthlyTrends(baseTransactions, range)
    expect(result[0].income).toBe(1000)
    expect(result[0].expenses).toBe(-500)
  })

  it('handles empty transactions', () => {
    const range = { start: '2025-01', end: '2025-03' }
    const result = calculateMonthlyTrends([], range)
    expect(result.length).toBe(3)
    expect(result.every(m => m.income === 0 && m.expenses === 0)).toBe(true)
  })
}) 