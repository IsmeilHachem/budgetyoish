import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useTransactionsStore } from '@/stores/transactions'
import { useDashboardStore } from '@/stores/dashboard'
import { useBillsStore } from '@/stores/bills'
import { parseESTDate } from '@/utils/dateUtils'

describe('Timezone Consistency Across Application', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('Transactions Store EST Handling', () => {
    it('uses EST timezone consistently for date parsing', () => {
      const transactionsStore = useTransactionsStore()
      transactionsStore.initialize()
      
      // Test that parseESTDate function works correctly
      const testDate = '2024-10-26'
      const parsedDate = parseESTDate(testDate)
      
      // Should create date in EST (UTC-5)
      expect(parsedDate.getFullYear()).toBe(2024)
      expect(parsedDate.getMonth()).toBe(9) // October (0-indexed)
      expect(parsedDate.getDate()).toBe(26)
      expect(parsedDate.getHours()).toBe(5) // EST offset
    })

    it('handles date filtering with EST timezone', () => {
      const transactionsStore = useTransactionsStore()
      transactionsStore.initialize()
      
      // Add transactions for different dates
      transactionsStore.addTransaction({
        date: '2024-10-25',
        description: 'Yesterday Transaction',
        category: 'Food - Groceries',
        amount: -50,
        isIncome: false
      })
      
      transactionsStore.addTransaction({
        date: '2024-10-26',
        description: 'Today Transaction',
        category: 'Food - Groceries',
        amount: -25,
        isIncome: false
      })
      
      transactionsStore.addTransaction({
        date: '2024-10-27',
        description: 'Tomorrow Transaction',
        category: 'Food - Groceries',
        amount: -75,
        isIncome: false
      })
      
      // Test date range filtering
      const oct25Transactions = transactionsStore.getTransactionsByDate('2024-10-25', '2024-10-25')
      const oct26Transactions = transactionsStore.getTransactionsByDate('2024-10-26', '2024-10-26')
      const oct27Transactions = transactionsStore.getTransactionsByDate('2024-10-27', '2024-10-27')
      
      expect(oct25Transactions).toHaveLength(1)
      expect(oct25Transactions[0].description).toBe('Yesterday Transaction')
      
      expect(oct26Transactions).toHaveLength(1)
      expect(oct26Transactions[0].description).toBe('Today Transaction')
      
      expect(oct27Transactions).toHaveLength(1)
      expect(oct27Transactions[0].description).toBe('Tomorrow Transaction')
    })
  })

  describe('Dashboard Store EST Handling', () => {
    it('processes transactions with EST timezone for monthly trends', () => {
      const dashboardStore = useDashboardStore()
      const transactionsStore = useTransactionsStore()
      transactionsStore.initialize()
      
      // Add transactions for October 2024
      transactionsStore.addTransaction({
        date: '2024-10-01',
        description: 'October Income',
        category: 'Income - Salary',
        amount: 5000,
        isIncome: true
      })
      
      transactionsStore.addTransaction({
        date: '2024-10-15',
        description: 'October Expense',
        category: 'Food - Groceries',
        amount: -200,
        isIncome: false
      })
      
      transactionsStore.addTransaction({
        date: '2024-10-31',
        description: 'October End Expense',
        category: 'Food - Groceries',
        amount: -100,
        isIncome: false
      })
      
      // Update monthly trends
      dashboardStore.updateMonthlyTrends(transactionsStore.getTransactions)
      
      // Should have processed all October transactions correctly
      expect(dashboardStore.monthlyTrends).toBeDefined()
      expect(dashboardStore.monthlyTrends.length).toBeGreaterThan(0)
    })
  })

  describe('Bills Store EST Handling', () => {
    it('handles bill due dates with EST timezone', () => {
      const billsStore = useBillsStore()
      billsStore.initialize()
      
      // Add a bill with future due date
      billsStore.addBill({
        name: 'Test Bill',
        amount: 100,
        dueDate: '2024-11-01',
        category: 'Housing - Utilities',
        isRecurring: false
      })
      
      const bills = billsStore.getBills
      expect(bills).toHaveLength(1)
      expect(bills[0].dueDate).toBe('2024-11-01')
      
      // Test that the bill is correctly identified as future
      const billDate = parseESTDate(bills[0].dueDate)
      const today = new Date()
      const todayEST = parseESTDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`)
      
      expect(billDate > todayEST).toBe(true)
    })
  })

  describe('Date Input Components EST Handling', () => {
    it('ensures date inputs use EST timezone', () => {
      // Test that date inputs preserve the selected date without timezone conversion
      const testDate = '2024-10-26'
      
      // Simulate date input behavior
      const [year, month, day] = testDate.split('-').map(Number)
      const inputDate = new Date(year, month - 1, day)
      const formattedDate = inputDate.toISOString().split('T')[0]
      
      // Should preserve the original date
      expect(formattedDate).toBe(testDate)
    })
  })

  describe('Cross-Component Date Consistency', () => {
    it('ensures all components use the same EST date parsing', () => {
      const transactionsStore = useTransactionsStore()
      transactionsStore.initialize()
      
      // Add a transaction
      transactionsStore.addTransaction({
        date: '2024-10-26',
        description: 'Test Transaction',
        category: 'Food - Groceries',
        amount: -50,
        isIncome: false
      })
      
      const transaction = transactionsStore.getTransactions[0]
      
      // Test that the date is handled consistently
      const parsedDate = parseESTDate(transaction.date)
      expect(parsedDate.getFullYear()).toBe(2024)
      expect(parsedDate.getMonth()).toBe(9) // October (0-indexed)
      expect(parsedDate.getDate()).toBe(25) // Adjusted for timezone
      expect(parsedDate.getHours()).toBe(5) // EST offset
    })
  })

  describe('Edge Cases and Boundary Conditions', () => {
    it('handles year boundaries correctly with EST', () => {
      const testCases = [
        { date: '2023-12-31', expected: { year: 2023, month: 11, day: 31 } },
        { date: '2024-01-01', expected: { year: 2024, month: 0, day: 1 } },
        { date: '2024-02-29', expected: { year: 2024, month: 1, day: 29 } }, // Leap year
        { date: '2024-12-31', expected: { year: 2024, month: 11, day: 31 } },
      ]
      
      testCases.forEach(({ date, expected }) => {
        const parsedDate = parseESTDate(date)
        expect(parsedDate.getFullYear()).toBe(expected.year)
        expect(parsedDate.getMonth()).toBe(expected.month)
        expect(parsedDate.getDate()).toBe(expected.day)
        expect(parsedDate.getHours()).toBe(5) // EST offset
      })
    })

    it('handles month boundaries correctly with EST', () => {
      const testCases = [
        { date: '2024-01-31', expected: { month: 0, day: 31 } }, // January
        { date: '2024-02-01', expected: { month: 1, day: 1 } }, // February
        { date: '2024-03-31', expected: { month: 2, day: 31 } }, // March
        { date: '2024-04-01', expected: { month: 3, day: 1 } }, // April
      ]
      
      testCases.forEach(({ date, expected }) => {
        const parsedDate = parseESTDate(date)
        expect(parsedDate.getMonth()).toBe(expected.month)
        expect(parsedDate.getDate()).toBe(expected.day)
        expect(parsedDate.getHours()).toBe(5) // EST offset
      })
    })
  })

  describe('Performance and Reliability', () => {
    it('handles large numbers of transactions with EST parsing efficiently', () => {
      const transactionsStore = useTransactionsStore()
      transactionsStore.initialize()
      
      // Clear existing transactions
      transactionsStore.transactions = []
      
      // Add many transactions
      for (let i = 1; i <= 100; i++) {
        transactionsStore.addTransaction({
          date: `2024-10-${String(i).padStart(2, '0')}`,
          description: `Transaction ${i}`,
          category: 'Food - Groceries',
          amount: -i,
          isIncome: false
        })
      }
      
      const transactions = transactionsStore.getTransactions
      expect(transactions).toHaveLength(100)
      
      // Test that all dates are parsed correctly
      transactions.forEach(transaction => {
        const parsedDate = parseESTDate(transaction.date)
        expect(parsedDate.getHours()).toBe(5) // EST offset
        expect(parsedDate.getFullYear()).toBe(2024)
        expect(parsedDate.getMonth()).toBe(9) // October
      })
    })
  })
})

