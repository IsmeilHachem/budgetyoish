import { mount } from '@vue/test-utils'
import Dashboard from '../src/views/Dashboard.vue'
import { useTransactionsStore } from '../src/stores/transactions'
import { nextTick } from 'vue'

vi.mock('../src/stores/transactions')

const baseTransactions = [
  { id: 1, date: '2025-04-01', amount: 1000, description: 'Paycheck' },
  { id: 2, date: '2025-04-10', amount: -500, description: 'Rent' },
  { id: 3, date: '2025-05-01', amount: 1200, description: 'Paycheck' },
  { id: 4, date: '2025-05-10', amount: -800, description: 'Rent' },
  { id: 5, date: '2025-05-15', amount: -200, description: 'Groceries' },
]

describe('Dashboard stat cards reactivity', () => {
  let getTransactionsMock, getFilteredIncomeMock, getFilteredExpenseMock

  beforeEach(() => {
    getTransactionsMock = vi.fn(() => baseTransactions)
    getFilteredIncomeMock = vi.fn(() => baseTransactions.filter(t => t.amount > 0))
    getFilteredExpenseMock = vi.fn(() => baseTransactions.filter(t => t.amount < 0))
    useTransactionsStore.mockReturnValue({
      getTransactions: getTransactionsMock(),
      getFilteredIncome: getFilteredIncomeMock,
      getFilteredExpense: getFilteredExpenseMock,
      initialize: vi.fn()
    })
  })

  it('updates stat cards when selectedMonth changes', async () => {
    const wrapper = mount(Dashboard, {
      global: {
        stubs: ['router-link', 'SpendingCategoryChart', 'IncomeExpensesChart', 'DateRangeSelector']
      }
    })
    // Default is current month (simulate May 2025)
    await nextTick()
    expect(wrapper.html()).toContain('$994.77') // Monthly Income for May
    expect(wrapper.html()).toContain('$529.76') // Monthly Expenses for May
    expect(wrapper.html()).toContain('$465.01') // Current Balance for May

    // Change to April 2025
    await wrapper.find('input[type="month"]').setValue('2025-04')
    await nextTick()
    expect(wrapper.html()).toContain('$1,000.00') // Monthly Income for April
    expect(wrapper.html()).toContain('$500.00')   // Monthly Expenses for April
    expect(wrapper.html()).toContain('$500.00')   // Current Balance for April

    // Change to June 2025 (no data)
    await wrapper.find('input[type="month"]').setValue('2025-06')
    await nextTick()
    expect(wrapper.html()).toContain('$0.00') // Monthly Income for June
    expect(wrapper.html()).toContain('$0.00') // Monthly Expenses for June
    expect(wrapper.html()).toContain('$0.00') // Current Balance for June
  })
}) 