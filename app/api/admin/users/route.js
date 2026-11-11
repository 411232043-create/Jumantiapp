import { NextResponse } from 'next/server';
import { adminAuth, adminDb, FieldValue } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';

const VALID_ROLES = ['admin', 'kader', 'kepala_divisi'];

export async function POST(request) {
  const admin = await getSessionUser();
  if (!admin || admin.id_role !== 'admin') {
    return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
  }
  try {
    const { nama, email, password, no_hp, alamat, role, id_divisi } = await request.json();
    if (!nama || !email || !password || !VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Data tidak lengkap atau role tidak valid.' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password minimal 6 karakter.' }, { status: 400 });
    }
    const rec = await adminAuth().createUser({ email, password, displayName: nama });
    await adminDb().collection('users').doc(rec.uid).set({
      auth_user_id: rec.uid, id_role: role, id_divisi: id_divisi || admin.id_divisi || null,
      nama, email, no_hp: no_hp || '', alamat: alamat || '', status: 'aktif',
      wilayah_ids: [], created_at: FieldValue.serverTimestamp(), updated_at: FieldValue.serverTimestamp(),
    });
    await adminDb().collection('audit_log').add({
      id_user: admin.uid, nama_pengguna: admin.nama, aksi: 'create_user', entitas: 'users',
      id_entitas: rec.uid, detail: `Membuat akun ${nama} (${role})`, created_at: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true, uid: rec.uid });
  } catch (err) {
    const msg = err.code === 'auth/email-already-exists' ? 'Email sudah terdaftar.' : err.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
