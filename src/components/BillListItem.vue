<!-- Bill List Item Component -->
<template>
  <div class="flex items-center justify-between group">
    <!-- Bill Info -->
    <div class="flex-1 min-w-0">
      <div class="flex flex-col">
        <div class="flex items-center w-full space-x-3">
          <div class="flex-shrink-0">
            <div :class="[
              'w-10 h-10 rounded-xl flex items-center justify-center shadow-sm',
              paid ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'
            ]">
              <svg v-if="paid" class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <svg v-else class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div class="flex-1 min-w-0 flex items-center">
            <h3 class="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors duration-200" style="max-width: 100%;">
              {{ bill.name }}
            </h3>
          </div>
          <span
            :class="[
              'ml-2 px-3 py-1 text-xs font-bold rounded-full shadow-sm',
              paid ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
            ]"
          >
            {{ paid ? 'PAID' : 'UNPAID' }}
          </span>
        </div>
        <div class="mt-2 flex items-center justify-between w-full text-sm text-gray-600">
          <div class="flex flex-wrap items-center gap-3">
            <div class="flex items-center space-x-1">
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span class="font-medium">{{ formatDate(dueDate) }}</span>
            </div>
            <div class="flex items-center space-x-1">
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <span class="font-bold text-gray-900">{{ formatCurrency(amount || 0) }}</span>
            </div>
            <div v-if="paymentCount > 0" class="flex items-center space-x-1">
              <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="text-green-600 font-medium">
                Paid {{ paymentCount }} time{{ paymentCount > 1 ? 's' : '' }}
              </span>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <!-- Mark as Paid/Unpaid Button -->
            <button
              v-if="!paid"
              @click="$emit('mark-paid', bill)"
              class="px-4 py-2 text-sm font-semibold text-green-700 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 hover:border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 shadow-sm"
            >
              <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Mark Paid
            </button>
            <button
              v-else
              @click="$emit('mark-unpaid', bill)"
              class="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 shadow-sm"
            >
              <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Mark Unpaid
            </button>
            <!-- Edit Button -->
            <button
              @click="$emit('edit', bill)"
              class="p-2 text-gray-400 bg-gray-50 border border-gray-200 rounded-xl hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 shadow-sm"
              title="Edit"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
            <!-- Delete Button -->
            <button
              @click="$emit('delete', bill)"
              class="p-2 text-gray-400 bg-gray-50 border border-gray-200 rounded-xl hover:text-red-600 hover:bg-red-50 hover:border-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 shadow-sm"
              title="Delete"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
        <p v-if="bill.notes" class="mt-2 text-sm text-gray-500 italic truncate">
          "{{ bill.notes }}"
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  bill: {
    type: Object,
    required: true
  },
  paid: {
    type: Boolean,
    required: true
  },
  dueDate: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentCount: {
    type: Number,
    required: true
  }
})

defineEmits(['edit', 'delete', 'mark-paid', 'mark-unpaid'])

// Status styling
const statusClasses = {
  'PAID': 'bg-green-100 text-green-800',
  'UNPAID': 'bg-red-100 text-red-800',
  'UPCOMING': 'bg-blue-100 text-blue-800'
}

// Utility functions
const formatDate = (date) => {
  // Display the date as entered (YYYY-MM-DD) without time zone conversion
  if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = date.split('-')
    return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
  // Fallback for other formats
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}
</script> 