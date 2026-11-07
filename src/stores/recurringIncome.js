import { defineStore } from 'pinia'
import { supabase } from '@/utils/supabase'
import { useAuthStore } from '@/stores/auth'
import { generateTimestamp } from '@/utils/dateUtils'

const DATA_TYPE = 'recurring_income'

export const useRecurringIncomeStore = defineStore('recurringIncome', {
  state: () => ({
    sources: [],
    confirmedOccurrences: {},
    initialized: false
  }),

  getters: {
    getSources: (state) => state.sources,
    getConfirmedOccurrences: (state) => state.confirmedOccurrences,
    getSourceById: (state) => (id) => state.sources.find(s => s.id === id)
  },

  actions: {
    async loadFromSupabase() {
      const authStore = useAuthStore()
      if (authStore.loading) await authStore.init()
      if (!authStore.isLoggedIn) return

      const { data, error } = await supabase
        .from('user_data')
        .select('data')
        .eq('data_type', DATA_TYPE)
        .maybeSingle()

      if (error) {
        console.error('Error loading recurring income from Supabase:', error)
        return
      }

      if (!data) {
        this.sources = []
        this.confirmedOccurrences = {}
        this.initialized = true
        return
      }

      const parsed = data.data || {}
      this.sources = Array.isArray(parsed.sources) ? parsed.sources : []
      this.confirmedOccurrences = parsed.confirmedOccurrences && typeof parsed.confirmedOccurrences === 'object'
        ? parsed.confirmedOccurrences
        : {}
      this.initialized = true
    },

    saveToSupabase() {
      const authStore = useAuthStore()
      if (!authStore.isLoggedIn) return
      // Never overwrite Supabase before recurring income has been loaded
      if (!this.initialized) return

      supabase.from('user_data').upsert({
        user_id: authStore.userId,
        data_type: DATA_TYPE,
        data: {
          sources: this.sources,
          confirmedOccurrences: this.confirmedOccurrences
        },
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,data_type' }).then(({ error }) => {
        if (error) console.error('Error saving recurring income to Supabase:', error)
      })
    },

    async initialize() {
      if (this.initialized) return
      await this.loadFromSupabase()
    },

    addSource(source) {
      if (!source || !source.name || !source.startDate || !source.frequency) return false
      const amount = Math.abs(Number(source.amount))
      if (!amount || amount <= 0 || isNaN(amount)) return false

      const newSource = {
        id: source.id || generateTimestamp(),
        name: String(source.name).trim(),
        amount,
        category: source.category || 'Pay Day - Pay Day',
        frequency: source.frequency,
        startDate: source.startDate,
        days: Array.isArray(source.days)
          ? source.days.map(d => Number(d)).filter(d => !isNaN(d) && d >= 1 && d <= 31)
          : [],
        endDate: source.endDate ? String(source.endDate).trim() : null
      }

      this.sources.push(newSource)
      this.saveToSupabase()
      return newSource
    },

    editSource(id, updates = {}) {
      const source = this.sources.find(s => s.id === id)
      if (!source) return false

      if (updates.name !== undefined) {
        source.name = String(updates.name).trim()
      }
      if (updates.amount !== undefined) {
        const amt = Math.abs(Number(updates.amount))
        if (!amt || amt <= 0 || isNaN(amt)) return false
        source.amount = amt
      }
      if (updates.category !== undefined) {
        source.category = updates.category
      }
      if (updates.frequency !== undefined) {
        source.frequency = updates.frequency
      }
      if (updates.startDate !== undefined) {
        source.startDate = updates.startDate
      }
      if (updates.days !== undefined) {
        source.days = Array.isArray(updates.days)
          ? updates.days.map(d => Number(d)).filter(d => !isNaN(d) && d >= 1 && d <= 31)
          : []
      }
      if (updates.endDate !== undefined) {
        source.endDate = updates.endDate ? String(updates.endDate).trim() : null
      }

      this.saveToSupabase()
      return true
    },

    deleteSource(id) {
      const index = this.sources.findIndex(s => s.id === id)
      if (index === -1) return false

      this.sources.splice(index, 1)
      if (this.confirmedOccurrences && this.confirmedOccurrences[id]) {
        const nextConfirmed = { ...this.confirmedOccurrences }
        delete nextConfirmed[id]
        this.confirmedOccurrences = nextConfirmed
      }

      this.saveToSupabase()
      return true
    },

    markConfirmed(sourceId, scheduledDate, amount, paidDate) {
      if (!sourceId || !scheduledDate) return false
      if (!this.confirmedOccurrences[sourceId]) {
        this.confirmedOccurrences[sourceId] = {}
      }
      this.confirmedOccurrences[sourceId][scheduledDate] = {
        amount: Math.abs(Number(amount)),
        paidDate
      }
      this.saveToSupabase()
      return true
    }
  }
})

