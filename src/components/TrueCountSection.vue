<template>
  <div class="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 border-l-4 border-l-cyan-500 overflow-hidden">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-slate-700">
      <div class="flex items-baseline justify-between flex-wrap gap-2">
        <h2 class="text-lg font-bold text-slate-100">
          True Count ({{ formatMonthLabel(selectedMonth) }})
        </h2>
        <span class="text-xs text-slate-400">
          As of {{ trueCount.todayDateStr }}
        </span>
      </div>
      <p class="text-xs text-slate-400 mt-1">
        Actual so far shows logged transactions up to today; Forecast combines actuals with unpaid bills and unconfirmed paychecks still ahead; Difference from schedule compares that forecast to your scheduled monthly plan.
      </p>
    </div>

    <div class="p-4 space-y-4">
      <!-- Three Columns: Actual so far | Forecast (full month) | Difference from schedule -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Column 1: Actual so far -->
        <div class="p-4 rounded-xl bg-slate-700/50 border border-slate-600 space-y-2.5">
          <div class="flex items-center justify-between border-b border-slate-600 pb-2">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-200">Actual so far</span>
            <span class="text-xs text-slate-400">Logged ≤ today</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-slate-400">Income:</span>
            <span class="font-semibold text-emerald-400">{{ formatCurrency(trueCount.actualSoFar.income) }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-slate-400">Expenses (all categories):</span>
            <span class="font-semibold text-slate-100">{{ formatCurrency(trueCount.actualSoFar.expenses) }}</span>
          </div>
          <div class="flex justify-between text-sm pt-2 border-t border-slate-600">
            <span class="font-bold text-slate-200">Net:</span>
            <span
              class="font-bold text-base"
              :class="trueCount.actualSoFar.net >= 0 ? 'text-emerald-400' : 'text-rose-400'"
            >
              {{ formatCurrency(trueCount.actualSoFar.net) }}
            </span>
          </div>
        </div>

        <!-- Column 2: Forecast (full month) -->
        <div class="p-4 rounded-xl bg-slate-700/50 border border-slate-600 space-y-2.5">
          <div class="flex items-center justify-between border-b border-slate-600 pb-2">
            <span class="text-xs font-bold uppercase tracking-wider text-cyan-300">Forecast (full month)</span>
            <span class="text-xs text-slate-400">Actual + still ahead</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-slate-400">Income:</span>
            <span class="font-semibold text-emerald-400">{{ formatCurrency(trueCount.forecast.income) }}</span>
          </div>
          <div
            v-if="trueCount.alreadyLoggedAhead.income > 0 || trueCount.alreadyLoggedAhead.expenses > 0"
            class="flex justify-between text-xs text-cyan-300/90"
          >
            <span>Already logged ahead:</span>
            <span>
              <template v-if="trueCount.alreadyLoggedAhead.income > 0">
                +{{ formatCurrency(trueCount.alreadyLoggedAhead.income) }} inc
              </template>
              <template v-if="trueCount.alreadyLoggedAhead.income > 0 && trueCount.alreadyLoggedAhead.expenses > 0"> · </template>
              <template v-if="trueCount.alreadyLoggedAhead.expenses > 0">
                -{{ formatCurrency(trueCount.alreadyLoggedAhead.expenses) }} exp
              </template>
            </span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-slate-400">Expenses (Before Loan):</span>
            <span class="font-semibold text-slate-100">{{ formatCurrency(trueCount.forecast.before.expenses) }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="font-bold text-slate-200">Net (Before Loan):</span>
            <span
              class="font-bold"
              :class="trueCount.forecast.before.net >= 0 ? 'text-emerald-400' : 'text-rose-400'"
            >
              {{ formatCurrency(trueCount.forecast.before.net) }}
            </span>
          </div>

          <!-- Forecast After Loan -->
          <div class="pt-2 border-t border-slate-600 space-y-1">
            <div class="flex justify-between text-xs">
              <span class="text-indigo-300 font-semibold">After Loan (ahead only):</span>
              <span class="text-slate-300">Exp: {{ formatCurrency(trueCount.forecast.after.expenses) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="font-bold text-indigo-300">Net (After Loan):</span>
              <span
                class="font-bold text-base"
                :class="trueCount.forecast.after.net >= 0 ? 'text-emerald-400' : 'text-rose-400'"
              >
                {{ formatCurrency(trueCount.forecast.after.net) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Column 3: Difference from schedule -->
        <div class="p-4 rounded-xl bg-slate-700/50 border border-slate-600 space-y-2.5">
          <div class="flex items-center justify-between border-b border-slate-600 pb-2">
            <span class="text-xs font-bold uppercase tracking-wider text-amber-300">Difference from schedule</span>
            <span class="text-xs text-slate-400">Forecast vs. Plan</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-slate-400">Income difference:</span>
            <span
              class="font-semibold"
              :class="trueCount.differenceFromSchedule.income >= 0 ? 'text-emerald-400' : 'text-rose-400'"
            >
              {{ formatSignedCurrency(trueCount.differenceFromSchedule.income) }}
            </span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-slate-400">Expenses difference:</span>
            <span
              class="font-semibold"
              :class="trueCount.differenceFromSchedule.expenses <= 0 ? 'text-emerald-400' : 'text-rose-400'"
            >
              {{ formatSignedCurrency(trueCount.differenceFromSchedule.expenses) }}
            </span>
          </div>
          <div class="flex justify-between text-sm pt-2 border-t border-slate-600">
            <span class="font-bold text-slate-200">Net difference:</span>
            <span
              class="font-bold text-base"
              :class="trueCount.differenceFromSchedule.net >= 0 ? 'text-emerald-400' : 'text-rose-400'"
            >
              {{ formatSignedCurrency(trueCount.differenceFromSchedule.net) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Items to Check -->
      <div class="p-4 rounded-xl bg-slate-900/40 border border-slate-700">
        <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Items to Check ({{ trueCount.itemsToCheck.length }})
        </h3>
        <div v-if="trueCount.itemsToCheck.length === 0" class="text-sm text-emerald-400">
          All bills and scheduled paychecks up to today match your logged transactions.
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="item in trueCount.itemsToCheck"
            :key="item.id"
            class="flex items-center justify-between p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-xs sm:text-sm"
          >
            <div class="flex items-center gap-2 flex-wrap min-w-0 flex-1">
              <span class="font-semibold text-slate-100 capitalize">{{ item.name }}</span>
              <span
                class="text-xs px-2 py-0.5 rounded-full border font-medium"
                :class="item.type === 'bill_paid_unlogged'
                  ? 'bg-amber-950/60 border-amber-600/50 text-amber-300'
                  : (item.type === 'bill_unpaid'
                    ? 'bg-rose-950/60 border-rose-600/50 text-rose-300'
                    : 'bg-cyan-950/60 border-cyan-600/50 text-cyan-300')"
              >
                {{ item.label }}
              </span>
              <span class="text-xs text-slate-400">{{ formatShortDate(item.date) }}</span>
            </div>
            <span class="font-semibold text-slate-200 shrink-0 ml-3">{{ formatCurrency(item.amount) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  trueCount: {
    type: Object,
    required: true
  },
  selectedMonth: {
    type: String,
    default: ''
  }
})

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

function formatSignedCurrency(amount) {
  const num = Number(amount) || 0
  const prefix = num > 0 ? '+' : ''
  return `${prefix}${formatCurrency(num)}`
}

function formatShortDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  if (!y || !m || !d) return dateStr
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(y, m - 1, d))
}

function formatMonthLabel(ym) {
  if (!ym || typeof ym !== 'string' || ym.length < 7) return ''
  const [y, m] = ym.slice(0, 7).split('-').map(Number)
  if (!y || !m) return ym
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(y, m - 1, 1))
}
</script>

