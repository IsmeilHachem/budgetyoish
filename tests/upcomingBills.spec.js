import { describe, it, expect } from 'vitest'
import { getUpcomingBillRows, getDaysInMonth, getMonthsInRange } from '../src/utils/upcomingBills'

describe('upcomingBills helper', () => {
  it('clamps the 31st due day into February (non-leap and leap year)', () => {
    const bills = [
      {
        id: 'bill-31',
        name: 'rent',
        dueDate: '2025-01-31',
        amount: 1200,
        category: 'Housing - Rent',
        archived: false,
        deletedAfter: null
      }
    ]

    // 2026 is not a leap year -> 2026-02-28
    const rows2026 = getUpcomingBillRows(bills, {}, { start: '2026-02', end: '2026-02' }, '2026-01')
    expect(rows2026).toHaveLength(1)
    expect(rows2026[0].date).toBe('2026-02-28')
    expect(rows2026[0].id).toBe('upcoming-bill-31-2026-02')
    expect(rows2026[0].amount).toBe(-1200)
    expect(rows2026[0].isUpcoming).toBe(true)

    // 2028 is a leap year -> 2028-02-29
    const rows2028 = getUpcomingBillRows(bills, {}, { start: '2028-02', end: '2028-02' }, '2026-01')
    expect(rows2028).toHaveLength(1)
    expect(rows2028[0].date).toBe('2028-02-29')
  })

  it('excludes a month where the bill is marked paid', () => {
    const bills = [
      {
        id: 'bill-1',
        name: 'netflix',
        dueDate: '2026-01-15',
        amount: 15,
        category: 'Personal - Subscriptions',
        archived: false,
        deletedAfter: null
      }
    ]
    const billMonthStatus = {
      'bill-1': {
        '2026-11': { paid: true, amount: 15 },
        '2026-12': { paid: false, amount: 0 }
      }
    }

    const rows = getUpcomingBillRows(bills, billMonthStatus, { start: '2026-11', end: '2026-12' }, '2026-11')
    expect(rows).toHaveLength(1)
    expect(rows[0].month).toBe('2026-12')
    expect(rows[0].date).toBe('2026-12-15')
  })

  it('excludes months >= bill.deletedAfter and excludes archived bills', () => {
    const bills = [
      {
        id: 'bill-del',
        name: 'gym',
        dueDate: '2026-01-10',
        amount: 45,
        category: 'Personal - Fitness',
        archived: false,
        deletedAfter: '2026-12'
      },
      {
        id: 'bill-arch',
        name: 'old service',
        dueDate: '2026-01-05',
        amount: 20,
        category: 'Personal - Subscriptions',
        archived: true,
        deletedAfter: null
      }
    ]

    const rows = getUpcomingBillRows(bills, {}, { start: '2026-11', end: '2027-01' }, '2026-11')
    expect(rows).toHaveLength(1)
    expect(rows[0].billId).toBe('bill-del')
    expect(rows[0].month).toBe('2026-11')
  })

  it('sets amount to 0 and noAmount = true when bill.amount is null or 0', () => {
    const bills = [
      {
        id: 'bill-null',
        name: 'electric',
        dueDate: '2026-01-20',
        amount: null,
        category: 'Housing - Utilities',
        archived: false,
        deletedAfter: null
      },
      {
        id: 'bill-zero',
        name: 'water',
        dueDate: '2026-01-22',
        amount: 0,
        category: 'Housing - Utilities',
        archived: false,
        deletedAfter: null
      },
      {
        id: 'bill-pos',
        name: 'internet',
        dueDate: '2026-01-25',
        amount: 65,
        category: 'Housing - Utilities',
        archived: false,
        deletedAfter: null
      }
    ]

    const rows = getUpcomingBillRows(bills, {}, { start: '2026-11', end: '2026-11' }, '2026-11')
    expect(rows).toHaveLength(3)

    const nullRow = rows.find(r => r.billId === 'bill-null')
    expect(nullRow.amount).toBe(0)
    expect(nullRow.noAmount).toBe(true)

    const zeroRow = rows.find(r => r.billId === 'bill-zero')
    expect(zeroRow.amount).toBe(0)
    expect(zeroRow.noAmount).toBe(true)

    const posRow = rows.find(r => r.billId === 'bill-pos')
    expect(posRow.amount).toBe(-65)
    expect(posRow.noAmount).toBe(false)
  })

  it('excludes past months (months before currentMonth) and months before bill start month', () => {
    const bills = [
      {
        id: 'bill-early',
        name: 'insurance',
        dueDate: '2026-01-12',
        amount: 100,
        category: 'Transportation - Insurance',
        archived: false,
        deletedAfter: null
      },
      {
        id: 'bill-future-start',
        name: 'new loan',
        dueDate: '2026-12-05',
        amount: 250,
        category: 'Debt - Personal Loans',
        archived: false,
        deletedAfter: null
      }
    ]

    // Range includes past month 2026-10, current month 2026-11, and future month 2026-12
    const rows = getUpcomingBillRows(bills, {}, { start: '2026-10', end: '2026-12' }, '2026-11')

    // 2026-10 must be excluded completely
    expect(rows.some(r => r.month === '2026-10')).toBe(false)

    // bill-early should appear in 2026-11 and 2026-12
    expect(rows.filter(r => r.billId === 'bill-early').map(r => r.month)).toEqual(['2026-11', '2026-12'])

    // bill-future-start starts in 2026-12, so only 2026-12
    expect(rows.filter(r => r.billId === 'bill-future-start').map(r => r.month)).toEqual(['2026-12'])
  })

  it('getDaysInMonth and getMonthsInRange work with plain numbers and strings', () => {
    expect(getDaysInMonth(2025, 2)).toBe(28)
    expect(getDaysInMonth(2024, 2)).toBe(29)
    expect(getDaysInMonth(2026, 4)).toBe(30)
    expect(getDaysInMonth(2026, 12)).toBe(31)

    expect(getMonthsInRange('2026-11', '2027-02')).toEqual([
      '2026-11',
      '2026-12',
      '2027-01',
      '2027-02'
    ])
  })
})

