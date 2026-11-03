<template>
  <div v-if="isOpen" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
    <div class="relative bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-xl font-semibold text-gray-900">Select Category</h3>
        <button @click="close" class="text-gray-400 hover:text-gray-500">
          <span class="sr-only">Close</span>
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">Main Category</label>
        <select 
          v-model="selectedMainCategory"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Select a category</option>
          <option v-for="category in mainCategories" :key="category" :value="category">
            {{ category }}
          </option>
        </select>
      </div>

      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
        <select 
          v-model="selectedSubcategory"
          :disabled="!selectedMainCategory"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Select a subcategory</option>
          <option v-for="subcategory in subcategories" :key="subcategory" :value="subcategory">
            {{ subcategory }}
          </option>
        </select>
      </div>

      <div class="flex justify-end space-x-3">
        <button 
          @click="close"
          class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button 
          @click="confirm"
          :disabled="!isValid"
          class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Select
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useCategoriesStore } from '../stores/categories'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:isOpen', 'category-selected'])

const categoriesStore = useCategoriesStore()
const selectedMainCategory = ref('')
const selectedSubcategory = ref('')

// Get main categories from store
const mainCategories = computed(() => categoriesStore.getMainCategories)

// Get subcategories for selected main category
const subcategories = computed(() => {
  if (!selectedMainCategory.value) return []
  return categoriesStore.getSubcategories(selectedMainCategory.value)
})

// Check if selection is valid
const isValid = computed(() => 
  selectedMainCategory.value && 
  selectedSubcategory.value && 
  categoriesStore.validateCategory(`${selectedMainCategory.value} - ${selectedSubcategory.value}`)
)

// Reset selection
const resetSelection = () => {
  selectedMainCategory.value = ''
  selectedSubcategory.value = ''
}

// Close modal
const close = () => {
  resetSelection()
  emit('update:isOpen', false)
}

// Confirm selection
const confirm = () => {
  if (!isValid.value) return
  
  emit(
    'category-selected',
    `${String(selectedMainCategory.value).trim()} - ${String(selectedSubcategory.value).trim()}`
  )
  close()
}

// Watch for main category changes to reset subcategory
watch(selectedMainCategory, () => {
  selectedSubcategory.value = ''
})
</script> 