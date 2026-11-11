import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { SESSION_COOKIE, ROLE_COOKIE, roleHome } from '@/lib/auth/session';

const FIVE_DAYS = 5 * 24 * 60 * 60 * 1000;

export async function POST(request) {
  try {
    const { idToken } = await request.json();
    if (!idToken) return NextResponse.json({ error: 'Token tidak valid.' }, { status: 400 });

    const decoded = await adminAuth().verifyIdToken(idToken);
    const userSnap = await adminDb().collection('users').doc(decoded.uid).get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: 'Profil pengguna tidak ditemukan. Hubungi admin.' }, { status: 403 });
    }
    const user = userSnap.data();
    if (user.status === 'nonaktif') {
      return NextResponse.json({ error: 'Akun Anda dinonaktifkan. Hubungi admin.' }, { status: 403 });
    }

    const sessionCookie = await adminAuth().createSessionCookie(idToken, { expiresIn: FIVE_DAYS });
    const res = NextResponse.json({ ok: true, home: roleHome(user.id_role) });
    const opts = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: FIVE_DAYS / 1000 };
    res.cookies.set(SESSION_COOKIE, sessionCookie, opts);
    res.cookies.set(ROLE_COOKIE, user.id_role, { ...opts, httpOnly: false });
    return res;
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Gagal membuat sesi.' }, { status: 401 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
  res.cookies.set(ROLE_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}
