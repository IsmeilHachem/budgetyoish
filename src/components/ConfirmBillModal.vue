<template>
  <div v-if="isOpen && upcomingRow" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
    <div class="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl text-slate-100">
      <div class="flex justify-between items-center mb-5 pb-3 border-b border-slate-700">
        <div>
          <h2 class="text-xl font-bold text-white">Confirm Bill Payment</h2>
          <p class="text-xs text-slate-400 mt-0.5">Covers: {{ formattedCoveredMonth }}</p>
        </div>
        <button @click="closeModal" class="text-slate-400 hover:text-slate-200 transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Bill Name</label>
          <div class="px-4 py-2.5 bg-slate-900/70 border border-slate-700 rounded-xl text-slate-200 font-medium capitalize">
            {{ upcomingRow.description }}
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Category</label>
          <div class="px-4 py-2.5 bg-slate-900/70 border border-slate-700 rounded-xl text-slate-300 text-sm">
            {{ upcomingRow.category }}
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Covers</label>
          <div class="px-4 py-2.5 bg-slate-900/70 border border-slate-700 rounded-xl text-cyan-400 text-sm font-semibold">
            Covers: {{ formattedCoveredMonth }}
          </div>
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
              placeholder="0.00"
              class="w-full pl-8 pr-4 py-2.5 border border-slate-600 rounded-xl bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-semibold text-slate-300 mb-1">Date Paid</label>
          <input
            type="date"
            v-model="form.datePaid"
            required
            class="w-full px-4 py-2.5 border border-slate-600 rounded-xl bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          />
        </div>

        <div class="flex justify-end gap-3 pt-3 border-t border-slate-700">
          <button
            type="button"
            @click="closeModal"
            class="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 border border-slate-600 rounded-xl hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="!isFormValid || isSaving"
            class="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {{ isSaving ? 'Saving...' : 'Confirm Payment' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useTransactionsStore } from '@/stores/transactions'
import { useBillsStore } from '@/stores/bills'
import { getTodayEST, parseESTDate } from '@/utils/dateUtils'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  upcomingRow: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:isOpen', 'confirmed'])

const transactionsStore = useTransactionsStore()
const billsStore = useBillsStore()
const isSaving = ref(false)

function getTodayDateString() {
  const todayEST = getTodayEST()
  const year = todayEST.getFullYear()
  const month = String(todayEST.getMonth() + 1).padStart(2, '0')
  const day = String(todayEST.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const form = ref({
  amount: '',
  datePaid: getTodayDateString()
})

watch(
  () => [props.isOpen, props.upcomingRow],
  ([open, row]) => {
    if (open && row) {
      const defaultAmt = row.noAmount ? '' : Math.abs(Number(row.amount))
      form.value = {
        amount: defaultAmt,
        datePaid: getTodayDateString()
      }
    }
  },
  { immediate: true }
)

const formattedCoveredMonth = computed(() => {
  const ym = props.upcomingRow?.month
  if (!ym) return ''
  const d = parseESTDate(`${ym}-01`)
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric'
  }).format(d)
})

const isFormValid = computed(() => {
  const amt = parseFloat(form.value.amount)
  return Boolean(form.value.datePaid && !isNaN(amt) && amt > 0)
})

const closeModal = () => {
  emit('update:isOpen', false)
}

const handleSubmit = async () => {
  if (!isFormValid.value || isSaving.value || !props.upcomingRow) return

  isSaving.value = true
  const enteredAmount = Math.abs(parseFloat(form.value.amount))
  const billId = props.upcomingRow.billId ?? props.upcomingRow.bill?.id
  const coveredMonth = props.upcomingRow.month

  const saved = await transactionsStore.addTransaction(
    {
      date: form.value.datePaid,
      description: props.upcomingRow.description,
      category: props.upcomingRow.category,
      amount: -enteredAmount,
      isIncome: false
    },
    { skipBillMatch: true }
  )

  isSaving.value = false

  if (!saved) {
    alert('Transaction could not be saved. Check your connection and try again.')
    return
  }

  billsStore.markAsPaid(billId, enteredAmount, coveredMonth)
  emit('confirmed')
  closeModal()
}
</script>

