import LZString from 'lz-string'

export const TRANSACTIONS_STORE_FORMAT = 1

/**
 * Serialize transactions + initialized flag for localStorage (compressed).
 */
export function serializeTransactionsForStorage({ transactions, initialized }) {
  const inner = JSON.stringify({ transactions, initialized })
  const compressed = LZString.compressToBase64(inner)
  return JSON.stringify({ v: TRANSACTIONS_STORE_FORMAT, d: compressed })
}

/**
 * Parse raw localStorage string: supports compressed { v, d } and legacy { transactions, initialized }.
 * @returns {{ transactions: array, initialized: boolean } | null}
 */
export function parseTransactionsFromStorage(storedString) {
  const outer = JSON.parse(storedString)
  if (outer && outer.v === TRANSACTIONS_STORE_FORMAT && typeof outer.d === 'string') {
    const json = LZString.decompressFromBase64(outer.d)
    if (!json) return null
    const inner = JSON.parse(json)
    return {
      transactions: inner.transactions || [],
      initialized: inner.initialized !== false
    }
  }
  if (outer && Array.isArray(outer.transactions)) {
    return {
      transactions: outer.transactions,
      initialized: outer.initialized !== false
    }
  }
  return null
}
