import pool from '../utils/db.js';
import { getSupabaseAdmin, SUPABASE_MEDIA_BUCKET, getPublicObjectUrl } from '../utils/supabase.js';

/**
 * Compute event status from date/time (upcoming, ongoing, past)
 */
function computeEventStatus(date, time) {
  if (!date) return 'upcoming';
  const now = new Date();
  const dateStr = String(date).split('T')[0];
  const eventDate = new Date(dateStr);
  let eventStart = new Date(dateStr);
  if (time) {
    const t = String(time).trim().slice(0, 8);
    const parts = t.split(':').map(Number);
    eventStart = new Date(dateStr);
    eventStart.setHours(parts[0] || 0, parts[1] || 0, parts[2] || 0, 0);
  }
  const eventEndOfDay = new Date(dateStr);
  eventEndOfDay.setHours(23, 59, 59, 999);

  if (eventEndOfDay < now) return 'past';
  if (eventStart <= now && now <= eventEndOfDay) return 'ongoing';
  return 'upcoming';
}

/**
 * Get all events (public - only visible)
 * Status is computed from date/time for accuracy
 */
export const getEvents = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
        `SELECT id, title, description, excerpt, date, time, location,
              banner_image, banner_image_url, images, video_url,
              url_slug, tags, featured, status, visible, created_at, updated_at
       FROM events
       WHERE visible = true
       ORDER BY date ASC, created_at DESC`
    );

    const events = rows.map(row => {
      const computedStatus = computeEventStatus(row.date, row.time);
      return {
        id: row.id,
        title: row.title,
        description: row.description,
        excerpt: row.excerpt,
        date: row.date,
        time: row.time,
        location: row.location,
        bannerImage: row.banner_image_url || row.banner_image,
        images: row.images || [],
        videoUrl: row.video_url,
        slug: row.url_slug,
        tags: Array.isArray(row.tags) ? row.tags : (row.tags ? JSON.parse(row.tags || '[]') : []),
        featured: Boolean(row.featured),
        status: computedStatus,
        visible: row.visible,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    });

    res.json({ success: true, events });
  } catch (error) {
    console.error('Get events error:', error);
    next(error);
  }
};

/**
 * Get single event by ID (public)
 * Status computed from date/time
 */
const isUuid = (s) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(s || ''));

export const getEventById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let rows;
    if (isUuid(id)) {
      const r = await pool.query(
        `SELECT id, title, description, excerpt, date, time, location,
                banner_image, banner_image_url, images, video_url,
                url_slug, tags, featured, status, visible, created_at, updated_at
         FROM events WHERE id = $1 AND visible = true LIMIT 1`,
        [id]
      );
      rows = r.rows;
    } else {
      const r = await pool.query(
        `SELECT id, title, description, excerpt, date, time, location,
                banner_image, banner_image_url, images, video_url,
                url_slug, tags, featured, status, visible, created_at, updated_at
         FROM events WHERE url_slug = $1 AND visible = true LIMIT 1`,
        [id]
      );
      rows = r.rows;
    }

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const row = rows[0];
    const computedStatus = computeEventStatus(row.date, row.time);
    const event = {
      id: row.id,
      title: row.title,
      description: row.description,
      excerpt: row.excerpt,
      date: row.date,
      time: row.time,
      location: row.location,
      bannerImage: row.banner_image_url || row.banner_image,
      images: row.images || [],
      videoUrl: row.video_url,
      slug: row.url_slug,
      tags: Array.isArray(row.tags) ? row.tags : (row.tags ? JSON.parse(row.tags || '[]') : []),
      featured: Boolean(row.featured),
      status: computedStatus,
      visible: row.visible,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    res.json({ success: true, event });
  } catch (error) {
    console.error('Get event error:', error);
    next(error);
  }
};

/**
 * Get all events (admin - all visibility)
 */
