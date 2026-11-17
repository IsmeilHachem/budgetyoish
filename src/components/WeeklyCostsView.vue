<template>
  <div class="space-y-5">

    <!-- What-If Loan Payoff Controls -->
    <div class="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 border-l-4 border-l-indigo-500 overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-700 flex items-baseline justify-between flex-wrap gap-2">
        <div>
          <h2 class="text-lg font-bold text-slate-100">What-If Loan Payoff Simulator</h2>
          <p class="text-sm text-slate-400 mt-0.5">
            Check any bills below to treat them as paid off by a loan, and set a monthly loan payment and due day to compare Before vs. After
          </p>
        </div>
        <button
          v-if="paidOffBillIds.size > 0 || numericLoanPayment > 0"
          type="button"
          @click="resetSimulation"
          class="px-3 py-1 text-xs font-semibold text-slate-300 bg-slate-700 border border-slate-600 rounded-lg hover:bg-slate-600 transition-colors"
        >
          Reset What-If
        </button>
      </div>

      <div class="p-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <!-- Monthly Loan Payment Input -->
          <div>
            <label for="monthly-loan-input" class="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              Monthly Loan Payment
            </label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-semibold pointer-events-none">$</span>
              <input
                id="monthly-loan-input"
                v-model.number="monthlyLoanPayment"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                class="w-full pl-8 pr-4 py-2.5 border border-slate-600 rounded-xl bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              />
            </div>
          </div>

          <!-- Payment Day of the Month Input -->
          <div>
            <label for="loan-day-input" class="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              Payment Day of the Month (1–31)
            </label>
            <input
              id="loan-day-input"
              v-model.number="loanPaymentDay"
              type="number"
              min="1"
              max="31"
              step="1"
              placeholder="1"
              class="w-full px-4 py-2.5 border border-slate-600 rounded-xl bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
            />
          </div>

          <!-- Checked Bills Summary -->
          <div class="p-4 rounded-xl bg-slate-700/50 border border-slate-600 space-y-1">
            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-400">Bills checked to pay off:</span>
              <span class="font-bold text-slate-100">
                {{ paidOffBillIds.size }} ({{ formatCurrency(plan.monthlySummary.after.paidOffBillsTotal) }}/mo)
              </span>
            </div>
            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-400">Simulated loan payment:</span>
              <span class="font-bold text-indigo-300">
                {{ formatCurrency(numericLoanPayment) }}/mo
                <span v-if="plan.monthlySummary.loanPaymentDate" class="text-slate-400 font-normal">
                  (Due {{ formatShortDate(plan.monthlySummary.loanPaymentDate) }})
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Payoff Helper Section -->
    <PayoffHelperSection
      :debts="debtPlanStore.debts"
      :active-bills="activeBillsForMonth"
      :bill-month-status="billsStore.billMonthStatus"
      :selected-month="selectedMonth"
      :paid-off-bill-ids="paidOffBillIds"
      :monthly-loan-payment="monthlyLoanPayment"
      @set-bills-paid-off="handleSetBillsPaidOff"
    />

    <!-- Monthly Summary Card (Calendar Month: Before vs. After) -->
    <div class="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 border-l-4 border-l-rose-500 overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-700">
        <div class="flex items-baseline justify-between flex-wrap gap-2">
          <h2 class="text-lg font-bold text-slate-100">
            Monthly Summary ({{ formatMonthLabel(selectedMonth) }})
          </h2>
          <span class="text-xs text-slate-400">
            Calendar month: {{ plan.monthlySummary.startDate }} to {{ plan.monthlySummary.endDate }}
          </span>
        </div>
        <p class="text-xs text-slate-400 mt-1 italic">
          Note: Pay weeks at the edges of the month can include days from the neighboring month, so week totals won’t add up exactly to the monthly summary.
        </p>
      </div>

      <div class="p-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Monthly Before -->
          <div class="p-4 rounded-xl bg-slate-700/50 border border-slate-600 space-y-2.5">
            <div class="flex items-center justify-between border-b border-slate-600 pb-2">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-300">Before Loan</span>
              <span class="text-xs text-slate-400">Current schedule</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-slate-400">Total Income:</span>
              <span class="font-semibold text-emerald-400">{{ formatCurrency(plan.monthlySummary.incomeTotal) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-slate-400">Total Bills:</span>
              <span class="font-semibold text-slate-100">{{ formatCurrency(plan.monthlySummary.before.billsTotal) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-slate-400">Left After Bills:</span>
              <span class="font-semibold" :class="plan.monthlySummary.before.leftAfterBills >= 0 ? 'text-emerald-400' : 'text-rose-400'">
                {{ formatCurrency(plan.monthlySummary.before.leftAfterBills) }}
              </span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-slate-400">Extra Spending (logged so far):</span>
              <span class="font-semibold text-slate-200">{{ formatCurrency(plan.monthlySummary.extraSpendingTotal) }}</span>
            </div>
            <div class="flex justify-between text-sm pt-2 border-t border-slate-600">
              <span class="font-bold text-slate-200">What’s Left:</span>
              <span class="font-bold text-base" :class="plan.monthlySummary.before.leftAfterSpending >= 0 ? 'text-emerald-400' : 'text-rose-400'">
                {{ formatCurrency(plan.monthlySummary.before.leftAfterSpending) }}
              </span>
            </div>
          </div>

          <!-- Monthly After -->
          <div class="p-4 rounded-xl bg-indigo-950/25 border border-indigo-500/40 space-y-2.5">
            <div class="flex items-center justify-between border-b border-indigo-500/30 pb-2">
              <span class="text-xs font-bold uppercase tracking-wider text-indigo-300">After Loan</span>
              <span class="text-xs text-slate-400">Checked bills removed + loan added</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-slate-400">Total Income:</span>
              <span class="font-semibold text-emerald-400">{{ formatCurrency(plan.monthlySummary.incomeTotal) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-slate-400">
                Total Bills + Loan
                <span v-if="numericLoanPayment > 0" class="text-xs text-indigo-300">
                  ({{ formatCurrency(plan.monthlySummary.after.uncheckedBillsTotal) }} + {{ formatCurrency(numericLoanPayment) }} loan)
                </span>:
              </span>
              <span class="font-semibold text-slate-100">{{ formatCurrency(plan.monthlySummary.after.billsPlusLoanTotal) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-slate-400">Left After Bills &amp; Loan:</span>
              <span class="font-semibold" :class="plan.monthlySummary.after.leftAfterBills >= 0 ? 'text-emerald-400' : 'text-rose-400'">
                {{ formatCurrency(plan.monthlySummary.after.leftAfterBills) }}
              </span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-slate-400">Extra Spending (logged so far):</span>
              <span class="font-semibold text-slate-200">{{ formatCurrency(plan.monthlySummary.extraSpendingTotal) }}</span>
            </div>
            <div class="flex justify-between text-sm pt-2 border-t border-indigo-500/30">
              <span class="font-bold text-slate-200">What’s Left:</span>
              <span class="font-bold text-base" :class="plan.monthlySummary.after.leftAfterSpending >= 0 ? 'text-emerald-400' : 'text-rose-400'">
                {{ formatCurrency(plan.monthlySummary.after.leftAfterSpending) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pay Weeks Section (Friday through Thursday) -->
    <div class="space-y-4">
      <div class="flex items-baseline justify-between flex-wrap gap-2 px-1">
        <h2 class="text-xl font-bold text-slate-100">
          Pay Weeks (Friday – Thursday)
        </h2>
        <span class="text-xs text-slate-400">
          {{ plan.payWeeks.length }} pay week{{ plan.payWeeks.length === 1 ? '' : 's' }} covering {{ formatMonthLabel(selectedMonth) }}
        </span>
      </div>

      <div v-if="recurringIncomeStore.getSources.length === 0" class="bg-slate-800 rounded-xl p-4 border border-slate-700 text-sm text-slate-400">
        No recurring income schedules set up yet. Add your pay schedule on the Transactions page so paychecks appear in each pay week.
      </div>

      <div
        v-for="week in plan.payWeeks"
        :key="week.startDate"
        class="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 border-l-4 border-l-emerald-500 overflow-hidden"
      >
        <!-- Week Header -->
        <div class="px-6 py-4 border-b border-slate-700 flex items-center justify-between flex-wrap gap-2">
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="text-lg font-bold text-slate-100">
                Pay Week {{ week.weekIndex }}: {{ formatWeekRange(week.startDate, week.endDate) }}
              </h3>
              <span
                v-if="week.isLoggedSoFar"
                class="text-xs px-2 py-0.5 rounded-full bg-amber-950/60 border border-amber-700/60 text-amber-300 font-medium"
              >
                logged so far
              </span>
            </div>
            <p class="text-xs text-slate-400 mt-0.5">
              Pay date: Fri {{ formatShortDate(week.startDate) }} · Covers {{ week.startDate }} through {{ week.endDate }}
            </p>
          </div>
          <div class="text-right">
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-700/60 text-emerald-300">
              Income: {{ formatCurrency(week.incomeTotal) }}
            </span>
          </div>
        </div>

        <div class="p-4 space-y-4">
          <!-- 1. Paychecks Received That Week -->
          <div>
            <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Paycheck(s) Received This Week
            </h4>
            <div v-if="week.paychecks.length === 0" class="text-sm text-slate-400 py-1.5 px-3 rounded-xl bg-slate-900/40 border border-slate-700/60">
              No paycheck scheduled in this Friday–Thursday week ($0.00).
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="pay in week.paychecks"
                :key="pay.id"
                class="flex items-center justify-between p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/50"
              >
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-semibold text-slate-100">{{ pay.name }}</span>
                    <span class="text-xs px-2 py-0.5 bg-slate-700 border border-slate-600 text-slate-300 rounded-full">
                      {{ pay.category }}
                    </span>
                  </div>
                  <p class="text-xs text-slate-400 mt-0.5">{{ formatShortDate(pay.date) }}</p>
                </div>
                <p class="font-bold text-emerald-400 shrink-0 ml-4">{{ formatCurrency(pay.amount) }}</p>
              </div>
            </div>
          </div>

          <!-- 2. Bills Due That Week (with Pay off with loan checkboxes) -->
          <div>
            <div class="flex items-baseline justify-between mb-2">
              <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Bills Due This Week ({{ week.bills.length }})
              </h4>
              <span v-if="week.bills.length > 0" class="text-xs text-slate-400">
                Check a bill to pay it off with the loan
              </span>
            </div>

            <div v-if="week.bills.length === 0 && week.loanPaymentThisWeek <= 0" class="text-sm text-slate-400 py-1.5 px-3 rounded-xl bg-slate-900/40 border border-slate-700/60">
              No bills due during this pay week.
            </div>
            <div v-else class="space-y-2">
              <label
                v-for="bill in week.bills"
                :key="bill.id"
                class="flex items-start justify-between p-3.5 rounded-xl border transition-colors cursor-pointer select-none"
                :class="bill.isPaidOff
                  ? 'bg-slate-900/50 border-slate-700 opacity-75'
                  : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700/80'"
              >
                <div class="flex items-start gap-3 min-w-0 flex-1">
                  <input
                    type="checkbox"
                    :checked="bill.isPaidOff"
                    @change="toggleBillPaidOff(bill.billId)"
                    class="mt-1 w-4 h-4 rounded border-slate-500 text-indigo-600 bg-slate-900 focus:ring-indigo-500 shrink-0 cursor-pointer"
                  />
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span
                        class="font-semibold capitalize"
                        :class="bill.isPaidOff ? 'line-through text-slate-400' : 'text-slate-100'"
                      >
                        {{ bill.name }}
                      </span>
                      <span class="text-xs px-2 py-0.5 bg-slate-700 border border-slate-600 text-slate-400 rounded-full">
                        {{ bill.category }}
                      </span>
                      <span
                        v-if="bill.paid"
                        class="text-xs px-2 py-0.5 bg-green-900/40 border border-emerald-500/40 text-emerald-300 rounded-full font-medium"
                      >
                        Paid
                      </span>
                      <span
                        v-if="bill.isPaidOff"
                        class="text-xs px-2 py-0.5 bg-indigo-900/50 border border-indigo-500/50 text-indigo-300 rounded-full font-medium"
                      >
                        Paid off with loan
                      </span>
                    </div>
                    <p class="text-xs text-slate-400 mt-0.5">
                      Due {{ formatShortDate(bill.date) }}
                    </p>
                  </div>
                </div>
                <div class="text-right shrink-0 ml-4">
                  <p
                    class="font-bold"
                    :class="bill.isPaidOff ? 'line-through text-slate-500' : (bill.noAmount ? 'text-slate-400' : 'text-slate-100')"
                  >
                    {{ formatCurrency(bill.amount) }}
                  </p>
                  <p v-if="bill.noAmount" class="text-xs text-amber-400/90 italic">
                    no amount set
                  </p>
                </div>
              </label>

              <!-- Simulated Loan Payment row if it falls in this week -->
              <div
                v-if="week.loanPaymentThisWeek > 0"
                class="flex items-center justify-between p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/50"
              >
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-semibold text-indigo-200">Simulated Loan Payment</span>
                    <span class="text-xs px-2 py-0.5 bg-indigo-900/60 border border-indigo-500/50 text-indigo-300 rounded-full">
                      After Loan Only
                    </span>
                  </div>
                  <p v-if="week.loanPaymentDate" class="text-xs text-indigo-300/80 mt-0.5">
                    Due {{ formatShortDate(week.loanPaymentDate) }}
                  </p>
                </div>
                <p class="font-bold text-indigo-300 shrink-0 ml-4">
                  {{ formatCurrency(week.loanPaymentThisWeek) }}
                </p>
              </div>
            </div>
          </div>

          <!-- 3. Before vs. After Side-by-Side Comparison for the Week -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <!-- Before Column -->
            <div class="p-4 rounded-xl bg-slate-700/50 border border-slate-600 space-y-2">
              <div class="flex items-center justify-between border-b border-slate-600 pb-1.5">
                <span class="text-xs font-bold uppercase tracking-wider text-slate-300">Before Loan</span>
                <span class="text-xs text-slate-400">Week {{ week.weekIndex }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-slate-400">Bills Due Total:</span>
                <span class="font-semibold text-slate-100">{{ formatCurrency(week.before.billsTotal) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-slate-400">What’s Left After Bills:</span>
                <span class="font-semibold" :class="week.before.leftAfterBills >= 0 ? 'text-emerald-400' : 'text-rose-400'">
                  {{ formatCurrency(week.before.leftAfterBills) }}
                </span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-slate-400">
                  Extra Spending<span v-if="week.isLoggedSoFar"> (logged so far)</span>:
                </span>
                <span class="font-semibold text-slate-200">{{ formatCurrency(week.extraSpending) }}</span>
              </div>
              <div class="flex justify-between text-sm pt-1.5 border-t border-slate-600">
                <span class="font-bold text-slate-200">Left After Extra Spending:</span>
                <span class="font-bold" :class="week.before.leftAfterSpending >= 0 ? 'text-emerald-400' : 'text-rose-400'">
                  {{ formatCurrency(week.before.leftAfterSpending) }}
                </span>
              </div>
            </div>

            <!-- After Column -->
            <div class="p-4 rounded-xl bg-indigo-950/25 border border-indigo-500/40 space-y-2">
              <div class="flex items-center justify-between border-b border-indigo-500/30 pb-1.5">
                <span class="text-xs font-bold uppercase tracking-wider text-indigo-300">After Loan</span>
                <span class="text-xs text-slate-400">Week {{ week.weekIndex }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-slate-400">
                  Bills + Loan Total
                  <span v-if="week.loanPaymentThisWeek > 0" class="text-xs text-indigo-300">
                    (incl. {{ formatCurrency(week.loanPaymentThisWeek) }} loan)
                  </span>:
                </span>
                <span class="font-semibold text-slate-100">{{ formatCurrency(week.after.billsPlusLoanTotal) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-slate-400">What’s Left After Bills:</span>
                <span class="font-semibold" :class="week.after.leftAfterBills >= 0 ? 'text-emerald-400' : 'text-rose-400'">
                  {{ formatCurrency(week.after.leftAfterBills) }}
                </span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-slate-400">
                  Extra Spending<span v-if="week.isLoggedSoFar"> (logged so far)</span>:
                </span>
                <span class="font-semibold text-slate-200">{{ formatCurrency(week.extraSpending) }}</span>
              </div>
              <div class="flex justify-between text-sm pt-1.5 border-t border-indigo-500/30">
                <span class="font-bold text-slate-200">Left After Extra Spending:</span>
                <span class="font-bold" :class="week.after.leftAfterSpending >= 0 ? 'text-emerald-400' : 'text-rose-400'">
                  {{ formatCurrency(week.after.leftAfterSpending) }}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- Extra Spending by Category (This Month) -->
    <div class="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 border-l-4 border-l-amber-500 overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-700">
        <div class="flex items-baseline justify-between flex-wrap gap-2">
          <h2 class="text-lg font-bold text-slate-100">Extra Spending by Category (This Month)</h2>
          <span class="text-xs text-slate-400">
            {{ spendingData.startDateStr }} to {{ spendingData.endDateStr }}
          </span>
        </div>
        <p class="text-sm text-slate-400 mt-0.5">
          Total extra spending this month: {{ formatCurrency(spendingData.totalExtraSpending) }}
        </p>
        <p class="text-xs text-slate-400 mt-1 italic">
          Note: Recurring bills and categories that contain bills are excluded so they aren’t counted twice.
        </p>
      </div>

      <div class="p-4">
        <div v-if="spendingData.categories.length === 0" class="text-sm text-slate-400 py-2">
          No logged non-bill extra spending transactions found for this month.
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="cat in spendingData.categories"
            :key="cat.name"
            class="flex items-start justify-between p-4 rounded-xl border transition-colors"
            :class="cat.isHighest
              ? 'bg-rose-950/30 border-rose-500/60 border-l-4 border-l-rose-500'
              : 'bg-slate-700/50 border-slate-600'"
          >
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-semibold text-slate-100">{{ cat.name }}</span>
                <span
                  v-if="cat.isHighest"
                  class="text-xs px-2 py-0.5 bg-rose-900/60 border border-rose-500/50 text-rose-300 rounded-full font-semibold"
                >
                  Highest Extra Spending
                </span>
              </div>
              <p class="text-xs text-slate-400 mt-0.5">
                {{ cat.transactionCount }} transaction{{ cat.transactionCount === 1 ? '' : 's' }} this month
              </p>
            </div>
            <div class="text-right shrink-0 ml-4">
              <p class="font-bold" :class="cat.isHighest ? 'text-rose-300' : 'text-slate-100'">
                {{ formatCurrency(cat.total) }}
              </p>
            </div>
          </div>

          <p class="text-sm text-slate-500 italic pt-2 border-t border-slate-700">
            Extra spending totals {{ formatCurrency(spendingData.totalExtraSpending) }} for {{ formatMonthLabel(selectedMonth) }}
          </p>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useBillsStore } from '@/stores/bills'
import { useTransactionsStore } from '@/stores/transactions'
import { useRecurringIncomeStore } from '@/stores/recurringIncome'
import { useDebtPlanStore } from '@/stores/debtPlan'
import PayoffHelperSection from '@/components/PayoffHelperSection.vue'
import {
  buildMonthlyPayWeekPlan,
  calculateMonthlyCategoryExtraSpending,
  getActiveBillsForMonth
} from '@/utils/weeklyCosts'

const props = defineProps({
  bills: {
    type: Array,
    default: () => []
  },
  selectedMonth: {
    type: String,
    default: ''
  }
})

const authStore = useAuthStore()
const billsStore = useBillsStore()
const transactionsStore = useTransactionsStore()
const recurringIncomeStore = useRecurringIncomeStore()
const debtPlanStore = useDebtPlanStore()

// Load transactionsStore, recurringIncomeStore, and debtPlanStore on mount if not initialized yet (read-only loading)
async function ensureStoresLoaded() {
  if (!authStore.isLoggedIn) return
  if (!transactionsStore.initialized) {
    await transactionsStore.initialize()
  }
  if (!recurringIncomeStore.initialized) {
    await recurringIncomeStore.initialize()
  }
  if (!debtPlanStore.initialized) {
    await debtPlanStore.initialize()
  }
}

onMounted(() => {
  ensureStoresLoaded()
})

watch(
  () => authStore.isLoggedIn,
  (loggedIn) => {
    if (loggedIn) {
      ensureStoresLoaded()
    }
  }
)

// Local-only What-If state (never saved to Supabase or localStorage)
const monthlyLoanPayment = ref('')
const loanPaymentDay = ref(1)
const paidOffBillIds = ref(new Set())

const numericLoanPayment = computed(() => {
  const n = Number(monthlyLoanPayment.value)
  return !isNaN(n) && n > 0 ? n : 0
})

function toggleBillPaidOff(billId) {
  const next = new Set(paidOffBillIds.value)
  if (next.has(billId)) {
    next.delete(billId)
  } else {
    next.add(billId)
  }
  paidOffBillIds.value = next
}

function handleSetBillsPaidOff({ billIds = [], checked = false }) {
  const next = new Set(paidOffBillIds.value)
  for (const id of billIds) {
    if (checked) {
      next.add(id)
    } else {
      next.delete(id)
    }
  }
  paidOffBillIds.value = next
}

function resetSimulation() {
  monthlyLoanPayment.value = ''
  loanPaymentDay.value = 1
  paidOffBillIds.value = new Set()
}

// Active bills for the selected month
const activeBillsForMonth = computed(() => {
  const fromStore = getActiveBillsForMonth(billsStore.getBills, props.selectedMonth)
  if (fromStore.length > 0) return fromStore
  return props.bills || []
})

const spendingData = computed(() =>
  calculateMonthlyCategoryExtraSpending(
    transactionsStore.getTransactions,
    activeBillsForMonth.value,
    props.selectedMonth
  )
)

const plan = computed(() =>
  buildMonthlyPayWeekPlan({
    selectedMonth: props.selectedMonth,
    rawBills: billsStore.getBills,
    billMonthStatus: billsStore.billMonthStatus,
    incomeSources: recurringIncomeStore.getSources,
    confirmedOccurrences: recurringIncomeStore.getConfirmedOccurrences,
    transactions: transactionsStore.getTransactions,
    paidOffBillIds: paidOffBillIds.value,
    monthlyLoanPayment: monthlyLoanPayment.value,
    loanPaymentDay: loanPaymentDay.value
  })
)

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

function formatShortDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  if (!y || !m || !d) return dateStr
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(y, m - 1, d))
}

function formatWeekRange(startStr, endStr) {
  if (!startStr || !endStr) return ''
  return `Fri, ${formatShortDate(startStr)} – Thu, ${formatShortDate(endStr)}`
}

function formatMonthLabel(ym) {
  if (!ym || typeof ym !== 'string' || ym.length < 7) return ''
  const [y, m] = ym.slice(0, 7).split('-').map(Number)
  if (!y || !m) return ym
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(y, m - 1, 1))
}
</script>
