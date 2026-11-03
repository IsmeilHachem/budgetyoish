import { describe, it, expect } from 'vitest'

// Copied from Dashboard.vue for testing
function filterTransactionsByDateRange(transactions, range) {
  if (!range || !range.start || !range.end) return transactions;

  // Parse start as local date
  let [sy, sm, sd] = (range.start.length === 7 ? `${range.start}-01` : range.start).split('-').map(Number);
  let start = new Date(sy, sm - 1, sd);

  // Parse endExclusive as local date
  let endExclusive;
  if (range.end.length === 7) {
    let [ey, em] = range.end.split('-').map(Number);
    endExclusive = new Date(ey, em, 1); // first day of next month
  } else {
    let [ey, em, ed] = range.end.split('-').map(Number);
    endExclusive = new Date(ey, em - 1, ed + 1);
  }

  const filtered = transactions.filter(t => {
    const [ty, tm, td] = t.date.split('-').map(Number);
    const tDate = new Date(ty, tm - 1, td);
    console.log('tDate:', tDate, 'start:', start, 'endExclusive:', endExclusive);
    return tDate >= start && tDate < endExclusive;
  });
  return filtered;
}

describe('filterTransactionsByDateRange', () => {
  const transactions = [
    { id: 1, date: '2025-04-01', amount: -100 },
    { id: 2, date: '2025-04-15', amount: -200 },
    { id: 3, date: '2025-04-30', amount: -300 },
    { id: 4, date: '2025-05-01', amount: -400 },
    { id: 5, date: '2025-05-15', amount: -500 },
    { id: 6, date: '2025-06-01', amount: -600 },
  ]

  it('includes all transactions in April 2025 for range YYYY-MM', () => {
    const filtered = filterTransactionsByDateRange(transactions, { start: '2025-04', end: '2025-04' })
    expect(filtered.map(t => t.id)).toEqual([1, 2, 3])
  })

  it('includes all transactions in April and May 2025 for range YYYY-MM', () => {
    const filtered = filterTransactionsByDateRange(transactions, { start: '2025-04', end: '2025-05' })
    expect(filtered.map(t => t.id)).toEqual([1, 2, 3, 4, 5])
  })

  it('includes all transactions for full date range YYYY-MM-DD', () => {
    const filtered = filterTransactionsByDateRange(transactions, { start: '2025-04-01', end: '2025-05-15' })
    expect(filtered.map(t => t.id)).toEqual([1, 2, 3, 4, 5])
  })

  it('returns all transactions if no range is provided', () => {
    const filtered = filterTransactionsByDateRange(transactions, null)
    expect(filtered.length).toBe(transactions.length)
  })

  it('returns empty if no transactions in range', () => {
    const filtered = filterTransactionsByDateRange(transactions, { start: '2024-01', end: '2024-01' })
    expect(filtered.length).toBe(0)
  })
}) 