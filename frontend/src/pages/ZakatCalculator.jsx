<Helmet>
  <title>Zakat Calculator Online | Calculate Your Zakat Accurately</title>
  <meta name="description" content="Use our easy-to-use Zakat Calculator to calculate your Zakat on gold, silver, cash, and assets according to Islamic principles." />
  <link rel="canonical" href="https://daralhikma.org.in/zakat-calculator" />
</Helmet>

import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import PageHeader from '../components/PageHeader'
import {
  FiTrendingUp,
  FiTrendingDown,
  FiBarChart2,
  FiPrinter,
  FiDownload,
  FiFileText,
  FiHeart,
  FiDollarSign,
  FiActivity,     // Added this
  FiCheckCircle,  // Added this
  FiPieChart,
  FiBriefcase,
  FiShoppingBag,
  FiHome,
  FiCreditCard,
  FiUsers,
  FiFile,
  FiArchive,
  FiTruck,
  FiPercent,
} from 'react-icons/fi'

import { formatINR, normalizeAmount } from '../utils/currency'

const ZAKAT_RATE = 0.025

function parseInput(val) {
  if (val === '' || val == null) return 0
  const s = String(val).replace(/[^\d.-]/g, '')
  const n = parseFloat(s)
  return Number.isNaN(n) ? 0 : Math.max(0, n)
}

const ASSET_FIELDS = [
  { key: 'gold', label: 'Gold', icon: FiPieChart },
  { key: 'silver', label: 'Silver', icon: FiPieChart },
  { key: 'cash', label: 'Cash', icon: FiDollarSign },
  { key: 'bankDeposits', label: 'Bank Deposits', icon: FiArchive },
  { key: 'policyBondFd', label: 'Policy / Bond / FD', icon: FiFile },
  { key: 'givenLoan', label: 'Given Loan', icon: FiCreditCard },
  { key: 'otherAssets', label: 'Other Assets', icon: FiBriefcase },
  { key: 'rawMaterials', label: 'Raw Materials', icon: FiArchive },
  { key: 'manufacturedGoods', label: 'Manufactured Goods', icon: FiShoppingBag },
  { key: 'tradingProperties', label: 'Trading Properties', icon: FiHome },
  { key: 'businessPartnership', label: 'Business Partnership Assets', icon: FiUsers },
]

const DEDUCTION_FIELDS = [
  { key: 'loans', label: 'Loans', icon: FiCreditCard },
  { key: 'duesInstallments', label: 'Dues / Installments', icon: FiFile },
  { key: 'committeeChitFund', label: 'Committee / Chit Fund Payables', icon: FiUsers },
  { key: 'utilityBills', label: 'Utility Bills', icon: FiHome },
  { key: 'dealerPayables', label: 'Dealer Payables', icon: FiTruck },
  { key: 'employeeSalaries', label: 'Employee Salaries', icon: FiUsers },
  { key: 'unpaidZakat', label: 'Unpaid Zakat from Previous Year', icon: FiPercent },
]

const initialAssets = Object.fromEntries(ASSET_FIELDS.map((f) => [f.key, '']))
const initialDeductions = Object.fromEntries(DEDUCTION_FIELDS.map((f) => [f.key, '']))

