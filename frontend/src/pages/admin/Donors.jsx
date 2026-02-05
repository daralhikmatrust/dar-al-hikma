import { useState, useEffect } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { FiSearch, FiFilter, FiX } from 'react-icons/fi'
import { INDIAN_STATES, COUNTRIES } from '../../utils/states-countries'

export default function AdminDonors() {
  const [donors, setDonors] = useState([])
  const [filteredDonors, setFilteredDonors] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    profession: ''
  })

  useEffect(() => {
    fetchDonors()
  }, [filters])

  useEffect(() => {
    filterDonors()
  }, [searchQuery, donors])

  // Check for donor filter from donations page
  useEffect(() => {
    const donorFilter = sessionStorage.getItem('donorFilter')
    if (donorFilter) {
      setSearchQuery(donorFilter)
      sessionStorage.removeItem('donorFilter')
    }
  }, [])

  const fetchDonors = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.profession) params.append('profession', filters.profession)
      
      const { data } = await api.get(`/donors?${params.toString()}`)
      setDonors(data.donors || [])
      setFilteredDonors(data.donors || [])
    } catch (error) {
      console.error('Failed to fetch donors:', error)
      toast.error('Failed to load donors')
    } finally {
      setLoading(false)
    }
  }

  const filterDonors = () => {
    if (!searchQuery) {
      setFilteredDonors(donors)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = donors.filter(donor => {
      const name = donor.name?.toLowerCase() || ''
      const email = donor.email?.toLowerCase() || ''
      const profession = donor.profession?.toLowerCase() || ''
      const city = donor.address?.city?.toLowerCase() || ''
      const state = donor.address?.state?.toLowerCase() || ''
      const country = donor.address?.country?.toLowerCase() || ''
      
      return (
        name.includes(query) ||
        email.includes(query) ||
        profession.includes(query) ||
        city.includes(query) ||
        state.includes(query) ||
        country.includes(query)
      )
    })

    setFilteredDonors(filtered)
  }


  return (
    <div className="mt-0">
      <div className="mb-6 animate-admin-slide-in">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Donors</h1>
        <p className="text-slate-600">View and manage all registered donors</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6 animate-admin-slide-up hover:shadow-md transition-all duration-300" style={{ animationDelay: '0.1s' }}>
        <div className="grid md:grid-cols-3 gap-4">
          {/* Search Bar */}
          <div className="relative md:col-span-2">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, email, profession, location..."
              className="w-full pl-12 pr-10 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 placeholder-slate-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <FiX size={18} />
              </button>
            )}
          </div>

          {/* Profession Filter */}
          <div className="relative">
            <FiFilter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
            <select
              className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 cursor-pointer appearance-none"
              value={filters.profession}
              onChange={(e) => setFilters({ ...filters, profession: e.target.value })}
            >
              <option value="">All Professions</option>
              <option value="Engineer">Engineer</option>
              <option value="Doctor">Doctor</option>
              <option value="Businessman">Businessman</option>
              <option value="Teacher">Teacher</option>
              <option value="Student">Student</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Active Filters */}
        {(searchQuery || filters.profession) && (
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <span className="text-sm text-slate-600 font-semibold">Active filters:</span>
            {searchQuery && (
              <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold border border-blue-200 flex items-center gap-2">
                Search: {searchQuery}
                <button onClick={() => setSearchQuery('')} className="hover:text-blue-900">
                  <FiX size={14} />
                </button>
              </span>
            )}
            {filters.profession && (
              <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold border border-blue-200 flex items-center gap-2">
                Profession: {filters.profession}
                <button onClick={() => setFilters({ ...filters, profession: '' })} className="hover:text-blue-900">
                  <FiX size={14} />
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setSearchQuery('')
                setFilters({ profession: '' })
              }}
              className="text-sm text-primary-600 hover:text-primary-700 font-semibold"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-slate-600">Loading donors...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-admin-slide-up hover:shadow-md transition-all duration-300" style={{ animationDelay: '0.2s' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-6 text-sm font-bold text-slate-700">Name</th>
                  <th className="text-left py-3 px-6 text-sm font-bold text-slate-700">Email</th>
                  <th className="text-left py-3 px-6 text-sm font-bold text-slate-700">Profession</th>
                  <th className="text-left py-3 px-6 text-sm font-bold text-slate-700">Location</th>
                  <th className="text-left py-3 px-6 text-sm font-bold text-slate-700">Phone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDonors.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-500">
                      {donors.length === 0 
                        ? 'No donors found.'
                        : 'No donors match your search criteria.'}
                    </td>
                  </tr>
                ) : (
                  filteredDonors.map((donor, index) => (
                    <tr 
                      key={donor._id || donor.id} 
                      className="hover:bg-slate-50 transition-all duration-200 animate-admin-slide-in"
                      style={{ animationDelay: `${0.2 + index * 0.03}s` }}
                    >
                      <td className="py-4 px-6 font-semibold text-slate-900">{donor.name}</td>
                      <td className="py-4 px-6 text-sm text-slate-600">{donor.email}</td>
                      <td className="py-4 px-6">
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
                          {donor.profession || 'N/A'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600">
                        {donor.address?.city && `${donor.address.city}, `}
                        {donor.address?.state || ''}
                        {donor.address?.country && donor.address.country !== 'India' && `, ${donor.address.country}`}
                        {!donor.address?.city && !donor.address?.state && '-'}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600">
                        {donor.phone || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
