<!-- Bills View -->
<template>
  <div class="min-h-screen bg-slate-950">
    <div class="container mx-auto px-4 py-8">

      <!-- Header -->
      <div class="bg-gradient-to-br from-rose-950 to-slate-900 rounded-2xl shadow-xl p-8 mb-6 border border-rose-900">
        <div class="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
          <div>
            <h1 class="text-4xl font-bold text-white">
              Bills
            </h1>
            <p class="text-slate-300 mt-2 text-lg">Track and manage your recurring bills and payments</p>
          </div>
          <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div class="relative">
              <label class="block text-sm font-semibold text-slate-300 mb-2">Select Month</label>
              <input
                type="month"
                v-model="selectedMonth"
                class="px-4 py-3 border border-slate-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-slate-800 text-slate-100 transition-all duration-200"
              />
            </div>
            <div class="flex gap-2 mt-auto">
              <button
                @click="showAddModal = true"
                class="px-5 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform transition-all duration-200 hover:scale-105 shadow-lg text-sm font-semibold"
              >
                <svg class="w-4 h-4 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Bill
              </button>
              <button
                v-if="billsStore.canUndo"
                @click="undoAction"
                class="px-4 py-3 text-gray-600 bg-gray-100 border border-gray-300 rounded-xl hover:bg-gray-200 transition-all duration-200 shadow-sm text-sm"
                title="Undo last action"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Summary Stats -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="bg-slate-800 rounded-2xl shadow-lg p-5 border border-slate-700 border-l-4 border-l-rose-500">
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Total Bills</p>
          <p class="text-3xl font-bold text-slate-100">{{ billsForMonth.length }}</p>
          <p class="text-xs text-slate-400 mt-1">this month</p>
        </div>
        <div class="bg-slate-800 rounded-2xl shadow-lg p-5 border border-slate-700 border-l-4 border-l-rose-500">
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Amount Due</p>
          <p class="text-3xl font-bold text-slate-100">{{ formatCurrency(totalAmountDue) }}</p>
          <p class="text-xs text-slate-400 mt-1">total this month</p>
        </div>
        <div class="bg-slate-800 rounded-2xl shadow-lg p-5 border border-slate-700 border-l-4 border-l-rose-500">
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Paid</p>
          <p class="text-3xl font-bold text-green-400">{{ formatCurrency(totalPaid) }}</p>
          <p class="text-xs text-slate-400 mt-1">{{ paidThisMonthBills.length }} bills paid</p>
        </div>
        <div class="bg-slate-800 rounded-2xl shadow-lg p-5 border border-slate-700 border-l-4 border-l-rose-500">
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Remaining</p>
          <p class="text-3xl font-bold" :class="totalRemaining > 0 ? 'text-orange-600' : 'text-green-600'">
            {{ formatCurrency(totalRemaining) }}
          </p>
          <p v-if="lifeEnergyStore.lifeEnergyRate > 0 && totalRemaining > 0" class="text-xs text-gray-400 mt-1">
            ≈ {{ lifeEnergyStore.toCost(totalRemaining) }} of work
          </p>
          <p v-else class="text-xs text-gray-400 mt-1">unpaid</p>
        </div>
        <div class="bg-slate-800 rounded-2xl shadow-lg p-5 border border-slate-700 border-l-4" style="border-left-color: #10b981">
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">AUTO-PAY</p>
          <p class="text-3xl font-bold" style="color: #34d399">{{ formatCurrency(autoPayTotal) }}</p>
          <p v-if="lifeEnergyStore.lifeEnergyRate > 0" class="text-xs text-slate-400 mt-1">≈ {{ toLifeEnergyHours(autoPayTotal) }} hrs · hands-off</p>
        </div>
        <div class="bg-slate-800 rounded-2xl shadow-lg p-5 border border-slate-700 border-l-4" style="border-left-color: #f43f5e">
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">MANUAL</p>
          <p class="text-3xl font-bold" style="color: #fb7185">{{ formatCurrency(manualTotal) }}</p>
          <p v-if="lifeEnergyStore.lifeEnergyRate > 0" class="text-xs text-slate-400 mt-1">≈ {{ toLifeEnergyHours(manualTotal) }} hrs · needs attention</p>
        </div>
      </div>

      <!-- View Toggle -->
      <div class="flex rounded-xl overflow-hidden mb-6 w-fit">
        <button
          @click="viewMode = 'date'"
          class="px-5 py-2 text-sm font-medium transition-colors duration-200"
          :class="viewMode === 'date' ? 'bg-rose-500 text-white' : 'bg-slate-700 text-slate-300'"
        >
          By Due Date
        </button>
        <button
          @click="viewMode = 'category'"
          class="px-5 py-2 text-sm font-medium transition-colors duration-200"
          :class="viewMode === 'category' ? 'bg-rose-500 text-white' : 'bg-slate-700 text-slate-300'"
        >
          By Category
        </button>
      </div>

      <!-- By Due Date View -->
      <div v-if="viewMode === 'date'" class="space-y-5">

        <!-- Section 1: Due This Week -->
        <div class="bg-rose-950/30 rounded-2xl shadow-xl border border-rose-900/50 overflow-hidden">
          <div class="px-6 py-4 border-b border-rose-900/50 flex items-center gap-3">
            <div class="w-7 h-7 bg-gradient-to-r from-rose-500 to-red-600 rounded-lg flex items-center justify-center shrink-0">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 class="text-base font-bold text-slate-100">Due This Week</h2>
            <span v-if="dueThisWeekBills.length > 0" class="ml-auto text-xs font-semibold text-rose-300 bg-rose-900/50 px-2 py-0.5 rounded-full">
              {{ dueThisWeekBills.length }} bill{{ dueThisWeekBills.length === 1 ? '' : 's' }}
            </span>
          </div>
          <div class="p-4">
            <div v-if="dueThisWeekBills.length === 0" class="flex items-center gap-2 text-green-600 text-sm font-medium py-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              No bills due this week ✓
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="bill in dueThisWeekBills"
                :key="bill.id"
                class="flex items-start justify-between p-4 rounded-xl border transition-colors duration-200"
                :class="isOverdueBill(bill) ? 'bg-slate-800 border-slate-700 border-l-2 border-l-rose-500' : 'bg-slate-800 border-slate-700 border-l-2 border-l-rose-400'"
              >
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-semibold text-slate-100 capitalize">{{ bill.name }}</span>
                    <span class="text-xs px-2 py-0.5 bg-slate-700 border border-slate-600 text-slate-400 rounded-full">{{ bill.category }}</span>
                    <button
                      type="button"
                      @click="toggleAutomatic(bill)"
                      class="text-xs px-1.5 py-0.5 rounded font-medium cursor-pointer border transition-colors"
                      :class="bill.automatic
                        ? 'bg-green-900/40 text-emerald-400 border-emerald-500/50 hover:bg-green-900/60'
                        : 'bg-slate-700 text-slate-400 border-slate-500 hover:bg-slate-600'"
                    >
                      {{ bill.automatic ? 'AUTO' : 'MANUAL' }}
                    </button>
                    <span v-if="isOverdueBill(bill)" class="text-xs px-2 py-0.5 bg-slate-700 border border-rose-500/40 text-rose-400 rounded-full font-medium">Overdue</span>
                  </div>
                  <p class="text-xs text-slate-400 mt-0.5">Due {{ formatDate(bill.dueDate) }}</p>
                </div>
                <div class="flex items-start gap-3 shrink-0 ml-4">
                  <div class="text-right">
                    <p class="font-bold text-slate-100">{{ formatCurrency(bill.amount) }}</p>
                    <p v-if="lifeEnergyStore.lifeEnergyRate > 0 && bill.amount" class="text-xs text-gray-400">
                      ≈ {{ lifeEnergyStore.toCost(bill.amount) }}
                    </p>
                  </div>
                  <div class="flex gap-1.5">
                    <button @click="markBillAsPaid(bill)" class="px-2.5 py-1.5 text-xs font-semibold bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors whitespace-nowrap">
                      Mark Paid
                    </button>
                    <button @click="editBill(bill)" class="p-1.5 text-gray-400 hover:text-blue-500 transition-colors rounded-lg hover:bg-blue-50" title="Edit">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button @click="promptArchive(bill)" class="p-1.5 text-gray-400 hover:text-amber-600 transition-colors rounded-lg hover:bg-amber-50" title="Archive">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 2: Due This Month -->
        <div class="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-700 flex items-center gap-3">
            <div class="w-7 h-7 bg-gradient-to-r from-rose-500 to-rose-600 rounded-lg flex items-center justify-center shrink-0">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 class="text-base font-bold text-slate-100">Due This Month</h2>
            <span v-if="dueThisMonthBills.length > 0" class="ml-auto text-xs font-semibold text-rose-300 bg-rose-900/40 px-2 py-0.5 rounded-full">
              {{ dueThisMonthBills.length }} bill{{ dueThisMonthBills.length === 1 ? '' : 's' }}
            </span>
          </div>
          <div class="p-4">
            <div v-if="dueThisMonthBills.length === 0" class="text-sm text-gray-400 py-2">
              No other unpaid bills this month.
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="bill in dueThisMonthBills"
                :key="bill.id"
                class="flex items-start justify-between p-4 rounded-xl border transition-colors duration-200"
                :class="isOverdueBill(bill) ? 'bg-slate-800 border-slate-700 border-l-2 border-l-rose-500' : 'bg-slate-700/50 border-slate-600'"
              >
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-semibold text-slate-100 capitalize">{{ bill.name }}</span>
                    <span class="text-xs px-2 py-0.5 bg-slate-700 border border-slate-600 text-slate-400 rounded-full">{{ bill.category }}</span>
                    <button
                      type="button"
                      @click="toggleAutomatic(bill)"
                      class="text-xs px-1.5 py-0.5 rounded font-medium cursor-pointer border transition-colors"
                      :class="bill.automatic
                        ? 'bg-green-900/40 text-emerald-400 border-emerald-500/50 hover:bg-green-900/60'
                        : 'bg-slate-700 text-slate-400 border-slate-500 hover:bg-slate-600'"
                    >
                      {{ bill.automatic ? 'AUTO' : 'MANUAL' }}
                    </button>
                    <span v-if="isOverdueBill(bill)" class="text-xs px-2 py-0.5 bg-slate-700 border border-rose-500/40 text-rose-400 rounded-full font-medium">Overdue</span>
                  </div>
                  <p class="text-xs text-slate-400 mt-0.5">Due {{ formatDate(bill.dueDate) }}</p>
                </div>
                <div class="flex items-start gap-3 shrink-0 ml-4">
                  <div class="text-right">
                    <p class="font-bold text-slate-100">{{ formatCurrency(bill.amount) }}</p>
                    <p v-if="lifeEnergyStore.lifeEnergyRate > 0 && bill.amount" class="text-xs text-gray-400">
                      ≈ {{ lifeEnergyStore.toCost(bill.amount) }}
                    </p>
                  </div>
                  <div class="flex gap-1.5">
                    <button @click="markBillAsPaid(bill)" class="px-2.5 py-1.5 text-xs font-semibold bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors whitespace-nowrap">
                      Mark Paid
                    </button>
                    <button @click="editBill(bill)" class="p-1.5 text-gray-400 hover:text-blue-500 transition-colors rounded-lg hover:bg-blue-50" title="Edit">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button @click="promptArchive(bill)" class="p-1.5 text-gray-400 hover:text-amber-600 transition-colors rounded-lg hover:bg-amber-50" title="Archive">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 3: Paid This Month (collapsible) -->
        <div class="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 overflow-hidden">
          <button
            @click="paidSectionOpen = !paidSectionOpen"
            class="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-slate-700/50 transition-colors duration-200"
          >
            <div class="w-7 h-7 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shrink-0">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div class="flex-1 text-left">
              <span class="text-base font-bold text-slate-100">Paid This Month</span>
              <span class="ml-2 text-sm text-slate-400">
                — {{ paidThisMonthBills.length }} bill{{ paidThisMonthBills.length === 1 ? '' : 's' }}, {{ formatCurrency(totalPaid) }} total
              </span>
            </div>
            <svg class="w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0" :class="paidSectionOpen ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div v-if="paidSectionOpen" class="border-t border-slate-700">
            <div class="p-4">
              <div v-if="paidThisMonthBills.length === 0" class="text-sm text-slate-400 py-2">
                No bills paid yet this month.
              </div>
              <div v-else class="space-y-2">
                <div
                  v-for="bill in paidThisMonthBills"
                  :key="bill.id"
                  class="flex items-center justify-between p-4 bg-green-950/20 border border-green-900/50 rounded-xl"
                >
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="font-semibold text-slate-200 capitalize">{{ bill.name }}</span>
                      <span class="text-xs px-2 py-0.5 bg-slate-700 border border-slate-600 text-slate-400 rounded-full">{{ bill.category }}</span>
                      <button
                        type="button"
                        @click="toggleAutomatic(bill)"
                        class="text-xs px-1.5 py-0.5 rounded font-medium cursor-pointer border transition-colors"
                        :class="bill.automatic
                          ? 'bg-green-900/40 text-emerald-400 border-emerald-500/50 hover:bg-green-900/60'
                          : 'bg-slate-700 text-slate-400 border-slate-500 hover:bg-slate-600'"
                      >
                        {{ bill.automatic ? 'AUTO' : 'MANUAL' }}
                      </button>
                    </div>
                    <p class="text-xs text-slate-400 mt-0.5">Due {{ formatDate(bill.dueDate) }}</p>
                  </div>
                  <div class="flex items-center gap-3 shrink-0 ml-4">
                    <p class="font-bold text-green-400">{{ formatCurrency(bill.amount) }}</p>
                    <button @click="markBillAsUnpaid(bill)" class="px-2.5 py-1.5 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap">
                      Mark Unpaid
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 4: Archived Bills (collapsible) -->
        <div class="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 overflow-hidden">
          <button
            @click="archivedSectionOpen = !archivedSectionOpen"
            class="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-slate-700/50 transition-colors duration-200"
          >
            <div class="w-7 h-7 bg-slate-700 rounded-lg flex items-center justify-center shrink-0">
              <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <div class="flex-1 text-left">
              <span class="text-base font-bold text-slate-400">Archived Bills</span>
              <span class="ml-2 text-sm text-slate-500">— {{ billsStore.getArchivedBills.length }} archived</span>
            </div>
            <svg class="w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0" :class="archivedSectionOpen ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div v-if="archivedSectionOpen" class="border-t border-slate-700">
            <div class="p-4">
              <div v-if="billsStore.getArchivedBills.length === 0" class="text-sm text-slate-400 py-2">
                No archived bills.
              </div>
              <div v-else class="space-y-2">
                <div
                  v-for="bill in billsStore.getArchivedBills"
                  :key="bill.id"
                  class="flex items-center justify-between p-4 bg-slate-700/40 border border-slate-600 rounded-xl opacity-75"
                >
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="font-semibold text-slate-400 capitalize">{{ bill.name }}</span>
                      <span class="text-xs px-2 py-0.5 bg-slate-700 border border-slate-600 text-slate-500 rounded-full">{{ bill.category }}</span>
                    </div>
                    <p class="text-xs text-slate-500 mt-0.5">{{ formatCurrency(bill.amount) }}/mo · Archived</p>
                  </div>
                  <button
                    @click="restoreBill(bill)"
                    class="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap shrink-0 ml-4"
                  >
                    Restore
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div><!-- end date view -->

      <!-- By Category View -->
      <div v-if="viewMode === 'category'" class="space-y-5">

        <!-- Grand total bar -->
        <div class="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p class="text-slate-100 font-semibold">
            Total monthly bills: {{ formatCurrency(categoryGrandTotal.total) }}
            <span v-if="categoryGrandTotal.hours"> · ≈ {{ categoryGrandTotal.hours }}/mo of life energy</span>
          </p>
          <p v-if="categoryGrandTotal.takeHomePct !== null" class="text-sm text-slate-400 mt-1">
            {{ categoryGrandTotal.takeHomePct }}% of take-home going to bills
            <span v-if="lifeEnergyStore.monthly_take_home > 0">
              ({{ formatCurrency(lifeEnergyStore.monthly_take_home) }}/mo)
            </span>
          </p>
        </div>

        <!-- Category sections -->
        <div
          v-for="cat in billsByCategory"
          :key="cat.name"
          class="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 border-l-4 overflow-hidden"
          :class="cat.borderClass"
        >
          <!-- Category header -->
          <div class="px-6 py-4 border-b border-slate-700">
            <h2 class="text-lg font-bold text-slate-100">{{ cat.name }}</h2>
            <p class="text-sm text-slate-400 mt-0.5">
              Total: {{ formatCurrency(cat.total) }}
              <span v-if="cat.hours"> · ≈ {{ cat.hours }}/mo</span>
            </p>
          </div>

          <div class="p-4 space-y-5">
            <!-- Subcategory sections -->
            <div v-for="sub in cat.subcategories" :key="sub.name">
              <div class="flex items-baseline justify-between mb-2">
                <h3 class="text-sm font-semibold text-slate-300">{{ sub.name }}</h3>
                <p class="text-xs text-slate-500">
                  {{ formatCurrency(sub.total) }}
                  <span v-if="sub.hours"> · ≈ {{ sub.hours }}</span>
                </p>
              </div>

              <p
                v-if="cat.name === 'Debt' && sub.takeHomePct !== null && sub.total > 0"
                class="text-xs text-rose-400 mb-2"
              >
                This is {{ sub.takeHomePct }}% of your monthly take-home ({{ formatCurrency(lifeEnergyStore.monthly_take_home) }})
              </p>

              <div class="space-y-2">
                <div
                  v-for="bill in sub.bills"
                  :key="bill.id"
                  class="flex items-start justify-between p-4 rounded-xl bg-slate-700/50 border border-slate-600"
                >
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="font-semibold text-slate-100 capitalize">{{ bill.name }}</span>
                      <button
                        type="button"
                        @click="toggleAutomatic(bill)"
                        class="text-xs px-1.5 py-0.5 rounded font-medium cursor-pointer border transition-colors"
                        :class="bill.automatic
                          ? 'bg-green-900/40 text-emerald-400 border-emerald-500/50 hover:bg-green-900/60'
                          : 'bg-slate-700 text-slate-400 border-slate-500 hover:bg-slate-600'"
                      >
                        {{ bill.automatic ? 'AUTO' : 'MANUAL' }}
                      </button>
                    </div>
                    <p class="text-xs text-slate-400 mt-0.5">
                      {{ formatDueDay(bill.dueDate) }}
                      <span v-if="getBillEndLabel(bill.name)" class="text-slate-500"> · {{ getBillEndLabel(bill.name) }}</span>
                    </p>
                  </div>
                  <div class="text-right shrink-0 ml-4">
                    <p class="font-bold text-slate-100">{{ formatCurrency(bill.amount) }}</p>
                    <p v-if="lifeEnergyStore.lifeEnergyRate > 0 && bill.amount" class="text-xs text-slate-400">
                      ≈ {{ lifeEnergyStore.toCost(bill.amount) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Category summary -->
            <p class="text-sm text-slate-500 italic pt-2 border-t border-slate-700">
              {{ cat.name }} costs you {{ formatCurrency(cat.total) }}/mo
              <span v-if="cat.hours"> · ≈ {{ cat.hours }} of life energy per month</span>
            </p>
          </div>
        </div>

      </div><!-- end category view -->

      <!-- Bill Add/Edit Modal -->
      <BillModal
        v-if="showAddModal || editingBill"
        :bill="editingBill"
        @close="closeModal"
        @saved="handleBillSaved"
      />

      <!-- Archive Confirmation Modal -->
      <div v-if="showArchiveModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
        <div class="bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl border border-gray-100">
          <div class="flex items-center space-x-3 mb-6">
            <div class="w-12 h-12 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-gray-900">Archive Bill</h3>
          </div>
          <p class="text-gray-600 mb-2 text-base">Archive <strong class="capitalize">{{ archivingBill?.name }}</strong>?</p>
          <p class="text-gray-400 text-sm mb-8">It will be hidden from view but your payment history is preserved. You can restore it anytime from the Archived Bills section.</p>
          <div class="flex justify-end space-x-3">
            <button
              @click="showArchiveModal = false; archivingBill = null"
              class="px-6 py-3 text-gray-700 bg-gray-100 border border-gray-300 rounded-xl hover:bg-gray-200 focus:outline-none transition-all duration-200"
            >
              Cancel
            </button>
            <button
              @click="confirmArchive"
              class="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 focus:outline-none transform transition-all duration-200 hover:scale-105 shadow-lg"
            >
              Archive Bill
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useBillsStore } from '@/stores/bills'
import { useAuthStore } from '@/stores/auth'
import { useLifeEnergyStore } from '@/stores/lifeEnergy'
import BillModal from '@/components/BillModal.vue'

const billsStore = useBillsStore()
const authStore = useAuthStore()
const lifeEnergyStore = useLifeEnergyStore()

// Load bills and life energy when auth is ready (auth watch pattern — no onMounted)
watch(
  () => authStore.isLoggedIn,
  async (loggedIn) => {
    if (loggedIn) {
      await billsStore.initialize()
      billsStore.updateBillStatuses()
      await lifeEnergyStore.loadFromSupabase()
    }
  },
  { immediate: true }
)

// Month picker
const now = new Date()
const selectedMonth = ref(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)

// Modal / section state
const showAddModal = ref(false)
const editingBill = ref(null)
const showArchiveModal = ref(false)
const archivingBill = ref(null)
const paidSectionOpen = ref(false)
const archivedSectionOpen = ref(false)
const viewMode = ref('date')

watch(billsStore.billMonthStatus, (val) => {
  localStorage.setItem('billMonthStatus', JSON.stringify(val))
}, { deep: true })

// Helpers
function getYYYYMM(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function isBillPaid(bill) {
  return billsStore.billMonthStatus?.[bill.id]?.[selectedMonth.value]?.paid || false
}

function getBillAmount(bill) {
  const perMonth = billsStore.billMonthStatus?.[bill.id]?.[selectedMonth.value]?.amount
  if (perMonth === null || perMonth === undefined || perMonth === '') return bill.amount
  if (perMonth === 0 && bill.amount !== 0) return bill.amount
  return perMonth
}

function getDueDateForMonth(bill) {
  const [year, month] = selectedMonth.value.split('-').map(Number)
  const day = parseInt(bill.dueDate.split('-')[2])
  const date = new Date(year, month - 1, day)
  if (date.getMonth() !== month - 1) date.setDate(0)
  return date.toISOString().split('T')[0]
}

function isOverdueBill(bill) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(bill.dueDate)
  due.setHours(0, 0, 0, 0)
  return !isBillPaid(bill) && due < today
}

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(y, m - 1, d))
}

