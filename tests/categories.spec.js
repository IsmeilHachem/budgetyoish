import { describe, it, expect } from 'vitest'
import { parseESTDate } from '@/utils/dateUtils'

// Replicate the helper functions from Categories.vue
function getMonthTransactions(transactions, monthStr) {
  if (!Array.isArray(transactions) || !monthStr) return []
  const [year, month] = monthStr.split('-').map(Number)
  if (!year || !month) return []
  return transactions.filter(t => {
    const d = parseESTDate(t.date)
    return d.getUTCFullYear() === year && d.getUTCMonth() + 1 === month
  })
}

function getCategoryAmount(transactions, mainCategory, subcategory, monthStr) {
  const monthTx = getMonthTransactions(transactions, monthStr)
  return monthTx
    .filter(t => {
      if (!t.category) return false
      const parts = t.category.split(' - ')
      return parts[0] === mainCategory && parts[1] === subcategory
    })
    .reduce((sum, t) => sum + t.amount, 0)
}

function getCategoryTotal(transactions, mainCategory, monthStr) {
  const monthTx = getMonthTransactions(transactions, monthStr)
  return monthTx
    .filter(t => t.category && t.category.split(' - ')[0] === mainCategory)
    .reduce((sum, t) => sum + t.amount, 0)
}

describe('Categories Page Monthly Logic', () => {
  const tx = [
    { date: '2025-05-01', amount: -100, category: 'Food - Groceries' },
    { date: '2025-05-10', amount: -50, category: 'Food - Dining' },
    { date: '2025-05-15', amount: -20, category: 'Transport - Bus' },
    { date: '2025-04-01', amount: -200, category: 'Food - Groceries' },
    { date: '2025-04-10', amount: -30, category: 'Transport - Train' },
    { date: '2025-04-15', amount: -10, category: 'Transport - Bus' },
    { date: '2025-03-01', amount: -5, category: 'Misc - Gifts' },
  ]

  it('filters transactions by month correctly', () => {
    expect(getMonthTransactions(tx, '2025-05').length).toBe(3)
    expect(getMonthTransactions(tx, '2025-04').length).toBe(3)
    expect(getMonthTransactions(tx, '2025-03').length).toBe(1)
    expect(getMonthTransactions(tx, '2025-02').length).toBe(0)
  })

  it('gets category amount for a subcategory in a month', () => {
    expect(getCategoryAmount(tx, 'Food', 'Groceries', '2025-05')).toBe(-100)
    expect(getCategoryAmount(tx, 'Food', 'Groceries', '2025-04')).toBe(-200)
    expect(getCategoryAmount(tx, 'Transport', 'Bus', '2025-04')).toBe(-10)
    expect(getCategoryAmount(tx, 'Transport', 'Bus', '2025-05')).toBe(-20)
    expect(getCategoryAmount(tx, 'Misc', 'Gifts', '2025-03')).toBe(-5)
    expect(getCategoryAmount(tx, 'Food', 'Dining', '2025-05')).toBe(-50)
    expect(getCategoryAmount(tx, 'Food', 'Dining', '2025-04')).toBe(0)
  })

  it('gets total for a main category in a month', () => {
    expect(getCategoryTotal(tx, 'Food', '2025-05')).toBe(-150)
    expect(getCategoryTotal(tx, 'Food', '2025-04')).toBe(-200)
    expect(getCategoryTotal(tx, 'Transport', '2025-05')).toBe(-20)
    expect(getCategoryTotal(tx, 'Transport', '2025-04')).toBe(-40)
    expect(getCategoryTotal(tx, 'Misc', '2025-03')).toBe(-5)
    expect(getCategoryTotal(tx, 'Misc', '2025-05')).toBe(0)
  })

  it('handles empty transactions and invalid months', () => {
    expect(getMonthTransactions([], '2025-05')).toEqual([])
    expect(getCategoryAmount([], 'Food', 'Groceries', '2025-05')).toBe(0)
    expect(getCategoryTotal([], 'Food', '2025-05')).toBe(0)
    expect(getMonthTransactions(tx, '')).toEqual([])
    expect(getCategoryAmount(tx, 'Food', 'Groceries', '')).toBe(0)
    expect(getCategoryTotal(tx, 'Food', '')).toBe(0)
  })
}) 