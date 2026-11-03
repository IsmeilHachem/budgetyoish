<template>
  <div class="bg-white rounded-lg shadow p-4">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-medium text-gray-900">Import Excel Data</h3>
      <input
        type="file"
        ref="fileInput"
        accept=".xlsx,.xls"
        class="hidden"
        @change="handleFileSelect"
      />
      <button
        @click="$refs.fileInput.click()"
        class="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors"
      >
        Select Excel File
      </button>
    </div>

    <div v-if="selectedFile" class="mb-4">
      <p class="text-sm text-gray-600">Selected file: {{ selectedFile.name }}</p>
    </div>

    <div v-if="sheets.length > 0" class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Select Sheet
      </label>
      <select
        v-model="selectedSheet"
        class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      >
        <option v-for="sheet in sheets" :key="sheet" :value="sheet">
          {{ sheet }}
        </option>
      </select>
    </div>

    <div v-if="previewData.length > 0" class="mb-4">
      <h4 class="text-sm font-medium text-gray-700 mb-2">Preview</h4>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                v-for="header in previewHeaders"
                :key="header"
                class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {{ header }}
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="(row, index) in previewData.slice(0, 5)" :key="index">
              <td
                v-for="header in previewHeaders"
                :key="header"
                class="px-3 py-2 text-sm text-gray-500 whitespace-nowrap"
              >
                {{ row[header] }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="text-xs text-gray-500 mt-2">
        Showing first 5 rows of {{ previewData.length }} total rows
      </p>
    </div>

    <div class="flex justify-end space-x-2">
      <button
        v-if="previewData.length > 0"
        @click="importData"
        class="px-4 py-2 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-md transition-colors"
      >
        Import Data
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { read, utils } from 'xlsx'
import { useTransactionsStore } from '@/stores/transactions'

const transactionsStore = useTransactionsStore()

const fileInput = ref(null)
const selectedFile = ref(null)
const sheets = ref([])
const selectedSheet = ref('')
const previewData = ref([])

const previewHeaders = computed(() => {
  if (previewData.value.length === 0) return []
  return Object.keys(previewData.value[0])
})

async function handleFileSelect(event) {
  const file = event.target.files[0]
  if (!file) return

  selectedFile.value = file
  const data = await file.arrayBuffer()
  const workbook = read(data)
  
  sheets.value = workbook.SheetNames
  selectedSheet.value = sheets.value[0]
  
  const worksheet = workbook.Sheets[selectedSheet.value]
  previewData.value = utils.sheet_to_json(worksheet)
}

function mapExcelRowToTransaction(row) {
  // Skip rows with "Starting Balance" or empty descriptions
  if (row.Description === 'Starting Balance' || !row.Description) {
    return null
  }

  // Handle amount - check both Income and Expenses columns
  let amount = 0
  if (row.Income) {
    amount = typeof row.Income === 'number' ? row.Income : parseFloat(String(row.Income).replace(/[^0-9.-]+/g, ''))
  } else if (row.Expenses) {
    amount = typeof row.Expenses === 'number' ? -row.Expenses : -parseFloat(String(row.Expenses).replace(/[^0-9.-]+/g, ''))
  }

  // Format date correctly
  let date = row.Date
  if (date instanceof Date) {
    date = date.toISOString().split('T')[0]
  } else if (typeof date === 'number') {
    // Excel date number to JS date
    const jsDate = new Date((date - 25569) * 86400 * 1000)
    date = jsDate.toISOString().split('T')[0]
  }

  const transaction = {
    date: date,
    description: row.Description,
    category: row.Category,
    amount: amount,
    type: amount >= 0 ? 'Income' : 'Expense'
  }

  // Log for debugging
  console.log('Raw Excel row:', row)
  console.log('Mapped transaction:', transaction)

  return transaction
}

function importData() {
  const transactions = previewData.value
    .map(mapExcelRowToTransaction)
    .filter(t => t !== null && t.date && t.description && !isNaN(t.amount))
  
  // Add transactions to store
  transactions.forEach(transaction => {
    transactionsStore.addTransaction(transaction)
  })
  
  // Reset the form
  selectedFile.value = null
  sheets.value = []
  selectedSheet.value = ''
  previewData.value = []
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  
  // Show success message
  alert(`Successfully imported ${transactions.length} transactions`)
}
</script> 