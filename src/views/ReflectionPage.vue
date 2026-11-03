<template>
  <div class="max-w-2xl mx-auto py-8 px-4">
    <!-- Hero header -->
    <div class="bg-gradient-to-br from-violet-950 to-slate-900 rounded-2xl shadow-xl p-8 mb-6 border border-violet-900">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 class="text-3xl font-bold text-white">Monthly Reflection: {{ monthLabel }}</h2>
        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wide">Month</label>
          <input type="month" v-model="selectedMonth" @change="onMonthChange" class="px-4 py-2.5 border border-slate-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-slate-800 text-slate-100 transition-all" />
        </div>
      </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="bg-slate-800 rounded-xl shadow border border-slate-700 border-l-4 border-l-violet-500 p-4">
        <div class="text-slate-400 text-sm">Income</div>
        <div class="text-2xl font-bold text-green-400">{{ formatCurrency(stats.income) }}</div>
      </div>
      <div class="bg-slate-800 rounded-xl shadow border border-slate-700 border-l-4 border-l-violet-500 p-4">
        <div class="text-slate-400 text-sm">Expenses</div>
        <div class="text-2xl font-bold text-red-400">{{ formatCurrency(stats.expenses) }}</div>
      </div>
      <div class="bg-slate-800 rounded-xl shadow border border-slate-700 border-l-4 border-l-violet-500 p-4">
        <div class="text-slate-400 text-sm flex items-center">Path To Financial Freedom
          <span class="ml-1" title="Income minus Expenses for the month">🛈</span>
        </div>
        <div class="text-2xl font-bold text-violet-400">{{ formatCurrency(stats.pathToFreedom) }}</div>
        <div class="text-xs text-slate-500 mt-1">Income minus Expenses for the month</div>
      </div>
      <div class="bg-slate-800 rounded-xl shadow border border-slate-700 border-l-4 border-l-violet-500 p-4">
        <div class="text-slate-400 text-sm">Top Categories</div>
        <ul class="list-disc list-inside mt-2">
          <li v-for="cat in stats.topCategories" :key="cat" class="text-base font-medium text-slate-200">{{ cat }}</li>
          <li v-if="stats.topCategories.length === 0" class="text-slate-500">-</li>
        </ul>
      </div>
    </div>
    <!-- Milestone achievement banner (display-only prompt) -->
    <div v-if="milestonesThisMonth.length > 0" class="mb-6 space-y-3">
      <div
        v-for="ms in milestonesThisMonth"
        :key="ms.key"
        class="flex items-start gap-3 bg-amber-950/40 border border-amber-500/30 rounded-xl px-5 py-4"
      >
        <span class="text-2xl shrink-0">🏆</span>
        <div>
          <p class="font-semibold text-amber-300 text-sm">
            You reached a milestone this month: <strong>{{ ms.name }}</strong>
          </p>
          <p class="text-amber-400 text-xs mt-1">
            Consider noting this achievement in your reflection below.
          </p>
        </div>
      </div>
    </div>

    <!-- YMOYL Insights header (Change 1) -->
    <div v-if="totalLifeHours !== null || bestWorstCategory || fiSettingsStore.loaded" class="mb-6 bg-violet-950/20 rounded-xl p-5 border border-violet-900/50">
      <h3 class="text-xs font-bold text-violet-400 uppercase tracking-widest mb-4">Your Month in Life Energy</h3>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <!-- Insight 1: Life hours traded -->
        <div v-if="totalLifeHours !== null" class="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-sm">
          <div class="flex items-center space-x-2 mb-2">
            <span class="text-xl">⏳</span>
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wide">Life Energy Traded</span>
          </div>
          <div class="text-2xl font-bold text-slate-100">{{ Math.round(totalLifeHours) }} hrs</div>
          <div class="text-xs text-slate-400 mt-1">at your real wage of {{ formatCurrency(lifeEnergyStore.lifeEnergyRate) }}/hr</div>
        </div>

        <!-- Insight 2: Best / worst category -->
        <div v-if="bestWorstCategory" class="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-sm">
          <div class="flex items-center space-x-2 mb-2">
            <span class="text-xl">⚖️</span>
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wide">Category Value</span>
          </div>
          <div class="text-sm space-y-1">
            <div><span class="text-green-400 font-semibold">Best:</span> <span class="font-medium text-slate-200">{{ bestWorstCategory.best }}</span></div>
            <div><span class="text-red-400 font-semibold">Worst:</span> <span class="font-medium text-slate-200">{{ bestWorstCategory.worst }}</span></div>
          </div>
        </div>

        <!-- Insight 3: FI Progress -->
        <div v-if="fiSettingsStore.loaded" class="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-sm">
          <div class="flex items-center space-x-2 mb-2">
            <span class="text-xl">🎯</span>
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wide">FI Progress</span>
          </div>
          <div class="text-2xl font-bold text-slate-100">{{ fiSettingsStore.progressPercent }}%</div>
          <div class="text-xs text-slate-400 mt-1">{{ formatCurrency(fiSettingsStore.total_invested) }} invested</div>
          <div class="text-xs text-slate-500">Target: {{ formatCurrency(fiSettingsStore.fiNumber) }}</div>
        </div>
      </div>
    </div>

    <!-- Link to Monthly Review (Change 3) -->
    <div class="mb-6">
      <router-link
        :to="{ path: '/monthly-review', query: { month: selectedMonth } }"
        class="inline-flex items-center px-4 py-2.5 border-2 border-violet-500 text-violet-300 rounded-xl font-semibold text-sm hover:bg-violet-950/40 transition-colors duration-200"
      >
        Rate your categories for this month
        <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </router-link>
    </div>

    <!-- Reflection form with YMOYL questions (Change 2) -->
    <div class="bg-violet-950/20 rounded-2xl shadow-xl p-6 border border-violet-900/50 mb-6">
    <form @submit.prevent="saveReflection">
      <div class="mb-4">
        <label class="block font-medium text-slate-200 mb-1">Which spending brought real fulfillment this month?</label>
        <textarea
          v-model="reflection.notes"
          class="w-full border border-slate-600 rounded-xl bg-slate-800 text-slate-100 placeholder-slate-500 p-3 focus:outline-none focus:ring-2 focus:ring-violet-500"
          rows="2"
          placeholder="Think about purchases that felt genuinely worth the hours of life you traded for them..."
        />
      </div>
      <div class="mb-4">
        <label class="block font-medium text-slate-200 mb-1">Which spending felt like wasted life energy?</label>
        <textarea
          v-model="reflection.challenges"
          class="w-full border border-slate-600 rounded-xl bg-slate-800 text-slate-100 placeholder-slate-500 p-3 focus:outline-none focus:ring-2 focus:ring-violet-500"
          rows="2"
          placeholder="Spending that didn't match your values or brought less satisfaction than expected..."
        />
      </div>
      <div class="mb-4">
        <label class="block font-medium text-slate-200 mb-1">One change to better align spending with your values next month</label>
        <textarea
          v-model="reflection.goals"
          class="w-full border border-slate-600 rounded-xl bg-slate-800 text-slate-100 placeholder-slate-500 p-3 focus:outline-none focus:ring-2 focus:ring-violet-500"
          rows="2"
          placeholder="Be specific — what one thing would make the biggest difference toward financial independence?"
        />
      </div>
      <button type="submit" class="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-6 py-2.5 rounded-xl hover:from-violet-700 hover:to-purple-700 font-semibold shadow-lg transition-all">Save Reflection</button>
    </form>
    <div v-if="lastSaved" class="text-green-400 mt-4 font-medium">Reflection saved!</div>
    </div>
    <div class="mt-8 bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-700">
      <h3 class="text-xl font-bold text-slate-100 mb-4">Weekly Reflections</h3>
      <div v-for="week in getWeekRanges(selectedMonth)" :key="week.week" class="mb-4">
        <label class="block font-medium text-slate-300 mb-1">
          Week {{ week.week }} ({{ week.start }} - {{ week.end }})
        </label>
        <textarea
          v-model="reflection.weeklyReflections[week.week]"
          class="w-full border border-slate-600 rounded-xl bg-slate-700 text-slate-100 placeholder-slate-500 p-3 focus:outline-none focus:ring-2 focus:ring-violet-500"
          rows="2"
          :placeholder="`Reflection for week ${week.week}`"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useReflectionsStore } from '@/stores/reflections'
