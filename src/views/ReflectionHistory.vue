<template>
  <div class="max-w-3xl mx-auto py-8 px-4">
    <!-- Sub-tabs switcher -->
    <div class="flex space-x-1 bg-slate-800 p-1 rounded-xl w-fit mb-6 border border-slate-700">
      <router-link
        to="/reflections"
        class="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        :class="$route.path === '/reflections' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'"
      >
        Reflections
      </router-link>
      <router-link
        to="/monthly-review"
        class="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        :class="$route.path === '/monthly-review' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'"
      >
        Review
      </router-link>
    </div>

    <h2 class="text-2xl font-bold mb-6 text-white">Reflection History</h2>
    <div v-if="reflections.length === 0" class="text-slate-400">No reflections yet. Start by writing your first monthly reflection!</div>
    <div v-else class="space-y-4">
      <div v-for="reflection in sortedReflections" :key="reflection.periodStart" class="bg-slate-800 rounded-xl shadow border border-slate-700 border-l-4 border-l-violet-500 p-4 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div class="flex-1">
          <div class="font-semibold text-lg text-slate-100">{{ formatPeriod(reflection.periodStart) }}</div>
          <div class="text-sm text-slate-400 mt-1">Path To Financial Freedom: <span :class="reflection.summaryStats.pathToFreedom >= 0 ? 'text-green-400' : 'text-red-400'">{{ formatCurrency(reflection.summaryStats.pathToFreedom) }}</span></div>
          <div class="text-sm text-slate-400">Income: <span class="text-green-400">{{ formatCurrency(reflection.summaryStats.income) }}</span></div>
          <div class="text-sm text-slate-400">Expenses: <span class="text-red-400">{{ formatCurrency(reflection.summaryStats.expenses) }}</span></div>

          <!-- Category rating badges -->
          <div
            v-if="Object.keys(getRatingsForMonth(reflection.periodStart)).length > 0"
            class="mt-2 flex flex-wrap gap-2"
          >
            <div
              v-for="([catName, data]) in Object.entries(getRatingsForMonth(reflection.periodStart)).filter(([n]) => n !== 'Pay Day').slice(0, 5)"
              :key="catName"
              class="flex items-center space-x-1"
            >
              <span class="w-2 h-2 rounded-full inline-block" :class="ratingDotClass(data.rating)"></span>
              <span class="text-xs text-slate-400">{{ catName }}</span>
            </div>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-2 md:mt-0 shrink-0">
          <router-link :to="{ name: 'ReflectionPage', query: { periodStart: reflection.periodStart } }">
            <button class="bg-violet-600 text-white px-4 py-2 rounded-xl hover:bg-violet-700 text-sm whitespace-nowrap">View / Edit</button>
          </router-link>
          <router-link :to="{ path: '/monthly-review', query: { month: reflection.periodStart.slice(0, 7) } }">
            <button class="border border-violet-500 text-violet-300 px-4 py-2 rounded-xl hover:bg-violet-950/40 text-sm whitespace-nowrap">View Full Review →</button>
          </router-link>
        </div>
      </div>
    </div>
    <div class="mt-8">
      <router-link to="/reflection">
        <button class="bg-slate-700 text-slate-200 px-4 py-2 rounded-xl hover:bg-slate-600">Reflect on this month</button>
      </router-link>
      <router-link to="/" class="ml-4">
        <button class="bg-slate-800 text-slate-300 px-4 py-2 rounded-xl hover:bg-slate-700 border border-slate-600">Back to Dashboard</button>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useReflectionsStore } from '@/stores/reflections'
import { useCategoryReflectionsStore } from '@/stores/categoryReflections'
import { useAuthStore } from '@/stores/auth'

const reflectionsStore = useReflectionsStore()
const categoryReflectionsStore = useCategoryReflectionsStore()
const authStore = useAuthStore()

onMounted(() => {
  reflectionsStore.initialize()
})

const reflections = computed(() => reflectionsStore.getReflections)
const sortedReflections = computed(() =>
  [...reflections.value].sort((a, b) => new Date(b.periodStart) - new Date(a.periodStart))
)

// Per-month ratings cache: { 'YYYY-MM': { [catName]: { rating, notes } } }
const monthRatingsMap = ref({})

watch(
  [() => authStore.isLoggedIn, sortedReflections],
  async ([loggedIn, reflections]) => {
    if (!loggedIn || !reflections.length) return
    for (const r of reflections) {
      const monthStr = r.periodStart.slice(0, 7)
      if (monthRatingsMap.value[monthStr]) continue // already fetched
      await categoryReflectionsStore.loadForMonth(monthStr)
      monthRatingsMap.value[monthStr] = { ...categoryReflectionsStore.ratings }
    }
  },
  { immediate: true, deep: false }
)

function getRatingsForMonth(periodStart) {
  return monthRatingsMap.value[periodStart.slice(0, 7)] ?? {}
}

function ratingDotClass(rating) {
  if (rating === 1) return 'bg-blue-400'
  if (rating === 2) return 'bg-green-400'
  if (rating === 3) return 'bg-amber-400'
  return 'bg-gray-300'
}

function formatPeriod(periodStart) {
  const [year, month, day] = periodStart.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleString('default', { month: 'long', year: 'numeric' })
}

function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '$0.00'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}
</script> 