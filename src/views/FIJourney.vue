<template>
  <div class="min-h-screen bg-slate-950">
    <div class="w-full px-4 md:px-6 lg:px-8 py-8 space-y-8">

      <!-- Header -->
      <div class="bg-gradient-to-br from-green-950 to-slate-900 rounded-2xl shadow-xl p-8 border border-green-900">
        <div class="flex items-center space-x-4">
          <div class="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg text-3xl">
            🌅
          </div>
          <div>
            <h1 class="text-4xl font-bold text-white">
              Path to Freedom
            </h1>
            <p class="text-slate-300 mt-1">Your journey to financial independence</p>
          </div>
        </div>
      </div>

      <!-- Section 4: Key Numbers (displayed above chart) -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-slate-800 rounded-2xl shadow-lg p-5 border border-slate-700 border-l-4 border-l-green-500">
          <div class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Avg Monthly Expenses</div>
          <div class="text-xl font-bold text-red-400">{{ fmt(avgMonthlyExpenses) }}</div>
          <div class="text-xs text-slate-400 mt-1">3-month average</div>
        </div>
        <div class="bg-slate-800 rounded-2xl shadow-lg p-5 border border-slate-700 border-l-4 border-l-green-500">
          <div class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Investment Income/mo</div>
          <div class="text-xl font-bold text-green-400">{{ fmt(currentInvestmentIncome) }}</div>
          <div class="text-xs text-slate-400 mt-1">4% rule · {{ fmt(fiSettingsStore.total_invested) }} invested</div>
        </div>
        <div class="bg-slate-800 rounded-2xl shadow-lg p-5 border border-slate-700 border-l-4 border-l-green-500">
          <div class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Monthly Gap</div>
          <div class="text-xl font-bold text-orange-400">{{ fmt(monthlyGap) }}</div>
          <div class="text-xs text-slate-400 mt-1">to cover with investments</div>
        </div>
        <div class="bg-slate-800 rounded-2xl shadow-lg p-5 border border-slate-700 border-l-4 border-l-green-500">
          <div class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Projected Crossover</div>
          <div class="text-lg font-bold text-green-400 leading-tight">{{ crossoverResult.date }}</div>
          <div class="text-xs text-slate-400 mt-1">at ${{ monthlyInvestment }}/mo invested</div>
        </div>
      </div>

      <!-- Section 1: Crossover Chart -->
      <div class="bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-700">
        <div class="flex items-center space-x-3 mb-6">
          <div class="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h2 class="text-xl font-bold text-slate-100">The Crossover Chart</h2>
        </div>

        <div class="relative" style="height: 400px;">
          <Line :data="chartData" :options="chartOptions" :plugins="chartPlugins" />
        </div>

        <div v-if="crossoverResult.beyond40" class="mt-4 p-4 bg-amber-950/40 border border-amber-500/30 rounded-xl text-sm text-amber-300">
          ⚠️ At current pace, crossover is 40+ years away. Increasing monthly investment moves this date closer.
        </div>
        <div v-else-if="crossoverResult.alreadyThere" class="mt-4 p-4 bg-green-950/40 border border-green-500/30 rounded-xl text-sm text-green-300 font-semibold">
          🎉 Your investment income already covers your expenses. You've reached the crossover point!
        </div>
        <div v-else class="mt-4 p-3 bg-slate-700/40 rounded-xl text-sm text-slate-300 flex items-center gap-2">
          <span class="text-green-400 font-bold text-lg">✦</span>
          <span>Freedom point: <strong>{{ crossoverResult.date }}</strong> · {{ crossoverResult.years }} years from today</span>
        </div>
      </div>

      <!-- Section 2: What If Simulator -->
      <div class="bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-700">
        <div class="flex items-center space-x-3 mb-6">
          <div class="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <h2 class="text-xl font-bold text-slate-100">What If Simulator</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
          <div>
            <label class="block text-sm font-semibold text-slate-300 mb-3">
              If I invest <span class="text-green-400 font-bold text-base">${{ monthlyInvestment }}</span>/month…
            </label>
            <input
              type="range"
              v-model.number="monthlyInvestment"
              min="0" max="2000" step="50"
              class="w-full h-2 rounded-full appearance-none cursor-pointer accent-green-500 bg-slate-700"
            />
            <div class="flex justify-between text-xs text-slate-400 mt-1"><span>$0</span><span>$2,000</span></div>
          </div>
          <div>
            <label class="block text-sm font-semibold text-slate-300 mb-3">
              …and reduce expenses by <span class="text-red-400 font-bold text-base">${{ expenseReduction }}</span>/month
            </label>
            <input
              type="range"
              v-model.number="expenseReduction"
              min="0" max="2000" step="50"
              class="w-full h-2 rounded-full appearance-none cursor-pointer accent-red-500 bg-slate-700"
            />
            <div class="flex justify-between text-xs text-slate-400 mt-1"><span>$0</span><span>$2,000</span></div>
          </div>
        </div>

        <div class="bg-green-950/30 border border-green-800 rounded-xl p-5">
          <div v-if="crossoverResult.alreadyThere">
            <div class="text-green-400 font-bold text-lg">🎉 Investment income already covers your expenses!</div>
            <div class="text-green-500 text-sm mt-1">You've reached the crossover point.</div>
          </div>
          <div v-else>
            <div class="text-sm text-slate-400 mb-1">Your crossover point moves to:</div>
            <div class="text-2xl font-bold text-green-400 mb-4">{{ crossoverResult.date }}</div>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <div class="text-slate-400 text-xs uppercase tracking-wide">Time away</div>
                <div class="font-bold text-slate-200 mt-0.5">{{ crossoverResult.years }} years</div>
              </div>
              <div v-if="crossoverResult.investedNeeded">
                <div class="text-slate-400 text-xs uppercase tracking-wide">Need invested</div>
                <div class="font-bold text-slate-200 mt-0.5">{{ fmt(crossoverResult.investedNeeded) }}</div>
              </div>
              <div v-if="crossoverResult.months">
                <div class="text-slate-400 text-xs uppercase tracking-wide">Months</div>
                <div class="font-bold text-green-400 mt-0.5">{{ crossoverResult.months }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Section 3: Milestones -->
      <div class="bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-700">
        <div class="flex items-center space-x-3 mb-6">
          <div class="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <h2 class="text-xl font-bold text-slate-100">Milestones</h2>
        </div>

        <div class="space-y-4">
          <div
            v-for="ms in milestones"
            :key="ms.title"
            class="p-4 rounded-xl border border-l-4 transition-all"
            :class="ms.pct >= 100
              ? 'bg-green-950/40 border-green-900 border-l-green-500'
              : 'bg-slate-700/30 border-slate-700 border-l-slate-600'"
          >
            <div class="flex items-start justify-between mb-3">
              <div>
                <div class="font-semibold text-slate-200 flex items-center gap-2">
                  <span :class="ms.pct >= 100 ? 'text-green-400' : 'text-slate-600'">
                    {{ ms.pct >= 100 ? '✓' : '○' }}
                  </span>
                  {{ ms.title }}
                </div>
                <div class="text-xs text-slate-400 mt-0.5 ml-5">{{ ms.sub }}</div>
                <div v-if="ms.pct >= 100 && achievedDates[ms.key]" class="text-xs text-green-400 font-semibold mt-0.5 ml-5">
                  Achieved {{ achievedDates[ms.key] }}
                </div>
              </div>
              <div class="text-right shrink-0 ml-4">
                <div class="font-bold text-sm" :class="ms.pct >= 100 ? 'text-green-400' : 'text-slate-400'">
                  {{ Math.min(100, Math.round(ms.pct)) }}%
                </div>
                <div class="text-xs text-slate-500 mt-0.5">{{ ms.status }}</div>
              </div>
            </div>
            <div class="h-2 bg-slate-700 rounded-full overflow-hidden ml-5">
              <div
                class="h-full rounded-full transition-all duration-500"
                :class="ms.pct >= 100 ? 'bg-green-500' : ms.color"
                :style="{ width: `${Math.min(100, Math.max(0, ms.pct))}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { useTransactionsStore } from '@/stores/transactions'
import { useFiSettingsStore } from '@/stores/fiSettings'
import { useAuthStore } from '@/stores/auth'
import { recordAchievedDate, getAchievedDates } from '@/utils/milestones'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const transactionsStore = useTransactionsStore()
const fiSettingsStore = useFiSettingsStore()
const authStore = useAuthStore()

// Simulator state
const monthlyInvestment = ref(200)
const expenseReduction = ref(0)

// Auth watch pattern — no onMounted
watch(
  () => authStore.isLoggedIn,
  async (loggedIn) => {
    if (!loggedIn) return
    await Promise.all([
      !transactionsStore.initialized ? transactionsStore.loadFromSupabase() : Promise.resolve(),
      !fiSettingsStore.loaded ? fiSettingsStore.loadFromSupabase() : Promise.resolve()
    ])
  },
  { immediate: true }
)

// Currency formatter (no decimals for large numbers)
function fmt(val) {
  if (val === null || val === undefined) return '$0'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(val)
}

// --- Key computed values ---
const avgMonthlyExpenses = computed(() => fiSettingsStore.monthlyExpenses || 0)
const currentInvestmentIncome = computed(() => (fiSettingsStore.total_invested * 0.04) / 12)
const monthlyGap = computed(() => Math.max(0, avgMonthlyExpenses.value - currentInvestmentIncome.value))

// Crossover date calculation (reactive to simulator inputs)
const crossoverResult = computed(() => {
  const avgExp = avgMonthlyExpenses.value
  const targetExp = Math.max(0, avgExp - expenseReduction.value)
  let invested = fiSettingsStore.total_invested
  const curIncome = (invested * 0.04) / 12

  if (targetExp <= 0 || curIncome >= targetExp) {
    return { date: 'Now!', years: '0', months: 0, investedNeeded: invested, alreadyThere: true, beyond30: false }
  }

  const MONTHLY_RETURN = 0.07 / 12 // 7% annual compound growth
  const now = new Date()
  for (let m = 0; m < 480; m++) {
    invested = invested * (1 + MONTHLY_RETURN) + monthlyInvestment.value
    const income = (invested * 0.04) / 12
    // Debug log at key milestones (verify formula matches expected values)
    if (monthlyInvestment.value === 1000 && [59, 119, 179, 239, 359].includes(m)) {
      console.log(`[FI] Year ${Math.round((m + 1) / 12)}: invested=$${Math.round(invested).toLocaleString()}, income=$${Math.round(income)}/mo`)
    }
    if (income >= targetExp) {
      const d = new Date(now.getFullYear(), now.getMonth() + m + 1, 1)
      return {
        date: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        years: ((m + 1) / 12).toFixed(1),
        months: m + 1,
        investedNeeded: invested,
        alreadyThere: false,
        beyond40: false
      }
    }
  }

  return { date: '40+ years', years: '40+', months: null, investedNeeded: null, alreadyThere: false, beyond40: true }
})

// --- Chart: custom "Today" vertical line plugin ---
const todayIdx = ref(11) // index of current month in the combined labels array

const todayLinePlugin = {
  id: 'todayLine',
  afterDatasetsDraw(chart) {
    try {
      const idx = todayIdx.value
      const xPos = chart.scales.x.getPixelForIndex(idx)
      const { top, bottom } = chart.chartArea
      const ctx = chart.ctx
      ctx.save()
      ctx.beginPath()
      ctx.strokeStyle = 'rgba(100,116,139,0.55)'
      ctx.lineWidth = 1.5
      ctx.setLineDash([5, 4])
      ctx.moveTo(xPos, top)
      ctx.lineTo(xPos, bottom)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#64748b'
      ctx.font = '11px system-ui, -apple-system, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Today', xPos, top - 6)
      ctx.restore()
    } catch (_) {}
  }
}