import { useTransactionsStore } from '@/stores/transactions'
import { useLifeEnergyStore } from '@/stores/lifeEnergy'
import { useCategoryReflectionsStore } from '@/stores/categoryReflections'
import { useFiSettingsStore } from '@/stores/fiSettings'
import { useAuthStore } from '@/stores/auth'
import { useRoute, useRouter } from 'vue-router'
import { createESTDate } from '@/utils/dateUtils'
import { MILESTONE_DEFS, getAchievedDates } from '@/utils/milestones'

const reflectionsStore = useReflectionsStore()
const transactionsStore = useTransactionsStore()
const lifeEnergyStore = useLifeEnergyStore()
const categoryReflectionsStore = useCategoryReflectionsStore()
const fiSettingsStore = useFiSettingsStore()
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

// --- Helpers (declared first so they can be used below) ---
function getPeriodStart(monthStr) {
  const [year, month] = monthStr.split('-').map(Number)
  return `${year}-${String(month).padStart(2, '0')}-01`
}
function getPeriodEnd(monthStr) {
  const [year, month] = monthStr.split('-').map(Number)
  const end = new Date(year, month, 0)
  return `${year}-${String(month).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`
}
function extractMonthFromQuery(r) {
  const queryMonth = r.query.month
  if (typeof queryMonth === 'string' && /^\d{4}-\d{2}$/.test(queryMonth)) return queryMonth
  const queryPeriodStart = r.query.periodStart
  if (typeof queryPeriodStart === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(queryPeriodStart)) {
    return queryPeriodStart.slice(0, 7)
  }
  return null
}

