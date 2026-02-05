import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { FiShield, FiLock, FiMail, FiArrowRight, FiHome, FiEye, FiEyeOff } from 'react-icons/fi'

const REMEMBERED_ADMIN_EMAIL_KEY = 'rememberedAdminEmail'

export default function AdminLogin() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  // Load remembered admin email on mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem(REMEMBERED_ADMIN_EMAIL_KEY)
    if (rememberedEmail) {
      setFormData(prev => ({ ...prev, email: rememberedEmail }))
      setRemember(true)
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Prevent double submission
    if (loading) {
      return
    }
    
    setLoading(true)
    try {
      await login(formData.email, formData.password, { remember, portal: 'admin' })
      
      // Save admin email if "Remember me" is checked
      if (remember) {
        localStorage.setItem(REMEMBERED_ADMIN_EMAIL_KEY, formData.email)
      } else {
        localStorage.removeItem(REMEMBERED_ADMIN_EMAIL_KEY)
      }
      
      toast.success('Welcome back, Admin!')
      navigate('/admin/dashboard')
    } catch (error) {
      // Error handled in context
    } finally {
      setLoading(false)
    }
  }

  const handleRememberChange = (checked) => {
    setRemember(checked)
    if (!checked) {
      // Clear remembered admin email if unchecked
      localStorage.removeItem(REMEMBERED_ADMIN_EMAIL_KEY)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-4">
        {/* Back to Home - Prominent */}
        <Link
          to="/"
          className="flex items-center justify-center gap-2 text-slate-700 hover:text-primary-600 font-semibold transition-colors group mb-2"
        >
          <FiHome className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span>Back to Home</span>
        </Link>

        {/* Admin Login Card */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <FiShield className="text-white text-2xl" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Admin Login</h1>
            <p className="text-sm text-slate-600">Secure access to the administrative dashboard</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                <input
                  type="email"
                  className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all bg-white text-slate-900 placeholder-slate-400"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@example.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full pl-12 pr-12 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all bg-white text-slate-900 placeholder-slate-400"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-2 border-slate-300 text-slate-700 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 cursor-pointer transition-all checked:bg-slate-700 checked:border-slate-700"
                  checked={remember}
                  onChange={(e) => handleRememberChange(e.target.checked)}
                />
                <span className="ml-3 text-sm text-slate-600 group-hover:text-slate-900 transition-colors">Remember me</span>
              </label>
              <Link 
                to="/forgot-password" 
                className="text-sm text-slate-600 hover:text-slate-900 font-semibold transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3.5 bg-gradient-to-r from-slate-700 to-slate-900 text-white font-semibold rounded-xl hover:from-slate-800 hover:to-slate-950 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Login to Admin Panel</span>
                  <FiArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 pt-6 border-t-2 border-slate-200 space-y-3">
            <p className="text-center text-sm text-slate-600">
              Not an admin?{' '}
              <Link 
                to="/login" 
                className="text-primary-600 font-semibold hover:text-primary-700 transition-colors"
              >
                User Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

