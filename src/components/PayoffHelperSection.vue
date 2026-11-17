<template>
  <div class="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 border-l-4 border-l-violet-500 overflow-hidden">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-slate-700 flex items-baseline justify-between flex-wrap gap-3">
      <div>
        <h2 class="text-lg font-bold text-slate-100">Payoff Helper</h2>
        <p class="text-sm text-slate-400 mt-0.5">
          Compare your debts to decide which ones to pay off with a loan
        </p>
      </div>

      <!-- Sort Toggle -->
      <div v-if="helperData.debts.length > 0" class="flex items-center gap-2 flex-wrap">
        <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sort:</span>
        <div class="flex rounded-xl overflow-hidden border border-slate-600">
          <button
            type="button"
            @click="sortBy = 'efficiency'"
            class="px-3 py-1.5 text-xs font-medium transition-colors"
            :class="sortBy === 'efficiency' ? 'bg-rose-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'"
          >
            Most payment freed per $ of balance
          </button>
          <button
            type="button"
            @click="sortBy = 'apr'"
            class="px-3 py-1.5 text-xs font-medium transition-colors"
            :class="sortBy === 'apr' ? 'bg-rose-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'"
          >
            Highest APR
          </button>
        </div>
      </div>
    </div>

    <div class="p-4 space-y-4">
      <!-- Empty State -->
      <div
        v-if="debts.length === 0"
        class="p-4 rounded-xl bg-slate-900/40 border border-slate-700 text-sm text-slate-300 flex items-center justify-between flex-wrap gap-3"
      >
        <span>
          No debts found in the Debt tab yet. Add your credit cards or loans on the
          <router-link to="/debt-plan" class="text-indigo-400 hover:text-indigo-300 underline font-semibold">
            Debt page
          </router-link>
          to compare payoff options here.
        </span>
      </div>

      <template v-else>
        <!-- Loan Amount Input + Summary Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          <!-- Loan Amount Received Input -->
          <div class="p-4 rounded-xl bg-slate-700/50 border border-slate-600">
            <label for="loan-amount-received-input" class="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              Loan Amount Received
            </label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-semibold pointer-events-none">$</span>
              <input
                id="loan-amount-received-input"
                v-model.number="loanAmountReceived"
                type="number"
                min="0"
                step="100"
                placeholder="0.00"
                class="w-full pl-8 pr-4 py-2 border border-slate-600 rounded-xl bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              />
            </div>
            <p class="text-xs text-slate-400 mt-2">
              Selected balances:
              <span class="font-semibold text-slate-100">{{ formatCurrency(helperData.summary.selectedBalancesTotal) }}</span>
            </p>
            <p
              class="text-xs font-semibold mt-1"
              :class="helperData.summary.exceedsLoanAmount ? 'text-rose-400' : 'text-emerald-400'"
            >
              <template v-if="helperData.summary.exceedsLoanAmount">
                Short by {{ formatCurrency(Math.abs(helperData.summary.loanRemainingOrShort)) }}
              </template>
              <template v-else>
                Remaining loan funds: {{ formatCurrency(helperData.summary.loanRemainingOrShort) }}
              </template>
            </p>
          </div>

          <!-- Monthly Payments Freed vs. New Loan Payment -->
          <div class="p-4 rounded-xl bg-slate-700/50 border border-slate-600 space-y-1.5">
            <div class="flex justify-between text-sm">
              <span class="text-slate-400">Monthly payments freed:</span>
              <span class="font-semibold text-emerald-400">{{ formatCurrency(helperData.summary.monthlyPaymentsFreed) }}/mo</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-slate-400">New loan payment:</span>
              <span class="font-semibold text-slate-100">{{ formatCurrency(helperData.summary.newLoanPayment) }}/mo</span>
            </div>
            <div class="flex justify-between text-sm pt-1.5 border-t border-slate-600">
              <span class="font-bold text-slate-200">Net monthly change:</span>
              <span
                class="font-bold"
                :class="helperData.summary.netMonthlyChange >= 0 ? 'text-emerald-400' : 'text-rose-400'"
              >
                {{ helperData.summary.netMonthlyChange >= 0 ? '+' : '' }}{{ formatCurrency(helperData.summary.netMonthlyChange) }}/mo
              </span>
            </div>
          </div>

          <!-- Weekly Average Cash Flow Change -->
          <div class="p-4 rounded-xl bg-slate-700/50 border border-slate-600 space-y-1.5">
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Weekly Average Change (× 12 ÷ 52)
            </p>
            <p
              class="text-2xl font-bold"
              :class="helperData.summary.netWeeklyChange >= 0 ? 'text-emerald-400' : 'text-rose-400'"
            >
              {{ helperData.summary.netWeeklyChange >= 0 ? '+' : '' }}{{ formatCurrency(helperData.summary.netWeeklyChange) }}<span class="text-xs font-normal text-slate-400">/wk</span>
            </p>
            <p class="text-xs text-slate-400">
              {{ helperData.summary.netMonthlyChange >= 0 ? 'Freed cash flow per week' : 'Additional cost per week' }}
            </p>
          </div>
        </div>

        <!-- Warning if selected balances exceed loan amount -->
        <div
          v-if="helperData.summary.exceedsLoanAmount"
          class="p-3 rounded-xl bg-rose-950/40 border border-rose-500/60 text-xs text-rose-300 font-medium"
        >
          Warning: Selected debt balances ({{ formatCurrency(helperData.summary.selectedBalancesTotal) }}) exceed the loan amount ({{ formatCurrency(helperData.summary.loanAmount) }}) by {{ formatCurrency(Math.abs(helperData.summary.loanRemainingOrShort)) }}.
        </div>

        <!-- Note if checked bills have no matching debt -->
        <p
          v-if="helperData.summary.checkedBillsWithoutDebtCount > 0"
          class="text-xs text-amber-300/90 italic"
        >
          {{ helperData.summary.checkedBillsWithoutDebtCount }} checked bill{{ helperData.summary.checkedBillsWithoutDebtCount === 1 ? ' has' : 's have' }} no balance on the Debt tab and {{ helperData.summary.checkedBillsWithoutDebtCount === 1 ? 'isn’t' : 'aren’t' }} counted against the loan amount.
        </p>

        <p class="text-xs text-slate-400 italic">
          This shows monthly cash flow, not the total cost of the loan.
        </p>

        <!-- Debts List -->
        <div class="space-y-2 pt-1">
          <label
            v-for="debt in helperData.debts"
            :key="debt.id"
            class="flex items-start justify-between p-4 rounded-xl border transition-colors cursor-pointer select-none"
            :class="debt.isChecked
              ? 'bg-indigo-950/30 border-indigo-500/50'
              : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700/80'"
          >
            <div class="flex items-start gap-3 min-w-0 flex-1">
              <input
                type="checkbox"
                :checked="debt.isChecked"
                @change="toggleDebtSelection(debt)"
                class="mt-1 w-4 h-4 rounded border-slate-500 text-indigo-600 bg-slate-900 focus:ring-indigo-500 shrink-0 cursor-pointer"
              />
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-semibold text-slate-100">{{ debt.name }}</span>
                  <span
                    v-if="debt.isLinkedToBill"
                    class="text-xs px-2 py-0.5 bg-emerald-950/60 border border-emerald-600/50 text-emerald-300 rounded-full font-medium"
                  >
                    on Bills page
                  </span>
                  <span
                    v-else
                    class="text-xs px-2 py-0.5 bg-slate-700 border border-slate-500 text-slate-400 rounded-full"
                  >
                    not on Bills page: won’t appear in weekly cards
                  </span>
                </div>
                <p class="text-xs text-slate-400 mt-1">
                  Balance: <strong class="text-slate-200">{{ formatCurrency(debt.balance) }}</strong>
                  · APR: <strong class="text-slate-200">{{ debt.apr.toFixed(2) }}%</strong>
                </p>
              </div>
            </div>

            <div class="text-right shrink-0 ml-4">
              <p class="font-bold text-slate-100">
                {{ formatCurrency(debt.monthlyPayment) }}<span class="text-xs font-normal text-slate-400">/mo</span>
              </p>
              <p class="text-xs text-slate-400">
                {{ debt.isLinkedToBill ? 'Bill amount' : 'Min payment' }}
              </p>
            </div>
          </label>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { buildPayoffHelperData } from '@/utils/weeklyCosts'

