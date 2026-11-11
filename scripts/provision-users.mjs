/**
 * Provisioning akun awal SI-JUMANTIK.
 * Jalankan: node scripts/provision-users.mjs
 * Idempotent — aman dijalankan berulang.
 */
import { config } from 'dotenv';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

config({ path: '.env' });

const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
if (!privateKey || !process.env.FIREBASE_CLIENT_EMAIL) {
  console.error('ERROR: FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY belum diatur di .env');
  process.exit(1);
}

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey,
  }),
});

const auth = getAuth();
const db = getFirestore();

const ACCOUNTS = [
  { key: 'ADMIN', nama: 'Administrator SI-JUMANTIK', email: 'admin@si-jumantik.local', role: 'admin', pass: process.env.INITIAL_ADMIN_PASSWORD },
  { key: 'KADER', nama: 'Kader Jumantik', email: 'kader@si-jumantik.local', role: 'kader', pass: process.env.INITIAL_KADER_PASSWORD },
  { key: 'KEPALA', nama: 'Kepala Divisi', email: 'kepaladivisi@si-jumantik.local', role: 'kepala_divisi', pass: process.env.INITIAL_KEPALA_PASSWORD },
];

async function ensureUser({ nama, email, role, pass }) {
  let rec;
  try {
    rec = await auth.getUserByEmail(email);
    console.log(`  • ${email} sudah ada (${rec.uid})`);
    if (pass) await auth.updateUser(rec.uid, { password: pass });
    if (rec.disabled) await auth.updateUser(rec.uid, { disabled: false });
  } catch (e) {
    if (e.code !== 'auth/user-not-found') throw e;
    if (!pass) throw new Error(`Password awal untuk ${email} belum diatur (INITIAL_*_PASSWORD).`);
    rec = await auth.createUser({ email, password: pass, displayName: nama });
    console.log(`  + ${email} dibuat (${rec.uid})`);
  }
  return rec;
}

async function ensureDoc(col, id, data) {
  const ref = db.collection(col).doc(id);
  const snap = await ref.get();
  if (snap.exists) { console.log(`  • ${col}/${id} sudah ada`); return id; }
  await ref.set({ ...data, created_at: FieldValue.serverTimestamp() });
  console.log(`  + ${col}/${id} dibuat`);
  return id;
}

