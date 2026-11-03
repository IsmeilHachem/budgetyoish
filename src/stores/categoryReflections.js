import { defineStore } from 'pinia'
import { supabase } from '@/utils/supabase'
import { useAuthStore } from '@/stores/auth'

// Converts a YYYY-MM string to the first-of-month date string required by Supabase
function toMonthDate(monthStr) {
  if (typeof monthStr === 'string' && monthStr.length === 7) {
    return `${monthStr}-01`
  }
  if (monthStr instanceof Date) {
    const y = monthStr.getFullYear()
    const m = String(monthStr.getMonth() + 1).padStart(2, '0')
    return `${y}-${m}-01`
  }
  return monthStr
}

export const useCategoryReflectionsStore = defineStore('categoryReflections', {
  state: () => ({
    // Keyed by category name: { rating: 1|2|3, notes: string }
    ratings: {},
    currentMonth: null
  }),

  actions: {
    async loadForMonth(monthStr) {
      const authStore = useAuthStore()
      if (!authStore.isLoggedIn) return

      const monthDate = toMonthDate(monthStr)
      this.currentMonth = monthStr
      this.ratings = {}

      const { data, error } = await supabase
        .from('category_reflections')
        .select('*')
        .eq('user_id', authStore.userId)
        .eq('month', monthDate)

      if (error) {
        console.error('Error loading category reflections:', error)
        return
      }

      const ratings = {}
      for (const row of data || []) {
        ratings[row.category_name] = { rating: row.rating, notes: row.notes || '' }
      }
      this.ratings = ratings
    },

    async saveRating(categoryName, monthStr, rating, notes = '') {
      const authStore = useAuthStore()
      if (!authStore.isLoggedIn) return false

      const monthDate = toMonthDate(monthStr)

      const { error } = await supabase
        .from('category_reflections')
        .upsert({
          user_id: authStore.userId,
          category_name: categoryName,
          month: monthDate,
          rating,
          notes
        }, { onConflict: 'user_id,category_name,month' })

      if (error) {
        console.error('Error saving category reflection:', error)
        return false
      }

      this.ratings[categoryName] = { rating, notes }
      return true
    },

    getRating(categoryName) {
      return this.ratings[categoryName] ?? null
    }
  }
})
