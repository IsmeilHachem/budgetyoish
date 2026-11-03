<template>
  <div class="min-h-screen bg-slate-950">
    <div class="container mx-auto px-4 py-8">
      <!-- Header Section -->
      <div class="bg-gradient-to-br from-amber-950 to-slate-900 rounded-2xl shadow-xl p-8 mb-8 border border-amber-900">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-6 flex-wrap">
          <div>
            <h1 class="text-4xl font-bold text-white">
              Category Spending
            </h1>
            <p class="text-slate-300 mt-2 text-lg">Track and reflect on your spending by category</p>
          </div>
          <div class="flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-center w-full md:w-auto">
            <div class="relative">
              <label class="block text-sm font-semibold text-slate-300 mb-2">Select Month</label>
              <input
                type="month"
                v-model="selectedMonth"
                class="px-4 py-3 border border-slate-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-slate-800 text-slate-100 transition-all duration-200 hover:shadow-md"
              />
            </div>
            <div class="flex gap-2">
              <button
                @click="undo"
                :disabled="!categoriesStore.canUndo"
                class="px-4 py-3 text-gray-600 bg-gray-100 border border-gray-300 rounded-xl hover:bg-gray-200 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                title="Undo last action"
              >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
              <button
                @click="redo"
                :disabled="!categoriesStore.canRedo"
                class="px-4 py-3 text-gray-600 bg-gray-100 border border-gray-300 rounded-xl hover:bg-gray-200 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                title="Redo last action"
              >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10H11a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Income Section -->
      <div v-if="incomeCategories.length > 0" class="mb-8">
        <div class="flex items-center gap-2 mb-4">
          <span class="w-2 h-2 bg-emerald-500 rounded-full"></span>
          <h2 class="text-sm font-bold text-emerald-400 uppercase tracking-widest">Income</h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <div
            v-for="mainCategory in incomeCategories"
            :key="mainCategory"
            class="bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-700 border-l-4 border-l-emerald-500 flex flex-col h-full hover:shadow-2xl transition-all duration-300"
          >
            <!-- Header -->
            <div class="flex justify-between items-center mb-6">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h2 class="text-xl font-bold text-slate-100">{{ mainCategory }}</h2>
              </div>
              <div class="flex space-x-2">
                <button @click="editMainCategory(mainCategory)" class="p-2 text-slate-400 bg-slate-700 border border-slate-600 rounded-lg hover:text-blue-400 hover:bg-blue-950/40 hover:border-blue-600 transition-all duration-200" title="Edit category">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button @click="deleteMainCategory(mainCategory)" class="p-2 text-slate-400 bg-slate-700 border border-slate-600 rounded-lg hover:text-red-400 hover:bg-red-950/40 hover:border-red-600 transition-all duration-200" title="Delete category">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Subheaders -->
            <div class="grid grid-cols-2 font-semibold mb-4 text-slate-400 text-sm">
              <div class="text-left">Subcategory</div>
              <div class="text-right">Amount</div>
            </div>

            <!-- Subcategories -->
            <div class="flex-1">
              <div class="space-y-3">
                <div
                  v-for="subcategory in categoriesStore.getSubcategories(mainCategory)"
                  :key="subcategory"
                  class="flex justify-between items-start p-3 bg-slate-700/50 rounded-xl transition-colors duration-200"
                >
                  <div class="flex items-center space-x-2">
                    <span class="text-slate-200 font-medium">{{ subcategory }}</span>
                    <button @click="editSubcategory(mainCategory, subcategory)" class="p-1 text-gray-400 hover:text-blue-600 transition-colors duration-200" title="Edit subcategory">
                      <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                  <div class="flex items-start space-x-3">
                    <div class="text-right">
                      <div class="text-gray-900 font-semibold">{{ formatCurrency(Math.abs(getCategoryAmount(mainCategory, subcategory))) }}</div>
                      <div v-if="lifeEnergyStore.lifeEnergyRate > 0 && getCategoryAmount(mainCategory, subcategory) !== 0" class="text-xs text-gray-400">
                        ≈ {{ lifeEnergyStore.toCost(getCategoryAmount(mainCategory, subcategory)) }}
                      </div>
                    </div>
                    <button @click="deleteSubcategory(mainCategory, subcategory)" class="p-1 text-gray-400 hover:text-red-600 transition-colors duration-200 mt-0.5" title="Delete subcategory">
                      <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <button @click="addSubcategory(mainCategory)" class="w-full mt-4 px-4 py-2 text-sm text-emerald-400 bg-emerald-950/30 border border-emerald-700 rounded-xl hover:bg-emerald-950/50 hover:border-emerald-600 transition-all duration-200 font-medium">
                <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Subcategory
              </button>
            </div>

            <!-- Total -->
            <div class="border-t border-slate-600 pt-4 mt-4">
              <div class="flex justify-between items-start">
                <span class="font-bold text-slate-100">Total</span>
                <div class="text-right">
                  <div class="font-bold text-green-600 text-lg">{{ formatCurrency(Math.abs(getCategoryTotal(mainCategory))) }}</div>
                  <div v-if="lifeEnergyStore.lifeEnergyRate > 0" class="text-xs text-gray-400">
                    ≈ {{ lifeEnergyStore.toCost(getCategoryTotal(mainCategory)) }} of life energy
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Spending Section -->
      <div v-if="spendingCategories.length > 0" class="mb-8">
        <div class="flex items-center gap-2 mb-4">
          <span class="w-2 h-2 bg-amber-500 rounded-full"></span>
          <h2 class="text-sm font-bold text-amber-400 uppercase tracking-widest">Spending</h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <div
            v-for="mainCategory in spendingCategories"
            :key="mainCategory"
            class="rounded-2xl shadow-xl p-6 border border-l-4 flex flex-col h-full hover:shadow-2xl transition-all duration-300"
            :class="{
              'bg-amber-950/30 border-amber-700 border-l-amber-500': reflectionsStore.getRating(mainCategory)?.rating === 3,
              'bg-green-950/20 border-green-900 border-l-green-500': reflectionsStore.getRating(mainCategory)?.rating === 2,
              'bg-blue-950/20 border-blue-900 border-l-blue-500':  reflectionsStore.getRating(mainCategory)?.rating === 1,
              'bg-slate-800 border-slate-700 border-l-slate-600':  !reflectionsStore.getRating(mainCategory)
            }"
          >
            <!-- Header -->
            <div class="flex justify-between items-start mb-6">
              <div class="flex items-start space-x-3 min-w-0">
                <div class="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div class="min-w-0">
                  <h2 class="text-xl font-bold text-slate-100 flex items-center gap-2 flex-wrap">
                    {{ mainCategory }}
                    <span
                      v-if="reflectionsStore.getRating(mainCategory)"
                      :class="[
                        'inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold',
                        reflectionsStore.getRating(mainCategory).rating === 1 ? 'bg-blue-900/50 text-blue-400' :
                        reflectionsStore.getRating(mainCategory).rating === 2 ? 'bg-green-900/50 text-green-400' :
                        'bg-amber-900/50 text-amber-400'
                      ]"
                      :title="reflectionsStore.getRating(mainCategory).rating === 1 ? 'Too little' : reflectionsStore.getRating(mainCategory).rating === 2 ? 'Just right' : 'Too much'"
                    >
                      {{ reflectionsStore.getRating(mainCategory).rating === 1 ? '↓' : reflectionsStore.getRating(mainCategory).rating === 2 ? '✓' : '⚠' }}
                    </span>
                  </h2>
                  <!-- MoM trend -->
                  <div v-if="getCategoryTrend(mainCategory)" class="text-xs mt-0.5 font-medium"
                       :class="getCategoryTrend(mainCategory).dir === 'up' ? 'text-red-500' : 'text-green-600'">
                    {{ getCategoryTrend(mainCategory).dir === 'up' ? '↑' : '↓' }}
                    {{ formatCurrency(getCategoryTrend(mainCategory).diff) }} vs last month
                  </div>
                </div>
              </div>
              <div class="flex space-x-2 shrink-0">
                <button @click="editMainCategory(mainCategory)" class="p-2 text-slate-400 bg-slate-700/50 border border-slate-600 rounded-lg hover:text-blue-400 hover:bg-blue-950/40 hover:border-blue-600 transition-all duration-200" title="Edit category">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button @click="deleteMainCategory(mainCategory)" class="p-2 text-slate-400 bg-slate-700/50 border border-slate-600 rounded-lg hover:text-red-400 hover:bg-red-950/40 hover:border-red-600 transition-all duration-200" title="Delete category">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Subheaders -->
            <div class="grid grid-cols-2 font-semibold mb-4 text-slate-400 text-sm">
              <div class="text-left">Subcategory</div>
              <div class="text-right">Amount</div>
            </div>

            <!-- Subcategories -->
            <div class="flex-1">
              <div class="space-y-3">
                <div
                  v-for="subcategory in categoriesStore.getSubcategories(mainCategory)"
                  :key="subcategory"
                  class="flex justify-between items-start p-3 bg-slate-700/40 rounded-xl transition-colors duration-200"
                >
                  <div class="flex items-center space-x-2">
                    <span class="text-slate-200 font-medium">{{ subcategory }}</span>
                    <button @click="editSubcategory(mainCategory, subcategory)" class="p-1 text-gray-400 hover:text-blue-600 transition-colors duration-200" title="Edit subcategory">
                      <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                  <div class="flex items-start space-x-3">
                    <div class="text-right">
                      <div class="text-gray-900 font-semibold">{{ formatCurrency(Math.abs(getCategoryAmount(mainCategory, subcategory))) }}</div>
                      <div v-if="lifeEnergyStore.lifeEnergyRate > 0 && getCategoryAmount(mainCategory, subcategory) !== 0" class="text-xs text-gray-400">
                        ≈ {{ lifeEnergyStore.toCost(getCategoryAmount(mainCategory, subcategory)) }}
                      </div>
                    </div>
                    <button @click="deleteSubcategory(mainCategory, subcategory)" class="p-1 text-gray-400 hover:text-red-600 transition-colors duration-200 mt-0.5" title="Delete subcategory">
                      <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <button @click="addSubcategory(mainCategory)" class="w-full mt-4 px-4 py-2 text-sm text-amber-400 bg-amber-950/30 border border-amber-700 rounded-xl hover:bg-amber-950/50 hover:border-amber-600 transition-all duration-200 font-medium">
                <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Subcategory
              </button>
            </div>

            <!-- Total -->
            <div :class="[categoriesStore.getSubcategories(mainCategory).length > 1 ? 'pt-6 mt-6' : 'pt-2 mt-2', 'border-t border-slate-600']">
              <div class="flex justify-between items-start">
                <span class="font-bold text-slate-100">Total</span>
                <div class="text-right">
                  <div class="font-bold text-blue-600 text-lg">{{ formatCurrency(Math.abs(getCategoryTotal(mainCategory))) }}</div>
                  <div v-if="lifeEnergyStore.lifeEnergyRate > 0" class="text-xs text-gray-400">
                    ≈ {{ lifeEnergyStore.toCost(getCategoryTotal(mainCategory)) }} of life energy
                  </div>
                </div>
              </div>
              <!-- 3-month rolling average + trend -->
              <div v-if="categoryThreeMonthAvgs[mainCategory] !== null" class="mt-2 flex items-center justify-between gap-2">
                <span class="text-xs text-gray-400">
                  3-month avg: {{ formatCurrency(categoryThreeMonthAvgs[mainCategory]) }}/mo<template v-if="lifeEnergyStore.lifeEnergyRate > 0"> · ≈ {{ lifeEnergyStore.toCost(categoryThreeMonthAvgs[mainCategory]) }}</template>
                </span>
                <span v-if="categoryAvgTrends[mainCategory] === 'above'" class="text-xs text-amber-500 font-medium shrink-0">↑ above avg</span>
                <span v-else-if="categoryAvgTrends[mainCategory] === 'below'" class="text-xs text-green-500 font-medium shrink-0">↓ below avg</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Manage Categories (collapsible, bottom) -->
      <div class="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 mb-8 overflow-hidden">
        <button
          @click="manageOpen = !manageOpen"
          class="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-700/50 transition-colors duration-200"
        >
          <div class="flex items-center gap-3">
            <div class="w-7 h-7 bg-slate-700 rounded-lg flex items-center justify-center">
              <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span class="text-sm font-semibold text-slate-300">Manage Categories</span>
          </div>
          <svg class="w-4 h-4 text-slate-400 transition-transform duration-200" :class="manageOpen ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div v-if="manageOpen" class="px-6 pb-6 border-t border-slate-700 pt-4">
          <CategoryActions />
        </div>
      </div>

      <!-- Edit Category Modal -->
      <div v-if="showEditModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
        <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-gray-100">
          <div class="flex items-center space-x-3 mb-6">
            <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-900">
              {{ isEditingSubcategory ? 'Edit Subcategory' : 'Edit Category' }}
            </h3>
          </div>
          <input
            v-model="editName"
            type="text"
            class="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            :placeholder="isEditingSubcategory ? 'New subcategory name' : 'New category name'"
          >
          <div class="mt-6 flex justify-end space-x-4">
            <button @click="cancelEdit" class="px-6 py-3 text-gray-700 bg-gray-100 border border-gray-300 rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200">Cancel</button>
            <button @click="confirmEdit" class="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform transition-all duration-200 hover:scale-105 shadow-lg">Save Changes</button>
          </div>
        </div>
      </div>

      <!-- Add Subcategory Modal -->
      <div v-if="showAddSubcategoryModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
        <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-gray-100">
          <div class="flex items-center space-x-3 mb-6">
            <div class="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-900">Add Subcategory to {{ categoryToAddSubcategory }}</h3>
          </div>
          <input
            v-model="newSubcategoryName"
            type="text"
            class="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            placeholder="Enter subcategory name"
          >
          <div class="mt-6 flex justify-end space-x-4">
            <button @click="cancelAddSubcategory" class="px-6 py-3 text-gray-700 bg-gray-100 border border-gray-300 rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200">Cancel</button>
            <button @click="confirmAddSubcategory" class="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transform transition-all duration-200 hover:scale-105 shadow-lg">Add Subcategory</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useCategoriesStore } from '../stores/categories'
