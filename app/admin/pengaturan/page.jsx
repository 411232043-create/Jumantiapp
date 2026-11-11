'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Field } from '@/components/ui/Field';
import { PageLoader, Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { getDocById, setDoc, doc, db } from '@/services/firestore';
import { Save } from 'lucide-react';

export default function PengaturanPage() {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    getDocById('pengaturan', 'app').then((d) => setForm(d || {
      nama_aplikasi: 'SI-JUMANTIK', nama_divisi: '', alamat: '', telepon: '', periode_pemantauan_hari: 30,
    })).catch(() => setForm({ nama_aplikasi: 'SI-JUMANTIK', nama_divisi: '', alamat: '', telepon: '', periode_pemantauan_hari: 30 }));
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'pengaturan', 'app'), { ...form, updated_at: new Date() }, { merge: true });
      toast.success('Pengaturan disimpan.');
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  if (!form) return <PageLoader />;

  return (
    <div>
      <PageHeader title="Pengaturan Aplikasi" subtitle="Konfigurasi identitas dan parameter aplikasi" />
      <Card className="p-5 max-w-xl">
        <CardHeader title="Pengaturan Umum" />
        <form onSubmit={save} className="space-y-4">
          <Field label="Nama Aplikasi"><input className="input" value={form.nama_aplikasi || ''} onChange={set('nama_aplikasi')} /></Field>
          <Field label="Nama Divisi"><input className="input" value={form.nama_divisi || ''} onChange={set('nama_divisi')} /></Field>
          <Field label="Alamat"><textarea className="textarea" rows={2} value={form.alamat || ''} onChange={set('alamat')} /></Field>
          <Field label="Telepon"><input className="input" value={form.telepon || ''} onChange={set('telepon')} /></Field>
          <Field label="Periode Pemantauan (hari)" hint="Digunakan untuk menghitung rumah yang belum diperiksa pada dashboard kader.">
            <input type="number" min={1} className="input" value={form.periode_pemantauan_hari || 30} onChange={set('periode_pemantauan_hari')} />
          </Field>
          <button className="btn btn-primary" disabled={saving}>{saving ? <Spinner size={14} /> : <Save size={15} />} Simpan Pengaturan</button>
        </form>
      </Card>
    </div>
  );
}
