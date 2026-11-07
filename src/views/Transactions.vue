<template>
  <div class="min-h-screen bg-slate-950">
    <div class="w-full px-4 md:px-6 lg:px-8 py-8">
      <!-- Header Section -->
      <div class="bg-gradient-to-br from-cyan-950 to-slate-900 rounded-2xl shadow-xl p-8 mb-8 border border-cyan-900">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 class="text-4xl font-bold text-white">
              Transaction Management
            </h1>
            <p class="text-slate-300 mt-2 text-lg">Track and manage your financial transactions</p>
          </div>
          <div class="flex gap-3">
            <button
              v-if="selectedTransactions.length > 0"
              @click="deleteSelectedTransactions"
              class="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transform transition-all duration-200 hover:scale-105 shadow-lg"
            >
              <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Selected ({{ selectedTransactions.length }})
            </button>
            <button
              @click="openAddTransactionModal"
              class="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform transition-all duration-200 hover:scale-105 shadow-lg"
            >
              <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Transaction
            </button>
          </div>
        </div>
      </div>

      <!-- Filters Section -->
      <div class="bg-cyan-950/30 rounded-2xl shadow-xl mb-8 p-6 border border-cyan-900/50">
        <div class="flex items-center space-x-3 mb-6">
          <div class="w-8 h-8 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
            </svg>
          </div>
          <h2 class="text-xl font-bold text-slate-100">Filters & Search</h2>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <!-- Date Range Filter -->
          <div>
            <label class="block text-sm font-semibold text-slate-300 mb-2">Date Range</label>
            <div class="flex flex-col sm:flex-row gap-3">
              <input
                type="month"
                v-model="dateRange.start"
                class="flex-1 min-w-0 px-4 py-3 border border-slate-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-slate-800 text-slate-100 transition-all duration-200"
              />
              <input
                type="month"
                v-model="dateRange.end"
                class="flex-1 min-w-0 px-4 py-3 border border-slate-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-slate-800 text-slate-100 transition-all duration-200"
              />
            </div>
          </div>

          <!-- Search Filter -->
          <div>
            <label class="block text-sm font-semibold text-slate-300 mb-2">Search</label>
            <input
              type="text"
              v-model="searchTerm"
              placeholder="Search by description, category, or amount"
              class="w-full min-w-0 px-4 py-3 border border-slate-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-slate-800 text-slate-100 placeholder-slate-500 transition-all duration-200"
            />
          </div>

          <!-- Sort Filter -->
          <div>
            <label class="block text-sm font-semibold text-slate-300 mb-2">Sort By</label>
            <div class="flex gap-3">
              <select
                v-model="sortBy"
                class="flex-1 min-w-0 px-4 py-3 border border-slate-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-slate-800 text-slate-100 transition-all duration-200"
              >
                <option value="date">Date</option>
                <option value="amount">Amount</option>
                <option value="description">Description</option>
                <option value="category">Category</option>
              </select>
              <button
                @click="toggleSortOrder"
                class="px-4 py-3 border border-slate-600 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-all duration-200 shadow-sm"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path v-if="sortOrder === 'desc'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8V4m0 0l-4 4m4-4l4 4M7 20v-4m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Type toggle -->
        <div class="mt-5 flex items-center gap-2 flex-wrap">
          <span class="text-sm font-semibold text-slate-400 mr-1">Show:</span>
          <button @click="setTypeFilter('all')"
            class="px-4 py-1.5 text-sm font-medium border rounded-lg transition-colors duration-200"
            :class="typeFilter === 'all' ? 'bg-cyan-600 text-white border-cyan-600' : 'text-slate-400 border-slate-600 hover:border-slate-500 bg-slate-800'">
            All
          </button>
          <button @click="setTypeFilter('income')"
            class="px-4 py-1.5 text-sm font-medium border rounded-lg transition-colors duration-200"
            :class="typeFilter === 'income' ? 'bg-green-600 text-white border-green-600' : 'text-slate-400 border-slate-600 hover:border-slate-500 bg-slate-800'">
            Income
          </button>
          <button @click="setTypeFilter('expenses')"
            class="px-4 py-1.5 text-sm font-medium border rounded-lg transition-colors duration-200"
            :class="typeFilter === 'expenses' ? 'bg-red-600 text-white border-red-600' : 'text-slate-400 border-slate-600 hover:border-slate-500 bg-slate-800'">
            Expenses
          </button>
          <label class="ml-auto inline-flex items-center gap-2 cursor-pointer select-none text-sm font-medium text-slate-300">
            <input
              type="checkbox"
              v-model="showUpcomingBills"
              class="rounded border-slate-600 text-cyan-600 focus:ring-cyan-500 bg-slate-800"
            />
            <span>Show upcoming bills</span>
          </label>
        </div>

        <!-- Category pills -->
        <div v-if="availableCategories.length > 0" class="mt-3 flex flex-wrap gap-2">
          <button @click="selectedCategory = null"
            class="px-3 py-1 text-xs font-medium border rounded-full transition-colors duration-200"
            :class="selectedCategory === null ? 'bg-cyan-600 text-white border-cyan-600' : 'text-slate-400 border-slate-600 hover:border-slate-500 bg-slate-800'">
            All Categories
          </button>
          <button v-for="cat in availableCategories" :key="cat"
            @click="selectedCategory = cat"
            class="px-3 py-1 text-xs font-medium border rounded-full transition-colors duration-200"
            :class="selectedCategory === cat ? 'bg-cyan-600 text-white border-cyan-600' : 'text-slate-400 border-slate-600 hover:border-slate-500 bg-slate-800'">
            {{ cat }}
          </button>
        </div>
      </div>

      <!-- Summary bar -->
      <div class="bg-slate-800 rounded-2xl shadow-xl px-6 py-3 mb-4 border border-slate-700 border-l-4 border-l-cyan-500 text-sm">
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span class="text-slate-400 font-medium">{{ realFilteredTransactions.length }} transaction{{ realFilteredTransactions.length === 1 ? '' : 's' }}</span>
          <span class="text-slate-600 hidden sm:inline">·</span>
          <span class="font-semibold text-green-400">Income: {{ formatCurrency(filteredIncome) }}</span>
          <span class="text-slate-600 hidden sm:inline">·</span>
          <span class="font-semibold text-red-400">Expenses: {{ formatCurrency(Math.abs(filteredExpenses)) }}</span>
          <span class="text-slate-600 hidden sm:inline">·</span>
          <span class="font-semibold" :class="filteredNet >= 0 ? 'text-green-400' : 'text-red-400'">
            Net: {{ filteredNet >= 0 ? '+' : '' }}{{ formatCurrency(filteredNet) }}
          </span>
        </div>
        <div v-if="showUpcomingBills && upcomingRowsInRange.length > 0 && projectedEndBalance !== null" class="mt-1.5 pt-1.5 border-t border-slate-700/70 flex flex-wrap items-center gap-x-2 text-xs text-slate-300">
          <span class="font-medium text-slate-400">Projected end balance:</span>
          <span class="font-bold tabular-nums" :class="projectedEndBalance >= 0 ? 'text-cyan-400' : 'text-red-400'">
            {{ formatCurrency(projectedEndBalance) }}
          </span>
          <span class="text-slate-500">({{ upcomingRowsInRange.length }} upcoming bill{{ upcomingRowsInRange.length === 1 ? '' : 's' }})</span>
        </div>
      </div>

      <!-- Transactions Table -->
      <div class="bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-700">
        <div class="flex justify-between items-center p-6 border-b border-slate-700">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 class="text-xl font-bold text-slate-100">Transactions</h2>
            <span class="text-sm text-slate-400 bg-slate-700 px-3 py-1 rounded-full">
              Showing {{ paginatedTransactions.length }} of {{ filteredAndSortedTransactions.length }}
            </span>
          </div>
          <button
            @click="selectAll"
            class="text-blue-600 hover:text-blue-800 font-semibold hover:underline transition-colors duration-200"
          >
            {{ allSelected ? 'Deselect All' : 'Select All' }}
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-700">
            <thead class="bg-slate-900">
              <tr>
                <th scope="col" class="w-12 px-3 md:px-6 py-4">
                  <input
                    type="checkbox"
                    v-model="allSelected"
                    @change="toggleAll"
                    class="rounded border-slate-600 text-cyan-600 focus:ring-cyan-500 bg-slate-700"
                  >
                </th>
                <th scope="col" class="px-3 md:px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" class="px-3 md:px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" class="px-3 md:px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" class="px-3 md:px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" class="hidden md:table-cell px-3 md:px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Running Total
                </th>
                <th scope="col" class="px-3 md:px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <span class="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody class="bg-slate-800 divide-y divide-slate-700">
              <tr v-for="transaction in paginatedTransactions" :key="transaction.id" 
                  :class="[
                    'transition-colors duration-200',
                    transaction.isUpcoming
                      ? 'bg-slate-900/50 hover:bg-slate-800/70 opacity-75'
                      : (isFutureTransaction(transaction.date) ? 'bg-cyan-950/30 hover:bg-cyan-950/50' : 'hover:bg-slate-700/50')
                  ]">
                <td class="px-3 md:px-6 py-4">
                  <input
                    v-if="!transaction.isUpcoming"
                    type="checkbox"
                    v-model="selectedTransactions"
                    :value="transaction.id"
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  >
                </td>
                <td class="px-3 md:px-6 py-4 text-sm font-medium" :class="transaction.isUpcoming ? 'text-slate-400' : 'text-slate-200'">
                  {{ formatDate(transaction.date) }}
                </td>
                <td class="px-3 md:px-6 py-4 text-sm" :class="transaction.isUpcoming ? 'text-slate-300' : 'text-slate-200'">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span :class="{ 'capitalize': transaction.isUpcoming }">{{ transaction.description || '-' }}</span>
                    <span
                      v-if="transaction.isUpcoming"
                      class="px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide rounded-full bg-amber-950/60 text-amber-300 border border-amber-700/60"
                    >
                      Upcoming
                    </span>
                  </div>
                </td>
                <td class="px-3 md:px-6 py-4 text-sm text-slate-200">
                  <span class="bg-slate-700 text-slate-300 px-3 py-1 rounded-full text-xs font-medium">
                    {{ transaction.category }}
                  </span>
                </td>
                <td class="px-3 md:px-6 py-4 text-sm text-right tabular-nums font-semibold"
                  :class="{
                    'text-green-600': !transaction.noAmount && transaction.amount > 0,
                    'text-red-600': !transaction.noAmount && transaction.amount < 0,
                    'text-slate-500': transaction.noAmount
                  }"
                >
                  {{ formatCurrency(transaction.amount) }}
                  <div v-if="transaction.isUpcoming && transaction.noAmount" class="text-xs text-amber-400/90 font-normal mt-0.5 italic">
                    amount not set
                  </div>
                  <div v-if="lifeEnergyStore.lifeEnergyRate > 0 && transaction.amount < 0"
                       class="text-xs text-gray-400 font-normal mt-0.5">
                    ≈ {{ lifeEnergyStore.toCost(transaction.amount) }}
                  </div>
                  <div
                    class="md:hidden text-xs font-bold mt-0.5"
                    :class="{
                      'text-blue-600': transaction.runningTotal >= 0,
                      'text-red-600': transaction.runningTotal < 0
                    }"
                  >
                    Bal: {{ formatCurrency(transaction.runningTotal) }}
                  </div>
                </td>
                <td class="hidden md:table-cell px-3 md:px-6 py-4 text-sm text-right tabular-nums font-bold"
                  :class="{
                    'text-blue-600': transaction.runningTotal >= 0,
                    'text-red-600': transaction.runningTotal < 0
                  }"
                >
                  {{ formatCurrency(transaction.runningTotal) }}
                </td>
                <td class="relative px-3 md:px-6 py-4 text-right text-sm">
                  <button
                    v-if="transaction.isUpcoming"
                    type="button"
                    @click="openConfirmBillModal(transaction)"
                    class="px-3 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-950/60 border border-cyan-700/80 rounded-lg hover:bg-cyan-900/70 hover:text-white transition-colors duration-150 whitespace-nowrap"
                  >
                    Confirm
                  </button>
                  <div v-else class="relative inline-flex items-center justify-end">
                    <button
                      type="button"
                      @click.stop="toggleMenu(transaction.id)"
                      class="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-lg transition-colors duration-200"
                      aria-label="Transaction actions"
                      :aria-expanded="openMenuId === transaction.id"
                    >
                      <span class="text-lg leading-none font-bold">⋮</span>
                    </button>
                    <div
                      v-if="openMenuId === transaction.id"
                      @click.stop
                      class="absolute right-full top-1/2 -translate-y-1/2 mr-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl flex items-center gap-1 p-1 z-20 whitespace-nowrap"
                    >
                      <button
                        type="button"
                        @click="handleEdit(transaction)"
                        class="px-3 py-1 text-blue-400 hover:bg-slate-700/60 rounded-lg text-xs font-semibold transition-colors duration-150"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        @click="handleDelete(transaction.id)"
                        class="px-3 py-1 text-red-400 hover:bg-slate-700/60 rounded-lg text-xs font-semibold transition-colors duration-150"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Load more -->
        <div v-if="paginatedTransactions.length < filteredAndSortedTransactions.length" class="p-6 text-center border-t border-slate-700">
          <button
            @click="loadMore"
            class="px-6 py-2.5 text-sm font-semibold text-cyan-400 bg-cyan-950/30 border border-cyan-700 rounded-xl hover:bg-cyan-950/50 hover:border-cyan-600 transition-all duration-200"
          >
            Load more — {{ filteredAndSortedTransactions.length - paginatedTransactions.length }} remaining
          </button>
        </div>
      </div>
    </div>
  </div>
  
  <AddTransactionModal 
    v-model:isOpen="showAddModal"
    @transaction-added="showAddModal = false"
  />

  <EditTransactionModal
    v-model:isOpen="showEditModal"
    :transaction="selectedTransaction"
    @transaction-updated="handleTransactionUpdated"
  />

  <ConfirmBillModal
    v-model:isOpen="showConfirmBillModal"
    :upcomingRow="selectedUpcomingRow"
    @confirmed="handleBillConfirmed"
  />
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useTransactionsStore } from '@/stores/transactions'
import { useBillsStore } from '@/stores/bills'
import { useAuthStore } from '@/stores/auth'
import { useLifeEnergyStore } from '@/stores/lifeEnergy'
import AddTransactionModal from '@/components/AddTransactionModal.vue'
import EditTransactionModal from '@/components/EditTransactionModal.vue'
import ConfirmBillModal from '@/components/ConfirmBillModal.vue'
import { parseESTDate, getTodayEST } from '@/utils/dateUtils'
import { getUpcomingBillRows } from '@/utils/upcomingBills'

