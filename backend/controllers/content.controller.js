import pool from '../utils/db.js';
import crypto from 'crypto';
import { getPublicObjectUrl, getSupabaseAdmin, SUPABASE_MEDIA_BUCKET } from '../utils/supabase.js';

const DEFAULT_ABOUT = {
  heroTitle: 'About Dar Al Hikma Trust',
  heroDescription:
    'A beacon of hope and knowledge, dedicated to transforming lives through education, healthcare, and welfare.',
  story:
    'Dar Al Hikma Trust was established with a vision to serve humanity and empower communities through sustainable development initiatives.',
  mission: 'To empower communities through accessible education, healthcare, and welfare programs.',
  vision: 'A world where every individual has access to quality education, healthcare, and opportunities for growth.',
  values: [
    { title: 'Excellence', description: 'We strive for excellence in all our programs and initiatives.' },
    { title: 'Compassion', description: 'Compassion drives every action we take and every life we touch.' },
    { title: 'Integrity', description: 'We operate with the highest standards of integrity and transparency.' },
    { title: 'Service', description: 'Service to humanity is at the heart of everything we do.' }
  ]
};

const DEFAULT_CONTACT = {
  address: 'Hyderabad, Telangana, India',
  phone1: '+91 1234567890',
  phone2: '+91 9876543210',
  email1: 'info@daralhikma.org',
  email2: 'support@daralhikma.org',
  officeHours: 'Monday - Friday: 9:00 AM - 6:00 PM\nSaturday: 10:00 AM - 4:00 PM\nSunday: Closed'
};

async function getContentRow(key) {
  const { rows } = await pool.query(
    `SELECT key, data, updated_at FROM site_content WHERE key = $1 LIMIT 1`,
    [key]
  );
  return rows?.[0] || null;
}

async function upsertContentRow(key, data) {
  const { rows } = await pool.query(
    `INSERT INTO site_content (key, data, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (key)
     DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
     RETURNING key, data, updated_at`,
    [key, JSON.stringify(data || {})]
  );
  return rows?.[0] || null;
}

const DEFAULT_FACULTIES = [
  { id: 'education', name: 'Education', description: '', slug: 'education', status: 'active', sortOrder: 0 },
  { id: 'healthcare', name: 'Healthcare', description: '', slug: 'healthcare', status: 'active', sortOrder: 1 },
  { id: 'livelihood-support', name: 'Livelihood Support', description: '', slug: 'livelihood-support', status: 'active', sortOrder: 2 },
  { id: 'relief-fund', name: 'Relief Fund', description: '', slug: 'relief-fund', status: 'active', sortOrder: 3 },
  { id: 'orphan-support', name: 'Orphan Support', description: '', slug: 'orphan-support', status: 'active', sortOrder: 4 },
  { id: 'nikah', name: 'Nikah', description: '', slug: 'nikah', status: 'active', sortOrder: 5 },
  { id: 'others', name: 'Others', description: '', slug: 'others', status: 'active', sortOrder: 6 }
];

const DEFAULT_ASSETS = {
  donationQrUrl: '',
  homeSlider: [], // [{ url, title, linkUrl? }]
  eventsPage: {
    heroSubtitle: 'Join our workshops, webinars, and community events designed for students and partners pursuing excellence.',
    heroImageUrl: ''
  }
};

function getExtFromOriginalName(name = '') {
  const parts = String(name).toLowerCase().split('.');
  if (parts.length < 2) return '';
  const ext = parts.pop();
  return ext && ext.length <= 12 ? ext : '';
}

function pickImageExt(file) {
  const byName = getExtFromOriginalName(file?.originalname);
  if (byName) return byName;
  const mt = String(file?.mimetype || '').toLowerCase();
  if (mt === 'image/jpeg') return 'jpg';
  if (mt === 'image/png') return 'png';
  if (mt === 'image/webp') return 'webp';
  if (mt === 'image/gif') return 'gif';
  return 'jpg';
}

