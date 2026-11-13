# SI-JUMANTIK — Sistem Informasi Pemantauan Jentik Nyamuk

Aplikasi web untuk digitalisasi pencatatan pemeriksaan jentik nyamuk oleh kader
Jumantik, verifikasi laporan oleh kepala divisi, dan monitoring oleh admin.

## Teknologi

- **Next.js 16** (App Router, JavaScript) + React 19 + Tailwind CSS 4
- **Firebase**: Authentication (email/password), Cloud Firestore (database),
  Firebase Storage (foto dokumentasi), FCM-ready (notifikasi in-app aktif)
- **Recharts** (grafik), **Lucide** (ikon), **jsPDF + SheetJS** (ekspor PDF/Excel)
- Tema UI: dark glassmorphism 3D dengan gradasi hijau neon

## Role

| Role | Fungsi utama |
|------|--------------|
| `admin` | Manajemen pengguna, wilayah, penugasan, warga, rumah, semua data pemeriksaan, laporan, pengaturan |
| `kader` | Pemeriksaan jentik, upload foto, draft/kirim laporan, revisi, riwayat |
| `kepala_divisi` | Monitoring, verifikasi (setujui/minta revisi), statistik ABJ, laporan |

## Menjalankan Lokal

```bash
npm install
cp .env.example .env      # isi kredensial Firebase
node scripts/provision-users.mjs   # buat 3 akun awal + data contoh (idempotent)
npm run dev               # http://localhost:3000
```

Deploy security rules (perlu `firebase login` pada akun pemilik project):

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage --project <PROJECT_ID>
```

## Akun Awal

Dibuat oleh `scripts/provision-users.mjs` menggunakan `INITIAL_*_PASSWORD` di `.env`:

- `admin@si-jumantik.local` — admin
- `kader@si-jumantik.local` — kader (ditugaskan ke Wilayah RW 01)
- `kepaladivisi@si-jumantik.local` — kepala divisi

Segera ganti password setelah login pertama melalui menu **Profil → Ubah Password**.
Lihat `docs/AKUN_AWAL.md`.

## Struktur Penting

```
app/                 # halaman (login, admin/, kader/, kepala-divisi/, api/)
components/          # AppShell, DataTable, Charts, PemeriksaanDetail, dsb.
services/firestore.js# akses data client-side (Firestore + Storage)
lib/firebase/        # client & admin SDK
lib/auth/            # sesi cookie + useCurrentUser
scripts/provision-users.mjs
firestore.rules      # Row-level security Firestore
storage.rules        # Aturan Storage (validasi tipe & ukuran foto)
firestore.indexes.json
docs/                # panduan deployment & akun awal
```

## Status Workflow Laporan

`draft → menunggu_verifikasi → disetujui / perlu_revisi → (revisi) → menunggu_verifikasi`

- Hanya laporan **disetujui** yang masuk statistik ABJ dan ekspor laporan.
- Laporan disetujui tidak dapat diedit; riwayat status & verifikasi tersimpan permanen.

## Keamanan

- Sesi: session cookie httpOnly (Firebase Admin `createSessionCookie`), diverifikasi
  di server pada setiap layout role + `proxy.js` (pengganti middleware di Next 16).
- Firestore Rules membatasi: kader hanya data miliknya & wilayah tugasnya,
  kepala divisi hanya verifikasi, admin penuh.
- Pembuatan akun hanya lewat API route yang memverifikasi role admin di server.
- Storage Rules: hanya JPG/PNG < 5MB di folder milik pengguna.

## Catatan

- `DATABASE_URL` di `.env` warisan tidak digunakan — backend penuh Firebase.
- FCM (push notification web) belum diaktifkan; notifikasi in-app (koleksi
  `notifikasi` + lonceng di topbar) sudah berfungsi.
- Lihat `docs/DEPLOYMENT.md` untuk panduan deploy ke Vercel.
# JumantikApp
