<template>
  <div class="min-h-screen bg-slate-950">
    <div class="w-full px-4 md:px-6 lg:px-8 py-8 space-y-8">

      <!-- Section a: Header -->
      <div class="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 rounded-2xl shadow-xl p-8 border border-indigo-900">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div class="flex items-center space-x-4">
            <div class="w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg text-3xl shrink-0">
              🎯
            </div>
            <div>
              <h1 class="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Debt Plan
              </h1>
              <p class="text-slate-300 mt-1 text-sm sm:text-base">
                {{ debtPlanStore.goalLabel ? `Road to ${debtPlanStore.goalLabel}` : 'Map your payoff timeline and track your progress to debt freedom' }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2 self-start sm:self-center">
            <button
              type="button"
              @click="scrollToGoal"
              class="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5"
            >
              <span>⚙️</span>
              <span>{{ debtPlanStore.goalLabel ? debtPlanStore.goalLabel : 'Set Target Goal' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Section b: Key Numbers -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- 1. Total Debt (current) -->
        <div class="bg-slate-800 rounded-2xl shadow-lg p-5 border border-slate-700 border-l-4 border-l-red-500">
          <div class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Total Debt</div>
          <div class="text-xl sm:text-2xl font-bold text-red-400">{{ fmt(debtPlanStore.totalDebt) }}</div>
          <div class="text-xs text-slate-400 mt-1">{{ debtPlanStore.debts.length }} active {{ debtPlanStore.debts.length === 1 ? 'account' : 'accounts' }}</div>
        </div>

        <!-- 2. Debt-Free Date -->
        <div class="bg-slate-800 rounded-2xl shadow-lg p-5 border border-slate-700 border-l-4 border-l-indigo-500">
          <div class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Debt-Free Date</div>
          <div class="text-xl sm:text-2xl font-bold text-indigo-400">
            {{ debtPlanStore.result.debtFreeMonth ? formatMonth(debtPlanStore.result.debtFreeMonth) : 'Not within 10 years' }}
          </div>
          <div class="text-xs text-slate-400 mt-1">
            {{ debtPlanStore.strategy === STRATEGIES.avalanche ? 'Avalanche payoff' : 'Snowball payoff' }}
          </div>
        </div>

        <!-- 3. Savings at Goal Date (only shown if goal is set) -->
        <div
          v-if="debtPlanStore.goalMonth"
          class="bg-slate-800 rounded-2xl shadow-lg p-5 border border-slate-700 border-l-4 border-l-green-500"
        >
          <div class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Savings at Goal</div>
          <div class="text-xl sm:text-2xl font-bold text-green-400">
            {{ debtPlanStore.savingsAtGoal !== null ? fmt(debtPlanStore.savingsAtGoal) : '—' }}
          </div>
          <div class="text-xs text-slate-400 mt-1">
            {{ formatMonth(debtPlanStore.goalMonth) }} {{ debtPlanStore.goalLabel ? `(${debtPlanStore.goalLabel})` : '' }}
          </div>
        </div>

        <!-- 4. Total Interest Paid -->
        <div class="bg-slate-800 rounded-2xl shadow-lg p-5 border border-slate-700 border-l-4 border-l-amber-500">
          <div class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Total Interest Paid</div>
          <div class="text-xl sm:text-2xl font-bold text-amber-400">
            {{ fmt(debtPlanStore.result.totalInterest) }}
          </div>
          <div class="text-xs text-slate-400 mt-1">over entire plan</div>
        </div>
      </div>

      <!-- Section c: Chart (or Empty State) -->
      <div v-if="debtPlanStore.debts.length === 0" class="bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-700 text-center">
        <div class="w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
          🎯
        </div>
        <h3 class="text-xl font-bold text-white mb-2">No Debts Added Yet</h3>
        <p class="text-slate-400 max-w-md mx-auto mb-6 text-sm">
          Map your path to debt freedom! Add your credit cards or loans below to simulate your exact payoff timeline.
        </p>
        <button
          type="button"
          @click="handleAddDebt"
          class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-indigo-600/30 text-sm"
        >
          + Add your first debt
        </button>
      </div>

      <div v-else class="bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-700">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h2 class="text-xl font-bold text-slate-100">Payoff & Savings Projection</h2>
            </div>
          </div>
          <div v-if="debtPlanStore.goalMonth" class="text-xs text-purple-400 bg-purple-950/50 border border-purple-800/60 px-3 py-1.5 rounded-lg flex items-center gap-1.5 self-start sm:self-auto">
            <span>🏁</span>
            <span>Target Goal: <strong>{{ formatMonth(debtPlanStore.goalMonth) }}</strong></span>
          </div>
        </div>

        <div class="relative w-full" style="height: 380px;">
          <Line :data="chartData" :options="chartOptions" :plugins="chartPlugins" />
        </div>

        <div class="mt-4 p-3 bg-slate-700/40 rounded-xl text-xs sm:text-sm text-slate-300 flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-2">
            <span class="text-indigo-400 font-bold text-base">✦</span>
            <span>
              Peak debt: <strong>{{ fmt(debtPlanStore.result.peakDebt.total) }}</strong> in {{ formatMonth(debtPlanStore.result.peakDebt.month) }}
            </span>
          </div>
          <div v-if="debtPlanStore.result.debtFreeMonth" class="text-green-400 font-semibold">
            🎉 Debt-free by {{ formatMonth(debtPlanStore.result.debtFreeMonth) }}
          </div>
        </div>
      </div>

      <!-- Section d: Debts Table -->
      <div class="bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-700">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-gradient-to-r from-red-500 to-rose-600 rounded-lg flex items-center justify-center">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <h2 class="text-xl font-bold text-slate-100">Debts</h2>
              <p class="text-xs text-slate-400">Order reflects current payoff strategy</p>
            </div>
          </div>

          <!-- Strategy Toggle & Add Debt -->
          <div class="flex flex-wrap items-center gap-3">
            <div class="flex items-center p-1 bg-slate-900 rounded-xl border border-slate-700 text-xs">
              <button
                type="button"
                @click="handleSetStrategy(STRATEGIES.avalanche)"
                class="px-3 py-1.5 rounded-lg font-medium transition-all"
                :class="debtPlanStore.strategy === STRATEGIES.avalanche ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'"
              >
                ⚡ Avalanche (highest APR first)
              </button>
              <button
                type="button"
                @click="handleSetStrategy(STRATEGIES.snowball)"
                class="px-3 py-1.5 rounded-lg font-medium transition-all"
                :class="debtPlanStore.strategy === STRATEGIES.snowball ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'"
              >
                ⛄ Snowball (smallest balance first)
              </button>
            </div>

            <button
              type="button"
              @click="handleAddDebt"
              class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 shadow-md shadow-indigo-600/20"
            >
              <span>+</span>
              <span>Add Debt</span>
            </button>
          </div>
        </div>

        <div v-if="debtPlanStore.debts.length === 0" class="text-center py-8 text-slate-400 text-sm">
          No debts listed. Click "Add Debt" above to get started.
        </div>

        <!-- Debts table with horizontal scrolling container for small screens -->
        <div
          v-else
          ref="tableContainerRef"
          class="overflow-x-auto"
          @focusin="onTableFocusIn"
          @focusout="onTableFocusOut"
        >
          <table class="w-full text-left text-sm border-collapse min-w-[760px]">
            <thead>
              <tr class="border-b border-slate-700 text-xs text-slate-400 uppercase tracking-wider">
                <th class="py-3 px-2 w-10 text-center">#</th>
                <th class="py-3 px-3">Name</th>
                <th class="py-3 px-3 w-36">Type</th>
                <th class="py-3 px-3 w-32">Balance</th>
                <th class="py-3 px-3 w-28">APR %</th>
                <th class="py-3 px-3 w-28">Min Payment</th>
                <th class="py-3 px-3 w-36">Paid Off By</th>
                <th class="py-3 px-3 w-24 text-center">Shortfall Card</th>
                <th class="py-3 px-2 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-700/60">
              <tr
                v-for="(debt, index) in sortedDebts"
                :key="debt.id"
                class="hover:bg-slate-700/30 transition-colors group"
              >
                <!-- Payoff order number -->
                <td class="py-3 px-2 text-center font-bold text-xs text-slate-500">
                  {{ index + 1 }}
                </td>

                <!-- Name & Progress bar -->
                <td class="py-3 px-3">
                  <input
                    type="text"
                    :value="debt.name"
                    @input="debtPlanStore.updateDebt(debt.id, { name: $event.target.value })"
                    @keydown.enter="handleEnter"
                    class="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-lg px-2.5 py-1 text-slate-200 text-sm focus:outline-none"
                    placeholder="Debt name"
                  />
                  <!-- Thin progress bar comparing balance now vs first simulated month balance -->
                  <div class="w-full bg-slate-700/50 rounded-full h-1.5 mt-1.5 overflow-hidden" title="Month 1 progress">
                    <div
                      class="h-full rounded-full transition-all duration-300"
                      :style="getDebtProgressStyle(debt)"
                    ></div>
                  </div>
                </td>

                <!-- Type Selector -->
                <td class="py-3 px-3">
                  <select
                    :value="debt.type || getInferredDebtType(debt)"
                    @change="debtPlanStore.updateDebt(debt.id, { type: $event.target.value })"
                    class="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="Credit Card">💳 Credit Card</option>
                    <option value="Personal Loan">🏦 Personal Loan</option>
                    <option value="Student Loan">🎓 Student Loan</option>
                    <option value="Auto Loan">🚗 Auto Loan</option>
                    <option value="Medical">🏥 Medical</option>
                    <option value="Other">📋 Other</option>
                  </select>
                </td>

                <!-- Balance -->
                <td class="py-3 px-3">
                  <div class="relative">
                    <span class="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 text-xs">$</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      :value="debt.balance"
                      @input="debtPlanStore.updateDebt(debt.id, { balance: $event.target.value })"
                      @keydown.enter="handleEnter"
                      class="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-lg pl-6 pr-2 py-1 text-slate-200 text-sm focus:outline-none"
                    />
                  </div>
                </td>

                <!-- APR % -->
                <td class="py-3 px-3">
                  <div class="relative">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max="100"
                      :value="debt.apr"
                      @input="debtPlanStore.updateDebt(debt.id, { apr: $event.target.value })"
                      @keydown.enter="handleEnter"
                      class="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-lg px-2.5 pr-6 py-1 text-slate-200 text-sm focus:outline-none"
                    />
                    <span class="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 text-xs">%</span>
                  </div>
                </td>

                <!-- Min Payment -->
                <td class="py-3 px-3">
                  <div class="relative">
                    <span class="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 text-xs">$</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      :value="debt.minPayment"
                      @input="debtPlanStore.updateDebt(debt.id, { minPayment: $event.target.value })"
                      @keydown.enter="handleEnter"
                      class="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-lg pl-6 pr-2 py-1 text-slate-200 text-sm focus:outline-none"
                    />
                  </div>
                </td>

                <!-- Paid off by date -->
                <td class="py-3 px-3">
                  <span
                    v-if="debtPlanStore.result.payoffMonth[debt.id]"
                    class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-green-950/60 border border-green-800 text-green-300"
                  >
                    ✓ {{ formatMonth(debtPlanStore.result.payoffMonth[debt.id]) }}
                  </span>
                  <span v-else class="text-xs text-slate-500 italic">
                    10+ years
                  </span>
                </td>

                <!-- Shortfall card radio -->
                <td class="py-3 px-3 text-center">
                  <input
                    type="radio"
                    name="shortfallDebtId"
                    :checked="debtPlanStore.shortfallDebtId === debt.id"
                    @change="debtPlanStore.setShortfallDebtId(debt.id)"
                    class="h-4 w-4 text-indigo-600 bg-slate-900 border-slate-700 focus:ring-indigo-500 cursor-pointer"
                    title="Choose this card to absorb monthly cash shortfalls"
                  />
                </td>

                <!-- Delete button -->
                <td class="py-3 px-2 text-center">
                  <button
                    type="button"
                    @click="handleRemoveDebt(debt.id)"
                    class="text-slate-500 hover:text-red-400 p-1 transition-colors rounded"
                    title="Remove debt"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Section e: Income and Expenses side-by-side -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Monthly Take-Home Income Card -->
        <div class="bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-700 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h2 class="text-xl font-bold text-slate-100">Take-Home Income</h2>
                  <p class="text-xs text-slate-400">Monthly sources (toggle to test what-ifs)</p>
                </div>
              </div>
              <button
                type="button"
                @click="debtPlanStore.addIncome({ label: 'Income Source', amount: 3000, start: '', end: '', enabled: true })"
                class="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 shadow-md shadow-green-600/20"
              >
                <span>+</span>
                <span>Add Income</span>
              </button>
            </div>

            <div v-if="debtPlanStore.income.length === 0" class="text-center py-6 text-slate-500 text-xs">
              No income sources added. Click "Add Income" to add one.
            </div>

            <div v-else class="space-y-3">
              <div
                v-for="item in debtPlanStore.income"
                :key="item.id"
                class="p-3 bg-slate-900/70 border border-slate-700/80 rounded-xl transition-all"
                :class="{ 'opacity-40 grayscale': item.enabled === false }"
              >
                <div class="flex items-center justify-between gap-2 mb-2">
                  <div class="flex items-center gap-2 flex-1">
                    <!-- Toggle switch -->
                    <button
                      type="button"
                      @click="debtPlanStore.toggleLine('income', item.id)"
                      class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                      :class="item.enabled !== false ? 'bg-green-600' : 'bg-slate-700'"
                      :title="item.enabled !== false ? 'Active in simulation' : 'Toggled off (what-if)'"
                    >
                      <span
                        class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                        :class="item.enabled !== false ? 'translate-x-4' : 'translate-x-0'"
                      ></span>
                    </button>
                    <input
                      type="text"
                      :value="item.label"
                      @input="debtPlanStore.updateIncome(item.id, { label: $event.target.value })"
                      class="w-full bg-slate-800 border border-slate-700 focus:border-green-500 rounded-lg px-2.5 py-1 text-slate-200 text-sm focus:outline-none placeholder-slate-500"
                      placeholder="Income source name"
                    />
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="relative w-28">
                      <span class="absolute inset-y-0 left-0 pl-2 flex items-center text-slate-400 text-xs">$</span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        :value="item.amount"
                        @input="debtPlanStore.updateIncome(item.id, { amount: $event.target.value })"
                        class="w-full bg-slate-800 border border-slate-700 rounded-lg pl-5 pr-2 py-1 text-slate-200 text-sm focus:outline-none text-right font-medium"
                      />
                    </div>
                    <button
                      type="button"
                      @click="debtPlanStore.removeIncome(item.id)"
                      class="text-slate-500 hover:text-red-400 p-1 text-xs"
                      title="Remove line"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <!-- Date bounds -->
                <div class="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label class="block text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Start Month (optional)</label>
                    <input
                      type="month"
                      :value="item.start || ''"
                      @input="debtPlanStore.updateIncome(item.id, { start: $event.target.value })"
                      class="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-300 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label class="block text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">End Month (optional)</label>
                    <input
                      type="month"
                      :value="item.end || ''"
                      @input="debtPlanStore.updateIncome(item.id, { end: $event.target.value })"
                      class="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-300 text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Monthly Non-Debt Expenses Card -->
        <div class="bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-700 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-gradient-to-r from-red-500 to-rose-600 rounded-lg flex items-center justify-center">
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                  </svg>
                </div>
                <div>
                  <h2 class="text-xl font-bold text-slate-100">Living Expenses</h2>
                  <p class="text-xs text-slate-400">Non-debt monthly costs (toggle to test what-ifs)</p>
                </div>
              </div>
              <button
                type="button"
                @click="debtPlanStore.addExpense({ label: 'Living Costs', amount: 1500, start: '', end: '', enabled: true })"
                class="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 shadow-md shadow-red-600/20"
              >
                <span>+</span>
                <span>Add Expense</span>
              </button>
            </div>

            <div v-if="debtPlanStore.expenses.length === 0" class="text-center py-6 text-slate-500 text-xs">
              No living expenses added. Click "Add Expense" to add one.
            </div>

            <div v-else class="space-y-3">
              <div
                v-for="item in debtPlanStore.expenses"
                :key="item.id"
                class="p-3 bg-slate-900/70 border border-slate-700/80 rounded-xl transition-all"
                :class="{ 'opacity-40 grayscale': item.enabled === false }"
              >
                <div class="flex items-center justify-between gap-2 mb-2">
                  <div class="flex items-center gap-2 flex-1">
                    <!-- Toggle switch -->
                    <button
                      type="button"
                      @click="debtPlanStore.toggleLine('expense', item.id)"
                      class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                      :class="item.enabled !== false ? 'bg-red-600' : 'bg-slate-700'"
                      :title="item.enabled !== false ? 'Active in simulation' : 'Toggled off (what-if)'"
                    >
                      <span
                        class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                        :class="item.enabled !== false ? 'translate-x-4' : 'translate-x-0'"
                      ></span>
                    </button>
                    <input
                      type="text"
                      :value="item.label"
                      @input="debtPlanStore.updateExpense(item.id, { label: $event.target.value })"
                      class="w-full bg-slate-800 border border-slate-700 focus:border-red-500 rounded-lg px-2.5 py-1 text-slate-200 text-sm focus:outline-none placeholder-slate-500"
                      placeholder="Expense category / name"
                    />
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="relative w-28">
                      <span class="absolute inset-y-0 left-0 pl-2 flex items-center text-slate-400 text-xs">$</span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        :value="item.amount"
                        @input="debtPlanStore.updateExpense(item.id, { amount: $event.target.value })"
                        class="w-full bg-slate-800 border border-slate-700 rounded-lg pl-5 pr-2 py-1 text-slate-200 text-sm focus:outline-none text-right font-medium"
                      />
                    </div>
                    <button
                      type="button"
                      @click="debtPlanStore.removeExpense(item.id)"
                      class="text-slate-500 hover:text-red-400 p-1 text-xs"
                      title="Remove line"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <!-- Date bounds -->
                <div class="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label class="block text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Start Month (optional)</label>
                    <input
                      type="month"
                      :value="item.start || ''"
                      @input="debtPlanStore.updateExpense(item.id, { start: $event.target.value })"
                      class="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-300 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label class="block text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">End Month (optional)</label>
                    <input
                      type="month"
                      :value="item.end || ''"
                      @input="debtPlanStore.updateExpense(item.id, { end: $event.target.value })"
                      class="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-300 text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Section g: Goal Settings Card -->
      <div id="goal-settings" class="bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-700">
        <div class="flex items-center space-x-3 mb-4">
          <div class="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
            🎯
          </div>
          <div>
            <h2 class="text-xl font-bold text-slate-100">Target Goal Settings</h2>
            <p class="text-xs text-slate-400">Set a milestone or target move date to see accumulated savings</p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
          <div>
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Goal Label</label>
            <input
              type="text"
              :value="debtPlanStore.goalLabel"
              @input="debtPlanStore.setGoal($event.target.value, debtPlanStore.goalMonth)"
              placeholder="e.g. Debt Free 2028"
              class="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-slate-200 text-sm focus:outline-none"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Goal Month</label>
            <input
              type="month"
              :value="debtPlanStore.goalMonth"
              @input="debtPlanStore.setGoal(debtPlanStore.goalLabel, $event.target.value)"
              class="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-slate-200 text-sm focus:outline-none"
            />
          </div>
        </div>
      </div>

      <!-- Section f: Monthly Table (collapsible, closed by default) -->
      <div class="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 overflow-hidden">
        <button
          type="button"
          @click="showMonthlyTable = !showMonthlyTable"
          class="w-full p-6 flex items-center justify-between text-left hover:bg-slate-750 transition-colors"
        >
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center text-slate-300 text-sm font-bold">
              📅
            </div>
            <div>
              <h2 class="text-xl font-bold text-slate-100">Monthly Simulation Table</h2>
              <p class="text-xs text-slate-400">Month-by-month cashflow, interest, shortfall and payoff progression</p>
            </div>
          </div>
          <div class="flex items-center gap-2 text-slate-400 text-sm font-medium">
            <span>{{ showMonthlyTable ? 'Hide Table' : 'Show Table' }}</span>
            <span class="transform transition-transform text-xs" :class="{ 'rotate-180': showMonthlyTable }">▼</span>
          </div>
        </button>

        <div v-show="showMonthlyTable" class="p-6 pt-0 border-t border-slate-700/60">
          <div class="overflow-x-auto max-h-[480px] overflow-y-auto mt-4 rounded-xl border border-slate-700">
            <table class="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead class="sticky top-0 bg-slate-900 z-10">
                <tr class="border-b border-slate-700 text-slate-400 uppercase tracking-wider">
                  <th class="py-2.5 px-3">Month</th>
                  <th class="py-2.5 px-3 text-right">Income</th>
                  <th class="py-2.5 px-3 text-right">Expenses</th>
                  <th class="py-2.5 px-3 text-right">Interest</th>
                  <th class="py-2.5 px-3 text-right">Shortfall</th>
                  <th class="py-2.5 px-3 text-right">Extra Paid</th>
                  <th class="py-2.5 px-3 text-right">Total Debt</th>
                  <th class="py-2.5 px-3 text-right">Savings</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-700/50 bg-slate-800/40">
                <tr
                  v-for="row in debtPlanStore.result.rows"
                  :key="row.month"
                  class="hover:bg-slate-700/30 transition-colors"
                  :class="{ 'bg-purple-950/20': row.month === debtPlanStore.goalMonth, 'bg-green-950/20': row.month === debtPlanStore.result.debtFreeMonth }"
                >
                  <td class="py-2 px-3 font-medium text-slate-300">
                    {{ formatMonth(row.month) }}
                    <span v-if="row.month === debtPlanStore.result.debtFreeMonth" class="ml-1 text-[10px] text-green-400 font-bold uppercase">Debt Free</span>
                    <span v-if="row.month === debtPlanStore.goalMonth" class="ml-1 text-[10px] text-purple-400 font-bold uppercase">Goal</span>
                  </td>
                  <td class="py-2 px-3 text-right text-slate-300">{{ fmt(row.income) }}</td>
                  <td class="py-2 px-3 text-right text-slate-300">{{ fmt(row.expenses) }}</td>
                  <td class="py-2 px-3 text-right text-slate-400">{{ fmt(row.interest) }}</td>
                  <td class="py-2 px-3 text-right" :class="row.shortfall > 0 ? 'text-red-400 font-semibold' : 'text-slate-500'">
                    {{ row.shortfall > 0 ? fmt(row.shortfall) : '$0' }}
                  </td>
                  <td class="py-2 px-3 text-right text-slate-300">{{ fmt(row.extraPaid) }}</td>
                  <td class="py-2 px-3 text-right font-medium" :class="row.totalDebt > 0 ? 'text-red-400' : 'text-slate-500'">
                    {{ fmt(row.totalDebt) }}
                  </td>
                  <td class="py-2 px-3 text-right font-medium" :class="row.savings > 0 ? 'text-green-400' : 'text-slate-500'">
                    {{ fmt(row.savings) }}
                  </td>
                </tr>
              </tbody>
            </table>
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
import { useDebtPlanStore } from '@/stores/debtPlan'
import { useAuthStore } from '@/stores/auth'
import { STRATEGIES } from '@/utils/debtPayoff'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const debtPlanStore = useDebtPlanStore()
const authStore = useAuthStore()

// State
const showMonthlyTable = ref(false)

function scrollToGoal() {
  const el = document.getElementById('goal-settings')
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

// Auth watch pattern — no onMounted
watch(
  () => authStore.isLoggedIn,
  async (loggedIn) => {
    if (loggedIn) {
      await debtPlanStore.initialize()
    } else {
      await debtPlanStore.initialize()
    }
  },
  { immediate: true }
)

// Currency formatter
function fmt(val) {
  if (val === null || val === undefined) return '$0'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(val)
}

// Month string formatter: 'YYYY-MM' -> 'Oct 2028'
function formatMonth(ym) {
  if (!ym) return ''
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1, 1)
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

// Inferred debt type helper
function getInferredDebtType(debt) {
  if (debt.type) return debt.type
  const name = (debt.name || '').toLowerCase()
  if (name.includes('sofi') || name.includes('upstart') || name.includes('loan')) {
    return 'Personal Loan'
  }
  if (name.includes('student')) return 'Student Loan'
  if (name.includes('auto') || name.includes('car')) return 'Auto Loan'
  if (name.includes('medical')) return 'Medical'
  return 'Credit Card'
}

// Table ordering & focus state
const tableContainerRef = ref(null)
const isTableFocused = ref(false)
const displayedDebtIds = ref([])

function updateSortOrder() {
  const order = debtPlanStore.result.payoffOrder || []
  const orderMap = new Map(order.map((item, idx) => [item.id, idx]))
  const sorted = [...debtPlanStore.debts].sort((a, b) => {
    const idxA = orderMap.has(a.id) ? orderMap.get(a.id) : 999
    const idxB = orderMap.has(b.id) ? orderMap.get(b.id) : 999
    return idxA - idxB
  })
  displayedDebtIds.value = sorted.map(d => d.id)
}

// Keep displayed order stable while typing; re-sort on Enter, click-out (blur), strategy change, or load
const sortedDebts = computed(() => {
  const debtMap = new Map(debtPlanStore.debts.map(d => [d.id, d]))
  const result = []

  for (const id of displayedDebtIds.value) {
    if (debtMap.has(id)) {
      result.push(debtMap.get(id))
      debtMap.delete(id)
    }
  }

  for (const remaining of debtMap.values()) {
    result.push(remaining)
  }

  return result
})

function onTableFocusIn() {
  isTableFocused.value = true
}

function onTableFocusOut(event) {
  if (event.currentTarget && event.currentTarget.contains(event.relatedTarget)) {
    return
  }
  isTableFocused.value = false
  updateSortOrder()
}

function handleEnter(event) {
  event.target.blur()
}

function handleSetStrategy(strat) {
  debtPlanStore.setStrategy(strat)
  updateSortOrder()
}

function handleAddDebt() {
  isTableFocused.value = true
  const newDebt = debtPlanStore.addDebt({
    name: 'New Debt',
    balance: 1000,
    apr: 19.99,
    minPayment: 50
  })
  if (newDebt && newDebt.id && !displayedDebtIds.value.includes(newDebt.id)) {
    displayedDebtIds.value = [...displayedDebtIds.value, newDebt.id]
  }
}

function handleRemoveDebt(id) {
  debtPlanStore.removeDebt(id)
  displayedDebtIds.value = displayedDebtIds.value.filter(item => item !== id)
}

watch(
  () => debtPlanStore.result.payoffOrder,
  () => {
    if (!isTableFocused.value) {
      updateSortOrder()
    }
  },
  { immediate: true }
)

watch(
  () => debtPlanStore.debts.length,
  (newLen, oldLen) => {
    if (!isTableFocused.value || oldLen === 0) {
      updateSortOrder()
    }
  }
)

// Progress bar styling for debts
function getDebtProgressStyle(debt) {
  const current = Number(debt.balance) || 0
  if (current <= 0) {
    return { width: '100%', backgroundColor: '#22c55e' }
  }
  const firstRow = debtPlanStore.result.rows?.[0]
  if (!firstRow || !firstRow.balances) {
    return { width: '0%', backgroundColor: '#6366f1' }
  }
  const endFirstMonth = firstRow.balances[debt.id] ?? current
  if (endFirstMonth < current) {
    const paid = current - endFirstMonth
    const pct = Math.min(100, Math.max(5, (paid / current) * 100))
    return { width: `${pct}%`, backgroundColor: '#6366f1' }
  } else if (endFirstMonth > current) {
    // Balance grew (absorbed shortfall)
    return { width: '100%', backgroundColor: '#f59e0b' }
  }
  return { width: '0%', backgroundColor: '#6366f1' }
}

// --- Chart computation ---
// Cut off a few months after the later of debt-free month and goal month
const chartRows = computed(() => {
  const rows = debtPlanStore.result.rows || []
  if (rows.length === 0) return []

  const debtFree = debtPlanStore.result.debtFreeMonth
  const goal = debtPlanStore.goalMonth

  let targetMonth = null
  if (debtFree && goal) {
    targetMonth = debtFree > goal ? debtFree : goal
  } else if (debtFree) {
    targetMonth = debtFree
  } else if (goal) {
    targetMonth = goal
  }

  if (targetMonth) {
    const idx = rows.findIndex(r => r.month === targetMonth)
    if (idx !== -1) {
      const cutoff = Math.max(12, Math.min(rows.length, idx + 6))
      return rows.slice(0, cutoff)
    }
  }

  // Default: if debt is not paid off and no goal, show up to 60 months
  return rows.slice(0, Math.min(rows.length, 60))
})

// Goal marker plugin
const goalMarkerPlugin = {
  id: 'goalMarker',
  afterDatasetsDraw(chart) {
    try {
      const goal = debtPlanStore.goalMonth
      if (!goal) return
      const idx = chartRows.value.findIndex(r => r.month === goal)
      if (idx < 0) return

      const xPos = chart.scales.x.getPixelForIndex(idx)
      if (xPos === undefined || isNaN(xPos)) return

      const { top, bottom } = chart.chartArea
      const ctx = chart.ctx
      ctx.save()
      ctx.beginPath()
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.75)'
      ctx.lineWidth = 1.5
      ctx.setLineDash([5, 4])
      ctx.moveTo(xPos, top)
      ctx.lineTo(xPos, bottom)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#c084fc'
      ctx.font = '11px system-ui, -apple-system, sans-serif'
      ctx.textAlign = 'center'
      const label = debtPlanStore.goalLabel ? debtPlanStore.goalLabel : 'Goal'
      ctx.fillText(label, xPos, top - 6)
      ctx.restore()
    } catch (_) {}
  }
}

const chartPlugins = [goalMarkerPlugin]

const chartData = computed(() => {
  const rows = chartRows.value
  const labels = rows.map(r => formatMonth(r.month))
  const debtData = rows.map(r => r.totalDebt)
  const savingsData = rows.map(r => r.savings)

  return {
    labels,
    datasets: [
      {
        label: 'Total Debt',
        data: debtData,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        borderWidth: 2.5,
        pointRadius: 1,
        pointHoverRadius: 4,
        tension: 0.2,
        fill: false,
        order: 1
      },
      {
        label: 'Savings',
        data: savingsData,
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.08)',
        borderWidth: 2.5,
        pointRadius: 1,
        pointHoverRadius: 4,
        tension: 0.2,
        fill: false,
        order: 2
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: { usePointStyle: true, padding: 20, font: { size: 12 }, color: '#9ca3af' }
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      callbacks: {
        label: (ctx) => {
          if (ctx.parsed.y === null || ctx.parsed.y === undefined) return null
          return `${ctx.dataset.label}: ${fmt(ctx.parsed.y)}`
        }
      }
    }
  },
  scales: {
    x: {
      ticks: {
        maxTicksLimit: 12,
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
      grid: { color: 'rgba(255, 255, 255, 0.05)' }
    }
  },
  interaction: { mode: 'index', intersect: false },
  animation: { duration: 250 }
}
</script>
