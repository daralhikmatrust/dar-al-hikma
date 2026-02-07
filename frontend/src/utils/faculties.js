import api from '../services/api'

const DEFAULT_CATEGORY_NAMES = [
  'Education',
  'Healthcare',
  'Livelihood Support',
  'Relief Fund',
  'Orphan Support',
  'Scholarship',
  'Women Empowerment',
  'Poverty Alleviation',
  'Nikah',
  'Others'
]

export async function fetchFacultiesFromApi() {
  try {
    const { data } = await api.get('/content/faculties')
    const faculties = data?.faculties || []
    if (Array.isArray(faculties) && faculties.length > 0) {
      return faculties.filter((c) => (c.status || 'active') === 'active').sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    }
  } catch {
    // Fallback handled below
  }
  return []
}

export async function fetchFacultiesFromProjects() {
  try {
    const { data } = await api.get('/projects')
    const projects = data?.projects || []
    const seen = new Set()
    const list = []
    for (const p of projects) {
      const name = (p.faculty || '').trim()
      if (name && !seen.has(name)) {
        seen.add(name)
        list.push({
          id: name.toLowerCase().replace(/\s+/g, '-'),
          name,
          status: 'active',
          sortOrder: list.length
        })
      }
    }
    return list.sort((a, b) => a.name.localeCompare(b.name))
  } catch {
    return []
  }
}

/**
 * Load faculties for display. Returns ALL categories (including those with 0 projects)
 * so they are visible on mobile and desktop.
 * Uses: API faculties > project-derived faculties > merged defaults.
 */
export async function loadFacultiesWithFallback() {
  const fromApi = await fetchFacultiesFromApi()
  if (fromApi.length > 0) return fromApi

  const fromProjects = await fetchFacultiesFromProjects()
  const seen = new Set(fromProjects.map((c) => c.name.toLowerCase()))
  const defaults = DEFAULT_CATEGORY_NAMES.filter((n) => !seen.has(n.toLowerCase())).map((name, idx) => ({
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    status: 'active',
    sortOrder: fromProjects.length + idx
  }))
  return [...fromProjects, ...defaults].sort((a, b) => a.name.localeCompare(b.name))
}