const transactionsStore = useTransactionsStore()
const billsStore = useBillsStore()
const authStore = useAuthStore()
const lifeEnergyStore = useLifeEnergyStore()

// Load as soon as auth is confirmed — skip if already loaded to avoid double fetch
watch(
  () => authStore.isLoggedIn,
  async (loggedIn) => {
    if (loggedIn && !transactionsStore.initialized) await transactionsStore.loadFromSupabase()
  },
  { immediate: true }
)

watch(
  () => authStore.isLoggedIn,
  async (loggedIn) => {
    if (loggedIn) await billsStore.initialize()
  },
  { immediate: true }
)

watch(
  () => authStore.isLoggedIn,
  async (loggedIn) => {
    if (loggedIn) await lifeEnergyStore.loadFromSupabase()
  },
  { immediate: true }
)
const selectedTransactions = ref([])
const allSelected = ref(false)
const showAddModal = ref(false)
const showEditModal = ref(false)
const selectedTransaction = ref(null)
const showConfirmBillModal = ref(false)
const selectedUpcomingRow = ref(null)

// Filter and sort state — default to current month
const now = getTodayEST()
const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
const dateRange = ref({
  start: currentMonth,
  end: currentMonth
})
const searchTerm = ref('')
const sortBy = ref('date')
const sortOrder = ref('desc')
const typeFilter = ref('all') // 'all' | 'income' | 'expenses'
const selectedCategory = ref(null) // null = all categories
const showUpcomingBills = ref(true)

