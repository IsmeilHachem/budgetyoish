import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { usePlanStore } from '@/stores/plan'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/utils/supabase'

vi.mock('@/utils/supabase', () => {
  const upsertFn = vi.fn().mockResolvedValue({ error: null })
  const maybeSingleFn = vi.fn().mockResolvedValue({ data: null, error: null })
  const eqFn = vi.fn(() => ({ maybeSingle: maybeSingleFn }))
  const selectFn = vi.fn(() => ({ eq: eqFn }))
  const fromFn = vi.fn(() => ({
    select: selectFn,
    upsert: upsertFn
  }))

  return {
    supabase: {
      from: fromFn,
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        onAuthStateChange: vi.fn()
      }
    }
  }
})

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn()
}))

describe('Plan Store', () => {
  let mockAuth

  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()

    mockAuth = {
      isLoggedIn: true,
      userId: 'test-user-id',
      loading: false,
      init: vi.fn().mockResolvedValue()
    }
    useAuthStore.mockReturnValue(mockAuth)
  })

  it('toggle flips a task and writes to localStorage', () => {
    const store = usePlanStore()
    expect(store.done['lic-study']).toBeFalsy()

    store.toggle('lic-study')
    expect(store.done['lic-study']).toBe(true)

    const stored1 = JSON.parse(localStorage.getItem('budgetish-spain-plan'))
    expect(stored1.done['lic-study']).toBe(true)

    store.toggle('lic-study')
    expect(store.done['lic-study']).toBe(false)

    const stored2 = JSON.parse(localStorage.getItem('budgetish-spain-plan'))
    expect(stored2.done['lic-study']).toBe(false)
  })

  it('addTask ignores empty or whitespace text, and two quick adds get different ids', () => {
    const store = usePlanStore()
    expect(store.addTask('2026-Q4', '')).toBe(false)
    expect(store.addTask('2026-Q4', '   ')).toBe(false)
    expect(store.custom['2026-Q4'] || []).toHaveLength(0)

    const res1 = store.addTask('2026-Q4', 'First task')
    const res2 = store.addTask('2026-Q4', 'Second task')
    expect(res1).toBe(true)
    expect(res2).toBe(true)

    const tasks = store.custom['2026-Q4']
    expect(tasks).toHaveLength(2)
    expect(tasks[0].id).not.toBe(tasks[1].id)
    expect(tasks[0].text).toBe('First task')
    expect(tasks[1].text).toBe('Second task')
  })

  it('removeTask removes the task and clears its done flag', () => {
    const store = usePlanStore()
    store.addTask('2026-Q4', 'Task to remove')
    const addedTask = store.custom['2026-Q4'][0]

    store.toggle(addedTask.id)
    expect(store.done[addedTask.id]).toBe(true)

    store.removeTask('2026-Q4', addedTask.id)
    expect(store.custom['2026-Q4'].find(t => t.id === addedTask.id)).toBeUndefined()
    expect(store.done[addedTask.id]).toBeUndefined()
  })

  it('saveToSupabase does not call Supabase while initialized is false', () => {
    const store = usePlanStore()
    store.initialized = false

    store.saveToSupabase()
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('reset clears everything', () => {
    const store = usePlanStore()
    store.toggle('lic-study')
    store.addTask('2026-Q4', 'Custom task')
    expect(Object.keys(store.done).length).toBeGreaterThan(0)
    expect(store.custom['2026-Q4'].length).toBeGreaterThan(0)

    store.reset()
    expect(store.done).toEqual({})
    expect(store.custom).toEqual({})

    const stored = JSON.parse(localStorage.getItem('budgetish-spain-plan'))
    expect(stored.done).toEqual({})
    expect(stored.custom).toEqual({})
  })
})
