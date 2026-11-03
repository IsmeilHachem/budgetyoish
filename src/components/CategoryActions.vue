<template>
  <div class="mb-6 flex justify-between items-center">
    <!-- Action Buttons -->
    <div class="space-x-4">
      <button 
        @click="showAddModal = true"
        class="btn btn-primary"
      >
        Add Category
      </button>
      <button 
        @click="showEditModal = true"
        class="btn btn-primary"
      >
        Edit Category
      </button>
      <button 
        @click="showDeleteModal = true"
        class="btn btn-secondary"
      >
        Delete Category
      </button>
      <button 
        @click="exportCategories"
        class="btn btn-primary"
      >
        Export to CSV
      </button>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-bold mb-4">Edit Category</h3>
        
        <!-- Category Selection -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Select Main Category</label>
          <select 
            v-model="selectedMainCategory"
            class="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">Select a category</option>
            <option v-for="category in categoriesStore.getMainCategories" :key="category">
              {{ category }}
            </option>
          </select>
        </div>

        <!-- New Name Input -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">New Name</label>
          <input 
            v-model="newCategoryName"
            type="text"
            class="w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="Enter new name"
          >
        </div>

        <!-- Actions -->
        <div class="flex justify-end space-x-3">
          <button 
            @click="showEditModal = false"
            class="btn btn-secondary"
          >
            Cancel
          </button>
          <button 
            @click="handleEditCategory"
            class="btn btn-primary"
            :disabled="!selectedMainCategory || !newCategoryName"
          >
            Save
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-bold mb-4">Delete Category</h3>
        
        <!-- Main Category Selection -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Select Main Category</label>
          <select 
            v-model="selectedMainCategory"
            class="w-full border border-gray-300 rounded-md px-3 py-2"
            @change="loadSubcategories"
          >
            <option value="">Select a category</option>
            <option v-for="category in categoriesStore.getMainCategories" :key="category">
              {{ category }}
            </option>
          </select>
        </div>

        <!-- Subcategory Selection -->
        <div v-if="selectedMainCategory" class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Select Subcategory (Optional)</label>
          <select 
            v-model="selectedSubcategory"
            class="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">Delete entire category</option>
            <option v-for="subcategory in categoriesStore.getSubcategories(selectedMainCategory)" :key="subcategory">
              {{ subcategory }}
            </option>
          </select>
        </div>

        <!-- Warning Message -->
        <p class="text-red-600 text-sm mb-4">
          {{ selectedSubcategory 
            ? `This will delete the subcategory "${selectedSubcategory}" from "${selectedMainCategory}".`
            : `This will delete the entire category "${selectedMainCategory}" and all its subcategories.`
          }}
        </p>

        <!-- Actions -->
        <div class="flex justify-end space-x-3">
          <button 
            @click="showDeleteModal = false"
            class="btn btn-secondary"
          >
            Cancel
          </button>
          <button 
            @click="handleDelete"
            class="btn btn-primary"
            :disabled="!selectedMainCategory"
          >
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Add Modal -->
    <div v-if="showAddModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-bold mb-4">Add New Category</h3>
        
        <!-- New Category Name Input -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Category Name</label>
          <input 
            v-model="newCategoryName"
            type="text"
            class="w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="Enter category name"
          >
        </div>

        <!-- Initial Subcategory Input -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Initial Subcategory (Optional)</label>
          <input 
            v-model="newSubcategoryName"
            type="text"
            class="w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="Enter subcategory name"
          >
        </div>

        <!-- Actions -->
        <div class="flex justify-end space-x-3">
          <button 
            @click="showAddModal = false"
            class="btn btn-secondary"
          >
            Cancel
          </button>
          <button 
            @click="handleAddCategory"
            class="btn btn-primary"
            :disabled="!newCategoryName"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useCategoriesStore } from '../stores/categories'

const categoriesStore = useCategoriesStore()

// Modal states
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const showAddModal = ref(false)

// Form states
const selectedMainCategory = ref('')
const selectedSubcategory = ref('')
const newCategoryName = ref('')
const newSubcategoryName = ref('')

// Handle category edit
const handleEditCategory = () => {
  if (selectedMainCategory.value && newCategoryName.value) {
    categoriesStore.editMainCategory(selectedMainCategory.value, newCategoryName.value)
    showEditModal.value = false
    selectedMainCategory.value = ''
    newCategoryName.value = ''
  }
}

// Handle category/subcategory deletion
const handleDelete = () => {
  if (selectedMainCategory.value) {
    if (selectedSubcategory.value) {
      categoriesStore.deleteSubcategory(selectedMainCategory.value, selectedSubcategory.value)
    } else {
      categoriesStore.deleteMainCategory(selectedMainCategory.value)
    }
    showDeleteModal.value = false
    selectedMainCategory.value = ''
    selectedSubcategory.value = ''
  }
}

// Export categories to CSV
const exportCategories = () => {
  categoriesStore.exportCategoriesToCSV()
}

// Add new method
const handleAddCategory = () => {
  if (newCategoryName.value) {
    // Add the category with an initial empty subcategories array
    categoriesStore.categories[newCategoryName.value] = []
    
    // If a subcategory was provided, add it
    if (newSubcategoryName.value) {
      categoriesStore.addSubcategory(newCategoryName.value, newSubcategoryName.value)
    }
    
    // Save the state
    categoriesStore.saveState()
    categoriesStore.saveToSupabase()
    
    // Reset and close modal
    showAddModal.value = false
    newCategoryName.value = ''
    newSubcategoryName.value = ''
  }
}

// Reset form when modals close
const resetForm = () => {
  selectedMainCategory.value = ''
  selectedSubcategory.value = ''
  newCategoryName.value = ''
  newSubcategoryName.value = ''
}
</script> 