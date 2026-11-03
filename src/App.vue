<template>
  <div class="min-h-screen bg-slate-950">
    <!-- Navigation Header (only shown when authenticated) -->
    <header v-if="authStore.isLoggedIn" class="bg-slate-900 border-b border-slate-700">
      <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <!-- Logo -->
            <div class="flex-shrink-0 flex items-center">
              <h1 class="text-xl font-bold text-white">BudgetYoish</h1>
            </div>
            <!-- Desktop Navigation Links -->
            <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
              <router-link
                v-for="route in routes"
                :key="route.path"
                :to="route.path"
                class="inline-flex items-center px-1 pt-1 text-sm font-medium"
                :class="[
                  isRouteActive(route.path)
                    ? 'border-b-2 border-indigo-400 text-white'
                    : 'border-b-2 border-transparent text-slate-300 hover:border-slate-500 hover:text-white'
                ]"
              >
                {{ route.name }}
              </router-link>
            </div>
          </div>
          <!-- Settings & Sign out -->
          <div v-if="authStore.isLoggedIn" class="flex items-center space-x-4">
            <router-link
              to="/life-energy"
              aria-label="Settings"
              class="text-slate-400 hover:text-white text-lg transition-colors p-1"
              title="Settings"
            >
              ⚙️
            </router-link>
            <button
              @click="signOut"
              class="text-sm text-slate-400 hover:text-white font-medium transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>
    </header>

    <!-- Main Content -->
    <main class="pb-20 sm:pb-0">
      <div :class="$route.path !== '/' ? 'max-w-7xl mx-auto py-6 sm:px-6 lg:px-8' : ''"
>
        <router-view v-slot="{ Component }">
          <transition
            name="fade"
            mode="out-in"
            enter-active-class="transition ease-out duration-100"
            enter-from-class="transform opacity-0"
            enter-to-class="transform opacity-100"
            leave-active-class="transition ease-in duration-75"
            leave-from-class="transform opacity-100"
            leave-to-class="transform opacity-0"
          >
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>

    <!-- Mobile Bottom Navigation -->
    <nav v-if="authStore.isLoggedIn" class="sm:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 z-50">
      <div class="flex justify-around">
        <router-link
          v-for="route in routes"
          :key="route.path"
          :to="route.path"
          class="flex flex-col items-center py-2 px-0.5 text-[10px] font-medium flex-1 truncate"
          :class="[
            isRouteActive(route.path)
              ? 'text-indigo-400'
              : 'text-slate-400'
          ]"
        >
          <span class="text-base mb-0.5">{{ route.icon }}</span>
          <span class="truncate max-w-full">{{ route.name }}</span>
        </router-link>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { usePlanStore } from '@/stores/plan'
import { useCategoriesStore } from '@/stores/categories'
import { useRouter, useRoute } from 'vue-router'

const authStore = useAuthStore()
const planStore = usePlanStore()
const categoriesStore = useCategoriesStore()
const router = useRouter()
const currentRoute = useRoute()

watch(
  () => authStore.isLoggedIn,
  async (loggedIn) => {
    if (loggedIn) {
      await planStore.initialize()
      await categoriesStore.initialize()
    }
  },
  { immediate: true }
)

const allRoutes = [
  { path: '/dashboard', name: 'Dashboard', icon: '📊' },
  { path: '/transactions', name: 'Transactions', icon: '💳' },
  { path: '/bills', name: 'Bills', icon: '📋' },
  { path: '/debt-plan', name: 'Debt', icon: '🎯' },
  { path: '/plan', name: 'Plan', icon: '🗺️' },
  { path: '/categories', name: 'Categories', icon: '🏷️' },
  { path: '/reflections', name: 'Reflect', icon: '💭' }
]

const routes = computed(() =>
  allRoutes.filter(r => r.path !== '/plan' || planStore.quarters.length > 0)
)

function isRouteActive(path) {
  if (path === '/reflections') {
    return ['/reflections', '/monthly-review', '/reflection'].includes(currentRoute.path)
  }
  return currentRoute.path === path
}

async function signOut() {
  await authStore.signOut()
  ;[
    'budgetish-debt-plan',
    'budgetish-bills',
    'billMonthStatus',
    'budgetish-categories',
    'budgetish-categories-bills',
    'budgetish-transactions',
    'budgetish-reflections',
    'budgetish-spain-plan',
    'budgetish-gemini-insights'
  ].forEach(key => localStorage.removeItem(key))
  window.location.href = '/login'
}
</script> 