import { describe, it, expect } from 'vitest'
import {
  parseTransactionsFromStorage,
  serializeTransactionsForStorage
} from '@/utils/transactionStorage'

describe('transactionStorage', () => {
  it('round-trips compressed payload', () => {
    const original = {
      transactions: [
        { id: '1', date: '2026-03-01', description: 'a', category: 'Food - Groceries', amount: -5, isIncome: false }
      ],
      initialized: true
    }
    const raw = serializeTransactionsForStorage(original)
    expect(raw).toContain('"v":1')
    const back = parseTransactionsFromStorage(raw)
    expect(back.transactions).toEqual(original.transactions)
    expect(back.initialized).toBe(true)
  })

  it('reads legacy uncompressed shape', () => {
    const legacy = JSON.stringify({
      transactions: [{ id: 'x', date: '2026-01-01', description: '', category: 'A - B', amount: 1, isIncome: true }],
      initialized: true
    })
    const back = parseTransactionsFromStorage(legacy)
    expect(back.transactions).toHaveLength(1)
    expect(back.transactions[0].id).toBe('x')
  })
})
