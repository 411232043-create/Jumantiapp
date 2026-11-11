import { cookies } from 'next/headers';
import { cache } from 'react';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export const SESSION_COOKIE = 'si_session';
export const ROLE_COOKIE = 'si_role';

export const getSessionUser = cache(async function getSessionUser() {
  try {
    const store = await cookies();
    const session = store.get(SESSION_COOKIE)?.value;
    if (!session) return null;
    const decoded = await adminAuth().verifySessionCookie(session, true);
    const snap = await adminDb().collection('users').doc(decoded.uid).get();
    if (!snap.exists) return null;
    const data = snap.data();
    if (data.status === 'nonaktif') return null;
    // serialisasi Timestamp agar aman dikirim ke Client Components
    const safe = {};
    for (const [k, v] of Object.entries(data)) {
      if (v && typeof v === 'object' && typeof v.toDate === 'function') safe[k] = v.toDate().toISOString();
      else if (v && typeof v === 'object' && '_seconds' in v) safe[k] = new Date(v._seconds * 1000).toISOString();
      else safe[k] = v;
    }
    return { uid: decoded.uid, ...safe };
  } catch {
    return null;
  }
});

export function roleHome(role) {
  if (role === 'admin') return '/admin';
  if (role === 'kepala_divisi') return '/kepala-divisi';
  return '/kader';
}
