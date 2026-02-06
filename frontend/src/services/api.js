import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'https://dar-al-hikma-backend.onrender.com/api'
const TOKEN_KEY = 'token'
const REFRESH_KEY = 'refreshToken'

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // 🔥 REQUIRED: Allows cookies/sessions to work across domains
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
  
  // FormData: let browser set Content-Type with boundary
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

    // Handle network errors (backend sleeping or down)
    if (!error.response) {
      console.error('Network error: Backend server is likely sleeping or unreachable.')
      return Promise.reject({
        ...error,
        message: 'Cannot connect to server. The backend might be waking up (Render cold start). Please wait a moment and try again.',
        isNetworkError: true
      })
    }

    // Handle 401 - Unauthorized
    const isRefreshRequest = originalRequest?.url?.includes?.('refresh-token')
    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshRequest) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem(REFRESH_KEY) || sessionStorage.getItem(REFRESH_KEY)
        const preferredStorage = localStorage.getItem(REFRESH_KEY) ? localStorage : sessionStorage
        
        if (refreshToken) {
          const { data } = await api.post('/auth/refresh-token', {
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
        
        if (!refreshError.isNetworkError) {
          const isAdminRequest = originalRequest?.url?.includes('/admin/')
          window.location.href = isAdminRequest ? '/admin/login' : '/login'
        }
        return Promise.reject(refreshError)
      }
    }

    // Handle 500 - Internal Server Error
    if (error.response?.status === 500) {
      return Promise.reject({
        ...error,
        message: error.response?.data?.message || 'Server error. Please try again later.',
        isServerError: true
      })
    }

    return Promise.reject(error)
  }
)

export default api