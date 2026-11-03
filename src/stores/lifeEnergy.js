import { defineStore } from 'pinia'
import { supabase } from '@/utils/supabase'
import { useAuthStore } from '@/stores/auth'

export const useLifeEnergyStore = defineStore('lifeEnergy', {
  state: () => ({
    monthly_take_home: 0,
    monthly_work_costs: 0,
    monthly_work_hours: 0,
    monthly_work_overhead_hours: 0,
    loaded: false
  }),

  getters: {
    lifeEnergyRate: (state) => {
      const totalHours = state.monthly_work_hours + state.monthly_work_overhead_hours
      if (totalHours <= 0) return 0
      const netIncome = state.monthly_take_home - state.monthly_work_costs
      if (netIncome <= 0) return 0
      return netIncome / totalHours
    }
  },

  actions: {
    // Returns "X.X hrs" string or null if rate is not set
    toCost(dollars) {
      if (this.lifeEnergyRate <= 0) return null
      const hours = Math.abs(dollars) / this.lifeEnergyRate
      return `${hours.toFixed(1)} hrs`
    },

    async loadFromSupabase() {
      const authStore = useAuthStore()
      if (!authStore.isLoggedIn) return

      const { data, error } = await supabase
        .from('life_energy_settings')
        .select('*')
        .eq('user_id', authStore.userId)
        .maybeSingle()

      if (error) {
        console.error('Error loading life energy settings:', error)
        return
      }

      if (data) {
        this.monthly_take_home = data.monthly_take_home ?? 0
        this.monthly_work_costs = data.monthly_work_costs ?? 0
        this.monthly_work_hours = data.monthly_work_hours ?? 0
        this.monthly_work_overhead_hours = data.monthly_work_overhead_hours ?? 0
      }

      this.loaded = true
    },

    async saveToSupabase() {
      const authStore = useAuthStore()
      if (!authStore.isLoggedIn) return false

      const { error } = await supabase
        .from('life_energy_settings')
        .upsert({
          user_id: authStore.userId,
          monthly_take_home: Number(this.monthly_take_home),
          monthly_work_costs: Number(this.monthly_work_costs),
          monthly_work_hours: Number(this.monthly_work_hours),
          monthly_work_overhead_hours: Number(this.monthly_work_overhead_hours),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })

      if (error) {
        console.error('Error saving life energy settings:', error)
        return false
      }

      return true
    }
  }
})
