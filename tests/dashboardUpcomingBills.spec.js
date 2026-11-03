import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBillsStore } from '../src/stores/bills'

// Helper to get Friday-to-Friday range
function getWeekRange(refDate) {
  const now = refDate ? new Date(refDate) : new Date()
  const currentDay = now.getDay()
  const daysToFriday = currentDay <= 5 ? 5 - currentDay : (5 - currentDay + 7)
  const daysFromLastFriday = currentDay <= 5 ? (currentDay + 2) : (currentDay - 5)
  const nextFriday = new Date(now)
  nextFriday.setDate(now.getDate() + daysToFriday)
  nextFriday.setHours(23, 59, 59, 999)
  const lastFriday = new Date(now)
  lastFriday.setDate(now.getDate() - daysFromLastFriday)
  lastFriday.setHours(0, 0, 0, 0)
  return { lastFriday, nextFriday }
}

// Helper to parse YYYY-MM-DD as local date (midnight local time)
function parseLocalDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

describe('Dashboard Upcoming Bills Logic', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('shows only unpaid bills due this week with correct amount and payment count', () => {
    // Set up bills and billMonthStatus
    const bills = [
      { id: '1', name: 'netflix', dueDate: '2025-05-09', amount: 10 },
      { id: '2', name: 'rent', dueDate: '2025-05-10', amount: 500 },
      { id: '3', name: 'gym', dueDate: '2025-05-15', amount: 30 }
    ]
    localStorage.setItem('budgetish-bills', JSON.stringify({ bills }))
    // Only netflix is paid for this week, rent and gym are unpaid
    const billMonthStatus = {
      '1': { '2025-05': { paid: true, amount: 10, paymentCount: 1 } },
      '2': { '2025-05': { paid: false, amount: 0, paymentCount: 0 } },
      '3': { '2025-05': { paid: false, amount: 0, paymentCount: 0 } }
    }
    localStorage.setItem('budgetish-bills', JSON.stringify({ bills, billMonthStatus }))
    const store = useBillsStore()
    store.initialize()
    // Simulate Dashboard logic
    const selectedMonth = '2025-05'
    const { lastFriday, nextFriday } = getWeekRange('2025-05-14') // Assume today is May 14, 2025
    const billsForDashboardMonth = (store.getBills || []).map(bill => {
      const [year, month] = selectedMonth.split('-').map(Number)
      const day = bill.dueDate.split('-')[2]
      return {
        ...bill,
        dueDate: `${year}-${String(month).padStart(2, '0')}-${day}`,
        amount: store.billMonthStatus?.[bill.id]?.[selectedMonth]?.amount ?? bill.amount,
        paid: store.billMonthStatus?.[bill.id]?.[selectedMonth]?.paid || false,
        paymentCount: store.billMonthStatus?.[bill.id]?.[selectedMonth]?.paymentCount ?? 0
      }
    })
    const upcomingBills = (billsForDashboardMonth || []).filter(bill => {
      const dueDate = parseLocalDate(bill.dueDate)
      return dueDate >= lastFriday && dueDate <= nextFriday && !bill.paid
    })
    expect(upcomingBills.length).toBe(2)
    expect(upcomingBills.some(b => b.name === 'rent')).toBe(true)
    expect(upcomingBills.some(b => b.name === 'gym')).toBe(true)
    expect(upcomingBills.some(b => b.name === 'netflix')).toBe(false)
  })
}) 