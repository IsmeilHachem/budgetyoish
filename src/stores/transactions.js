import { defineStore } from 'pinia'
import { useCategoriesStore } from './categories'
import { useBillsStore } from './bills'
import { parseESTDate, generateTimestamp } from '@/utils/dateUtils'
import { supabase } from '@/utils/supabase'
import { useAuthStore } from './auth'
import {
  parseTransactionsFromStorage,
  serializeTransactionsForStorage
} from '@/utils/transactionStorage'

export const useTransactionsStore = defineStore('transactions', {
  state: () => ({
    transactions: [],
    initialized: false
  }),

  getters: {
    getTransactions: (state) => state.transactions,
    getTransactionById: (state) => (id) => state.transactions.find(t => t.id === id),
    getTransactionsByDate: (state) => (startDate, endDate) => {
      const start = parseESTDate(startDate)
      const end = parseESTDate(endDate)
      return state.transactions.filter(t => {
        const date = parseESTDate(t.date)
        return date >= start && date <= end
      })
    },
    getTransactionsByCategory: (state) => (category) => {
      return state.transactions.filter(t => t.category === category)
    },
    getCurrentBalance: (state) => {
      return state.transactions.reduce((sum, t) => sum + (t.amount || 0), 0)
    },
    getFilteredIncome: (state) => (filterFn) => {
      return state.transactions.filter(t => {
        return t.amount > 0 && t.description?.toLowerCase() !== 'starting balance' && (!filterFn || filterFn(t))
      })
    },
    getFilteredExpense: (state) => (filterFn) => {
      return state.transactions.filter(t => {
        return t.amount < 0 && t.description?.toLowerCase() !== 'starting balance' && (!filterFn || filterFn(t))
      })
    }
  },

  actions: {
    async initialize() {
      await this.loadFromSupabase()
    },

    async loadFromSupabase() {
      const authStore = useAuthStore()

      // Wait for auth to finish initializing before checking login state
      if (authStore.loading) {
        await authStore.init()
      }

      if (!authStore.isLoggedIn) return


      // Paginate to bypass Supabase's default 1000-row server cap
      const PAGE_SIZE = 1000
      let allData = []
      let offset = 0
      let fetchError = null

      while (true) {
        const { data: page, error: pageError } = await supabase
          .from('transactions')
          .select('*')
          .order('date', { ascending: true })
          .order('id', { ascending: true })
          .range(offset, offset + PAGE_SIZE - 1)

        if (pageError) { fetchError = pageError; break }
        if (!page || page.length === 0) break

        allData = allData.concat(page)
        if (page.length < PAGE_SIZE) break
        offset += PAGE_SIZE
      }

      // Deduplicate by ID in case of any remaining overlap
      const seenIds = new Set()
      allData = allData.filter(row => {
        if (seenIds.has(row.id)) return false
        seenIds.add(row.id)
        return true
      })

      const error = fetchError
      const data = allData

      if (error) {
        console.error('Error loading transactions from Supabase:', error)
        return
      }

      this.transactions = (data || []).map(row => ({
        id: row.id,
        date: row.date,
        description: row.description,
        category: row.category,
        amount: Number(row.amount),
        isIncome: row.is_income
      }))

      this.initialized = true
      this.saveToLocalStorage()
    },

    // Still save to localStorage as a local cache/fallback
    saveToLocalStorage() {
      try {
        const payload = serializeTransactionsForStorage({
          transactions: this.transactions,
          initialized: this.initialized
        })
        localStorage.setItem('budgetish-transactions', payload)
        return true
      } catch (error) {
        console.error('Error saving transactions to localStorage:', error)
        return false
      }
    },

    calculateCategoryTotal(mainCategory, subcategory) {
      return this.transactions
        .filter(t => t.category === `${mainCategory} - ${subcategory}`)
        .reduce((total, t) => total + t.amount, 0)
    },

    async addTransaction(transaction) {
      const categoriesStore = useCategoriesStore()
      const billsStore = useBillsStore()
      const authStore = useAuthStore()

      if (!categoriesStore.validateCategory(transaction.category)) {
        return false
      }

      const newTransaction = {
        id: generateTimestamp(),
        date: transaction.date,
        description: transaction.description,
        category: transaction.category,
        amount: transaction.isIncome ? Math.abs(transaction.amount) : -Math.abs(transaction.amount),
        isIncome: transaction.isIncome
      }

      // Optimistic: update local store immediately
      this.transactions.push(newTransaction)

      const sep = ' - '
      const splitIdx = transaction.category.indexOf(sep)
      const mainCategory = splitIdx === -1 ? '' : transaction.category.slice(0, splitIdx).trim()
      const subcategory = splitIdx === -1 ? '' : transaction.category.slice(splitIdx + sep.length).trim()

      const categoryTotal = this.calculateCategoryTotal(mainCategory, subcategory)
      categoriesStore.updateCategoryAmount(mainCategory, subcategory, categoryTotal)

      if (!transaction.isIncome) {
        billsStore.checkAndMarkPayment(
          transaction.description,
          Math.abs(transaction.amount),
          transaction.category,
          transaction.date
        )
      }

      // Await insert — guarantees the transaction is in Supabase before the modal closes,
      // so any page reload (deliberate or forced) can never lose it.
      const { error } = await supabase.from('transactions').insert({
        id: newTransaction.id,
        user_id: authStore.userId,
        date: newTransaction.date,
        description: newTransaction.description,
        category: newTransaction.category,
        amount: newTransaction.amount,
        is_income: newTransaction.isIncome
      })

      if (error) {
        console.error('Error saving transaction to Supabase:', error)
        this.transactions = this.transactions.filter(t => t.id !== newTransaction.id)
        categoriesStore.updateCategoryAmount(mainCategory, subcategory, this.calculateCategoryTotal(mainCategory, subcategory))
        return false
      }

      return true
    },

    async deleteTransaction(id) {
      const index = this.transactions.findIndex(t => t.id === id)
      if (index === -1) return false

      const transaction = this.transactions[index]

      // Optimistic: remove immediately so the UI responds instantly
      this.transactions.splice(index, 1)

      const categoriesStore = useCategoriesStore()
      const [mainCategory, subcategory] = transaction.category.split(' - ')
      categoriesStore.updateCategoryAmount(mainCategory, subcategory, this.calculateCategoryTotal(mainCategory, subcategory))

      const { error } = await supabase.from('transactions').delete().eq('id', id)
      if (error) {
        console.error('Error deleting transaction from Supabase:', error)
        // Revert: re-insert at original position and restore category amount
        this.transactions.splice(index, 0, transaction)
        categoriesStore.updateCategoryAmount(mainCategory, subcategory, this.calculateCategoryTotal(mainCategory, subcategory))
        return false
      }

      this.saveToLocalStorage()
      return true
    },

    async updateTransaction(transaction) {
      const index = this.transactions.findIndex(t => t.id === transaction.id)
      if (index === -1) return false

      const { error } = await supabase.from('transactions').update({
        date: transaction.date,
        description: transaction.description,
        category: transaction.category,
        amount: transaction.amount,
        is_income: transaction.isIncome
      }).eq('id', transaction.id)

      if (error) {
        console.error('Error updating transaction in Supabase:', error)
        return false
      }

      const oldTransaction = this.transactions[index]
      const categoriesStore = useCategoriesStore()

      const [oldMainCategory, oldSubcategory] = oldTransaction.category.split(' - ')
      categoriesStore.updateCategoryAmount(oldMainCategory, oldSubcategory, -Math.abs(oldTransaction.amount))

      const [newMainCategory, newSubcategory] = transaction.category.split(' - ')
      categoriesStore.updateCategoryAmount(newMainCategory, newSubcategory, Math.abs(transaction.amount))

      this.transactions[index] = transaction
      this.saveToLocalStorage()
      return true
    },

    async editTransaction(id, updates) {
      const transaction = this.transactions.find(t => t.id === id)
      if (!transaction) return false

      const categoriesStore = useCategoriesStore()
      const billsStore = useBillsStore()

      if (updates.category && !categoriesStore.validateCategory(updates.category)) {
        return false
      }

      const oldCategory = transaction.category
      const oldIsIncome = transaction.isIncome
      const oldDescription = transaction.description

      const updatedAmount = updates.isIncome ? Math.abs(updates.amount) : -Math.abs(updates.amount)

      const { error } = await supabase.from('transactions').update({
        date: updates.date ?? transaction.date,
        description: updates.description ?? transaction.description,
        category: updates.category ?? transaction.category,
        amount: updatedAmount,
        is_income: updates.isIncome ?? transaction.isIncome
      }).eq('id', id)

      if (error) {
        console.error('Error editing transaction in Supabase:', error)
        return false
      }

      Object.assign(transaction, { ...updates, amount: updatedAmount })

      if (oldCategory !== transaction.category) {
        const [oldMainCategory, oldSubcategory] = oldCategory.split(' - ')
        const [newMainCategory, newSubcategory] = transaction.category.split(' - ')
        categoriesStore.updateCategoryAmount(oldMainCategory, oldSubcategory, this.calculateCategoryTotal(oldMainCategory, oldSubcategory))
        categoriesStore.updateCategoryAmount(newMainCategory, newSubcategory, this.calculateCategoryTotal(newMainCategory, newSubcategory))
      } else {
        const [mainCategory, subcategory] = transaction.category.split(' - ')
        categoriesStore.updateCategoryAmount(mainCategory, subcategory, this.calculateCategoryTotal(mainCategory, subcategory))
      }

      const descriptionChanged = oldDescription !== transaction.description
      const amountChanged = transaction.amount !== updatedAmount
      const categoryChanged = oldCategory !== transaction.category
      const typeChanged = oldIsIncome !== transaction.isIncome

      if (!transaction.isIncome && (typeChanged || amountChanged || categoryChanged || descriptionChanged)) {
        billsStore.checkAndMarkPayment(transaction.description, Math.abs(transaction.amount), transaction.category, transaction.date)
      }

      this.saveToLocalStorage()
      return true
    },

    // One-time migration: move existing localStorage transactions into Supabase
    async migrateFromLocalStorage() {
      const authStore = useAuthStore()
      if (!authStore.isLoggedIn) return { migrated: 0, error: 'Not logged in' }

      const stored = localStorage.getItem('budgetish-transactions')
      if (!stored) return { migrated: 0, error: 'No local data found' }

      let localData = null
      try {
        localData = parseTransactionsFromStorage(stored)
      } catch (e) {
        return { migrated: 0, error: 'Could not parse local data' }
      }

      const localTransactions = localData?.transactions || []
      if (localTransactions.length === 0) return { migrated: 0, error: 'No transactions to migrate' }

      // Check which IDs already exist in Supabase to avoid duplicates
      const { data: existing } = await supabase.from('transactions').select('id')
      const existingIds = new Set((existing || []).map(r => r.id))

      const toInsert = localTransactions
        .filter(t => !existingIds.has(t.id))
        .map(t => ({
          id: t.id,
          user_id: authStore.userId,
          date: t.date,
          description: t.description || '',
          category: t.category,
          amount: t.amount,
          is_income: t.isIncome ?? (t.amount > 0)
        }))

      if (toInsert.length === 0) return { migrated: 0, error: 'All transactions already in Supabase' }

      // Insert in batches of 200
      let migrated = 0
      for (let i = 0; i < toInsert.length; i += 200) {
        const batch = toInsert.slice(i, i + 200)
        const { error } = await supabase.from('transactions').insert(batch)
        if (error) {
          console.error('Migration batch error:', error)
          return { migrated, error: error.message }
        }
        migrated += batch.length
      }

      // Reload from Supabase after migration
      await this.loadFromSupabase()

      return { migrated, error: null }
    },

    exportTransactionsToCSV() {
      try {
        const headers = ['Date', 'Description', 'Category', 'Amount', 'Type']
        const rows = this.transactions.map(t => [
          t.date,
          t.description,
          t.category,
          t.amount,
          t.isIncome ? 'Income' : 'Expense'
        ])

        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`
        link.click()
        return true
      } catch (error) {
        console.error('Error exporting transactions to CSV:', error)
        return false
      }
    }
  }
})