const CATEGORY_BORDER = {
  Debt: 'border-l-rose-500',
  Housing: 'border-l-indigo-500',
  Transportation: 'border-l-amber-500',
  Personal: 'border-l-violet-500',
  Savings: 'border-l-green-500'
}

function getCategoryBorderClass(mainCat) {
  return CATEGORY_BORDER[mainCat] || 'border-l-slate-500'
}

function getOrdinalSuffix(n) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}

function formatDueDay(dateStr) {
  const day = parseInt(dateStr.split('-')[2], 10)
  return `Due ${day}${getOrdinalSuffix(day)}`
}

function getBillEndLabel(billName) {
  const name = (billName || '').toLowerCase()
  return null
}

// Bills visible for selected month (excludes soft-deleted and archived)
const billsForMonth = computed(() => {
  return (billsStore.getBills || [])
    .filter(bill => {
      if (bill.archived) return false
      if (bill.deletedAfter && selectedMonth.value >= bill.deletedAfter) return false
      const billOriginalDate = new Date(bill.dueDate)
      const billMonth = `${billOriginalDate.getFullYear()}-${String(billOriginalDate.getMonth() + 1).padStart(2, '0')}`
      return selectedMonth.value >= billMonth
    })
    .map(bill => ({
      ...bill,
      dueDate: getDueDateForMonth(bill),
      amount: getBillAmount(bill),
      paid: isBillPaid(bill),
      paymentCount: billsStore.billMonthStatus?.[bill.id]?.[selectedMonth.value]?.paymentCount ?? 0
    }))
})