const props = defineProps({
  debts: {
    type: Array,
    default: () => []
  },
  activeBills: {
    type: Array,
    default: () => []
  },
  billMonthStatus: {
    type: Object,
    default: () => ({})
  },
  selectedMonth: {
    type: String,
    default: ''
  },
  paidOffBillIds: {
    type: Object,
    required: true
  },
  monthlyLoanPayment: {
    type: [Number, String],
    default: 0
  }
})

const emit = defineEmits(['set-bills-paid-off'])

// Local-only state (never saved)
const loanAmountReceived = ref('')
const sortBy = ref('efficiency')
const selectedUnlinkedDebtIds = ref(new Set())

const helperData = computed(() =>
  buildPayoffHelperData({
    debts: props.debts,
    activeBills: props.activeBills,
    billMonthStatus: props.billMonthStatus,
    selectedMonth: props.selectedMonth,
    paidOffBillIds: props.paidOffBillIds,
    selectedUnlinkedDebtIds: selectedUnlinkedDebtIds.value,
    loanAmountReceived: loanAmountReceived.value,
    monthlyLoanPayment: props.monthlyLoanPayment,
    sortBy: sortBy.value
  })
)

function toggleDebtSelection(debt) {
  if (debt.isLinkedToBill) {
    emit('set-bills-paid-off', {
      billIds: debt.matchedBillIds,
      checked: !debt.isChecked
    })
  } else {
    const next = new Set(selectedUnlinkedDebtIds.value)
    if (next.has(debt.id)) {
      next.delete(debt.id)
    } else {
      next.add(debt.id)
    }
    selectedUnlinkedDebtIds.value = next
  }
}

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}
</script>

