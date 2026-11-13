import { createClient } from '@supabase/supabase-js';

let client;

/**
 * Supabase client dengan service role — HANYA untuk server (route handler/script).
 * Jangan pernah impor dari komponen client.
 */
export function supabaseAdmin() {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi di environment variables.');
  }
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

export const FOTO_BUCKET = process.env.SUPABASE_BUCKET || 'foto-pemeriksaan';