function setTypeFilter(val) {
  typeFilter.value = val
  selectedCategory.value = null
  displayLimit.value = PAGE_SIZE
}

function compareRowIds(idA, idB) {
  const numA = Number(idA)
  const numB = Number(idB)
  if (!isNaN(numA) && !isNaN(numB)) {
    return numA - numB
  }
  return String(idA).localeCompare(String(idB))
}

function compareChronological(a, b) {
  const dateDiff = parseESTDate(a.date) - parseESTDate(b.date)
  if (dateDiff !== 0) return dateDiff
  const aUp = a.isUpcoming ? 1 : 0
  const bUp = b.isUpcoming ? 1 : 0
  if (aUp !== bUp) return aUp - bUp
  return compareRowIds(a.id, b.id)
}

// Helper function to filter transactions by date range
function filterTransactionsByDateRange(transactions, range) {
  if (!range || !range.start || !range.end) return transactions

  // Parse start as EST date
  let [sy, sm, sd] = (range.start.length === 7 ? `${range.start}-01` : range.start).split('-').map(Number)
  let start = parseESTDate(`${sy}-${sm}-${sd || 1}`)

  // Parse end as EST date
  let endExclusive
  if (range.end.length === 7) {
    let [ey, em] = range.end.split('-').map(Number)
    endExclusive = parseESTDate(`${ey}-${em + 1}-1`) // First day of next month
  } else {
    let [ey, em, ed] = range.end.split('-').map(Number)
    endExclusive = parseESTDate(`${ey}-${em}-${ed + 1}`)
  }

  return transactions.filter(t => {
    const tDate = parseESTDate(t.date)
    return tDate >= start && tDate < endExclusive
  })
}

