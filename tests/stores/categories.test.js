import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useCategoriesStore } from '@/stores/categories'

describe('Categories Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('initializes with default categories', () => {
    const store = useCategoriesStore()
    store.initialize()
    expect(store.categories).toBeDefined()
    expect(Object.keys(store.categories)).toContain('Food')
    expect(Object.keys(store.categories)).toContain('Transportation')
    expect(Object.keys(store.categories)).toContain('Housing')
  })

  it('adds a subcategory correctly', () => {
    const store = useCategoriesStore()
    store.initialize()
    const result = store.addSubcategory('Food', 'Snacks')
    expect(result).toBe(true)
    expect(store.categories['Food']).toContain('Snacks')
  })

  it('prevents duplicate subcategories', () => {
    const store = useCategoriesStore()
    store.initialize()
    store.addSubcategory('Food', 'Snacks')
    const result = store.addSubcategory('Food', 'Snacks')
    expect(result).toBe(false)
  })

  it('deletes a subcategory correctly', () => {
    const store = useCategoriesStore()
    store.initialize()
    store.addSubcategory('Food', 'Snacks')
    const result = store.deleteSubcategory('Food', 'Snacks')
    expect(result).toBe(true)
    expect(store.categories['Food']).not.toContain('Snacks')
  })

  it('updates category amounts correctly', () => {
    const store = useCategoriesStore()
    store.initialize()
    store.updateCategoryAmount('Food', 'Groceries', 50)
    expect(store.getCategoryAmount('Food', 'Groceries')).toBe(50)
  })

  it('calculates category totals correctly', () => {
    const store = useCategoriesStore()
    store.initialize()
    store.updateCategoryAmount('Food', 'Groceries', 50)
    store.updateCategoryAmount('Food', 'Dining Out', 30)
    expect(store.getCategoryTotal('Food')).toBe(80)
  })

  it('persists changes to localStorage', () => {
    const store = useCategoriesStore()
    store.initialize()
    store.addSubcategory('Food', 'Snacks')
    
    // Create a new store instance to test persistence
    const newStore = useCategoriesStore()
    newStore.initialize()
    expect(newStore.categories['Food']).toContain('Snacks')
  })

  it('handles undo/redo operations correctly', () => {
    const store = useCategoriesStore()
    store.initialize()
    
    // Save initial state before making changes
    store.saveState()
    
    // Make a change
    store.addSubcategory('Food', 'Snacks')
    expect(store.categories['Food']).toContain('Snacks')
    
    // Undo the change
    store.undo()
    expect(store.categories['Food']).not.toContain('Snacks')
    
    // Redo the change
    store.redo()
    expect(store.categories['Food']).toContain('Snacks')
  })

  it('validateCategory accepts trimmed main/sub and extra spaces around separator', () => {
    const store = useCategoriesStore()
    store.initialize()
    expect(store.validateCategory('Transportation - Car Payment')).toBe(true)
    expect(store.validateCategory('  Transportation  -  Car Payment  ')).toBe(true)
  })

  it('updateCategoryAmount does not push category undo snapshots (avoids localStorage bloat)', () => {
    const store = useCategoriesStore()
    store.initialize()
    const depth = store.undoStack.length
    store.updateCategoryAmount('Food', 'Groceries', 99)
    expect(store.undoStack.length).toBe(depth)
    expect(store.getCategoryAmount('Food', 'Groceries')).toBe(99)
  })
}) 