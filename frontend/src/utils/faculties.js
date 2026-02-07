import api from '../services/api'

const STORAGE_KEY = 'faculties'

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

export function getStoredFaculties() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return parsed.filter((c) => (c.status || 'active') === 'active').sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    }
  } catch {}
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
 * so they are visible on mobile and desktop. Uses: stored faculties > merged defaults + project faculties.
 */
export async function loadFacultiesWithFallback() {
  const stored = getStoredFaculties()
  if (stored.length > 0) return stored

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
