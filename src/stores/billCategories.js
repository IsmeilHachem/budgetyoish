import { defineStore } from 'pinia'
import { supabase } from '@/utils/supabase'
import { useAuthStore } from './auth'

// Default categories matching the main categories store
export const DEFAULT_BILL_CATEGORIES = {
  "Pay Day": ["Pay Day"],
  "Food": ["Groceries", "Dining Out", "Coffee/Water", "Going Out"],
  "Transportation": ["Gas", "Car Payment", "Car Insurance", "Car Maintenance", "Public Transit"],
  "Housing": ["Rent/Mortgage", "Utilities", "Internet", "Phone", "Insurance", "Maintenance"],
  "Personal": ["Entertainment", "Shopping", "Health", "Fitness", "Education", "Personal Care"],
  "Debt": ["Credit Cards", "Student Loans", "Personal Loans", "Subscriptions"],
  "Savings": ["Emergency Fund", "Retirement", "Investments", "Goals"],
  "Income": ["Salary", "Bonus", "Interest", "Other"],
  "Miscellaneous": ["Other", "Gifts", "Charity"]
}

export const useBillCategoriesStore = defineStore('billCategories', {
  state: () => ({
  categories: DEFAULT_BILL_CATEGORIES,
  amounts: {},
  initialized: false,
  undoStack: [],
  redoStack: []
}),

  getters: {
    // Get all categories
    getCategories: (state) => state.categories || DEFAULT_BILL_CATEGORIES,

    // Get all main categories
    getMainCategories: (state) => Object.keys(state.categories || DEFAULT_BILL_CATEGORIES),

    // Get subcategories for a main category
    getSubcategories: (state) => (mainCategory) => {
      const categories = state.categories || DEFAULT_BILL_CATEGORIES
      return categories[mainCategory] || []
    },

    // Get amount for a specific category-subcategory pair
    getCategoryAmount: (state) => (mainCategory, subcategory) => {
      const key = `${mainCategory} - ${subcategory}`
      return state.amounts[key] || 0
    },

    // Get total for a main category
    getCategoryTotal: (state) => (mainCategory) => {
      return Object.entries(state.amounts)
        .filter(([key]) => key.startsWith(`${mainCategory} - `))
        .reduce((total, [, amount]) => total + amount, 0)
    },

    // Check if undo is available
    canUndo: (state) => state.undoStack.length > 0,

    // Check if redo is available
    canRedo: (state) => state.redoStack.length > 0
  },

  actions: {
    // Save current state to undo stack
    saveState() {
      this.undoStack.push({
        categories: JSON.parse(JSON.stringify(this.categories)),
        amounts: JSON.parse(JSON.stringify(this.amounts))
      })
      // Clear redo stack when new action is performed
      this.redoStack = []
      this.saveToLocalStorage()
    },

    // Save to localStorage
    saveToLocalStorage() {
      localStorage.setItem('budgetish-categories-bills', JSON.stringify({
        categories: this.categories,
        amounts: this.amounts,
        initialized: this.initialized,
        undoStack: this.undoStack,
        redoStack: this.redoStack
      }))
    },

    // Undo last action
    undo() {
      if (this.undoStack.length > 0) {
        const currentState = {
          categories: JSON.parse(JSON.stringify(this.categories)),
          amounts: JSON.parse(JSON.stringify(this.amounts))
        }
        this.redoStack.push(currentState)
        
        const previousState = this.undoStack.pop()
        this.categories = previousState.categories
        this.amounts = previousState.amounts
        this.saveToLocalStorage()
        return true
      }
      return false
    },

    // Redo last undone action
    redo() {
      if (this.redoStack.length > 0) {
        const currentState = {
          categories: JSON.parse(JSON.stringify(this.categories)),
          amounts: JSON.parse(JSON.stringify(this.amounts))
        }
        this.undoStack.push(currentState)
        
        const nextState = this.redoStack.pop()
        this.categories = nextState.categories
        this.amounts = nextState.amounts
        this.saveToLocalStorage()
        return true
      }
      return false
    },

    async loadFromSupabase() {
      const authStore = useAuthStore()
      if (authStore.loading) await authStore.init()
      if (!authStore.isLoggedIn) return

      const { data, error } = await supabase
        .from('user_data')
        .select('data')
        .eq('data_type', 'bill_categories')
        .single()

      if (error || !data) return

      const parsed = data.data
      if (parsed.categories && Object.keys(parsed.categories).length > 0) {
        this.categories = parsed.categories
      }
      if (parsed.amounts) this.amounts = parsed.amounts
      this.initialized = true
      this.saveToLocalStorage()
    },

    saveToSupabase() {
      const authStore = useAuthStore()
      if (!authStore.isLoggedIn) return
      supabase.from('user_data').upsert({
        user_id: authStore.userId,
        data_type: 'bill_categories',
        data: { categories: this.categories, amounts: this.amounts },
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,data_type' }).then(({ error }) => {
        if (error) console.error('Error saving bill categories to Supabase:', error)
      })
    },

    // Initialize categories with default structure
    async initialize() {
      if (this.initialized) return
      await this.loadFromSupabase()

      if (!this.initialized) {
        try {
          const stored = localStorage.getItem('budgetish-categories-bills')
          if (stored) {
            const data = JSON.parse(stored)
            this.categories = data.categories || { ...DEFAULT_BILL_CATEGORIES }
            this.amounts = data.amounts || {}
          } else {
            this.categories = { ...DEFAULT_BILL_CATEGORIES }
            this.resetAmounts()
          }
        } catch (error) {
          console.error('Error loading bill categories:', error)
          this.categories = { ...DEFAULT_BILL_CATEGORIES }
          this.resetAmounts()
        }
        this.initialized = true
        this.saveToLocalStorage()
        this.saveToSupabase()
      }
    },

    // Reset all amounts to zero
    resetAmounts() {
      const newAmounts = {}
      Object.entries(this.categories).forEach(([mainCategory, subcategories]) => {
        subcategories.forEach(subcategory => {
          newAmounts[`${mainCategory} - ${subcategory}`] = 0
        })
      })
      this.amounts = newAmounts
      this.saveState()
    },

    // Update amount for a specific category
    updateCategoryAmount(mainCategory, subcategory, amount) {
      const key = `${mainCategory} - ${subcategory}`
      if (typeof this.amounts[key] === 'undefined') {
        this.amounts[key] = 0
      }
      this.amounts[key] += amount
      this.saveState()
      this.saveToSupabase()
    },

    // Add a new subcategory to a main category
    addSubcategory(mainCategory, subcategory) {
      if (!this.categories[mainCategory] || this.categories[mainCategory].includes(subcategory)) {
        return false
      }

      // Add to categories array
      this.categories[mainCategory].push(subcategory)

      // Initialize amount to zero
      const key = `${mainCategory} - ${subcategory}`
      this.amounts[key] = 0

      this.saveState()
      return true
    },

    // Edit a main category name
    editMainCategory(oldName, newName) {
      if (!this.categories[oldName] || this.categories[newName]) {
        return false
      }

      // Update categories object
      this.categories[newName] = [...this.categories[oldName]]
      delete this.categories[oldName]

      // Update amounts object
      const newAmounts = {}
      Object.entries(this.amounts).forEach(([key, amount]) => {
        if (key.startsWith(`${oldName} - `)) {
          const subcategory = key.split(' - ')[1]
          newAmounts[`${newName} - ${subcategory}`] = amount
        } else {
          newAmounts[key] = amount
        }
      })
      this.amounts = newAmounts

      this.saveState()
      return true
    },

    // Edit a subcategory name
    editSubcategory(mainCategory, oldName, newName) {
      if (!this.categories[mainCategory]?.includes(oldName) || 
          this.categories[mainCategory]?.includes(newName)) {
        return false
      }

      // Update categories array
      const index = this.categories[mainCategory].indexOf(oldName)
      if (index !== -1) {
        this.categories[mainCategory][index] = newName
      }

      // Update amounts object
      const oldKey = `${mainCategory} - ${oldName}`
      const newKey = `${mainCategory} - ${newName}`
      if (this.amounts[oldKey] !== undefined) {
        this.amounts[newKey] = this.amounts[oldKey]
        delete this.amounts[oldKey]
      }

      this.saveState()
      return true
    },

    // Delete a main category and its subcategories
    deleteMainCategory(category) {
      if (!this.categories[category]) {
        return false
      }

      // Remove from categories object
      delete this.categories[category]

      // Remove from amounts object
      const newAmounts = {}
      Object.entries(this.amounts).forEach(([key, amount]) => {
        if (!key.startsWith(`${category} - `)) {
          newAmounts[key] = amount
        }
      })
      this.amounts = newAmounts

      this.saveState()
      return true
    },

    // Delete a subcategory
    deleteSubcategory(mainCategory, subcategory) {
      if (!this.categories[mainCategory]?.includes(subcategory)) {
        return false
      }

      // Remove from categories array
      const index = this.categories[mainCategory].indexOf(subcategory)
      if (index !== -1) {
        this.categories[mainCategory].splice(index, 1)
      }

      // Remove from amounts object
      const key = `${mainCategory} - ${subcategory}`
      delete this.amounts[key]

      this.saveState()
      return true
    }
  }
}) 
