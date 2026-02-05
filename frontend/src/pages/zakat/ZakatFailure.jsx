import { Link, useLocation } from 'react-router-dom'
import { FiAlertCircle, FiHome, FiBarChart2, FiRefreshCw } from 'react-icons/fi'

export default function ZakatFailure() {
  const location = useLocation()
  const error = location.state?.error ?? 'Payment could not be completed.'

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50/30 flex items-center justify-center section-padding">
      <div className="max-w-lg w-full text-center">
        <div className="card bg-white/95 backdrop-blur border-2 border-amber-200 shadow-2xl p-8 md:p-12 animate-scale-in">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-xl animate-bounce-in">
            <FiAlertCircle className="w-10 h-10" />
          </div>
          <h1 className="font-arabic text-2xl md:text-3xl font-bold text-amber-800 mb-2">
            Payment Unsuccessful
          </h1>
          <p className="text-gray-600 mb-6">
            {error} Please try again or use another payment method.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/zakat-calculator"
              className="btn-primary inline-flex items-center justify-center gap-2"
            >
              <FiBarChart2 className="w-5 h-5" />
              Back to Calculator
            </Link>
            <Link
              to="/donate"
              className="btn-outline inline-flex items-center justify-center gap-2"
            >
              <FiRefreshCw className="w-5 h-5" />
              Try Donate Page
            </Link>
            <Link
              to="/"
              className="btn-outline inline-flex items-center justify-center gap-2"
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
