import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AddTransaction from '@/components/AddTransaction.vue'
import { useTransactionsStore } from '@/stores/transactions'
import { useCategoriesStore } from '@/stores/categories'

describe('AddTransaction Date Handling', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    const categoriesStore = useCategoriesStore()
    categoriesStore.initialize()
  })

  it('preserves exact selected date without timezone shift', async () => {
    const wrapper = mount(AddTransaction)
    const store = useTransactionsStore()
    
    // Set a specific date
    const testDate = '2024-03-04' // March 4th
    await wrapper.find('input[type="date"]').setValue(testDate)
    
    // Fill other required fields
    await wrapper.find('input[placeholder="Enter description"]').setValue('Test Transaction')
    await wrapper.find('select').setValue('Housing - Internet')
    await wrapper.find('input[placeholder="0.00"]').setValue('50')
    
    // Submit the form
    await wrapper.find('form').trigger('submit.prevent')
    
    // Check the stored transaction
    const addedTransaction = store.transactions[0]
    expect(addedTransaction.date).toBe(testDate)
  })

  it('handles today\'s date correctly', async () => {
    const wrapper = mount(AddTransaction)
    const store = useTransactionsStore()
    
    // Get today's date in YYYY-MM-DD format using local time
    const today = new Date()
    const todayStr = today.toLocaleDateString('en-CA')
    
    // Fill required fields
    await wrapper.find('input[placeholder="Enter description"]').setValue('Today Test')
    await wrapper.find('select').setValue('Housing - Internet')
    await wrapper.find('input[placeholder="0.00"]').setValue('50')
    
    // Submit the form
    await wrapper.find('form').trigger('submit.prevent')
    
    // Check the stored transaction
    const addedTransaction = store.transactions[0]
    expect(addedTransaction.date).toBe(todayStr)
  })
}) 