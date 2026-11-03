import { createRouter, createWebHistory } from 'vue-router'
import ReflectionPage from '@/views/ReflectionPage.vue'
import ReflectionHistory from '@/views/ReflectionHistory.vue'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    name: 'Landing',
    component: () => import('../views/LandingPage.vue'),
    meta: { public: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { public: true }
  },
  {
    path: '/migrate',
    name: 'Migrate',
    component: () => import('../views/Migrate.vue')
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue')
  },
  {
    path: '/categories',
    name: 'Categories',
    component: () => import('../views/Categories.vue')
  },
  {
    path: '/transactions',
    name: 'Transactions',
    component: () => import('../views/Transactions.vue')
  },
  {
    path: '/bills',
    name: 'Bills',
    component: () => import('../views/Bills.vue')
  },
  {
    path: '/reflection',
    name: 'ReflectionPage',
    component: ReflectionPage
  },
  {
    path: '/reflections',
    name: 'ReflectionHistory',
    component: ReflectionHistory
  },
  {
    path: '/life-energy',
    name: 'LifeEnergy',
    component: () => import('../views/LifeEnergySettings.vue')
  },
  {
    path: '/monthly-review',
    name: 'MonthlyReview',
    component: () => import('../views/MonthlyReview.vue')
  },
  {
    path: '/fi-journey',
    name: 'FIJourney',
    component: () => import('../views/FIJourney.vue')
  },
  {
    path: '/debt-plan',
    name: 'DebtPlan',
    component: () => import('../views/DebtPlan.vue')
  },
  {
    path: '/plan',
    name: 'Plan',
    component: () => import('../views/PlanView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  // Always ensure auth is initialized before checking
  if (!authStore.initialized) {
    await authStore.init()
  }

  // Authenticated users hitting the landing page go straight to dashboard
  if (to.name === 'Landing' && authStore.isLoggedIn) {
    return { name: 'Dashboard' }
  }

  // Unauthenticated users hitting protected routes go to landing page
  if (!to.meta.public && !authStore.isLoggedIn) {
    return { name: 'Landing' }
  }

  // Authenticated users hitting login go to dashboard
  if (to.name === 'Login' && authStore.isLoggedIn) {
    return { name: 'Dashboard' }
  }
})

export default router 