// --- Month picker state ---
const today = new Date()
const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
// Apply URL query param synchronously at setup time (route.query is available immediately)
const selectedMonth = ref(extractMonthFromQuery(route) ?? defaultMonth)

const periodType = 'month'
const reflection = ref({
  periodType,
  periodStart: getPeriodStart(selectedMonth.value),
  periodEnd: getPeriodEnd(selectedMonth.value),
  notes: '',
  challenges: '',
  goals: '',
  summaryStats: {},
})
const lastSaved = ref(false)

const monthLabel = computed(() => {
  const [year, month] = selectedMonth.value.split('-').map(Number)
  return new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
})

function loadReflectionForMonth(monthStr) {
  const periodStart = getPeriodStart(monthStr)
  const existing = reflectionsStore.getReflectionByPeriod(periodType, periodStart)
  if (existing) {
    reflection.value = { ...existing }
  } else {
    reflection.value = {
      periodType,
      periodStart,
      periodEnd: getPeriodEnd(monthStr),
      notes: '',
      challenges: '',
      goals: '',
      summaryStats: {},
    }
  }
}

function onMonthChange() {
  loadReflectionForMonth(selectedMonth.value)
}

// Achievement dates from localStorage (read fresh each time auth loads so navigation from FIJourney shows the banner)
const achievedDates = ref({})

// Milestones achieved in the currently selected month (display-only prompt)
const milestonesThisMonth = computed(() =>
  MILESTONE_DEFS.filter(def => achievedDates.value[def.key] === monthLabel.value)
)

// --- Single auth watcher — replaces onMounted ---
watch(
  () => authStore.isLoggedIn,
  async (loggedIn) => {
    if (!loggedIn) return
    achievedDates.value = getAchievedDates()
    await Promise.all([
      !transactionsStore.initialized ? transactionsStore.loadFromSupabase() : Promise.resolve(),
      lifeEnergyStore.loadFromSupabase(),
      fiSettingsStore.loadFromSupabase()
    ])
    await reflectionsStore.initialize()
    loadReflectionForMonth(selectedMonth.value)
    await categoryReflectionsStore.loadForMonth(selectedMonth.value)
  },
  { immediate: true }
)

// Reactive URL query param changes (e.g. navigating here from history links)
watch(() => [route.query.month, route.query.periodStart], () => {
  const monthFromQuery = extractMonthFromQuery(route)
  if (monthFromQuery) selectedMonth.value = monthFromQuery
})

watch(selectedMonth, async (newMonth) => {
  loadReflectionForMonth(newMonth)
  if (authStore.isLoggedIn) {
    await categoryReflectionsStore.loadForMonth(newMonth)
  }
})

function saveReflection() {
  reflection.value.periodStart = getPeriodStart(selectedMonth.value)
  reflection.value.periodEnd = getPeriodEnd(selectedMonth.value)
  reflection.value.summaryStats = stats.value
  if (!reflection.value.weeklyReflections) reflection.value.weeklyReflections = {}
  reflectionsStore.addOrUpdateReflection(reflection.value)
  lastSaved.value = true
  setTimeout(() => (lastSaved.value = false), 2000)
}

