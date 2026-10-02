# HepiLab

Alat kecil untuk **papercraft & woodcraft**, dibuat untuk dipakai di HP dan **tanpa internet**.
Isinya dua app terpisah dalam satu repository, dengan halaman Home sebagai pintu masuk:

| App | Fungsi |
|---|---|
| **3D Workspace** (`apps/3d`) | Model objek, edit mesh (vertex/edge/face), extrude, fill, snap, **Seam**, lalu **Unfold** jadi pola 2D |
| **Vector Workspace** (`apps/vector`) | Gambar vektor ala CorelDRAW: Bezier, node, layer, grup, snap grid, ekspor SVG/PNG |

Pola dari 3D bisa dikirim ke Vector dengan satu tombol (**Kirim ke Vector Workspace**).

## Cara menjalankan

Harus lewat server (bukan klik dua kali `index.html`), karena service worker dan antar-halaman butuh alamat `http://`.

```bash
python3 -m http.server 8000      # lalu buka http://localhost:8000
```

**Di HP (tanpa laptop):** upload repository ke GitHub → Settings → Pages → pilih branch `main` → buka alamatnya.
Buka **sekali saat online**, lalu pilih *Tambahkan ke layar utama*. Setelah itu semua app jalan offline.

## Struktur

```
hepilab/
├─ index.html · home.css · home.js     Halaman Home (kartu app dibuat otomatis dari registry)
├─ sw.js                               Service worker: offline untuk SEMUA app
├─ manifest.webmanifest · icons/       Supaya bisa dipasang di layar utama
├─ shared/                             Kode bersama — sengaja kecil dan stabil
│  ├─ base.css                         Tema & gaya dasar (warna ada di :root paling atas)
│  ├─ util.js                          $, clamp, toast, HL.download, HL.pickFile
│  ├─ transfer.js                      Jembatan data antar-app (HL.send / HL.take)
│  └─ shell.js                         Menu navigasi header + daftar service worker
└─ apps/
   ├─ registry.js                      ★ DAFTAR APP — satu-satunya tempat mendaftarkan app
   ├─ 3d/      index.html, style.css, js/   (core, camera, mesh, render, input, select, edit, ui, history, extras, unfold, main)
   └─ vector/  index.html, style.css, js/   (model, panels, tools, pointer, bezier, bezier-pointer, arrange, history, controls, main)
```

**Aturan emas:** app tidak boleh mengimpor file dari app lain. Kalau dua app perlu bicara, pakai `shared/transfer.js`.
Jadi mengubah `apps/3d` tidak akan menyentuh `apps/vector`, dan sebaliknya.

## Menambah app baru

1. Salin folder `apps/vector` jadi `apps/<nama-app>` sebagai titik awal (atau buat `index.html` kosong).
   Di `<body>` beri `data-app="<id>"`, dan muat `../../apps/registry.js`, `../../shared/util.js`, `../../shared/shell.js`.
2. Tambah satu baris di `apps/registry.js`:
   ```js
   {id:'nama', name:'Nama App', icon:'✦', path:'apps/nama-app/', desc:'Penjelasan singkat.'},
   ```
3. Selesai. Kartu di Home, menu di header semua app, dan cache offline ikut otomatis
   (service worker membaca `<script>`/`<link>` dari `index.html` app baru).

## Catatan penting saat mengembangkan

- **Semua file JS dalam satu app berbagi satu lingkup global** (script biasa, tanpa bundler). Urutan `<script>` di
  `index.html` penting; `main.js` selalu paling akhir. Nama variabel antar-file tidak boleh bentrok.
- File `extras.js` (3D) dan `bezier*.js` (Vector) *membungkus* fungsi lama (mis. `draw`, `shp`, `ui`).
  Bila suatu hari ingin merapikan, gabungkan isinya ke file induknya.
- **Menyimpan data:** proyek tersimpan otomatis di browser (`localStorage`: `hepilab3d`, `hepilab_vec`).
  Untuk cadangan, pakai menu **File → Simpan** (`.json`). Format file punya nomor versi (`v:1`); naikkan bila struktur berubah.
- **Update tidak muncul di HP?** Service worker memakai strategi *network-first*, jadi saat online biasanya langsung terbaru
  (GitHub Pages bisa menahan ±10 menit). Untuk memaksa: naikkan `VERSION` di `sw.js`.

## Pintasan

**3D:** G/R/S gizmo · Tab edit · 1/2/3 vertex/edge/face · E extrude · F fill · X hapus · Shift+D duplikat · A / Alt+A pilih semua / kosongkan · Ctrl+Z / Ctrl+Shift+Z undo / redo
**Vector:** V/N/R/C/L/Y/S/U/P/T alat · Ctrl+Z/Y undo/redo · Ctrl+G / Ctrl+Shift+G grup · Ctrl+D duplikat · Ctrl+A semua · panah geser (Shift = 10×) · Space+seret pan

## Ide berikutnya

Tab perekat (glue flap) & nomor edge di Unfold · ukuran nyata (mm) + ukuran kertas A4 · ekspor pola siap cetak · Undo untuk layer Vector.
