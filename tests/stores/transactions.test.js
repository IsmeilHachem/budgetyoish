import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useTransactionsStore } from '@/stores/transactions'
import { useCategoriesStore } from '@/stores/categories'

describe('Transactions Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    // Initialize categories store as it's a dependency
    const categoriesStore = useCategoriesStore()
    categoriesStore.initialize()
  })

  const sampleTransaction = {
    date: '2024-03-15',
    description: 'Grocery Shopping',
    category: 'Food - Groceries',
    amount: -50,
    isIncome: false
  }

  it('initializes with empty transactions', () => {
    const store = useTransactionsStore()
    store.initialize()
    expect(store.transactions).toEqual([])
  })

  it('adds a transaction correctly', () => {
    const store = useTransactionsStore()
    store.initialize()
    const result = store.addTransaction(sampleTransaction)
    expect(result).toBe(true)
    expect(store.transactions).toHaveLength(1)
    expect(store.transactions[0].description).toBe('Grocery Shopping')
  })

  it('validates transaction category before adding', () => {
    const store = useTransactionsStore()
    store.initialize()
    const invalidTransaction = {
      ...sampleTransaction,
      category: 'Invalid - Category'
    }
    const result = store.addTransaction(invalidTransaction)
    expect(result).toBe(false)
    expect(store.transactions).toHaveLength(0)
  })

  it('updates transaction amounts in categories store', () => {
    const store = useTransactionsStore()
    const categoriesStore = useCategoriesStore()
    store.initialize()
    
    store.addTransaction(sampleTransaction)
    expect(categoriesStore.getCategoryAmount('Food', 'Groceries')).toBe(-50)
  })

  it('deletes a transaction correctly', () => {
    const store = useTransactionsStore()
    store.initialize()
    
    const result = store.addTransaction(sampleTransaction)
    const transactionId = store.transactions[0].id
    
    expect(result).toBe(true)
    expect(store.transactions).toHaveLength(1)
    
    store.deleteTransaction(transactionId)
    expect(store.transactions).toHaveLength(0)
  })

  it('updates category amounts when deleting transactions', () => {
    const store = useTransactionsStore()
    const categoriesStore = useCategoriesStore()
    store.initialize()
    
    store.addTransaction(sampleTransaction)
    const transactionId = store.transactions[0].id
    
    expect(categoriesStore.getCategoryAmount('Food', 'Groceries')).toBe(-50)
    
    store.deleteTransaction(transactionId)
    expect(categoriesStore.getCategoryAmount('Food', 'Groceries')).toBe(0)
  })

  it('filters transactions by date range correctly', () => {
    const store = useTransactionsStore()
    store.initialize()
    
    // Add transactions with different dates
    store.addTransaction(sampleTransaction)
    store.addTransaction({
      ...sampleTransaction,
      date: '2024-01-15'
    })
    
    const startDate = '2024-03-01'
    const endDate = '2024-03-31'
    const filteredTransactions = store.getTransactionsByDate(startDate, endDate)
    
    expect(filteredTransactions).toHaveLength(1)
    expect(filteredTransactions[0].date).toBe('2024-03-15')
  })

  it('persists transactions to localStorage', () => {
    const store = useTransactionsStore()
    store.initialize()
    store.addTransaction(sampleTransaction)
    
    // Create new store instance to test persistence
    const newStore = useTransactionsStore()
    newStore.initialize()
    
    expect(newStore.transactions).toHaveLength(1)
    expect(newStore.transactions[0].description).toBe('Grocery Shopping')
  })
}) 