async function readAssetsBestEffort() {
  try {
    const row = await getContentRow('assets');
    if (row?.data) return typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
  } catch (e) {
    if (e.code !== '42P01') throw e;
  }
  return DEFAULT_ASSETS;
}

// Public
export const getPublicAboutContent = async (req, res, next) => {
  try {
    let about = DEFAULT_ABOUT;
    try {
      const row = await getContentRow('about');
      if (row?.data) about = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
    } catch (e) {
      if (e.code !== '42P01') throw e;
    }
    res.json({ success: true, about });
  } catch (e) {
    next(e);
  }
};

export const getPublicContactContent = async (req, res, next) => {
  try {
    let contact = DEFAULT_CONTACT;
    try {
      const row = await getContentRow('contact');
      if (row?.data) contact = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
    } catch (e) {
      if (e.code !== '42P01') throw e;
    }
    res.json({ success: true, contact });
  } catch (e) {
    next(e);
  }
};

export const getPublicFaculties = async (req, res, next) => {
  try {
    let faculties = DEFAULT_FACULTIES;
    try {
      const row = await getContentRow('faculties');
      if (row?.data) {
        const parsed = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
        faculties = Array.isArray(parsed) ? parsed : DEFAULT_FACULTIES;
      }
    } catch (e) {
      if (e.code !== '42P01') throw e;
    }
    res.json({ success: true, faculties });
  } catch (e) {
    next(e);
  }
};

export const getPublicAssets = async (req, res, next) => {
  try {
    let assets = DEFAULT_ASSETS;
    try {
      const row = await getContentRow('assets');
      if (row?.data) assets = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
    } catch (e) {
      if (e.code !== '42P01') throw e;
    }
    res.json({ success: true, assets });
  } catch (e) {
    next(e);
  }
};

// Admin
export const getAdminContent = async (req, res, next) => {
  try {
    let about = DEFAULT_ABOUT;
    let contact = DEFAULT_CONTACT;

    try {
      const aboutRow = await getContentRow('about');
      const contactRow = await getContentRow('contact');
      if (aboutRow?.data) about = typeof aboutRow.data === 'string' ? JSON.parse(aboutRow.data) : aboutRow.data;
      if (contactRow?.data) contact = typeof contactRow.data === 'string' ? JSON.parse(contactRow.data) : contactRow.data;
    } catch (e) {
      if (e.code !== '42P01') throw e;
    }

    res.json({ success: true, about, contact });
  } catch (e) {
    next(e);
  }
};

export const updateAboutContent = async (req, res, next) => {
  try {
    const row = await upsertContentRow('about', req.body || {});
    res.json({ success: true, about: row?.data || req.body });
  } catch (e) {
    next(e);
  }
};

export const updateContactContent = async (req, res, next) => {
  try {
    const row = await upsertContentRow('contact', req.body || {});
    res.json({ success: true, contact: row?.data || req.body });
  } catch (e) {
    next(e);
  }
};

export const updateFacultiesContent = async (req, res, next) => {
  try {
    const faculties = Array.isArray(req.body) ? req.body : (req.body?.faculties || []);
    const row = await upsertContentRow('faculties', faculties);
    const data = row?.data;
    res.json({ success: true, faculties: Array.isArray(data) ? data : faculties });
  } catch (e) {
    next(e);
  }
};

export const getAdminFaculties = async (req, res, next) => {
  try {
    let faculties = DEFAULT_FACULTIES;
    try {
      const row = await getContentRow('faculties');
      if (row?.data) {
        const parsed = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
        faculties = Array.isArray(parsed) ? parsed : DEFAULT_FACULTIES;
      }
    } catch (e) {
      if (e.code !== '42P01') throw e;
    }
    res.json({ success: true, faculties });
  } catch (e) {
    next(e);
  }
};

export const getAdminAssets = async (req, res, next) => {
  try {
    let assets = DEFAULT_ASSETS;
    try {
      const row = await getContentRow('assets');
      if (row?.data) assets = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
    } catch (e) {
      if (e.code !== '42P01') throw e;
    }
    res.json({ success: true, assets });
  } catch (e) {
    next(e);
  }
};