import CategoryActions from '../components/CategoryActions.vue'
import { useTransactionsStore } from '../stores/transactions'
import { useAuthStore } from '../stores/auth'
import { useCategoryReflectionsStore } from '../stores/categoryReflections'
import { useLifeEnergyStore } from '../stores/lifeEnergy'
import { parseESTDate } from '@/utils/dateUtils'

const categoriesStore = useCategoriesStore()
const transactionsStore = useTransactionsStore()
const authStore = useAuthStore()
const reflectionsStore = useCategoryReflectionsStore()
const lifeEnergyStore = useLifeEnergyStore()

// Month picker state
const now = new Date()
const selectedMonth = ref(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)

// Manage section toggle
const manageOpen = ref(false)

// Load transactions, reflections, and life energy when auth is ready
watch(
  () => authStore.isLoggedIn,
  async (loggedIn) => {
    if (loggedIn) {
      if (transactionsStore.transactions.length === 0) {
        await transactionsStore.loadFromSupabase()
      }
      await reflectionsStore.loadForMonth(selectedMonth.value)
      await lifeEnergyStore.loadFromSupabase()
    }
  },
  { immediate: true }
)

// Reload reflections whenever the month changes
watch(selectedMonth, async (newMonth) => {
  if (authStore.isLoggedIn) {
    await reflectionsStore.loadForMonth(newMonth)
  }
})

