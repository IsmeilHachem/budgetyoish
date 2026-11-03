<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4">
    <div class="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg border border-gray-100">

      <h2 class="text-2xl font-bold text-gray-900 mb-2">Migrate Your Data</h2>
      <p class="text-gray-500 mb-6 text-sm">
        Moves all your local data (transactions, categories, bills, reflections) from this browser into Supabase. You only need to do this once per device.
      </p>

      <div v-if="status === 'idle'" class="space-y-4">
        <div class="space-y-2">
          <div class="flex justify-between items-center bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
            <span>💳 Transactions</span>
            <strong>{{ counts.transactions }} found</strong>
          </div>
          <div class="flex justify-between items-center bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
            <span>🏷️ Categories</span>
            <strong>{{ counts.categories }} main categories</strong>
          </div>
          <div class="flex justify-between items-center bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
            <span>📋 Bills</span>
            <strong>{{ counts.bills }} found</strong>
          </div>
          <div class="flex justify-between items-center bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
            <span>💭 Reflections</span>
            <strong>{{ counts.reflections }} found</strong>
          </div>
        </div>
        <button
          @click="runMigration"
          :disabled="totalCount === 0"
          class="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-40"
        >
          Migrate All Data to Supabase
        </button>
      </div>

      <div v-if="status === 'running'" class="text-center py-4">
        <div class="text-gray-600 text-sm mb-2">{{ currentStep }}</div>
        <div class="mt-3 w-full bg-gray-200 rounded-full h-2">
          <div class="bg-blue-500 h-2 rounded-full animate-pulse w-3/4"></div>
        </div>
      </div>

      <div v-if="status === 'done'" class="text-center">
        <div class="text-5xl mb-4">✅</div>
        <div class="text-xl font-bold text-gray-900 mb-2">Migration Complete</div>
        <div class="text-gray-500 text-sm mb-6 space-y-1">
          <div>{{ results.transactions }} transactions migrated</div>
          <div>Categories, bills & reflections synced</div>
        </div>
        <router-link
          to="/"
          class="block w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-medium text-center hover:from-green-600 hover:to-green-700 transition-all"
        >
          Go to Dashboard
        </router-link>
      </div>

      <div v-if="status === 'error'" class="text-center">
        <div class="text-5xl mb-4">⚠️</div>
        <div class="text-xl font-bold text-gray-900 mb-1">Something went wrong</div>
        <div class="text-red-600 text-sm mb-4 bg-red-50 px-4 py-3 rounded-xl">{{ errorMessage }}</div>
        <button
          @click="status = 'idle'"
          class="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
        >
          Try Again
        </button>
      </div>

      <!-- Recovery Tools (always visible) -->
      <div class="mt-8 pt-6 border-t border-gray-200 space-y-3">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Recovery Tools</p>

        <!-- Recover categories from transactions -->
        <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p class="text-sm font-semibold text-amber-800 mb-1">Rebuild Categories from Transactions</p>
          <p class="text-xs text-amber-700 mb-3">Scans every transaction in Supabase and rebuilds your full category/subcategory list (including custom ones). Use this if subcategories are missing or wrong.</p>
          <button
            @click="recoverCategories"
            :disabled="recoveryStatus.categories === 'running'"
            class="w-full py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-all disabled:opacity-50"
          >
            <span v-if="recoveryStatus.categories === 'running'">Recovering...</span>
            <span v-else-if="recoveryStatus.categories === 'done'">Done ✓</span>
            <span v-else>Recover Categories</span>
          </button>
          <p v-if="recoveryStatus.categoriesMsg" class="text-xs mt-2 text-amber-700">{{ recoveryStatus.categoriesMsg }}</p>
        </div>

        <!-- Remove duplicate transactions -->
        <div class="bg-red-50 border border-red-200 rounded-xl p-4">
          <p class="text-sm font-semibold text-red-800 mb-1">Remove Duplicate Transactions</p>
          <p class="text-xs text-red-700 mb-3">Scans Supabase for transactions with the same date, description, category, and amount, then deletes every copy except the oldest one. Safe to run at any time.</p>
          <button
            @click="removeDuplicates"
            :disabled="recoveryStatus.duplicates === 'running'"
            class="w-full py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-all disabled:opacity-50"
          >
            <span v-if="recoveryStatus.duplicates === 'running'">Removing...</span>
            <span v-else-if="recoveryStatus.duplicates === 'done'">Done ✓</span>
            <span v-else>Remove Duplicates</span>
          </button>
          <p v-if="recoveryStatus.duplicatesMsg" class="text-xs mt-2" :class="recoveryStatus.duplicates === 'done' ? 'text-green-700' : 'text-red-700'">{{ recoveryStatus.duplicatesMsg }}</p>
        </div>

        <!-- Restore bills -->
        <div class="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <p class="text-sm font-semibold text-purple-800 mb-1">Restore Hidden Bills</p>
          <p class="text-xs text-purple-700 mb-3">If bills were accidentally hidden (soft-deleted), this restores them.</p>
          <button
            @click="restoreBills"
            :disabled="recoveryStatus.bills === 'running'"
            class="w-full py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-all disabled:opacity-50"
          >
            <span v-if="recoveryStatus.bills === 'running'">Restoring...</span>
            <span v-else-if="recoveryStatus.bills === 'done'">Done ✓</span>
            <span v-else>Restore Bills</span>
          </button>
          <p v-if="recoveryStatus.billsMsg" class="text-xs mt-2 text-purple-700">{{ recoveryStatus.billsMsg }}</p>
        </div>

        <!-- Monthly reconciliation -->
        <div class="bg-green-50 border border-green-200 rounded-xl p-4">
          <p class="text-sm font-semibold text-green-800 mb-1">Billing Cycle Reconciliation</p>
          <p class="text-xs text-green-700 mb-3">Groups transactions by your bank's billing cycle so totals match your statements exactly. Enter the day your statement starts each month.</p>
          <div class="flex items-center gap-2 mb-3">
            <label class="text-xs text-green-800 font-medium whitespace-nowrap">Statement starts on day</label>
            <input
              v-model.number="reconciliation.cycleDay"
              type="number" min="1" max="28"
              class="w-16 text-xs border border-green-300 rounded px-2 py-1 text-center focus:outline-none focus:ring-1 focus:ring-green-500"
            />
            <span class="text-xs text-green-700">of each month</span>
          </div>
          <button
            @click="loadReconciliation"
            :disabled="reconciliation.status === 'loading'"
            class="w-full py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-all disabled:opacity-50"
          >
            <span v-if="reconciliation.status === 'loading'">Loading...</span>
            <span v-else>Show Billing Cycle Totals</span>
          </button>
          <p v-if="reconciliation.error" class="text-xs mt-2 text-red-600">{{ reconciliation.error }}</p>
          <div v-if="reconciliation.rows.length > 0" class="mt-3 space-y-1">
            <p class="text-xs text-green-700 mb-2">Compare the <strong>End Balance</strong> column to your bank statement's ending balance for that period. The first row that doesn't match is where the missing transaction is.</p>
            <div class="grid grid-cols-3 gap-1 text-xs font-semibold text-green-800 border-b border-green-200 pb-1 mb-1">
              <span>Statement Period</span><span class="text-right">Period Net</span><span class="text-right">End Balance</span>
            </div>
            <div
              v-for="row in reconciliation.rows"
              :key="row.month"
              class="grid grid-cols-3 gap-1 text-xs text-gray-700 py-1 border-b border-green-100"
            >
              <span class="font-medium">{{ row.month }}</span>
              <span class="text-right" :class="row.netRaw >= 0 ? 'text-green-700' : 'text-red-600'">{{ row.net }}</span>
              <span class="text-right font-semibold text-gray-900">{{ row.endBalance }}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTransactionsStore } from '@/stores/transactions'
