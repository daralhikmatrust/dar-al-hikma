import { Helmet } from "react-helmet-async";
<Helmet>
  <title>Current Zakat Nisab Values | Dar Al Hikma Trust</title>
  <meta name="description" content="Stay updated with the latest Zakat Nisab values for gold and silver to ensure your charitable giving is accurate." />
  <link rel="canonical" href="https://daralhikma.org.in/zakat/nisab" />
</Helmet>

import { useEffect, useMemo, useState } from 'react'
import { FiAlertCircle, FiCheckCircle, FiInfo, FiTrendingUp } from 'react-icons/fi'

const GOLD_NISAB_GRAMS = 87.48
const SILVER_NISAB_GRAMS = 612.36

function formatCurrency(value) {
  if (value == null || Number.isNaN(value) || value === 0) return '—'
  return (
    '₹ ' +
    Number(value).toLocaleString('en-IN', {
      maximumFractionDigits: 0
    })
  )
}

export default function ZakatNisab() {
  // 1. User Inputs for Metal Prices (Initial values set to Feb 2026 averages)
  const [goldInput, setGoldInput] = useState('16057')
  const [silverInput, setSilverInput] = useState('289')
  const [wealthInput, setWealthInput] = useState('')

  // 2. Computed Numeric Values
  const goldPrice = useMemo(() => Number(goldInput) || 0, [goldInput])
  const silverPrice = useMemo(() => Number(silverInput) || 0, [silverInput])
  
  const goldNisabValue = useMemo(() => goldPrice * GOLD_NISAB_GRAMS, [goldPrice])
  const silverNisabValue = useMemo(() => silverPrice * SILVER_NISAB_GRAMS, [silverPrice])
  
  const wealthNumber = useMemo(() => {
    const n = Number(String(wealthInput).replace(/,/g, ''))
    return Number.isFinite(n) && n >= 0 ? n : null
  }, [wealthInput])

  const goldDue = useMemo(() => (wealthNumber != null && goldNisabValue > 0) ? wealthNumber >= goldNisabValue : null, [wealthNumber, goldNisabValue])
  const silverDue = useMemo(() => (wealthNumber != null && silverNisabValue > 0) ? wealthNumber >= silverNisabValue : null, [wealthNumber, silverNisabValue])
  const lowerNisab = useMemo(() => (goldNisabValue > 0 && silverNisabValue > 0) ? Math.min(goldNisabValue, silverNisabValue) : null, [goldNisabValue, silverNisabValue])

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="container-custom px-4 sm:px-6 lg:px-8 py-6 md:py-8 max-w-5xl">
          <div>
            <p className="text-xs tracking-[0.25em] uppercase text-primary-600 mb-2 font-bold">Zakat • Nisab Reference</p>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Today’s Nisab – India (INR)</h1>
            <p className="text-sm md:text-base text-slate-600 max-w-3xl">
              Enter the current local market prices for gold and silver to see today’s Nisab thresholds. 
              This tool provides guidance only and does not calculate your final Zakat liability.
            </p>
          </div>
        </div>
      </section>

      <section className="py-8 md:py-10">
        <div className="container-custom px-4 sm:px-6 lg:px-8 max-w-5xl space-y-8">
          
          {/* Metal Price Input Section */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 md:p-8">
            <div className="flex items-center gap-2 mb-6">
              <FiTrendingUp className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-semibold text-slate-900">Set Current Market Prices (₹/gram)</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Gold Price (24k) per gram</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-100 bg-slate-50 focus:border-primary-500 focus:bg-white outline-none transition-all font-bold text-lg"
                    value={goldInput}
                    onChange={(e) => setGoldInput(e.target.value.replace(/[^\d.]/g, ''))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Silver Price (999) per gram</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-100 bg-slate-50 focus:border-primary-500 focus:bg-white outline-none transition-all font-bold text-lg"
                    value={silverInput}
                    onChange={(e) => setSilverInput(e.target.value.replace(/[^\d.]/g, ''))}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Nisab Values Display */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 md:p-8 space-y-6">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-2xl bg-primary-50 flex items-center justify-center mr-2 flex-shrink-0"><FiInfo className="w-5 h-5 text-primary-700" /></div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-1">Today’s Nisab Thresholds</h2>
                <p className="text-sm text-slate-600">Calculated as <span className="font-semibold">{GOLD_NISAB_GRAMS}g Gold</span> or <span className="font-semibold">{SILVER_NISAB_GRAMS}g Silver</span>.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 flex flex-col gap-3">
                <p className="text-sm font-semibold text-slate-800 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> Gold Nisab ({GOLD_NISAB_GRAMS}g)</p>
                <p className="text-3xl font-bold text-slate-900">{formatCurrency(goldNisabValue)}</p>
              </div>
              <div className="rounded-2xl border border-primary-100 bg-primary-50/40 p-5 flex flex-col gap-3">
                <p className="text-sm font-semibold text-primary-800 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-primary-500 inline-block" /> Silver Nisab ({SILVER_NISAB_GRAMS}g)</p>
                <p className="text-3xl font-bold text-primary-800">{formatCurrency(silverNisabValue)}</p>
              </div>
            </div>

            {lowerNisab != null && (
              <div className="mt-2 rounded-2xl bg-slate-900 text-slate-100 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-2"><FiAlertCircle className="w-5 h-5 text-amber-300" /><span className="font-semibold text-sm">Lower of the two thresholds</span></div>
                <p className="text-sm text-slate-100/90">The minimum threshold (Nisab) today is <span className="font-bold text-white text-lg">{formatCurrency(lowerNisab)}</span>.</p>
              </div>
            )}
          </div>

          {/* Eligibility Calculator */}
          <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl shadow-lg border border-slate-200/80 p-6 md:p-8 space-y-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0"><FiCheckCircle className="w-5 h-5 text-primary-600" /></div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-slate-900 mb-2">Check Eligibility</h2>
                <p className="text-sm text-slate-600 leading-relaxed">Enter your total zakatable wealth to see if it meets the threshold.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-[1.5fr,1fr] gap-6 lg:gap-8 items-start">
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-700 mb-3">Your total Zakatable wealth (₹)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 text-base font-medium">₹</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="w-full pl-10 pr-4 py-4 rounded-xl border-2 border-slate-300 focus:ring-2 focus:ring-primary-500 outline-none text-base transition-all shadow-sm hover:border-slate-400"
                    placeholder="Enter total wealth in INR"
                    value={wealthInput}
                    onChange={(e) => setWealthInput(e.target.value.replace(/[^\d.]/g, ''))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className={`rounded-xl border-2 p-4 transition-all ${silverDue ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50/60'}`}>
                  <p className="text-sm font-bold text-slate-800 mb-2">Silver Nisab Status</p>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                    <span className="text-xs font-medium text-slate-700">Eligible?</span>
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide shadow-sm ${silverDue === null ? 'bg-slate-200 text-slate-500' : silverDue ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-700'}`}>
                      {silverDue === null ? '—' : silverDue ? 'YES' : 'NO'}
                    </span>
                  </div>
                </div>
                <div className={`rounded-xl border-2 p-4 transition-all ${goldDue ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-slate-50/60'}`}>
                  <p className="text-sm font-bold text-slate-800 mb-2">Gold Nisab Status</p>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                    <span className="text-xs font-medium text-slate-700">Eligible?</span>
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide shadow-sm ${goldDue === null ? 'bg-slate-200 text-slate-500' : goldDue ? 'bg-amber-500 text-white' : 'bg-slate-300 text-slate-700'}`}>
                      {goldDue === null ? '—' : goldDue ? 'YES' : 'NO'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}