'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Field } from '@/components/ui/Field';
import { PageLoader, Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { PhotoUploader } from '@/components/PhotoUploader';
import { useCurrentUser } from '@/lib/auth/useCurrentUser';
import { listDocs, listWilayahByIds, getDocById, simpanPemeriksaan, uploadFoto, updateDocById } from '@/services/firestore';
import { where } from 'firebase/firestore';
import { TPA_LIST, KONDISI_TPA, STATUS } from '@/lib/constants';
import { Save, Send, X, Plus, Trash2, Bug } from 'lucide-react';

const DETAIL_KOSONG = { nama_tempat_penampungan: 'Bak Mandi', kondisi: 'Baik', ditemukan_jentik: false, jumlah_wadah: 1, catatan: '' };

function FormInner() {
  const user = useCurrentUser();
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get('edit');
  const toast = useToast();

  const [rumah, setRumah] = useState([]);
  const [wilayahMap, setWilayahMap] = useState({});
  const [form, setForm] = useState({ id_rumah: '', tanggal: '', waktu: '', catatan: '', edukasi: '', tindakan: '', rekomendasi: '' });
  const [detail, setDetail] = useState([{ ...DETAIL_KOSONG }]);
  const [fotos, setFotos] = useState([]);
  const [saving, setSaving] = useState(null);
  const [statusLama, setStatusLama] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const wIds = user.wilayah_ids || [];
      const wilayah = await listWilayahByIds(wIds);
      setWilayahMap(Object.fromEntries(wilayah.map((w) => [w.id, w])));
      const r = wIds.length ? await listDocs('rumah', where('id_wilayah', 'in', wIds.slice(0, 30))) : [];
      setRumah(r);
      const now = new Date();
      setForm((f) => ({ ...f, tanggal: now.toISOString().slice(0, 10), waktu: now.toTimeString().slice(0, 5) }));

      if (editId) {
        const p = await getDocById('pemeriksaan', editId);
        if (p && p.id_kader === user.uid && [STATUS.DRAFT, STATUS.REVISION].includes(p.status)) {
          setStatusLama(p.status);
          setForm({
            id_rumah: p.id_rumah, tanggal: p.tanggal_pemeriksaan, waktu: p.waktu_pemeriksaan,
            catatan: p.catatan || '', edukasi: p.edukasi || '', tindakan: p.tindakan || '', rekomendasi: p.rekomendasi || '',
          });
          setDetail(p.detail?.length ? p.detail : [{ ...DETAIL_KOSONG }]);
          setFotos(p.fotos || []);
        } else {
          toast.error('Laporan tidak dapat diedit.');
          router.replace('/kader/riwayat');
        }
      }
      setLoading(false);
    })().catch((e) => { toast.error(e.message); setLoading(false); });
  }, [user, editId]);

  const rumahDipilih = rumah.find((r) => r.id === form.id_rumah);
  const wilayahDipilih = rumahDipilih ? wilayahMap[rumahDipilih.id_wilayah] : null;
  const positif = useMemo(() => detail.some((d) => d.ditemukan_jentik), [detail]);

  const updateDetail = (i, k, v) => setDetail((d) => d.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

  const validasi = () => {
    if (!form.id_rumah) return 'Pilih rumah yang diperiksa.';
    if (!form.tanggal || !form.waktu) return 'Tanggal dan waktu pemeriksaan wajib diisi.';
    if (!detail.length || detail.some((d) => !d.nama_tempat_penampungan)) return 'Minimal satu tempat penampungan air harus diperiksa.';
    return null;
  };

  const simpan = async (kirim) => {
    const err = validasi();
    if (err) return toast.error(err);
    setSaving(kirim ? 'kirim' : 'draft');
    try {
      // upload foto baru
      const uploaded = [];
      for (const f of fotos) {
        if (f.url) uploaded.push({ path: f.path, url: f.url, nama_file: f.nama_file });
        else if (f.file) uploaded.push(await uploadFoto(f.file, user.uid));
      }
      const payload = {
        id_rumah: form.id_rumah, id_kader: user.uid, nama_kader: user.nama,
        id_wilayah: rumahDipilih.id_wilayah, nama_wilayah: wilayahDipilih?.nama_wilayah || '-',
        id_divisi: user.id_divisi || wilayahDipilih?.id_divisi || null,
        nama_warga: rumahDipilih.nama_warga, alamat_rumah: rumahDipilih.alamat,
        tanggal_pemeriksaan: form.tanggal, waktu_pemeriksaan: form.waktu,
        detail: detail.map((d) => ({
          nama_tempat_penampungan: d.nama_tempat_penampungan,
          kondisi: d.kondisi, ditemukan_jentik: !!d.ditemukan_jentik,
          jumlah_wadah: Number(d.jumlah_wadah) || 1, catatan: d.catatan || '',
        })),
        kesimpulan: positif ? 'positif_jentik' : 'bebas_jentik',
        catatan: form.catatan, edukasi: form.edukasi, tindakan: form.tindakan, rekomendasi: form.rekomendasi,
        fotos: uploaded,
        _status_sebelumnya: statusLama,
      };
      const id = await simpanPemeriksaan({
        id: editId, payload,
        statusBaru: kirim ? STATUS.PENDING : STATUS.DRAFT, user,
      });
      toast.success(kirim ? 'Laporan dikirim untuk verifikasi.' : 'Draft tersimpan.');
      router.push(`/kader/pemeriksaan/${id}`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(null);
    }
  };

  if (user === undefined || loading) return <PageLoader />;
  if (!user) return null;

  return (
    <div>
      <PageHeader title={editId ? 'Edit Pemeriksaan' : 'Pemeriksaan Baru'}
        subtitle={statusLama === STATUS.REVISION ? 'Perbaiki laporan sesuai catatan revisi lalu kirim ulang' : 'Isi hasil pemeriksaan jentik nyamuk'} />

      <div className="space-y-4 max-w-4xl">
        <Card className="p-5" hover={false}>
          <CardHeader title="Identitas Pemeriksaan" />
          <div className="grid md:grid-cols-2 gap-4 px-1 pb-2">
            <Field label="Nama Kader"><input className="input" value={user.nama} disabled /></Field>
            <Field label="Wilayah"><input className="input" value={wilayahDipilih?.nama_wilayah || 'Otomatis dari rumah yang dipilih'} disabled /></Field>
            <Field label="Rumah yang Diperiksa" required>
              <select className="select" required value={form.id_rumah} onChange={(e) => setForm({ ...form, id_rumah: e.target.value })} disabled={!!editId}>
                <option value="">— Pilih Rumah —</option>
                {rumah.map((r) => <option key={r.id} value={r.id}>{r.nama_warga} — {r.alamat} ({wilayahMap[r.id_wilayah]?.nama_wilayah || ''})</option>)}
              </select>
            </Field>
            <Field label="Pemilik Rumah"><input className="input" value={rumahDipilih?.nama_warga || '-'} disabled /></Field>
            <Field label="Alamat Rumah"><input className="input" value={rumahDipilih?.alamat || '-'} disabled /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tanggal" required><input type="date" className="input" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} /></Field>
              <Field label="Waktu" required><input type="time" className="input" value={form.waktu} onChange={(e) => setForm({ ...form, waktu: e.target.value })} /></Field>
            </div>
          </div>
        </Card>

        <Card className="p-5" hover={false}>
          <CardHeader title="Pemeriksaan Tempat Penampungan Air"
            subtitle="Periksa setiap tempat penampungan air di rumah"
            action={<button type="button" className="btn btn-ghost !py-1.5 !px-3 text-xs" onClick={() => setDetail((d) => [...d, { ...DETAIL_KOSONG }])}><Plus size={13} /> Tambah</button>} />
          <div className="space-y-3 px-1 pb-2">
            {detail.map((d, i) => (
              <div key={i} className="rounded-xl border border-emerald-500/20 p-4 grid md:grid-cols-6 gap-3 items-end"
                style={{ background: d.ditemukan_jentik ? 'rgba(244,63,94,.06)' : 'rgba(16,185,129,.04)' }}>
                <div className="md:col-span-2">
                  <Field label="Tempat Penampungan" required>
                    <select className="select" value={d.nama_tempat_penampungan} onChange={(e) => updateDetail(i, 'nama_tempat_penampungan', e.target.value)}>
                      {TPA_LIST.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>
                </div>
                <Field label="Kondisi">
                  <select className="select" value={d.kondisi} onChange={(e) => updateDetail(i, 'kondisi', e.target.value)}>
                    {KONDISI_TPA.map((k) => <option key={k} value={k}>{k}</option>)}
                  </select>
                </Field>
                <Field label="Jumlah Wadah"><input type="number" min={1} className="input" value={d.jumlah_wadah} onChange={(e) => updateDetail(i, 'jumlah_wadah', e.target.value)} /></Field>
                <Field label="Jentik Ditemukan?">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => updateDetail(i, 'ditemukan_jentik', true)}
                      className={`btn flex-1 !py-2 !text-xs ${d.ditemukan_jentik ? 'btn-danger' : 'btn-ghost'}`}>
                      <Bug size={13} /> Ya
                    </button>
                    <button type="button" onClick={() => updateDetail(i, 'ditemukan_jentik', false)}
                      className={`btn flex-1 !py-2 !text-xs ${!d.ditemukan_jentik ? 'btn-primary' : 'btn-ghost'}`}>
                      Tidak
                    </button>
                  </div>
                </Field>
                <div className="flex gap-2">
                  <input className="input flex-1" placeholder="Catatan" value={d.catatan} onChange={(e) => updateDetail(i, 'catatan', e.target.value)} />
                  {detail.length > 1 && (
                    <button type="button" className="btn btn-ghost !p-2 text-rose-300" onClick={() => setDetail((x) => x.filter((_, j) => j !== i))}><Trash2 size={15} /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mx-1 mb-2 mt-3 rounded-xl p-4 flex items-center gap-3"
            style={{
              background: positif ? 'rgba(244,63,94,.12)' : 'rgba(16,185,129,.12)',
              border: `1px solid ${positif ? 'rgba(244,63,94,.4)' : 'rgba(16,185,129,.4)'}`,
            }}>
            <Bug size={20} className={positif ? 'text-rose-300' : 'text-emerald-300'} />
            <div>
              <p className="font-bold text-sm">Kesimpulan otomatis: {positif ? 'POSITIF JENTIK' : 'BEBAS JENTIK'}</p>
              <p className="text-xs text-muted">{positif ? 'Minimal satu tempat penampungan ditemukan jentik.' : 'Seluruh tempat penampungan tidak ditemukan jentik.'}</p>
            </div>
          </div>
        </Card>

        <Card className="p-5" hover={false}>
          <CardHeader title="Dokumentasi Foto" />
          <div className="px-1 pb-2"><PhotoUploader fotos={fotos} onChange={setFotos} uid={user.uid} /></div>
        </Card>

        <Card className="p-5" hover={false}>
          <CardHeader title="Catatan & Tindak Lanjut" />
          <div className="grid md:grid-cols-2 gap-4 px-1 pb-2">
            <Field label="Catatan Pemeriksaan"><textarea className="textarea" rows={3} value={form.catatan} onChange={(e) => setForm({ ...form, catatan: e.target.value })} /></Field>
            <Field label="Edukasi yang Diberikan"><textarea className="textarea" rows={3} value={form.edukasi} onChange={(e) => setForm({ ...form, edukasi: e.target.value })} placeholder="Contoh: edukasi 3M Plus kepada penghuni rumah" /></Field>
            <Field label="Tindakan yang Dilakukan"><textarea className="textarea" rows={3} value={form.tindakan} onChange={(e) => setForm({ ...form, tindakan: e.target.value })} placeholder="Contoh: pengurasan bak mandi, menabur larvasida" /></Field>
            <Field label="Rekomendasi Tindak Lanjut"><textarea className="textarea" rows={3} value={form.rekomendasi} onChange={(e) => setForm({ ...form, rekomendasi: e.target.value })} /></Field>
          </div>
        </Card>

        <div className="flex flex-wrap gap-3 justify-end pb-8">
          <button className="btn btn-ghost" onClick={() => router.back()}><X size={15} /> Batalkan</button>
          <button className="btn btn-ghost" onClick={() => simpan(false)} disabled={!!saving}>
            {saving === 'draft' ? <Spinner size={14} /> : <Save size={15} />} Simpan Draft
          </button>
          <button className="btn btn-primary" onClick={() => simpan(true)} disabled={!!saving}>
            {saving === 'kirim' ? <Spinner size={14} /> : <Send size={15} />} Kirim Laporan
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PemeriksaanBaruPage() {
  return <Suspense fallback={<PageLoader />}><FormInner /></Suspense>;
}
