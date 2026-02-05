import pool from '../utils/db.js';
import {
  getSupabaseAdmin,
  ABOUT_US_MEDIA_BUCKET,
  AUDIT_REPORTS_BUCKET,
  getPublicUrlForBucket
} from '../utils/supabase.js';

/**
 * Get About Us content (public)
 */
export const getAboutUsContent = async (req, res, next) => {
  try {
    // Get sections
    const { rows: sections } = await pool.query(
      'SELECT section_type, title, description, content FROM about_us_sections'
    );

    // Get members (council, advisory, legal_financial)
    const { rows: members } = await pool.query(
      `SELECT id, member_type, name, role, description, photo, photo_url, display_order, visible
       FROM about_us_members
       WHERE visible = true
       ORDER BY member_type, display_order, name`
    );

    // Get audit reports
    const { rows: audits } = await pool.query(
      `SELECT id, title, fiscal_year, file_url, file_name, description, display_order
       FROM audit_reports
       WHERE visible = true
       ORDER BY display_order, fiscal_year DESC`
    );

    const sectionsMap = {};
    sections.forEach(section => {
      sectionsMap[section.section_type] = {
        title: section.title,
        description: section.description,
        content: section.content || {}
      };
    });

    const membersByType = {
      council: [],
      advisory: [],
      legal_financial: []
    };

    members.forEach(member => {
      if (membersByType[member.member_type]) {
        // Use photo_url only - must be full public URL from about-us-media bucket
        const photoUrl = member.photo_url && String(member.photo_url).trim().startsWith('http')
          ? member.photo_url.trim()
          : null;
        membersByType[member.member_type].push({
          id: member.id,
          name: member.name,
          role: member.role,
          description: member.description,
          photo: photoUrl
        });
      }
    });

    res.json({
      success: true,
      sections: sectionsMap,
      council: membersByType.council,
      advisory: membersByType.advisory,
      legalFinancial: membersByType.legal_financial,
      auditReports: audits.map(audit => {
        // Use file_url only - must be full public URL from audit-reports bucket
        const fileUrl = audit.file_url && String(audit.file_url).trim().startsWith('http')
          ? audit.file_url.trim()
          : null;
        return {
          id: audit.id,
          title: audit.title,
          fiscalYear: audit.fiscal_year,
          fileUrl,
          fileName: audit.file_name,
          description: audit.description
        };
      })
    });
  } catch (error) {
    console.error('Get About Us content error:', error);
    next(error);
  }
};

/**
 * Get About Us content (admin - full data)
 */
export const getAdminAboutUsContent = async (req, res, next) => {
  try {
    // Get sections
    const { rows: sections } = await pool.query(
      'SELECT section_type, title, description, content FROM about_us_sections'
    );

    // Get all members
    const { rows: members } = await pool.query(
      `SELECT id, member_type, name, role, description, photo, photo_url, display_order, visible, created_at, updated_at
       FROM about_us_members
       ORDER BY member_type, display_order, name`
    );

    // Get all audit reports
    const { rows: audits } = await pool.query(
      `SELECT id, title, fiscal_year, file_url, file_name, description, display_order, visible, created_at, updated_at
       FROM audit_reports
       ORDER BY display_order, fiscal_year DESC`
    );

    const sectionsMap = {};
    sections.forEach(section => {
      sectionsMap[section.section_type] = {
        title: section.title,
        description: section.description,
        content: section.content || {}
      };
    });

    res.json({
      success: true,
      sections: sectionsMap,
      members: members.map(m => {
        const photoUrl = m.photo_url && String(m.photo_url).trim().startsWith('http')
          ? m.photo_url.trim()
          : null;
        return {
          id: m.id,
          memberType: m.member_type,
          name: m.name,
          role: m.role,
          description: m.description,
          photo: photoUrl,
          displayOrder: m.display_order,
          visible: m.visible,
          createdAt: m.created_at,
          updatedAt: m.updated_at
        };
      }),
      auditReports: audits.map(a => {
        const fileUrl = a.file_url && String(a.file_url).trim().startsWith('http')
          ? a.file_url.trim()
          : null;
        return {
          id: a.id,
          title: a.title,
          fiscalYear: a.fiscal_year,
          fileUrl,
          fileName: a.file_name,
          description: a.description,
          displayOrder: a.display_order,
          visible: a.visible,
          createdAt: a.created_at,
          updatedAt: a.updated_at
        };
      })
    });
  } catch (error) {
    console.error('Get admin About Us content error:', error);
    next(error);
  }
};

/**
 * Upload section image to about-us-media (admin)
 */
