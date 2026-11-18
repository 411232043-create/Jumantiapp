# Panduan Deployment

## 1. Firebase (wajib sebelum app berfungsi penuh)

```bash
npm install -g firebase-tools
firebase login                 # gunakan akun pemilik project jumantik-f2c68
firebase deploy --only firestore:rules,firestore:indexes --project jumantik-f2c68
```

Pastikan di Firebase Console:
- Authentication → Sign-in method → Email/Password: **Enabled**
- Firestore Database: sudah dibuat

## 2. Supabase Storage (foto pemeriksaan)

Set `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` di `.env` lokal atau
environment deployment. `SUPABASE_SERVICE_ROLE_KEY` hanya boleh berada di server.
Bucket default `foto-pemeriksaan` dapat dibuat dengan:

```bash
node scripts/provision-supabase.mjs
```

Script membuat bucket publik dengan batas ukuran 700 KB dan tipe JPG/PNG.
Foto dalam bucket publik dapat diakses melalui URL publiknya.

## 3. Provisioning akun awal

```bash
node scripts/provision-users.mjs
```

## 4. Vercel

1. Push repo ke GitHub.
2. Import project di Vercel (framework: Next.js, auto-detect).
3. Masukkan environment variables (lihat `.env.example`):
   - `NEXT_PUBLIC_FIREBASE_*` (6 variabel)
   - `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET` (bucket opsional)
   - `INITIAL_*_PASSWORD` (opsional, hanya untuk provisioning ulang)
4. Deploy.
5. Tambahkan domain Vercel di Firebase Console →
   Authentication → Settings → Authorized domains.

## 5. Verifikasi produksi

- Login 3 akun awal → masing-masing diarahkan ke dashboard rolenya.
- Kader: buat pemeriksaan, upload foto, kirim laporan.
- Kepala divisi: setujui / minta revisi.
- Admin: tambah pengguna & wilayah.
- Ekspor PDF/Excel di halaman Laporan.
