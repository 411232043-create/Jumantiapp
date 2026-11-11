'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { DataTable } from '@/components/DataTable';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Field } from '@/components/ui/Field';
import { PageLoader, Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { db, listWarga, createDoc, updateDocById, deleteDoc, doc, listRumah } from '@/services/firestore';
import { formatDate } from '@/lib/utils';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const KOSONG = { nama: '', no_hp: '', keterangan: '' };

export default function WargaPage() {
  const [items, setItems] = useState(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(KOSONG);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();

  const load = () => listWarga().then(setItems).catch((e) => toast.error(e.message));
  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { nama: form.nama, no_hp: form.no_hp, keterangan: form.keterangan };
      if (editId) await updateDocById('warga', editId, payload);
      else await createDoc('warga', payload);
      toast.success(editId ? 'Data warga diperbarui.' : 'Data warga ditambahkan.');
      setModal(false); setEditId(null); setForm(KOSONG); load();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  const doDelete = async () => {
    setDeleting(true);
    try {
      const rumah = await listRumah();
      if (rumah.some((r) => r.id_warga === del.id)) throw new Error('Warga masih terhubung dengan data rumah.');
      await deleteDoc(doc(db, 'warga', del.id));
      toast.success('Data warga dihapus.'); setDel(null); load();
    } catch (err) { toast.error(err.message); } finally { setDeleting(false); }
  };

  if (!items) return <PageLoader />;

  return (
    <div>
      <PageHeader title="Data Warga" subtitle="Data pemilik rumah yang dipantau"
        action={<button className="btn btn-primary" onClick={() => { setForm(KOSONG); setEditId(null); setModal(true); }}><Plus size={16} /> Tambah Warga</button>} />
      <Card className="p-5" hover={false}>
        <DataTable data={items} searchKeys={['nama', 'no_hp']} searchPlaceholder="Cari warga..."
          columns={[
            { key: 'nama', label: 'Nama Pemilik Rumah' },
            { key: 'no_hp', label: 'Telepon', render: (r) => r.no_hp || '-' },
            { key: 'keterangan', label: 'Keterangan', render: (r) => r.keterangan || '-' },
            { key: 'created_at', label: 'Dibuat', render: (r) => formatDate(r.created_at) },
            { key: 'aksi', label: 'Aksi', render: (r) => (
              <div className="flex gap-1">
                <button className="btn btn-ghost !p-2" onClick={() => { setForm({ ...KOSONG, ...r }); setEditId(r.id); setModal(true); }}><Pencil size={14} /></button>
                <button className="btn btn-ghost !p-2 text-rose-300" onClick={() => setDel(r)}><Trash2 size={14} /></button>
              </div>
            )},
          ]} />
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Warga' : 'Tambah Warga'}>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Nama Pemilik Rumah" required><input className="input" required value={form.nama} onChange={set('nama')} /></Field>
          <Field label="Nomor Telepon (opsional)"><input className="input" value={form.no_hp} onChange={set('no_hp')} /></Field>
          <Field label="Keterangan"><textarea className="textarea" rows={2} value={form.keterangan || ''} onChange={set('keterangan')} /></Field>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Batal</button>
            <button className="btn btn-primary" disabled={saving}>{saving && <Spinner size={14} />} Simpan</button>
          </div>
        </form>
      </Modal>
      <ConfirmModal open={!!del} onClose={() => setDel(null)} onConfirm={doDelete} loading={deleting} danger
        title="Hapus Warga" message={`Hapus data warga ${del?.nama}?`} />
    </div>
  );
}
