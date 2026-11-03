import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useDebtMilestoneStore } from '@/stores/debtMilestone'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/utils/supabase'

vi.mock('@/utils/supabase', () => {
  const maybeSingleFn = vi.fn().mockResolvedValue({ data: null, error: null })
  const eqChain = { eq: vi.fn(), maybeSingle: maybeSingleFn }
  eqChain.eq.mockReturnValue(eqChain)
  const selectFn = vi.fn(() => eqChain)
  const fromFn = vi.fn(() => ({
    select: selectFn
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

describe('Debt Milestone Store', () => {
  let mockAuth

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    mockAuth = {
      isLoggedIn: true,
      userId: 'test-user-id',
      loading: false,
      init: vi.fn().mockResolvedValue()
    }
    useAuthStore.mockReturnValue(mockAuth)
  })

  it('hasMilestone is false when no row exists in Supabase', async () => {
    const chain = supabase.from('user_data').select('data')
    chain.maybeSingle.mockResolvedValueOnce({ data: null, error: null })

    const store = useDebtMilestoneStore()
    await store.loadFromSupabase()

    expect(store.hasMilestone).toBe(false)
    expect(store.milestone).toBeNull()
  })

  it('hasMilestone is true when a valid row exists in Supabase', async () => {
    const chain = supabase.from('user_data').select('data')
    chain.maybeSingle.mockResolvedValueOnce({
      data: {
        data: {
          name: 'Sample Loan',
          monthly: 500,
          start: '2025-01',
          end: '2029-12'
        }
      },
      error: null
    })

    const store = useDebtMilestoneStore()
    await store.loadFromSupabase()

    expect(store.hasMilestone).toBe(true)
    expect(store.milestone).toEqual({
      name: 'Sample Loan',
      monthly: 500,
      start: '2025-01',
      end: '2029-12'
    })
  })
})

