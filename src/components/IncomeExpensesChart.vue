<template>
  <div class="h-full">
    <div class="h-[300px] mb-8">
      <Line v-if="chartData.labels.length > 0" :data="chartData" :options="chartOptions" />
      <div v-else class="h-full flex items-center justify-center text-gray-500">
        No data available for the selected period
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const props = defineProps({
  monthlyData: {
    type: Array,
    required: true,
    default: () => []
  }
})

const chartData = computed(() => {
  if (!props.monthlyData || props.monthlyData.length === 0) {
    return { labels: [], datasets: [] }
  }

  // Format months for display
  const labels = props.monthlyData.map(item => {
    const date = new Date(item.date)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      year: 'numeric'
    }).format(date)
  })

  const incomeData = props.monthlyData.map(item => item.income)
  const expenseData = props.monthlyData.map(item => Math.abs(item.expenses))

  return {
    labels,
    datasets: [
      {
        label: 'Income',
        data: incomeData,
        borderColor: '#10B981', // Green
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Expenses',
        data: expenseData,
        borderColor: '#EF4444', // Red
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 1000,
        callback: (value) => {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(value)
        }
      }
    }
  },
  plugins: {
    tooltip: {
      callbacks: {
        label: (context) => {
          const value = context.raw
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }).format(value)
        }
      }
    }
  }
}
</script> 