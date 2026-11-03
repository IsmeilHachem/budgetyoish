import { defineStore } from 'pinia'
import { supabase } from '@/utils/supabase'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loading: true,
    initialized: false
  }),

  getters: {
    isLoggedIn: (state) => !!state.user,
    userId: (state) => state.user?.id ?? null
  },

  actions: {
    async init() {
      // Already initialized — don't re-run
      if (this.initialized) return

      const { data: { session } } = await supabase.auth.getSession()
      this.user = session?.user ?? null
      this.loading = false
      this.initialized = true

      supabase.auth.onAuthStateChange((_event, session) => {
        this.user = session?.user ?? null
      })
    },

    async signIn(email, password) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      this.user = data.user
    },

    async signUp(email, password) {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      this.user = data.user
    },

    async signOut() {
      await supabase.auth.signOut()
      this.user = null
    }
  }
})
