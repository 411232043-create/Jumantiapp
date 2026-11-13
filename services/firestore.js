'use client';

import {
  collection, doc, addDoc, setDoc, updateDoc, deleteDoc, getDoc, getDocs,
  query, where, orderBy, limit, serverTimestamp, writeBatch, arrayUnion,
} from 'firebase/firestore';
import { db, storage } from '@/lib/firebase/client';
import { snapToArray } from '@/lib/utils';
import { STATUS } from '@/lib/constants';

export { collection, doc, addDoc, setDoc, updateDoc, deleteDoc, getDoc, getDocs, query, where, orderBy, limit, serverTimestamp, db, storage };

// ---------- generic ----------
export async function listDocs(col, ...constraints) {
  const q = constraints.length ? query(collection(db, col), ...constraints) : collection(db, col);
  return snapToArray(await getDocs(q));
}

export async function getDocById(col, id) {
  const snap = await getDoc(doc(db, col, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function createDoc(col, data) {
  const ref = await addDoc(collection(db, col), { ...data, created_at: serverTimestamp() });
  return ref.id;
}

export async function updateDocById(col, id, data) {
  await updateDoc(doc(db, col, id), { ...data, updated_at: serverTimestamp() });
}

// ---------- users ----------
export const listUsers = (...c) => listDocs('users', ...c);
export const listUsersByRole = (role) => listDocs('users', where('id_role', '==', role));

// ---------- wilayah ----------
export const listWilayah = () => listDocs('wilayah', orderBy('nama_wilayah'));
export const listWilayahByIds = async (ids) => {
  if (!ids?.length) return [];
  // Firestore 'in' max 30
  const chunks = [];
  for (let i = 0; i < ids.length; i += 30) chunks.push(ids.slice(i, i + 30));
  const out = [];
  for (const c of chunks) {
    out.push(...await listDocs('wilayah', where('__name__', 'in', c)));
  }
  return out;
};

// ---------- penugasan ----------
export const listPenugasan = () => listDocs('kader_wilayah', orderBy('created_at', 'desc'));
export const listPenugasanKader = (uid) =>
  listDocs('kader_wilayah', where('id_user', '==', uid), where('status', '==', 'aktif'));

export async function tugaskanKader({ id_user, id_wilayah, nama_kader, nama_wilayah }) {
  const existing = await listDocs('kader_wilayah',
    where('id_user', '==', id_user), where('id_wilayah', '==', id_wilayah), where('status', '==', 'aktif'));
  let id;
  if (existing.length) {
    id = existing[0].id;
  } else {
    id = await createDoc('kader_wilayah', {
      id_user, id_wilayah, nama_kader, nama_wilayah,
      status: 'aktif', tanggal_mulai: new Date().toISOString().slice(0, 10), tanggal_selesai: null,
    });
  }
  // denormalized wilayah_ids on user doc (dipakai Firestore rules & query)
  await updateDoc(doc(db, 'users', id_user), { wilayah_ids: arrayUnion(id_wilayah) });
  return id;
}

export async function nonaktifkanPenugasan(penugasan) {
  await updateDocById('kader_wilayah', penugasan.id, {
    status: 'nonaktif', tanggal_selesai: new Date().toISOString().slice(0, 10),
  });
  const aktif = await listPenugasanKader(penugasan.id_user);
  const ids = aktif.filter((p) => p.id !== penugasan.id).map((p) => p.id_wilayah);
  await updateDoc(doc(db, 'users', penugasan.id_user), { wilayah_ids: ids });
}

// ---------- warga & rumah ----------
export const listWarga = () => listDocs('warga', orderBy('nama'));
export const listRumah = () => listDocs('rumah', orderBy('created_at', 'desc'));
export const listRumahWilayah = (id_wilayah) => listDocs('rumah', where('id_wilayah', '==', id_wilayah));

// ---------- pemeriksaan ----------
export const listPemeriksaan = (...c) => listDocs('pemeriksaan', ...c);

export async function simpanPemeriksaan({ id, payload, statusBaru, user }) {
  const { _status_sebelumnya, ...cleanPayload } = payload;
  const batch = writeBatch(db);
  let refId = id;
  if (id) {
    batch.update(doc(db, 'pemeriksaan', id), { ...cleanPayload, status: statusBaru, updated_at: serverTimestamp() });
  } else {
    const ref = doc(collection(db, 'pemeriksaan'));
    refId = ref.id;
    batch.set(ref, { ...cleanPayload, status: statusBaru, created_at: serverTimestamp(), updated_at: serverTimestamp() });
    batch.set(doc(collection(db, 'riwayat_status')), {
      id_pemeriksaan: refId, status_sebelumnya: null, status_baru: statusBaru,
      id_pengguna: user.uid, nama_pengguna: user.nama, keterangan: 'Laporan dibuat',
      created_at: serverTimestamp(),
    });
  }
  if (id) {
    batch.set(doc(collection(db, 'riwayat_status')), {
      id_pemeriksaan: id, status_sebelumnya: _status_sebelumnya || null, status_baru: statusBaru,
      id_pengguna: user.uid, nama_pengguna: user.nama,
      keterangan: statusBaru === STATUS.DRAFT ? 'Disimpan sebagai draft' : 'Laporan dikirim untuk verifikasi',
      created_at: serverTimestamp(),
    });
  }
  // notifikasi ke kepala divisi saat laporan dikirim
  if (statusBaru === STATUS.PENDING) {
    const kadivs = await listUsersByRole('kepala_divisi');
    for (const k of kadivs) {
      if (k.status !== 'aktif') continue;
      batch.set(doc(collection(db, 'notifikasi')), {
        id_user: k.id, judul: 'Laporan pemeriksaan baru',
        pesan: `${user.nama} mengirim laporan pemeriksaan di ${payload.nama_wilayah || 'wilayah tugas'}.`,
        tipe: 'laporan_masuk', link: `/kepala-divisi/verifikasi/${refId}`, dibaca: false,
        created_at: serverTimestamp(),
      });
    }
  }
  await batch.commit();
  return refId;
}

export async function hapusPemeriksaan(id) {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'pemeriksaan', id));
  await batch.commit();
}

// ---------- verifikasi ----------
export async function verifikasiLaporan({ pemeriksaan, keputusan, catatan, verifikator }) {
  const batch = writeBatch(db);
  batch.update(doc(db, 'pemeriksaan', pemeriksaan.id), {
    status: keputusan, catatan_verifikasi: catatan || '', updated_at: serverTimestamp(),
  });
  batch.set(doc(collection(db, 'verifikasi')), {
    id_pemeriksaan: pemeriksaan.id, id_verifikator: verifikator.uid,
    nama_verifikator: verifikator.nama, keputusan, catatan_verifikasi: catatan || '',
    tanggal_verifikasi: new Date().toISOString(), created_at: serverTimestamp(),
  });
  batch.set(doc(collection(db, 'riwayat_status')), {
    id_pemeriksaan: pemeriksaan.id, status_sebelumnya: pemeriksaan.status, status_baru: keputusan,
    id_pengguna: verifikator.uid, nama_pengguna: verifikator.nama,
    keterangan: keputusan === STATUS.APPROVED ? 'Laporan disetujui' : `Revisi diminta: ${catatan}`,
    created_at: serverTimestamp(),
  });
  batch.set(doc(collection(db, 'notifikasi')), {
    id_user: pemeriksaan.id_kader,
    judul: keputusan === STATUS.APPROVED ? 'Laporan disetujui' : 'Laporan perlu revisi',
    pesan: keputusan === STATUS.APPROVED
      ? `Laporan pemeriksaan Anda di ${pemeriksaan.nama_wilayah} telah disetujui.`
      : `Laporan pemeriksaan Anda di ${pemeriksaan.nama_wilayah} perlu revisi: ${catatan}`,
    tipe: keputusan === STATUS.APPROVED ? 'disetujui' : 'revisi',
    link: `/kader/pemeriksaan/${pemeriksaan.id}`, dibaca: false,
    created_at: serverTimestamp(),
  });
  await batch.commit();
}

// ---------- foto (upload via API → Supabase Storage) ----------
export async function uploadFoto(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/upload/foto', { method: 'POST', body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Upload foto gagal.');
  return { path: data.path, url: data.url, nama_file: file.name };
}

// ---------- notifikasi ----------
export const listNotifikasi = async (uid) => {
  const items = await listDocs('notifikasi', where('id_user', '==', uid));
  return items
    .sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0))
    .slice(0, 30);
};

export async function tandaiNotifikasiDibaca(id) {
  await updateDoc(doc(db, 'notifikasi', id), { dibaca: true });
}

// ---------- audit ----------
export async function auditLog(user, aksi, entitas, id_entitas, detail = '') {
  try {
    await addDoc(collection(db, 'audit_log'), {
      id_user: user?.uid || '-', nama_pengguna: user?.nama || '-',
      aksi, entitas, id_entitas, detail, created_at: serverTimestamp(),
    });
  } catch { /* audit tidak boleh memutus alur utama */ }
}
