import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import api from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

const TOKEN_KEY = 'token'
const REFRESH_KEY = 'refreshToken'

const getStoredToken = () => localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)
const getStoredRefreshToken = () => localStorage.getItem(REFRESH_KEY) || sessionStorage.getItem(REFRESH_KEY)
const getPreferredStorage = () => (localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(() => getStoredToken())

  // Configure axios defaults
  axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchUser()
    } else {
      setUser(null)
      setLoading(false)
    }
  }, [token])

  const fetchUser = async () => {
    try {
      const { data } = await api.get('/auth/me')
      if (data?.user) {
        setUser(data.user)
      }
    } catch (error) {
      // Only logout on auth errors (401/403). Do NOT clear tokens on network/server errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.error('Authentication failed:', error)
        logout()
      } else if (error.response) {
        // Server returned an error (5xx etc) - clear user but keep tokens
        console.error('Failed to fetch user:', error)
        setUser(null)
      }
      // On network error (no error.response), keep tokens - backend may be temporarily down
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password, options = {}) => {
    try {
      const portal = options?.portal === 'admin' ? 'admin' : 'user'
      const endpoint = portal === 'admin' ? '/auth/admin/login' : '/auth/user/login'
      const { data } = await axios.post(endpoint, { email, password })
      setToken(data.accessToken)
      setUser(data.user)
      const remember = options?.remember === true
      const targetStorage = remember ? localStorage : sessionStorage
      // Clear the other storage so we don't accidentally pick stale tokens
      ;(remember ? sessionStorage : localStorage).removeItem(TOKEN_KEY)
      ;(remember ? sessionStorage : localStorage).removeItem(REFRESH_KEY)

      targetStorage.setItem(TOKEN_KEY, data.accessToken)
      targetStorage.setItem(REFRESH_KEY, data.refreshToken)
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`
      toast.success('Login successful!')
      return data
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed')
      throw error
    }
  }

  const register = async (userData) => {
    try {
      const { data } = await axios.post('/auth/register', userData)
      setToken(data.accessToken)
      setUser(data.user)
      // Registration defaults to persistent login
      localStorage.setItem(TOKEN_KEY, data.accessToken)
      localStorage.setItem(REFRESH_KEY, data.refreshToken)
      sessionStorage.removeItem(TOKEN_KEY)
      sessionStorage.removeItem(REFRESH_KEY)
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`
      toast.success('Registration successful!')
      return data
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed')
      throw error
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(REFRESH_KEY)
    delete axios.defaults.headers.common['Authorization']
    toast.success('Logged out successfully')
  }

  const updateProfile = async (profileData) => {
    try {
      const { data } = await axios.put('/auth/profile', profileData)
      setUser(data.user)
      toast.success('Profile updated successfully!')
      return data
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed')
      throw error
    }
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin'
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

