<template>
  <div>
    <button
      @click="showModal = true"
      class="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors"
    >
      Add Transaction
    </button>

    <!-- Add Transaction Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Add New Transaction</h3>
        <form @submit.prevent="addTransaction" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              v-model="newTransaction.date"
              required
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              v-model="newTransaction.description"
              required
              placeholder="Enter description"
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              v-model="newTransaction.category"
              required
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select a category</option>
              <optgroup label="Income">
                <option 
                  v-for="category in incomeCategories" 
                  :key="category.name"
                  :value="category.name"
                >
                  {{ category.name.split(' - ')[1] || category.name }}
                </option>
              </optgroup>
              <optgroup label="Expenses">
                <option 
                  v-for="category in expenseCategories" 
                  :key="category.name"
                  :value="category.name"
                >
                  {{ category.name.split(' - ')[1] || category.name }}
                </option>
              </optgroup>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
              <input
                type="number"
                v-model="newTransaction.amount"
                required
                step="0.01"
                placeholder="0.00"
                class="w-full pl-7 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <p class="text-sm text-gray-500 mt-1">
              Enter positive number for income, negative for expenses
            </p>
          </div>

          <div class="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              @click="showModal = false"
              class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md"
            >
              Add Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTransactionsStore } from '@/stores/transactions'
import { useCategoriesStore } from '@/stores/categories'
import { getTodayEST } from '@/utils/dateUtils'

const transactionsStore = useTransactionsStore()
const categoriesStore = useCategoriesStore()
const showModal = ref(false)

const newTransaction = ref({
  date: getTodayDateString(), // Use helper function for initial date
  description: '',
  category: '',
  amount: ''
})

// Add helper function to get today's date in YYYY-MM-DD format using EST
function getTodayDateString() {
  const todayEST = getTodayEST()
  const year = todayEST.getFullYear()
  const month = String(todayEST.getMonth() + 1).padStart(2, '0')
  const day = String(todayEST.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const incomeCategories = computed(() => {
  const categories = []
  const mainCategories = ['Income', 'Pay Day']
  mainCategories.forEach(mainCat => {
    if (categoriesStore.categories[mainCat]) {
      categoriesStore.categories[mainCat].forEach(subCat => {
        categories.push({
          name: `${mainCat} - ${subCat}`,
          type: 'income'
        })
      })
    }
  })
  return categories
})

const expenseCategories = computed(() => {
  const categories = []
  const mainCategories = Object.keys(categoriesStore.categories)
    .filter(cat => !['Income', 'Pay Day'].includes(cat))
  
  mainCategories.forEach(mainCat => {
    categoriesStore.categories[mainCat].forEach(subCat => {
      categories.push({
        name: `${mainCat} - ${subCat}`,
        type: 'expense'
      })
    })
  })
  return categories
})

function addTransaction() {
  // Convert amount to number and handle negative values for expenses
  let amount = Number(newTransaction.value.amount)
  
  // Check if the selected category is an expense category
  const isExpense = expenseCategories.value.some(cat => cat.name === newTransaction.value.category)
  if (isExpense && amount > 0) {
    amount = -amount
  }

  // Use the date as-is since it's already in YYYY-MM-DD format
  // The date input provides the date in the user's local timezone, which we want to preserve
  const dateString = newTransaction.value.date

  const transaction = {
    ...newTransaction.value,
    date: dateString,
    amount: amount,
    type: amount >= 0 ? 'Income' : 'Expense'
  }

  const saved = transactionsStore.addTransaction(transaction)
  if (!saved) {
    alert(
      'Transaction was not saved. If storage is full or blocked, free space or export data (this app uses localStorage). Otherwise pick a valid category from Categories and try again.'
    )
    return
  }
  
  // Reset form
  newTransaction.value = {
    date: getTodayDateString(), // Use helper function for reset
    description: '',
    category: '',
    amount: ''
  }
  
  showModal.value = false
}

// Ensure store is initialized
onMounted(() => {
  if (!categoriesStore.initialized) {
    categoriesStore.initialize()
  }
})
</script> 