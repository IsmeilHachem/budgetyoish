import { defineStore } from 'pinia'
import { supabase } from '@/utils/supabase'
import { useAuthStore } from '@/stores/auth'
import { generateTimestamp } from '@/utils/dateUtils'
import { simulateDebtPlan, savingsAt, STRATEGIES } from '@/utils/debtPayoff'

export const useDebtPlanStore = defineStore('debtPlan', {
  state: () => ({
    debts: [],          // { id, name, balance, apr, minPayment }   apr is a percent, e.g. 23.49
    income: [],         // { id, label, amount, start, end, enabled }  monthly take-home; start/end are 'YYYY-MM' or ''
    expenses: [],       // { id, label, amount, start, end, enabled }  monthly non-debt expenses
    strategy: 'avalanche',
    shortfallDebtId: '',// card that absorbs months where money runs short
    goalMonth: '',      // 'YYYY-MM' target date (e.g. the move date)
    goalLabel: '',      // e.g. 'Debt Free 2028'
    initialized: false
  }),

  getters: {
    result: (state) => {
      const now = new Date()
      const startMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      return simulateDebtPlan({
        debts: state.debts,
        income: state.income,
        expenses: state.expenses,
        strategy: state.strategy || STRATEGIES.avalanche,
        shortfallDebtId: state.shortfallDebtId,
        startMonth,
        months: 120
      })
    },
    totalDebt: (state) => {
      return (state.debts || []).reduce((sum, d) => sum + (Number(d.balance) || 0), 0)
    },
    savingsAtGoal(state) {
      if (!state.goalMonth) return null
      return savingsAt(this.result, state.goalMonth)
    }
  },

  actions: {
    async loadFromSupabase() {
      const authStore = useAuthStore()
      if (authStore.loading) await authStore.init()
      if (!authStore.isLoggedIn) return

      const { data, error } = await supabase
        .from('user_data')
        .select('data')
        .eq('data_type', 'debt_plan')
        .maybeSingle()

      if (error || !data) return

      const parsed = data.data || {}
      this.debts = parsed.debts || []
      this.income = parsed.income || []
      this.expenses = parsed.expenses || []
      this.strategy = parsed.strategy || 'avalanche'
      this.shortfallDebtId = parsed.shortfallDebtId || ''
      this.goalMonth = parsed.goalMonth || ''
      this.goalLabel = parsed.goalLabel || ''
      this.initialized = true
      this.saveToLocalStorage()
    },

    saveToSupabase() {
      const authStore = useAuthStore()
      if (!authStore.isLoggedIn) return
      // Never overwrite Supabase before debt plan has been loaded — would wipe real data with []
      if (!this.initialized) return

      if (this._saveTimer) clearTimeout(this._saveTimer)
      this._saveTimer = setTimeout(() => {
        supabase.from('user_data').upsert({
          user_id: authStore.userId,
          data_type: 'debt_plan',
          data: {
            debts: this.debts,
            income: this.income,
            expenses: this.expenses,
            strategy: this.strategy,
            shortfallDebtId: this.shortfallDebtId,
            goalMonth: this.goalMonth,
            goalLabel: this.goalLabel
          },
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,data_type' }).then(({ error }) => {
          if (error) console.error('Error saving debt plan to Supabase:', error)
        })
      }, 400)
    },

    async initialize() {
      if (this.initialized) {
        const authStore = useAuthStore()
        if (authStore.isLoggedIn) {
          await this.loadFromSupabase()
        }
        return
      }

      await this.loadFromSupabase()

      if (!this.initialized) {
        try {
          const stored = localStorage.getItem('budgetish-debt-plan')
          if (stored) {
            const data = JSON.parse(stored)
            this.debts = data.debts || []
            this.income = data.income || []
            this.expenses = data.expenses || []
            this.strategy = data.strategy || 'avalanche'
            this.shortfallDebtId = data.shortfallDebtId || ''
            this.goalMonth = data.goalMonth || ''
            this.goalLabel = data.goalLabel || ''
          } else {
            this.debts = []
            this.income = []
            this.expenses = []
            this.strategy = 'avalanche'
            this.shortfallDebtId = ''
            this.goalMonth = ''
            this.goalLabel = ''
          }
        } catch (error) {
          console.error('Error loading debt plan from localStorage:', error)
          this.debts = []
          this.income = []
          this.expenses = []
          this.strategy = 'avalanche'
          this.shortfallDebtId = ''
          this.goalMonth = ''
          this.goalLabel = ''
        }
        this.initialized = true
        this.saveToLocalStorage()
      }
    },

    saveToLocalStorage() {
      try {
        localStorage.setItem('budgetish-debt-plan', JSON.stringify({
          debts: this.debts,
          income: this.income,
          expenses: this.expenses,
          strategy: this.strategy,
          shortfallDebtId: this.shortfallDebtId,
          goalMonth: this.goalMonth,
          goalLabel: this.goalLabel
        }))
      } catch (error) {
        console.error('Error saving debt plan to localStorage:', error)
      }
    },

    addDebt(debt = {}) {
      const newDebt = {
        id: debt.id || generateTimestamp(),
        name: debt.name || 'New Debt',
        type: debt.type || 'Credit Card',
        balance: debt.balance === '' ? '' : (debt.balance !== undefined ? Number(debt.balance) : 1000),
        apr: debt.apr === '' ? '' : (debt.apr !== undefined ? Number(debt.apr) : 19.99),
        minPayment: debt.minPayment === '' ? '' : (debt.minPayment !== undefined ? Number(debt.minPayment) : 50)
      }
      this.debts.push(newDebt)
      if (!this.shortfallDebtId) {
        this.shortfallDebtId = newDebt.id
      }
      this.saveToLocalStorage()
      this.saveToSupabase()
      return newDebt
    },

    updateDebt(id, updates = {}) {
      const item = this.debts.find(d => d.id === id)
      if (!item) return false
      if (updates.name !== undefined) item.name = updates.name
      if (updates.type !== undefined) item.type = updates.type
      if (updates.balance !== undefined) item.balance = updates.balance === '' ? '' : Number(updates.balance)
      if (updates.apr !== undefined) item.apr = updates.apr === '' ? '' : Number(updates.apr)
      if (updates.minPayment !== undefined) item.minPayment = updates.minPayment === '' ? '' : Number(updates.minPayment)
      this.saveToLocalStorage()
      this.saveToSupabase()
      return true
    },

    removeDebt(id) {
      const index = this.debts.findIndex(d => d.id === id)
      if (index === -1) return false
      this.debts.splice(index, 1)
      if (this.shortfallDebtId === id) {
        this.shortfallDebtId = this.debts[0]?.id || ''
      }
      this.saveToLocalStorage()
      this.saveToSupabase()
      return true
    },

    addIncome(item = {}) {
      const newIncome = {
        id: item.id || generateTimestamp(),
        label: item.label || 'New Income',
        amount: Number(item.amount) || 0,
        start: item.start || '',
        end: item.end || '',
        enabled: item.enabled !== false
      }
      this.income.push(newIncome)
      this.saveToLocalStorage()
      this.saveToSupabase()
      return newIncome
    },

    updateIncome(id, updates = {}) {
      const item = this.income.find(i => i.id === id)
      if (!item) return false
      if (updates.label !== undefined) item.label = updates.label
      if (updates.amount !== undefined) item.amount = updates.amount === '' ? '' : Number(updates.amount)
      if (updates.start !== undefined) item.start = updates.start
      if (updates.end !== undefined) item.end = updates.end
      if (updates.enabled !== undefined) item.enabled = Boolean(updates.enabled)
      this.saveToLocalStorage()
      this.saveToSupabase()
      return true
    },

    removeIncome(id) {
      const index = this.income.findIndex(i => i.id === id)
      if (index === -1) return false
      this.income.splice(index, 1)
      this.saveToLocalStorage()
      this.saveToSupabase()
      return true
    },

    addExpense(item = {}) {
      const newExpense = {
        id: item.id || generateTimestamp(),
        label: item.label || 'New Expense',
        amount: Number(item.amount) || 0,
        start: item.start || '',
        end: item.end || '',
        enabled: item.enabled !== false
      }
      this.expenses.push(newExpense)
      this.saveToLocalStorage()
      this.saveToSupabase()
      return newExpense
    },

    updateExpense(id, updates = {}) {
      const item = this.expenses.find(e => e.id === id)
      if (!item) return false
      if (updates.label !== undefined) item.label = updates.label
      if (updates.amount !== undefined) item.amount = updates.amount === '' ? '' : Number(updates.amount)
      if (updates.start !== undefined) item.start = updates.start
      if (updates.end !== undefined) item.end = updates.end
      if (updates.enabled !== undefined) item.enabled = Boolean(updates.enabled)
      this.saveToLocalStorage()
      this.saveToSupabase()
      return true
    },

    removeExpense(id) {
      const index = this.expenses.findIndex(e => e.id === id)
      if (index === -1) return false
      this.expenses.splice(index, 1)
      this.saveToLocalStorage()
      this.saveToSupabase()
      return true
    },

    toggleLine(type, id) {
      const list = type === 'income' ? this.income : this.expenses
      const item = list.find(x => x.id === id)
      if (!item) return false
      item.enabled = item.enabled === false ? true : false
      this.saveToLocalStorage()
      this.saveToSupabase()
      return true
    },

    setStrategy(strategy) {
      this.strategy = strategy
      this.saveToLocalStorage()
      this.saveToSupabase()
    },

    setShortfallDebtId(id) {
      this.shortfallDebtId = id
      this.saveToLocalStorage()
      this.saveToSupabase()
    },

    setGoal(label, month) {
      if (label !== undefined) this.goalLabel = label
      if (month !== undefined) this.goalMonth = month
      this.saveToLocalStorage()
      this.saveToSupabase()
    }
  }
})
