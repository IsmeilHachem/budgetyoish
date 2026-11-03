import { ref } from 'vue'
import { useTransactionsStore } from '@/stores/transactions'
import { useLifeEnergyStore } from '@/stores/lifeEnergy'

export function useGeminiInsights() {
  const insights = ref(localStorage.getItem('budgetish-gemini-insights') || null)
  const loading = ref(false)
  const error = ref(null)

  const generateInsights = async (forceRefresh = false) => {
    // If not forcing refresh and we already have cached insights, do not call API
    if (!forceRefresh && insights.value) {
      return
    }

    loading.value = true
    error.value = null

    try {
      const transactionsStore = useTransactionsStore()
      const lifeEnergyStore = useLifeEnergyStore()

      // Ensure stores are initialized
      if (!transactionsStore.initialized) {
        await transactionsStore.initialize()
      }
      if (!lifeEnergyStore.loaded) {
        await lifeEnergyStore.loadFromSupabase()
      }

      const transactions = transactionsStore.getTransactions || []

      // Calculate the date 90 days ago relative to current local time
      const ninetyDaysAgo = new Date()
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
      // Set to start of day to be inclusive
      ninetyDaysAgo.setHours(0, 0, 0, 0)

      // Filter transactions from the last 90 days
      const last90DaysTransactions = transactions.filter(t => {
        if (!t.date) return false
        const [y, m, d] = t.date.split('-').map(Number)
        const transDate = new Date(y, m - 1, d)
        return transDate >= ninetyDaysAgo
      })

      // Call Vercel serverless function
      const response = await fetch('/api/gemini-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transactions: last90DaysTransactions,
          lifeEnergyRate: lifeEnergyStore.lifeEnergyRate
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Server returned error status ${response.status}`)
      }

      const data = await response.json()
      
      if (data.insights) {
        insights.value = data.insights
        localStorage.setItem('budgetish-gemini-insights', data.insights)
      } else {
        throw new Error('API response did not contain "insights".')
      }
    } catch (err) {
      console.error('Failed to generate spending insights:', err)
      error.value = err.message || 'An error occurred while generating insights.'
    } finally {
      loading.value = false
    }
  }

  const clearCachedInsights = () => {
    insights.value = null
    localStorage.removeItem('budgetish-gemini-insights')
  }

  return {
    insights,
    loading,
    error,
    generateInsights,
    clearCachedInsights
  }
}
