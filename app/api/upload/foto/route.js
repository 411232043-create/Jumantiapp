import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { supabaseAdmin, FOTO_BUCKET } from '@/lib/supabase/server';

const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png'];
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sesi tidak valid. Silakan login ulang.' }, { status: 401 });

  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'File tidak ditemukan.' }, { status: 400 });
    }
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: 'Hanya JPG/JPEG/PNG yang diperbolehkan.' }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Ukuran maksimal 5 MB.' }, { status: 400 });
    }

    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `dokumentasi/${user.uid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const supabase = supabaseAdmin();
    const { error } = await supabase.storage
      .from(FOTO_BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: false });
    if (error) throw error;

    const { data } = supabase.storage.from(FOTO_BUCKET).getPublicUrl(path);
    return NextResponse.json({ path, url: data.publicUrl, nama_file: file.name });
  } catch (err) {
    console.error('Upload foto gagal:', err);
    return NextResponse.json({ error: err.message || 'Upload foto gagal.' }, { status: 500 });
  }
}
