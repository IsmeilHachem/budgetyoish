import { describe, it, expect } from 'vitest'
import { parseESTDate } from '@/utils/dateUtils'

// Helper function to filter transactions by date range in EST
function filterTransactionsByDateRange(transactions, range) {
  if (!range || !range.start || !range.end) return transactions

  // Parse start as EST date
  let [sy, sm, sd] = (range.start.length === 7 ? `${range.start}-01` : range.start).split('-').map(Number)
  let start = parseESTDate(`${sy}-${sm}-${sd || 1}`)

  // Parse end as EST date
  let endExclusive
  if (range.end.length === 7) {
    let [ey, em] = range.end.split('-').map(Number)
    endExclusive = parseESTDate(`${ey}-${em + 1}-1`) // First day of next month
  } else {
    let [ey, em, ed] = range.end.split('-').map(Number)
    endExclusive = parseESTDate(`${ey}-${em}-${ed + 1}`)
  }

  return transactions.filter(t => {
    const tDate = parseESTDate(t.date)
    return tDate >= start && tDate < endExclusive
  })
}

// Helper function to search transactions
function searchTransactions(transactions, searchTerm) {
  if (!searchTerm) return transactions
  const term = searchTerm.toLowerCase()
  return transactions.filter(t => 
    t.description?.toLowerCase().includes(term) ||
    t.category?.toLowerCase().includes(term) ||
    t.amount.toString().includes(term)
  )
}

// Helper function to sort transactions
function sortTransactions(transactions, sortBy = 'date', sortOrder = 'desc') {
  return [...transactions].sort((a, b) => {
    let comparison = 0
    switch (sortBy) {
      case 'date': {
        const dateDiff = parseESTDate(a.date) - parseESTDate(b.date)
        if (dateDiff !== 0) {
          comparison = dateDiff
        } else {
          // Same date: sort by ID
          comparison = a.id - b.id
        }
        break
      }
      case 'amount':
        comparison = a.amount - b.amount
        break
      case 'description':
        comparison = (a.description || '').localeCompare(b.description || '')
        break
      case 'category':
        comparison = (a.category || '').localeCompare(b.category || '')
        break
      default:
        comparison = 0
    }
    return sortOrder === 'desc' ? -comparison : comparison
  })
}

// Helper: Precompute running totals for all transactions (full list, EST, by date and ID)
function computeFullRunningTotalsMap(transactions) {
  const allTx = [...transactions].sort((a, b) => {
    const dateA = parseESTDate(a.date)
    const dateB = parseESTDate(b.date)
    if (dateA.getTime() !== dateB.getTime()) {
      return dateA - dateB
    }
    return a.id - b.id
  })
  let total = 0
  const map = {}
  allTx.forEach(tx => {
    const amount = tx.isIncome ? Math.abs(tx.amount) : -Math.abs(tx.amount)
    total += amount
    map[tx.id] = total
  })
  return map
}

// Helper: Calculate running totals for a given list (filtered & sorted)
function computeDisplayedRunningTotals(transactions) {
  let total = 0
  return transactions.map(t => {
    total += t.amount
    return { ...t, runningTotal: total }
  })
}