// Helper function to search transactions
function searchTransactions(transactions, term) {
  if (!term) return transactions
  const searchTerm = term.toLowerCase()
  return transactions.filter(t => 
    t.description?.toLowerCase().includes(searchTerm) ||
    t.category?.toLowerCase().includes(searchTerm) ||
    t.amount.toString().includes(searchTerm)
  )
}

// Helper function to sort transactions
function sortTransactions(transactions, sortBy, sortOrder) {
  return [...transactions].sort((a, b) => {
    let comparison = 0
    switch (sortBy) {
      case 'date': {
        comparison = compareChronological(a, b)
        break
      }
      case 'amount':
        comparison = a.amount - b.amount
        break
      case 'description':
        comparison = (a.description || '').localeCompare(b.description || '')
        break
      case 'category':
        comparison = (a.category || '').localeCompare(b.category || '')
        break
      default:
        comparison = 0
    }
    return sortOrder === 'desc' ? -comparison : comparison
  })
}

// Upcoming bill rows for the selected date range
const upcomingRowsInRange = computed(() => {
  if (!showUpcomingBills.value) return []
  const rawRows = getUpcomingBillRows(
    billsStore.getBills || [],
    billsStore.billMonthStatus || {},
    dateRange.value
  )
  return filterTransactionsByDateRange(rawRows, dateRange.value)
})

