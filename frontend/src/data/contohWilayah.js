export const daftarWilayah = [
    {
      id: 'kalirejo-batang',
      jenis: 'Desa',
      nama: 'Kalirejo',
      kabupaten: 'Kabupaten Batang',
      posisi: [-7.05, 109.85], // koordinat perkiraan, hanya untuk contoh
      penduduk: 7295,
      luas: 931.98,
      indeksUrgensi: 79,
      kesenjangan: [
        { label: 'Kemiskinan', nilai: 62 },
        { label: 'Pendidikan', nilai: 80 },
        { label: 'Kesehatan', nilai: 47 },
        { label: 'Infrastruktur', nilai: 95 },
        { label: 'Akses Internet', nilai: 50 },
      ],
      potensi: [
        'Lahan pertanian dan perkebunan',
        'Panorama pegunungan dan persawahan',
        'Pariwisata alam air mancur',
      ],
      saranProgram: [
        {
          judul: 'Layanan Kesehatan Terpadu Masyarakat',
          bidang: 'Kesehatan',
          skor: 94,
          deskripsi:
            'Pelaksanaan pemeriksaan kesehatan berkala, edukasi gizi keluarga, dan penyuluhan sanitasi melalui kerja sama dengan puskesmas atau tenaga kesehatan setempat.',
            biaya: 13,
            relawan: 8,
            hari: 42,
        },
        {
          judul: 'Pemerataan Akses Internet dan Informasi Desa',
          bidang: 'Akses Internet',
          skor: 89,
          deskripsi:
            'Penyediaan titik Wi-Fi publik di fasilitas desa dan pengembangan pusat informasi digital untuk mendukung pembelajaran, layanan administrasi, serta akses informasi masyarakat.',
          biaya: 5,
          relawan: 15,
          hari: 28,
        },
        {
          judul: 'Pengolahan Hasil Pertanian dan Pengembangan UMKM',
          bidang: 'Kemiskinan',
          skor: 90,
          deskripsi:
            'Pelatihan pengolahan hasil pertanian dan perkebunan menjadi produk bernilai tambah, disertai pendampingan pengemasan dan pemasaran melalui toko lokal maupun platform digital.',
          biaya: 21,
          relawan: 10,
          hari: 84,
        },
        {
          judul: 'Program Beasiswa dan Pendampingan Belajar',
          bidang: 'Pendidikan',
          skor: 87,
          deskripsi:
            'Pemberian bantuan perlengkapan sekolah dan pendamping belajar bagi siswa dari keluarga kurang mampu untuk meningkatkan kesempatan pendidikan.',
          biaya: 55,
          relawan: 20,
          hari: 182,
        },
        {
          judul: 'Penataan Destinasi Wisata Berbasis Potensi Lokal',
          bidang: 'Infrastruktur',
          skor: 82,
          deskripsi:
            'Penataan akses dan fasilitas wisata di kawasan air mancur serta panorama persawahan, disertai promosi destinasi untuk meningkatkan kunjungan dan peluang usaha warga.',
          biaya: 75,
          relawan: 50,
          hari: 56,
        },
      ],
    },
    {
      id: 'sumberrejo-blora',
      jenis: 'Desa',
      nama: 'Sumberrejo',
      kabupaten: 'Kabupaten Blora',
      posisi: [-7.0, 111.4], // koordinat perkiraan
      penduduk: 5120,
      luas: 640.5,
      indeksUrgensi: 85,
      kesenjangan: [
        { label: 'Kemiskinan', nilai: 78 },
        { label: 'Pendidikan', nilai: 70 },
        { label: 'Kesehatan', nilai: 88 },
        { label: 'Infrastruktur', nilai: 60 },
        { label: 'Akses Internet', nilai: 72 },
      ],
      potensi: ['Lahan jati dan pertanian', 'Wisata edukasi budaya lokal'],
      saranProgram: [
        {
          judul: 'Posyandu Keliling dan Layanan Gizi',
          bidang: 'Kesehatan',
          skor: 96,
          deskripsi: 'Pemeriksaan kesehatan keliling dan edukasi gizi untuk dusun terpencil.',
          biaya: 30,
          relawan: 12,
          hari: 60,
        },
        {
          judul: 'Pelatihan Usaha Mikro Berbasis Hasil Hutan',
          bidang: 'Kemiskinan',
          skor: 91,
          deskripsi: 'Pelatihan pengolahan produk lokal dan pendampingan pemasaran.',
          biaya: 25,
          relawan: 10,
          hari: 70,
        },
        {
          judul: 'Pusat Belajar Digital Desa',
          bidang: 'Akses Internet',
          skor: 84,
          deskripsi: 'Penyediaan perangkat dan jaringan untuk kegiatan belajar warga.',
          biaya: 15,
          relawan: 8,
          hari: 35,
        },
      ],
    },
  ]

// SEMENTARA: mencari wilayah contoh terdekat dari titik yang diklik.
// Nanti diganti: cek poligon desa yang memuat titik (GeoJSON) atau panggil API Laravel.
export function cariWilayahTerdekat(latlng) {
  let terdekat = null
  let jarakMin = Infinity

  for (const w of daftarWilayah) {
    const jarak = (w.posisi[0] - latlng.lat) ** 2 + (w.posisi[1] - latlng.lng) ** 2
    if (jarak < jarakMin) {
      jarakMin = jarak
      terdekat = w
    }
  }
  return terdekat
}

// SEMENTARA: nanti diganti panggilan API (GET /api/wilayah/:id)
export function cariWilayahById(id) {
  return daftarWilayah.find((w) => w.id === id) ?? null
}