export const uploadSectionImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }
    const supabaseAdmin = getSupabaseAdmin();
    const fileExt = (req.file.originalname.split('.').pop() || 'jpg').toLowerCase();
    const objectPath = `sections/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(ABOUT_US_MEDIA_BUCKET)
      .upload(objectPath, req.file.buffer, { contentType: req.file.mimetype, upsert: false });

    if (uploadError) {
      return res.status(500).json({ success: false, message: uploadError.message });
    }
    const url = getPublicUrlForBucket(ABOUT_US_MEDIA_BUCKET, objectPath);
    res.json({ success: true, url });
  } catch (error) {
    console.error('Upload section image error:', error);
    next(error);
  }
};

/**
 * Update About Us section (admin)
 */
export const updateAboutUsSection = async (req, res, next) => {
  try {
    const { sectionType, title, description, content } = req.body;

    if (!sectionType) {
      return res.status(400).json({ success: false, message: 'Section type is required' });
    }

    const { rows } = await pool.query(
      `INSERT INTO about_us_sections (section_type, title, description, content, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (section_type)
       DO UPDATE SET title = $2, description = $3, content = $4, updated_at = NOW()
       RETURNING section_type, title, description, content`,
      [sectionType, title || null, description || null, JSON.stringify(content || {})]
    );

    res.json({ success: true, section: rows[0] });
  } catch (error) {
    console.error('Update About Us section error:', error);
    next(error);
  }
};

/**
 * Create/Update About Us member (admin)
 */
export const upsertAboutUsMember = async (req, res, next) => {
  try {
    const id = req.params.id || req.body?.id;
    const memberType = req.body?.memberType;
    const name = req.body?.name;
    const role = req.body?.role;
    const description = req.body?.description;
    const photoUrl = req.body?.photoUrl;
    const displayOrder = Number(req.body?.displayOrder) || 0;
    const visible = req.body?.visible !== false && req.body?.visible !== 'false' && String(req.body?.visible).toLowerCase() !== 'false';

    if (!memberType || !name) {
      return res.status(400).json({ success: false, message: 'Member type and name are required' });
    }

    let photoUrlFinal = null;

    // Handle file upload - store in about-us-media bucket, save ONLY public URL
    if (req.file) {
      try {
        const supabaseAdmin = getSupabaseAdmin();
        const fileExt = (req.file.originalname.split('.').pop() || 'jpg').toLowerCase();
        const safeName = (req.file.originalname || 'photo').replace(/[^a-zA-Z0-9.-]/g, '_');
        const uuid = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const objectPath = `about-us/${uuid}/${safeName}`;

        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from(ABOUT_US_MEDIA_BUCKET)
          .upload(objectPath, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: true
          });

        if (uploadError) {
          console.error('[AboutUs] Photo upload error:', uploadError.message, { bucket: ABOUT_US_MEDIA_BUCKET, path: objectPath });
          return res.status(500).json({
            success: false,
            message: `Failed to upload photo: ${uploadError.message}. Ensure about-us-media bucket exists and has INSERT policy.`
          });
        }

        photoUrlFinal = getPublicUrlForBucket(ABOUT_US_MEDIA_BUCKET, objectPath);
        console.log('[AboutUs] Photo uploaded OK:', { path: objectPath, url: photoUrlFinal?.slice(0, 80) + '...' });
      } catch (uploadErr) {
        console.error('[AboutUs] Photo upload exception:', uploadErr);
        return res.status(500).json({
          success: false,
          message: uploadErr.message || 'Failed to upload photo'
        });
      }
    }

    // Use explicit URL from form if no file upload (e.g. edit with existing URL or paste URL)
    if (!photoUrlFinal && photoUrl && String(photoUrl).trim().startsWith('http')) {
      photoUrlFinal = photoUrl.trim();
    }

    // For updates without new upload, preserve existing photo_url
    if (id && !photoUrlFinal) {
      const { rows: existing } = await pool.query(
        'SELECT photo_url FROM about_us_members WHERE id = $1',
        [id]
      );
      if (existing.length > 0 && existing[0].photo_url) {
        photoUrlFinal = existing[0].photo_url;
      }
    }

    if (id) {
      const { rows } = await pool.query(
        `UPDATE about_us_members
         SET member_type = $1, name = $2, role = $3, description = $4,
             photo_url = $5, display_order = $6, visible = $7, updated_at = NOW()
         WHERE id = $8
         RETURNING id, member_type, name, role, description, photo_url, display_order, visible, created_at, updated_at`,
        [memberType, name, role || null, description || null, photoUrlFinal, displayOrder, visible, id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Member not found' });
      }

      const member = rows[0];
      console.log('[AboutUs] Member updated with photo_url:', member.photo_url ? 'yes' : 'no');
      res.json({ success: true, member: { ...member, photo: member.photo_url, photo_url: member.photo_url } });
    } else {
      const { rows } = await pool.query(
        `INSERT INTO about_us_members (member_type, name, role, description, photo_url, display_order, visible)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, member_type, name, role, description, photo_url, display_order, visible, created_at, updated_at`,
        [memberType, name, role || null, description || null, photoUrlFinal, displayOrder, visible]
      );

      const member = rows[0];
      console.log('[AboutUs] Member saved with photo_url:', member.photo_url ? 'yes' : 'no');
      res.status(201).json({ success: true, member: { ...member, photo: member.photo_url, photo_url: member.photo_url } });
    }
  } catch (error) {
    console.error('Upsert About Us member error:', error);
    next(error);
  }
};

/**
 * Delete About Us member (admin)
 */
export const deleteAboutUsMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM about_us_members WHERE id = $1', [id]);

    if (rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    res.json({ success: true, message: 'Member deleted successfully' });
  } catch (error) {
    console.error('Delete About Us member error:', error);
    next(error);
  }
};

/**
 * Create/Update audit report (admin)
 */
export const upsertAuditReport = async (req, res, next) => {
  try {
    const id = req.params.id || req.body?.id;
    const title = req.body?.title;
    const fiscalYear = req.body?.fiscalYear;
    const fileUrl = req.body?.fileUrl;
    const fileName = req.body?.fileName;
    const description = req.body?.description;
    const displayOrder = Number(req.body?.displayOrder) || 0;
    const visible = req.body?.visible !== false && req.body?.visible !== 'false' && String(req.body?.visible).toLowerCase() !== 'false';

    if (!title || !fiscalYear) {
      return res.status(400).json({ success: false, message: 'Title and fiscal year are required' });
    }

    let fileUrlFinal = null;

    // Handle file upload - store in audit-reports bucket, save ONLY public URL
    if (req.file) {
      try {
        const supabaseAdmin = getSupabaseAdmin();
        const fileExt = (req.file.originalname.split('.').pop() || 'pdf').toLowerCase();
        const safeFiscal = String(fiscalYear).replace(/[^a-zA-Z0-9-]/g, '_');
        let safeName = (req.file.originalname || `report.${fileExt}`).replace(/[^a-zA-Z0-9.-]/g, '_');
        if (!safeName.toLowerCase().endsWith(`.${fileExt}`)) safeName = `${safeName}.${fileExt}`;
        const objectPath = `audit/${safeFiscal}/${safeName}`;

        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from(AUDIT_REPORTS_BUCKET)
          .upload(objectPath, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: true
          });

        if (uploadError) {
          console.error('[Audit] PDF upload error:', uploadError.message, { bucket: AUDIT_REPORTS_BUCKET, path: objectPath });
          return res.status(500).json({
            success: false,
            message: `Failed to upload PDF: ${uploadError.message}. Ensure audit-reports bucket exists and has INSERT policy.`
          });
        }

        fileUrlFinal = getPublicUrlForBucket(AUDIT_REPORTS_BUCKET, objectPath);
        console.log('[Audit] PDF uploaded OK:', { path: objectPath, url: fileUrlFinal?.slice(0, 80) + '...' });
      } catch (uploadErr) {
        console.error('[Audit] PDF upload exception:', uploadErr);
        return res.status(500).json({
          success: false,
          message: uploadErr.message || 'Failed to upload audit report'
        });
      }
    }

    // Use explicit URL from form if no file upload
    if (!fileUrlFinal && fileUrl && String(fileUrl).trim().startsWith('http')) {
      fileUrlFinal = fileUrl.trim();
    }

    // For updates without new upload, preserve existing file_url
    if (id && !fileUrlFinal) {
      const { rows: existing } = await pool.query(
        'SELECT file_url FROM audit_reports WHERE id = $1',
        [id]
      );
      if (existing.length > 0 && existing[0].file_url) {
        fileUrlFinal = existing[0].file_url;
      }
    }

    if (id) {
      // Update existing
      const { rows } = await pool.query(
        `UPDATE audit_reports
         SET title = $1, fiscal_year = $2, file_url = $3, file_name = $4,
             description = $5, display_order = $6, visible = $7, updated_at = NOW()
         WHERE id = $8
         RETURNING id, title, fiscal_year, file_url, file_name, description, display_order, visible, created_at, updated_at`,
        [title, fiscalYear, fileUrlFinal, fileName || null, description || null, displayOrder, visible, id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Audit report not found' });
      }

      const audit = rows[0];
      console.log('[Audit] Report updated with file_url:', audit.file_url ? 'yes' : 'no');
      res.json({ success: true, auditReport: audit, file_url: audit.file_url });
    } else {
      // Create new
      const { rows } = await pool.query(
        `INSERT INTO audit_reports (title, fiscal_year, file_url, file_name, description, display_order, visible)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, title, fiscal_year, file_url, file_name, description, display_order, visible, created_at, updated_at`,
        [title, fiscalYear, fileUrlFinal, fileName || null, description || null, displayOrder, visible]
      );

      const audit = rows[0];
      console.log('[Audit] Report saved with file_url:', audit.file_url ? 'yes' : 'no');
      res.status(201).json({ success: true, auditReport: audit, file_url: audit.file_url });
    }
  } catch (error) {
    console.error('Upsert audit report error:', error);
    next(error);
  }
};

/**
 * Delete audit report (admin)
 */
export const deleteAuditReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM audit_reports WHERE id = $1', [id]);

    if (rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Audit report not found' });
    }

    res.json({ success: true, message: 'Audit report deleted successfully' });
  } catch (error) {
    console.error('Delete audit report error:', error);
    next(error);
  }
};
