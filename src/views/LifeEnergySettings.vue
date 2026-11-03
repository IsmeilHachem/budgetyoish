<template>
  <div class="min-h-screen bg-slate-950">
    <div class="container mx-auto px-4 py-8 max-w-2xl">

      <!-- Header -->
      <div class="bg-gradient-to-br from-emerald-950 to-slate-900 rounded-2xl shadow-xl p-8 mb-6 border border-emerald-900">
        <div class="flex items-center space-x-4 mb-4">
          <div class="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
            <span class="text-2xl">⏱️</span>
          </div>
          <div>
            <h1 class="text-3xl font-bold text-white">
              Life Energy Rate
            </h1>
            <p class="text-slate-300 text-sm mt-0.5">Your real hourly wage</p>
          </div>
        </div>
        <p class="text-slate-300 leading-relaxed text-sm">
          From <em>Your Money or Your Life</em> — money equals hours of your life. Your real hourly wage
          accounts for all the time and money your job actually costs, not just your paycheck.
          Once set, every transaction in the app will show its true cost in hours of your life.
        </p>
      </div>

      <!-- Form Card -->
      <div class="bg-slate-800 rounded-2xl shadow-xl p-8 mb-6 border border-slate-700 border-l-4 border-l-emerald-500">
        <h2 class="text-lg font-bold text-slate-100 mb-6">Your Numbers</h2>

        <div class="space-y-6">
          <!-- Take-home pay -->
          <div>
            <label class="block text-sm font-semibold text-slate-300 mb-1">
              Monthly take-home pay (after tax)
            </label>
            <p class="text-xs text-slate-500 mb-2">Total net income you actually receive each month</p>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
              <input
                v-model.number="store.monthly_take_home"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                class="w-full pl-7 pr-4 py-3 border border-slate-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-700 text-slate-100 transition-all"
              />
            </div>
          </div>

          <!-- Work-related costs -->
          <div>
            <label class="block text-sm font-semibold text-slate-300 mb-1">
              Monthly work-related costs
            </label>
            <p class="text-xs text-slate-500 mb-2">Costs <em>caused by</em> your job: commute, work clothes, lunches out, decompression spending, etc.</p>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
              <input
                v-model.number="store.monthly_work_costs"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                class="w-full pl-7 pr-4 py-3 border border-slate-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-700 text-slate-100 transition-all"
              />
            </div>
          </div>

          <!-- Hours at work -->
          <div>
            <label class="block text-sm font-semibold text-slate-300 mb-1">
              Monthly hours at work
            </label>
            <p class="text-xs text-slate-500 mb-2">Actual scheduled hours on the job per month</p>
            <div class="relative">
              <input
                v-model.number="store.monthly_work_hours"
                type="number"
                min="0"
                step="0.5"
                placeholder="0"
                class="w-full px-4 py-3 border border-slate-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-700 text-slate-100 transition-all"
              />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">hrs</span>
            </div>
          </div>

          <!-- Overhead hours -->
          <div>
            <label class="block text-sm font-semibold text-slate-300 mb-1">
              Monthly overhead hours
            </label>
            <p class="text-xs text-slate-500 mb-2">Commute time + decompression time + getting ready per month</p>
            <div class="relative">
              <input
                v-model.number="store.monthly_work_overhead_hours"
                type="number"
                min="0"
                step="0.5"
                placeholder="0"
                class="w-full px-4 py-3 border border-slate-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-700 text-slate-100 transition-all"
              />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">hrs</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Live Preview Card -->
      <div class="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-xl p-8 mb-6 text-white">
        <p class="text-emerald-100 text-sm font-medium mb-1">Your true hourly rate</p>
        <div class="flex items-baseline space-x-2">
          <span class="text-5xl font-bold">
            {{ store.lifeEnergyRate > 0 ? formatCurrency(store.lifeEnergyRate) : '$—' }}
          </span>
          <span class="text-emerald-100 text-lg">/ hr</span>
        </div>
        <div v-if="store.lifeEnergyRate > 0" class="mt-4 text-sm text-emerald-100">
          <p>A $100 purchase costs you <strong class="text-white">{{ store.toCost(100) }}</strong> of your life.</p>
          <p class="mt-1">A $1,000 purchase costs you <strong class="text-white">{{ store.toCost(1000) }}</strong> of your life.</p>
        </div>
        <div v-else class="mt-3 text-sm text-emerald-200">
          Fill in your numbers above to calculate your rate.
        </div>
      </div>

      <!-- Save Button -->
      <div class="flex items-center space-x-4">
        <button
          @click="handleSave"
          :disabled="saving"
          class="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {{ saving ? 'Saving…' : 'Save Settings' }}
        </button>
      </div>

      <!-- Success Message -->
      <transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0 translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="saved" class="mt-4 flex items-center space-x-2 text-emerald-400 font-medium text-sm">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <span>Settings saved! Life energy rate is now active across the app.</span>
        </div>
      </transition>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useLifeEnergyStore } from '@/stores/lifeEnergy'
import { useAuthStore } from '@/stores/auth'

const store = useLifeEnergyStore()
const authStore = useAuthStore()
const saving = ref(false)
const saved = ref(false)

watch(
  () => authStore.isLoggedIn,
  async (loggedIn) => {
    if (loggedIn && !store.loaded) {
      await store.loadFromSupabase()
    }
  },
  { immediate: true }
)

async function handleSave() {
  saving.value = true
  saved.value = false
  const ok = await store.saveToSupabase()
  saving.value = false
  if (ok) {
    saved.value = true
    setTimeout(() => { saved.value = false }, 4000)
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}
</script>
