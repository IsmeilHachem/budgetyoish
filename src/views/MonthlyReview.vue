<template>
  <div class="min-h-screen bg-slate-950">
    <div class="container mx-auto px-4 py-8 max-w-3xl">

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

      <!-- Header -->
      <div class="bg-gradient-to-br from-teal-950 to-slate-900 rounded-2xl shadow-xl p-8 mb-6 border border-teal-900">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div class="flex items-center space-x-4">
            <div class="w-12 h-12 bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <span class="text-2xl">🔍</span>
            </div>
            <div>
              <h1 class="text-3xl font-bold text-white">
                Monthly Review
              </h1>
              <p class="text-slate-300 text-sm mt-0.5">Rate how each spending category felt</p>
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wide">Month</label>
            <input
              type="month"
              v-model="selectedMonth"
              class="px-4 py-2.5 border border-slate-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-slate-800 text-slate-100 transition-all"
            />
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="text-center py-12 text-gray-400">
        <div class="animate-spin text-4xl mb-3">⏳</div>
        <p>Loading…</p>
      </div>

      <!-- No spending categories -->
      <div v-else-if="activeCategories.length === 0" class="bg-slate-800 rounded-2xl shadow-xl p-12 text-center border border-slate-700">
        <p class="text-4xl mb-3">🤷</p>
        <p class="text-slate-300 font-medium">No spending found for this month.</p>
        <p class="text-slate-500 text-sm mt-1">Add transactions to see categories here.</p>
      </div>

      <!-- Category cards -->
      <div v-else class="space-y-4">
        <div
          v-for="cat in activeCategories"
          :key="cat.name"
          class="bg-teal-950/20 rounded-2xl shadow-xl border border-teal-900/50 p-6 transition-all duration-200"
          :class="ratingBorderClass(cat.name)"
        >
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">

            <!-- Category info -->
            <div class="flex-1">
              <div class="flex items-center space-x-3 mb-1">
                <div class="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <h3 class="text-lg font-bold text-slate-100">{{ cat.name }}</h3>
                <span v-if="getRating(cat.name)" class="text-lg">{{ ratingEmoji(getRating(cat.name).rating) }}</span>
              </div>
              <p class="text-sm text-slate-400 ml-11">
                Spent: <span class="font-semibold text-slate-200">{{ formatCurrency(Math.abs(cat.total)) }}</span>
              </p>
            </div>

            <!-- Rating buttons -->
            <div class="flex flex-col space-y-2 sm:items-end">
              <div class="flex space-x-2">
                <button
                  @click="rate(cat.name, 1)"
                  :class="[
                    'px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-150 border-2',
                    activeRating(cat.name) === 1
                      ? 'bg-blue-500 border-blue-500 text-white shadow-md scale-105'
                      : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300'
                  ]"
                >
                  ↓ Too little
                </button>
                <button
                  @click="rate(cat.name, 2)"
                  :class="[
                    'px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-150 border-2',
                    activeRating(cat.name) === 2
                      ? 'bg-green-500 border-green-500 text-white shadow-md scale-105'
                      : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300'
                  ]"
                >
                  ✓ Just right
                </button>
                <button
                  @click="rate(cat.name, 3)"
                  :class="[
                    'px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-150 border-2',
                    activeRating(cat.name) === 3
                      ? 'bg-amber-500 border-amber-500 text-white shadow-md scale-105'
                      : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 hover:border-amber-300'
                  ]"
                >
                  ↑ Too much
                </button>
              </div>
            </div>
          </div>

          <!-- Notes (collapsible) -->
          <div class="mt-4 ml-11">
            <button
              @click="toggleNotes(cat.name)"
              class="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center space-x-1"
            >
              <svg class="w-3 h-3 transition-transform" :class="openNotes[cat.name] ? 'rotate-90' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
              <span>{{ openNotes[cat.name] ? 'Hide notes' : 'Add notes' }}</span>
            </button>
            <transition
              enter-active-class="transition ease-out duration-150"
              enter-from-class="opacity-0 -translate-y-1"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition ease-in duration-100"
              leave-from-class="opacity-100"
              leave-to-class="opacity-0"
            >
              <textarea
                v-if="openNotes[cat.name]"
                v-model="notesMap[cat.name]"
                @blur="saveNotes(cat.name)"
                placeholder="Any notes about this category this month…"
                rows="2"
                class="mt-2 w-full px-3 py-2 text-sm border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 resize-none bg-slate-800 text-slate-200 placeholder-slate-500"
              />
            </transition>
          </div>
        </div>
      </div>

      <!-- Footer summary -->
      <div v-if="ratedCount > 0" class="mt-6 bg-slate-800 rounded-2xl shadow p-5 border border-slate-700 flex items-center justify-between text-sm text-slate-400">
        <span>{{ ratedCount }} of {{ activeCategories.length }} categories rated</span>
        <div class="flex space-x-3">
          <span class="text-blue-600 font-medium">↓ {{ countByRating(1) }}</span>
          <span class="text-green-600 font-medium">✓ {{ countByRating(2) }}</span>
          <span class="text-amber-600 font-medium">↑ {{ countByRating(3) }}</span>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTransactionsStore } from '@/stores/transactions'
