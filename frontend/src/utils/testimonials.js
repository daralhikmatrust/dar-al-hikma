export const TESTIMONIALS_STORAGE_KEY = 'daralhikma_testimonials'

export function loadAllTestimonials() {
  try {
    const raw = localStorage.getItem(TESTIMONIALS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function saveAllTestimonials(list) {
  try {
    localStorage.setItem(TESTIMONIALS_STORAGE_KEY, JSON.stringify(list || []))
  } catch {
    // ignore write errors (e.g. private mode)
  }
}

export function addTestimonial({ name, role, location, message }) {
  const all = loadAllTestimonials()
  const now = new Date().toISOString()
  const newItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: name?.trim(),
    role: role?.trim() || 'Supporter',
    location: location?.trim() || '',
    message: message?.trim(),
    approved: false,
    createdAt: now
  }
  const next = [...all, newItem]
  saveAllTestimonials(next)
  return newItem
}

export function approveTestimonial(id, approved = true) {
  const all = loadAllTestimonials()
  const next = all.map((t) => (t.id === id ? { ...t, approved } : t))
  saveAllTestimonials(next)
  return next
}

export function deleteTestimonial(id) {
  const all = loadAllTestimonials()
  const next = all.filter((t) => t.id !== id)
  saveAllTestimonials(next)
  return next
}

export function getApprovedTestimonials() {
  return loadAllTestimonials().filter((t) => t.approved)
}