describe('Transactions Page', () => {
  const transactions = [
    { id: 1, date: '2025-04-01', description: 'Grocery Shopping', category: 'Food - Groceries', amount: 100, isIncome: false },
    { id: 2, date: '2025-04-15', description: 'Salary', category: 'Income - Salary', amount: 3000, isIncome: true },
    { id: 3, date: '2025-04-30', description: 'Rent', category: 'Housing - Rent', amount: 1500, isIncome: false },
    { id: 4, date: '2025-05-01', description: 'Grocery Shopping', category: 'Food - Groceries', amount: 120, isIncome: false },
    { id: 5, date: '2025-05-15', description: 'Salary', category: 'Income - Salary', amount: 3000, isIncome: true },
    { id: 6, date: '2025-05-31', description: 'Rent', category: 'Housing - Rent', amount: 1500, isIncome: false }
  ]

  describe('Date Filtering', () => {
    it('filters transactions by month in EST', () => {
      const filtered = filterTransactionsByDateRange(transactions, { start: '2025-04', end: '2025-04' })
      expect(filtered.map(t => t.id)).toEqual([1, 2, 3])
    })

    it('filters transactions by date range in EST', () => {
      const filtered = filterTransactionsByDateRange(transactions, { start: '2025-04-15', end: '2025-05-15' })
      expect(filtered.map(t => t.id)).toEqual([2, 3, 4, 5])
    })

    it('returns all transactions if no range provided', () => {
      const filtered = filterTransactionsByDateRange(transactions, null)
      expect(filtered.length).toBe(transactions.length)
    })
  })

  describe('Search Functionality', () => {
    it('searches by description', () => {
      const results = searchTransactions(transactions, 'Grocery')
      expect(results.map(t => t.id)).toEqual([1, 4])
    })

    it('searches by category', () => {
      const results = searchTransactions(transactions, 'Salary')
      expect(results.map(t => t.id)).toEqual([2, 5])
    })

    it('searches by amount', () => {
      const results = searchTransactions(transactions, '1500')
      expect(results.map(t => t.id)).toEqual([3, 6])
    })

    it('returns all transactions if no search term', () => {
      const results = searchTransactions(transactions, '')
      expect(results.length).toBe(transactions.length)
    })
  })

  describe('Sorting', () => {
    const transactions = [
      { id: 1, amount: 3000, date: '2025-04-01', description: 'Grocery Shopping' },
      { id: 2, amount: 1500, date: '2025-04-02', description: 'Salary' },
      { id: 3, amount: 100, date: '2025-04-03', description: 'Rent' },
      { id: 4, amount: 120, date: '2025-04-04', description: 'Dining Out' },
      { id: 5, amount: 3000, date: '2025-04-05', description: 'Bonus' },
      { id: 6, amount: -1500, date: '2025-04-06', description: 'Mortgage' }
    ];
    it('sorts by date in descending order', () => {
      const sorted = sortTransactions(transactions, 'date', 'desc');
      expect(sorted[0].date).toBe('2025-04-06');
      expect(sorted[sorted.length - 1].date).toBe('2025-04-01');
    });
    it('sorts by date in ascending order', () => {
      const sorted = sortTransactions(transactions, 'date', 'asc');
      expect(sorted[0].date).toBe('2025-04-01');
      expect(sorted[sorted.length - 1].date).toBe('2025-04-06');
    });
    it('sorts by amount in descending order', () => {
      const sorted = sortTransactions(transactions, 'amount', 'desc');
      expect(sorted[0].amount).toBe(3000);
      expect(sorted[sorted.length - 1].amount).toBe(-1500);
    });
    it('sorts by description alphabetically', () => {
      const sorted = sortTransactions(transactions, 'description', 'asc');
      expect(sorted[0].description).toBe('Bonus');
      expect(sorted[sorted.length - 1].description).toBe('Salary');
    });
  })

  describe('Transaction sorting within same date', () => {
    const transactions = [
      { id: 1, amount: 10, date: '2025-04-08' },
      { id: 2, amount: 20, date: '2025-04-08' },
      { id: 3, amount: 30, date: '2025-04-08' },
      { id: 4, amount: 40, date: '2025-04-09' },
      { id: 5, amount: 50, date: '2025-04-10' }
    ]
    it('sorts by date descending, then by ID descending within same date', () => {
      const sorted = sortTransactions(transactions, 'date', 'desc')
      // 2025-04-10 (id 5), 2025-04-09 (id 4), 2025-04-08 (id 3, 2, 1)
      expect(sorted.map(t => t.id)).toEqual([5, 4, 3, 2, 1])
    })
    it('sorts by date ascending, then by ID ascending within same date', () => {
      const sorted = sortTransactions(transactions, 'date', 'asc')
      // 2025-04-08 (id 1, 2, 3), 2025-04-09 (id 4), 2025-04-10 (id 5)
      expect(sorted.map(t => t.id)).toEqual([1, 2, 3, 4, 5])
    })
  })

  describe('Running Total', () => {
    it('computes correct running totals for all transactions', () => {
      const map = computeFullRunningTotalsMap(transactions)
      expect(map[1]).toBe(-100)
      expect(map[2]).toBe(2900)
      expect(map[3]).toBe(1400)
      expect(map[4]).toBe(1280)
      expect(map[5]).toBe(4280)
      expect(map[6]).toBe(2780)
    })
    it('filtered transactions show correct running total from full list', () => {
      const map = computeFullRunningTotalsMap(transactions)
      // Filtered: only income
      const filtered = transactions.filter(t => t.isIncome)
      const runningTotals = filtered.map(t => map[t.id])
      expect(runningTotals).toEqual([2900, 4280])
    })
  })

  describe('Displayed Running Total and Amount Sign', () => {
    const transactions = [
      { id: 1, date: '2025-04-01', description: 'Grocery', category: 'Food', amount: -100 },
      { id: 2, date: '2025-04-02', description: 'Paycheck', category: 'Income', amount: 2000 },
      { id: 3, date: '2025-04-03', description: 'Rent', category: 'Housing', amount: -800 },
      { id: 4, date: '2025-04-04', description: 'Gift', category: 'Income', amount: 100 }
    ]

    it('ensures income is positive and expense is negative', () => {
      expect(transactions[0].amount).toBeLessThan(0)
      expect(transactions[1].amount).toBeGreaterThan(0)
      expect(transactions[2].amount).toBeLessThan(0)
      expect(transactions[3].amount).toBeGreaterThan(0)
    })

    it('computes running total for displayed (filtered & sorted) list', () => {
      // Sort by date ascending
      const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date))
      const displayed = computeDisplayedRunningTotals(sorted)
      expect(displayed.map(t => t.runningTotal)).toEqual([
        -100, 1900, 1100, 1200
      ])
    })

    it('computes running total for filtered list', () => {
      // Only income
      const filtered = transactions.filter(t => t.amount > 0)
      const displayed = computeDisplayedRunningTotals(filtered)
      expect(displayed.map(t => t.runningTotal)).toEqual([2000, 2100])
    })

    it('computes running total for reversed list', () => {
      const reversed = [...transactions].reverse()
      const displayed = computeDisplayedRunningTotals(reversed)
      expect(displayed.map(t => t.runningTotal)).toEqual([100, -700, 1300, 1200])
    })
  })

  describe('Running Total Calculation in Displayed Order', () => {
    const transactions = [
      { id: 1, amount: 100, date: '2025-04-01', description: 'A' },
      { id: 2, amount: 200, date: '2025-04-02', description: 'B' },
      { id: 3, amount: -50, date: '2025-04-03', description: 'C' },
      { id: 4, amount: 300, date: '2025-04-04', description: 'D' },
      { id: 5, amount: -25, date: '2025-04-05', description: 'E' }
    ];

    it('computes running total for ascending date order', () => {
      const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
      const displayed = computeDisplayedRunningTotals(sorted);
      expect(displayed.map(t => t.runningTotal)).toEqual([
        100, 300, 250, 550, 525
      ]);
    });

    it('computes running total for descending date order', () => {
      const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
      const displayed = computeDisplayedRunningTotals(sorted);
      expect(displayed.map(t => t.runningTotal)).toEqual([
        -25, 275, 225, 425, 525
      ]);
    });

    it('computes running total for arbitrary order', () => {
      const shuffled = [transactions[2], transactions[0], transactions[4], transactions[1], transactions[3]];
      const displayed = computeDisplayedRunningTotals(shuffled);
      expect(displayed.map(t => t.runningTotal)).toEqual([
        -50, 50, 25, 225, 525
      ]);
    });
  })

  describe('Smart Running Total Calculation', () => {
    const transactions = [
      { id: 1, amount: 100, date: '2025-04-01', description: 'A' },
      { id: 2, amount: 200, date: '2025-04-02', description: 'B' },
      { id: 3, amount: -50, date: '2025-04-03', description: 'C' },
      { id: 4, amount: 300, date: '2025-04-04', description: 'D' },
      { id: 5, amount: -25, date: '2025-04-05', description: 'E' }
    ];

    function computeChronologicalRunningTotals(transactions) {
      // Oldest to newest
      const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
      let total = 0;
      const map = {};
      sorted.forEach(t => {
        total += t.amount;
        map[t.id] = total;
      });
      return map;
    }

    function computeDescendingRunningTotals(transactions) {
      // Newest to oldest
      const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
      let total = 0;
      sorted.forEach(t => { total += t.amount; });
      // Now walk backwards
      const desc = [...sorted].reverse();
      let running = total;
      const result = [];
      desc.forEach(t => {
        result.push(running);
        running -= t.amount;
      });
      return result;
    }

    it('computes running total for ascending date order (chronological)', () => {
      const map = computeChronologicalRunningTotals(transactions);
      const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
      expect(sorted.map(t => map[t.id])).toEqual([
        100, 300, 250, 550, 525
      ]);
    });

    it('computes running total for descending date order (reverse chronological)', () => {
      const desc = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
      const expected = computeDescendingRunningTotals(transactions);
      expect(desc.map((t, i) => expected[i])).toEqual([
        525, 550, 250, 300, 100
      ]);
    });
  })
}) 