# Produksi & HSE PWA — Tahap 1 (Fondasi + Anti-fraud + Offline)

## Isi
- supabase/schema.sql — skema relasional, RBAC, P2H→hour-meter, CAPA otomatis, RLS dasar
- src/lib/offline-db.ts — antrean IndexedDB (data + foto)
- src/lib/sync.ts — sinkronisasi idempoten + auto-sync
- src/components/LiveCameraCapture.tsx — kamera langsung + watermark GPS
- public/sw.js, public/manifest.json — PWA

## Setup
1. npx create-next-app@latest hse-pwa --ts --tailwind --app, lalu salin folder ini ke dalamnya
2. npm i @supabase/supabase-js idb
3. .env.local: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
4. Jalankan schema.sql di Supabase SQL Editor; buat bucket privat visual-reports dan capa-evidence
5. Di layout klien: panggil startAutoSync() sekali di useEffect
6. Tambah icon-192.png dan icon-512.png ke public/
7. Uji di HP lewat HTTPS (kamera, GPS, Service Worker wajib HTTPS; Vercel otomatis)

## Batasan anti-fraud
Browser tidak bisa 100% mencegah kamera virtual atau GPS palsu. Lapisan pertahanan:
watermark di piksel + akurasi GPS minimum + pembanding captured_at vs received_at
(view visual_reports_flagged). Untuk proyek bernilai tinggi, tambahkan review acak oleh HSE/PM.

## Tahap 2 (PTW, P2H, CAPA)
- Jalankan supabase/schema_tahap2.sql setelah schema.sql
- P2HForm: id P2H dibuat di klien, sehingga hour-meter bisa merujuk P2H walau offline (pakai getTodayPassedP2H di form hour-meter)
- PTWForm: checklist wajib per jenis pekerjaan + tanda tangan; approval via RPC approve_ptw (hanya online, urutan Supervisor, HSE, PM, tidak boleh approve permit sendiri)
- Halaman CAPA: src/app/hse/capa/page.tsx (tutup butuh foto bukti dan peran HSE/PM/Admin; ditegakkan trigger DB)
- Notifikasi PTW menunggu: query view ptw_my_queue

## Tahap 3 (Hour-meter, Dashboard, Notifikasi, Ekspor)
- Jalankan supabase/schema_tahap3.sql (setelah tahap 1 dan 2)
- npm i xlsx jspdf jspdf-autotable
- HourMeterForm terkunci sampai P2H hari ini lulus; di database dijaga trigger enforce_p2h_before_hm
- dashboard_summary: progres, safe man-hours (dihitung sejak LTI terakhir), CAPA terbuka/selesai/terlambat, menunggu approval
- NotificationBell: view my_notifications + Realtime; letakkan di Topbar layout
- ExportButtons dipakai di dashboard dan halaman CAPA; pasang di laporan lain dengan kolom masing-masing
- src/app/produksi/hour-meter/page.tsx hanya contoh alur: ganti ID alat dan user dengan data sesi

## Tahap 4 (Login, layout, Near Miss, Inspeksi, Kendala)
- Jalankan supabase/schema_tahap4.sql; buat bucket privat near-miss dan field-issues
- Buat user di Supabase Auth, lalu isi baris di tabel profiles (id sama dengan auth.users.id, role, project_id) agar peran terbaca. Tambahkan juga minimal satu baris projects dan equipment
- src/app/layout.tsx menggantikan layout bawaan: membungkus AuthProvider, startAutoSync, dan AppShell (sidebar, topbar)
- Menu tersaring sesuai peran (src/lib/rbac.ts). Ini hanya kenyamanan UI; keamanan sesungguhnya di RLS dan trigger database
- Near miss anonim: reporter_id tidak dikirim. Catatan: koneksi tetap terautentikasi, jadi anonimitas bergantung pada kebijakan akses log server Anda
- Inspeksi gagal kritis dan near miss tinggi/kritis otomatis membuat CAPA

