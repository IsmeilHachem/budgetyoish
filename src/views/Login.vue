<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4">
    <div class="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-gray-100">

      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          BudgetYoish
        </h1>
        <p class="text-gray-500 mt-2">Your personal finance tracker</p>
      </div>

      <div class="flex rounded-xl overflow-hidden border border-gray-200 mb-6">
        <button
          @click="mode = 'signin'"
          :class="mode === 'signin' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'"
          class="flex-1 py-2.5 text-sm font-medium transition-colors"
        >
          Sign In
        </button>
        <button
          @click="mode = 'signup'"
          :class="mode === 'signup' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'"
          class="flex-1 py-2.5 text-sm font-medium transition-colors"
        >
          Create Account
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            v-model="email"
            required
            placeholder="you@example.com"
            class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            v-model="password"
            required
            placeholder="••••••••"
            class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div v-if="error" class="text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl">
          {{ error }}
        </div>

        <div v-if="message" class="text-green-600 text-sm bg-green-50 px-4 py-3 rounded-xl">
          {{ message }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50"
        >
          {{ loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const mode = ref('signin')
const email = ref('')
const password = ref('')
const error = ref('')
const message = ref('')
const loading = ref(false)

async function handleSubmit() {
  error.value = ''
  message.value = ''
  loading.value = true

  try {
    if (mode.value === 'signin') {
      await authStore.signIn(email.value, password.value)
      router.push('/')
    } else {
      await authStore.signUp(email.value, password.value)
      message.value = 'Account created! Check your email to confirm, then sign in.'
      mode.value = 'signin'
    }
  } catch (err) {
    error.value = err.message || 'Something went wrong. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>
