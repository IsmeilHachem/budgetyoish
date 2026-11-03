import { describe, it, expect, beforeEach } from 'vitest'

// Simulate the per-month bill paid status logic
function createBillPaidStatus() {
  return {}
}

function markBillAsPaid(billPaidStatus, billId, month) {
  if (!billPaidStatus[billId]) billPaidStatus[billId] = {}
  billPaidStatus[billId][month] = true
}

function markBillAsUnpaid(billPaidStatus, billId, month) {
  if (!billPaidStatus[billId]) billPaidStatus[billId] = {}
  billPaidStatus[billId][month] = false
}

function isBillPaid(billPaidStatus, billId, month) {
  return billPaidStatus[billId]?.[month] || false
}

function deleteBill(billPaidStatus, billId, currentMonth) {
  // Remove from future months only
  if (billPaidStatus[billId]) {
    Object.keys(billPaidStatus[billId]).forEach(month => {
      if (month > currentMonth) delete billPaidStatus[billId][month]
    })
  }
}

describe('Bills per-month paid/unpaid logic', () => {
  let billPaidStatus
  const billId = 'bill-1'
  const april = '2025-04'
  const may = '2025-05'
  const june = '2025-06'

  beforeEach(() => {
    billPaidStatus = createBillPaidStatus()
  })

  it('starts unpaid for a new month', () => {
    expect(isBillPaid(billPaidStatus, billId, april)).toBe(false)
    expect(isBillPaid(billPaidStatus, billId, may)).toBe(false)
  })

  it('marking paid in one month does not affect other months', () => {
    markBillAsPaid(billPaidStatus, billId, april)
    expect(isBillPaid(billPaidStatus, billId, april)).toBe(true)
    expect(isBillPaid(billPaidStatus, billId, may)).toBe(false)
    markBillAsPaid(billPaidStatus, billId, may)
    expect(isBillPaid(billPaidStatus, billId, april)).toBe(true)
    expect(isBillPaid(billPaidStatus, billId, may)).toBe(true)
  })

  it('marking unpaid in one month does not affect other months', () => {
    markBillAsPaid(billPaidStatus, billId, april)
    markBillAsPaid(billPaidStatus, billId, may)
    markBillAsUnpaid(billPaidStatus, billId, may)
    expect(isBillPaid(billPaidStatus, billId, april)).toBe(true)
    expect(isBillPaid(billPaidStatus, billId, may)).toBe(false)
  })

  it('deleting a bill in the current month does not remove it from past months but does from future months', () => {
    markBillAsPaid(billPaidStatus, billId, april)
    markBillAsPaid(billPaidStatus, billId, may)
    markBillAsPaid(billPaidStatus, billId, june)
    deleteBill(billPaidStatus, billId, may)
    expect(isBillPaid(billPaidStatus, billId, april)).toBe(true)
    expect(isBillPaid(billPaidStatus, billId, may)).toBe(true)
    expect(isBillPaid(billPaidStatus, billId, june)).toBe(false)
  })
}) 