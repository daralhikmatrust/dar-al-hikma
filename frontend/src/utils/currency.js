/**
 * Normalize amount to 2 decimal places to avoid floating-point precision errors.
 * Use for all calculations, storage, and before sending to payment gateways.
 */
export function normalizeAmount(value) {
  if (value == null || value === '' || isNaN(Number(value))) return 0
  return Math.round(Number(value) * 100) / 100
}

/**
 * Format amount for display. Always 2 decimal places, correct rounding.
 */
export function formatCurrency(amount, options = {}) {
  const n = normalizeAmount(amount)
  return n.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options
  })
}

/**
 * Format with ₹ prefix for INR.
 */
export function formatINR(amount, options = {}) {
  return '₹' + formatCurrency(amount, options)
}

/**
 * Format amount for given currency (INR, USD, etc.)
 */
export function formatAmountByCurrency(amount, currency = 'INR') {
  const n = normalizeAmount(amount)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(n)
}

/**
 * Convert to paise (integer) for Razorpay. Avoids float precision.
 */
export function toPaise(amount) {
  return Math.round(normalizeAmount(amount) * 100)
}