// Helper: Filter transactions for a given month string
function getMonthTransactions(transactions, monthStr) {
  if (!Array.isArray(transactions) || !monthStr) return []
  const [year, month] = monthStr.split('-').map(Number)
  if (!year || !month) return []
  return transactions.filter(t => {
    const d = new Date(t.date)
    return d.getFullYear() === year && d.getMonth() + 1 === month
  })
}

// Helper: Get amount for a subcategory in the selected month
const getCategoryAmount = (mainCategory, subcategory) => {
  const monthTx = getMonthTransactions(transactionsStore.getTransactions || [], selectedMonth.value)
  return monthTx
    .filter(t => {
      if (!t.category) return false
      const parts = t.category.split(' - ')
      return parts[0] === mainCategory && parts[1] === subcategory
    })
    .reduce((sum, t) => sum + t.amount, 0)
}

// Helper: Get total for a main category in a given month
const getCategoryTotalForMonth = (mainCategory, monthStr) => {
  const monthTx = getMonthTransactions(transactionsStore.getTransactions || [], monthStr)
  return monthTx
    .filter(t => t.category && t.category.split(' - ')[0] === mainCategory)
    .reduce((sum, t) => sum + t.amount, 0)
}

const getCategoryTotal = (mainCategory) => getCategoryTotalForMonth(mainCategory, selectedMonth.value)

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

