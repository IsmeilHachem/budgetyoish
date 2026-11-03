import { defineStore } from 'pinia'
import { supabase } from '@/utils/supabase'
import { useAuthStore } from './auth'

export const useReflectionsStore = defineStore('reflections', {
  state: () => ({
    reflections: [],
    initialized: false
  }),
  getters: {
    getReflections: (state) => state.reflections,
    getReflectionByPeriod: (state) => (periodType, periodStart) =>
      state.reflections.find(r => r.periodType === periodType && r.periodStart === periodStart),
    getReflectionsByType: (state) => (periodType) =>
      state.reflections.filter(r => r.periodType === periodType)
  },
  actions: {
    async loadFromSupabase() {
      const authStore = useAuthStore()
      if (authStore.loading) await authStore.init()
      if (!authStore.isLoggedIn) return

      const { data, error } = await supabase
        .from('user_data')
        .select('data')
        .eq('data_type', 'reflections')
        .single()

      if (error || !data) return

      this.reflections = data.data.reflections || []
      this.initialized = true
      this.saveToLocalStorage()
    },

    saveToSupabase() {
      const authStore = useAuthStore()
      if (!authStore.isLoggedIn) return
      supabase.from('user_data').upsert({
        user_id: authStore.userId,
        data_type: 'reflections',
        data: { reflections: this.reflections },
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,data_type' }).then(({ error }) => {
        if (error) console.error('Error saving reflections to Supabase:', error)
      })
    },

    async initialize() {
      await this.loadFromSupabase()
      if (!this.initialized) {
        const stored = localStorage.getItem('budgetish-reflections')
        if (stored) this.reflections = JSON.parse(stored)
        this.initialized = true
      }
    },

    saveToLocalStorage() {
      localStorage.setItem('budgetish-reflections', JSON.stringify(this.reflections))
    },

    addOrUpdateReflection(reflection) {
      const idx = this.reflections.findIndex(r => r.periodType === reflection.periodType && r.periodStart === reflection.periodStart)
      if (idx !== -1) {
        this.reflections[idx] = { ...this.reflections[idx], ...reflection, updatedAt: new Date().toISOString() }
      } else {
        this.reflections.push({ ...reflection, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
      }
      this.saveToLocalStorage()
      this.saveToSupabase()
    },

    deleteReflection(periodType, periodStart) {
      this.reflections = this.reflections.filter(r => !(r.periodType === periodType && r.periodStart === periodStart))
      this.saveToLocalStorage()
      this.saveToSupabase()
    }
  }
}) 