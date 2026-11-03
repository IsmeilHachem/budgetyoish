import { defineStore } from 'pinia'
import { supabase } from '@/utils/supabase'
import { useAuthStore } from '@/stores/auth'

export const useIncomeGoalsStore = defineStore('incomeGoals', {
  state: () => ({
    target_monthly_income: 0,
    target_label: 'Break-even',
    loaded: false
  }),

  actions: {
    async loadFromSupabase() {
      const authStore = useAuthStore()
      if (!authStore.isLoggedIn) return

      const { data, error } = await supabase
        .from('income_goals')
        .select('*')
        .eq('user_id', authStore.userId)
        .maybeSingle()

      if (error) {
        console.error('Error loading income goals:', error)
        return
      }

      if (data) {
        this.target_monthly_income = data.target_monthly_income ?? 0
        this.target_label = data.target_label ?? 'Break-even'
      }

      this.loaded = true
    },

    async saveToSupabase() {
      const authStore = useAuthStore()
      if (!authStore.isLoggedIn) return false

      const { error } = await supabase
        .from('income_goals')
        .upsert({
          user_id: authStore.userId,
          target_monthly_income: Number(this.target_monthly_income),
          target_label: this.target_label,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })

      if (error) {
        console.error('Error saving income goals:', error)
        return false
      }

      return true
    }
  }
})