// Pre-compute 3-month averages for all spending categories
const categoryThreeMonthAvgs = computed(() => {
  const txs = transactionsStore.getTransactions || []
  const map = {}
  for (const cat of spendingCategories.value) {
    map[cat] = getThreeMonthAvg(cat, txs, selectedMonth.value)
  }
  return map
})

// Pre-compute avg-vs-current trend for each spending category
const categoryAvgTrends = computed(() => {
  const map = {}
  for (const cat of spendingCategories.value) {
    const avg = categoryThreeMonthAvgs.value[cat]
    if (!avg) { map[cat] = null; continue }
    const curr = Math.abs(getCategoryTotal(cat))
    const pct = ((curr - avg) / avg) * 100
    map[cat] = pct > 10 ? 'above' : pct < -10 ? 'below' : null
  }
  return map
})

// Previous month string
const prevMonth = computed(() => {
  const [y, m] = selectedMonth.value.split('-').map(Number)
  const d = new Date(y, m - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
})

// MoM trend: >5% change shows indicator
const getCategoryTrend = (mainCategory) => {
  const curr = Math.abs(getCategoryTotal(mainCategory))
  const prev = Math.abs(getCategoryTotalForMonth(mainCategory, prevMonth.value))
  if (prev === 0) return null
  const pct = ((curr - prev) / prev) * 100
  if (pct > 5)  return { dir: 'up',   diff: curr - prev }
  if (pct < -5) return { dir: 'down', diff: prev - curr }
  return null
}

// Income categories: named "Pay Day" OR all transactions positive
const incomeCategories = computed(() => {
  const allCategories = categoriesStore.getMainCategories || []
  const monthTx = getMonthTransactions(transactionsStore.getTransactions || [], selectedMonth.value)
  return allCategories.filter(cat => {
    if (cat === 'Pay Day') return true
    const catTx = monthTx.filter(t => t.category && t.category.split(' - ')[0] === cat)
    if (catTx.length === 0) return false
    return catTx.every(t => t.amount > 0)
  })
})

// Spending categories sorted by fulfillment rating
// Order: 3 (Too much) → unrated → 2 (Just right) → 1 (Too little)
const ratingOrder = { 3: 0, 2: 2, 1: 3 }
const spendingCategories = computed(() => {
  const incomeSet = new Set(incomeCategories.value)
  return (categoriesStore.getMainCategories || [])
    .filter(cat => !incomeSet.has(cat))
    .slice()
    .sort((a, b) => {
      const rA = reflectionsStore.getRating(a)?.rating ?? null
      const rB = reflectionsStore.getRating(b)?.rating ?? null
      const oA = rA !== null ? (ratingOrder[rA] ?? 1) : 1
      const oB = rB !== null ? (ratingOrder[rB] ?? 1) : 1
      return oA - oB
    })
})

// Format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

// Initialize categories store on mount
onMounted(async () => {
  if (!categoriesStore.initialized) {
    await categoriesStore.initialize()
  }
})

// Edit category modal state
const showEditModal = ref(false)
const editName = ref('')
const categoryToEdit = ref('')
const subcategoryToEdit = ref('')
const isEditingSubcategory = ref(false)

// Add subcategory modal state
const showAddSubcategoryModal = ref(false)
const categoryToAddSubcategory = ref('')
const newSubcategoryName = ref('')

const editMainCategory = (category) => {
  categoryToEdit.value = category
  editName.value = category
  isEditingSubcategory.value = false
  showEditModal.value = true
}

const editSubcategory = (mainCategory, subcategory) => {
  categoryToEdit.value = mainCategory
  subcategoryToEdit.value = subcategory
  editName.value = subcategory
  isEditingSubcategory.value = true
  showEditModal.value = true
}

const cancelEdit = () => {
  showEditModal.value = false
  editName.value = ''
  categoryToEdit.value = ''
  subcategoryToEdit.value = ''
  isEditingSubcategory.value = false
}

const confirmEdit = () => {
  if (editName.value) {
    if (isEditingSubcategory.value) {
      if (editName.value !== subcategoryToEdit.value) {
        categoriesStore.editSubcategory(categoryToEdit.value, subcategoryToEdit.value, editName.value)
      }
    } else {
      if (editName.value !== categoryToEdit.value) {
        categoriesStore.editMainCategory(categoryToEdit.value, editName.value)
      }
    }
  }
  cancelEdit()
}

const deleteMainCategory = async (category) => {
  if (await confirm(`Are you sure you want to delete the category "${category}" and all its subcategories?`)) {
    categoriesStore.deleteMainCategory(category)
  }
}

const deleteSubcategory = async (mainCategory, subcategory) => {
  if (await confirm(`Are you sure you want to delete the subcategory "${subcategory}"?`)) {
    categoriesStore.deleteSubcategory(mainCategory, subcategory)
  }
}

const addSubcategory = (mainCategory) => {
  categoryToAddSubcategory.value = mainCategory
  newSubcategoryName.value = ''
  showAddSubcategoryModal.value = true
}

const cancelAddSubcategory = () => {
  showAddSubcategoryModal.value = false
  categoryToAddSubcategory.value = ''
  newSubcategoryName.value = ''
}

const confirmAddSubcategory = () => {
  if (newSubcategoryName.value) {
    categoriesStore.addSubcategory(categoryToAddSubcategory.value, newSubcategoryName.value)
  }
  cancelAddSubcategory()
}

const undo = () => categoriesStore.undo()
const redo = () => categoriesStore.redo()
</script>
