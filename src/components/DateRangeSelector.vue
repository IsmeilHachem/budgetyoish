<template>
  <div class="flex flex-wrap items-center gap-2">
    <button
      v-for="(option, index) in presetOptions"
      :key="index"
      @click="selectPreset(option.value)"
      :class="[
        'px-3 py-1.5 text-sm rounded-md transition-colors shrink-0',
        selectedRange === option.value
          ? 'bg-blue-500 text-white'
          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
      ]"
    >
      {{ option.label }}
    </button>
    <div class="flex items-center gap-2 shrink-0">
      <input
        type="month"
        v-model="startDate"
        class="px-2 py-1.5 text-sm rounded-md border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-w-0"
        :max="endDate"
      />
      <span class="text-gray-500 text-sm">to</span>
      <input
        type="month"
        v-model="endDate"
        class="px-2 py-1.5 text-sm rounded-md border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-w-0"
        :min="startDate"
        :max="currentMonth"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  dateRange: Object,
  initialRange: {
    type: String,
    default: '6M'
  }
})

const emit = defineEmits(['update:dateRange'])

const presetOptions = [
  { label: '3M', value: '3M' },
  { label: '6M', value: '6M' },
  { label: 'YTD', value: 'YTD' },
  { label: '1Y', value: '1Y' }
]

const selectedRange = ref(props.initialRange)
const startDate = ref('')
const endDate = ref('')

const currentMonth = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
})

function getDateFromRange(range) {
  const now = new Date()
  const end = new Date(now.getFullYear(), now.getMonth())
  let start

  switch (range) {
    case '3M':
      start = new Date(now.getFullYear(), now.getMonth() - 3)
      break
    case '6M':
      start = new Date(now.getFullYear(), now.getMonth() - 6)
      break
    case 'YTD':
      start = new Date(now.getFullYear(), 0)
      break
    case '1Y':
      start = new Date(now.getFullYear() - 1, now.getMonth())
      break
    default:
      start = new Date(now.getFullYear(), now.getMonth() - 6)
  }

  return {
    start: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
    end: `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}`
  }
}

function selectPreset(range) {
  selectedRange.value = range
  const dates = getDateFromRange(range)
  startDate.value = dates.start
  endDate.value = dates.end
}

watch(() => props.dateRange, (newVal) => {
  if (newVal && newVal.start && newVal.end) {
    startDate.value = newVal.start
    endDate.value = newVal.end
  }
}, { immediate: true })

watch([startDate, endDate], ([newStart, newEnd]) => {
  if (newStart && newEnd) {
    const range = { start: newStart, end: newEnd }
    emit('update:dateRange', range)
  }
})

// On mount, if dateRange is provided, use it to initialize
if (props.dateRange && props.dateRange.start && props.dateRange.end) {
  startDate.value = props.dateRange.start
  endDate.value = props.dateRange.end
} else {
  selectPreset(props.initialRange)
}
</script> 