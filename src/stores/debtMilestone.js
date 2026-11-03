import { defineStore } from 'pinia'
import { supabase } from '@/utils/supabase'
import { useAuthStore } from '@/stores/auth'

const DATA_TYPE = 'debt_milestone'
const YM_REGEX = /^\d{4}-\d{2}$/

export const useDebtMilestoneStore = defineStore('debtMilestone', {
  state: () => ({
    milestone: null
  }),

  getters: {
    hasMilestone: (state) => state.milestone !== null
  },

  actions: {
    async loadFromSupabase() {
      const authStore = useAuthStore()
      if (authStore.loading) await authStore.init()
      if (!authStore.isLoggedIn) {
        this.milestone = null
        return
      }

      const { data, error } = await supabase
        .from('user_data')
        .select('data')
        .eq('data_type', DATA_TYPE)
        .eq('user_id', authStore.userId)
        .maybeSingle()

      if (error) {
        console.error('Error loading debt milestone from Supabase:', error)
        this.milestone = null
        return
      }

      const parsed = data?.data
      if (
        parsed &&
        typeof parsed.monthly === 'number' &&
        parsed.monthly > 0 &&
        typeof parsed.start === 'string' &&
        YM_REGEX.test(parsed.start) &&
        typeof parsed.end === 'string' &&
        YM_REGEX.test(parsed.end)
      ) {
        this.milestone = {
          name: parsed.name ?? '',
          monthly: parsed.monthly,
          start: parsed.start,
          end: parsed.end
        }
      } else {
        this.milestone = null
      }
    }
  }
})

