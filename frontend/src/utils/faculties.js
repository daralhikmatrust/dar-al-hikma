import api from '../services/api'

const STORAGE_KEY = 'faculties'

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

export async function loadFacultiesWithFallback() {
  const stored = getStoredFaculties()
  if (stored.length > 0) return stored
  return fetchFacultiesFromProjects()
}