// Date window for "this week"
const todayStart = new Date()
todayStart.setHours(0, 0, 0, 0)
const sevenDaysOut = new Date(todayStart)
sevenDaysOut.setDate(todayStart.getDate() + 7)

const dueThisWeekBills = computed(() =>
  billsForMonth.value
    .filter(bill => {
      if (isBillPaid(bill)) return false
      const due = new Date(bill.dueDate)
      due.setHours(0, 0, 0, 0)
      return due >= todayStart && due <= sevenDaysOut
    })
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
)

const dueThisMonthBills = computed(() => {
  const thisWeekIds = new Set(dueThisWeekBills.value.map(b => b.id))
  return billsForMonth.value
    .filter(bill => !isBillPaid(bill) && !thisWeekIds.has(bill.id))
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
})

const paidThisMonthBills = computed(() =>
  billsForMonth.value
    .filter(bill => isBillPaid(bill))
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
)

// Summary stats
const totalAmountDue = computed(() => billsForMonth.value.reduce((s, b) => s + (b.amount || 0), 0))
const totalPaid = computed(() => paidThisMonthBills.value.reduce((s, b) => s + (b.amount || 0), 0))
const totalRemaining = computed(() =>
  [...dueThisWeekBills.value, ...dueThisMonthBills.value].reduce((s, b) => s + (b.amount || 0), 0)
)

