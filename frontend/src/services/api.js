import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const TOKEN_KEY = 'token'
const REFRESH_KEY = 'refreshToken'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // FormData: let browser set Content-Type with boundary (required for file uploads)
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  return config
})

// Handle token refresh on 401 and server errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Handle network errors (backend not running)
    if (!error.response) {
      console.error('Network error: Backend server may not be running')
      console.error('Make sure the backend server is running on http://localhost:5000')
      return Promise.reject({
        ...error,
        message: 'Cannot connect to server. Please ensure the backend is running.',
        isNetworkError: true
      })
    }

    // Handle 401 - Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem(REFRESH_KEY) || sessionStorage.getItem(REFRESH_KEY)
        const preferredStorage = localStorage.getItem(REFRESH_KEY) ? localStorage : sessionStorage
        if (refreshToken) {
          const { data } = await axios.post(`${API_URL}/auth/refresh-token`, {
            refreshToken
          })
          preferredStorage.setItem(TOKEN_KEY, data.accessToken)
          preferredStorage.setItem(REFRESH_KEY, data.refreshToken)
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(REFRESH_KEY)
        sessionStorage.removeItem(TOKEN_KEY)
        sessionStorage.removeItem(REFRESH_KEY)
        // Don't redirect if it's a network error
        if (!refreshError.isNetworkError) {
          // Redirect to admin login if the failed request was for admin API
          const isAdminRequest = originalRequest?.url?.includes('/admin/')
          window.location.href = isAdminRequest ? '/admin/login' : '/login'
        }
        return Promise.reject(refreshError)
      }
    }

    // Handle 500 - Internal Server Error
    if (error.response?.status === 500) {
      console.error('Server error (500):', error.response?.data)
      return Promise.reject({
        ...error,
        message: error.response?.data?.message || 'Server error. Please check backend logs.',
        isServerError: true
      })
    }

    return Promise.reject(error)
  }
)

export default api

