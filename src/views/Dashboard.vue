<template>
  <div class="min-h-screen bg-slate-950" :key="selectedMonth + '-' + refreshKey">
    <div class="w-full px-4 md:px-6 lg:px-8 py-8">
      <!-- Header Section -->
      <div class="bg-gradient-to-br from-indigo-950 to-slate-900 rounded-2xl shadow-xl p-8 mb-8 border border-indigo-900">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 class="text-4xl font-bold text-white">
              Financial Dashboard
            </h1>
            <p class="text-slate-300 mt-2 text-lg">Your comprehensive financial overview</p>
          </div>
          <!-- Month Picker -->
          <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div class="relative">
              <label class="block text-sm font-semibold text-gray-700 mb-2">Select Month</label>
              <input 
                type="month" 
                v-model="selectedMonth" 
                class="px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 hover:shadow-md"
              />
            </div>
            <router-link :to="{ path: '/reflection', query: { periodStart: formatLocalYYYYMMDD(new Date(new Date().getFullYear(), new Date().getMonth(), 1)) } }">
              <button class="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transform transition-all duration-200 hover:scale-105 shadow-lg">
                <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Reflect on this month
              </button>
            </router-link>
          </div>
        </div>
      </div>

      <!-- Milestone Celebration Banner -->
      <Transition name="milestone-banner">
        <div
          v-if="celebrationBanner"
          class="bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl shadow-xl p-6 mb-6 border border-green-300 relative overflow-hidden"
        >
          <button
            @click="dismissBanner"
            class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 rounded-full transition-colors text-xl font-bold leading-none"
            aria-label="Dismiss"
          >&times;</button>
          <div class="flex items-start gap-4">
            <div class="text-5xl shrink-0 leading-none">🎉</div>
            <div class="min-w-0 pr-8">
              <p class="text-xs font-bold text-green-100 uppercase tracking-widest mb-1">Milestone Reached!</p>
              <h2 class="text-2xl font-bold text-white mb-2">{{ celebrationBanner.name }}</h2>
              <p class="text-green-50 text-sm leading-relaxed">{{ celebrationBanner.message }}</p>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Quick Stats Cards (4 stat cards follow) -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <!-- Current Balance -->
        <div class="bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-700 border-l-4 border-l-indigo-500 h-full hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
          <div class="flex items-center space-x-3 mb-4">
            <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wide">Money Left This Month</h3>
            </div>
          </div>
          <p class="text-3xl font-bold text-slate-100 mb-2">{{ formatCurrency(currentBalance) }}</p>
          <p class="text-sm text-slate-400">
            <span :class="balanceChange >= 0 ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'">
              {{ balanceChange >= 0 ? '↗' : '↘' }} {{ formatCurrency(Math.abs(balanceChange)) }}
            </span>
            <span class="ml-1">this month</span>
          </p>
        </div>

        <!-- Monthly Income -->
        <div class="bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-700 border-l-4 border-l-indigo-500 h-full hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
          <div class="flex items-center space-x-3 mb-4">
            <div class="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wide">Monthly Income</h3>
            </div>
          </div>
          <p class="text-3xl font-bold text-green-600 mb-2">{{ formatCurrency(monthlyIncome) }}</p>
          <p class="text-sm text-gray-500 mb-1">From {{ monthlyIncomeTransactions }} transactions</p>
          <p v-if="prevMonthIncome > 0" class="text-xs font-semibold"
             :class="monthlyIncome >= prevMonthIncome ? 'text-green-600' : 'text-red-500'">
            {{ monthlyIncome >= prevMonthIncome ? '↑' : '↓' }}
            {{ formatCurrency(Math.abs(monthlyIncome - prevMonthIncome)) }}
            {{ monthlyIncome >= prevMonthIncome ? 'more' : 'less' }} than last month
          </p>
        </div>

        <!-- Monthly Expenses -->
        <div class="bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-700 border-l-4 border-l-indigo-500 h-full hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
          <div class="flex items-center space-x-3 mb-4">
            <div class="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
            <div>
              <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wide">Monthly Expenses</h3>
            </div>
          </div>
          <p class="text-3xl font-bold text-red-600 mb-2">{{ formatCurrency(monthlyExpenses) }}</p>
          <p class="text-sm text-gray-500 mb-1">From {{ monthlyExpenseTransactions }} transactions</p>
          <p v-if="prevMonthExpenses > 0" class="text-xs font-semibold"
             :class="monthlyExpenses <= prevMonthExpenses ? 'text-green-600' : 'text-red-500'">
            {{ monthlyExpenses <= prevMonthExpenses ? '↓' : '↑' }}
            {{ formatCurrency(Math.abs(monthlyExpenses - prevMonthExpenses)) }}
            {{ monthlyExpenses <= prevMonthExpenses ? 'less' : 'more' }} than last month
          </p>
        </div>

        <!-- Upcoming Bills -->
        <div class="bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-700 border-l-4 border-l-indigo-500 h-full hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
          <div class="flex items-center space-x-3 mb-4">
            <div class="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wide">Upcoming Bills</h3>
            </div>
          </div>
          <p class="text-3xl font-bold text-orange-600 mb-2">{{ formatCurrency(upcomingBillsTotal) }}</p>
          <p class="text-sm text-gray-500 mb-3">{{ upcomingBillsText }}</p>
          <div v-if="upcomingBills.length" class="flex flex-wrap gap-1">
            <span v-for="bill in upcomingBills" :key="bill.id" class="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
              {{ bill.name }}
            </span>
          </div>
        </div>
      </div>

      <!-- Savings Rate + FI Progress (side by side on lg) -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <!-- Savings Rate: 1/3 width on lg -->
        <div class="lg:col-span-1 rounded-2xl shadow-xl border border-rose-500/30">
          <div class="flex flex-col justify-between gap-4 px-8 py-6 h-full"
               :class="savingsRate >= 0 ? 'bg-gradient-to-br from-emerald-950/60 to-slate-800' : 'bg-gradient-to-br from-red-950/60 to-slate-800'">

            <!-- Header: icon + label + rate -->
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shrink-0"
                   :class="savingsRate >= 0 ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-rose-600'">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p class="text-xs font-semibold uppercase tracking-wide"
                   :class="savingsRate >= 0 ? 'text-green-600' : 'text-red-600'">Savings Rate</p>
                <p class="text-4xl font-bold mt-0.5"
                   :class="savingsRate >= 0 ? 'text-green-700' : 'text-red-700'">
                  {{ savingsRate >= 0 ? '' : '–' }}{{ Math.abs(savingsRate).toFixed(1) }}%
                </p>
              </div>
            </div>

            <!-- Sparkline: SVG line graph, last 3 months -->
            <div v-if="savingsRateLast3.some(p => p.rate !== null)" class="w-full my-2 flex-1 min-h-[140px]">
              <svg viewBox="0 0 220 120" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <!-- Zero baseline -->
                <line x1="20" :y1="getSparkY(0)" x2="200" :y2="getSparkY(0)"
                      stroke="#475569" stroke-width="1" stroke-dasharray="4 3" />
                <!-- Connecting line -->
                <polyline
                  v-if="sparklinePoints"
                  :points="sparklinePoints"
                  fill="none"
                  :stroke="sparklineColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  opacity="0.85"
                />
                <!-- Data points + labels -->
                <template v-for="(p, i) in savingsRateLast3" :key="i">
                  <template v-if="p.rate !== null">
                    <circle :cx="[40,110,180][i]" :cy="getSparkY(p.rate)" r="3.5" :fill="sparklineColor" />
                    <text :x="[40,110,180][i]" :y="getSparkY(p.rate) - 7"
                          text-anchor="middle" font-size="10" font-weight="600"
                          :fill="p.rate >= 0 ? '#4ade80' : '#f87171'">
                      {{ (p.rate >= 0 ? '' : '–') + Math.abs(p.rate).toFixed(1) + '%' }}
                    </text>
                    <text :x="[40,110,180][i]" y="114"
                          text-anchor="middle" font-size="10" fill="#9ca3af">
                      {{ p.month }}
                    </text>
                  </template>
                  <template v-else>
                    <text :x="[40,110,180][i]" y="114"
                          text-anchor="middle" font-size="10" fill="#64748b">
                      {{ p.month }}
                    </text>
                  </template>
                </template>
              </svg>
            </div>

            <!-- Footer: description + 3-month avg -->
            <div>
              <p class="text-sm font-medium"
                 :class="savingsRate >= 0 ? 'text-green-600' : 'text-red-500'">
                {{ savingsRate >= 0 ? 'of income saved this month' : 'spending more than earning this month' }}
              </p>
              <p v-if="savingsRate3mAvg !== null" class="text-sm mt-1"
                 :class="savingsRate3mAvg >= 0 ? 'text-gray-400' : 'text-red-400'">
                3-month avg: {{ savingsRate3mAvg >= 0 ? '' : '–' }}{{ Math.abs(savingsRate3mAvg).toFixed(1) }}%
              </p>
            </div>

          </div>
        </div>

        <!-- FI Progress: 2/3 width on lg -->
        <div class="lg:col-span-2 bg-indigo-950/40 rounded-2xl shadow-xl p-6 border border-indigo-500/30">
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-5">
            <div>
              <h3 class="text-xl font-bold text-slate-100">Financial Independence Progress</h3>
              <p class="text-sm text-slate-400 mt-0.5">Based on 4% safe withdrawal rate</p>
            </div>
            <div class="flex flex-col sm:items-end gap-1">
              <p class="text-sm text-slate-400 whitespace-nowrap">
                Based on {{ formatCurrency(fiStore.monthlyExpenses) }}/mo avg expenses
              </p>
              <router-link
                to="/fi-journey"
                class="text-sm text-blue-600 hover:text-blue-800 font-semibold hover:underline transition-colors duration-200"
              >
                View FI Journey →
              </router-link>
            </div>
          </div>
          <div class="flex flex-col sm:flex-row sm:items-end gap-6 mb-5">
            <div>
              <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Invested</p>
              <div v-if="!editingFI" class="flex items-center gap-2">
                <span class="text-3xl font-bold text-slate-100">{{ formatCurrency(fiStore.total_invested) }}</span>
                <button @click="startEditFI" class="p-1 text-gray-300 hover:text-blue-500 transition-colors" title="Edit">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
              <div v-else class="flex items-center gap-1">
                <span class="text-2xl font-bold text-gray-400">$</span>
                <input
                  v-model="fiInput"
                  type="number"
                  min="0"
                  step="0.01"
                  @blur="saveFI"
                  @keydown="onFIKeydown"
                  autofocus
                  class="text-2xl font-bold text-gray-900 w-44 border-b-2 border-blue-500 focus:outline-none bg-transparent"
                />
              </div>
            </div>
            <div class="sm:ml-auto text-left sm:text-right">
              <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">FI Target</p>
              <p class="text-2xl font-bold text-slate-400">{{ formatCurrency(fiStore.fiNumber) }}</p>
            </div>
          </div>
          <div class="flex justify-between items-center mb-1.5">
            <span class="text-sm font-bold text-green-600">{{ fiStore.progressPercent.toFixed(2) }}% of the way there</span>
          </div>
          <div class="w-full bg-slate-700 rounded-full h-2.5">
            <div
              class="bg-gradient-to-r from-green-400 to-emerald-500 h-2.5 rounded-full transition-all duration-700"
              :style="{ width: Math.max(fiStore.progressPercent, 0.15) + '%' }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Income Goal & Break-Even -->
      <div class="bg-slate-800 rounded-2xl shadow-xl border border-indigo-400/30 mb-6 overflow-hidden">
        <div class="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-700">

          <!-- LEFT: Income Progress -->
          <div class="p-6">
            <div class="flex items-center space-x-3 mb-5">
              <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 class="text-lg font-bold text-slate-100">Income Goal</h3>
            </div>

            <div class="mb-4">
              <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">This month</p>
              <p class="text-3xl font-bold text-green-600">{{ formatCurrency(monthlyIncome) }}</p>
            </div>

            <div class="flex flex-wrap items-end gap-6 mb-5">
              <div>
                <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Target</p>
                <div v-if="!editingGoal" class="flex items-center gap-2">
                  <span class="text-2xl font-bold text-slate-200">{{ formatCurrency(incomeGoalsStore.target_monthly_income) }}</span>
                  <button @click="startEditGoal" class="p-1 text-gray-300 hover:text-blue-500 transition-colors" title="Edit">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
                <div v-else class="flex items-center gap-1">
                  <span class="text-xl font-bold text-gray-400">$</span>
                  <input
                    v-model="goalInput"
                    type="number" min="0" step="0.01"
                    @blur="saveGoal" @keydown="onGoalKeydown"
                    autofocus
                    class="text-xl font-bold text-gray-900 w-32 border-b-2 border-blue-500 focus:outline-none bg-transparent"
                  />
                </div>
              </div>
              <div>
                <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Label</p>
                <div v-if="!editingGoalLabel" class="flex items-center gap-1">
                  <span class="text-sm font-semibold text-gray-500">{{ incomeGoalsStore.target_label }}</span>
                  <button @click="startEditGoalLabel" class="p-1 text-gray-300 hover:text-blue-500 transition-colors">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
                <input
                  v-else
                  v-model="goalLabelInput"
                  type="text"
                  @blur="saveGoalLabel" @keydown="onGoalLabelKeydown"
                  autofocus
                  class="text-sm font-semibold text-gray-700 border-b-2 border-blue-500 focus:outline-none bg-transparent w-32"
                />
              </div>
            </div>

            <div class="flex justify-between items-center mb-1.5">
              <span class="text-sm font-bold" :class="incomeGoalProgress >= 100 ? 'text-green-600' : 'text-blue-600'">
                {{ incomeGoalProgress.toFixed(1) }}% of goal
              </span>
              <span v-if="incomeGoalGap >= 0" class="text-sm font-semibold text-green-600">Goal reached! ✓</span>
              <span v-else class="text-sm font-semibold text-red-500">{{ formatCurrency(Math.abs(incomeGoalGap)) }} to go</span>
            </div>
            <div class="w-full bg-slate-700 rounded-full h-2.5 mb-3">
              <div
                class="h-2.5 rounded-full transition-all duration-700"
                :class="incomeGoalProgress >= 100 ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-blue-400 to-indigo-500'"
                :style="{ width: Math.max(incomeGoalProgress, 0.15) + '%' }"
              ></div>
            </div>
            <p v-if="lifeEnergyHoursToGoal !== null" class="text-xs text-gray-400">
              ≈ {{ lifeEnergyHoursToGoal }} hrs of work needed to reach goal
            </p>
          </div>

          <!-- RIGHT: Break-Even Analysis -->
          <div class="p-6">
            <div class="flex items-center space-x-3 mb-5">
              <div class="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              </div>
              <h3 class="text-lg font-bold text-gray-900">Break-Even Analysis</h3>
            </div>

            <div class="space-y-0 mb-5">
              <div class="flex items-center justify-between py-3 border-b border-gray-100">
                <span class="text-sm text-gray-500">Current income</span>
                <span class="text-sm font-bold text-green-600">{{ formatCurrency(monthlyIncome) }}</span>
              </div>
              <div class="flex items-center justify-between py-3 border-b border-gray-100">
                <span class="text-sm text-gray-500">Monthly expenses (3m avg)</span>
                <span class="text-sm font-bold text-red-500">{{ formatCurrency(avgMonthlyExpenses3m) }}</span>
              </div>
              <div class="flex items-center justify-between py-3">
                <span class="text-sm font-semibold text-gray-700">Monthly gap</span>
                <span class="text-sm font-bold" :class="breakEvenGap >= 0 ? 'text-green-600' : 'text-red-600'">
                  {{ breakEvenGap >= 0 ? '+' : '–' }}{{ formatCurrency(Math.abs(breakEvenGap)) }}
                </span>
              </div>
            </div>

            <div v-if="breakEvenGap < 0" class="bg-red-950/40 border border-red-500/30 rounded-xl px-4 py-3 space-y-1">
              <p class="text-sm font-semibold text-red-400">
                You need {{ formatCurrency(Math.abs(breakEvenGap)) }} more per month to break even
              </p>
              <p v-if="lifeEnergyHoursOfGap !== null" class="text-xs text-red-400">
                That's ≈ {{ lifeEnergyHoursOfGap }} hrs of additional work at your life energy rate
              </p>
            </div>
            <div v-else class="bg-green-950/40 border border-green-500/30 rounded-xl px-4 py-3 space-y-1">
              <p class="text-sm font-semibold text-green-400">
                You're {{ formatCurrency(breakEvenGap) }} above break-even this month ✓
              </p>
              <p class="text-xs text-green-500">
                Keep it up — every surplus dollar can go to investments
              </p>
            </div>
          </div>

        </div>
      </div>

      <!-- Gemini Spending Insights Card -->
      <div v-if="SHOW_GEMINI_INSIGHTS" class="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 p-6 mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center">
              <span class="text-xl">✨</span>
            </div>
            <div>
              <h3 class="text-lg font-bold text-slate-100">Gemini AI Spending Insights</h3>
              <p class="text-xs text-slate-400">Personalized spending patterns and Life Energy analysis (last 90 days)</p>
            </div>
          </div>
          <button 
            @click="generateInsights(true)" 
            :disabled="loading"
            class="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-100 text-sm font-semibold rounded-xl transition-all duration-200"
          >
            {{ loading ? 'Analyzing...' : (insights ? 'Regenerate' : 'Generate Insights') }}
          </button>
        </div>

        <div v-if="loading" class="text-slate-300 text-sm py-4">
          Generating fresh insights using Gemini 3.5 Flash... Please wait.
        </div>

        <div v-else-if="error" class="bg-red-950/40 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm">
          {{ error }}
        </div>

        <div v-else-if="insights" class="text-slate-300 text-sm border-t border-slate-700 pt-4" v-html="renderedInsights">
        </div>

        <div v-else class="text-slate-400 text-sm py-4 border-t border-slate-700/50">
          Click the "Generate Insights" button to analyze your transactions.
        </div>
      </div>

      <!-- Main Content Grid: 2-col charts + 1-col sidebar -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left column -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Category Watch + Spending Chart (side by side on lg) -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <!-- Category Watch -->
            <div class="bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-700 h-full">
              <div class="flex items-center space-x-3 mb-4">
                <div class="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 class="text-lg font-bold text-slate-100">Category Watch</h3>
              </div>
              <div v-if="categoryOverspend.length === 0" class="flex items-center gap-2 text-green-600 text-sm font-medium">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                All categories on track this month ✓
              </div>
              <div v-else class="space-y-2">
                <div
                  v-for="alert in categoryOverspend"
                  :key="alert.name"
                  class="px-4 py-3 bg-amber-950/40 border border-amber-500/30 rounded-xl"
                >
                  <div class="flex flex-wrap items-start justify-between gap-2">
                    <span class="text-sm font-semibold text-amber-300">{{ alert.name }}</span>
                    <span class="text-sm font-bold text-amber-400 text-right">
                      ↑ {{ formatCurrency(alert.diff) }} vs 3-month avg
                      <span class="text-amber-400 font-medium">(+{{ alert.pct.toFixed(0) }}%)</span>
                    </span>
                  </div>
                  <p class="text-xs text-amber-400 mt-1">
                    3-month avg: {{ formatCurrency(alert.threeMonthAvg) }} · This month: {{ formatCurrency(alert.thisMonth) }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Spending by Category Chart -->
            <div class="bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-700">
              <div class="flex items-center space-x-3 mb-4">
                <div class="w-10 h-10 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 class="text-lg font-bold text-slate-100">Spending by Category</h3>
              </div>
              <DateRangeSelector
                v-model:dateRange="selectedDateRange"
                initial-range="6M"
              />
              <div class="mt-4 w-full">
                <SpendingCategoryChart :category-data="categorySpendingData" />
              </div>
            </div>
          </div>

          <!-- Income vs Expenses Chart (full width within left col) -->
          <div class="bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-700">
            <div class="flex items-center space-x-3 mb-6">
              <div class="w-10 h-10 bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <h3 class="text-xl font-bold text-slate-100">Income vs Expenses</h3>
            </div>
            <div class="h-[400px] p-4">
              <IncomeExpensesChart :monthly-data="monthlyIncomeExpenses" />
            </div>
          </div>
        </div>

        <!-- Right sidebar -->
        <div class="lg:col-span-1 space-y-6">
          <!-- Recent Transactions -->
          <div class="bg-slate-800 rounded-2xl shadow-xl border border-slate-700">
            <div class="p-6 border-b border-slate-700">
              <div class="flex justify-between items-center">
                <div class="flex items-center space-x-3">
                  <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 class="text-lg font-bold text-slate-100">Recent Transactions</h3>
                </div>
                <router-link
                  to="/transactions"
                  class="text-sm text-blue-600 hover:text-blue-800 font-semibold hover:underline transition-colors duration-200"
                >
                  View All →
                </router-link>
              </div>
            </div>
            <div class="divide-y divide-slate-700">
              <div
                v-for="transaction in recentTransactions"
                :key="transaction.id"
                class="p-4 hover:bg-slate-700/50 transition-colors duration-200"
              >
                <div class="flex justify-between items-center gap-2">
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-slate-100 truncate">{{ transaction.description }}</p>
                    <p class="text-xs text-slate-400 mt-1">{{ formatDate(transaction.date) }}</p>
                  </div>
                  <span class="shrink-0" :class="{
                    'text-green-600 font-bold': transaction.amount > 0,
                    'text-red-600 font-bold': transaction.amount < 0
                  }">
                    {{ formatCurrency(transaction.amount) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Upcoming Bills -->
          <div class="bg-slate-800 rounded-2xl shadow-xl border border-slate-700">
            <div class="p-6 border-b border-slate-700">
              <div class="flex justify-between items-center">
                <div class="flex items-center space-x-3">
                  <div class="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                    <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 class="text-lg font-bold text-slate-100">Upcoming Bills</h3>
                </div>
                <router-link
                  to="/bills"
                  class="text-sm text-blue-600 hover:text-blue-800 font-semibold hover:underline transition-colors duration-200"
                >
                  View All →
                </router-link>
              </div>
            </div>
            <div class="divide-y divide-slate-700">
              <div
                v-for="bill in upcomingBills"
                :key="bill.id"
                class="p-4 hover:bg-slate-700/50 transition-colors duration-200"
              >
                <div class="flex justify-between items-center gap-2">
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-slate-100 truncate">{{ bill.name }}</p>
                    <p class="text-xs text-slate-400 mt-1">Due {{ formatDate(bill.dueDate) }}</p>
                  </div>
                  <span class="text-slate-100 font-bold shrink-0">{{ formatCurrency(bill.amount) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useTransactionsStore } from '@/stores/transactions'
import { useBillsStore } from '@/stores/bills'
import { useDashboardStore } from '@/stores/dashboard'
import { calculateMonthlyTrends } from '@/stores/dashboard'
import { useAuthStore } from '@/stores/auth'
import { useFiSettingsStore } from '@/stores/fiSettings'
import { useIncomeGoalsStore } from '@/stores/incomeGoals'
import { useLifeEnergyStore } from '@/stores/lifeEnergy'
import SpendingCategoryChart from '@/components/SpendingCategoryChart.vue'
import IncomeExpensesChart from '@/components/IncomeExpensesChart.vue'
import DateRangeSelector from '../components/DateRangeSelector.vue'
import { MILESTONE_DEFS, isCelebrated, markCelebrated, recordAchievedDate } from '@/utils/milestones'
import { useGeminiInsights } from '@/composables/useGeminiInsights'

const SHOW_GEMINI_INSIGHTS = false // set to true to show the Gemini insights card (needs Vertex AI set up and current model names)
const { insights, loading, error, generateInsights } = useGeminiInsights()

const renderedInsights = computed(() => {
  if (!insights.value) return ''
  
  let html = insights.value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')

  // Headers
  html = html.replace(/^### (.*?)$/gm, '<h4 class="text-md font-bold text-indigo-300 mt-4 mb-2">$1</h4>')
  html = html.replace(/^## (.*?)$/gm, '<h3 class="text-lg font-bold text-white mt-5 mb-2">$1</h3>')
  html = html.replace(/^# (.*?)$/gm, '<h2 class="text-xl font-bold text-white mt-6 mb-3">$1</h2>')

  // Bullet points
  html = html.replace(/^[-\*] (.*?)$/gm, '<li class="ml-4 list-disc text-slate-300">$1</li>')

  // Blockquotes
  html = html.replace(/^&gt; (.*?)$/gm, '<blockquote class="border-l-4 border-slate-600 pl-4 py-1 my-2 text-slate-400 bg-slate-900 italic">$1</blockquote>')

  // Paragraphs
  html = html.split('\n\n').map(p => {
    if (p.trim().startsWith('<li') || p.trim().startsWith('<h') || p.trim().startsWith('<blockquote')) {
      return p
    }
    return `<p class="mb-3 text-slate-300 leading-relaxed">${p}</p>`
  }).join('')

  return html
})

const transactionsStore = useTransactionsStore()
const billsStore = useBillsStore()
const dashboardStore = useDashboardStore()
const authStore = useAuthStore()
const fiStore = useFiSettingsStore()
const incomeGoalsStore = useIncomeGoalsStore()
const lifeEnergyStore = useLifeEnergyStore()

watch(
  () => authStore.isLoggedIn,
  async (loggedIn) => {
    if (loggedIn && !fiStore.loaded) await fiStore.loadFromSupabase()
  },
  { immediate: true }
)

watch(
  () => authStore.isLoggedIn,
  async (loggedIn) => {
    if (loggedIn) await incomeGoalsStore.loadFromSupabase()
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

// Date range for category chart
function getDefault6MonthRange() {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0); // End of current month
  const start = new Date(now.getFullYear(), now.getMonth() - 5, 1); // Start of 6 months ago
  return {
    start: formatLocalYYYYMMDD(start),
    end: formatLocalYYYYMMDD(end)
  };
}
const selectedDateRange = ref(getDefault6MonthRange());

// Month picker state
const now = new Date()
const selectedMonth = ref(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
const refreshKey = ref(0)

// Helper: Filter transactions for the selected month
function getMonthTransactions(transactions, monthStr) {
  const [year, month] = monthStr.split('-').map(Number)
  return transactions.filter(t => {
    const [y, m, d] = t.date.split('-').map(Number)
    const dateObj = new Date(y, m - 1, d)
    return dateObj.getFullYear() === year && dateObj.getMonth() + 1 === month
  })
}

// 3-month rolling average for a spending category (3 full months before beforeMonth)
function getThreeMonthAvg(categoryName, transactions, beforeMonth) {
  const [y, m] = beforeMonth.split('-').map(Number)
  const totals = [1, 2, 3].map(i => {
    const d = new Date(y, m - 1 - i, 1)
    const yr = d.getFullYear(), mo = d.getMonth() + 1
    return (transactions || []).filter(t => {
      if (t.amount >= 0) return false
      if (t.category?.split(' - ')[0] !== categoryName) return false
      const [ty, tm] = t.date.split('-').map(Number)
      return ty === yr && tm === mo
    }).reduce((s, t) => s + Math.abs(t.amount), 0)
  })
  return totals.every(v => v === 0) ? null : totals.reduce((a, b) => a + b, 0) / 3
}

// Helper function to filter transactions by selected date range
function filterTransactionsByDateRange(transactions, range) {
  if (!range || !range.start || !range.end) return transactions;
  let [sy, sm, sd] = (range.start.length === 7 ? `${range.start}-01` : range.start).split('-').map(Number);
  let start = new Date(sy, sm - 1, sd);
  let endExclusive;
  if (range.end.length === 7) {
    let [ey, em] = range.end.split('-').map(Number);
    endExclusive = new Date(ey, em, 1);
  } else {
    let [ey, em, ed] = range.end.split('-').map(Number);
    endExclusive = new Date(ey, em - 1, ed + 1);
  }
  return transactions.filter(t => {
    const [ty, tm, td] = t.date.split('-').map(Number);
    const tDate = new Date(ty, tm - 1, td);
    return tDate >= start && tDate < endExclusive;
  });
}

// Initialize data
onMounted(() => {
  transactionsStore.initialize()
  billsStore.initialize()
  dashboardStore.updateMonthlyTrends(transactionsStore.getTransactions || [])
  const filtered = filterTransactionsByDateRange(transactionsStore.getTransactions || [], selectedDateRange.value)
  dashboardStore.updateCategoryStats(filtered)
})

// Watch for transaction or date range changes (for Spending by Category)
watch([
  () => transactionsStore.getTransactions,
  () => selectedDateRange.value
], ([newTransactions, newRange]) => {
  if (newTransactions) {
    const filtered = filterTransactionsByDateRange(newTransactions, newRange)
    dashboardStore.updateCategoryStats(filtered)
  }
}, { deep: true })

// Helper function for current month filtering
const getCurrentMonthTransactions = (transactions, filterFn = () => true) => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  return transactions?.filter(t => {
    const [y, m, d] = t.date.split('-').map(Number)
    const transDate = new Date(y, m - 1, d)
    return transDate.getMonth() === currentMonth && 
           transDate.getFullYear() === currentYear &&
           filterFn(t)
  }) || []
}

// Update stat card computed properties to use selectedMonth
const currentBalance = computed(() => {
  const monthTx = getMonthTransactions(transactionsStore.getTransactions || [], selectedMonth.value)
  return monthTx.reduce((sum, t) => sum + t.amount, 0)
})

const balanceChange = computed(() => {
  const currentMonthTransactions = getCurrentMonthTransactions(transactionsStore.getTransactions)
  return currentMonthTransactions.reduce((sum, t) => sum + t.amount, 0)
})

// Monthly Income/Expenses
const monthlyIncome = computed(() => {
  const monthTx = getMonthTransactions(transactionsStore.getFilteredIncome(), selectedMonth.value)
  return monthTx.reduce((sum, t) => sum + t.amount, 0)
})

const monthlyExpenses = computed(() => {
  const monthTx = getMonthTransactions(transactionsStore.getFilteredExpense(), selectedMonth.value)
  return Math.abs(monthTx.reduce((sum, t) => sum + t.amount, 0))
})

const monthlyIncomeTransactions = computed(() =>
  getMonthTransactions(transactionsStore.getFilteredIncome(), selectedMonth.value).length
)

const monthlyExpenseTransactions = computed(() =>
  getMonthTransactions(transactionsStore.getFilteredExpense(), selectedMonth.value).length
)

// Helper function to get the date range for the current week (Friday to Friday)
const getWeekRange = () => {
  const now = new Date()
  const currentDay = now.getDay() // 0 = Sunday, 6 = Saturday
  const daysToFriday = currentDay <= 5 ? 5 - currentDay : (5 - currentDay + 7)
  const daysFromLastFriday = currentDay <= 5 ? (currentDay + 2) : (currentDay - 5)
  const nextFriday = new Date(now)
  nextFriday.setDate(now.getDate() + daysToFriday)
  nextFriday.setHours(23, 59, 59, 999)
  const lastFriday = new Date(now)
  lastFriday.setDate(now.getDate() - daysFromLastFriday)
  lastFriday.setHours(0, 0, 0, 0)
  return { lastFriday, nextFriday }
}

// Helper to parse YYYY-MM-DD as local date (midnight local time)
function parseLocalDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

// Helper: Get per-month paid status and amount for dashboard
function isBillPaidDashboard(bill) {
  return billsStore.billMonthStatus?.[bill.id]?.[selectedMonth.value]?.paid || false
}
function getBillAmountDashboard(bill) {
  return billsStore.billMonthStatus?.[bill.id]?.[selectedMonth.value]?.amount ?? bill.amount
}
function getBillPaymentCountDashboard(bill) {
  return billsStore.billMonthStatus?.[bill.id]?.[selectedMonth.value]?.paymentCount ?? 0
}
// Update upcomingBills to use original bill dates, not modified month dates
const upcomingBills = computed(() => {
  const { lastFriday, nextFriday } = getWeekRange()
  return (billsStore.getBills || []).filter(bill => {
    // Use original bill due date, not modified month date
    const dueDate = parseLocalDate(bill.dueDate)
    const isPaid = billsStore.billMonthStatus?.[bill.id]?.[selectedMonth.value]?.paid || false
    
    return dueDate >= lastFriday && 
           dueDate <= nextFriday && 
           !isPaid && 
           !bill.deletedAfter // Filter out deleted bills
  }).sort((a, b) => parseLocalDate(a.dueDate) - parseLocalDate(b.dueDate))
})
const upcomingBillsTotal = computed(() => {
  return upcomingBills.value.reduce((sum, bill) => {
    const amount = billsStore.billMonthStatus?.[bill.id]?.[selectedMonth.value]?.amount ?? bill.amount
    return sum + amount
  }, 0)
})
const upcomingBillsCount = computed(() => upcomingBills.value.length)

// Update the Upcoming Bills card text
const upcomingBillsText = computed(() => {
  const { lastFriday, nextFriday } = getWeekRange()
  const formattedLastFriday = formatDate(lastFriday)
  const formattedNextFriday = formatDate(nextFriday)
  return `${upcomingBillsCount.value} bills due this week (${formattedLastFriday} - ${formattedNextFriday})`
})

// Recent Transactions
const recentTransactions = computed(() => {
  return (transactionsStore.getTransactions || [])
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)
})

// categorySpendingData uses the filtered transactions for the selected date range.
// Income categories (e.g. Pay Day) are excluded — spending only.
const categorySpendingData = computed(() => {
  return Object.entries(dashboardStore.categoryStats)
    .filter(([category]) => category !== 'Pay Day')
    .map(([category, stats]) => ({
      category,
      amount: -Math.abs(stats.total)
    }))
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
})

// Update monthlyIncomeExpenses to use dashboard store
const monthlyIncomeExpenses = computed(() => {
  return calculateMonthlyTrends(transactionsStore.getTransactions || [], selectedDateRange.value)
})

// Utility Functions
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

const formatDate = (date) => {
  const d = new Date(date)
  d.setMinutes(d.getMinutes() + d.getTimezoneOffset())
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(d)
}

function formatLocalYYYYMMDD(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-')
}

// Previous month string derived from selectedMonth
const prevMonth = computed(() => {
  const [y, m] = selectedMonth.value.split('-').map(Number)
  const d = new Date(y, m - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
})

const prevMonthIncome = computed(() => {
  const monthTx = getMonthTransactions(transactionsStore.getFilteredIncome(), prevMonth.value)
  return monthTx.reduce((sum, t) => sum + t.amount, 0)
})

const prevMonthExpenses = computed(() => {
  const monthTx = getMonthTransactions(transactionsStore.getFilteredExpense(), prevMonth.value)
  return Math.abs(monthTx.reduce((sum, t) => sum + t.amount, 0))
})

const savingsRate = computed(() => {
  if (monthlyIncome.value === 0) return 0
  return ((monthlyIncome.value - monthlyExpenses.value) / monthlyIncome.value) * 100
})

// Individual savings rates for the 3 months before selectedMonth (oldest → newest)
// Returns objects with actual abbreviated month names for the SVG sparkline
const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const savingsRateLast3 = computed(() => {
  const [y, m] = selectedMonth.value.split('-').map(Number)
  return [3, 2, 1].map(i => {
    const d = new Date(y, m - 1 - i, 1)
    const ms = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const inc = getMonthTransactions(transactionsStore.getFilteredIncome(), ms)
      .reduce((s, t) => s + t.amount, 0)
    const rate = inc === 0 ? null : (() => {
      const exp = Math.abs(
        getMonthTransactions(transactionsStore.getFilteredExpense(), ms)
          .reduce((s, t) => s + t.amount, 0)
      )
      return ((inc - exp) / inc) * 100
    })()
    return { month: monthNames[d.getMonth()], rate }
  })
})

// SVG sparkline helpers
const getSparkY = (rate) => {
  const clamped = Math.max(-30, Math.min(30, rate))
  return 60 - (clamped / 30) * 52
}

const sparklinePoints = computed(() => {
  return savingsRateLast3.value
    .map((p, i) => p.rate !== null
      ? `${[40, 110, 180][i]},${getSparkY(p.rate)}`
      : null)
    .filter(Boolean)
    .join(' ')
})

const sparklineColor = computed(() => {
  const rates = savingsRateLast3.value.map(p => p.rate).filter(r => r !== null)
  if (rates.length < 2) return '#9ca3af'
  return rates[rates.length - 1] > rates[0] ? '#16a34a' : '#dc2626'
})

// Average savings rate over the 3 full months prior to selectedMonth
const savingsRate3mAvg = computed(() => {
  const [y, m] = selectedMonth.value.split('-').map(Number)
  const rates = []
  for (let i = 1; i <= 3; i++) {
    const d = new Date(y, m - 1 - i, 1)
    const ms = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const inc = getMonthTransactions(transactionsStore.getFilteredIncome(), ms)
      .reduce((s, t) => s + t.amount, 0)
    if (inc === 0) continue
    const exp = Math.abs(
      getMonthTransactions(transactionsStore.getFilteredExpense(), ms)
        .reduce((s, t) => s + t.amount, 0)
    )
    rates.push(((inc - exp) / inc) * 100)
  }
  if (rates.length === 0) return null
  return rates.reduce((s, r) => s + r, 0) / rates.length
})

// Top 3 categories overspending vs 3-month rolling average by more than 15%
const categoryOverspend = computed(() => {
  const txAll = transactionsStore.getTransactions || []
  const [sy, sm] = selectedMonth.value.split('-').map(Number)

  // Current month spending by main category
  const curr = {}
  for (const t of txAll) {
    if (t.amount >= 0 || !t.category) continue
    const [ty, tm] = t.date.split('-').map(Number)
    if (ty !== sy || tm !== sm) continue
    const main = t.category.split(' - ')[0]
    curr[main] = (curr[main] || 0) + Math.abs(t.amount)
  }

  const alerts = []
  for (const [cat, amount] of Object.entries(curr)) {
    const avg = getThreeMonthAvg(cat, txAll, selectedMonth.value)
    if (!avg || avg === 0) continue
    const diff = amount - avg
    const pct = (diff / avg) * 100
    if (pct > 15) {
      alerts.push({ name: cat, diff, pct, threeMonthAvg: avg, thisMonth: amount })
    }
  }
  return alerts.sort((a, b) => b.diff - a.diff).slice(0, 3)
})

// 3-month average expenses (months before selectedMonth)
const avgMonthlyExpenses3m = computed(() => {
  const [y, m] = selectedMonth.value.split('-').map(Number)
  const totals = []
  for (let i = 1; i <= 3; i++) {
    const d = new Date(y, m - 1 - i, 1)
    const ms = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const exp = Math.abs(
      getMonthTransactions(transactionsStore.getFilteredExpense(), ms)
        .reduce((s, t) => s + t.amount, 0)
    )
    if (exp > 0) totals.push(exp)
  }
  if (totals.length === 0) return 0
  return totals.reduce((a, b) => a + b, 0) / totals.length
})

// Income goal progress (capped at 100)
const incomeGoalProgress = computed(() => {
  if (incomeGoalsStore.target_monthly_income <= 0) return 0
  return Math.min((monthlyIncome.value / incomeGoalsStore.target_monthly_income) * 100, 100)
})

// Gap: positive = above goal, negative = below
const incomeGoalGap = computed(() =>
  monthlyIncome.value - incomeGoalsStore.target_monthly_income
)

// Break-even gap vs 3m avg expenses
const breakEvenGap = computed(() =>
  monthlyIncome.value - avgMonthlyExpenses3m.value
)

// Life energy hours needed to reach income goal
const lifeEnergyHoursToGoal = computed(() => {
  if (lifeEnergyStore.lifeEnergyRate <= 0 || incomeGoalGap.value >= 0) return null
  return (Math.abs(incomeGoalGap.value) / lifeEnergyStore.lifeEnergyRate).toFixed(1)
})

// Life energy hours of the break-even shortfall
const lifeEnergyHoursOfGap = computed(() => {
  if (lifeEnergyStore.lifeEnergyRate <= 0 || breakEvenGap.value >= 0) return null
  return (Math.abs(breakEvenGap.value) / lifeEnergyStore.lifeEnergyRate).toFixed(1)
})

// Income goal inline editing
const editingGoal = ref(false)
const editingGoalLabel = ref(false)
const goalInput = ref(0)
const goalLabelInput = ref('')

function startEditGoal() {
  goalInput.value = incomeGoalsStore.target_monthly_income
  editingGoal.value = true
}
async function saveGoal() {
  const val = parseFloat(goalInput.value)
  if (!isNaN(val) && val >= 0) {
    incomeGoalsStore.target_monthly_income = val
    await incomeGoalsStore.saveToSupabase()
  }
  editingGoal.value = false
}
function onGoalKeydown(e) {
  if (e.key === 'Enter') saveGoal()
  if (e.key === 'Escape') editingGoal.value = false
}

function startEditGoalLabel() {
  goalLabelInput.value = incomeGoalsStore.target_label
  editingGoalLabel.value = true
}
async function saveGoalLabel() {
  if (goalLabelInput.value.trim()) {
    incomeGoalsStore.target_label = goalLabelInput.value.trim()
    await incomeGoalsStore.saveToSupabase()
  }
  editingGoalLabel.value = false
}
function onGoalLabelKeydown(e) {
  if (e.key === 'Enter') saveGoalLabel()
  if (e.key === 'Escape') editingGoalLabel.value = false
}

// FI inline editing
const editingFI = ref(false)
const fiInput = ref(0)

function startEditFI() {
  fiInput.value = fiStore.total_invested
  editingFI.value = true
}

async function saveFI() {
  const val = parseFloat(fiInput.value)
  if (!isNaN(val) && val >= 0) {
    fiStore.total_invested = val
    await fiStore.saveToSupabase()
  }
  editingFI.value = false
}

function onFIKeydown(e) {
  if (e.key === 'Enter') saveFI()
  if (e.key === 'Escape') editingFI.value = false
}

// Increment refreshKey every time selectedMonth changes
watch(selectedMonth, () => {
  refreshKey.value++
})

// --- Milestone Celebrations ---

// Savings balance (cumulative transactions tagged as savings)
const savingsBalance = computed(() =>
  Math.max(0, (transactionsStore.getTransactions || [])
    .filter(t => t.category?.toLowerCase().includes('saving'))
    .reduce((sum, t) => sum + t.amount, 0))
)

function isMilestoneHit(key) {
  const avgExp = avgMonthlyExpenses3m.value
  const savings = savingsBalance.value
  const invested = fiStore.total_invested
  switch (key) {
    case 'one_month_buffer': return avgExp > 0 && savings >= avgExp
    case 'emergency_fund':   return avgExp > 0 && savings >= avgExp * 3
    case 'first_10k':        return invested >= 10000
    case 'fi_crossover':     return fiStore.progressPercent >= 100
    default: return false
  }
}

const celebrationBanner = ref(null)

function checkMilestones() {
  for (const def of MILESTONE_DEFS) {
    if (isMilestoneHit(def.key) && !isCelebrated(def.key)) {
      recordAchievedDate(def.key)
      celebrationBanner.value = def
      return
    }
  }
  celebrationBanner.value = null
}

function dismissBanner() {
  if (celebrationBanner.value) {
    markCelebrated(celebrationBanner.value.key)
    celebrationBanner.value = null
  }
}

// Check milestones once FI settings finish loading (transactions already initialized in onMounted)
watch(() => fiStore.loaded, (loaded) => { if (loaded) checkMilestones() })
</script>

<style scoped>
.milestone-banner-enter-active,
.milestone-banner-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.milestone-banner-enter-from,
.milestone-banner-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}
</style> 