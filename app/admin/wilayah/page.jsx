'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { DataTable } from '@/components/DataTable';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Field } from '@/components/ui/Field';
import { PageLoader, Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { db, listWilayah, createDoc, updateDocById, deleteDoc, doc, listPenugasan, listRumahWilayah } from '@/services/firestore';
import { formatDate } from '@/lib/utils';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const KOSONG = { nama_wilayah: '', kecamatan: '', kelurahan: '', rt: '', rw: '', keterangan: '' };

export default function WilayahPage() {
  const [items, setItems] = useState(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(KOSONG);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();

  const load = () => listWilayah().then(setItems).catch((e) => toast.error(e.message));
  useEffect(() => { load(); }, []);

  const openEdit = (r) => { setForm({ ...KOSONG, ...r }); setEditId(r.id); setModal(true); };
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { nama_wilayah: form.nama_wilayah, kecamatan: form.kecamatan, kelurahan: form.kelurahan, rt: form.rt, rw: form.rw, keterangan: form.keterangan };
      if (editId) await updateDocById('wilayah', editId, payload);
      else await createDoc('wilayah', { ...payload, id_divisi: form.id_divisi || null });
      toast.success(editId ? 'Wilayah diperbarui.' : 'Wilayah ditambahkan.');
      setModal(false); setEditId(null); setForm(KOSONG);
      load();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  const doDelete = async () => {
    setDeleting(true);
    try {
      const [tugas, rumah] = await Promise.all([listPenugasan(), listRumahWilayah(del.id)]);
      if (tugas.some((t) => t.id_wilayah === del.id && t.status === 'aktif')) {
        throw new Error('Wilayah masih memiliki penugasan kader aktif.');
      }
      if (rumah.length) throw new Error('Wilayah masih memiliki data rumah. Hapus rumah terlebih dahulu.');
      await deleteDoc(doc(db, 'wilayah', del.id));
      toast.success('Wilayah dihapus.');
      setDel(null); load();
    } catch (err) { toast.error(err.message); } finally { setDeleting(false); }
  };

  if (!items) return <PageLoader />;

  return (
    <div>
      <PageHeader title="Manajemen Wilayah" subtitle="Kelola wilayah kerja pemantauan jentik"
        action={<button className="btn btn-primary" onClick={() => { setForm(KOSONG); setEditId(null); setModal(true); }}><Plus size={16} /> Tambah Wilayah</button>} />
      <Card className="p-5" hover={false}>
        <DataTable data={items} searchKeys={['nama_wilayah', 'kecamatan', 'kelurahan']} searchPlaceholder="Cari wilayah..."
          columns={[
            { key: 'nama_wilayah', label: 'Nama Wilayah' },
            { key: 'kecamatan', label: 'Kecamatan' },
            { key: 'kelurahan', label: 'Kelurahan' },
            { key: 'rt_rw', label: 'RT/RW', render: (r) => `${r.rt || '-'} / ${r.rw || '-'}` },
            { key: 'keterangan', label: 'Keterangan', render: (r) => r.keterangan || '-' },
            { key: 'created_at', label: 'Dibuat', render: (r) => formatDate(r.created_at) },
            { key: 'aksi', label: 'Aksi', render: (r) => (
              <div className="flex gap-1">
                <button className="btn btn-ghost !p-2" onClick={() => openEdit(r)}><Pencil size={14} /></button>
                <button className="btn btn-ghost !p-2 text-rose-300" onClick={() => setDel(r)}><Trash2 size={14} /></button>
              </div>
            )},
          ]} />
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Wilayah' : 'Tambah Wilayah'}>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Nama Wilayah" required><input className="input" required value={form.nama_wilayah} onChange={set('nama_wilayah')} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Kecamatan"><input className="input" value={form.kecamatan} onChange={set('kecamatan')} /></Field>
            <Field label="Kelurahan"><input className="input" value={form.kelurahan} onChange={set('kelurahan')} /></Field>
            <Field label="RT"><input className="input" value={form.rt} onChange={set('rt')} /></Field>
            <Field label="RW"><input className="input" value={form.rw} onChange={set('rw')} /></Field>
          </div>
          <Field label="Keterangan"><textarea className="textarea" rows={2} value={form.keterangan || ''} onChange={set('keterangan')} /></Field>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Batal</button>
            <button className="btn btn-primary" disabled={saving}>{saving && <Spinner size={14} />} Simpan</button>
          </div>
        </form>
      </Modal>

      <ConfirmModal open={!!del} onClose={() => setDel(null)} onConfirm={doDelete} loading={deleting} danger
        title="Hapus Wilayah" message={`Hapus wilayah ${del?.nama_wilayah}? Tindakan ini tidak dapat dibatalkan.`} />
    </div>
  );
}