export default function ZakatCalculator() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const [assets, setAssets] = useState(initialAssets)
  const [deductions, setDeductions] = useState(initialDeductions)
  const [donateLoading, setDonateLoading] = useState(false)
  const [guestModal, setGuestModal] = useState(false)
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [guestInfo, setGuestInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: { city: '', state: '', district: '', pincode: '' },
  })

  useEffect(() => {
    if (isAuthenticated && user) {
      setGuestInfo({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || { city: '', state: '', district: '', pincode: '' },
      })
    }
  }, [isAuthenticated, user])



  const formatNumber = (val) => normalizeAmount(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })


  const assetValues = useMemo(
    () => Object.fromEntries(ASSET_FIELDS.map((f) => [f.key, parseInput(assets[f.key])])),
    [assets]
  )
  const deductionValues = useMemo(
    () => Object.fromEntries(DEDUCTION_FIELDS.map((f) => [f.key, parseInput(deductions[f.key])])),
    [deductions]
  )

  const totalAssets = useMemo(
    () => Object.values(assetValues).reduce((a, b) => a + b, 0),
    [assetValues]
  )
  const totalDeductions = useMemo(
    () => Object.values(deductionValues).reduce((a, b) => a + b, 0),
    [deductionValues]
  )
  const zakatableWealth = useMemo(
    () => Math.max(0, totalAssets - totalDeductions),
    [totalAssets, totalDeductions]
  )
  const zakatAmount = useMemo(() => normalizeAmount(zakatableWealth * ZAKAT_RATE), [zakatableWealth])

  const updateAsset = (key, val) => {
    // Only allow numbers and decimal point
    let cleaned = String(val).replace(/[^0-9.]/g, '')
    // Prevent multiple decimal points
    const parts = cleaned.split('.')
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('')
    }
    // Limit to 2 decimal places
    if (parts.length === 2 && parts[1].length > 2) {
      cleaned = parts[0] + '.' + parts[1].substring(0, 2)
    }
    setAssets((prev) => ({ ...prev, [key]: cleaned }))
  }
  const updateDeduction = (key, val) => {
    // Only allow numbers and decimal point
    let cleaned = String(val).replace(/[^0-9.]/g, '')
    // Prevent multiple decimal points
    const parts = cleaned.split('.')
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('')
    }
    // Limit to 2 decimal places
    if (parts.length === 2 && parts[1].length > 2) {
      cleaned = parts[0] + '.' + parts[1].substring(0, 2)
    }
    setDeductions((prev) => ({ ...prev, [key]: cleaned }))
  }

  const safePrint = () => {
    const w = window.open('', '_blank')
    if (!w) {
      toast.error('Please allow popups to print.')
      return
    }
    w.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Zakat Calculator - Dar Al Hikma Trust</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Amiri:wght@400;700&display=swap" rel="stylesheet">
          <style>
            * { box-sizing: border-box; }
            body { font-family: 'Poppins', 'Inter', system-ui, sans-serif; padding: 24px; color: #1f2937; }
            h1 { font-family: 'Poppins', 'Inter', system-ui, sans-serif; color: #065f46; margin-bottom: 8px; }
            .sub { color: #6b7280; margin-bottom: 24px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            th, td { border: 1px solid #e5e7eb; padding: 10px 12px; text-align: left; }
            th { background: #ecfdf5; font-weight: 600; }
            .section { margin-bottom: 24px; }
            .section h2 { color: #047857; font-size: 1.1rem; margin-bottom: 12px; }
            .totals { background: #f0fdf4; padding: 16px; border-radius: 8px; margin-top: 16px; }
            .formula { background: #fef3c7; padding: 12px; border-radius: 8px; margin-top: 12px; font-family: monospace; }
            .footer { margin-top: 32px; font-size: 12px; color: #9ca3af; }
          </style>
        </head>
        <body>
          <h1>Zakat Calculator</h1>
          <p class="sub">Dar Al Hikma Trust — Print-friendly summary</p>
          <div class="section">
            <h2>Assets (₹)</h2>
            <table>
              <thead><tr><th>Item</th><th>Amount (₹)</th></tr></thead>
              <tbody>
                ${ASSET_FIELDS.map((f) => `<tr><td>${f.label}</td><td>${formatINR(assetValues[f.key])}</td></tr>`).join('')}
              </tbody>
            </table>
            <div class="totals"><strong>Total Assets:</strong> ${formatINR(totalAssets)}</div>
          </div>
          <div class="section">
            <h2>Deductions / Liabilities (₹)</h2>
            <table>
              <thead><tr><th>Item</th><th>Amount (₹)</th></tr></thead>
              <tbody>
                ${DEDUCTION_FIELDS.map((f) => `<tr><td>${f.label}</td><td>${formatINR(deductionValues[f.key])}</td></tr>`).join('')}
              </tbody>
            </table>
            <div class="totals"><strong>Total Deductions:</strong> ${formatINR(totalDeductions)}</div>
          </div>
          <div class="section">
            <h2>Zakat Calculation</h2>
            <p><strong>Amount on which Zakat is calculated:</strong> ${formatINR(zakatableWealth)}</p>
            <p><strong>Zakat (2.5%):</strong> ${formatINR(zakatAmount)}</p>
            <div class="formula">${formatINR(zakatableWealth)} × 2.5% = ${formatINR(zakatAmount)}</div>
          </div>
          <div class="footer">Generated from Zakat Calculator — Dar Al Hikma Trust</div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `)
    w.document.close()
  }

  const handleExportPDF = async () => {
    try {
      toast.loading('Generating PDF...', { id: 'pdf-export' })
      const { jsPDF } = await import('jspdf')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageW = pdf.internal.pageSize.getWidth()
      let y = 18

      // Use standard font to avoid spacing issues
      pdf.setFont('helvetica')
      
      // Helper function to add text without spacing issues
      const addText = (text, x, yPos, options = {}) => {
        const opts = { ...options, renderingMode: 'fill' }
        pdf.text(String(text).replace(/\s+/g, ' '), x, yPos, opts)
      }

      // Professional Header with gradient effect
      pdf.setFillColor(6, 95, 70)
      pdf.rect(0, 0, pageW, 35, 'F')
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(24)
      pdf.setFont('helvetica', 'bold')
      addText('Zakat Calculator', pageW / 2, 16, { align: 'center' })
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')
      addText('Dar Al Hikma Trust', pageW / 2, 22, { align: 'center' })
      addText('Summary Report (All amounts in INR)', pageW / 2, 28, { align: 'center' })
      y = 40

      // Professional Assets Section with border
      pdf.setFillColor(236, 253, 245)
      pdf.rect(10, y - 6, pageW - 20, 18, 'F')
      pdf.setDrawColor(4, 120, 87)
      pdf.rect(10, y - 6, pageW - 20, 18, 'S')
      pdf.setFontSize(15)
      pdf.setTextColor(4, 120, 87)
      pdf.setFont('helvetica', 'bold')
      addText('Assets Summary', 14, y)
      y += 10
      pdf.setFontSize(11)
      pdf.setTextColor(31, 41, 55)
      pdf.setFont('helvetica', 'bold')
      addText('Total Assets', 18, y)
      addText(formatINR(totalAssets).replace('₹', 'INR '), pageW - 14, y, { align: 'right' })
      pdf.setFont('helvetica', 'normal')
      y += 20

      // Professional Deductions Section with border
      pdf.setFillColor(255, 251, 235)
      pdf.rect(10, y - 6, pageW - 20, 18, 'F')
      pdf.setDrawColor(180, 83, 9)
      pdf.rect(10, y - 6, pageW - 20, 18, 'S')
      pdf.setFontSize(15)
      pdf.setTextColor(180, 83, 9)
      pdf.setFont('helvetica', 'bold')
      addText('Deductions / Liabilities Summary', 14, y)
      y += 10
      pdf.setFontSize(11)
      pdf.setTextColor(31, 41, 55)
      pdf.setFont('helvetica', 'bold')
      addText('Total Deductions', 18, y)
      addText(formatINR(totalDeductions).replace('₹', 'INR '), pageW - 14, y, { align: 'right' })
      pdf.setFont('helvetica', 'normal')
      y += 20

      // Professional Zakat Calculation Section with border
      pdf.setFillColor(209, 250, 229)
      pdf.rect(10, y - 6, pageW - 20, 28, 'F')
      pdf.setDrawColor(6, 95, 70)
      pdf.setLineWidth(0.5)
      pdf.rect(10, y - 6, pageW - 20, 28, 'S')
      pdf.setFontSize(15)
      pdf.setTextColor(6, 95, 70)
      pdf.setFont('helvetica', 'bold')
      addText('Zakat Calculation', 14, y)
      y += 10
      pdf.setFontSize(11)
      pdf.setTextColor(31, 41, 55)
      pdf.setFont('helvetica', 'normal')
      addText('Amount on which Zakat is calculated:', 18, y)
      addText(formatINR(zakatableWealth).replace('₹', 'INR '), pageW - 14, y, { align: 'right' })
      y += 8
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(13)
      pdf.setTextColor(6, 95, 70)
      addText('Zakat (2.5%):', 18, y)
      addText(formatINR(zakatAmount).replace('₹', 'INR '), pageW - 14, y, { align: 'right' })
      y += 8
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(10)
      pdf.setTextColor(100, 116, 139)
      const formula = `${formatINR(zakatableWealth).replace('₹', 'INR ')} x 2.5% = ${formatINR(zakatAmount).replace('₹', 'INR ')}`
      addText(formula, 18, y)
      y += 18
      
      // Footer
      pdf.setDrawColor(200, 200, 200)
      pdf.line(14, y, pageW - 14, y)
      y += 5
      pdf.setTextColor(150, 150, 150)
      pdf.setFontSize(8)
      addText('Generated from Zakat Calculator - Dar Al Hikma Trust', pageW / 2, y, { align: 'center' })
      addText(`Generated on: ${new Date().toLocaleString()}`, pageW / 2, y + 4, { align: 'center' })

      pdf.save('zakat-calculator.pdf')
      toast.success('PDF downloaded successfully!', { id: 'pdf-export' })
    } catch (e) {
      console.error(e)
      toast.error('PDF export failed. Use Print → Save as PDF instead.', { id: 'pdf-export' })
    }
  }

  const handleExportWord = () => {
    const html = `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
  <meta charset="utf-8">
  <title>Zakat Calculator - Dar Al Hikma Trust</title>
  <style>
    body { font-family: 'Poppins', 'Inter', system-ui, sans-serif; padding: 24px; }
    h1 { color: #065f46; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
    th, td { border: 1px solid #ccc; padding: 8px 12px; }
    th { background: #ecfdf5; }
    .totals { background: #f0fdf4; padding: 12px; margin: 16px 0; }
    .formula { background: #fef3c7; padding: 12px; margin: 16px 0; }
  </style>
</head>
<body>
  <h1>Zakat Calculator</h1>
  <p>Dar Al Hikma Trust — Summary</p>
  <h2>Assets (₹)</h2>
  <table>
    <tr><th>Item</th><th>Amount (₹)</th></tr>
    ${ASSET_FIELDS.map((f) => `<tr><td>${f.label}</td><td>${formatINR(assetValues[f.key])}</td></tr>`).join('')}
  </table>
  <div class="totals"><strong>Total Assets:</strong> ${formatINR(totalAssets)}</div>
  <h2>Deductions / Liabilities (₹)</h2>
  <table>
    <tr><th>Item</th><th>Amount (₹)</th></tr>
    ${DEDUCTION_FIELDS.map((f) => `<tr><td>${f.label}</td><td>${formatINR(deductionValues[f.key])}</td></tr>`).join('')}
  </table>
  <div class="totals"><strong>Total Deductions:</strong> ${formatINR(totalDeductions)}</div>
  <h2>Zakat Calculation</h2>
  <p><strong>Amount on which Zakat is calculated:</strong> ${formatINR(zakatableWealth)}</p>
  <p><strong>Zakat (2.5%):</strong> ${formatINR(zakatAmount)}</p>
  <div class="formula">${formatINR(zakatableWealth)} × 2.5% = ${formatINR(zakatAmount)}</div>
  <p><em>Generated from Zakat Calculator — Dar Al Hikma Trust</em></p>
</body>
</html>`
    const blob = new Blob(['\ufeff' + html], { type: 'application/msword' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'zakat-calculator.doc'
    a.click()
    URL.revokeObjectURL(a.href)
    toast.success('Word file downloaded.')
  }

  const openDonateModal = () => {
    if (zakatAmount <= 0) {
      toast.error('Zakat amount must be greater than ₹0 to donate.')
      return
    }
    if (!isAuthenticated) {
      setGuestModal(true)
      return
    }
    launchRazorpay(null)
  }

  const launchRazorpay = async (guest) => {
    try {
      setDonateLoading(true)
      const orderPayload = {
        amount: zakatAmount,
        currency: 'INR',
        donationType: 'Zakat',
        project: null,
        faculty: null,
        notes: 'Zakat payment from Zakat Calculator',
      }
      // For anonymous donations, use minimal info
      if (isAnonymous && !isAuthenticated) {
        orderPayload.donorInfo = {
          name: 'Anonymous',
          email: guest?.email || 'anonymous@daralhikma.org',
          phone: '',
          address: {}
        }
      } else if (!isAuthenticated && guest) {
        if (!guest.name || !guest.email) {
          toast.error('Please provide name and email, or select anonymous donation.')
          setDonateLoading(false)
          return
        }
        orderPayload.donorInfo = guest
      }

      const { data: orderData } = await api.post('/donations/razorpay/order', orderPayload)

      if (!window.Razorpay) {
        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.async = true
        await new Promise((resolve, reject) => {
          script.onload = resolve
          script.onerror = reject
          document.body.appendChild(script)
        })
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Dar Al Hikma Trust',
        description: 'Zakat Donation',
        order_id: orderData.orderId,
        handler: async function (res) {
          try {
            const verifyPayload = {
              razorpay_order_id: res.razorpay_order_id,
              razorpay_payment_id: res.razorpay_payment_id,
              razorpay_signature: res.razorpay_signature,
              amount: zakatAmount,
              donationType: 'Zakat',
              project: null,
              faculty: null,
              notes: 'Zakat payment from Zakat Calculator',
              isAnonymous: isAnonymous,
            }
            if (!isAuthenticated && guest) {
              verifyPayload.donorInfo = guest
            }
            const { data: verifyData } = await api.post('/donations/razorpay/verify', verifyPayload)
            toast.success('Zakat donation successful!')
            setDonateLoading(false)
            setGuestModal(false)
            const donationId = verifyData?.donation?.id || verifyData?.donation?._id || verifyData?.donationId
            const paymentId = res.razorpay_payment_id
            const orderId = res.razorpay_order_id
            
            if (donationId) {
              localStorage.setItem('lastDonationId', donationId)
              localStorage.setItem('donationSuccess', 'true')
              localStorage.setItem('donationSuccessTime', Date.now().toString())
              // Trigger refresh event for dashboard
              window.dispatchEvent(new Event('donationSuccess'))
            }
            
            // Navigate to success page with URL params (refresh-safe)
            const params = new URLSearchParams()
            if (paymentId) params.append('payment_id', paymentId)
            if (orderId) params.append('order_id', orderId)
            if (donationId) params.append('donation_id', donationId)
            
            navigate(`/payment/success?${params.toString()}`, { replace: true })
          } catch (err) {
            toast.error(err.response?.data?.message || 'Payment verification failed')
            setDonateLoading(false)
            navigate('/zakat/failure', { state: { error: 'Verification failed' } })
          }
        },
        modal: {
          ondismiss: () => {
            setDonateLoading(false)
          },
        },
        prefill: {
          name: (guest && guest.name) || (user && user.name) || '',
          email: (guest && guest.email) || (user && user.email) || '',
          contact: (guest && guest.phone) || (user && user.phone) || '',
        },
        theme: { color: '#065f46' },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', () => {
        setDonateLoading(false)
        toast.error('Payment failed.')
        navigate('/zakat/failure', { state: { error: 'Payment failed' } })
      })
      rzp.open()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start payment.')
      setDonateLoading(false)
    }
  }

  const handleGuestDonate = () => {
    if (!isAnonymous && (!guestInfo.name || !guestInfo.email)) {
      toast.error('Please provide name and email, or select anonymous donation.')
      return
    }
    launchRazorpay(isAnonymous ? null : guestInfo)
    setGuestModal(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* --- PROFESSIONAL HERO SECTION --- */}
      {/* Changed: 'pb-8' -> 'pb-4' to reduce space at the bottom of the header */}
      <section className="bg-white pt-24 pb-0 border-b border-slate-200 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-40 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px]"></div>
        </div>
        
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-600"></div>

        <div className="container-custom px-4 sm:px-6 lg:px-8 relative z-10 text-center max-w-4xl mx-auto">
          <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold tracking-widest uppercase mb-4 border border-emerald-100 shadow-sm animate-in fade-in slide-in-from-bottom-2">
            <FiActivity className="w-4 h-4" /> Purification of Wealth
          </span>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-3 tracking-tight">
            Zakat <span className="text-emerald-600">Calculator</span>
          </h1>
          <p className="text-base md:text-lg text-slate-500 leading-relaxed max-w-2xl mx-auto">
            Calculate your obligatory Zakat (2.5%) with precision. Enter your assets and liabilities below.
          </p>
        </div>
      </section>
      {/* Calculator Form */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container-custom px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="space-y-8 md:space-y-12">
            {/* Assets Section */}
            <div className="bg-white rounded-3xl p-8 md:p-10 border border-slate-200 shadow-lg">
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-200">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                  <FiTrendingUp className="text-white text-2xl" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Assets (₹)</h2>
                  <p className="text-slate-600 text-sm md:text-base mt-1">Enter the total value of all your assets in Indian Rupees</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {ASSET_FIELDS.map((f, i) => {
                  const Icon = f.icon
                  return (
                    <div key={f.key}>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        <Icon className="inline w-4 h-4 mr-1.5 text-green-600" />
                        {f.label}
                      </label>
                      <div className="flex">
                        <span className="inline-flex items-center px-4 py-3 border-2 border-r-0 border-slate-300 rounded-l-xl bg-slate-50 text-slate-700 text-sm font-semibold">
                          ₹
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9.]*"
                          className="input-field rounded-l-none border-2"
                          placeholder="0.00"
                          value={assets[f.key]}
                          onChange={(e) => updateAsset(f.key, e.target.value)}
                          onKeyDown={(e) => {
                            // Block all non-numeric keys except control keys
                            const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']
                            const isNumber = /[0-9]/.test(e.key)
                            const isDecimal = e.key === '.' && !assets[f.key].includes('.')
                            const isControl = allowedKeys.includes(e.key) || (e.ctrlKey && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase()))
                            
                            if (!isNumber && !isDecimal && !isControl) {
                              e.preventDefault()
                            }
                          }}
                          onPaste={(e) => {
                            e.preventDefault()
                            const pastedText = e.clipboardData.getData('text')
                            const numbersOnly = pastedText.replace(/[^0-9.]/g, '')
                            const parts = numbersOnly.split('.')
                            let finalValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numbersOnly
                            if (parts.length === 2 && parts[1].length > 2) {
                              finalValue = parts[0] + '.' + parts[1].substring(0, 2)
                            }
                            updateAsset(f.key, finalValue)
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Deductions Section */}
            <div className="bg-white rounded-3xl p-8 md:p-10 border border-slate-200 shadow-lg">
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-200">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
                  <FiTrendingDown className="text-white text-2xl" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Deductions / Liabilities (₹)</h2>
                  <p className="text-slate-600 text-sm md:text-base mt-1">Enter loans, dues, and other payables</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {DEDUCTION_FIELDS.map((f, i) => {
                  const Icon = f.icon
                  return (
                    <div key={f.key}>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        <Icon className="inline w-4 h-4 mr-1.5 text-amber-600" />
                        {f.label}
                      </label>
                      <div className="flex">
                        <span className="inline-flex items-center px-4 py-3 border-2 border-r-0 border-slate-300 rounded-l-xl bg-slate-50 text-slate-700 text-sm font-semibold">
                          ₹
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9.]*"
                          className="input-field rounded-l-none border-2"
                          placeholder="0.00"
                          value={deductions[f.key]}
                          onChange={(e) => updateDeduction(f.key, e.target.value)}
                          onKeyDown={(e) => {
                            // Block all non-numeric keys except control keys
                            const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']
                            const isNumber = /[0-9]/.test(e.key)
                            const isDecimal = e.key === '.' && !deductions[f.key].includes('.')
                            const isControl = allowedKeys.includes(e.key) || (e.ctrlKey && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase()))
                            
                            if (!isNumber && !isDecimal && !isControl) {
                              e.preventDefault()
                            }
                          }}
                          onPaste={(e) => {
                            e.preventDefault()
                            const pastedText = e.clipboardData.getData('text')
                            const numbersOnly = pastedText.replace(/[^0-9.]/g, '')
                            const parts = numbersOnly.split('.')
                            let finalValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numbersOnly
                            if (parts.length === 2 && parts[1].length > 2) {
                              finalValue = parts[0] + '.' + parts[1].substring(0, 2)
                            }
                            updateDeduction(f.key, finalValue)
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Results Section */}
            <div className="bg-gradient-to-br from-green-50 to-white rounded-3xl p-8 md:p-10 border-2 border-green-200 shadow-xl">
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-green-200">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center shadow-lg">
                  <FiBarChart2 className="text-white text-2xl" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Zakat Calculation Result</h2>
                  <p className="text-slate-600 text-sm md:text-base mt-1">Your calculated Zakat amount</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <p className="text-sm font-semibold text-slate-600 mb-2 uppercase tracking-wide">Total Assets</p>
                  <p className="text-3xl md:text-4xl font-bold text-green-700 tabular-nums">{formatINR(totalAssets)}</p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <p className="text-sm font-semibold text-slate-600 mb-2 uppercase tracking-wide">Total Deductions</p>
                  <p className="text-3xl md:text-4xl font-bold text-amber-700 tabular-nums">{formatINR(totalDeductions)}</p>
                </div>
                <div className="bg-white rounded-2xl p-6 border-2 border-green-300 shadow-sm sm:col-span-2">
                  <p className="text-sm font-semibold text-slate-600 mb-2 uppercase tracking-wide">Zakat-able Wealth</p>
                  <p className="text-3xl md:text-4xl font-bold text-green-800 tabular-nums">{formatINR(zakatableWealth)}</p>
                  <p className="text-xs text-slate-500 mt-2">Total Assets - Total Deductions</p>
                </div>
              </div>
              
              {/* Final Zakat Amount */}
              <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-8 text-white shadow-2xl">
                <p className="text-sm font-semibold text-green-100 mb-3 uppercase tracking-wide">Your Zakat Amount (2.5%)</p>
                <p className="text-4xl md:text-5xl font-bold tabular-nums mb-4">{formatINR(zakatAmount)}</p>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 inline-block">
                  <p className="text-sm font-mono">
                    {formatINR(zakatableWealth)} × 2.5% = {formatINR(zakatAmount)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-10 flex flex-wrap gap-4 print:hidden">
            <button
              type="button"
              onClick={safePrint}
              className="btn-outline flex items-center gap-2"
            >
              <FiPrinter className="w-5 h-5" />
              Print
            </button>
            <button
              type="button"
              onClick={() => navigate('/zakat/nisab')}
              className="btn-outline flex items-center gap-2"
            >
              <FiBarChart2 className="w-5 h-5" />
              Check Today’s Nisab
            </button>
            <button
              type="button"
              onClick={handleExportPDF}
              className="btn-outline flex items-center gap-2"
            >
              <FiDownload className="w-5 h-5" />
              Export to PDF
            </button>
            <button
              type="button"
              onClick={handleExportWord}
              className="btn-outline flex items-center gap-2"
            >
              <FiFileText className="w-5 h-5" />
              Export to Word
            </button>
            <button
              type="button"
              onClick={openDonateModal}
              disabled={donateLoading || zakatAmount <= 0}
              className="flex items-center justify-center gap-3 px-8 py-4 bg-primary-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {donateLoading ? (
                <>
                  <span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  Processing…
                </>
              ) : (
                <>
                  <FiHeart className="w-5 h-5" />
                  Donate {formatINR(zakatAmount)}
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Guest modal for Donate Zakat */}
      {guestModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={() => setGuestModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="guest-modal-title"
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-scale-in border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="guest-modal-title" className="text-2xl font-bold text-slate-900 mb-6">Donation Details</h3>
            <div className="space-y-4">
              <div className="flex items-center p-4 bg-slate-50 rounded-xl border-2 border-slate-200">
                <input
                  type="checkbox"
                  id="zakat-anonymous"
                  className="mr-3 w-5 h-5 text-primary-600 rounded"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                />
                <label htmlFor="zakat-anonymous" className="text-sm font-semibold text-slate-700 cursor-pointer">
                  Make this donation anonymous
                </label>
              </div>
              {!isAnonymous && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name *</label>
                    <input
                      type="text"
                      className="input-field"
                      value={guestInfo.name}
                      onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address *</label>
                    <input
                      type="email"
                      className="input-field"
                      value={guestInfo.email}
                      onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      className="input-field"
                      value={guestInfo.phone}
                      onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                      placeholder="Enter your phone number"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setGuestModal(false)}
                className="flex-1 px-6 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGuestDonate}
                className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                Proceed to Pay {formatINR(zakatAmount)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
