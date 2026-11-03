<template>
  <div>
    <div v-if="categoryData.length === 0" class="flex items-center justify-center h-64">
      <p class="text-gray-500">No data available for the selected period</p>
    </div>
    <div v-else>
      <div class="w-full h-64">
        <Doughnut
          :data="chartData"
          :options="chartOptions"
          @click="handleChartClick"
        />
      </div>
      <div v-if="selectedCategory" class="mt-4 p-4 bg-gray-50 rounded-lg">
        <div class="flex justify-between items-center mb-4">
          <h4 class="text-lg font-medium text-gray-900">{{ selectedCategory }}</h4>
          <button
            @click="clearSelection"
            class="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear Selection
          </button>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-white p-3 rounded shadow-sm">
            <p class="text-sm text-gray-500">Total Spent</p>
            <p class="text-lg font-medium">{{ formatCurrency(categoryStats[selectedCategory]?.total || 0) }}</p>
          </div>
          <div class="bg-white p-3 rounded shadow-sm">
            <p class="text-sm text-gray-500">Transactions</p>
            <p class="text-lg font-medium">{{ categoryStats[selectedCategory]?.count || 0 }}</p>
          </div>
          <div class="bg-white p-3 rounded shadow-sm">
            <p class="text-sm text-gray-500">Average</p>
            <p class="text-lg font-medium">{{ formatCurrency(categoryStats[selectedCategory]?.average || 0) }}</p>
          </div>
          <div class="bg-white p-3 rounded shadow-sm">
            <p class="text-sm text-gray-500">Highest</p>
            <p class="text-lg font-medium">{{ formatCurrency(categoryStats[selectedCategory]?.highest || 0) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'vue-chartjs'
import { useDashboardStore } from '@/stores/dashboard'

ChartJS.register(ArcElement, Tooltip, Legend)

const dashboardStore = useDashboardStore()
const selectedCategory = ref(null)

const props = defineProps({
  categoryData: {
    type: Array,
    required: true
  }
})

const chartColors = [
  '#3B82F6', // blue-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
  '#6366F1', // indigo-500
  '#14B8A6', // teal-500
]

const chartData = computed(() => ({
  labels: props.categoryData.map(item => item.category),
  datasets: [{
    data: props.categoryData.map(item => Math.abs(item.amount)),
    backgroundColor: chartColors.slice(0, props.categoryData.length),
    borderWidth: 0,
    hoverOffset: 4
  }]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 0 // Disable animations to prevent continuous updates
  },
  plugins: {
    legend: {
      position: 'bottom',
      onClick: (e, legendItem) => {
        selectedCategory.value = legendItem.text
        dashboardStore.setSelectedCategory(legendItem.text)
      }
    },
    tooltip: {
      callbacks: {
        label: (context) => {
          const value = context.raw
          return context.label + ': ' + formatCurrency(value)
        }
      }
    }
  }
}

function handleChartClick(event, elements) {
  if (elements.length > 0) {
    const dataIndex = elements[0].index
    const category = props.categoryData[dataIndex].category
    selectedCategory.value = category
    dashboardStore.setSelectedCategory(category)
  }
}

function clearSelection() {
  selectedCategory.value = null
  dashboardStore.resetFilters()
}

const categoryStats = computed(() => dashboardStore.categoryStats)

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}
</script> 