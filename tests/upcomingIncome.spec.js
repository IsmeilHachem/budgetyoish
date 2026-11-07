import { describe, it, expect } from 'vitest'
import { getUpcomingIncomeRows, dateStrToDayCount, dayCountToDateStr } from '../src/utils/upcomingIncome'

describe('upcomingIncome helper', () => {
  it('generates weekly paychecks on the same weekday from startDate', () => {
    const sources = [
      {
        id: 'inc-weekly',
        name: 'Paycheck',
        amount: 800,
        category: 'Pay Day - Pay Day',
        frequency: 'weekly',
        startDate: '2026-11-06',
        days: [],
        endDate: null
      }
    ]

    const rows = getUpcomingIncomeRows(sources, {}, '2026-11', '2026-11', '2026-11-01')
    expect(rows.map(r => r.date)).toEqual([
      '2026-11-06',
      '2026-11-13',
      '2026-11-20',
      '2026-11-27'
    ])
    expect(rows[0]).toMatchObject({
      id: 'upcoming-income-inc-weekly-2026-11-06',
      sourceId: 'inc-weekly',
      scheduledDate: '2026-11-06',
      date: '2026-11-06',
      description: 'Paycheck',
      category: 'Pay Day - Pay Day',
      amount: 800,
      isUpcoming: true,
      isIncome: true
    })
  })

  it('generates biweekly paychecks stepping in 14-day increments across month and year boundaries', () => {
    const sources = [
      {
        id: 'inc-biweekly',
        name: 'Paycheck',
        amount: 1500,
        category: 'Pay Day - Pay Day',
        frequency: 'biweekly',
        startDate: '2026-10-23',
        days: [],
        endDate: null
      }
    ]

    // Anchor 2026-10-23 -> +14d = 2026-11-06 -> +14d = 2026-11-20 -> +14d = 2026-12-04 -> +14d = 2026-12-18 -> +14d = 2027-01-01
    const rows = getUpcomingIncomeRows(sources, {}, '2026-11', '2027-01', '2026-11-01')
    expect(rows.map(r => r.date)).toEqual([
      '2026-11-06',
      '2026-11-20',
      '2026-12-04',
      '2026-12-18',
      '2027-01-01',
      '2027-01-15',
      '2027-01-29'
    ])
  })

  it('handles semimonthly schedules with day clamping and deduplicates when both days clamp to the same date', () => {
    const sources = [
      {
        id: 'inc-semi-std',
        name: 'Paycheck',
        amount: 2000,
        category: 'Pay Day - Pay Day',
        frequency: 'semimonthly',
        startDate: '2026-01-01',
        days: [15, 31],
        endDate: null
      },
      {
        id: 'inc-semi-clamp-dupe',
        name: 'Side Income',
        amount: 500,
        category: 'Income - Other',
        frequency: 'semimonthly',
        startDate: '2026-01-01',
        days: [30, 31],
        endDate: null
      }
    ]

    // In Feb 2026 (28 days):
    // inc-semi-std (15, 31) -> 2026-02-15 and 2026-02-28
    // inc-semi-clamp-dupe (30, 31) -> both clamp to 28, deduplicated to a single 2026-02-28 row
    const febRows = getUpcomingIncomeRows(sources, {}, '2026-02', '2026-02', '2026-02-01')
    const stdDates = febRows.filter(r => r.sourceId === 'inc-semi-std').map(r => r.date)
    const dupeDates = febRows.filter(r => r.sourceId === 'inc-semi-clamp-dupe').map(r => r.date)

    expect(stdDates).toEqual(['2026-02-15', '2026-02-28'])
    expect(dupeDates).toEqual(['2026-02-28'])

    // In April 2026 (30 days): (30, 31) also both clamp to 2026-04-30 -> single row
    const aprRows = getUpcomingIncomeRows([sources[1]], {}, '2026-04', '2026-04', '2026-04-01')
    expect(aprRows.map(r => r.date)).toEqual(['2026-04-30'])
  })

  it('clamps monthly day 31 in a 30-day month and in February (non-leap and leap year)', () => {
    const sources = [
      {
        id: 'inc-monthly',
        name: 'Monthly Stipend',
        amount: 3000,
        category: 'Income - Salary',
        frequency: 'monthly',
        startDate: '2026-01-31',
        days: [31],
        endDate: null
      }
    ]

    const rows2026 = getUpcomingIncomeRows(sources, {}, '2026-02', '2026-04', '2026-02-01')
    expect(rows2026.map(r => r.date)).toEqual([
      '2026-02-28',
      '2026-03-31',
      '2026-04-30'
    ])

    // Leap year February 2028
    const rows2028 = getUpcomingIncomeRows(sources, {}, '2028-02', '2028-02', '2028-02-01')
    expect(rows2028.map(r => r.date)).toEqual(['2028-02-29'])
  })

  it('respects startDate and endDate limits', () => {
    const sources = [
      {
        id: 'inc-bounded',
        name: 'Contract Pay',
        amount: 1000,
        category: 'Income - Salary',
        frequency: 'weekly',
        startDate: '2026-11-10',
        days: [],
        endDate: '2026-11-24'
      }
    ]

    const rows = getUpcomingIncomeRows(sources, {}, '2026-11', '2026-12', '2026-11-01')
    expect(rows.map(r => r.date)).toEqual([
      '2026-11-10',
      '2026-11-17',
      '2026-11-24'
    ])
  })

  it('excludes already-confirmed occurrences and past dates (< todayDate)', () => {
    const sources = [
      {
        id: 'inc-1',
        name: 'Paycheck',
        amount: 1200,
        category: 'Pay Day - Pay Day',
        frequency: 'weekly',
        startDate: '2026-11-06',
        days: [],
        endDate: null
      }
    ]

    const confirmedOccurrences = {
      'inc-1': {
        '2026-11-20': { amount: 1200, paidDate: '2026-11-20' }
      }
    }

    // Today is 2026-11-10 -> 2026-11-06 is in the past and excluded; 2026-11-20 is confirmed and excluded
    const rows = getUpcomingIncomeRows(sources, confirmedOccurrences, '2026-11', '2026-11', '2026-11-10')
    expect(rows.map(r => r.date)).toEqual([
      '2026-11-13',
      '2026-11-27'
    ])
  })

  it('respects rangeStart and rangeEnd boundaries', () => {
    const sources = [
      {
        id: 'inc-semi',
        name: 'Paycheck',
        amount: 1000,
        category: 'Pay Day - Pay Day',
        frequency: 'semimonthly',
        startDate: '2026-01-01',
        days: [1, 15],
        endDate: null
      }
    ]

    const rows = getUpcomingIncomeRows(sources, {}, '2026-11-10', '2026-12-10', '2026-11-01')
    expect(rows.map(r => r.date)).toEqual([
      '2026-11-15',
      '2026-12-01'
    ])
  })

  it('round-trips date strings through integer day counts accurately', () => {
    const sample = '2026-11-07'
    const count = dateStrToDayCount(sample)
    expect(dayCountToDateStr(count)).toBe(sample)
    expect(dayCountToDateStr(count + 14)).toBe('2026-11-21')
  })
})