async function main() {
  console.log('== Provisioning SI-JUMANTIK ==\n[1] Roles & Divisi');
  for (const r of ['admin', 'kader', 'kepala_divisi']) {
    await ensureDoc('roles', r, { name: r });
  }
  const divisiSnap = await db.collection('divisi').limit(1).get();
  let divisiId;
  if (divisiSnap.empty) {
    const ref = await db.collection('divisi').add({
      nama_divisi: 'Divisi Jumantik Utama', keterangan: 'Divisi awal hasil provisioning',
      created_at: FieldValue.serverTimestamp(),
    });
    divisiId = ref.id;
    console.log(`  + divisi/${divisiId} dibuat`);
  } else {
    divisiId = divisiSnap.docs[0].id;
    console.log(`  • divisi/${divisiId} sudah ada`);
  }

  console.log('\n[2] Akun pengguna');
  const uids = {};
  for (const acc of ACCOUNTS) {
    const rec = await ensureUser(acc);
    uids[acc.role] = rec.uid;
    const ref = db.collection('users').doc(rec.uid);
    const snap = await ref.get();
    if (snap.exists) {
      await ref.update({ id_role: acc.role, id_divisi: divisiId, nama: acc.nama, status: 'aktif', updated_at: FieldValue.serverTimestamp() });
      console.log(`  • profil users/${rec.uid} diperbarui`);
    } else {
      await ref.set({
        auth_user_id: rec.uid, id_role: acc.role, id_divisi: divisiId, nama: acc.nama, email: acc.email,
        no_hp: '', alamat: '', status: 'aktif', wilayah_ids: [],
        created_at: FieldValue.serverTimestamp(), updated_at: FieldValue.serverTimestamp(),
      });
      console.log(`  + profil users/${rec.uid} dibuat`);
    }
  }

  console.log('\n[3] Wilayah awal');
  const wilayahData = [
    { nama_wilayah: 'Wilayah RW 01', kecamatan: 'Kecamatan Contoh', kelurahan: 'Kelurahan Contoh', rt: '001-005', rw: '01' },
    { nama_wilayah: 'Wilayah RW 02', kecamatan: 'Kecamatan Contoh', kelurahan: 'Kelurahan Contoh', rt: '001-005', rw: '02' },
    { nama_wilayah: 'Wilayah RW 03', kecamatan: 'Kecamatan Contoh', kelurahan: 'Kelurahan Contoh', rt: '001-005', rw: '03' },
  ];
  const wilayahIds = [];
  for (const w of wilayahData) {
    const q = await db.collection('wilayah').where('nama_wilayah', '==', w.nama_wilayah).limit(1).get();
    if (!q.empty) { wilayahIds.push(q.docs[0].id); console.log(`  • ${w.nama_wilayah} sudah ada`); continue; }
    const ref = await db.collection('wilayah').add({ ...w, id_divisi: divisiId, keterangan: '', created_at: FieldValue.serverTimestamp() });
    wilayahIds.push(ref.id);
    console.log(`  + ${w.nama_wilayah} dibuat`);
  }

  console.log('\n[4] Penugasan kader');
  const kaderUid = uids['kader'];
  const targetWilayah = wilayahIds[0];
  const targetNama = wilayahData[0].nama_wilayah;
  const pq = await db.collection('kader_wilayah')
    .where('id_user', '==', kaderUid).where('id_wilayah', '==', targetWilayah).limit(1).get();
  if (pq.empty) {
    await db.collection('kader_wilayah').add({
      id_user: kaderUid, id_wilayah: targetWilayah, nama_kader: 'Kader Jumantik', nama_wilayah: targetNama,
      status: 'aktif', tanggal_mulai: new Date().toISOString().slice(0, 10), tanggal_selesai: null,
      created_at: FieldValue.serverTimestamp(),
    });
    console.log('  + penugasan kader dibuat');
  } else console.log('  • penugasan kader sudah ada');
  await db.collection('users').doc(kaderUid).update({ wilayah_ids: [targetWilayah] });

  console.log('\n[5] Data warga & rumah contoh');
  const wargaNama = ['Budi Santoso', 'Siti Aminah', 'Ahmad Hidayat', 'Dewi Lestari', 'Joko Prasetyo', 'Rina Marlina'];
  const rumahData = [
    { warga: 0, alamat: 'Jl. Melati No. 10', rt: '001', rw: '01', wilayah: 0 },
    { warga: 1, alamat: 'Jl. Melati No. 22', rt: '002', rw: '01', wilayah: 0 },
    { warga: 2, alamat: 'Jl. Anggrek No. 5', rt: '003', rw: '01', wilayah: 0 },
    { warga: 3, alamat: 'Jl. Kenanga No. 8', rt: '001', rw: '02', wilayah: 1 },
    { warga: 4, alamat: 'Jl. Kenanga No. 15', rt: '002', rw: '02', wilayah: 1 },
    { warga: 5, alamat: 'Jl. Dahlia No. 3', rt: '001', rw: '03', wilayah: 2 },
  ];
  const wargaIds = {};
  for (const nama of wargaNama) {
    const q = await db.collection('warga').where('nama', '==', nama).limit(1).get();
    if (!q.empty) { wargaIds[nama] = q.docs[0].id; continue; }
    const ref = await db.collection('warga').add({ nama, no_hp: '', keterangan: '', created_at: FieldValue.serverTimestamp() });
    wargaIds[nama] = ref.id;
  }
  let rumahBaru = 0;
  for (const r of rumahData) {
    const q = await db.collection('rumah').where('alamat', '==', r.alamat).limit(1).get();
    if (!q.empty) continue;
    await db.collection('rumah').add({
      id_wilayah: wilayahIds[r.wilayah], id_warga: wargaIds[wargaNama[r.warga]],
      nama_warga: wargaNama[r.warga], alamat: r.alamat, rt: r.rt, rw: r.rw, keterangan: '',
      created_at: FieldValue.serverTimestamp(), updated_at: FieldValue.serverTimestamp(),
    });
    rumahBaru++;
  }
  console.log(`  + ${rumahBaru} rumah contoh dibuat (${rumahData.length - rumahBaru} sudah ada)`);

  console.log('\n[6] Pengaturan aplikasi');
  await ensureDoc('pengaturan', 'app', {
    nama_aplikasi: 'SI-JUMANTIK', nama_divisi: 'Divisi Jumantik Utama',
    alamat: '', telepon: '', periode_pemantauan_hari: 30,
  });

  console.log('\n✅ Provisioning selesai.');
  console.log('Akun awal (password dari INITIAL_*_PASSWORD di .env):');
  console.log('  admin@si-jumantik.local        (admin)');
  console.log('  kader@si-jumantik.local        (kader)');
  console.log('  kepaladivisi@si-jumantik.local (kepala_divisi)');
}

main().catch((e) => { console.error('GAGAL:', e.message); process.exit(1); });
