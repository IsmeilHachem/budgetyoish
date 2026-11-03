<template>
  <div class="bg-white rounded-lg shadow p-4">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-medium text-gray-900">Export Data</h3>
      <div class="flex space-x-2">
        <button
          @click="exportData('csv')"
          class="px-3 py-1.5 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors"
        >
          Export CSV
        </button>
        <button
          @click="exportData('excel')"
          class="px-3 py-1.5 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-md transition-colors"
        >
          Export Excel
        </button>
      </div>
    </div>
    
    <div class="space-y-4">
      <div class="flex items-center space-x-2">
        <input
          type="checkbox"
          id="includeStats"
          v-model="includeStats"
          class="rounded text-blue-500 focus:ring-blue-500"
        />
        <label for="includeStats" class="text-sm text-gray-700">
          Include monthly statistics
        </label>
      </div>
      
      <div class="text-sm text-gray-500">
        <p>Export will include:</p>
        <ul class="list-disc list-inside mt-1 space-y-1">
          <li>All transactions within selected date range</li>
          <li>Category totals and breakdowns</li>
          <li v-if="includeStats">Monthly income/expense statistics</li>
          <li v-if="includeStats">Category usage trends</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import * as XLSX from 'xlsx'

const dashboardStore = useDashboardStore()
const includeStats = ref(true)

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value).replace('$', '') // Remove $ for Excel compatibility
}

function prepareTransactionsData() {
  return dashboardStore.filteredTransactions.map(t => ({
    Date: formatDate(t.date),
    Description: t.description,
    Category: t.category,
    Amount: formatCurrency(t.amount),
    Type: t.amount > 0 ? 'Income' : 'Expense'
  }))
}

function prepareStatsData() {
  if (!includeStats.value) return []

  const monthlyStats = dashboardStore.monthlyTrends.map(m => ({
    Month: new Date(m.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    Income: formatCurrency(m.income),
    Expenses: formatCurrency(Math.abs(m.expenses)),
    'Net Income': formatCurrency(m.income + m.expenses),
    'Categories Used': m.categories,
    Transactions: m.transactions
  }))

  const categoryStats = Object.entries(dashboardStore.categoryStats).map(([category, stats]) => ({
    Category: category,
    'Total Amount': formatCurrency(stats.total),
    'Transaction Count': stats.count,
    'Average Amount': formatCurrency(stats.average),
    'Highest Amount': formatCurrency(stats.highest)
  }))

  return { monthlyStats, categoryStats }
}

function exportData(format) {
  const transactions = prepareTransactionsData()
  const { monthlyStats, categoryStats } = prepareStatsData()
  
  if (format === 'csv') {
    // Export as CSV
    const transactionsCsv = convertToCSV(transactions)
    let fullCsv = 'Transactions\n' + transactionsCsv
    
    if (includeStats.value) {
      fullCsv += '\n\nMonthly Statistics\n' + convertToCSV(monthlyStats)
      fullCsv += '\n\nCategory Statistics\n' + convertToCSV(categoryStats)
    }
    
    downloadFile(fullCsv, 'financial_data.csv', 'text/csv')
  } else {
    // Export as Excel
    const wb = XLSX.utils.book_new()
    
    // Add transactions sheet
    const wsTransactions = XLSX.utils.json_to_sheet(transactions)
    XLSX.utils.book_append_sheet(wb, wsTransactions, 'Transactions')
    
    if (includeStats.value) {
      // Add monthly stats sheet
      const wsMonthly = XLSX.utils.json_to_sheet(monthlyStats)
      XLSX.utils.book_append_sheet(wb, wsMonthly, 'Monthly Statistics')
      
      // Add category stats sheet
      const wsCategory = XLSX.utils.json_to_sheet(categoryStats)
      XLSX.utils.book_append_sheet(wb, wsCategory, 'Category Statistics')
    }
    
    XLSX.writeFile(wb, 'financial_data.xlsx')
  }
}

function convertToCSV(data) {
  if (data.length === 0) return ''
  
  const headers = Object.keys(data[0])
  const rows = data.map(row => 
    headers.map(header => JSON.stringify(row[header] || '')).join(',')
  )
  
  return [
    headers.join(','),
    ...rows
  ].join('\n')
}

function downloadFile(content, fileName, contentType) {
  const blob = new Blob([content], { type: contentType })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  window.URL.revokeObjectURL(url)
}
</script> 