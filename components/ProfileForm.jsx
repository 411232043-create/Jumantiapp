'use client';

import { useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Field } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { Spinner } from '@/components/ui/Spinner';
import { updateDocById, auditLog } from '@/services/firestore';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { ROLE_LABELS } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { Save, KeyRound } from 'lucide-react';

export function ProfileForm({ user }) {
  const [form, setForm] = useState({ nama: user.nama || '', no_hp: user.no_hp || '', alamat: user.alamat || '' });
  const [pw, setPw] = useState({ lama: '', baru: '', konfirmasi: '' });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const toast = useToast();

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateDocById('users', user.uid, form);
      await auditLog(user, 'update_profil', 'users', user.uid);
      toast.success('Profil berhasil diperbarui.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pw.baru.length < 6) return toast.error('Password baru minimal 6 karakter.');
    if (pw.baru !== pw.konfirmasi) return toast.error('Konfirmasi password tidak cocok.');
    setSavingPw(true);
    try {
      const cred = EmailAuthProvider.credential(auth.currentUser.email, pw.lama);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updatePassword(auth.currentUser, pw.baru);
      setPw({ lama: '', baru: '', konfirmasi: '' });
      toast.success('Password berhasil diubah.');
    } catch (err) {
      toast.error(err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
        ? 'Password lama salah.' : err.message);
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-4 max-w-4xl">
      <Card className="p-5">
        <CardHeader title="Data Profil" subtitle={ROLE_LABELS[user.id_role]} />
        <form onSubmit={saveProfile} className="space-y-4">
          <Field label="Nama Lengkap" required><input className="input" required value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} /></Field>
          <Field label="Email"><input className="input" value={user.email} disabled /></Field>
          <Field label="Nomor Telepon"><input className="input" value={form.no_hp} onChange={(e) => setForm({ ...form, no_hp: e.target.value })} /></Field>
          <Field label="Alamat"><textarea className="textarea" rows={3} value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} /></Field>
          <p className="text-xs text-muted">Terdaftar sejak {formatDate(user.created_at)}</p>
          <button className="btn btn-primary" disabled={saving}>{saving ? <Spinner size={14} /> : <Save size={15} />} Simpan Profil</button>
        </form>
      </Card>
      <Card className="p-5">
        <CardHeader title="Ubah Password" subtitle="Ganti password Anda secara berkala" />
        <form onSubmit={changePassword} className="space-y-4">
          <Field label="Password Lama" required><input type="password" className="input" required value={pw.lama} onChange={(e) => setPw({ ...pw, lama: e.target.value })} /></Field>
          <Field label="Password Baru" required hint="Minimal 6 karakter"><input type="password" className="input" required minLength={6} value={pw.baru} onChange={(e) => setPw({ ...pw, baru: e.target.value })} /></Field>
          <Field label="Konfirmasi Password Baru" required><input type="password" className="input" required value={pw.konfirmasi} onChange={(e) => setPw({ ...pw, konfirmasi: e.target.value })} /></Field>
          <button className="btn btn-primary" disabled={savingPw}>{savingPw ? <Spinner size={14} /> : <KeyRound size={15} />} Ubah Password</button>
        </form>
      </Card>
    </div>
  );
}
