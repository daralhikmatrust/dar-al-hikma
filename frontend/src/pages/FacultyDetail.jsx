import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../services/api'
import PageHeader from '../components/PageHeader'
import { loadFacultiesWithFallback } from '../utils/faculties'
import { FiArrowLeft, FiUsers, FiBook } from 'react-icons/fi'

export default function FacultyDetail() {
  const { facultyName, slug } = useParams()
  const categorySlug = slug || facultyName
  const [faculty, setFaculty] = useState(null)
  const [members, setMembers] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFacultyData()
  }, [categorySlug])

  const fetchFacultyData = async () => {
    if (!categorySlug) return
    try {
      setLoading(true)
      const facultiesList = await loadFacultiesWithFallback()
      const facultyData = facultiesList.find(f => 
        f.name?.toLowerCase().replace(/\s+/g, '-') === categorySlug ||
        f.id === categorySlug ||
        (f.slug && f.slug === categorySlug)
      )
      
      if (facultyData) {
        setFaculty(facultyData)
        
        // Get members
        const allMembers = JSON.parse(localStorage.getItem('facultyMembers') || '{}')
        setMembers(allMembers[facultyData.name] || [])
        
        // Get projects
        const { data } = await api.get(`/projects?faculty=${facultyData.name}`)
        setProjects(data.projects || [])
      }
    } catch (error) {
      console.error('Failed to fetch faculty data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading category details...</p>
        </div>
      </div>
    )
  }

  if (!faculty) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Category not found</h1>
          <Link to="/categories" className="btn-primary">
            <FiArrowLeft className="inline mr-2" />
            Back to Categories
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Page Header */}
      <section className="py-8 md:py-12 bg-slate-50">
        <div className="container-custom px-4 sm:px-6 lg:px-8">
          <Link to="/categories" className="inline-flex items-center text-slate-600 hover:text-primary-600 mb-4 transition-colors text-sm font-medium">
            <FiArrowLeft className="mr-2" />
            Back to Categories
          </Link>
          <PageHeader
            title={faculty.name}
            description={faculty.description || 'Category description'}
          />
        </div>
      </section>

      {/* Members Section */}
      {members.length > 0 && (
        <section className="section-padding bg-gray-50">
          <div className="container-custom">
            <div className="flex items-center gap-3 mb-8">
              <FiUsers className="text-3xl text-primary-600" />
              <h2 className="heading-primary">Category Members</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {members.map((member, idx) => (
                <div
                  key={member.id || idx}
                  className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  <h3 className="text-xl font-bold text-primary-700 mb-2">{member.name}</h3>
                  <p className="text-gray-600 mb-2 font-semibold">{member.designation || 'Member'}</p>
                  {member.email && (
                    <p className="text-sm text-gray-500 mb-1">{member.email}</p>
                  )}
                  {member.phone && (
                    <p className="text-sm text-gray-500 mb-2">{member.phone}</p>
                  )}
                  {member.bio && (
                    <p className="text-sm text-gray-600 mt-2">{member.bio}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Projects Section */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="flex items-center gap-3 mb-8">
            <FiBook className="text-3xl text-primary-600" />
            <h2 className="heading-primary">Projects</h2>
          </div>
          {projects.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Link
                  key={project._id}
                  to={`/projects/${project._id}`}
                  className="card hover:shadow-2xl transition-all"
                >
                  <div className="aspect-video bg-gradient-to-br from-primary-400 to-gold-400 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                    {project.images?.[0] ? (
                      <img
                        src={project.images[0].url}
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-2xl font-bold opacity-50">{project.faculty[0]}</span>
                    )}
                    <div className="absolute top-2 right-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        project.status === 'completed' ? 'bg-green-500' :
                        project.status === 'ongoing' ? 'bg-blue-500' : 'bg-gray-500'
                      } text-white`}>
                        {project.status}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-primary-700 mb-2">{project.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {project.shortDescription || project.description}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-primary-600 font-semibold">{project.faculty}</span>
                    <span className="text-gray-500">
                      {project.progress || 0}% Complete
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No projects found for this category.
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom text-center">
          <h2 className="heading-primary mb-4">Support {faculty.name}</h2>
          <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
            Your donations help us continue our work in {faculty.name}. Make a donation today.
          </p>
          <Link to="/donate" className="btn-primary inline-block">
            Donate Now
          </Link>
        </div>
      </section>
    </div>
  )
}
