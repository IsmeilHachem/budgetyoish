<template>
  <div class="min-h-screen bg-slate-950">
    <div class="w-full px-4 md:px-6 lg:px-8 py-8 space-y-8">

      <!-- Header Card -->
      <div class="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 rounded-2xl shadow-xl p-6 sm:p-8 border border-indigo-900">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div class="flex items-center space-x-4">
            <div class="w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg text-3xl shrink-0">
              🗺️
            </div>
            <div>
              <h1 class="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                {{ debtPlanStore.goalLabel ? `${debtPlanStore.goalLabel} Plan` : 'Milestone Plan' }}
              </h1>
              <p class="text-slate-300 mt-1 text-sm sm:text-base">
                Road to {{ debtPlanStore.goalLabel || 'Your Goal' }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Overall Progress Card -->
      <div class="bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-700">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <div>
            <h2 class="text-lg font-bold text-white">Overall Progress</h2>
            <p class="text-sm text-slate-400">Quarterly milestones to departure</p>
          </div>
          <div class="text-sm font-semibold text-indigo-400">
            {{ totals.done }} of {{ totals.all }} done ({{ totals.pct }}%)
          </div>
        </div>
        <div class="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
          <div
            class="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-300"
            :style="{ width: totals.pct + '%' }"
          ></div>
        </div>
      </div>

      <!-- Quarter Cards List -->
      <div class="space-y-4">
        <div
          v-for="q in view"
          :key="q.id"
          class="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 overflow-hidden transition-colors"
          :style="q.id === currentQuarterId ? { borderColor: '#f2b705' } : {}"
        >
          <!-- Quarter Card Header Button -->
          <button
            type="button"
            :aria-expanded="openIds.has(q.id)"
            @click="toggleOpen(q.id)"
            class="w-full p-4 sm:p-6 text-left flex flex-col gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 transition-colors hover:bg-slate-750"
          >
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2 flex-wrap min-w-0">
                <span class="text-base sm:text-lg font-bold text-white">{{ q.label }}</span>
                <span
                  v-if="q.id === currentQuarterId"
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold text-amber-300 border bg-amber-500/10"
                  :style="{ borderColor: '#f2b705' }"
                >
                  Now
                </span>
              </div>
              <div class="flex items-center gap-3 shrink-0">
                <span class="text-xs sm:text-sm font-semibold text-slate-300">
                  {{ q.doneCount }}/{{ q.tasks.length }}
                </span>
                <span
                  class="text-slate-400 text-xs transition-transform duration-200"
                  :class="{ 'rotate-180': openIds.has(q.id) }"
                >
                  ▼
                </span>
              </div>
            </div>

            <div class="text-xs sm:text-sm text-slate-400">
              {{ q.theme }}
            </div>

            <!-- Quarter mini progress bar -->
            <div class="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
              <div
                class="bg-indigo-500 h-full rounded-full transition-all duration-300"
                :style="{ width: (q.tasks.length ? Math.round((q.doneCount / q.tasks.length) * 100) : 0) + '%' }"
              ></div>
            </div>
          </button>

          <!-- Quarter Tasks Content -->
          <div
            v-if="openIds.has(q.id)"
            class="px-4 pb-5 sm:px-6 sm:pb-6 border-t border-slate-700/60 pt-4 space-y-3"
          >
            <!-- Task Checklist -->
            <div class="space-y-2">
              <div
                v-for="t in q.tasks"
                :key="t.id"
                class="flex items-start justify-between gap-3 p-2.5 rounded-xl hover:bg-slate-750 transition-colors"
              >
                <div class="flex items-start gap-3 min-w-0 flex-1">
                  <input
                    type="checkbox"
                    :id="'task-' + t.id"
                    :checked="t.done"
                    :disabled="isAuto(t)"
                    @change="plan.toggle(t.id)"
                    class="mt-1 w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-600 focus:ring-indigo-500 focus:ring-offset-slate-800 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed shrink-0"
                  />
                  <div class="min-w-0 flex-1">
                    <label
                      :for="'task-' + t.id"
                      class="text-sm block cursor-pointer select-none transition-colors"
                      :class="t.done ? 'line-through text-slate-500' : 'text-slate-200'"
                    >
                      {{ t.text }}
                    </label>
                    <div v-if="isAuto(t) || isOverdue(t) || dueMonth(t)" class="mt-0.5">
                      <span
                        v-if="isAuto(t)"
                        class="text-xs text-emerald-400 font-medium"
                      >
                        paid off in Debt Plan
                      </span>
                      <span
                        v-else-if="isOverdue(t)"
                        class="text-xs font-medium"
                        :style="{ color: '#f2b705' }"
                      >
                        overdue · planned {{ formatMonth(dueMonth(t)) }}
                      </span>
                      <span
                        v-else-if="dueMonth(t)"
                        class="text-xs text-slate-400"
                      >
                        planned {{ formatMonth(dueMonth(t)) }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Custom Task Remove Button -->
                <button
                  v-if="t.custom"
                  type="button"
                  @click="plan.removeTask(q.id, t.id)"
                  class="text-slate-400 hover:text-red-400 p-1 text-sm rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 shrink-0 transition-colors"
                  aria-label="Remove task"
                  title="Remove task"
                >
                  ✕
                </button>
              </div>
            </div>

            <!-- Add Task Form -->
            <form @submit.prevent="add(q.id)" class="flex items-center gap-2 pt-2">
              <input
                type="text"
                v-model="drafts[q.id]"
                placeholder="Add a task..."
                aria-label="Add a task"
                class="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 shrink-0"
              >
                Add
              </button>
            </form>
          </div>
        </div>
      </div>

      <!-- Reset Progress Button -->
      <div class="flex justify-center pt-4 pb-8">
        <button
          type="button"
          @click="confirmReset"
          class="text-xs sm:text-sm text-slate-500 hover:text-red-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 rounded px-3 py-1.5"
        >
          Reset all progress
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { usePlanStore } from '@/stores/plan'
import { useDebtPlanStore } from '@/stores/debtPlan'

const authStore = useAuthStore()
const plan = usePlanStore()
const debtPlanStore = useDebtPlanStore()

// Mirror DebtPlan.vue's auth watch exactly; initialize both stores
watch(
  () => authStore.isLoggedIn,
  async (loggedIn) => {
    if (loggedIn) {
      await Promise.all([plan.initialize(), debtPlanStore.initialize()])
    } else {
      await Promise.all([plan.initialize(), debtPlanStore.initialize()])
    }
  },
  { immediate: true }
)

const now = new Date()
const currentYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
const currentQuarterId = `${now.getFullYear()}-Q${Math.floor(now.getMonth() / 3) + 1}`

function matchedDebt(task) {
  if (!task.debtMatch) return null
  return debtPlanStore.debts.find(d => (d.name || '').toLowerCase().includes(task.debtMatch)) || null
}

function dueMonth(task) {
  const d = matchedDebt(task)
  return d ? (debtPlanStore.result?.payoffMonth?.[d.id] || null) : (task.due || null)
}

function isDone(task) {
  if (plan.done[task.id]) return true
  const d = matchedDebt(task)
  return !!d && d.balance !== '' && Number(d.balance) <= 0
}

function isAuto(task) {
  return !plan.done[task.id] && isDone(task)
}

function isOverdue(task) {
  const due = dueMonth(task)
  return !isDone(task) && !!due && currentYm > due
}

function formatMonth(ym) {
  if (!ym) return ''
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'short', year: 'numeric' })
}

const view = computed(() => plan.quarters.map(q => {
  const tasks = q.tasks.map(t => ({ ...t, done: isDone(t) }))
  return { ...q, tasks, doneCount: tasks.filter(t => t.done).length }
}))

const totals = computed(() => {
  const all = view.value.reduce((n, q) => n + q.tasks.length, 0)
  const done = view.value.reduce((n, q) => n + q.doneCount, 0)
  return { all, done, pct: all ? Math.round((done / all) * 100) : 0 }
})

const openIds = ref(new Set([currentQuarterId]))

function toggleOpen(id) {
  const next = new Set(openIds.value)
  if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
  }
  openIds.value = next
}

const drafts = ref({})

function add(qid) {
  if (plan.addTask(qid, drafts.value[qid])) {
    drafts.value = { ...drafts.value, [qid]: '' }
  }
}

function confirmReset() {
  if (window.confirm('Clear all checkmarks and custom tasks?')) {
    plan.reset()
  }
}
</script>