import { useCategoriesStore } from '@/stores/categories'
import { useBillsStore } from '@/stores/bills'
import { useReflectionsStore } from '@/stores/reflections'
import { useBillCategoriesStore } from '@/stores/billCategories'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/utils/supabase'
import { parseTransactionsFromStorage } from '@/utils/transactionStorage'
import { DEFAULT_CATEGORIES } from '@/stores/categories'

const transactionsStore = useTransactionsStore()
const categoriesStore = useCategoriesStore()
const billsStore = useBillsStore()
const reflectionsStore = useReflectionsStore()
const billCategoriesStore = useBillCategoriesStore()
const authStore = useAuthStore()

const status = ref('idle')
const currentStep = ref('')
const errorMessage = ref('')
const counts = ref({ transactions: 0, categories: 0, bills: 0, reflections: 0 })
const results = ref({ transactions: 0 })
const recoveryStatus = ref({ categories: 'idle', categoriesMsg: '', bills: 'idle', billsMsg: '', duplicates: 'idle', duplicatesMsg: '' })
const reconciliation = ref({ status: 'idle', rows: [], totals: {}, error: '', cycleDay: 20 })

const totalCount = computed(() =>
  counts.value.transactions + counts.value.categories + counts.value.bills + counts.value.reflections
)

onMounted(() => {
  try {
    const stored = localStorage.getItem('budgetish-transactions')
    if (stored) {
      const data = parseTransactionsFromStorage(stored)
      counts.value.transactions = data?.transactions?.length ?? 0
    }
  } catch { counts.value.transactions = 0 }

  try {
    const stored = localStorage.getItem('budgetish-categories')
    if (stored) {
      const data = JSON.parse(stored)
      counts.value.categories = Object.keys(data.categories || {}).length
    }
  } catch { counts.value.categories = 0 }

  try {
    const stored = localStorage.getItem('budgetish-bills')
    if (stored) {
      const data = JSON.parse(stored)
      counts.value.bills = Array.isArray(data.bills) ? data.bills.length : (Array.isArray(data) ? data.length : 0)
    }
  } catch { counts.value.bills = 0 }

  try {
    const stored = localStorage.getItem('budgetish-reflections')
    if (stored) {
      counts.value.reflections = JSON.parse(stored).length
    }
  } catch { counts.value.reflections = 0 }
})

