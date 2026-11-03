import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useReflectionsStore } from '@/stores/reflections'
import { createESTDate } from '@/utils/dateUtils'

// Helper functions to replace date-fns
function addDays(date, days) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

function makeReflection(month, notes = '') {
  return {
    periodType: 'month',
    periodStart: `${month}-01`,
    periodEnd: `${month}-28`,
    notes,
    challenges: '',
    goals: '',
    summaryStats: {},
  }
}

describe('Reflections Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('can add a reflection and edit its month', () => {
    const store = useReflectionsStore()
    store.addOrUpdateReflection(makeReflection('2025-05', 'original'))
    expect(store.getReflections.length).toBe(1)
    expect(store.getReflections[0].periodStart).toBe('2025-05-01')
    expect(store.getReflections[0].notes).toBe('original')

    // Edit the month
    const updated = { ...store.getReflections[0], periodStart: '2025-06-01', periodEnd: '2025-06-30', notes: 'moved' }
    store.addOrUpdateReflection(updated)
    // Should not duplicate
    expect(store.getReflections.length).toBe(2)
    expect(store.getReflections.some(r => r.periodStart === '2025-05-01')).toBe(true)
    expect(store.getReflections.some(r => r.periodStart === '2025-06-01')).toBe(true)
    expect(store.getReflections.find(r => r.periodStart === '2025-06-01').notes).toBe('moved')
  })

  it('deletes the old reflection if month is changed and user confirms', () => {
    const store = useReflectionsStore()
    store.addOrUpdateReflection(makeReflection('2025-05', 'original'))
    // Simulate user moving the reflection to a new month and deleting the old
    const updated = { ...store.getReflections[0], periodStart: '2025-06-01', periodEnd: '2025-06-30', notes: 'moved' }
    store.addOrUpdateReflection(updated)
    store.deleteReflection('month', '2025-05-01')
    expect(store.getReflections.length).toBe(1)
    expect(store.getReflections[0].periodStart).toBe('2025-06-01')
    expect(store.getReflections[0].notes).toBe('moved')
  })
})

describe('Reflection month association and no migration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('keeps April reflection as April after May begins', () => {
    const store = useReflectionsStore()
    // Simulate creating a reflection for April
    store.addOrUpdateReflection(makeReflection('2025-04', 'april reflection'))
    expect(store.getReflections.length).toBe(1)
    expect(store.getReflections[0].periodStart).toBe('2025-04-01')
    expect(store.getReflections[0].notes).toBe('april reflection')
    // Simulate "new month" by re-initializing store in May
    localStorage.setItem('budgetish-reflections', JSON.stringify(store.getReflections))
    setActivePinia(createPinia())
    const store2 = useReflectionsStore()
    store2.initialize()
    expect(store2.getReflections.length).toBe(1)
    expect(store2.getReflections[0].periodStart).toBe('2025-04-01')
    expect(store2.getReflections[0].notes).toBe('april reflection')
  })

  it('can create separate reflections for April and May', () => {
    const store = useReflectionsStore()
    store.addOrUpdateReflection(makeReflection('2025-04', 'april reflection'))
    store.addOrUpdateReflection(makeReflection('2025-05', 'may reflection'))
    expect(store.getReflections.length).toBe(2)
    expect(store.getReflections.find(r => r.periodStart === '2025-04-01').notes).toBe('april reflection')
    expect(store.getReflections.find(r => r.periodStart === '2025-05-01').notes).toBe('may reflection')
  })

  it('editing April reflection does not affect May', () => {
    const store = useReflectionsStore()
    store.addOrUpdateReflection(makeReflection('2025-04', 'april reflection'))
    store.addOrUpdateReflection(makeReflection('2025-05', 'may reflection'))
    // Edit April
    const updated = { ...store.getReflections.find(r => r.periodStart === '2025-04-01'), notes: 'april updated' }
    store.addOrUpdateReflection(updated)
    expect(store.getReflections.length).toBe(2)
    expect(store.getReflections.find(r => r.periodStart === '2025-04-01').notes).toBe('april updated')
    expect(store.getReflections.find(r => r.periodStart === '2025-05-01').notes).toBe('may reflection')
  })
})

describe('Weekly Reflections', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  function getWeekRanges(year, month) {
    // month: 1-based (e.g., 4 for April)
    const start = createESTDate(year, month, 1) // EST
    const end = createESTDate(year, month + 1, 0) // EST
    const weeks = []
    let current = new Date(start)
    let week = 1
    while (current <= end) {
      const weekStart = new Date(current)
      const weekEnd = new Date(Math.min(
        new Date(current.getFullYear(), current.getMonth(), current.getDate() + 6).getTime(),
        end.getTime()
      ))
      weeks.push({
        week,
        start: weekStart.toISOString().slice(0, 10),
        end: weekEnd.toISOString().slice(0, 10)
      })
      current = addDays(weekEnd, 1)
      week++
    }
    return weeks
  }

  it('saves and loads weekly reflections for each week of a month', () => {
    const store = useReflectionsStore()
    const april = '2025-04'
    const periodStart = `${april}-01`
    const weeklyReflections = {
      1: 'Week 1 notes',
      2: 'Week 2 notes',
      3: 'Week 3 notes',
      4: 'Week 4 notes',
      5: 'Week 5 notes'
    }
    store.addOrUpdateReflection({
      periodType: 'month',
      periodStart,
      periodEnd: `${april}-30`,
      notes: '',
      challenges: '',
      goals: '',
      summaryStats: {},
      weeklyReflections
    })
    const loaded = store.getReflectionByPeriod('month', periodStart)
    expect(loaded.weeklyReflections[1]).toBe('Week 1 notes')
    expect(loaded.weeklyReflections[5]).toBe('Week 5 notes')
  })

  it('editing a weekly reflection does not affect other weeks or months', () => {
    const store = useReflectionsStore()
    const april = '2025-04'
    const may = '2025-05'
    store.addOrUpdateReflection({
      periodType: 'month',
      periodStart: `${april}-01`,
      periodEnd: `${april}-30`,
      weeklyReflections: { 1: 'April W1', 2: 'April W2' }
    })
    store.addOrUpdateReflection({
      periodType: 'month',
      periodStart: `${may}-01`,
      periodEnd: `${may}-31`,
      weeklyReflections: { 1: 'May W1', 2: 'May W2' }
    })
    // Edit April week 2
    const aprilReflection = store.getReflectionByPeriod('month', `${april}-01`)
    aprilReflection.weeklyReflections[2] = 'April W2 updated'
    store.addOrUpdateReflection(aprilReflection)
    expect(store.getReflectionByPeriod('month', `${april}-01`).weeklyReflections[2]).toBe('April W2 updated')
    expect(store.getReflectionByPeriod('month', `${may}-01`).weeklyReflections[2]).toBe('May W2')
  })

  it('computes correct week ranges with EST dates', () => {
    const weeks = getWeekRanges(2025, 4)
    expect(weeks[0].start).toBe('2025-04-01')
    expect(weeks[0].end).toBe('2025-04-07')
    expect(weeks[4].start).toBe('2025-04-29')
    expect(weeks[4].end).toBe('2025-04-30')
  })
}) 