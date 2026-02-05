import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { FiUserPlus, FiMail, FiLock, FiArrowRight, FiHome, FiEye, FiEyeOff, FiShield, FiPhone, FiMapPin } from 'react-icons/fi'
import { INDIAN_STATES, getCitiesForState } from '../../utils/states-countries'

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    profession: 'Other',
    address: {
      city: '',
      state: '',
      district: '',
      pincode: ''
    }
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Prevent double submission
    if (loading) {
      return
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || null,
        profession: formData.profession || 'Other',
        address: formData.address
      })
      navigate('/user/dashboard')
    } catch (error) {
      // Error handled in context
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full space-y-4">
        {/* Back to Home - Prominent */}
        <Link
          to="/"
          className="flex items-center justify-center gap-2 text-slate-700 hover:text-primary-600 font-semibold transition-colors group mb-2"
        >
          <FiHome className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span>Back to Home</span>
        </Link>

        {/* Registration Card */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <FiUserPlus className="text-white text-2xl" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">User Registration</h1>
            <p className="text-sm text-slate-600">Create your account to start making a difference</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name and Email - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <FiUserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-400 w-5 h-5" />
                  <input
                    type="text"
                    className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 placeholder-slate-400"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your full name"
                    required
                    autoComplete="name"
                  />
                </div>
              </div>

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
            </div>

            {/* Password and Confirm Password - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                    minLength={6}
                    autoComplete="new-password"
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

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-400 w-5 h-5" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="w-full pl-12 pr-12 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 placeholder-slate-400"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Re-enter your password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-400 hover:text-primary-600 transition-colors"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Phone and Profession - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-400 w-5 h-5" />
                  <input
                    type="tel"
                    className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 placeholder-slate-400"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 1234567890"
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Profession
                </label>
                <div className="relative">
                  <FiUserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-400 w-5 h-5 pointer-events-none" />
                  <select
                    className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 cursor-pointer appearance-none"
                    value={formData.profession}
                    onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                  >
                    <option value="Other">Other</option>
                    <option value="Engineer">Engineer</option>
                    <option value="Doctor">Doctor</option>
                    <option value="Businessman">Businessman</option>
                    <option value="Teacher">Teacher</option>
                    <option value="Student">Student</option>
                  </select>
                </div>
              </div>
            </div>

            {/* City and State - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  State
                </label>
                <div className="relative">
                  <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-400 w-5 h-5 z-10" />
                  <select
                    className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 appearance-none cursor-pointer"
                    value={formData.address.state}
                    onChange={(e) => {
                      const selectedState = e.target.value;
                      setFormData({
                        ...formData,
                        address: { 
                          ...formData.address, 
                          state: selectedState,
                          city: selectedState === 'Other' ? formData.address.city : ''
                        }
                      });
                    }}
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>
                {formData.address.state === 'Other' && (
                  <input
                    type="text"
                    className="w-full mt-3 px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 placeholder-slate-400"
                    value={formData.address.district || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: { ...formData.address, district: e.target.value, state: 'Other' }
                    })}
                    placeholder="Enter your state name"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  City
                </label>
                <div className="relative">
                  <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-400 w-5 h-5 z-10" />
                  {formData.address.state && formData.address.state !== 'Other' ? (
                    <>
                      <select
                        className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 appearance-none cursor-pointer"
                        value={formData.address.city}
                        onChange={(e) => {
                          const selectedCity = e.target.value;
                          setFormData({
                            ...formData,
                            address: { ...formData.address, city: selectedCity }
                          });
                        }}
                      >
                        <option value="">Select City</option>
                        {getCitiesForState(formData.address.state).map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                        <option value="Other">Other (Specify below)</option>
                      </select>
                      {formData.address.city === 'Other' && (
                        <input
                          type="text"
                          className="w-full mt-3 px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 placeholder-slate-400"
                          value={formData.address.district || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            address: { ...formData.address, district: e.target.value, city: 'Other' }
                          })}
                          placeholder="Enter your city name"
                          required
                        />
                      )}
                    </>
                  ) : (
                    <input
                      type="text"
                      className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 placeholder-slate-400"
                      value={formData.address.city}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, city: e.target.value }
                      })}
                      placeholder={formData.address.state === 'Other' ? 'Enter your city' : 'Select State First'}
                      disabled={!formData.address.state}
                      autoComplete="address-level2"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* District and Pincode - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  District
                </label>
                <div className="relative">
                  <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-400 w-5 h-5" />
                  <input
                    type="text"
                    className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 placeholder-slate-400"
                    value={formData.address.district}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: { ...formData.address, district: e.target.value }
                    })}
                    placeholder="Enter your district"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Pincode
                </label>
                <div className="relative">
                  <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-400 w-5 h-5" />
                  <input
                    type="text"
                    className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 placeholder-slate-400"
                    value={formData.address.pincode}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: { ...formData.address, pincode: e.target.value }
                    })}
                    placeholder="Enter your pincode"
                    autoComplete="postal-code"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3.5 bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Register</span>
                  <FiArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 pt-6 border-t-2 border-slate-200 space-y-3">
            <p className="text-center text-sm text-slate-600">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="text-primary-600 font-semibold hover:text-primary-700 transition-colors"
              >
                Login here
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
