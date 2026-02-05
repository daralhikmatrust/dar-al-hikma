import Media from '../models/Media.model.js';
import multer from 'multer';
import crypto from 'crypto';
import { getSupabaseAdmin, SUPABASE_MEDIA_BUCKET, getPublicObjectUrl } from '../utils/supabase.js';

const storage = multer.memoryStorage();

const IMAGE_EXT = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg', 'tiff', 'ico', 'heic', 'heif'];
const VIDEO_EXT = ['mp4', 'mov', 'avi', 'webm', 'mkv', 'flv', 'wmv', 'm4v', '3gp', 'ogv'];
const DOC_EXT = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'csv'];

function getExt(originalname = '') {
  const parts = originalname.toLowerCase().split('.');
  return parts.length > 1 ? parts.pop() : '';
}

function detectMediaType(file) {
  const ext = getExt(file?.originalname);
  if (file?.mimetype?.startsWith('video/') || VIDEO_EXT.includes(ext)) return 'video';
  if (file?.mimetype?.startsWith('image/') || IMAGE_EXT.includes(ext)) return 'image';
  return 'document';
}

function sanitizeBaseName(name = '') {
  return name
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60) || 'file';
}

export const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit (increased for videos)
  },
  fileFilter: (req, file, cb) => {
    const ext = getExt(file.originalname);
    const allowed =
      file.mimetype.startsWith('image/') ||
      file.mimetype.startsWith('video/') ||
      file.mimetype === 'application/pdf' ||
      DOC_EXT.includes(ext) ||
      IMAGE_EXT.includes(ext) ||
      VIDEO_EXT.includes(ext);
    
    if (allowed) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, videos, and documents are allowed.'));
    }
  }
});

// Upload media
export const uploadMedia = async (req, res, next) => {
  try {
    if (!req.file && !req.files) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const file = req.file || (req.files && req.files[0]);
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const mediaType = detectMediaType(file);
    const ext = getExt(file.originalname) || (mediaType === 'image' ? 'jpg' : mediaType === 'video' ? 'mp4' : 'bin');
    const base = sanitizeBaseName(file.originalname);
    const y = new Date().getUTCFullYear();
    const m = String(new Date().getUTCMonth() + 1).padStart(2, '0');
    const id = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');

    const objectPath = `dar-al-hikma/${mediaType}/${y}/${m}/${base}-${id}.${ext}`;

    const supabaseAdmin = getSupabaseAdmin();
    const uploadRes = await supabaseAdmin.storage
      .from(SUPABASE_MEDIA_BUCKET)
      .upload(objectPath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadRes.error) {
      return res.status(500).json({ message: `Supabase upload failed: ${uploadRes.error.message}` });
    }

    const mediaUrl = getPublicObjectUrl(SUPABASE_MEDIA_BUCKET, objectPath);
    if (!mediaUrl) {
      return res.status(500).json({ message: 'Supabase public URL could not be constructed. Check SUPABASE_URL.' });
    }

    const publicId = objectPath;

    const media = await Media.create({
      title: req.body.title || null,
      description: req.body.description || null,
      type: mediaType,
      url: mediaUrl,
      publicId: publicId,
      category: req.body.category || 'gallery',
      project: req.body.project || null,
      uploadedBy: req.user.id,
      isApproved: req.user.role === 'admin', // Auto-approve for admins
      tags: req.body.tags ? (Array.isArray(req.body.tags) ? req.body.tags : req.body.tags.split(',')) : [],
      metadata: {
        size: file.size || null,
        mimetype: file.mimetype || null,
        originalName: file.originalname || null,
        bucket: SUPABASE_MEDIA_BUCKET,
        objectPath: objectPath
      }
    });

    res.status(201).json({
      success: true,
      message: 'Media uploaded successfully',
      media
    });
  } catch (error) {
    console.error('Upload media error:', error);
    next(error);
  }
};

// Get all media
export const getMedia = async (req, res, next) => {
  try {
    const { category, project, approved } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (project) filter.project = project;
    if (approved === 'true') filter.isApproved = true;

    const media = await Media.find(filter);

    res.json({
      success: true,
      count: media.length,
      media
    });
  } catch (error) {
    next(error);
  }
};

// Get single media
export const getMediaById = async (req, res, next) => {
  try {
    const media = await Media.findById(req.params.id);

    if (!media) {
      return res.status(404).json({ message: 'Media not found' });
    }

    res.json({
      success: true,
      media
    });
  } catch (error) {
    next(error);
  }
};

// Delete media (admin only)
export const deleteMedia = async (req, res, next) => {
  try {
    const media = await Media.findById(req.params.id);

    if (!media) {
      return res.status(404).json({ message: 'Media not found' });
    }

    // Delete from Supabase Storage if object path exists
    if (media.publicId) {
      try {
        const supabaseAdmin = getSupabaseAdmin();
        const delRes = await supabaseAdmin.storage
          .from(SUPABASE_MEDIA_BUCKET)
          .remove([media.publicId]);
        if (delRes.error) {
          console.error('Supabase delete error:', delRes.error);
        }
      } catch (storageError) {
        console.error('Supabase delete error:', storageError);
      }
    }

    await Media.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Media deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Approve media (admin only)
export const approveMedia = async (req, res, next) => {
  try {
    const media = await Media.findByIdAndUpdate(
      req.params.id,
      { isApproved: true }
    );

    if (!media) {
      return res.status(404).json({ message: 'Media not found' });
    }

    res.json({
      success: true,
      media
    });
  } catch (error) {
    next(error);
  }
};

