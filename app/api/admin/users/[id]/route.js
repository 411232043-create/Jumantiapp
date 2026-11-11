import { NextResponse } from 'next/server';
import { adminAuth, adminDb, FieldValue } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';

export async function PATCH(request, { params }) {
  const admin = await getSessionUser();
  if (!admin || admin.id_role !== 'admin') {
    return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
  }
  try {
    const { id } = await params;
    const body = await request.json();
    const updates = {};
    if (body.nama !== undefined) updates.nama = body.nama;
    if (body.no_hp !== undefined) updates.no_hp = body.no_hp;
    if (body.alamat !== undefined) updates.alamat = body.alamat;
    if (body.id_divisi !== undefined) updates.id_divisi = body.id_divisi;
    if (body.role !== undefined && ['admin', 'kader', 'kepala_divisi'].includes(body.role)) updates.id_role = body.role;
    if (body.status !== undefined && ['aktif', 'nonaktif'].includes(body.status)) updates.status = body.status;
    updates.updated_at = FieldValue.serverTimestamp();
    await adminDb().collection('users').doc(id).update(updates);

    const authUpdates = {};
    if (body.nama) authUpdates.displayName = body.nama;
    if (body.status) authUpdates.disabled = body.status === 'nonaktif';
    if (body.password) authUpdates.password = body.password;
    if (Object.keys(authUpdates).length) await adminAuth().updateUser(id, authUpdates);
    if (body.status === 'nonaktif') await adminAuth().revokeRefreshTokens(id);

    await adminDb().collection('audit_log').add({
      id_user: admin.uid, nama_pengguna: admin.nama, aksi: 'update_user', entitas: 'users',
      id_entitas: id, detail: `Mengubah data pengguna`, created_at: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
