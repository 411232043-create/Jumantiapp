# Akun Awal SI-JUMANTIK

> RAHASIA — file ini tidak boleh dipublikasi / di-commit ke repo publik.

Dibuat otomatis oleh `scripts/provision-users.mjs` (idempotent, aman dijalankan ulang).

| Role | Email | Password awal |
|------|-------|---------------|
| Admin | admin@si-jumantik.local | nilai `INITIAL_ADMIN_PASSWORD` di `.env` |
| Kader | kader@si-jumantik.local | nilai `INITIAL_KADER_PASSWORD` di `.env` |
| Kepala Divisi | kepaladivisi@si-jumantik.local | nilai `INITIAL_KEPALA_PASSWORD` di `.env` |

## Kewajiban keamanan

1. Ganti password segera setelah login pertama (Profil → Ubah Password).
2. Password tidak disimpan plaintext di database — Firebase Auth melakukan hashing.
3. Reset password tersedia di halaman login (tautan "Lupa password").
4. Provisioning tidak membuat duplikat bila dijalankan ulang.

## Data awal yang dibuat

- 3 dokumen role, 1 divisi ("Divisi Jumantik Utama")
- 3 wilayah contoh (RW 01–03), kader ditugaskan ke Wilayah RW 01
- 6 warga + 6 rumah contoh tersebar di 3 wilayah
- Dokumen `pengaturan/app`
