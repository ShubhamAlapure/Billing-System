import { createClient } from '@supabase/supabase-js';

// Default Supabase Project for PARVATI BHANDI STORES
const DEFAULT_SUPABASE_URL = 'https://svxfcwfxsbggjwtltwlj.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_0az_8wnVdUGQyfMf_FHTyw_PG_2j8Yd';

const STORAGE_KEYS = {
  SUPABASE_URL: 'pbs_supabase_url',
  SUPABASE_KEY: 'pbs_supabase_key',
};

export const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (envUrl && envKey) {
    return { url: envUrl, key: envKey, source: 'env' };
  }

  const localUrl = localStorage.getItem(STORAGE_KEYS.SUPABASE_URL);
  const localKey = localStorage.getItem(STORAGE_KEYS.SUPABASE_KEY);

  if (localUrl && localKey) {
    return { url: localUrl, key: localKey, source: 'local' };
  }

  return {
    url: DEFAULT_SUPABASE_URL,
    key: DEFAULT_SUPABASE_KEY,
    source: 'default'
  };
};

export const saveSupabaseConfig = (url, key) => {
  if (!url || !key) {
    localStorage.removeItem(STORAGE_KEYS.SUPABASE_URL);
    localStorage.removeItem(STORAGE_KEYS.SUPABASE_KEY);
    return false;
  }
  localStorage.setItem(STORAGE_KEYS.SUPABASE_URL, url.trim());
  localStorage.setItem(STORAGE_KEYS.SUPABASE_KEY, key.trim());
  return true;
};

export const clearSupabaseConfig = () => {
  localStorage.removeItem(STORAGE_KEYS.SUPABASE_URL);
  localStorage.removeItem(STORAGE_KEYS.SUPABASE_KEY);
};

export const getSupabaseClient = () => {
  const config = getSupabaseConfig();
  if (!config) return null;

  try {
    return createClient(config.url, config.key, {
      auth: { persistSession: false },
    });
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    return null;
  }
};

// Upload bill photo directly to Supabase Storage and return public image URL
export const uploadBillPhoto = async (canvas, fileName) => {
  try {
    const imageBase64 = canvas.toDataURL('image/jpeg', 0.95);
    const cleanBase = (fileName || 'bill').replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.jpe?g$/i, '');

    // 1. Try server endpoint /api/upload-bill (works on Vercel and local Express)
    try {
      const response = await fetch('/api/upload-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          fileName: cleanBase,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.publicUrl) {
          return result.publicUrl;
        }
      }
    } catch (apiErr) {
      console.warn('Backend upload api failed, trying direct storage fallback:', apiErr);
    }

    // 2. Direct client fallback if environment service key exists
    const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;
    if (serviceKey) {
      const adminClient = createClient(DEFAULT_SUPABASE_URL, serviceKey, {
        auth: { persistSession: false },
      });

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
      if (!blob) return null;

      const uploadName = `${cleanBase}_${Date.now()}.jpg`;
      const { error } = await adminClient.storage
        .from('bills')
        .upload(uploadName, blob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (!error) {
        const { data: pubData } = adminClient.storage
          .from('bills')
          .getPublicUrl(uploadName);
        return pubData?.publicUrl || null;
      }
    }

    return null;
  } catch (err) {
    console.error('Failed to upload bill photo:', err);
    return null;
  }
};
