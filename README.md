# HepiLab

Buka `index.html` langsung di browser (klik dua kali), tidak perlu install apa pun.

| File | Isi |
|---|---|
| `index.html` | Kerangka halaman (header, tab, panel, modal unfold) |
| `style.css` | Semua gaya tampilan; warna utama ada di variabel `:root` |
| `js/core.js` | Helper umum + pindah tab 3D/Vector (dimuat pertama) |
| `js/workspace3d.js` | Workspace 3D: kamera, renderer, gizmo, edit mesh |
| `js/unfold.js` | Mesh 3D -> pola 2D, modal hasil, kirim ke Vector |
| `js/vector.js` | Workspace Vector (SVG): shape, layer, tool, panel |
| `js/main.js` | Pintasan keyboard + inisialisasi (dimuat terakhir) |

Urutan `<script>` di `index.html` jangan diubah: core -> workspace3d -> unfold -> vector -> main.
