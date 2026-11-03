export const MILESTONE_DEFS = [
  {
    key: 'one_month_buffer',
    name: 'One Month Buffer',
    message: "You have one full month of expenses saved. You're no longer one emergency away from crisis."
  },
  {
    key: 'emergency_fund',
    name: 'Emergency Fund',
    message: "Three months of expenses saved. You have a real safety net. This changes everything."
  },
  {
    key: 'first_10k',
    name: 'First $10,000 Invested',
    message: "Your first $10,000 invested. The compound growth curve starts here. Every dollar from now works harder."
  },
  {
    key: 'fi_crossover',
    name: 'FI Crossover',
    message: "Your investment income now covers your expenses. You are financially independent. This is what it was all for."
  }
]

const LS_CELEBRATED = 'budgetish-celebrated-milestones'
const LS_ACHIEVED_DATES = 'budgetish-milestone-achieved-dates'

export function getCelebrated() {
  try { return JSON.parse(localStorage.getItem(LS_CELEBRATED) || '[]') } catch { return [] }
}

export function isCelebrated(key) {
  return getCelebrated().includes(key)
}

export function markCelebrated(key) {
  const list = getCelebrated()
  if (!list.includes(key)) {
    list.push(key)
    localStorage.setItem(LS_CELEBRATED, JSON.stringify(list))
  }
}

export function getAchievedDates() {
  try { return JSON.parse(localStorage.getItem(LS_ACHIEVED_DATES) || '{}') } catch { return {} }
}

/**
 * Records the current month as the achievement date for a milestone.
 * Returns true if it was newly recorded, false if already recorded.
 */
export function recordAchievedDate(key) {
  const dates = getAchievedDates()
  if (!dates[key]) {
    const now = new Date()
    dates[key] = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    localStorage.setItem(LS_ACHIEVED_DATES, JSON.stringify(dates))
    return true
  }
  return false
}
