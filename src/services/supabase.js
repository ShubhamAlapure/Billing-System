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

  // Pre-configured default project credentials
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