const autoPayTotal = computed(() =>
  billsForMonth.value
    .filter(b => b.automatic)
    .reduce((s, b) => s + (b.amount || 0), 0)
)

const manualTotal = computed(() =>
  billsForMonth.value
    .filter(b => !b.automatic)
    .reduce((s, b) => s + (b.amount || 0), 0)
)

function toLifeEnergyHours(amount) {
  return (amount / lifeEnergyStore.lifeEnergyRate).toFixed(1)
}

// Category view data
const categoryBills = computed(() => billsForMonth.value)

const categoryGrandTotal = computed(() => {
  const total = categoryBills.value.reduce((s, b) => s + (b.amount || 0), 0)
  const takeHome = lifeEnergyStore.monthly_take_home
  const takeHomePct = takeHome > 0 ? Math.round((total / takeHome) * 100) : null
  return {
    total,
    hours: lifeEnergyStore.toCost(total),
    takeHomePct
  }
})

const billsByCategory = computed(() => {
  const groups = {}

  for (const bill of categoryBills.value) {
    const parts = (bill.category || 'Other').split(' - ')
    const mainCat = parts[0] || 'Other'
    const subCat = parts[1] || 'Uncategorized'

    if (!groups[mainCat]) {
      groups[mainCat] = { subcategories: {}, total: 0 }
    }
    if (!groups[mainCat].subcategories[subCat]) {
      groups[mainCat].subcategories[subCat] = { bills: [], total: 0 }
    }

    groups[mainCat].subcategories[subCat].bills.push(bill)
    const amt = bill.amount || 0
    groups[mainCat].subcategories[subCat].total += amt
    groups[mainCat].total += amt
  }

  const takeHome = lifeEnergyStore.monthly_take_home

  return Object.entries(groups)
    .map(([name, data]) => ({
      name,
      total: data.total,
      hours: lifeEnergyStore.toCost(data.total),
      borderClass: getCategoryBorderClass(name),
      subcategories: Object.entries(data.subcategories)
        .map(([subName, subData]) => ({
          name: subName,
          total: subData.total,
          hours: lifeEnergyStore.toCost(subData.total),
          bills: subData.bills.sort((a, b) => (b.amount || 0) - (a.amount || 0)),
          takeHomePct: takeHome > 0 ? Math.round((subData.total / takeHome) * 100) : null
        }))
        .sort((a, b) => b.total - a.total)
    }))
    .sort((a, b) => b.total - a.total)
})

// Actions
function toggleAutomatic(bill) {
  billsStore.editBill(bill.id, { automatic: !bill.automatic })
}
function markBillAsPaid(bill) {
  billsStore.markAsPaid(bill.id, bill.amount, selectedMonth.value)
}
function markBillAsUnpaid(bill) {
  billsStore.markAsUnpaid(bill.id, selectedMonth.value)
}
function editBill(bill) {
  editingBill.value = bill
}
function promptArchive(bill) {
  archivingBill.value = bill
  showArchiveModal.value = true
}
function confirmArchive() {
  if (archivingBill.value) {
    billsStore.archiveBill(archivingBill.value.id)
  }
  showArchiveModal.value = false
  archivingBill.value = null
}
function restoreBill(bill) {
  billsStore.restoreArchivedBill(bill.id)
}
function undoAction() {
  if (confirm('Undo the last action? This will restore the previous state.')) {
    billsStore.undo()
  }
}
function closeModal() {
  showAddModal.value = false
  editingBill.value = null
}
function handleBillSaved() {
  billsStore.updateBillStatuses()
}
</script>
