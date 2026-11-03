import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useTransactionsStore } from './transactions'
import { useBillsStore } from './bills'
import { parseESTDate } from '@/utils/dateUtils'

export const useDashboardStore = defineStore('dashboard', {
  state: () => {
    // Get current month in YYYY-MM
    const now = new Date();
    const yyyyMm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return {
      selectedDateRange: { start: yyyyMm, end: yyyyMm },
      categoryStats: {},
      monthlyTrends: [],
      lastUpdate: null
    }
  },

  actions: {
    setDateRange(range) {
      console.log('[DashboardStore] setDateRange called with:', range)
      this.selectedDateRange = range
    },

    updateMonthlyTrends(transactions) {
      // Cache invalidation check
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()
      const cacheKey = `${currentYear}-${currentMonth}`
      
      if (this.lastUpdate === cacheKey && this.monthlyTrends.length > 0) {
        return // Data is still valid
      }

      // Get current month and next 5 months
      const months = []
      for (let i = 0; i < 6; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() + i, 1)
        months.push(date)
      }

      // Create a map for faster lookups
      const monthMap = new Map(
        months.map(date => [
          `${date.getFullYear()}-${date.getMonth()}`,
          {
            date,
            income: 0,
            expenses: 0
          }
        ])
      )

      // Process transactions more efficiently using EST parsing
      transactions.forEach(transaction => {
        if (transaction.description && transaction.description.toLowerCase() === 'starting balance') return;
        const transDate = parseESTDate(transaction.date)
        const monthKey = `${transDate.getUTCFullYear()}-${transDate.getUTCMonth()}`
        const monthData = monthMap.get(monthKey)
        if (monthData) {
          if (transaction.amount > 0) {
            monthData.income += transaction.amount
          } else {
            monthData.expenses += transaction.amount
          }
        }
      })

      // Convert map back to array in chronological order
      this.monthlyTrends = months.map(date => 
        monthMap.get(`${date.getFullYear()}-${date.getMonth()}`)
      )
      
      this.lastUpdate = cacheKey
    },

    updateCategoryStats(transactions) {
      // Use reduce instead of forEach for better performance
      this.categoryStats = transactions.reduce((stats, transaction) => {
        // Skip if no category or if it's a positive amount (income)
        if (!transaction.category || transaction.amount > 0) return stats

        // Only use main category
        const mainCategory = transaction.category.split(' - ')[0]
        
        if (!stats[mainCategory]) {
          stats[mainCategory] = { 
            total: 0, 
            count: 0,
            average: 0,
            highest: 0
          }
        }

        const amount = Math.abs(transaction.amount)
        stats[mainCategory].total += amount
        stats[mainCategory].count++
        stats[mainCategory].average = stats[mainCategory].total / stats[mainCategory].count
        stats[mainCategory].highest = Math.max(stats[mainCategory].highest, amount)

        return stats
      }, {})

      // Sort categories by total amount
      const sortedStats = {}
      Object.entries(this.categoryStats)
        .sort((a, b) => b[1].total - a[1].total)
        .forEach(([category, data]) => {
          sortedStats[category] = data
        })
      
      this.categoryStats = sortedStats
    }
  }
})

// Helper: Calculate monthly trends for a given range
export function calculateMonthlyTrends(transactions, range) {
  // 1. Parse range start/end as local dates
  let [sy, sm] = (range && range.start ? range.start : '').split('-').map(Number)
  let [ey, em] = (range && range.end ? range.end : '').split('-').map(Number)
  
  // If no range provided, determine range from transaction dates
  if (!sy || !sm || !ey || !em) {
    // If range was explicitly provided but is invalid (empty strings), return empty array
    if (range && (range.start === '' || range.end === '')) {
      return []
    }
    
    if (!transactions || transactions.length === 0) return []
    
    // Find min and max dates from transactions
    const dates = transactions.map(t => {
      const [ty, tm] = t.date.split('-').map(Number)
      return new Date(ty, tm - 1, 1)
    })
    const minDate = new Date(Math.min(...dates))
    const maxDate = new Date(Math.max(...dates))
    
    sy = minDate.getFullYear()
    sm = minDate.getMonth() + 1
    ey = maxDate.getFullYear()
    em = maxDate.getMonth() + 1
  }
  let start = new Date(sy, sm - 1, 1)
  let end = new Date(ey, em - 1, 1)

  // 2. Generate all months from start to end (inclusive)
  let months = []
  let d = new Date(start)
  while (d <= end) {
    months.push(new Date(d))
    d.setMonth(d.getMonth() + 1)
  }

  // 3. Filter transactions by selected date range
  const filtered = transactions.filter(t => {
    const [ty, tm] = t.date.split('-').map(Number)
    const tDate = new Date(ty, tm - 1, 1)
    return tDate >= start && tDate <= end
  })

  // 4. Sum income/expenses for each month
  const monthMap = new Map(
    months.map(date => [
      `${date.getFullYear()}-${date.getMonth()}`,
      { date, income: 0, expenses: 0 }
    ])
  )
  filtered.forEach(transaction => {
    if (transaction.description && transaction.description.toLowerCase() === 'starting balance') return
    const [ty, tm] = transaction.date.split('-').map(Number)
    const transDate = new Date(ty, tm - 1, 1)
    const monthKey = `${transDate.getFullYear()}-${transDate.getMonth()}`
    const monthData = monthMap.get(monthKey)
    if (monthData) {
      if (transaction.amount > 0) {
        monthData.income += transaction.amount
      } else {
        monthData.expenses += transaction.amount
      }
    }
  })

  // 5. Return array in chronological order
  return months.map(date => monthMap.get(`${date.getFullYear()}-${date.getMonth()}`))
} 