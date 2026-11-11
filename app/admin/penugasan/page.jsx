'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/DataTable';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Field } from '@/components/ui/Field';
import { PageLoader, Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { listPenugasan, listUsersByRole, listWilayah, tugaskanKader, nonaktifkanPenugasan } from '@/services/firestore';
import { formatDate } from '@/lib/utils';
import { Plus, Power } from 'lucide-react';

export default function PenugasanPage() {
  const [items, setItems] = useState(null);
  const [kaders, setKaders] = useState([]);
  const [wilayah, setWilayah] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ id_user: '', id_wilayah: '' });
  const [saving, setSaving] = useState(false);
  const [off, setOff] = useState(null);
  const [working, setWorking] = useState(false);
  const toast = useToast();

  const load = () => Promise.all([listPenugasan(), listUsersByRole('kader'), listWilayah()])
    .then(([p, k, w]) => { setItems(p); setKaders(k.filter((x) => x.status === 'aktif')); setWilayah(w); })
    .catch((e) => toast.error(e.message));
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.id_user || !form.id_wilayah) return;
    setSaving(true);
    try {
      const kader = kaders.find((k) => k.id === form.id_user);
      const wil = wilayah.find((w) => w.id === form.id_wilayah);
      await tugaskanKader({ id_user: kader.id, id_wilayah: wil.id, nama_kader: kader.nama, nama_wilayah: wil.nama_wilayah });
      toast.success('Kader berhasil ditugaskan.');
      setModal(false); setForm({ id_user: '', id_wilayah: '' });
      load();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  const doOff = async () => {
    setWorking(true);
    try {
      await nonaktifkanPenugasan(off);
      toast.success('Penugasan dinonaktifkan.');
      setOff(null); load();
    } catch (e) { toast.error(e.message); } finally { setWorking(false); }
  };

  if (!items) return <PageLoader />;

  return (
    <div>
      <PageHeader title="Penugasan Kader" subtitle="Tentukan wilayah kerja setiap kader"
        action={<button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={16} /> Tambah Penugasan</button>} />
      <Card className="p-5" hover={false}>
        <DataTable data={items} searchKeys={['nama_kader', 'nama_wilayah']} searchPlaceholder="Cari kader / wilayah..."
          columns={[
            { key: 'nama_kader', label: 'Kader' },
            { key: 'nama_wilayah', label: 'Wilayah' },
            { key: 'tanggal_mulai', label: 'Mulai', render: (r) => formatDate(r.tanggal_mulai) },
            { key: 'tanggal_selesai', label: 'Selesai', render: (r) => r.tanggal_selesai ? formatDate(r.tanggal_selesai) : '-' },
            { key: 'status', label: 'Status', render: (r) => <Badge variant={r.status === 'aktif' ? 'badge-aktif' : 'badge-nonaktif'}>{r.status === 'aktif' ? 'Aktif' : 'Nonaktif'}</Badge> },
            { key: 'aksi', label: 'Aksi', render: (r) => r.status === 'aktif' && (
              <button className="btn btn-ghost !p-2 text-rose-300" title="Nonaktifkan" onClick={() => setOff(r)}><Power size={14} /></button>
            )},
          ]} />
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title="Tambah Penugasan Kader">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Kader" required>
            <select className="select" required value={form.id_user} onChange={(e) => setForm({ ...form, id_user: e.target.value })}>
              <option value="">— Pilih Kader —</option>
              {kaders.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
            </select>
          </Field>
          <Field label="Wilayah" required>
            <select className="select" required value={form.id_wilayah} onChange={(e) => setForm({ ...form, id_wilayah: e.target.value })}>
              <option value="">— Pilih Wilayah —</option>
              {wilayah.map((w) => <option key={w.id} value={w.id}>{w.nama_wilayah}</option>)}
            </select>
          </Field>
          <p className="text-xs text-muted">Satu wilayah dapat memiliki beberapa kader, dan satu kader dapat ditugaskan ke beberapa wilayah.</p>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Batal</button>
            <button className="btn btn-primary" disabled={saving}>{saving && <Spinner size={14} />} Tugaskan</button>
          </div>
        </form>
      </Modal>

      <ConfirmModal open={!!off} onClose={() => setOff(null)} onConfirm={doOff} loading={working} danger
        title="Nonaktifkan Penugasan" message={`Nonaktifkan penugasan ${off?.nama_kader} di ${off?.nama_wilayah}?`} />
    </div>
  );
}