// Helper function to filter transactions for a given month (YYYY-MM)
function getMonthTransactions(transactions, monthStr) {
  if (!Array.isArray(transactions) || !monthStr) return []
  const [year, month] = monthStr.split('-').map(Number)
  if (!year || !month) return []
  return transactions.filter(t => {
    const d = new Date(t.date)
    return d.getFullYear() === year && d.getMonth() + 1 === month
  })
}

const stats = computed(() => {
  // Use selectedMonth.value for filtering
  const incomeTxs = getMonthTransactions(transactionsStore.getFilteredIncome(), selectedMonth.value)
  const expenseTxs = getMonthTransactions(transactionsStore.getFilteredExpense(), selectedMonth.value)
  const income = incomeTxs.reduce((sum, t) => sum + t.amount, 0)
  const expenses = Math.abs(expenseTxs.reduce((sum, t) => sum + t.amount, 0))
  const pathToFreedom = income - expenses
  // Top 3 categories by expense
  const categoryTotals = {}
  expenseTxs.forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Math.abs(t.amount)
  })
  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat]) => cat)
  return {
    income,
    expenses,
    pathToFreedom,
    topCategories
  }
})

// YMOYL Insight 1: total life hours traded this month
const totalLifeHours = computed(() => {
  if (!lifeEnergyStore.lifeEnergyRate || lifeEnergyStore.lifeEnergyRate <= 0) return null
  const [year, month] = selectedMonth.value.split('-').map(Number)
  const total = (transactionsStore.getTransactions || [])
    .filter(t => {
      if (t.amount >= 0) return false
      const d = new Date(t.date)
      return d.getFullYear() === year && d.getMonth() + 1 === month
    })
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  return total / lifeEnergyStore.lifeEnergyRate
})

// YMOYL Insight 2: best and worst value spending category
const bestWorstCategory = computed(() => {
  const [year, month] = selectedMonth.value.split('-').map(Number)
  const monthTx = (transactionsStore.getTransactions || []).filter(t => {
    if (t.amount >= 0) return false
    const d = new Date(t.date)
    return d.getFullYear() === year && d.getMonth() + 1 === month
  })
  const catTotals = {}
  for (const t of monthTx) {
    const main = t.category?.split(' - ')[0]
    if (!main || main === 'Pay Day') continue
    catTotals[main] = (catTotals[main] || 0) + Math.abs(t.amount)
  }
  // fulfillment score: just right=1.0, too little=0.5, too much=0.0
  const ratingScore = { 2: 1.0, 1: 0.5, 3: 0.0 }
  const ratios = []
  for (const [cat, dollars] of Object.entries(catTotals)) {
    const ratingData = categoryReflectionsStore.getRating(cat)
    if (!ratingData || !ratingData.rating) continue
    const score = ratingScore[ratingData.rating]
    if (score === undefined) continue
    ratios.push({ cat, ratio: score / (dollars || 1) })
  }
  if (ratios.length < 2) return null
  ratios.sort((a, b) => b.ratio - a.ratio)
  return { best: ratios[0].cat, worst: ratios[ratios.length - 1].cat }
})

function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '$0.00'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

// Helper: Get week ranges for the selected month (EST)
function getWeekRanges(monthStr) {
  const [year, month] = monthStr.split('-').map(Number)
  const start = createESTDate(year, month, 1) // EST
  const end = createESTDate(year, month + 1, 0) // EST
  const weeks = []
  let current = new Date(start)
  let week = 1
  while (current <= end) {
    const weekStart = new Date(current)
    const weekEnd = new Date(Math.min(
      new Date(current.getFullYear(), current.getMonth(), current.getDate() + 6).getTime(),
      end.getTime()
    ))
    weeks.push({
      week,
      start: weekStart.toISOString().slice(0, 10),
      end: weekEnd.toISOString().slice(0, 10)
    })
    current.setDate(current.getDate() + 7)
    week++
  }
  return weeks
}

// Ensure weeklyReflections is always present
watch(reflection, (val) => {
  if (!val.weeklyReflections) val.weeklyReflections = {}
}, { immediate: true, deep: true })
</script> 