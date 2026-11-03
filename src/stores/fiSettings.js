import { defineStore } from 'pinia'
import { supabase } from '@/utils/supabase'
import { useAuthStore } from '@/stores/auth'
import { useTransactionsStore } from '@/stores/transactions'

export const useFiSettingsStore = defineStore('fiSettings', {
  state: () => ({
    total_invested: 0,
    loaded: false
  }),

  getters: {
    // Average monthly expenses over the last 3 full months (not the current month)
    monthlyExpenses() {
      const transactionsStore = useTransactionsStore()
      const txAll = transactionsStore.getTransactions || []
      if (!txAll.length) return 0

      const now = new Date()
      let total = 0
      let validMonths = 0

      for (let i = 1; i <= 3; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const year = d.getFullYear()
        const month = d.getMonth() + 1

        let monthTotal = 0
        let hasData = false
        for (const t of txAll) {
          if (t.amount >= 0) continue
          const [y, m] = t.date.split('-').map(Number)
          if (y === year && m === month) {
            monthTotal += Math.abs(t.amount)
            hasData = true
          }
        }
        if (hasData) {
          total += monthTotal
          validMonths++
        }
      }

      return validMonths === 0 ? 0 : total / validMonths
    },

    annualExpenses() {
      return this.monthlyExpenses * 12
    },

    fiNumber() {
      return this.annualExpenses / 0.04
    },

    progressPercent(state) {
      if (this.fiNumber <= 0) return 0
      const raw = (state.total_invested / this.fiNumber) * 100
      return Math.min(100, Math.round(raw * 100) / 100)
    }
  },

  actions: {
    async loadFromSupabase() {
      const authStore = useAuthStore()
      if (!authStore.isLoggedIn) return

      const { data, error } = await supabase
        .from('fi_settings')
        .select('*')
        .eq('user_id', authStore.userId)
        .maybeSingle()

      if (error) {
        console.error('Error loading FI settings:', error)
        return
      }

      if (data) {
        this.total_invested = data.total_invested ?? 0
      }

      this.loaded = true
    },

    async saveToSupabase() {
      const authStore = useAuthStore()
      if (!authStore.isLoggedIn) return false

      const { error } = await supabase
        .from('fi_settings')
        .upsert({
          user_id: authStore.userId,
          total_invested: Number(this.total_invested),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })

      if (error) {
        console.error('Error saving FI settings:', error)
        return false
      }

      return true
    }
  }
})
