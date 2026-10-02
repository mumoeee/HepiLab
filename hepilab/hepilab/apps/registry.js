/* registry.js — DAFTAR SEMUA APP. Home, menu header, dan service worker (offline) semuanya membaca file ini.
   Menambah app baru = 1) buat folder apps/<id>/ dengan index.html, 2) tambah satu baris di bawah. Selesai. */
globalThis.HL_APPS=[
 {id:'3d',     name:'3D Workspace',     icon:'⬡', path:'apps/3d/',     desc:'Modelkan objek, edit mesh, lalu Unfold jadi pola papercraft atau woodcraft.'},
 {id:'unfold', name:'Unfold', icon:'✂', path:'apps/unfold/', desc:'Ubah model 3D jadi pola papercraft ala Pepakura: potong/lipat edge, geser bagian, ekspor SVG.'},
 {id:'vector', name:'Vector Workspace', icon:'✒', path:'apps/vector/', desc:'Gambar vektor ala CorelDRAW: Bezier, node, layer, grup, ekspor SVG/PNG.'},
];
