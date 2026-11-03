import { defineStore } from 'pinia'
import { DEFAULT_CATEGORIES as MAIN_DEFAULT_CATEGORIES } from './categories.js'
import { parseESTDate, generateTimestamp } from '@/utils/dateUtils'
import { supabase } from '@/utils/supabase'
import { useAuthStore } from './auth'

const PAID_STATUS = 'PAID'
const UNPAID_STATUS = 'UNPAID'
const UPCOMING_STATUS = 'UPCOMING'

// Use the main categories as the default
const DEFAULT_CATEGORIES = Object.keys(MAIN_DEFAULT_CATEGORIES)

export const useBillsStore = defineStore('bills', {
  state: () => ({
    bills: [],
    categories: DEFAULT_CATEGORIES,
    initialized: false,
    billMonthStatus: {}, // { [billId]: { [YYYY-MM]: { paid: true/false, amount: number } } }
    undoStack: [], // Stack to store previous states for undo functionality
    redoStack: [] // Stack to store states for redo functionality
  }),

  getters: {
    getBills: (state) => state.bills,
    getActiveBills: (state) => state.bills.filter(b => !b.archived),
    getArchivedBills: (state) => state.bills.filter(b => b.archived === true),
    getCategories: (state) => state.categories,

    // Get bills by status
    getPaidBills: (state) => state.bills.filter(bill => bill.status === PAID_STATUS),
    getUnpaidBills: (state) => state.bills.filter(bill => bill.status === UNPAID_STATUS),
    getUpcomingBills: (state) => state.bills.filter(bill =>
      bill.status === UPCOMING_STATUS &&
      !bill.deletedAfter // Filter out deleted bills
    ),

    // Get bills by category
    getBillsByCategory: (state) => (category) =>
      state.bills.filter(bill => bill.category === category),

    // Get bill by ID
    getBillById: (state) => (id) => state.bills.find(b => b.id === id),

    // Get total amount of bills
    getTotalBillAmount: (state) => state.bills.reduce((total, bill) => total + (bill.amount || 0), 0),

    // Get total amount by category
    getTotalByCategory: (state) => (category) =>
      state.bills.filter(bill => bill.category === category)
        .reduce((total, bill) => total + (bill.amount || 0), 0),

    // Get total paid amount
    getTotalPaidAmount: (state) => state.bills
      .filter(bill => bill.status === PAID_STATUS)
      .reduce((total, bill) => total + (bill.amount || 0), 0),

    // Get total unpaid amount
    getTotalUnpaidAmount: (state) => state.bills
      .filter(bill => bill.status === UNPAID_STATUS)
      .reduce((total, bill) => total + (bill.amount || 0), 0),

    // Check if undo is available
    canUndo: (state) => state.undoStack.length > 0,

    // Check if redo is available
    canRedo: (state) => state.redoStack.length > 0
  },

  actions: {
    // Reset all bills data and categories
    resetBills() {
      this.bills = []
      this.categories = DEFAULT_CATEGORIES
      this.initialized = true
      this.saveToLocalStorage()
      return true
    },

    async loadFromSupabase() {
      const authStore = useAuthStore()
      if (authStore.loading) await authStore.init()
      if (!authStore.isLoggedIn) return

      const { data, error } = await supabase
        .from('user_data')
        .select('data')
        .eq('data_type', 'bills')
        .single()

      if (error || !data) return

      const parsed = data.data
      this.bills = parsed.bills || []
      this.billMonthStatus = parsed.billMonthStatus || {}
      this.categories = DEFAULT_CATEGORIES
      this.initialized = true
      this.saveToLocalStorage()
    },

    saveToSupabase() {
      const authStore = useAuthStore()
      if (!authStore.isLoggedIn) return
      // Never overwrite Supabase before bills have been loaded — would wipe real data with []
      if (!this.initialized) return
      supabase.from('user_data').upsert({
        user_id: authStore.userId,
        data_type: 'bills',
        data: { bills: this.bills, billMonthStatus: this.billMonthStatus },
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,data_type' }).then(({ error }) => {
        if (error) console.error('Error saving bills to Supabase:', error)
      })
    },

    // Initialize bills from localStorage then Supabase
    async initialize() {
      if (this.initialized) return
      await this.loadFromSupabase()

      if (!this.initialized) {
        try {
          const stored = localStorage.getItem('budgetish-bills')
          if (stored) {
            const data = JSON.parse(stored)
            this.bills = data.bills || []
            this.billMonthStatus = data.billMonthStatus || {}
          } else {
            this.bills = []
            this.billMonthStatus = {}
          }
        } catch (error) {
          console.error('Error loading bills:', error)
          this.bills = []
          this.billMonthStatus = {}
        }
        this.categories = DEFAULT_CATEGORIES
        this.initialized = true
        this.saveToLocalStorage()
      }
    },

    // Force refresh categories
    refreshCategories() {
      this.categories = DEFAULT_CATEGORIES
      this.saveToLocalStorage()
    },

    // Save data to localStorage
    saveToLocalStorage() {
      try {
        localStorage.setItem('budgetish-bills', JSON.stringify({
          bills: this.bills,
          categories: this.categories,
          initialized: this.initialized,
          billMonthStatus: this.billMonthStatus,
          undoStack: this.undoStack,
          redoStack: this.redoStack
        }))
      } catch (error) {
        console.error('Error saving bills to localStorage:', error)
      }
    },

    // Save current state to undo stack
    saveState() {
      this.undoStack.push({
        bills: JSON.parse(JSON.stringify(this.bills)),
        categories: JSON.parse(JSON.stringify(this.categories)),
        billMonthStatus: JSON.parse(JSON.stringify(this.billMonthStatus))
      })
      // Clear redo stack when new action is performed
      this.redoStack = []
      // Limit undo stack size to prevent memory issues
      if (this.undoStack.length > 10) {
        this.undoStack.shift()
      }
      this.saveToLocalStorage()
    },

    // Undo last action
    undo() {
      if (this.undoStack.length > 0) {
        const currentState = {
          bills: JSON.parse(JSON.stringify(this.bills)),
          categories: JSON.parse(JSON.stringify(this.categories)),
          billMonthStatus: JSON.parse(JSON.stringify(this.billMonthStatus))
        }
        this.redoStack.push(currentState)
        
        const previousState = this.undoStack.pop()
        this.bills = previousState.bills
        this.categories = previousState.categories
        this.billMonthStatus = previousState.billMonthStatus
        this.saveToLocalStorage()
        console.log('Undo performed - restored previous state')
        return true
      }
      return false
    },

    // Redo last undone action
    redo() {
      if (this.redoStack.length > 0) {
        const currentState = {
          bills: JSON.parse(JSON.stringify(this.bills)),
          categories: JSON.parse(JSON.stringify(this.categories)),
          billMonthStatus: JSON.parse(JSON.stringify(this.billMonthStatus))
        }
        this.undoStack.push(currentState)
        
        const nextState = this.redoStack.pop()
        this.bills = nextState.bills
        this.categories = nextState.categories
        this.billMonthStatus = nextState.billMonthStatus
        this.saveToLocalStorage()
        console.log('Redo performed - restored next state')
        return true
      }
      return false
    },

    // Add a new bill
    addBill(bill) {
      const newBill = {
        id: generateTimestamp(),
        dueDate: bill.dueDate,
        name: bill.name.toLowerCase(),
        amount: bill.amount || null,
        category: bill.category || 'Other',
        automatic: bill.automatic ?? false,
        status: UNPAID_STATUS,
        paymentCount: 0,
        notes: bill.notes || '',
        deletedAfter: null // New property for soft delete
      }

      this.bills.push(newBill)
      this.sortBillsByDate()
      this.saveToLocalStorage()
      this.saveToSupabase()
      return true
    },

    // Add a new category
    addCategory(category) {
      if (!this.categories.includes(category)) {
        this.categories.push(category)
        this.saveToLocalStorage()
        return true
      }
      return false
    },

    // Delete a category (and its bills)
    deleteCategory(category) {
      // Remove the category from CATEGORY_MAPPING
      delete CATEGORY_MAPPING[category]
      
      // Update DEFAULT_CATEGORIES
      this.categories = Object.keys(CATEGORY_MAPPING)
      
      // Delete all bills in this category
      this.bills = this.bills.filter(bill => bill.category !== category)
      
      this.saveToLocalStorage()
      return true
    },

    // Edit a category name
    editCategory(oldName, newName) {
      if (oldName === 'Other' || this.categories.includes(newName)) return false
      
      const index = this.categories.indexOf(oldName)
      if (index !== -1) {
        // Update category name
        this.categories[index] = newName
        
        // Update all bills with this category
        this.bills.forEach(bill => {
          if (bill.category === oldName) {
            bill.category = newName
          }
        })
        
        this.saveToLocalStorage()
        return true
      }
      return false
    },

    // Edit an existing bill
    editBill(id, updates) {
      const bill = this.bills.find(b => b.id === id)
      if (!bill) return false

      // Convert name to lowercase if it's being updated
      if (updates.name) {
        updates.name = updates.name.toLowerCase()
      }

      // Update bill properties
      Object.assign(bill, updates)
      
      this.sortBillsByDate()
      this.saveToLocalStorage()
      this.saveToSupabase()
      return true
    },

    // Delete a bill from current month onwards (preserves historical data)
    deleteBill(id, month) {
      const bill = this.bills.find(b => b.id === id)
      if (!bill) {
        console.error('Bill not found with id:', id)
        return false
      }
      
      // Set deletedAfter to the current month - this will hide it from current month onwards
      bill.deletedAfter = month
      this.saveToLocalStorage()
      this.saveToSupabase()
      return true
    },

    // Archive a bill (soft-delete — sets archived: true, preserves data)
    archiveBill(id) {
      const bill = this.bills.find(b => b.id === id)
      if (!bill) return false
      bill.archived = true
      this.saveToLocalStorage()
      this.saveToSupabase()
      return true
    },

    // Restore an archived bill
    restoreArchivedBill(id) {
      const bill = this.bills.find(b => b.id === id)
      if (!bill) return false
      bill.archived = false
      this.saveToLocalStorage()
      this.saveToSupabase()
      return true
    },

    // Completely delete a bill (permanent removal)
    deleteBillCompletely(id) {
      const billIndex = this.bills.findIndex(b => b.id === id)
      if (billIndex === -1) {
        console.error('Bill not found with id:', id)
        return false
      }
      this.bills.splice(billIndex, 1)
      this.saveToLocalStorage()
      this.saveToSupabase()
      return true
    },

    // Mark a bill as paid
    markAsPaid(id, amount = null, month = null) {
      const bill = this.bills.find(b => b.id === id)
      if (!bill) return false
      const now = new Date()
      const yyyyMM = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      if (!this.billMonthStatus[id]) this.billMonthStatus[id] = {}
      this.billMonthStatus[id][yyyyMM] = { paid: true, amount: amount !== null ? amount : bill.amount }
      this.saveToLocalStorage()
      this.saveToSupabase()
      return true
    },

    // Mark a bill as unpaid
    markAsUnpaid(id, month = null) {
      const bill = this.bills.find(b => b.id === id)
      if (!bill) return false
      const now = new Date()
      const yyyyMM = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      if (!this.billMonthStatus[id]) this.billMonthStatus[id] = {}
      this.billMonthStatus[id][yyyyMM] = { paid: false, amount: 0, paymentCount: 0 }
      this.saveToLocalStorage()
      this.saveToSupabase()
      return true
    },

    // Sort bills by due date
    sortBillsByDate() {
      this.bills.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    },

    // Update bill statuses based on due dates
    updateBillStatuses() {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      this.bills.forEach(bill => {
        if (bill.status === PAID_STATUS) return

        const dueDate = new Date(bill.dueDate)
        dueDate.setHours(0, 0, 0, 0)

        if (dueDate < today) {
          bill.status = UNPAID_STATUS
        } else {
          bill.status = UPCOMING_STATUS
        }
      })

      this.saveToLocalStorage()
    },

    // Check if a transaction matches any bill and mark it as paid
    checkAndMarkPayment(description, amount, category, date = null) {
      const matchedBill = this.bills.find(bill => {
        const normalizedBillName = bill.name.toLowerCase().trim()
        const normalizedTransDesc = description.toLowerCase().trim()
        
        // Determine the month for this transaction
        let transactionMonth
        if (date) {
          // Use the transaction's date to determine the month
          const transactionDate = new Date(date)
          transactionMonth = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`
        } else {
          // Fallback to current month if no date provided
          const now = new Date()
          transactionMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
        }
        
        // Check if the bill is unpaid for the transaction's month
        const isUnpaid = !this.billMonthStatus[bill.id]?.[transactionMonth]?.paid
        
        const descriptionMatches = normalizedBillName === normalizedTransDesc
        
        // Only match by description, not amount - amount will be updated to match transaction
        return isUnpaid && descriptionMatches
      })
      
      if (matchedBill) {
        // Determine the month for this transaction
        let transactionMonth
        if (date) {
          // Use the transaction's date to determine the month
          const transactionDate = new Date(date)
          transactionMonth = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`
        } else {
          // Fallback to current month if no date provided
          const now = new Date()
          transactionMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
        }
        
        // Always update the bill amount to match the transaction amount
        // Use Math.abs to ensure we store positive amounts for bills
        this.editBill(matchedBill.id, { amount: Math.abs(amount) })
        this.markAsPaid(matchedBill.id, Math.abs(amount), transactionMonth)
        return true
      }
      return false
    },

    // Get main category for subcategory
    getMainCategoryForSubcategory(subcategory) {
      for (const [mainCategory, subcategories] of Object.entries(MAIN_DEFAULT_CATEGORIES)) {
        if (subcategories.includes(subcategory)) {
          return mainCategory
        }
      }
      return 'Miscellaneous'
    },

    // Delete category from current month onwards (preserves historical data)
    deleteCategoryFromCurrentMonth(categoryName, currentMonth) {
      // Only match exact category names, not subcategories
      const billsInCategory = this.bills.filter(bill => {
        // Exact match for the category name
        if (bill.category === categoryName) return true
        
        // For subcategories, only match if the category name is the main category part
        // e.g., "Debt - Personal Loans" should only match if categoryName is "Debt - Personal Loans"
        // not if categoryName is just "Debt"
        return false
      })
      
      // Set deletedAfter to current month for all bills in this category
      billsInCategory.forEach(bill => {
        bill.deletedAfter = currentMonth
      })
      
      this.saveToLocalStorage()
      this.saveToSupabase()
      return billsInCategory.length
    },

    // Restore hidden category (remove deletedAfter flag)
    restoreHiddenCategory(categoryName) {
      // Only match exact category names, not subcategories
      const billsInCategory = this.bills.filter(bill => bill.category === categoryName)
      
      // Remove deletedAfter flag for all bills in this category
      billsInCategory.forEach(bill => {
        delete bill.deletedAfter
      })
      
      this.saveToLocalStorage()
      this.saveToSupabase()
      return billsInCategory.length
    },

    // Completely remove all bills in a category (use with caution - deletes historical data)
    deleteCategoryCompletely(categoryName) {
      const initialLength = this.bills.length
      this.bills = this.bills.filter(bill => !bill.category.startsWith(categoryName))
      const removedCount = initialLength - this.bills.length
      this.saveToLocalStorage()
      console.log(`Completely removed ${removedCount} bills from category "${categoryName}"`)
      return removedCount
    },

    // Restore historical data by clearing all deletedAfter flags
    restoreAllHistoricalData() {
      let restoredCount = 0
      this.bills.forEach(bill => {
        if (bill.deletedAfter) {
          delete bill.deletedAfter
          restoredCount++
        }
      })
      this.saveToLocalStorage()
      console.log(`Restored ${restoredCount} bills from historical data`)
      return restoredCount
    },

    // Get list of hidden bills (bills with deletedAfter set)
    getHiddenBills() {
      return this.bills.filter(bill => bill.deletedAfter)
    },

  }
})

// Helper for EST date (UTC-5, no DST)
function getESTDate(dateString) {
  return parseESTDate(dateString)
}
