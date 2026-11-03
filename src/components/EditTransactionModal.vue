<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
    <div class="bg-white rounded-lg p-6 w-full max-w-md">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold">Edit Transaction</h2>
        <button @click="closeModal" class="text-gray-500 hover:text-gray-700">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Date</label>
          <input
            type="date"
            v-model="form.date"
            required
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Description</label>
          <input
            type="text"
            v-model="form.description"
            required
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Category</label>
          <CategorySelectModal
            v-model:isOpen="showCategorySelect"
            @category-selected="handleCategorySelected"
          />
          <button
            type="button"
            @click="showCategorySelect = true"
            class="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-left shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {{ selectedCategory || 'Select Category' }}
          </button>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Amount</label>
          <input
            type="number"
            v-model="form.amount"
            required
            min="0.01"
            step="0.01"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Type</label>
          <div class="mt-1 flex space-x-4">
            <label class="inline-flex items-center">
              <input
                type="radio"
                v-model="form.isIncome"
                :value="true"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <span class="ml-2">Income</span>
            </label>
            <label class="inline-flex items-center">
              <input
                type="radio"
                v-model="form.isIncome"
                :value="false"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <span class="ml-2">Expense</span>
            </label>
          </div>
        </div>

        <div class="flex justify-end space-x-3">
          <button
            type="button"
            @click="closeModal"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="!isFormValid"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useTransactionsStore } from '../stores/transactions'
import CategorySelectModal from './CategorySelectModal.vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  transaction: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:isOpen', 'transaction-updated'])

const transactionsStore = useTransactionsStore()

const form = ref({
  date: '',
  description: '',
  category: '',
  amount: '',
  isIncome: false
})

const showCategorySelect = ref(false)
const selectedCategory = ref('')

const isFormValid = computed(() => {
  return (
    form.value.date &&
    form.value.description &&
    form.value.category &&
    form.value.amount &&
    form.value.amount > 0
  )
})

// Update form when transaction prop changes
watch(() => props.transaction, (newTransaction) => {
  if (newTransaction) {
    form.value = {
      date: newTransaction.date,
      description: newTransaction.description,
      category: newTransaction.category,
      amount: Math.abs(newTransaction.amount),
      isIncome: newTransaction.amount > 0
    }
    selectedCategory.value = newTransaction.category
  }
}, { immediate: true })

const handleCategorySelected = (category) => {
  selectedCategory.value = category
  form.value.category = category
  showCategorySelect.value = false
}

const handleSubmit = () => {
  if (!isFormValid.value) return

  const updates = {
    ...form.value,
    amount: form.value.isIncome ? parseFloat(form.value.amount) : -parseFloat(form.value.amount),
    category: selectedCategory.value
  }

  if (transactionsStore.editTransaction(props.transaction.id, updates)) {
    emit('transaction-updated')
    closeModal()
  }
}

const closeModal = () => {
  emit('update:isOpen', false)
  // Reset form
  form.value = {
    date: '',
    description: '',
    category: '',
    amount: '',
    isIncome: false
  }
  selectedCategory.value = ''
}
</script> 