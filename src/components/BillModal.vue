<!-- Bill Modal Component -->
<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 border border-gray-100 transform transition-all duration-300 scale-100">
      <!-- Header -->
      <div class="bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-2xl p-6 text-white">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 class="text-2xl font-bold">{{ isEditing ? 'Edit Bill' : 'Add New Bill' }}</h2>
        </div>
      </div>
      
      <!-- Form Content -->
      <div class="p-6">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Bill Name -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Bill Name
            </label>
            <input
              v-model="form.name"
              type="text"
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:shadow-md"
              placeholder="Enter bill name"
            />
          </div>

          <!-- Due Date -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Due Date
            </label>
            <input
              v-model="form.dueDate"
              type="date"
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:shadow-md"
            />
          </div>

          <!-- Amount -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              Amount
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span class="text-gray-500 font-semibold">$</span>
              </div>
              <input
                v-model="form.amount"
                type="number"
                step="0.01"
                min="0"
                @input="handleAmountInput"
                class="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:shadow-md"
                placeholder="0.00 (Optional)"
              />
            </div>
          </div>

          <!-- Category -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Category
            </label>
            <select
              v-model="form.mainCategory"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:shadow-md mb-3"
            >
              <option value="">Select Main Category</option>
              <option v-for="category in categories" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
            
            <select
              v-if="form.mainCategory"
              v-model="form.subcategory"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:shadow-md"
            >
              <option value="">Select Subcategory</option>
              <option v-for="subcategory in subcategories" :key="subcategory" :value="subcategory">
                {{ subcategory }}
              </option>
            </select>
          </div>

          <!-- Notes -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Notes (Optional)
            </label>
            <textarea
              v-model="form.notes"
              rows="3"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:shadow-md resize-none"
              placeholder="Add any notes about this bill..."
            ></textarea>
          </div>

          <!-- Autopay toggle -->
          <div>
            <label class="flex items-center gap-3 cursor-pointer">
              <input
                v-model="form.automatic"
                type="checkbox"
                class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span class="block text-sm font-semibold text-gray-700">Autopay / Automatic</span>
                <span class="block text-xs text-gray-500">This bill pays automatically</span>
              </div>
            </label>
          </div>

          <!-- Action Buttons -->
          <div class="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              @click="$emit('close')"
              class="px-6 py-3 text-gray-700 bg-gray-100 border border-gray-300 rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="!isFormValid"
              class="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              {{ isEditing ? 'Save Changes' : 'Add Bill' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useBillsStore } from '@/stores/bills'
import { useCategoriesStore } from '@/stores/categories'

const props = defineProps({
  bill: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'saved'])

const billsStore = useBillsStore()
const categoriesStore = useCategoriesStore()
const isEditing = computed(() => !!props.bill)

// Form state
const form = ref({
  name: '',
  dueDate: '',
  amount: null,
  mainCategory: '',
  subcategory: '',
  notes: '',
  automatic: false
})

// Update computed properties
const categories = computed(() => {
  categoriesStore.initialize()
  return categoriesStore.getMainCategories
})

const subcategories = computed(() => {
  if (!form.value.mainCategory) return []
  return categoriesStore.getSubcategories(form.value.mainCategory)
})

// Initialize form if editing
onMounted(() => {
  categoriesStore.initialize()
  billsStore.initialize()
  
  // Set default values
  form.value = {
    name: '',
    dueDate: new Date().toISOString().split('T')[0],
    amount: null,
    mainCategory: '',
    subcategory: '',
    notes: '',
    automatic: false
  }
  
  if (props.bill) {
    // Split category into main and sub if it exists
    let mainCategory = ''
    let subcategory = ''
    if (props.bill.category && props.bill.category.includes(' - ')) {
      [mainCategory, subcategory] = props.bill.category.split(' - ')
    } else {
      mainCategory = props.bill.category || ''
    }

    form.value = {
      name: props.bill.name || '',
      dueDate: props.bill.dueDate || new Date().toISOString().split('T')[0],
      amount: (props.bill.amount !== null && props.bill.amount !== undefined && props.bill.amount !== '') ? props.bill.amount : 0,
      mainCategory,
      subcategory,
      notes: props.bill.notes || '',
      automatic: props.bill.automatic ?? false
    }
  }
})

// Handle amount input to properly handle empty values
const handleAmountInput = (event) => {
  const value = event.target.value
  form.value.amount = value === '' ? null : parseFloat(value)
}

// Form validation
const isFormValid = computed(() => {
  return form.value.name && 
         form.value.name.trim() !== '' && 
         form.value.dueDate && 
         form.value.mainCategory && 
         form.value.mainCategory.trim() !== '' && 
         form.value.subcategory && 
         form.value.subcategory.trim() !== ''
})

// Handle form submission
const handleSubmit = () => {
  if (!isFormValid.value) return

  const billData = {
    name: form.value.name.trim().toLowerCase(),
    dueDate: form.value.dueDate,
    amount: form.value.amount !== null && form.value.amount !== '' ? parseFloat(form.value.amount) : null,
    category: `${form.value.mainCategory.trim()} - ${form.value.subcategory.trim()}`,
    notes: form.value.notes ? form.value.notes.trim() : '',
    automatic: form.value.automatic
  }

  let success
  if (isEditing.value && props.bill) {
    success = billsStore.editBill(props.bill.id, billData)
  } else {
    success = billsStore.addBill(billData)
  }

  if (success) {
    emit('saved')
    emit('close')
  }
}
</script> 