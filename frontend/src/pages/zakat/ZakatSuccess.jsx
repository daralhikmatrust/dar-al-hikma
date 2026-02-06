import { Link, useLocation } from 'react-router-dom'
import { FiCheckCircle, FiHome, FiBarChart2, FiHeart, FiPrinter } from 'react-icons/fi'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { formatINR } from '../../utils/currency'

export default function ZakatSuccess() {
  const location = useLocation()
  const amount = location.state?.amount ?? 0
  const donationId = location.state?.donationId

  const handlePrintReceipt = async () => {
    if (!donationId) {
      toast.error('Receipt not available')
      return
    }
    try {
      const response = await api.get(`/donations/${donationId}/receipt`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `zakat-receipt-${donationId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Receipt downloaded')
    } catch (error) {
      console.error('Failed to download receipt:', error)
      toast.error('Failed to download receipt')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50/30 flex items-center justify-center section-padding">
      <div className="max-w-lg w-full text-center">
        <div className="card bg-white/95 backdrop-blur border-2 border-emerald-200 shadow-2xl p-8 md:p-12 animate-scale-in">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-xl animate-bounce-in">
            <FiCheckCircle className="w-10 h-10" />
          </div>
          <h1 className="font-arabic text-2xl md:text-3xl font-bold text-emerald-800 mb-2">
            Zakat Donation Successful
          </h1>
          <p className="text-gray-600 mb-6">
            Jazakallah Khair. Your Zakat of {formatINR(amount)} has been received. A receipt will be sent to your email.
          </p>
          {donationId && (
            <div className="mb-6">
              <button
                onClick={handlePrintReceipt}
                className="btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2"
              >
                <FiPrinter className="w-5 h-5" />
                Print Donation Receipt
              </button>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/zakat-calculator"
              className="btn-outline inline-flex items-center justify-center gap-2"
            >
              <FiBarChart2 className="w-5 h-5" />
              Back to Calculator
            </Link>
            <Link
              to="/donate"
              className="btn-secondary inline-flex items-center justify-center gap-2"
            >
              <FiHeart className="w-5 h-5" />
              Donate Again
            </Link>
            <Link
              to="/"
              className="btn-primary inline-flex items-center justify-center gap-2"
            >
              <FiHome className="w-5 h-5" />
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
