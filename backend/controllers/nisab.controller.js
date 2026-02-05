import { computeNisab, getTodayPrices } from '../services/nisab.service.js';

export const getTodayNisab = async (req, res, next) => {
  try {
    const force = req.query.force === 'true';
    const currency = String(req.query.currency || 'INR').toUpperCase();
    
    if (!/^[A-Z]{3}$/.test(currency)) {
      return res.status(400).json({ message: 'Invalid currency. Use a 3-letter code like INR, USD.' });
    }

    let prices;
    try {
      // This calls your service which now uses the RAPIDAPI_KEY from .env
      prices = await getTodayPrices({ currency, force });
    } catch (apiErr) {
      console.error('Nisab Service Failed completely:', apiErr.message);
      
      // CRITICAL: Hardcoded Safety Fallback to prevent 500 error if all APIs fail
      // Prices are approximate for Feb 2026
      prices = {
        goldPerGram: 7800, 
        silverPerGram: 95,
        currency: 'INR',
        source: 'Emergency Fallback (Market Estimate)',
        fetchedAt: new Date().toISOString()
      };
    }

    const nisab = computeNisab({
      goldPerGram: prices.goldPerGram,
      silverPerGram: prices.silverPerGram,
    });

    res.json({
      success: true,
      prices,
      nisab,
      note: 'According to Islamic law, Nisab is calculated using the lower value of gold or silver.',
      disclaimer: 'Rates are indicative and based on market data.',
    });
  } catch (err) {
    // This ensures the global error handler catches anything else
    next(err);
  }
};