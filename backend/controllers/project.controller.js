import Project from '../models/Project.model.js';
import crypto from 'crypto';
import {
  getSupabaseAdmin,
  SUPABASE_MEDIA_BUCKET,
  getPublicObjectUrl
} from '../utils/supabase.js';

// Get all projects (public)
export const getProjects = async (req, res, next) => {
  try {
    const { status, faculty, featured, limit } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (faculty) filter.faculty = faculty;
    if (featured === 'true') filter.isFeatured = true;
    if (limit) filter.limit = limit;

    const projects = await Project.find(filter);

    res.json({
      success: true,
      count: projects.length,
      projects: projects || []
    });
  } catch (error) {
    console.error('Get projects error:', error);
    // If table doesn't exist, return empty array instead of error
    if (error.message && error.message.includes('does not exist')) {
      return res.json({
        success: true,
        count: 0,
        projects: [],
        message: 'Database tables not initialized. Please restart the server.'
      });
    }
    next(error);
  }
};

// Get single project (public)
export const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({
      success: true,
      project
    });
  } catch (error) {
    next(error);
  }
};

// Create project (admin only)
export const createProject = async (req, res, next) => {
  try {
    const {
      title,
      description,
      shortDescription,
      faculty,
      status,
      location,
      targetAmount,
      isFeatured,
      tags
    } = req.body;

    if (!title || !description || !faculty) {
      return res.status(400).json({
        message: 'Title, description, and faculty are required'
      });
    }

    // Parse location if it's a JSON string
    let parsedLocation = {};
    if (location) {
      try {
        parsedLocation = typeof location === 'string' ? JSON.parse(location) : location;
      } catch (parseError) {
        console.warn('Failed to parse location, using empty object:', parseError);
        parsedLocation = {};
      }
    }

    // Parse isFeatured if it's a string
    const isFeaturedBool = isFeatured === 'true' || isFeatured === true || isFeatured === '1';

    // Parse tags (optional) - expected JSON array from admin
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
        if (!Array.isArray(parsedTags)) {
          parsedTags = [];
        }
      } catch (parseError) {
        console.warn('Failed to parse project tags, using empty array:', parseError);
        parsedTags = [];
      }
    }

    // Handle photo upload
    let photoUrl = null;
    if (req.file) {
      try {
        const supabaseAdmin = getSupabaseAdmin();
        const ext = (req.file.originalname || '')
          .toLowerCase()
          .split('.')
          .pop() || 'jpg';

        const id = crypto.randomUUID
          ? crypto.randomUUID()
          : crypto.randomBytes(16).toString('hex');

        const objectPath = `dar-al-hikma/projects/${id}.${ext}`;

        const { error } = await supabaseAdmin.storage
          .from(SUPABASE_MEDIA_BUCKET)
          .upload(objectPath, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: false
          });

        if (error) throw error;

        photoUrl = getPublicObjectUrl(SUPABASE_MEDIA_BUCKET, objectPath);
      } catch (uploadError) {
        console.error('Photo upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Photo upload failed: ' + uploadError.message
        });
      }
    }

    // Calculate progress if target amount is provided
    let progress = 0;
    const currentAmount = 0;
    if (targetAmount && parseFloat(targetAmount) > 0) {
      progress = Math.min(100, Math.round((currentAmount / parseFloat(targetAmount)) * 100));
    }

    // Prepare images array - add photo if uploaded
    // We store images as an array of objects: [{ url, publicId?, caption? }]
    const images = photoUrl ? [{ url: photoUrl }] : [];

    const project = await Project.create({
      title,
      description,
      shortDescription: shortDescription || null,
      faculty,
      status: status || 'ongoing',
      location: parsedLocation,
      targetAmount: targetAmount ? parseFloat(targetAmount) : null,
      currentAmount: currentAmount,
      progress: progress,
      isFeatured: isFeaturedBool,
      images: images,
      tags: parsedTags,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    console.error('Create project error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create project',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Update project (admin only)
export const updateProject = async (req, res, next) => {
  try {
    const {
      title,
      description,
      shortDescription,
      faculty,
      status,
      location,
      targetAmount,
      currentAmount,
      progress,
      isFeatured,
      tags
    } = req.body;

    const updates = {};
    if (title) updates.title = title;
    if (description) updates.description = description;
    if (shortDescription !== undefined) updates.shortDescription = shortDescription;
    if (faculty) updates.faculty = faculty;
    if (status) updates.status = status;
    if (location) {
      // Parse location if it's a JSON string
      try {
        updates.location = typeof location === 'string' ? JSON.parse(location) : location;
      } catch (parseError) {
        console.warn('Failed to parse location in update:', parseError);
        updates.location = typeof location === 'string' ? {} : location;
      }
    }
    if (targetAmount !== undefined) updates.targetAmount = parseFloat(targetAmount);
    if (currentAmount !== undefined) updates.currentAmount = parseFloat(currentAmount);
    if (progress !== undefined) updates.progress = parseInt(progress);
    if (isFeatured !== undefined) {
      // Parse isFeatured if it's a string
      updates.isFeatured = isFeatured === 'true' || isFeatured === true || isFeatured === '1';
    }

    // Parse tags (optional)
    if (tags !== undefined) {
      try {
        const parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
        if (Array.isArray(parsedTags)) {
          updates.tags = parsedTags;
        }
      } catch (parseError) {
        console.warn('Failed to parse tags in update, ignoring tags field:', parseError);
      }
    }

    // Handle photo upload
    if (req.file) {
      try {
        const supabaseAdmin = getSupabaseAdmin();
        const ext = (req.file.originalname || '')
          .toLowerCase()
          .split('.')
          .pop() || 'jpg';

        const id = crypto.randomUUID
          ? crypto.randomUUID()
          : crypto.randomBytes(16).toString('hex');

        const objectPath = `dar-al-hikma/projects/${id}.${ext}`;

        const { error } = await supabaseAdmin.storage
          .from(SUPABASE_MEDIA_BUCKET)
          .upload(objectPath, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: false
          });

        if (error) throw error;

        const photoUrl = getPublicObjectUrl(SUPABASE_MEDIA_BUCKET, objectPath);

        // Get existing project to merge images
        const existing = await Project.findById(req.params.id);
        const existingImages = existing?.images || [];

        // Normalise existing images: can be array of strings or objects
        const normalisedExisting = existingImages.map((img) =>
          typeof img === 'string' ? { url: img } : img
        );

        const newImage = { url: photoUrl };

        // Add new photo to images array (prepend it, avoid duplicates)
        updates.images = [
          newImage,
          ...normalisedExisting.filter((img) => img.url !== photoUrl)
        ];
      } catch (uploadError) {
        console.error('Photo upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Photo upload failed: ' + uploadError.message
        });
      }
    }

    // If target/current changed but progress not explicitly provided, recalculate progress
    if (updates.progress === undefined && (updates.targetAmount !== undefined || updates.currentAmount !== undefined)) {
      const existing = await Project.findById(req.params.id);
      if (existing) {
        const nextTarget = updates.targetAmount !== undefined ? parseFloat(updates.targetAmount || 0) : parseFloat(existing.targetAmount || 0);
        const nextCurrent = updates.currentAmount !== undefined ? parseFloat(updates.currentAmount || 0) : parseFloat(existing.currentAmount || 0);
        if (nextTarget > 0) {
          updates.progress = Math.min(100, Math.max(0, Math.round((nextCurrent / nextTarget) * 100)));
        }
      }
    }

    const project = await Project.findByIdAndUpdate(req.params.id, updates);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Fetch updated project
    const updatedProject = await Project.findById(req.params.id);

    res.json({
      success: true,
      message: 'Project updated successfully',
      project: updatedProject
    });
  } catch (error) {
    console.error('Update project error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update project',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Delete project (admin only)
export const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Add media to project (admin only)
export const addProjectMedia = async (req, res, next) => {
  try {
    const { type, url, publicId, caption } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (type === 'image') {
      project.images.push({ url, publicId, caption });
    } else if (type === 'video') {
      project.videos.push({ url, publicId, caption });
    }

    await project.save();

    res.json({
      success: true,
      project
    });
  } catch (error) {
    next(error);
  }
};

