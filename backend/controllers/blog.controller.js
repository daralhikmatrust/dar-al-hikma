import pool from '../utils/db.js';
import { getSupabaseAdmin, SUPABASE_MEDIA_BUCKET, getPublicObjectUrl } from '../utils/supabase.js';

/**
 * Get all blogs (public - only published)
 */
export const getBlogs = async (req, res, next) => {
  try {
    const { category } = req.query;
    let query = `
      SELECT id, title, excerpt, content, author, category, date, 
             featured_image, featured_image_url, images, video_url,
             status, seo_title, seo_description, url_slug, created_at, updated_at
      FROM blogs
      WHERE status = 'published'
    `;
    const params = [];
    let paramCount = 1;

    if (category) {
      query += ` AND category = $${paramCount++}`;
      params.push(category);
    }

    query += ` ORDER BY date DESC, created_at DESC`;

    const { rows } = await pool.query(query, params);
    
    const blogs = rows.map(row => ({
      id: row.id,
      title: row.title,
      excerpt: row.excerpt,
      content: row.content,
      author: row.author,
      category: row.category,
      date: row.date,
      featuredImage: row.featured_image_url || row.featured_image,
      images: row.images || [],
      videoUrl: row.video_url,
      status: row.status,
      seoTitle: row.seo_title,
      seoDescription: row.seo_description,
      url: row.url_slug,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json({ success: true, blogs });
  } catch (error) {
    console.error('Get blogs error:', error);
    next(error);
  }
};

/**
 * Get single blog by ID or slug (public)
 * FIX: Using explicit casting (::text) to prevent UUID vs String mismatch
 */
export const getBlogById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // We cast 'id' column to text so it can be compared with the string $1 safely
    const query = `
      SELECT id, title, excerpt, content, author, category, date,
             featured_image, featured_image_url, images, video_url,
             status, seo_title, seo_description, url_slug, created_at, updated_at
      FROM blogs
      WHERE (id::text = $1 OR url_slug = $1) AND status = 'published'
      LIMIT 1
    `;

    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    const row = rows[0];
    const blog = {
      id: row.id,
      title: row.title,
      excerpt: row.excerpt,
      content: row.content,
      author: row.author,
      category: row.category,
      date: row.date,
      featuredImage: row.featured_image_url || row.featured_image,
      images: row.images || [],
      videoUrl: row.video_url,
      status: row.status,
      seoTitle: row.seo_title,
      seoDescription: row.seo_description,
      url: row.url_slug,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    res.json({ success: true, blog });
  } catch (error) {
    console.error('Get blog error:', error);
    next(error);
  }
};

/**
 * Get all blogs (admin - all statuses)
 */
export const getAllBlogs = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, title, excerpt, content, author, category, date,
              featured_image, featured_image_url, images, video_url,
              status, seo_title, seo_description, url_slug, created_by, created_at, updated_at
       FROM blogs
       ORDER BY created_at DESC`
    );

    const blogs = rows.map(row => ({
      id: row.id,
      title: row.title,
      excerpt: row.excerpt,
      content: row.content,
      author: row.author,
      category: row.category,
      date: row.date,
      featuredImage: row.featured_image_url || row.featured_image,
      images: row.images || [],
      videoUrl: row.video_url,
      status: row.status,
      seoTitle: row.seo_title,
      seoDescription: row.seo_description,
      url: row.url_slug,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json({ success: true, blogs });
  } catch (error) {
    console.error('Get all blogs error:', error);
    next(error);
  }
};

/**
 * Create blog (admin)
 */
export const createBlog = async (req, res, next) => {
  try {
    const {
      title, excerpt, content, author, category, date,
      featuredImageUrl, images: imagesRaw, videoUrl, status, seoTitle, seoDescription, url
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    const images = typeof imagesRaw === 'string' ? (() => { try { return JSON.parse(imagesRaw); } catch { return []; } })() : (imagesRaw || []);

    let featuredImage = null;
    let featuredImageUrlFinal = featuredImageUrl || null;

    if (req.file) {
      try {
        const supabaseAdmin = getSupabaseAdmin();
        const fileExt = req.file.originalname.split('.').pop();
        const fileName = `blogs/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabaseAdmin.storage
          .from(SUPABASE_MEDIA_BUCKET)
          .upload(fileName, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: false
          });

        if (uploadError) throw uploadError;

        featuredImage = fileName;
        featuredImageUrlFinal = getPublicObjectUrl(SUPABASE_MEDIA_BUCKET, fileName);
      } catch (uploadErr) {
        console.error('File upload error:', uploadErr);
        return res.status(500).json({ success: false, message: 'Failed to upload featured image' });
      }
    }

    const { rows } = await pool.query(
      `INSERT INTO blogs (title, excerpt, content, author, category, date,
                          featured_image, featured_image_url, images, video_url,
                          status, seo_title, seo_description, url_slug, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING id, title, excerpt, content, author, category, date,
                 featured_image, featured_image_url, images, video_url,
                 status, seo_title, seo_description, url_slug, created_at, updated_at`,
      [
        title, excerpt || null, content, author || null, category || null,
        date || new Date().toISOString().split('T')[0],
        featuredImage, featuredImageUrlFinal, JSON.stringify(images), videoUrl || null,
        status || 'draft', seoTitle || null, seoDescription || null, url || null,
        req.user.id
      ]
    );

    res.status(201).json({ success: true, blog: rows[0] });
  } catch (error) {
    console.error('Create blog error:', error);
    next(error);
  }
};

