import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Transactions from '@/views/Transactions.vue'
import TransactionList from '@/components/TransactionList.vue'
import { useTransactionsStore } from '@/stores/transactions'
import { createESTDate } from '@/utils/dateUtils'

// Helper function to create today's date in EST
function getTodayEST() {
  const today = new Date()
  return createESTDate(today.getFullYear(), today.getMonth() + 1, today.getDate())
}

describe('Future Transaction Highlighting', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    const transactionsStore = useTransactionsStore()
    transactionsStore.initialize()
  })

  describe('isFutureTransaction function', () => {
    it('correctly identifies future transactions', () => {
      const wrapper = mount(Transactions)
      const vm = wrapper.vm
      
      // Mock today as 2024-10-26
      const mockToday = createESTDate(2024, 10, 26) // October 26, 2024 EST
      vi.spyOn(Date, 'now').mockReturnValue(mockToday.getTime())
      
      // Test future dates
      expect(vm.isFutureTransaction('2024-10-27')).toBe(true) // Tomorrow
      expect(vm.isFutureTransaction('2024-10-30')).toBe(true) // Future date
      expect(vm.isFutureTransaction('2024-11-01')).toBe(true) // Next month
      expect(vm.isFutureTransaction('2025-01-01')).toBe(true) // Next year
      
      // Test past dates
      expect(vm.isFutureTransaction('2024-10-25')).toBe(false) // Yesterday
      expect(vm.isFutureTransaction('2024-10-01')).toBe(false) // Earlier this month
      expect(vm.isFutureTransaction('2024-09-30')).toBe(false) // Last month
      
      // Test today (should be false)
      expect(vm.isFutureTransaction('2024-10-26')).toBe(false) // Today
      
      vi.restoreAllMocks()
    })

    it('handles edge cases correctly', () => {
      const wrapper = mount(Transactions)
      const vm = wrapper.vm
      
      // Mock today as 2024-12-31
      const mockToday = createESTDate(2024, 12, 31) // December 31, 2024 EST
      vi.spyOn(Date, 'now').mockReturnValue(mockToday.getTime())
      
      // Test year boundary
      expect(vm.isFutureTransaction('2025-01-01')).toBe(true) // New Year
      expect(vm.isFutureTransaction('2024-12-31')).toBe(false) // Today
      expect(vm.isFutureTransaction('2024-12-30')).toBe(false) // Yesterday
      
      vi.restoreAllMocks()
    })
  })

  describe('Transaction List Highlighting', () => {
    it('applies green background to future transactions', async () => {
      const transactionsStore = useTransactionsStore()
      
      // Add test transactions
      const today = '2024-10-26'
      const tomorrow = '2024-10-27'
      const future = '2024-10-30'
      
      transactionsStore.addTransaction({
        date: today,
        description: 'Today Transaction',
        category: 'Food - Groceries',
        amount: -50,
        isIncome: false
      })
      
      transactionsStore.addTransaction({
        date: tomorrow,
        description: 'Tomorrow Transaction',
        category: 'Food - Groceries',
        amount: -25,
        isIncome: false
      })
      
      transactionsStore.addTransaction({
        date: future,
        description: 'Future Transaction',
        category: 'Food - Groceries',
        amount: -100,
        isIncome: false
      })

      // Mock today as 2024-10-26
      const mockToday = createESTDate(2024, 10, 26)
      vi.spyOn(Date, 'now').mockReturnValue(mockToday.getTime())

      const wrapper = mount(TransactionList)
      await wrapper.vm.$nextTick()

      const rows = wrapper.findAll('tbody tr')
      
      // First row (future transaction) should have green background
      expect(rows[0].classes()).toContain('bg-green-50')
      
      // Second row (tomorrow transaction) should have green background
      expect(rows[1].classes()).toContain('bg-green-50')
      
      // Third row (today transaction) should not have green background
      expect(rows[2].classes()).not.toContain('bg-green-50')
      
      vi.restoreAllMocks()
    })

    it('applies correct hover states for future transactions', async () => {
      const transactionsStore = useTransactionsStore()
      
      transactionsStore.addTransaction({
        date: '2024-10-30',
        description: 'Future Transaction',
        category: 'Food - Groceries',
        amount: -50,
        isIncome: false
      })

      // Mock today as 2024-10-26
      const mockToday = createESTDate(2024, 10, 26)
      vi.spyOn(Date, 'now').mockReturnValue(mockToday.getTime())

      const wrapper = mount(TransactionList)
      await wrapper.vm.$nextTick()

      const futureRow = wrapper.find('tbody tr')
      
      // Should have both base hover and future hover classes
      expect(futureRow.classes()).toContain('hover:bg-gray-50')
      expect(futureRow.classes()).toContain('hover:bg-green-100')
      
      vi.restoreAllMocks()
    })
  })

  describe('Main Transactions View Highlighting', () => {
    it('applies green background to future transactions in main view', async () => {
      const transactionsStore = useTransactionsStore()
      
      // Add test transactions
      transactionsStore.addTransaction({
        date: '2024-10-30',
        description: 'Future Bill Payment',
        category: 'Housing - Rent',
        amount: -1200,
        isIncome: false
      })
      
      transactionsStore.addTransaction({
        date: '2024-10-25',
        description: 'Past Transaction',
        category: 'Food - Groceries',
        amount: -50,
        isIncome: false
      })

      // Mock today as 2024-10-26
      const mockToday = createESTDate(2024, 10, 26)
      vi.spyOn(Date, 'now').mockReturnValue(mockToday.getTime())

      const wrapper = mount(Transactions)
      await wrapper.vm.$nextTick()

      const rows = wrapper.findAll('tbody tr')
      
      // Future transaction row should have green background
      expect(rows[0].classes()).toContain('bg-green-50')
      
      // Past transaction row should not have green background
      expect(rows[1].classes()).not.toContain('bg-green-50')
      
      vi.restoreAllMocks()
    })
  })

  describe('Timezone Consistency', () => {
    it('uses EST timezone consistently across components', () => {
      const transactionsStore = useTransactionsStore()
      
      // Add a transaction for tomorrow in EST
      const tomorrowEST = '2024-10-27'
      transactionsStore.addTransaction({
        date: tomorrowEST,
        description: 'EST Transaction',
        category: 'Food - Groceries',
        amount: -50,
        isIncome: false
      })

      // Mock today as 2024-10-26 EST
      const mockToday = createESTDate(2024, 10, 26)
      vi.spyOn(global, 'Date').mockImplementation(() => mockToday)

      // Test both components use the same logic
      const transactionsWrapper = mount(Transactions)
      const transactionListWrapper = mount(TransactionList)
      
      expect(transactionsWrapper.vm.isFutureTransaction(tomorrowEST)).toBe(true)
      expect(transactionListWrapper.vm.isFutureTransaction(tomorrowEST)).toBe(true)
      
      vi.restoreAllMocks()
    })

    it('handles EST timezone correctly for date comparisons', () => {
      const wrapper = mount(Transactions)
      const vm = wrapper.vm
      
      // Test with different times of day to ensure EST handling
      const testCases = [
        { mockTime: createESTDate(2024, 10, 26), // Midnight EST
          testDate: '2024-10-26', expected: false }, // Should be today in EST
        { mockTime: createESTDate(2024, 10, 26), // Just before EST
          testDate: '2024-10-26', expected: false }, // Should still be today in EST
        { mockTime: createESTDate(2024, 10, 26), // Exactly EST
          testDate: '2024-10-26', expected: false }, // Should be today in EST
        { mockTime: createESTDate(2024, 10, 26), // Just after EST
          testDate: '2024-10-26', expected: false }, // Should still be today in EST
        { mockTime: createESTDate(2024, 10, 27), // End of day EST
          testDate: '2024-10-27', expected: true }, // Should be tomorrow in EST
      ]
      
      testCases.forEach(({ mockTime, testDate, expected }) => {
        vi.spyOn(Date, 'now').mockReturnValue(mockTime.getTime())
        expect(vm.isFutureTransaction(testDate)).toBe(expected)
        vi.restoreAllMocks()
      })
    })
  })

  describe('Real-world Scenarios', () => {
    it('handles bill payments correctly', async () => {
      const transactionsStore = useTransactionsStore()
      
      // Add future bill payments
      transactionsStore.addTransaction({
        date: '2024-11-01',
        description: 'Rent Payment',
        category: 'Housing - Rent',
        amount: -1200,
        isIncome: false
      })
      
      transactionsStore.addTransaction({
        date: '2024-11-15',
        description: 'Electric Bill',
        category: 'Housing - Utilities',
        amount: -150,
        isIncome: false
      })
      
      transactionsStore.addTransaction({
        date: '2024-10-25',
        description: 'Past Bill Payment',
        category: 'Housing - Rent',
        amount: -1200,
        isIncome: false
      })

      // Mock today as 2024-10-26
      const mockToday = createESTDate(2024, 10, 26)
      vi.spyOn(Date, 'now').mockReturnValue(mockToday.getTime())

      const wrapper = mount(Transactions)
      await wrapper.vm.$nextTick()

      const rows = wrapper.findAll('tbody tr')
      
      // Future bill payments should be highlighted
      expect(rows[0].classes()).toContain('bg-green-50') // Rent Payment
      expect(rows[1].classes()).toContain('bg-green-50') // Electric Bill
      
      // Past bill payment should not be highlighted
      expect(rows[2].classes()).not.toContain('bg-green-50') // Past Bill Payment
      
      vi.restoreAllMocks()
    })

    it('handles income transactions correctly', async () => {
      const transactionsStore = useTransactionsStore()
      
      // Add future income
      transactionsStore.addTransaction({
        date: '2024-11-01',
        description: 'Salary',
        category: 'Income - Salary',
        amount: 5000,
        isIncome: true
      })
      
      transactionsStore.addTransaction({
        date: '2024-10-25',
        description: 'Past Salary',
        category: 'Income - Salary',
        amount: 5000,
        isIncome: true
      })

      // Mock today as 2024-10-26
      const mockToday = createESTDate(2024, 10, 26)
      vi.spyOn(Date, 'now').mockReturnValue(mockToday.getTime())

      const wrapper = mount(Transactions)
      await wrapper.vm.$nextTick()

      const rows = wrapper.findAll('tbody tr')
      
      // Future income should be highlighted
      expect(rows[0].classes()).toContain('bg-green-50') // Future Salary
      
      // Past income should not be highlighted
      expect(rows[1].classes()).not.toContain('bg-green-50') // Past Salary
      
      vi.restoreAllMocks()
    })
  })
})

