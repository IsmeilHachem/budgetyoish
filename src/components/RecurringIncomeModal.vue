<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
    <div class="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl text-slate-100 p-6">
      <div class="flex justify-between items-center mb-5 pb-3 border-b border-slate-700">
        <div>
          <h2 class="text-xl font-bold text-white">Recurring Income Schedules</h2>
          <p class="text-xs text-slate-400 mt-0.5">Manage recurring paychecks that appear as upcoming income rows</p>
        </div>
        <button @click="closeModal" class="text-slate-400 hover:text-slate-200 transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Existing schedules list -->
      <div class="mb-6">
        <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Saved Schedules</h3>
        <div v-if="sources.length === 0" class="text-sm text-slate-400 bg-slate-900/50 border border-slate-700/70 rounded-xl p-4">
          No recurring income schedules yet. Add one below.
        </div>
        <div v-else class="space-y-2.5">
          <div
            v-for="source in sources"
            :key="source.id"
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900/60 border border-slate-700 rounded-xl"
          >
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-semibold text-slate-100">{{ source.name }}</span>
                <span class="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded-full">{{ source.category }}</span>
                <span class="text-xs px-2 py-0.5 bg-emerald-950/60 text-emerald-300 border border-emerald-700/60 rounded-full">
                  {{ formatFrequencyLabel(source) }}
                </span>
              </div>
              <p class="text-xs text-slate-400 mt-1">
                Start: {{ source.startDate }}
                <span v-if="source.endDate"> · End: {{ source.endDate }}</span>
              </p>
            </div>
            <div class="flex items-center gap-3 shrink-0">
              <span class="font-bold text-emerald-400 tabular-nums">{{ formatCurrency(source.amount) }}</span>
              <button
                type="button"
                @click="startEdit(source)"
                class="px-3 py-1.5 text-xs font-semibold text-blue-400 bg-slate-800 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors"
              >
                Edit
              </button>
              <button
                type="button"
                @click="handleDelete(source)"
                class="px-3 py-1.5 text-xs font-semibold text-red-400 bg-slate-800 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Add / Edit Form -->
      <div class="bg-slate-900/50 border border-slate-700 rounded-xl p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-bold text-slate-200">
            {{ editingId ? 'Edit Schedule' : 'Add New Schedule' }}
          </h3>
          <button
            v-if="editingId"
            type="button"
            @click="resetForm"
            class="text-xs text-slate-400 hover:text-slate-200 underline"
          >
            Cancel edit
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-slate-300 mb-1">Name</label>
              <input
                type="text"
                v-model="form.name"
                required
                placeholder="Paycheck"
                class="w-full px-3.5 py-2.5 border border-slate-600 rounded-xl bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label class="block text-sm font-semibold text-slate-300 mb-1">Amount</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-semibold pointer-events-none">$</span>
                <input
                  type="number"
                  v-model="form.amount"
                  required
                  min="0.01"
                  step="0.01"
                  placeholder="1000.00"
                  class="w-full pl-8 pr-3.5 py-2.5 border border-slate-600 rounded-xl bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-slate-300 mb-1">Main Category</label>
              <select
                v-model="form.mainCategory"
                @change="handleMainCategoryChange"
                required
                class="w-full px-3.5 py-2.5 border border-slate-600 rounded-xl bg-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">Select Main Category</option>
                <option v-for="cat in mainCategories" :key="cat" :value="cat">
                  {{ cat }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-semibold text-slate-300 mb-1">Subcategory</label>
              <select
                v-model="form.subcategory"
                :disabled="!form.mainCategory"
                required
                class="w-full px-3.5 py-2.5 border border-slate-600 rounded-xl bg-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
              >
                <option value="">Select Subcategory</option>
                <option v-for="sub in subcategories" :key="sub" :value="sub">
                  {{ sub }}
                </option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-semibold text-slate-300 mb-1">Frequency</label>
              <select
                v-model="form.frequency"
                required
                class="w-full px-3.5 py-2.5 border border-slate-600 rounded-xl bg-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Every 2 weeks</option>
                <option value="semimonthly">Twice a month</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-semibold text-slate-300 mb-1">First or next pay date</label>
              <input
                type="date"
                v-model="form.startDate"
                required
                class="w-full px-3.5 py-2.5 border border-slate-600 rounded-xl bg-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label class="block text-sm font-semibold text-slate-300 mb-1">End Date (Optional)</label>
              <input
                type="date"
                v-model="form.endDate"
                class="w-full px-3.5 py-2.5 border border-slate-600 rounded-xl bg-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <!-- Day-of-month fields only for twice-a-month and monthly -->
          <div v-if="form.frequency === 'semimonthly'" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-slate-300 mb-1">First Day of Month (1–31)</label>
              <input
                type="number"
                v-model.number="form.day1"
                min="1"
                max="31"
                required
                class="w-full px-3.5 py-2.5 border border-slate-600 rounded-xl bg-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-300 mb-1">Second Day of Month (1–31)</label>
              <input
                type="number"
                v-model.number="form.day2"
                min="1"
                max="31"
                required
                class="w-full px-3.5 py-2.5 border border-slate-600 rounded-xl bg-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div v-if="form.frequency === 'monthly'" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-slate-300 mb-1">Day of Month (1–31)</label>
              <input
                type="number"
                v-model.number="form.day1"
                min="1"
                max="31"
                required
                class="w-full px-3.5 py-2.5 border border-slate-600 rounded-xl bg-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 border border-slate-600 rounded-xl hover:bg-slate-600 transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              :disabled="!isFormValid"
              class="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl hover:from-emerald-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {{ editingId ? 'Save Changes' : 'Add Schedule' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRecurringIncomeStore } from '@/stores/recurringIncome'
import { useCategoriesStore } from '@/stores/categories'
import { getTodayEST } from '@/utils/dateUtils'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:isOpen'])

const recurringIncomeStore = useRecurringIncomeStore()
const categoriesStore = useCategoriesStore()

const sources = computed(() => recurringIncomeStore.getSources || [])
const mainCategories = computed(() => categoriesStore.getMainCategories || [])
const subcategories = computed(() => {
  if (!form.value.mainCategory) return []
  return categoriesStore.getSubcategories(form.value.mainCategory) || []
})

function getTodayDateString() {
  const todayEST = getTodayEST()
  const year = todayEST.getFullYear()
  const month = String(todayEST.getMonth() + 1).padStart(2, '0')
  const day = String(todayEST.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getDefaultCategoryParts() {
  if (categoriesStore.validateCategory('Pay Day - Pay Day')) {
    return { mainCategory: 'Pay Day', subcategory: 'Pay Day' }
  }
  const mains = categoriesStore.getMainCategories || []
  const firstMain = mains[0] || ''
  const subs = firstMain ? (categoriesStore.getSubcategories(firstMain) || []) : []
  return { mainCategory: firstMain, subcategory: subs[0] || '' }
}

const editingId = ref(null)
const form = ref({
  name: '',
  amount: '',
  mainCategory: 'Pay Day',
  subcategory: 'Pay Day',
  frequency: 'biweekly',
  startDate: getTodayDateString(),
  endDate: '',
  day1: 1,
  day2: 15
})

function resetForm() {
  editingId.value = null
  const defCat = getDefaultCategoryParts()
  form.value = {
    name: '',
    amount: '',
    mainCategory: defCat.mainCategory,
    subcategory: defCat.subcategory,
    frequency: 'biweekly',
    startDate: getTodayDateString(),
    endDate: '',
    day1: 1,
    day2: 15
  }
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      resetForm()
    }
  }
)

function handleMainCategoryChange() {
  const subs = categoriesStore.getSubcategories(form.value.mainCategory) || []
  form.value.subcategory = subs.length === 1 ? subs[0] : ''
}

const fullCategoryString = computed(() => {
  if (!form.value.mainCategory || !form.value.subcategory) return ''
  return `${String(form.value.mainCategory).trim()} - ${String(form.value.subcategory).trim()}`
})

const isFormValid = computed(() => {
  const amt = parseFloat(form.value.amount)
  if (!form.value.name || !form.value.name.trim()) return false
  if (isNaN(amt) || amt <= 0) return false
  if (!form.value.startDate) return false
  if (form.value.endDate && form.value.endDate < form.value.startDate) return false
  if (!fullCategoryString.value || !categoriesStore.validateCategory(fullCategoryString.value)) return false

  if (form.value.frequency === 'semimonthly') {
    const d1 = Number(form.value.day1)
    const d2 = Number(form.value.day2)
    if (!Number.isInteger(d1) || d1 < 1 || d1 > 31) return false
    if (!Number.isInteger(d2) || d2 < 1 || d2 > 31) return false
  } else if (form.value.frequency === 'monthly') {
    const d1 = Number(form.value.day1)
    if (!Number.isInteger(d1) || d1 < 1 || d1 > 31) return false
  }

  return true
})

function startEdit(source) {
  editingId.value = source.id
  let mainCategory = ''
  let subcategory = ''
  if (source.category && source.category.includes(' - ')) {
    const parts = source.category.split(' - ')
    mainCategory = parts[0].trim()
    subcategory = parts.slice(1).join(' - ').trim()
  }
  const days = Array.isArray(source.days) ? source.days : []
  form.value = {
    name: source.name || '',
    amount: source.amount || '',
    mainCategory,
    subcategory,
    frequency: source.frequency || 'biweekly',
    startDate: source.startDate || getTodayDateString(),
    endDate: source.endDate || '',
    day1: days[0] ?? 1,
    day2: days[1] ?? 15
  }
}

function handleDelete(source) {
  if (confirm(`Delete recurring income schedule "${source.name}"?`)) {
    recurringIncomeStore.deleteSource(source.id)
    if (editingId.value === source.id) {
      resetForm()
    }
  }
}

function handleSubmit() {
  if (!isFormValid.value) return

  let days = []
  if (form.value.frequency === 'semimonthly') {
    days = [Number(form.value.day1), Number(form.value.day2)]
  } else if (form.value.frequency === 'monthly') {
    days = [Number(form.value.day1)]
  }

  const payload = {
    name: form.value.name.trim(),
    amount: Math.abs(parseFloat(form.value.amount)),
    category: fullCategoryString.value,
    frequency: form.value.frequency,
    startDate: form.value.startDate,
    days,
    endDate: form.value.endDate ? form.value.endDate : null
  }

  if (editingId.value) {
    recurringIncomeStore.editSource(editingId.value, payload)
  } else {
    recurringIncomeStore.addSource(payload)
  }

  resetForm()
}

function closeModal() {
  emit('update:isOpen', false)
}

function formatFrequencyLabel(source) {
  switch (source.frequency) {
    case 'weekly':
      return 'Weekly'
    case 'biweekly':
      return 'Every 2 weeks'
    case 'semimonthly':
      return `Twice a month (${(source.days || []).join(', ')})`
    case 'monthly':
      return `Monthly (day ${(source.days || [])[0] ?? ''})`
    default:
      return source.frequency
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value || 0)
}
</script>