// Chronological list of all real transactions + (when toggle is on) upcoming rows
const allChronologicalRows = computed(() => {
  const realTx = transactionsStore.getTransactions || []
  const combined = showUpcomingBills.value
    ? [...realTx, ...upcomingRowsInRange.value]
    : [...realTx]
  return combined.sort(compareChronological)
})

// Single chronological pass for running totals (used for every sort direction)
const runningTotalsMap = computed(() => {
  let total = 0
  const map = {}
  allChronologicalRows.value.forEach(tx => {
    total += tx.amount
    map[tx.id] = total
  })
  return map
})

// Projected end balance: running total after the last row dated inside the selected date range
const projectedEndBalance = computed(() => {
  if (!showUpcomingBills.value || upcomingRowsInRange.value.length === 0) return null
  const rowsInRange = filterTransactionsByDateRange(allChronologicalRows.value, dateRange.value)
  if (rowsInRange.length === 0) return null
  const lastRow = rowsInRange[rowsInRange.length - 1]
  return runningTotalsMap.value[lastRow.id] ?? null
})

// Pagination
const PAGE_SIZE = 50
const displayLimit = ref(PAGE_SIZE)

// Reset to first page whenever any filter or sort changes
watch([dateRange, searchTerm, sortBy, sortOrder, typeFilter, selectedCategory, showUpcomingBills], () => {
  displayLimit.value = PAGE_SIZE
}, { deep: true })

const paginatedTransactions = computed(() =>
  filteredAndSortedTransactions.value.slice(0, displayLimit.value)
)

function loadMore() {
  displayLimit.value += PAGE_SIZE
}

// Real transactions filtered by date, type, search, and category — used exclusively for summary bar totals
const realPreFilteredTransactions = computed(() => {
  let txs = transactionsStore.getTransactions || []
  txs = filterTransactionsByDateRange(txs, dateRange.value)
  if (typeFilter.value === 'income') txs = txs.filter(t => t.amount > 0)
  else if (typeFilter.value === 'expenses') txs = txs.filter(t => t.amount < 0)
  txs = searchTransactions(txs, searchTerm.value)
  return txs
})

const realFilteredTransactions = computed(() => {
  let txs = realPreFilteredTransactions.value.slice()
  if (selectedCategory.value) {
    txs = txs.filter(t =>
      t.category && t.category.split(' - ')[0] === selectedCategory.value
    )
  }
  return txs
})

