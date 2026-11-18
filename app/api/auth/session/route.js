import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { SESSION_COOKIE, ROLE_COOKIE, roleHome } from '@/lib/auth/session';

const FIVE_DAYS = 5 * 24 * 60 * 60 * 1000;
const VALID_ROLES = new Set(['admin', 'kader', 'kepala_divisi']);
const INVALID_TOKEN_CODES = new Set([
  'auth/argument-error',
  'auth/id-token-expired',
  'auth/id-token-revoked',
  'auth/invalid-id-token',
]);

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Permintaan login tidak valid.' }, { status: 400 });
  }
  if (typeof body?.idToken !== 'string' || !body.idToken.trim()) {
    return NextResponse.json({ error: 'Token tidak valid.' }, { status: 400 });
  }

  try {
    const decoded = await adminAuth().verifyIdToken(body.idToken, true);
    const userSnap = await adminDb().collection('users').doc(decoded.uid).get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: 'Profil pengguna tidak ditemukan. Hubungi admin.' }, { status: 403 });
    }
    const user = userSnap.data();
    if (user.status !== 'aktif' || !VALID_ROLES.has(user.id_role)) {
      return NextResponse.json({ error: 'Akun Anda dinonaktifkan. Hubungi admin.' }, { status: 403 });
    }

    const sessionCookie = await adminAuth().createSessionCookie(body.idToken, { expiresIn: FIVE_DAYS });
    const res = NextResponse.json({ ok: true, home: roleHome(user.id_role) });
    const opts = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: FIVE_DAYS / 1000 };
    res.cookies.set(SESSION_COOKIE, sessionCookie, opts);
    res.cookies.set(ROLE_COOKIE, '', { ...opts, maxAge: 0 });
    return res;
  } catch (err) {
    const invalidToken = INVALID_TOKEN_CODES.has(err?.code);
    if (!invalidToken) console.error('Gagal membuat sesi Firebase:', err?.code || 'unknown');
    return NextResponse.json(
      { error: invalidToken ? 'Token tidak valid atau kedaluwarsa.' : 'Gagal membuat sesi. Periksa konfigurasi Firebase server.' },
      { status: invalidToken ? 401 : 500 },
    );
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
  res.cookies.set(ROLE_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}
