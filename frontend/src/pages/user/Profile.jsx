import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { INDIAN_STATES, getCitiesForState } from '../../utils/states-countries'

export default function Profile() {
  const { user, updateProfile } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
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
  const [availableCities, setAvailableCities] = useState([])

  useEffect(() => {
    if (formData.address.state && formData.address.state !== 'Other') {
      setAvailableCities(getCitiesForState(formData.address.state))
    } else {
      setAvailableCities([])
    }
  }, [formData.address.state])

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        profession: user.profession || 'Other',
        address: {
          city: user.address?.city || '',
          state: user.address?.state || '',
          district: user.address?.district || '',
          pincode: user.address?.pincode || ''
        }
      })
    }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await updateProfile(formData)
    } catch (error) {
      // Error handled in context
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <section className="bg-gradient-to-br from-primary-700 to-primary-800 text-white section-padding">
        <div className="container-custom">
          <h1 className="text-4xl font-bold mb-2">My Profile</h1>
          <p className="text-gray-100">Update your profile information</p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-custom max-w-3xl">
          <div className="card">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  className="input-field bg-gray-50"
                  value={user?.email || ''}
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  className="input-field"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Profession
                </label>
                <select
                  className="input-field"
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

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-primary-700 mb-4">Address</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      State
                    </label>
                    <select
                      className="input-field appearance-none cursor-pointer"
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
                    {formData.address.state === 'Other' && (
                      <input
                        type="text"
                        className="input-field mt-3"
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      City
                    </label>
                    {formData.address.state && formData.address.state !== 'Other' ? (
                      <>
                        <select
                          className="input-field appearance-none cursor-pointer"
                          value={formData.address.city}
                          onChange={(e) => {
                            const selectedCity = e.target.value;
                            setFormData({
                              ...formData,
                              address: { 
                                ...formData.address, 
                                city: selectedCity,
                                district: selectedCity === 'Other' ? formData.address.district : ''
                              }
                            });
                          }}
                          disabled={!formData.address.state}
                        >
                          <option value="">Select City</option>
                          {availableCities.map((city) => (
                            <option key={city} value={city}>
                              {city}
                            </option>
                          ))}
                          {availableCities.length > 0 && (
                            <option value="Other">Other (Specify below)</option>
                          )}
                        </select>
                        {formData.address.city === 'Other' && (
                          <input
                            type="text"
                            className="input-field mt-3"
                            value={formData.address.district || ''}
                            onChange={(e) => setFormData({
                              ...formData,
                              address: { ...formData.address, district: e.target.value, city: 'Other' }
                            })}
                            placeholder="Enter your city name"
                            required
                          />
                        )}
                        {formData.address.state && availableCities.length === 0 && (
                          <input
                            type="text"
                            className="input-field mt-3"
                            value={formData.address.city}
                            onChange={(e) => setFormData({
                              ...formData,
                              address: { ...formData.address, city: e.target.value }
                            })}
                            placeholder="Enter your city"
                          />
                        )}
                      </>
                    ) : (
                      <input
                        type="text"
                        className="input-field"
                        value={formData.address.city}
                        onChange={(e) => setFormData({
                          ...formData,
                          address: { ...formData.address, city: e.target.value }
                        })}
                        placeholder={formData.address.state === 'Other' ? 'Enter your city' : 'Select State First'}
                        disabled={!formData.address.state}
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      District
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={formData.address.district}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, district: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Pincode
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={formData.address.pincode}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, pincode: e.target.value }
                      })}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}

