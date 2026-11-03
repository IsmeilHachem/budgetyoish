import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Dashboard from '@/views/Dashboard.vue'
import { useTransactionsStore } from '@/stores/transactions'
import { useCategoriesStore } from '@/stores/categories'
import { useBillsStore } from '@/stores/bills'

describe('Dashboard Component', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // Initialize required stores
    const categoriesStore = useCategoriesStore()
    const transactionsStore = useTransactionsStore()
    const billsStore = useBillsStore()
    
    categoriesStore.initialize()
    transactionsStore.initialize()
    billsStore.initialize()
  })

  const sampleTransaction = {
    date: '2024-03-15',
    description: 'Grocery Shopping',
    category: 'Food - Groceries',
    amount: -50,
    isIncome: false
  }

  it('renders dashboard header', () => {
    const wrapper = mount(Dashboard)
    expect(wrapper.find('h1').text()).toBe('Financial Dashboard')
  })

  it('displays current balance correctly', async () => {
    const transactionsStore = useTransactionsStore()
    const wrapper = mount(Dashboard)
    
    await transactionsStore.addTransaction(sampleTransaction)
    await wrapper.vm.$nextTick()
    
    const balanceText = wrapper.find('.text-2xl').text()
    expect(balanceText).toContain('-$50.00')
  })

  it('shows correct number of recent transactions', async () => {
    const transactionsStore = useTransactionsStore()
    const wrapper = mount(Dashboard)
    
    // Add 6 transactions
    for (let i = 0; i < 6; i++) {
      await transactionsStore.addTransaction({
        ...sampleTransaction,
        description: `Transaction ${i + 1}`
      })
    }
    
    await wrapper.vm.$nextTick()
    
    // Should only show 5 most recent transactions
    const transactions = wrapper.findAll('.recent-transactions .transaction')
    expect(transactions).toHaveLength(5)
  })

  it('calculates monthly income correctly', async () => {
    const transactionsStore = useTransactionsStore()
    const wrapper = mount(Dashboard)
    
    await transactionsStore.addTransaction({
      date: new Date().toISOString().split('T')[0],
      description: 'Salary',
      category: 'Income - Salary',
      amount: 1000,
      isIncome: true
    })
    
    await wrapper.vm.$nextTick()
    
    const incomeCard = wrapper.find('.bg-green-50')
    expect(incomeCard.text()).toContain('$1,000.00')
  })

  it('calculates monthly expenses correctly', async () => {
    const transactionsStore = useTransactionsStore()
    const wrapper = mount(Dashboard)
    
    await transactionsStore.addTransaction(sampleTransaction)
    await wrapper.vm.$nextTick()
    
    const expenseCard = wrapper.find('.bg-red-50')
    expect(expenseCard.text()).toContain('$50.00')
  })

  it('shows upcoming bills correctly', async () => {
    const billsStore = useBillsStore()
    const wrapper = mount(Dashboard)
    
    // Add a sample bill
    await billsStore.addBill({
      name: 'Rent',
      amount: 1000,
      dueDate: new Date().toISOString().split('T')[0],
      category: 'Housing - Rent/Mortgage'
    })
    
    await wrapper.vm.$nextTick()
    
    const upcomingBills = wrapper.find('.bg-blue-50')
    expect(upcomingBills.text()).toContain('$1,000.00')
    expect(upcomingBills.text()).toContain('1 bills due soon')
  })

  it('updates charts when date range changes', async () => {
    const wrapper = mount(Dashboard)
    const dateSelector = wrapper.find('.date-range-selector')
    
    // Simulate date range change
    await dateSelector.trigger('change')
    await wrapper.vm.$nextTick()
    
    // Verify charts are updated
    expect(wrapper.vm.categorySpendingData).toBeDefined()
    expect(wrapper.vm.monthlyIncomeExpenses).toBeDefined()
  })
}) 