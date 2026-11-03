import { defineStore } from 'pinia'
import { supabase } from '@/utils/supabase'
import { useAuthStore } from '@/stores/auth'
import { generateTimestamp } from '@/utils/dateUtils'
import { PLAN_QUARTERS } from '@/data/spainPlan'

const LS_KEY = 'budgetish-spain-plan'
const DATA_TYPE = 'spain_plan'

export const usePlanStore = defineStore('plan', {
  state: () => ({
    done: {},        // { [taskId]: true }
    custom: {},      // { [quarterId]: [{ id, text }] }
    storedQuarters: null, // Array of quarter objects when stored in Supabase/localStorage
    initialized: false
  }),

  getters: {
    quarters: (state) =>
      (Array.isArray(state.storedQuarters) && state.storedQuarters.length > 0
        ? state.storedQuarters
        : PLAN_QUARTERS
      ).map(q => ({
        ...q,
        tasks: [
          ...q.tasks.map(t => ({ ...t, custom: false })),
          ...(state.custom[q.id] || []).map(t => ({ ...t, custom: true }))
        ]
      }))
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

      if (error) { console.error('Error loading plan from Supabase:', error); return }
      if (!data) { this.initialized = true; return } // first run: nothing saved yet, safe to save

      const parsed = data.data || {}
      this.done = parsed.done || {}
      this.custom = parsed.custom || {}
      if (Array.isArray(parsed.quarters)) this.storedQuarters = parsed.quarters
      this.initialized = true
      this.saveToLocalStorage()
    },

    saveToSupabase() {
      const authStore = useAuthStore()
      if (!authStore.isLoggedIn) return
      // Never overwrite Supabase before the plan has been loaded — would wipe real data
      if (!this.initialized) return

      if (this._saveTimer) clearTimeout(this._saveTimer)
      this._saveTimer = setTimeout(() => {
        const payload = { done: this.done, custom: this.custom }
        if (Array.isArray(this.storedQuarters)) payload.quarters = this.storedQuarters
        supabase.from('user_data').upsert({
          user_id: authStore.userId,
          data_type: DATA_TYPE,
          data: payload,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,data_type' }).then(({ error }) => {
          if (error) console.error('Error saving plan to Supabase:', error)
        })
      }, 400)
    },

    async initialize() {
      await this.loadFromSupabase()
      if (!this.initialized) {
        try {
          const stored = localStorage.getItem(LS_KEY)
          if (stored) {
            const data = JSON.parse(stored)
            this.done = data.done || {}
            this.custom = data.custom || {}
            if (Array.isArray(data.quarters)) this.storedQuarters = data.quarters
          }
        } catch (error) {
          console.error('Error loading plan from localStorage:', error)
        }
        this.initialized = true
        this.saveToLocalStorage()
      }
    },

    saveToLocalStorage() {
      try {
        const payload = { done: this.done, custom: this.custom }
        if (Array.isArray(this.storedQuarters)) payload.quarters = this.storedQuarters
        localStorage.setItem(LS_KEY, JSON.stringify(payload))
      } catch (error) {
        console.error('Error saving plan to localStorage:', error)
      }
    },

    persist() { this.saveToLocalStorage(); this.saveToSupabase() },

    toggle(taskId) {
      this.done = { ...this.done, [taskId]: !this.done[taskId] }
      this.persist()
    },

    addTask(quarterId, text) {
      const t = (text || '').trim()
      if (!t) return false
      const list = this.custom[quarterId] || []
      const randomSuffix = Math.random().toString(36).slice(2, 7)
      this.custom = { ...this.custom, [quarterId]: [...list, { id: `c-${generateTimestamp()}-${randomSuffix}`, text: t }] }
      this.persist()
      return true
    },

    removeTask(quarterId, taskId) {
      this.custom = { ...this.custom, [quarterId]: (this.custom[quarterId] || []).filter(t => t.id !== taskId) }
      const { [taskId]: _removed, ...rest } = this.done
      this.done = rest
      this.persist()
    },

    reset() {
      this.done = {}
      this.custom = {}
      this.persist()
    }
  }
})
