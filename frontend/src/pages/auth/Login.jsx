import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { FiUser, FiLock, FiMail, FiArrowRight, FiShield, FiHome, FiEye, FiEyeOff } from 'react-icons/fi'

const REMEMBERED_EMAIL_KEY = 'rememberedEmail'

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  // Load remembered email on mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY)
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
      await login(formData.email, formData.password, { remember, portal: 'user' })
      
      // Save email if "Remember me" is checked
      if (remember) {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, formData.email)
      } else {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY)
      }
      
      navigate('/user/dashboard')
    } catch (error) {
      // Error handled in context
    } finally {
      setLoading(false)
    }
  }

  const handleRememberChange = (checked) => {
    setRemember(checked)
    if (!checked) {
      // Clear remembered email if unchecked
      localStorage.removeItem(REMEMBERED_EMAIL_KEY)
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

        {/* Login Card */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <FiUser className="text-white text-2xl" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">User Login</h1>
            <p className="text-sm text-slate-600">Sign in to access your account and manage your donations</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-400 w-5 h-5" />
                <input
                  type="email"
                  className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 placeholder-slate-400"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your.email@example.com"
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
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full pl-12 pr-12 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 placeholder-slate-400"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-400 hover:text-primary-600 transition-colors"
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
                  className="w-5 h-5 rounded border-2 border-slate-300 text-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 cursor-pointer transition-all checked:bg-primary-600 checked:border-primary-600"
                  checked={remember}
                  onChange={(e) => handleRememberChange(e.target.checked)}
                />
                <span className="ml-3 text-sm text-slate-600 group-hover:text-slate-900 transition-colors">Remember me</span>
              </label>
              <Link 
                to="/forgot-password" 
                className="text-sm text-primary-600 hover:text-primary-700 font-semibold transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3.5 bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <span>Login</span>
                  <FiArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 pt-6 border-t-2 border-slate-200 space-y-3">
            <p className="text-center text-sm text-slate-600">
              Don't have an account?{' '}
              <Link 
                to="/register" 
                className="text-primary-600 font-semibold hover:text-primary-700 transition-colors"
              >
                Register here
              </Link>
            </p>
            <Link 
              to="/admin/login" 
              className="flex items-center justify-center gap-2 text-sm text-slate-600 hover:text-primary-600 font-semibold transition-colors"
            >
              <FiShield className="w-4 h-4" />
              <span>Admin Login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

