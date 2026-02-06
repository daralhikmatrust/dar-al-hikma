import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../services/api'
import { formatINR, normalizeAmount } from '../utils/currency'
import PageHeader from '../components/PageHeader'
import { FiMapPin, FiCalendar, FiTarget, FiCheckCircle } from 'react-icons/fi'

export default function ProjectDetail() {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProject()
  }, [id])

  const fetchProject = async () => {
    try {
      const { data } = await api.get(`/projects/${id}`)
      setProject(data.project)
    } catch (error) {
      console.error('Failed to fetch project:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="section-padding text-center">
        <h2 className="text-2xl font-bold mb-4">Project not found</h2>
        <Link to="/projects" className="text-primary-600 hover:underline">Back to Projects</Link>
      </div>
    )
  }

  return (
    <div>
      {/* Page Header */}
      <section className="py-8 md:py-12 bg-slate-50">
        <div className="container-custom px-4 sm:px-6 lg:px-8">
          <PageHeader
            title={project.title}
            description={project.shortDescription || project.description}
          >
            {project.faculty && (
              <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold mt-2">
                {project.faculty}
              </span>
            )}
          </PageHeader>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-custom">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Images */}
              {project.images && project.images.length > 0 && (
                <div className="mb-8">
                  <div className="grid grid-cols-2 gap-4">
                    {project.images.slice(0, 4).map((img, idx) => (
                      <img
                        key={idx}
                        src={img.url}
                        alt={img.caption || project.title}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="card mb-8">
                <h2 className="heading-secondary mb-4">About This Project</h2>
                <div className="prose text-gray-600 whitespace-pre-line">
                  {project.description}
                </div>
              </div>

              {/* Milestones */}
              {project.milestones && project.milestones.length > 0 && (
                <div className="card">
                  <h2 className="heading-secondary mb-6">Project Milestones</h2>
                  <div className="space-y-4">
                    {project.milestones.map((milestone, idx) => (
                      <div key={idx} className="flex items-start space-x-4">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          milestone.completed ? 'bg-green-500' : 'bg-gray-300'
                        }`}>
                          {milestone.completed ? (
                            <FiCheckCircle className="text-white" />
                          ) : (
                            <span className="text-white text-sm font-bold">{idx + 1}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-primary-700 mb-1">{milestone.title}</h3>
                          <p className="text-gray-600 text-sm mb-2">{milestone.description}</p>
                          {milestone.date && (
                            <p className="text-xs text-gray-500">
                              <FiCalendar className="inline mr-1" />
                              {new Date(milestone.date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div>
              <div className="card sticky top-24">
                <h3 className="text-xl font-semibold text-primary-700 mb-6">Project Details</h3>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Status</div>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      project.status === 'completed' ? 'bg-green-100 text-green-700' :
                      project.status === 'ongoing' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {project.status}
                    </span>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500 mb-1">Progress</div>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-primary-600 h-3 rounded-full"
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold">{project.progress}%</span>
                    </div>
                  </div>

                  {project.location && (
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Location</div>
                      <div className="flex items-start space-x-2">
                        <FiMapPin className="text-primary-600 mt-1" />
                        <div className="text-sm">
                          {project.location.city && <div>{project.location.city}</div>}
                          {project.location.state && <div>{project.location.state}</div>}
                          {project.location.country && <div>{project.location.country}</div>}
                        </div>
                      </div>
                    </div>
                  )}

                  {project.startDate && (
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Start Date</div>
                      <div className="flex items-center space-x-2">
                        <FiCalendar className="text-primary-600" />
                        <span>{new Date(project.startDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}

                  {project.targetAmount > 0 && (
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Funding</div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Raised</span>
                          <span className="font-semibold">{formatINR(project.currentAmount || 0)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Target</span>
                          <span>{formatINR(project.targetAmount || 0)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full"
                            style={{ width: `${Math.min((normalizeAmount(project.currentAmount) / normalizeAmount(project.targetAmount)) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Link
                  to="/donate"
                  state={{ project: project._id }}
                  className="btn-primary w-full text-center block"
                >
                  Donate to This Project
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

