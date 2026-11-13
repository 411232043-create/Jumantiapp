/**
 * Provisioning bucket Supabase Storage untuk foto pemeriksaan SI-JUMANTIK.
 * Jalankan: node scripts/provision-supabase.mjs
 * Idempotent — aman dijalankan berulang.
 *
 * Butuh di .env:
 *   SUPABASE_URL=https://xxxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
 *   SUPABASE_BUCKET=foto-pemeriksaan   (opsional, default 'foto-pemeriksaan')
 */
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env' });

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_BUCKET || 'foto-pemeriksaan';

if (!url || !key) {
  console.error('ERROR: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum diatur di .env');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const { data: buckets, error } = await supabase.storage.listBuckets();
if (error) {
  console.error('Gagal membaca daftar bucket:', error.message);
  process.exit(1);
}

const existing = buckets.find((b) => b.name === bucket);
if (existing) {
  if (!existing.public) {
    const { error: upErr } = await supabase.storage.updateBucket(bucket, { public: true });
    if (upErr) console.error('Gagal menjadikan bucket public:', upErr.message);
    else console.log(`✓ Bucket "${bucket}" diubah menjadi public`);
  } else {
    console.log(`✓ Bucket "${bucket}" sudah ada (public)`);
  }
} else {
  const { error: cErr } = await supabase.storage.createBucket(bucket, {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png'],
  });
  if (cErr) {
    console.error('Gagal membuat bucket:', cErr.message);
    process.exit(1);
  }
  console.log(`✓ Bucket "${bucket}" dibuat (public, max 5MB, JPG/PNG)`);
}
console.log('Provisioning Supabase Storage selesai.');
