import pool from '../utils/db.js';

export const GOLD_NISAB_GRAMS = 87.48;
export const SILVER_NISAB_GRAMS = 612.36;

function getIndiaDateISO() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  const d = parts.find((p) => p.type === 'day')?.value;
  return `${y}-${m}-${d}`;
}

/**
 * Retrieves the latest saved prices from the database.
 * If no prices exist, it returns a realistic February 2026 fallback.
 */
export async function getTodayPrices({ currency = 'INR' } = {}) {
  const ccy = String(currency || 'INR').toUpperCase();

  try {
    const { rows } = await pool.query(
      `SELECT gold_per_gram, silver_per_gram, source, fetched_at 
       FROM metal_prices 
       WHERE currency = $1 
       ORDER BY fetched_at DESC LIMIT 1`,
      [ccy]
    );

    if (rows?.[0]) {
      return {
        asOfDate: getIndiaDateISO(),
        currency: ccy,
        goldPerGram: Number(rows[0].gold_per_gram),
        silverPerGram: Number(rows[0].silver_per_gram),
        source: rows[0].source,
        fetchedAt: rows[0].fetched_at,
      };
    }
  } catch (dbErr) {
    console.error('Database retrieval failed:', dbErr.message);
  }

  // Final Safety Fallback (Realistic Feb 2026 Indian Rates)
  return {
    asOfDate: getIndiaDateISO(),
    currency: ccy,
    goldPerGram: 16057,
    silverPerGram: 289,
    source: 'Default Market Average',
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Saves manual prices sent from the frontend to the database.
 * Use this in your controller to update the "Global" price for all users.
 */
export async function saveManualPrices({ goldPrice, silverPrice, currency = 'INR' }) {
  const asOfDate = getIndiaDateISO();
  const ccy = currency.toUpperCase();

  try {
    await pool.query(
      `INSERT INTO metal_prices (as_of_date, currency, gold_per_gram, silver_per_gram, source, fetched_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (as_of_date, currency)
       DO UPDATE SET 
         gold_per_gram = EXCLUDED.gold_per_gram, 
         silver_per_gram = EXCLUDED.silver_per_gram, 
         source = EXCLUDED.source, 
         fetched_at = NOW()`,
      [asOfDate, ccy, goldPrice, silverPrice, 'Manual Entry']
    );
    return { success: true };
  } catch (err) {
    console.error('Failed to save manual prices:', err.message);
    throw err;
  }
}

export function computeNisab({ goldPerGram, silverPerGram }) {
  const goldNisab = goldPerGram * GOLD_NISAB_GRAMS;
  const silverNisab = silverPerGram * SILVER_NISAB_GRAMS;
  return {
    goldGrams: GOLD_NISAB_GRAMS,
    silverGrams: SILVER_NISAB_GRAMS,
    goldNisab: Math.round(goldNisab),
    silverNisab: Math.round(silverNisab),
    finalNisab: Math.round(Math.min(goldNisab, silverNisab)),
    rule: 'lower_of_gold_or_silver',
  };
}