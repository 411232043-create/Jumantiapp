'use client';

import { useState } from 'react';
import { Modal } from './ui/Modal';
import { Field } from './ui/Field';
import { useToast } from './ui/Toast';
import { Spinner } from './ui/Spinner';
import { ROLE_LABELS } from '@/lib/constants';

export function UserFormModal({ open, onClose, onSaved, editUser, defaultRole }) {
  const isEdit = !!editUser;
  const [form, setForm] = useState({ nama: '', email: '', password: '', no_hp: '', alamat: '', role: 'kader', status: 'aktif' });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const [prevKey, setPrevKey] = useState(null);
  const formKey = `${open}-${editUser?.id || 'new'}-${defaultRole || ''}`;
  if (formKey !== prevKey) {
    setPrevKey(formKey);
    if (open) {
      setForm(isEdit
        ? { nama: editUser.nama || '', email: editUser.email || '', password: '', no_hp: editUser.no_hp || '', alamat: editUser.alamat || '', role: editUser.id_role, status: editUser.status || 'aktif' }
        : { nama: '', email: '', password: '', no_hp: '', alamat: '', role: defaultRole || 'kader', status: 'aktif' });
    }
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(isEdit ? `/api/admin/users/${editUser.id}` : '/api/admin/users', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(isEdit ? 'Pengguna diperbarui.' : 'Pengguna baru berhasil dibuat.');
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Pengguna' : 'Tambah Pengguna'}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nama Lengkap" required><input className="input" required value={form.nama} onChange={set('nama')} /></Field>
        <Field label="Email" required>
          <input className="input" type="email" required value={form.email} onChange={set('email')} disabled={isEdit}
            hint={isEdit ? 'Email tidak dapat diubah.' : undefined} />
        </Field>
        <Field label={isEdit ? 'Password Baru (opsional)' : 'Password'} required={!isEdit}
          hint="Minimal 6 karakter. Kosongkan jika tidak ingin mengubah.">
          <input className="input" type="password" minLength={6} value={form.password} onChange={set('password')}
            required={!isEdit} placeholder={isEdit ? '••••••••' : ''} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nomor Telepon"><input className="input" value={form.no_hp} onChange={set('no_hp')} /></Field>
          <Field label="Role" required>
            <select className="select" value={form.role} onChange={set('role')}>
              {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Alamat"><textarea className="textarea" rows={2} value={form.alamat} onChange={set('alamat')} /></Field>
        {isEdit && (
          <Field label="Status Akun">
            <select className="select" value={form.status} onChange={set('status')}>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </Field>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Batal</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading && <Spinner size={14} />} {isEdit ? 'Simpan' : 'Buat Akun'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
