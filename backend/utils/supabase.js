import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const SUPABASE_MEDIA_BUCKET = process.env.SUPABASE_MEDIA_BUCKET || 'media';

/** About Us member photos - separate bucket, do NOT use generic media */
export const ABOUT_US_MEDIA_BUCKET = 'about-us-media';

/** Audit report PDFs - separate bucket, do NOT use generic media */
export const AUDIT_REPORTS_BUCKET = 'audit-reports';

let _client = null;

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && serviceRoleKey);
}

export function getSupabaseAdmin() {
  // IMPORTANT: do not crash the server if env vars aren't set.
  // Controllers can respond with a clear error when a storage action is attempted.
  if (!isSupabaseConfigured()) {
    const err = new Error(
      'Supabase Storage is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend .env'
    );
    err.code = 'SUPABASE_NOT_CONFIGURED';
    throw err;
  }
  if (_client) return _client;
  _client = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return _client;
}

export function getPublicObjectUrl(bucket, objectPath) {
  if (!supabaseUrl) return null;
  if (!bucket || !objectPath) return null;
  return `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${bucket}/${objectPath}`;
}

/**
 * Get public URL using Supabase client (preferred for new buckets)
 * Returns full https URL - store this in DB, never store file objects or local paths
 */
export function getPublicUrlForBucket(bucket, objectPath) {
  if (!bucket || !objectPath) return null;
  try {
    const client = getSupabaseAdmin();
    const result = client.storage.from(bucket).getPublicUrl(objectPath);
    const url = result?.data?.publicUrl || result?.publicUrl || null;
    if (url && String(url).startsWith('http')) return url.trim();
  } catch (e) {
    console.error('[Supabase] getPublicUrl error:', e.message);
  }
  return getPublicObjectUrl(bucket, objectPath);
}

export function extractPublicObjectPathFromUrl(url) {
  // Expected: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
  if (!url || typeof url !== 'string') return null;
  const idx = url.indexOf('/storage/v1/object/public/');
  if (idx === -1) return null;
  const rest = url.slice(idx + '/storage/v1/object/public/'.length);
  const [bucket, ...pathParts] = rest.split('/');
  const objectPath = pathParts.join('/');
  if (!bucket || !objectPath) return null;
  return { bucket, objectPath };
}