import { useCategoriesStore } from '@/stores/categories'
import { useCategoryReflectionsStore } from '@/stores/categoryReflections'
import { useAuthStore } from '@/stores/auth'

const transactionsStore = useTransactionsStore()
const categoriesStore = useCategoriesStore()
const reflectionsStore = useCategoryReflectionsStore()
const authStore = useAuthStore()
const route = useRoute()

const now = new Date()
const selectedMonth = ref(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)

// Pick up ?month=YYYY-MM from URL (e.g. linked from ReflectionPage)
watch(
  () => route.query.month,
  (monthParam) => {
    if (typeof monthParam === 'string' && /^\d{4}-\d{2}$/.test(monthParam)) {
      selectedMonth.value = monthParam
    }
  },
  { immediate: true }
)
const loading = ref(false)
const openNotes = ref({})
const notesMap = ref({})

// Load data whenever auth is ready or month changes
watch(
  () => authStore.isLoggedIn,
  async (loggedIn) => {
    if (loggedIn) {
      await Promise.all([
        transactionsStore.transactions.length === 0 ? transactionsStore.loadFromSupabase() : Promise.resolve(),
        !categoriesStore.initialized ? categoriesStore.initialize() : Promise.resolve()
      ])
      await loadReflections()
    }
  },
  { immediate: true }
)

watch(selectedMonth, async () => {
  await loadReflections()
})

async function loadReflections() {
  loading.value = true
  await reflectionsStore.loadForMonth(selectedMonth.value)
  // Sync notes from store into local map
  for (const [catName, data] of Object.entries(reflectionsStore.ratings)) {
    notesMap.value[catName] = data.notes || ''
  }
  loading.value = false
}

// Build list of main categories that have expense spending this month
const activeCategories = computed(() => {
  const [year, month] = selectedMonth.value.split('-').map(Number)
  const monthTx = (transactionsStore.getTransactions || []).filter(t => {
    if (!t.category || t.amount >= 0) return false
    const d = new Date(t.date)
    return d.getFullYear() === year && d.getMonth() + 1 === month
  })

  const totals = {}
  for (const t of monthTx) {
    const main = t.category.split(' - ')[0]
    if (!main) continue
    totals[main] = (totals[main] || 0) + t.amount
  }

  return Object.entries(totals)
    .map(([name, total]) => ({ name, total }))
    .filter(cat => cat.name !== 'Pay Day') // income category — not a spending category
    .sort((a, b) => a.total - b.total) // most spent first (most negative)
})

function getRating(catName) {
  return reflectionsStore.getRating(catName)
}

function activeRating(catName) {
  return getRating(catName)?.rating ?? null
}

async function rate(catName, rating) {
  const currentNotes = notesMap.value[catName] || ''
  await reflectionsStore.saveRating(catName, selectedMonth.value, rating, currentNotes)
}

function toggleNotes(catName) {
  openNotes.value[catName] = !openNotes.value[catName]
  if (!notesMap.value[catName]) {
    notesMap.value[catName] = getRating(catName)?.notes || ''
  }
}

async function saveNotes(catName) {
  const currentRating = activeRating(catName)
  if (currentRating) {
    await reflectionsStore.saveRating(catName, selectedMonth.value, currentRating, notesMap.value[catName] || '')
  }
}

function ratingBorderClass(catName) {
  const r = activeRating(catName)
  if (r === 1) return 'border-l-4 border-l-blue-400'
  if (r === 2) return 'border-l-4 border-l-green-400'
  if (r === 3) return 'border-l-4 border-l-amber-400'
  return ''
}

function ratingEmoji(rating) {
  if (rating === 1) return '↓'
  if (rating === 2) return '✓'
  if (rating === 3) return '⚠️'
  return ''
}

const ratedCount = computed(() => Object.keys(reflectionsStore.ratings).length)

function countByRating(r) {
  return Object.values(reflectionsStore.ratings).filter(v => v.rating === r).length
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}
</script>