export const getAllEvents = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, title, description, excerpt, date, time, location,
              banner_image, banner_image_url, images, video_url,
              url_slug, tags, featured, status, visible, created_by, created_at, updated_at
       FROM events
       ORDER BY date DESC, created_at DESC`
    );

    const events = rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      excerpt: row.excerpt,
      date: row.date,
      time: row.time,
      location: row.location,
      bannerImage: row.banner_image_url || row.banner_image,
      images: row.images || [],
      videoUrl: row.video_url,
      slug: row.url_slug,
      tags: Array.isArray(row.tags) ? row.tags : (row.tags ? JSON.parse(row.tags || '[]') : []),
      featured: Boolean(row.featured),
      status: row.status,
      visible: row.visible,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json({ success: true, events });
  } catch (error) {
    console.error('Get all events error:', error);
    next(error);
  }
};

/**
 * Create event (admin)
 */
export const createEvent = async (req, res, next) => {
  try {
    const raw = req.body;
    const parseJson = (v) => {
      if (Array.isArray(v)) return v;
      if (typeof v === 'string') { try { return JSON.parse(v || '[]'); } catch { return []; } }
      return v || [];
    };
    const title = raw.title;
    const description = raw.description;
    const excerpt = raw.excerpt || null;
    const date = raw.date;
    const time = raw.time || null;
    const location = raw.location || null;
    const bannerImageUrl = raw.bannerImageUrl || null;
    const images = parseJson(raw.images);
    const videoUrl = raw.videoUrl || null;
    const urlSlug = (raw.urlSlug || raw.url_slug || '').trim() || null;
    const tags = parseJson(raw.tags);
    const featured = raw.featured === true || raw.featured === 'true';
    const visible = raw.visible !== false && raw.visible !== 'false';

    if (!title || !description || !date) {
      return res.status(400).json({ success: false, message: 'Title, description, and date are required' });
    }

    let bannerImage = null;
    let bannerImageUrlFinal = bannerImageUrl || null;

    // Handle file upload if provided
    if (req.file) {
      try {
        const supabaseAdmin = getSupabaseAdmin();
        const fileExt = req.file.originalname.split('.').pop();
        const fileName = `events/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from(SUPABASE_MEDIA_BUCKET)
          .upload(fileName, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: false
          });

        if (uploadError) throw uploadError;

        bannerImage = fileName;
        bannerImageUrlFinal = getPublicObjectUrl(SUPABASE_MEDIA_BUCKET, fileName);
      } catch (uploadErr) {
        console.error('File upload error:', uploadErr);
        return res.status(500).json({ success: false, message: 'Failed to upload banner image' });
      }
    }

    const { rows } = await pool.query(
      `INSERT INTO events (title, description, excerpt, date, time, location,
                          banner_image, banner_image_url, images, video_url,
                          url_slug, tags, featured, visible, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING id, title, description, excerpt, date, time, location,
                 banner_image, banner_image_url, images, video_url,
                 url_slug, tags, featured, status, visible, created_at, updated_at`,
      [
        title, description, excerpt, date, time, location,
        bannerImage, bannerImageUrlFinal, JSON.stringify(images), videoUrl,
        urlSlug, JSON.stringify(tags), featured, visible,
        req.user.id
      ]
    );

    const row = rows[0];
    const event = {
      id: row.id,
      title: row.title,
      description: row.description,
      excerpt: row.excerpt,
      date: row.date,
      time: row.time,
      location: row.location,
      bannerImage: row.banner_image_url || row.banner_image,
      images: row.images || [],
      videoUrl: row.video_url,
      slug: row.url_slug,
      tags: Array.isArray(row.tags) ? row.tags : (row.tags ? JSON.parse(row.tags || '[]') : []),
      featured: Boolean(row.featured),
      status: row.status,
      visible: row.visible,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    res.status(201).json({ success: true, event });
  } catch (error) {
    console.error('Create event error:', error);
    next(error);
  }
};

/**
 * Update event (admin)
 */
export const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const raw = req.body;
    const parseJson = (v) => {
      if (Array.isArray(v)) return v;
      if (typeof v === 'string') { try { return JSON.parse(v || '[]'); } catch { return []; } }
      return v || [];
    };
    const title = raw.title;
    const description = raw.description;
    const excerpt = raw.excerpt || null;
    const date = raw.date;
    const time = raw.time || null;
    const location = raw.location || null;
    const bannerImageUrl = raw.bannerImageUrl || null;
    const images = parseJson(raw.images);
    const videoUrl = raw.videoUrl || null;
    const urlSlug = (raw.urlSlug || raw.url_slug || '').trim() || null;
    const tags = parseJson(raw.tags);
    const featured = raw.featured === true || raw.featured === 'true';
    const visible = raw.visible !== false && raw.visible !== 'false';

    if (!title || !description || !date) {
      return res.status(400).json({ success: false, message: 'Title, description, and date are required' });
    }

    // Check if event exists
    const { rows: existingRows } = await pool.query(
      'SELECT banner_image FROM events WHERE id = $1',
      [id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    let bannerImage = existingRows[0].banner_image;
    let bannerImageUrlFinal = bannerImageUrl || null;

    // Handle file upload if provided
    if (req.file) {
      try {
        const supabaseAdmin = getSupabaseAdmin();
        const fileExt = req.file.originalname.split('.').pop();
        const fileName = `events/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from(SUPABASE_MEDIA_BUCKET)
          .upload(fileName, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: false
          });

        if (uploadError) throw uploadError;

        bannerImage = fileName;
        bannerImageUrlFinal = getPublicObjectUrl(SUPABASE_MEDIA_BUCKET, fileName);
      } catch (uploadErr) {
        console.error('File upload error:', uploadErr);
        return res.status(500).json({ success: false, message: 'Failed to upload banner image' });
      }
    }

    const { rows } = await pool.query(
      `UPDATE events
       SET title = $1, description = $2, excerpt = $3, date = $4, time = $5, location = $6,
           banner_image = $7, banner_image_url = $8, images = $9, video_url = $10,
           url_slug = $11, tags = $12, featured = $13, visible = $14, updated_at = NOW()
       WHERE id = $15
       RETURNING id, title, description, excerpt, date, time, location,
                 banner_image, banner_image_url, images, video_url,
                 url_slug, tags, featured, status, visible, created_at, updated_at`,
      [
        title, description, excerpt, date, time, location,
        bannerImage, bannerImageUrlFinal, JSON.stringify(images), videoUrl,
        urlSlug, JSON.stringify(tags), featured, visible,
        id
      ]
    );

    const row = rows[0];
    const event = {
      id: row.id,
      title: row.title,
      description: row.description,
      excerpt: row.excerpt,
      date: row.date,
      time: row.time,
      location: row.location,
      bannerImage: row.banner_image_url || row.banner_image,
      images: row.images || [],
      videoUrl: row.video_url,
      slug: row.url_slug,
      tags: Array.isArray(row.tags) ? row.tags : (row.tags ? JSON.parse(row.tags || '[]') : []),
      featured: Boolean(row.featured),
      status: row.status,
      visible: row.visible,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    res.json({ success: true, event });
  } catch (error) {
    console.error('Update event error:', error);
    next(error);
  }
};

/**
 * Delete event (admin)
 */
export const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM events WHERE id = $1', [id]);

    if (rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    next(error);
  }
};
