/**
 * Normalize amount to 2 decimal places to avoid floating-point precision errors.
 */
function normalizeAmount(value) {
  if (value == null || value === '' || isNaN(Number(value))) return 0
  return Math.round(Number(value) * 100) / 100
}

/**
 * Convert amount to paise (integer) for Razorpay. Avoids float precision.
 */
function toPaise(amount) {
  return Math.round(normalizeAmount(amount) * 100)
}

export { normalizeAmount, toPaise }