const chartPlugins = [todayLinePlugin]

// --- Chart data (reactive to store + simulator) ---
const chartData = computed(() => {
  const txs = transactionsStore.getTransactions || []
  const now = new Date()
  const curYear = now.getFullYear()
  const curMonth = now.getMonth() + 1

  const HIST = 12

  // Build 12 historical month labels
  const histMths = []
  for (let i = HIST - 1; i >= 0; i--) {
    const d = new Date(curYear, curMonth - 1 - i, 1)
    histMths.push({ y: d.getFullYear(), m: d.getMonth() + 1 })
  }

  // Real expense totals from transactions per historical month
  const histExpenses = histMths.map(({ y, m }) =>
    txs.filter(t => {
      if (t.amount >= 0) return false
      const [ty, tm] = t.date.split('-').map(Number)
      return ty === y && tm === m
    }).reduce((sum, t) => sum + Math.abs(t.amount), 0)
  )

  const avgExp = avgMonthlyExpenses.value || 0
  const targetExp = Math.max(0, avgExp - expenseReduction.value)
  const curIncome = (fiSettingsStore.total_invested * 0.04) / 12

  // Historical investment income: flat at current rate
  const histIncomes = histMths.map(() => curIncome)

  // Determine how many projected months to show
  const crossoverMonths = crossoverResult.value.months // null or number
  const maxProj = crossoverMonths !== null
    ? Math.min(crossoverMonths + 6, 480)  // 6-month buffer past crossover
    : 480                                  // 40 years if no crossover found

  // Build projected data with compound growth (7% annual = 0.583%/mo)
  const MONTHLY_RETURN = 0.07 / 12
  let projInvested = fiSettingsStore.total_invested
  const projMths = []
  const projExp = []
  const projInc = []

  for (let i = 0; i < maxProj; i++) {
    const d = new Date(curYear, curMonth - 1 + i + 1, 1)
    projMths.push({ y: d.getFullYear(), m: d.getMonth() + 1 })
    projInvested = projInvested * (1 + MONTHLY_RETURN) + monthlyInvestment.value
    projExp.push(targetExp)
    projInc.push((projInvested * 0.04) / 12)
  }

  const fmtLabel = ({ y, m }) =>
    new Date(y, m - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

  const allLabels = [...histMths.map(fmtLabel), ...projMths.map(fmtLabel)]

  // Update today marker for the plugin
  todayIdx.value = HIST - 1

  // Freedom dot: absolute index in the combined array
  const freedomAbsIdx = crossoverMonths !== null ? HIST + crossoverMonths - 1 : -1
  const freedomVal = freedomAbsIdx >= 0 ? projInc[crossoverMonths - 1] : null

  const datasets = [
    {
      label: 'Monthly Expenses',
      data: [...histExpenses, ...projExp],
      borderColor: '#ef4444',
      backgroundColor: 'rgba(239,68,68,0.06)',
      borderWidth: 2.5,
      pointRadius: 1,
      pointHoverRadius: 4,
      tension: 0.3,
      fill: false,
      order: 2
    },
    {
      label: 'Investment Income',
      data: [...histIncomes, ...projInc],
      borderColor: '#22c55e',
      backgroundColor: 'rgba(34,197,94,0.08)',
      borderWidth: 2.5,
      pointRadius: 1,
      pointHoverRadius: 4,
      tension: 0.2,
      fill: false,
      order: 1
    }
  ]

  if (freedomAbsIdx >= 0 && freedomVal !== null) {
    datasets.push({
      label: '✦ Freedom',
      data: allLabels.map((_, i) => i === freedomAbsIdx ? freedomVal : null),
      backgroundColor: '#f59e0b',
      borderColor: '#f59e0b',
      pointRadius: allLabels.map((_, i) => i === freedomAbsIdx ? 10 : 0),
      pointHoverRadius: 14,
      showLine: false,
      order: 0
    })
  }

  return { labels: allLabels, datasets }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: { usePointStyle: true, padding: 20, font: { size: 12 } }
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      callbacks: {
        label: (ctx) => {
          if (ctx.parsed.y === null) return null
          return `${ctx.dataset.label}: ${fmt(ctx.parsed.y)}`
        }
      }
    }
  },
  scales: {
    x: {
      ticks: {
        maxTicksLimit: 10,
        autoSkip: true,
        maxRotation: 30,
        color: '#9ca3af',
        font: { size: 11 }
      },
      grid: { display: false }
    },
    y: {
      beginAtZero: true,
      ticks: {
        callback: (val) => `$${Number(val).toLocaleString()}`,
        color: '#9ca3af',
        font: { size: 11 }
      },
      grid: { color: 'rgba(0,0,0,0.04)' }
    }
  },
  interaction: { mode: 'index', intersect: false },
  animation: { duration: 250 }
}

