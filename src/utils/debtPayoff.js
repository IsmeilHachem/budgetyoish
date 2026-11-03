// Debt payoff simulator for BudgetYoish.
// Month-by-month model: accrue interest, pay every minimum, cover any shortfall
// on a chosen card, then send all leftover cash to debts in strategy order.
// Once every debt is gone, leftover cash accumulates as savings.
//
// Months are 'YYYY-MM' strings so they sort and compare as plain strings.

export const STRATEGIES = {
  avalanche: 'avalanche', // highest APR first (least interest paid)
  snowball: 'snowball' // smallest balance first (fastest wins)
}

export function addMonths(ym, n) {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// An item is active in `ym` when start <= ym < end. Missing start/end means open-ended.
// enabled: false switches a line off without deleting it (used for what-if scenarios).
function isActive(item, ym) {
  if (item.enabled === false) return false
  if (item.start && ym < item.start) return false
  if (item.end && ym >= item.end) return false
  return true
}

function sumActive(items, ym) {
  return items.reduce((total, item) => total + (isActive(item, ym) ? Number(item.amount) || 0 : 0), 0)
}

function orderDebts(debts, strategy) {
  const open = debts.filter(d => d.balance > 0.005)
  if (strategy === STRATEGIES.snowball) {
    return open.sort((a, b) => a.balance - b.balance)
  }
  return open.sort((a, b) => b.apr - a.apr)
}

/**
 * @param {Object} plan
 * @param {Array<{id:string,name:string,balance:number,apr:number,minPayment:number}>} plan.debts
 *        apr is a percentage, e.g. 23.49
 * @param {Array<{label:string,amount:number,start?:string,end?:string}>} plan.income  monthly take-home sources
 * @param {Array<{label:string,amount:number,start?:string,end?:string}>} plan.expenses monthly non-debt expenses
 * @param {string} plan.startMonth  'YYYY-MM' — first simulated month
 * @param {number} [plan.months=60]  how many months to simulate
 * @param {string} [plan.strategy='avalanche']
 * @param {string} [plan.shortfallDebtId]  card that absorbs months where income < expenses + minimums
 *        (defaults to the highest-APR card)
 * @param {number} [plan.startingSavings=0]
 */
export function simulateDebtPlan(plan) {
  const {
    income = [],
    expenses = [],
    startMonth,
    months = 60,
    strategy = STRATEGIES.avalanche,
    startingSavings = 0
  } = plan

  const debts = (plan.debts || []).map(d => ({
    id: d.id,
    name: d.name,
    balance: Number(d.balance) || 0,
    apr: Number(d.apr) || 0,
    minPayment: Number(d.minPayment) || 0
  }))

  const shortfallId = plan.shortfallDebtId
    || [...debts].sort((a, b) => b.apr - a.apr)[0]?.id

  const rows = []
  const payoffMonth = {}
  let savings = startingSavings
  let debtFreeMonth = null
  let peak = { month: startMonth, total: debts.reduce((s, d) => s + d.balance, 0) }
  let totalInterest = 0

  for (let i = 0; i < months; i++) {
    const ym = addMonths(startMonth, i)

    // 1. Interest
    let interestThisMonth = 0
    for (const d of debts) {
      if (d.balance > 0) {
        const interest = d.balance * (d.apr / 100 / 12)
        d.balance += interest
        interestThisMonth += interest
      }
    }
    totalInterest += interestThisMonth

    // 2. Cash available after living expenses
    const monthIncome = sumActive(income, ym)
    const monthExpenses = sumActive(expenses, ym)
    let cash = monthIncome - monthExpenses

    // 3. Minimum payments
    for (const d of debts) {
      const pay = Math.min(d.minPayment, d.balance)
      d.balance -= pay
      cash -= pay
    }

    // 4. Shortfall goes onto the designated shortfall card
    let shortfall = 0
    if (cash < 0) {
      shortfall = -cash
      const card = debts.find(d => d.id === shortfallId)
      if (card) card.balance += shortfall
      cash = 0
    }

    // 5. Extra cash to debts in strategy order, then to savings
    let extraPaid = 0
    for (const d of orderDebts(debts, strategy)) {
      if (cash <= 0) break
      const pay = Math.min(cash, d.balance)
      d.balance -= pay
      cash -= pay
      extraPaid += pay
    }
    savings += cash

    // 6. Bookkeeping
    for (const d of debts) {
      if (d.balance <= 0.005) {
        d.balance = 0
        if (!payoffMonth[d.id]) payoffMonth[d.id] = ym
      }
    }
    const totalDebt = debts.reduce((s, d) => s + d.balance, 0)
    if (totalDebt > peak.total) peak = { month: ym, total: totalDebt }
    if (totalDebt === 0 && !debtFreeMonth) debtFreeMonth = ym

    rows.push({
      month: ym,
      income: round(monthIncome),
      expenses: round(monthExpenses),
      interest: round(interestThisMonth),
      shortfall: round(shortfall),
      extraPaid: round(extraPaid),
      totalDebt: round(totalDebt),
      savings: round(savings),
      balances: Object.fromEntries(debts.map(d => [d.id, round(d.balance)]))
    })
  }

  return {
    rows,
    debtFreeMonth,
    payoffMonth,
    peakDebt: { month: peak.month, total: round(peak.total) },
    totalInterest: round(totalInterest),
    payoffOrder: (plan.debts || [])
      .map(d => ({ id: d.id, name: d.name, month: payoffMonth[d.id] || null }))
      .sort((a, b) => (a.month || '9999').localeCompare(b.month || '9999'))
  }
}

// Value of the savings balance in a given month (e.g. the move date).
export function savingsAt(result, ym) {
  const row = result.rows.find(r => r.month === ym)
  return row ? row.savings : null
}

function round(n) {
  return Math.round(n * 100) / 100
}