async function runMigration() {
  status.value = 'running'
  try {
    // 1. Migrate transactions (skips already-migrated ones)
    currentStep.value = 'Migrating transactions...'
    const txResult = await transactionsStore.migrateFromLocalStorage()
    // "All transactions already in Supabase" is fine — not an error
    if (txResult.error && txResult.migrated === 0 && txResult.error !== 'All transactions already in Supabase') {
      console.warn('Transactions migration note:', txResult.error)
    }
    results.value.transactions = txResult.migrated

    // 2. Migrate categories
    currentStep.value = 'Migrating categories...'
    const catStored = localStorage.getItem('budgetish-categories')
    if (catStored) {
      const catData = JSON.parse(catStored)
      await supabase.from('user_data').upsert({
        user_id: authStore.userId,
        data_type: 'categories',
        data: { categories: catData.categories, amounts: catData.amounts || {} },
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,data_type' })
    }

    // 3. Migrate bill categories
    currentStep.value = 'Migrating bill categories...'
    const billCatStored = localStorage.getItem('budgetish-categories-bills')
    if (billCatStored) {
      const billCatData = JSON.parse(billCatStored)
      await supabase.from('user_data').upsert({
        user_id: authStore.userId,
        data_type: 'bill_categories',
        data: { categories: billCatData.categories, amounts: billCatData.amounts || {} },
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,data_type' })
    }

    // 4. Migrate bills
    currentStep.value = 'Migrating bills...'
    const billsStored = localStorage.getItem('budgetish-bills')
    if (billsStored) {
      const billsData = JSON.parse(billsStored)
      await supabase.from('user_data').upsert({
        user_id: authStore.userId,
        data_type: 'bills',
        data: { bills: billsData.bills || [], billMonthStatus: billsData.billMonthStatus || {} },
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,data_type' })
    }

    // 5. Migrate reflections
    currentStep.value = 'Migrating reflections...'
    const reflStored = localStorage.getItem('budgetish-reflections')
    if (reflStored) {
      const reflData = JSON.parse(reflStored)
      await supabase.from('user_data').upsert({
        user_id: authStore.userId,
        data_type: 'reflections',
        data: { reflections: Array.isArray(reflData) ? reflData : [] },
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,data_type' })
    }

    // 6. Reload all stores from Supabase
    currentStep.value = 'Reloading data...'
    await Promise.all([
      transactionsStore.loadFromSupabase(),
      categoriesStore.loadFromSupabase(),
      billsStore.loadFromSupabase(),
      reflectionsStore.loadFromSupabase(),
      billCategoriesStore.loadFromSupabase()
    ])

    status.value = 'done'
  } catch (e) {
    status.value = 'error'
    errorMessage.value = e.message || 'Unknown error'
  }
}

async function recoverCategories() {
  recoveryStatus.value.categories = 'running'
  recoveryStatus.value.categoriesMsg = ''
  try {
    // Fetch ALL transaction categories from Supabase (paginate just in case)
    const PAGE_SIZE = 1000
    let allTx = []
    let offset = 0
    while (true) {
      const { data: page, error } = await supabase
        .from('transactions')
        .select('category')
        .range(offset, offset + PAGE_SIZE - 1)
      if (error) throw error
      if (!page || page.length === 0) break
      allTx = allTx.concat(page)
      if (page.length < PAGE_SIZE) break
      offset += PAGE_SIZE
    }

    // Build category structure from transaction data
    const recovered = {}
    for (const tx of allTx) {
      if (!tx.category) continue
      const sep = ' - '
      const idx = tx.category.indexOf(sep)
      if (idx === -1) continue
      const main = tx.category.slice(0, idx).trim()
      const sub = tx.category.slice(idx + sep.length).trim()
      if (!main || !sub) continue
      if (!recovered[main]) recovered[main] = new Set()
      recovered[main].add(sub)
    }

    // Build ONLY from what appears in transactions.
    // For each found main category, also include its default subcategories so the user
    // doesn't lose defaults they haven't used yet. Main categories with zero transactions
    // (like "Income" if never used) are intentionally excluded.
    const merged = {}
    for (const [main, subs] of Object.entries(recovered)) {
      const defaultSubs = DEFAULT_CATEGORIES[main] || []
      const allSubs = [...new Set([...defaultSubs, ...[...subs]])]
      merged[main] = allSubs
    }

    // Save merged categories to Supabase
    const { error: saveErr } = await supabase.from('user_data').upsert({
      user_id: authStore.userId,
      data_type: 'categories',
      data: { categories: merged, amounts: categoriesStore.amounts || {} },
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,data_type' })
    if (saveErr) throw saveErr

    // Reload categories store
    await categoriesStore.loadFromSupabase()

    const totalSubs = Object.values(merged).reduce((n, arr) => n + arr.length, 0)
    recoveryStatus.value.categoriesMsg = `Recovered ${Object.keys(merged).length} main categories with ${totalSubs} subcategories total.`
    recoveryStatus.value.categories = 'done'
  } catch (e) {
    recoveryStatus.value.categoriesMsg = 'Error: ' + (e.message || 'unknown')
    recoveryStatus.value.categories = 'idle'
  }
}

function fmt(n) {
  return Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Returns the billing cycle key for a given date string (YYYY-MM-DD)
// e.g. cycleDay=20: 2026-02-20 → 2026-02-20 to 2026-03-19 → key "Feb 20 – Mar 19"
function getCycleKey(dateStr, cycleDay) {
  const [y, m, d] = dateStr.split('-').map(Number)
  let cycleYear, cycleMonth
  if (d >= cycleDay) {
    cycleYear = y; cycleMonth = m
  } else {
    // belongs to previous cycle
    if (m === 1) { cycleYear = y - 1; cycleMonth = 12 }
    else { cycleYear = y; cycleMonth = m - 1 }
  }
  // End date: one day before cycleDay of the following month
  let endYear = cycleYear, endMonth = cycleMonth + 1
  if (endMonth > 12) { endMonth = 1; endYear++ }
  const endDay = cycleDay - 1

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const startLabel = `${months[cycleMonth-1]} ${cycleDay}`
  const endLabel = `${months[endMonth-1]} ${endDay}`
  // sort key: YYYY-MM
  const sortKey = `${cycleYear}-${String(cycleMonth).padStart(2,'0')}`
  return { label: `${startLabel} – ${endLabel} '${String(cycleYear).slice(2)}`, sortKey }
}

async function loadReconciliation() {
  const cycleDay = reconciliation.value.cycleDay || 20
  reconciliation.value = { status: 'loading', rows: [], totals: {}, error: '', cycleDay }
  try {
    const PAGE_SIZE = 1000
    let all = []
    let offset = 0
    while (true) {
      const { data: page, error } = await supabase
        .from('transactions')
        .select('date, amount')
        .order('date', { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1)
      if (error) throw error
      if (!page || page.length === 0) break
      all = all.concat(page)
      if (page.length < PAGE_SIZE) break
      offset += PAGE_SIZE
    }

    const byCycle = {}
    for (const tx of all) {
      const { label, sortKey } = getCycleKey(tx.date, cycleDay)
      if (!byCycle[sortKey]) byCycle[sortKey] = { label, income: 0, spending: 0 }
      const amt = Number(tx.amount)
      if (amt >= 0) byCycle[sortKey].income += amt
      else byCycle[sortKey].spending += Math.abs(amt)
    }

    let runningBalance = 0
    const rows = Object.entries(byCycle)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, { label, income, spending }]) => {
        const netRaw = income - spending
        runningBalance += netRaw
        return {
          month: label,
          income: fmt(income),
          spending: fmt(spending),
          net: (netRaw >= 0 ? '+' : '-') + fmt(Math.abs(netRaw)),
          netRaw,
          endBalance: fmt(runningBalance)
        }
      })

    reconciliation.value = {
      status: 'done', cycleDay,
      rows,
      totals: {},
      error: ''
    }
  } catch (e) {
    reconciliation.value = { status: 'idle', rows: [], totals: {}, error: 'Error: ' + (e.message || 'unknown'), cycleDay }
  }
}

async function removeDuplicates() {
  recoveryStatus.value.duplicates = 'running'
  recoveryStatus.value.duplicatesMsg = ''
  try {
    // Fetch all transactions from Supabase
    const PAGE_SIZE = 1000
    let all = []
    let offset = 0
    while (true) {
      const { data: page, error } = await supabase
        .from('transactions')
        .select('id, date, description, category, amount')
        .order('id', { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1)
      if (error) throw error
      if (!page || page.length === 0) break
      all = all.concat(page)
      if (page.length < PAGE_SIZE) break
      offset += PAGE_SIZE
    }

    // Group by composite key: date|description|category|amount
    const groups = {}
    for (const tx of all) {
      const key = `${tx.date}|${tx.description}|${tx.category}|${Number(tx.amount).toFixed(2)}`
      if (!groups[key]) groups[key] = []
      groups[key].push(tx.id)
    }

    // Collect IDs to delete (all but the first/oldest per group — already sorted by id asc)
    const toDelete = []
    for (const ids of Object.values(groups)) {
      if (ids.length > 1) toDelete.push(...ids.slice(1))
    }

    if (toDelete.length === 0) {
      recoveryStatus.value.duplicatesMsg = 'No duplicates found. Your data is clean.'
      recoveryStatus.value.duplicates = 'done'
      return
    }

    // Delete in batches of 100
    let deleted = 0
    for (let i = 0; i < toDelete.length; i += 100) {
      const batch = toDelete.slice(i, i + 100)
      const { error } = await supabase.from('transactions').delete().in('id', batch)
      if (error) throw error
      deleted += batch.length
    }

    // Reload store
    await transactionsStore.loadFromSupabase()

    recoveryStatus.value.duplicatesMsg = `Removed ${deleted} duplicate transaction(s). Your data is clean.`
    recoveryStatus.value.duplicates = 'done'
  } catch (e) {
    recoveryStatus.value.duplicatesMsg = 'Error: ' + (e.message || 'unknown')
    recoveryStatus.value.duplicates = 'idle'
  }
}

async function restoreBills() {
  recoveryStatus.value.bills = 'running'
  recoveryStatus.value.billsMsg = ''
  try {
    // Load bills from Supabase
    const { data, error } = await supabase
      .from('user_data')
      .select('data')
      .eq('data_type', 'bills')
      .single()
    if (error) throw error
    if (!data) throw new Error('No bills data found in Supabase. Run the migration first.')

    const bills = (data.data.bills || []).map(bill => {
      const b = { ...bill }
      delete b.deletedAfter
      return b
    })

    const { error: saveErr } = await supabase.from('user_data').upsert({
      user_id: authStore.userId,
      data_type: 'bills',
      data: { bills, billMonthStatus: data.data.billMonthStatus || {} },
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,data_type' })
    if (saveErr) throw saveErr

    // Reload bills store
    billsStore.initialized = false
    await billsStore.loadFromSupabase()

    recoveryStatus.value.billsMsg = `Restored ${bills.length} bill(s). Go to the Bills page to see them.`
    recoveryStatus.value.bills = 'done'
  } catch (e) {
    recoveryStatus.value.billsMsg = 'Error: ' + (e.message || 'unknown')
    recoveryStatus.value.bills = 'idle'
  }
}
</script>