// --- Savings balance (milestone 1 & 2) ---
const savingsBalance = computed(() =>
  Math.max(
    0,
    (transactionsStore.getTransactions || [])
      .filter(t => t.category?.toLowerCase().includes('saving'))
      .reduce((sum, t) => sum + t.amount, 0)
  )
)

// --- Milestones ---
const milestones = computed(() => {
  const savings = savingsBalance.value
  const avgExp = avgMonthlyExpenses.value
  const invested = fiSettingsStore.total_invested

  return [
    {
      key: 'one_month_buffer',
      title: 'One Month Buffer',
      sub: `Target: ${fmt(avgExp)} saved`,
      pct: avgExp > 0 ? (savings / avgExp) * 100 : 0,
      status: savings >= avgExp ? 'Complete' : `${fmt(savings)} saved`,
      color: 'bg-blue-400'
    },
    {
      key: 'emergency_fund',
      title: 'Emergency Fund',
      sub: `Target: ${fmt(avgExp * 3)} (3 months of expenses)`,
      pct: avgExp > 0 ? (savings / (avgExp * 3)) * 100 : 0,
      status: savings >= avgExp * 3 ? 'Complete' : `${fmt(savings)} of ${fmt(avgExp * 3)}`,
      color: 'bg-cyan-400'
    },
    {
      key: 'first_10k',
      title: 'First $10,000 Invested',
      sub: `${fmt(invested)} invested so far`,
      pct: (invested / 10000) * 100,
      status: invested >= 10000 ? 'Complete' : `${fmt(Math.max(0, 10000 - invested))} to go`,
      color: 'bg-violet-400'
    },
    {
      key: 'fi_crossover',
      title: 'FI Crossover',
      sub: `Target: ${fmt(fiSettingsStore.fiNumber)}`,
      pct: fiSettingsStore.progressPercent,
      status: `${fiSettingsStore.progressPercent}% there · ${fmt(invested)} invested`,
      color: 'bg-emerald-400'
    }
  ]
})

// Achievement date tracking — must come AFTER milestones computed
const achievedDates = ref(getAchievedDates())

watch(milestones, (list) => {
  let changed = false
  for (const ms of list) {
    if (ms.pct >= 100 && recordAchievedDate(ms.key)) changed = true
  }
  if (changed) achievedDates.value = getAchievedDates()
}, { immediate: true })
</script>