/**
 * Update blog (admin)
 */
export const updateBlog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title, excerpt, content, author, category, date,
      featuredImageUrl, images: imagesRaw, videoUrl, status, seoTitle, seoDescription, url
    } = req.body;

    const images = typeof imagesRaw === 'string' ? (() => { try { return JSON.parse(imagesRaw); } catch { return []; } })() : (imagesRaw || []);

    const { rows: existingRows } = await pool.query(
      'SELECT featured_image FROM blogs WHERE id::text = $1',
      [id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    let featuredImage = existingRows[0].featured_image;
    let featuredImageUrlFinal = featuredImageUrl || null;

    if (req.file) {
      try {
        const supabaseAdmin = getSupabaseAdmin();
        const fileExt = req.file.originalname.split('.').pop();
        const fileName = `blogs/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabaseAdmin.storage
          .from(SUPABASE_MEDIA_BUCKET)
          .upload(fileName, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: false
          });

        if (uploadError) throw uploadError;

        featuredImage = fileName;
        featuredImageUrlFinal = getPublicObjectUrl(SUPABASE_MEDIA_BUCKET, fileName);
      } catch (uploadErr) {
        console.error('File upload error:', uploadErr);
        return res.status(500).json({ success: false, message: 'Failed to upload featured image' });
      }
    }

    const { rows } = await pool.query(
      `UPDATE blogs
       SET title = $1, excerpt = $2, content = $3, author = $4, category = $5, date = $6,
           featured_image = $7, featured_image_url = $8, images = $9, video_url = $10,
           status = $11, seo_title = $12, seo_description = $13, url_slug = $14,
           updated_at = NOW()
       WHERE id::text = $15
       RETURNING id, title, excerpt, content, author, category, date,
                 featured_image, featured_image_url, images, video_url,
                 status, seo_title, seo_description, url_slug, created_at, updated_at`,
      [
        title, excerpt || null, content, author || null, category || null,
        date || new Date().toISOString().split('T')[0],
        featuredImage, featuredImageUrlFinal, JSON.stringify(images), videoUrl || null,
        status || 'draft', seoTitle || null, seoDescription || null, url || null,
        id
      ]
    );

    res.json({ success: true, blog: rows[0] });
  } catch (error) {
    console.error('Update blog error:', error);
    next(error);
  }
};

/**
 * Delete blog (admin)
 */
export const deleteBlog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM blogs WHERE id::text = $1', [id]);

    if (rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    res.json({ success: true, message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Delete blog error:', error);
    next(error);
  }
};