## Tahap 5 (Planning, Kanban, Laporan Harian, Man Power)
- Jalankan supabase/schema_tahap5.sql
- Planning: rencana alat (jam) dan tenaga kerja per tanggal, bisa offline
- Laporan harian: volume per pekerjaan; saat terkirim, trigger otomatis menambah realisasi dan menggeser status (todo, doing, done). Jam alat diambil dari hour-meter, tenaga kerja dari data man power (keduanya otomatis, butuh online untuk ditampilkan)
- Kanban: ubah status dan tambah pekerjaan hanya online (peran Supervisor, PM, Admin)
- Man power: input ulang tanggal yang sama menimpa data; LTI otomatis mereset hitungan safe man-hours di dashboard
- Kolom proyek: pastikan profiles.project_id terisi untuk semua pengguna

## Tahap 6 (Dokumen, Asisten HSE, Video AI) dan go-live
- Jalankan supabase/schema_tahap6.sql: dokumen berversi, hazard log, bucket Storage + kebijakannya, dan HARDENING (view mengikuti RLS, akses anonim dicabut)
- .env.local tambahan (server saja, JANGAN pakai awalan NEXT_PUBLIC): ANTHROPIC_API_KEY dan opsional ANTHROPIC_MODEL
- Asisten HSE memakai API route /api/ai (kunci API tidak pernah sampai ke browser). Bukan "model terlatih" khusus peraturan: ia memakai pengetahuan umum model dengan instruksi sistem. Untuk SOP internal, langkah lanjutan adalah RAG dari bucket documents
- Video AI Vision adalah MOCKUP. Ganti generateSample/analyze() dengan layanan deteksi sungguhan sebelum dipakai untuk keputusan keselamatan

### Daftar periksa sebelum dipakai di lapangan
1. Jalankan schema.sql lalu schema_tahap2 sampai schema_tahap6 berurutan
2. Isi projects, equipment, profiles (peran + project_id) untuk tiap pengguna
3. Aktifkan HTTPS (Vercel), tambahkan ikon PWA, uji "Add to Home Screen" di HP
4. Uji skenario: matikan internet, isi P2H + foto + near miss, nyalakan lagi, pastikan terkirim tanpa duplikat
5. Uji RBAC dengan akun tiap peran (field worker tidak boleh menutup CAPA atau menyetujui PTW)
6. Sesuaikan checklist P2H/PTW/inspeksi (templates.ts) dengan SOP perusahaan, dan tinjau oleh Ahli K3

## Tahap 6 (Dokumen, AI Assistant, Video AI Vision)
- Jalankan supabase/schema_tahap6.sql; buat bucket privat `documents`
- Salin .env.example menjadi .env.local dan isi. Kunci ANTHROPIC_API_KEY dan SUPABASE_SERVICE_ROLE_KEY hanya di server; di Vercel isi lewat Environment Variables
- Dokumen: versi tidak bisa diubah atau dihapus; unggah versi baru wajib catatan perubahan; unduh lewat tautan sementara 60 detik
- AI Assistant: /api/ai memeriksa login dan peran sebelum memanggil Claude. Tambahkan pembatasan laju (rate limit) sebelum dipakai banyak pengguna
- Video AI Vision: halaman adalah MOCKUP. Detektor nyata (model vision/CCTV) cukup mengirim POST ke /api/hse/hazard-log dengan header x-webhook-secret dan body
  {"category":"unsafe_act","label":"Tanpa helm","confidence":0.92,"camera":"CCTV Gerbang A"}

## Tahap 7 (Pengerasan, admin, seed, uji)
- Jalankan supabase/schema_tahap7.sql. File ini menutup celah penting: tanpa baris di profiles, pengguna tidak bisa membaca data; view memakai hak pemanggil; fungsi sensitif tidak bisa dipanggil anon; projects kini ber-RLS. Skrip ini belum diuji pada database Anda, jadi jalankan di proyek Supabase percobaan dulu dan baca hasilnya
- WAJIB: matikan pendaftaran mandiri di Supabase Auth (Allow new users to sign up). Akun dibuat Super Admin di /admin/pengguna
- Rate limit AI: AI_HOURLY_LIMIT (default 30 per pengguna per jam)
- Seed: isi SEED_PASSWORD di .env.local lalu `node --env-file=.env.local scripts/seed.mjs`. Hapus akun demo sebelum produksi
- Ikuti TESTING.md sebelum dipakai di lapangan