export const updateAssets = async (req, res, next) => {
  try {
    const incoming = req.body || {};
    const merged = {
      ...DEFAULT_ASSETS,
      ...incoming,
      homeSlider: Array.isArray(incoming.homeSlider) ? incoming.homeSlider : DEFAULT_ASSETS.homeSlider,
      eventsPage: incoming.eventsPage && typeof incoming.eventsPage === 'object'
        ? { ...DEFAULT_ASSETS.eventsPage, ...incoming.eventsPage }
        : DEFAULT_ASSETS.eventsPage
    };
    const row = await upsertContentRow('assets', merged);
    res.json({ success: true, assets: row?.data || merged });
  } catch (e) {
    next(e);
  }
};

// Admin uploads (Supabase Storage)
export const uploadDonationQrImage = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file?.buffer) return res.status(400).json({ message: 'No file uploaded' });

    const ext = pickImageExt(file);
    const id = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
    const objectPath = `dar-al-hikma/site-assets/qr/${id}.${ext}`;

    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.storage.from(SUPABASE_MEDIA_BUCKET).upload(objectPath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });
    if (error) return res.status(500).json({ message: `Supabase upload failed: ${error.message}` });

    const url = getPublicObjectUrl(SUPABASE_MEDIA_BUCKET, objectPath);
    const current = await readAssetsBestEffort();
    const merged = { ...DEFAULT_ASSETS, ...current, donationQrUrl: url };
    await upsertContentRow('assets', merged);

    res.json({ success: true, url, assets: merged });
  } catch (e) {
    next(e);
  }
};

export const uploadHomeSliderImages = async (req, res, next) => {
  try {
    const files = req.files || [];
    if (!Array.isArray(files) || files.length === 0) return res.status(400).json({ message: 'No files uploaded' });

    const supabaseAdmin = getSupabaseAdmin();
    const y = new Date().getUTCFullYear();
    const m = String(new Date().getUTCMonth() + 1).padStart(2, '0');

    const uploaded = [];
    for (const f of files) {
      if (!f?.buffer) continue;
      const ext = pickImageExt(f);
      const id = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
      const objectPath = `dar-al-hikma/site-assets/home-slider/${y}/${m}/${id}.${ext}`;
      const { error } = await supabaseAdmin.storage.from(SUPABASE_MEDIA_BUCKET).upload(objectPath, f.buffer, {
        contentType: f.mimetype,
        upsert: false,
      });
      if (error) return res.status(500).json({ message: `Supabase upload failed: ${error.message}` });
      uploaded.push({
        url: getPublicObjectUrl(SUPABASE_MEDIA_BUCKET, objectPath),
        title: ''
      });
    }

    const replace = String(req.query?.replace || '').toLowerCase() === 'true';
    const current = await readAssetsBestEffort();
    const nextSlider = replace ? uploaded : [...(current?.homeSlider || []), ...uploaded];
    const merged = { ...DEFAULT_ASSETS, ...current, homeSlider: nextSlider };
    await upsertContentRow('assets', merged);

    res.json({ success: true, uploaded, assets: merged });
  } catch (e) {
    next(e);
  }
};

export const uploadEventsHeroImage = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file?.buffer) return res.status(400).json({ message: 'No file uploaded' });

    const ext = pickImageExt(file);
    const id = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
    const objectPath = `dar-al-hikma/site-assets/events-hero/${id}.${ext}`;

    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.storage.from(SUPABASE_MEDIA_BUCKET).upload(objectPath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });
    if (error) return res.status(500).json({ message: `Supabase upload failed: ${error.message}` });

    const url = getPublicObjectUrl(SUPABASE_MEDIA_BUCKET, objectPath);
    const current = await readAssetsBestEffort();
    const eventsPage = { ...DEFAULT_ASSETS.eventsPage, ...current?.eventsPage, heroImageUrl: url };
    const merged = { ...DEFAULT_ASSETS, ...current, eventsPage };
    await upsertContentRow('assets', merged);

    res.json({ success: true, url, assets: merged });
  } catch (e) {
    next(e);
  }
};

