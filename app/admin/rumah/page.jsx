'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { DataTable } from '@/components/DataTable';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Field } from '@/components/ui/Field';
import { PageLoader, Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { db, listRumah, listWilayah, listWarga, listDocs, createDoc, updateDocById, deleteDoc, doc, where } from '@/services/firestore';
import { formatDate } from '@/lib/utils';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const KOSONG = { id_wilayah: '', id_warga: '', alamat: '', rt: '', rw: '', keterangan: '' };

export default function RumahPage() {
  const [items, setItems] = useState(null);
  const [wilayah, setWilayah] = useState([]);
  const [warga, setWarga] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(KOSONG);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();

  const load = () => Promise.all([listRumah(), listWilayah(), listWarga()])
    .then(([r, w, wg]) => { setItems(r); setWilayah(w); setWarga(wg); })
    .catch((e) => toast.error(e.message));
  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const w = warga.find((x) => x.id === form.id_warga);
      const payload = {
        id_wilayah: form.id_wilayah, id_warga: form.id_warga, nama_warga: w?.nama || '',
        alamat: form.alamat, rt: form.rt, rw: form.rw, keterangan: form.keterangan,
      };
      if (editId) await updateDocById('rumah', editId, payload);
      else await createDoc('rumah', payload);
      toast.success(editId ? 'Data rumah diperbarui.' : 'Data rumah ditambahkan.');
      setModal(false); setEditId(null); setForm(KOSONG); load();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  const doDelete = async () => {
    setDeleting(true);
    try {
      const p = await listDocs('pemeriksaan', where('id_rumah', '==', del.id));
      if (p.length) throw new Error('Rumah memiliki riwayat pemeriksaan dan tidak dapat dihapus.');
      await deleteDoc(doc(db, 'rumah', del.id));
      toast.success('Data rumah dihapus.'); setDel(null); load();
    } catch (err) { toast.error(err.message); } finally { setDeleting(false); }
  };

  if (!items) return <PageLoader />;

  const wNama = (id) => wilayah.find((w) => w.id === id)?.nama_wilayah || '-';

  return (
    <div>
      <PageHeader title="Data Rumah" subtitle="Kelola data rumah warga yang dipantau"
        action={<button className="btn btn-primary" onClick={() => { setForm(KOSONG); setEditId(null); setModal(true); }}><Plus size={16} /> Tambah Rumah</button>} />
      <Card className="p-5" hover={false}>
        <DataTable data={items} searchKeys={['nama_warga', 'alamat']} searchPlaceholder="Cari warga / alamat..."
          columns={[
            { key: 'nama_warga', label: 'Pemilik Rumah' },
            { key: 'alamat', label: 'Alamat' },
            { key: 'rt_rw', label: 'RT/RW', render: (r) => `${r.rt || '-'} / ${r.rw || '-'}` },
            { key: 'id_wilayah', label: 'Wilayah', render: (r) => wNama(r.id_wilayah) },
            { key: 'created_at', label: 'Dibuat', render: (r) => formatDate(r.created_at) },
            { key: 'aksi', label: 'Aksi', render: (r) => (
              <div className="flex gap-1">
                <button className="btn btn-ghost !p-2" onClick={() => { setForm({ ...KOSONG, ...r }); setEditId(r.id); setModal(true); }}><Pencil size={14} /></button>
                <button className="btn btn-ghost !p-2 text-rose-300" onClick={() => setDel(r)}><Trash2 size={14} /></button>
              </div>
            )},
          ]} />
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Rumah' : 'Tambah Rumah'}>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Pemilik Rumah (Warga)" required>
            <select className="select" required value={form.id_warga} onChange={set('id_warga')}>
              <option value="">— Pilih Warga —</option>
              {warga.map((w) => <option key={w.id} value={w.id}>{w.nama}</option>)}
            </select>
          </Field>
          <Field label="Wilayah" required>
            <select className="select" required value={form.id_wilayah} onChange={set('id_wilayah')}>
              <option value="">— Pilih Wilayah —</option>
              {wilayah.map((w) => <option key={w.id} value={w.id}>{w.nama_wilayah}</option>)}
            </select>
          </Field>
          <Field label="Alamat Lengkap" required><textarea className="textarea" rows={2} required value={form.alamat} onChange={set('alamat')} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="RT"><input className="input" value={form.rt} onChange={set('rt')} /></Field>
            <Field label="RW"><input className="input" value={form.rw} onChange={set('rw')} /></Field>
          </div>
          <Field label="Keterangan"><input className="input" value={form.keterangan || ''} onChange={set('keterangan')} /></Field>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Batal</button>
            <button className="btn btn-primary" disabled={saving}>{saving && <Spinner size={14} />} Simpan</button>
          </div>
        </form>
      </Modal>
      <ConfirmModal open={!!del} onClose={() => setDel(null)} onConfirm={doDelete} loading={deleting} danger
        title="Hapus Rumah" message={`Hapus rumah ${del?.nama_warga} di ${del?.alamat}?`} />
    </div>
  );
}
