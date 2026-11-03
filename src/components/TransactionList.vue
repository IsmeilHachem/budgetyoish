<template>
  <div class="bg-white rounded-lg shadow">
    <div class="p-4 border-b border-gray-200">
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-medium text-gray-900">Transactions</h3>
        <div class="flex space-x-2">
          <button
            v-if="selectedTransactions.length > 0"
            @click="deleteSelected"
            class="px-3 py-1.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors"
          >
            Delete Selected ({{ selectedTransactions.length }})
          </button>
          <button
            @click="selectAll"
            class="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800"
          >
            {{ allSelected ? 'Deselect All' : 'Select All' }}
          </button>
        </div>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left">
              <input
                type="checkbox"
                :checked="allSelected"
                @change="toggleAllSelection"
                class="rounded text-blue-500 focus:ring-blue-500"
              />
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="transaction in sortedTransactions" :key="transaction.id" 
              :class="[
                'hover:bg-gray-50',
                isFutureTransaction(transaction.date) ? 'bg-green-50 hover:bg-green-100' : ''
              ]">
            <td class="px-4 py-3">
              <input
                type="checkbox"
                v-model="selectedTransactions"
                :value="transaction.id"
                class="rounded text-blue-500 focus:ring-blue-500"
              />
            </td>
            <td class="px-4 py-3 text-sm text-gray-900">{{ formatDate(transaction.date) }}</td>
            <td class="px-4 py-3 text-sm text-gray-900">{{ transaction.description }}</td>
            <td class="px-4 py-3 text-sm text-gray-500">{{ transaction.category }}</td>
            <td class="px-4 py-3 text-sm" :class="transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'">
              {{ formatCurrency(transaction.amount) }}
              <div v-if="lifeEnergyStore.lifeEnergyRate > 0 && transaction.amount < 0" class="text-xs text-gray-400 font-normal mt-0.5">
                ≈ {{ lifeEnergyStore.toCost(transaction.amount) }}
              </div>
            </td>
            <td class="px-4 py-3">
              <button
                @click="editTransaction(transaction)"
                class="text-blue-500 hover:text-blue-700 mr-2"
              >
                Edit
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Confirmation Modal -->
    <div v-if="showDeleteConfirmation" class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Confirm Deletion</h3>
        <p class="text-sm text-gray-500 mb-4">
          Are you sure you want to delete {{ selectedTransactions.length }} transaction(s)? This action cannot be undone.
        </p>
        <div class="flex justify-end space-x-3">
          <button
            @click="showDeleteConfirmation = false"
            class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            @click="confirmDelete"
            class="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-md"
          >
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Edit Transaction</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              v-model="editingTransaction.date"
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              v-model="editingTransaction.description"
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <input
              type="text"
              v-model="editingTransaction.category"
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <input
              type="number"
              v-model="editingTransaction.amount"
              step="0.01"
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
        <div class="flex justify-end space-x-3 mt-6">
          <button
            @click="cancelEdit"
            class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            @click="saveEdit"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useTransactionsStore } from '@/stores/transactions'
import { useLifeEnergyStore } from '@/stores/lifeEnergy'
import { useAuthStore } from '@/stores/auth'
import { watch } from 'vue'
import { parseESTDate, getTodayEST } from '@/utils/dateUtils'

const transactionsStore = useTransactionsStore()
const lifeEnergyStore = useLifeEnergyStore()
const authStore = useAuthStore()

watch(
  () => authStore.isLoggedIn,
  async (loggedIn) => {
    if (loggedIn) {
      await lifeEnergyStore.loadFromSupabase()
    }
  },
  { immediate: true }
)
const selectedTransactions = ref([])
const showDeleteConfirmation = ref(false)
const showEditModal = ref(false)
const editingTransaction = ref({
  id: null,
  date: '',
  description: '',
  category: '',
  amount: 0
})

const sortedTransactions = computed(() => {
  return [...(transactionsStore.getTransactions || [])]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
})

const allSelected = computed(() => {
  return selectedTransactions.value.length === sortedTransactions.value.length
})

function selectAll() {
  if (allSelected.value) {
    selectedTransactions.value = []
  } else {
    selectedTransactions.value = sortedTransactions.value.map(t => t.id)
  }
}

function toggleAllSelection() {
  if (selectedTransactions.value.length === sortedTransactions.value.length) {
    selectedTransactions.value = []
  } else {
    selectedTransactions.value = sortedTransactions.value.map(t => t.id)
  }
}

function deleteSelected() {
  showDeleteConfirmation.value = true
}

function confirmDelete() {
  selectedTransactions.value.forEach(id => {
    transactionsStore.deleteTransaction(id)
  })
  selectedTransactions.value = []
  showDeleteConfirmation.value = false
}

function formatDate(date) {
  const d = new Date(date)
  d.setMinutes(d.getMinutes() + d.getTimezoneOffset())
  return new Intl.DateTimeFormat('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric'
  }).format(d)
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

// Helper function to check if a transaction is in the future (EST timezone)
function isFutureTransaction(dateStr) {
  const transactionDate = parseESTDate(dateStr)
  const todayEST = getTodayEST()
  
  return transactionDate > todayEST
}

function editTransaction(transaction) {
  editingTransaction.value = { ...transaction }
  showEditModal.value = true
}

function cancelEdit() {
  showEditModal.value = false
  editingTransaction.value = {
    id: null,
    date: '',
    description: '',
    category: '',
    amount: 0
  }
}

function saveEdit() {
  if (editingTransaction.value.id) {
    transactionsStore.updateTransaction({
      ...editingTransaction.value,
      amount: Number(editingTransaction.value.amount)
    })
  }
  showEditModal.value = false
  editingTransaction.value = {
    id: null,
    date: '',
    description: '',
    category: '',
    amount: 0
  }
}
</script> 