'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { getDocById } from '@/services/firestore';

export function useCurrentUser() {
  const [user, setUser] = useState(undefined);
  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (!u) return setUser(null);
      const doc = await getDocById('users', u.uid).catch(() => null);
      setUser(doc ? { uid: u.uid, ...doc } : null);
    });
  }, []);
  return user;
}
