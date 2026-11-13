'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/client';
import { useToast } from '@/components/ui/Toast';
import { Spinner } from '@/components/ui/Spinner';
import { Bug, Mail, Lock, LogIn } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const toast = useToast();
  const router = useRouter();

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const idToken = await cred.user.getIdToken();
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membuat sesi.');
      router.replace(data.home || '/');
    } catch (err) {
      const msg = {
        'auth/invalid-credential': 'Email atau password salah.',
        'auth/user-not-found': 'Email atau password salah.',
        'auth/wrong-password': 'Email atau password salah.',
        'auth/user-disabled': 'Akun Anda dinonaktifkan. Hubungi admin.',
        'auth/too-many-requests': 'Terlalu banyak percobaan. Coba lagi nanti.',
        'auth/invalid-email': 'Format email tidak valid.',
      }[err.code] || err.message;
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const onReset = async (e) => {
    e.preventDefault();
    if (!email.trim()) return toast.error('Masukkan email Anda terlebih dahulu.');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      toast.success('Tautan reset password telah dikirim ke email Anda.');
      setResetMode(false);
    } catch (err) {
      toast.error(err.code === 'auth/user-not-found' ? 'Email tidak terdaftar.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      <div className="app-bg" />
      <div className="orb orb-a" /><div className="orb orb-b" /><div className="orb orb-c" />

      <div className="fixed top-4 right-4 z-50"><ThemeToggle /></div>

      <div className="glass-card accent card-3d w-full max-w-md p-8 sm:p-10">
        <div className="flex flex-col items-center mb-8">
          <div className="glow-icon !p-4 !rounded-2xl mb-4"
            style={{ boxShadow: '0 0 40px rgba(163,230,53,.35), inset 0 1px 0 rgba(255,255,255,.15)' }}>
            <Bug size={34} />
          </div>
          <h1 className="text-2xl font-extrabold gradient-text">SI-JUMANTIK</h1>
          <p className="text-xs text-muted mt-1 text-center">Sistem Informasi Pemantauan Jentik Nyamuk</p>
        </div>

        {!resetMode ? (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input type="email" required className="input !pl-10" placeholder="nama@email.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input type="password" required className="input !pl-10" placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-full !py-3" disabled={loading}>
              {loading ? <Spinner size={16} /> : <LogIn size={16} />} Masuk
            </button>
            <button type="button" onClick={() => setResetMode(true)}
              className="w-full text-center text-xs text-muted hover:text-lime-300 transition">
              Lupa password? Reset via email
            </button>
          </form>
        ) : (
          <form onSubmit={onReset} className="space-y-4">
            <p className="text-sm text-muted">Masukkan email Anda. Kami akan mengirim tautan untuk mengatur ulang password.</p>
            <div>
              <label className="label">Email</label>
              <input type="email" required className="input" placeholder="nama@email.com"
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary w-full !py-3" disabled={loading}>
              {loading ? <Spinner size={16} /> : 'Kirim Tautan Reset'}
            </button>
            <button type="button" onClick={() => setResetMode(false)}
              className="w-full text-center text-xs text-muted hover:text-lime-300 transition">
              Kembali ke login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