// Transactions (including upcoming rows when toggled on) after date, type, and search — used for category pills and table
const preFilteredTransactions = computed(() => {
  const realTxs = filterTransactionsByDateRange(transactionsStore.getTransactions || [], dateRange.value)
  let txs = showUpcomingBills.value ? [...realTxs, ...upcomingRowsInRange.value] : realTxs
  if (typeFilter.value === 'income') txs = txs.filter(t => !t.isUpcoming && t.amount > 0)
  else if (typeFilter.value === 'expenses') txs = txs.filter(t => t.isUpcoming || t.amount < 0)
  txs = searchTransactions(txs, searchTerm.value)
  return txs
})

// Unique main categories from current pre-filtered set
const availableCategories = computed(() => {
  return [...new Set(
    preFilteredTransactions.value
      .map(t => t.category?.split(' - ')[0])
      .filter(Boolean)
  )].sort()
})

// Computed property for filtered and sorted transactions
const filteredAndSortedTransactions = computed(() => {
  let transactions = preFilteredTransactions.value.slice()

  // Apply category filter
  if (selectedCategory.value) {
    transactions = transactions.filter(t =>
      t.category && t.category.split(' - ')[0] === selectedCategory.value
    )
  }

  // Sort transactions
  transactions = sortTransactions(transactions, sortBy.value, sortOrder.value)

  // Every sort direction looks up its running total from the single chronological pass
  return transactions.map(transaction => ({
    ...transaction,
    runningTotal: runningTotalsMap.value[transaction.id] ?? transaction.amount
  }))
})

// Summary bar totals (REAL transactions only, never upcoming rows)
const filteredIncome = computed(() =>
  realFilteredTransactions.value.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
)
const filteredExpenses = computed(() =>
  realFilteredTransactions.value.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0)
)
const filteredNet = computed(() => filteredIncome.value + filteredExpenses.value)

const formatDate = (date) => {
  const d = parseESTDate(date)
  return new Intl.DateTimeFormat('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric'
  }).format(d)
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

// Helper function to check if a transaction is in the future (EST timezone)
const isFutureTransaction = (dateStr) => {
  const transactionDate = parseESTDate(dateStr)
  const todayEST = getTodayEST()
  
  return transactionDate > todayEST
}

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
}

const deleteTransaction = async (id) => {
  if (String(id).startsWith('upcoming-')) return
  if (confirm('Are you sure you want to delete this transaction?')) {
    await transactionsStore.deleteTransaction(id)
  }
}

const deleteSelectedTransactions = async () => {
  const realIds = selectedTransactions.value.filter(id => !String(id).startsWith('upcoming-'))
  if (realIds.length === 0) return
  if (confirm(`Are you sure you want to delete ${realIds.length} transactions?`)) {
    await Promise.all(realIds.map(id => transactionsStore.deleteTransaction(id)))
    selectedTransactions.value = []
    allSelected.value = false
  }
}

const selectAll = () => {
  allSelected.value = !allSelected.value
  if (allSelected.value) {
    selectedTransactions.value = filteredAndSortedTransactions.value
      .filter(t => !t.isUpcoming)
      .map(t => t.id)
  } else {
    selectedTransactions.value = []
  }
}

const toggleAll = () => {
  if (allSelected.value) {
    selectedTransactions.value = filteredAndSortedTransactions.value
      .filter(t => !t.isUpcoming)
      .map(t => t.id)
  } else {
    selectedTransactions.value = []
  }
}

const openAddTransactionModal = () => {
  showAddModal.value = true
}

const editTransaction = (transaction) => {
  if (transaction?.isUpcoming) return
  selectedTransaction.value = transaction
  showEditModal.value = true
}

const handleTransactionUpdated = () => {
  showEditModal.value = false
  selectedTransaction.value = null
}

const openConfirmBillModal = (upcomingRow) => {
  selectedUpcomingRow.value = upcomingRow
  showConfirmBillModal.value = true
}

const handleBillConfirmed = () => {
  showConfirmBillModal.value = false
  selectedUpcomingRow.value = null
}

const openMenuId = ref(null)

const toggleMenu = (id) => {
  openMenuId.value = openMenuId.value === id ? null : id
}

const closeMenu = () => {
  openMenuId.value = null
}

const handleEdit = (transaction) => {
  closeMenu()
  editTransaction(transaction)
}

const handleDelete = (id) => {
  closeMenu()
  deleteTransaction(id)
}

const handleKeydown = (e) => {
  if (e.key === 'Escape') {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', closeMenu)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', closeMenu)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.tabular-nums {
  font-variant-numeric: tabular-nums;
}
</style> 