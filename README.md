# SI-JUMANTIK — Sistem Informasi Pemantauan Jentik Nyamuk

Aplikasi web untuk digitalisasi pencatatan pemeriksaan jentik nyamuk oleh kader
Jumantik, verifikasi laporan oleh kepala divisi, dan monitoring oleh admin.

## Teknologi

- **Next.js 16** (App Router, JavaScript) + React 19 + Tailwind CSS 4
- **Firebase**: Authentication (email/password), Cloud Firestore (database),
  FCM-ready (notifikasi in-app aktif)
- **Supabase Storage**: foto dokumentasi pemeriksaan
- **Recharts** (grafik), **Lucide** (ikon), **jsPDF + SheetJS** (ekspor PDF/Excel)
- Tema UI: glassmorphism 3D dengan gradasi hijau neon dan toggle gelap/terang

## Role

| Role | Fungsi utama |
|------|--------------|
| `admin` | Manajemen pengguna, wilayah, penugasan, warga, rumah, semua data pemeriksaan, laporan, pengaturan |
| `kader` | Pemeriksaan jentik, upload foto, draft/kirim laporan, revisi, riwayat |
| `kepala_divisi` | Monitoring, verifikasi (setujui/minta revisi), statistik ABJ, laporan |

## Menjalankan Lokal

### Windows PowerShell

Jalankan dari folder proyek. Salin template hanya jika `.env` belum ada agar
kredensial lokal yang sudah tersimpan tidak tertimpa:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm install
npm run dev
```

Isi variabel Firebase di `.env` sebelum mencoba login. Upload foto juga
membutuhkan `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY`; kunci service role
hanya digunakan server dan tidak boleh diekspos. File `.env` tidak boleh
di-commit atau dibagikan.

### macOS / Linux

```bash
npm install
test -f .env || cp .env.example .env
npm run dev               # http://localhost:3000
```

Provision akun awal dan data contoh secara opsional setelah Firebase Admin
credentials dan password awal di `.env` diisi:

```bash
node scripts/provision-users.mjs
```

Provision bucket Supabase secara opsional setelah kredensial Supabase diisi:

```bash
node scripts/provision-supabase.mjs
```

Deploy Firestore security rules (perlu `firebase login` pada akun pemilik project):

```bash
firebase deploy --only firestore:rules,firestore:indexes --project <PROJECT_ID>
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
app/api/upload/foto/ # upload foto terautentikasi ke Supabase Storage
components/          # AppShell, DataTable, Charts, PemeriksaanDetail, dsb.
services/firestore.js# akses data client-side (Firestore)
lib/firebase/        # client & admin SDK
lib/supabase/        # Supabase service-role client (server only)
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
  di server pada setiap layout role + `proxy.js`; status dan role akun diverifikasi
  dari Firestore, bukan dari cookie role yang dapat diubah client.
- Firestore Rules membatasi: kader hanya data miliknya & wilayah tugasnya,
  kepala divisi hanya verifikasi, admin penuh.
- Pembuatan akun hanya lewat API route yang memverifikasi role admin di server.
- API upload foto memerlukan sesi kader dan membatasi JPG/PNG sampai 700 KB.
- Bucket foto saat ini dikonfigurasi publik untuk URL gambar; jangan unggah foto
  yang tidak boleh diakses publik.

## Catatan

- `DATABASE_URL` di `.env` warisan tidak digunakan; data utama memakai Firestore,
  sedangkan foto memakai Supabase Storage.
- FCM (push notification web) belum diaktifkan; notifikasi in-app (koleksi
  `notifikasi` + lonceng di topbar) sudah berfungsi.
- Lihat `docs/DEPLOYMENT.md` untuk panduan deploy ke Vercel.
# JumantikApp
# Jumantiapp
