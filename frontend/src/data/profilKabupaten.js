const potensiPool = [
    'Lahan pertanian dan perkebunan',
    'Pariwisata alam dan budaya',
    'Perikanan dan hasil laut',
    'Kerajinan dan industri kecil',
    'Hutan dan agroforestri',
    'Peternakan rakyat',
    'Wisata religi dan sejarah',
    'Energi terbarukan skala desa',
  ]
  
  const programPool = [
    {
      judul: 'Layanan Kesehatan Terpadu Masyarakat',
      bidang: 'Kesehatan',
      deskripsi:
        'Pemeriksaan kesehatan berkala, edukasi gizi keluarga, dan penyuluhan sanitasi bersama puskesmas setempat.',
    },
    {
      judul: 'Pemerataan Akses Internet dan Informasi Desa',
      bidang: 'Akses Internet',
      deskripsi:
        'Titik Wi-Fi publik di fasilitas desa dan pusat informasi digital untuk pembelajaran dan layanan administrasi.',
    },
    {
      judul: 'Pengolahan Hasil Pertanian dan Pengembangan UMKM',
      bidang: 'Kemiskinan',
      deskripsi:
        'Pelatihan pengolahan produk lokal bernilai tambah, disertai pendampingan pengemasan dan pemasaran.',
    },
    {
      judul: 'Program Beasiswa dan Pendampingan Belajar',
      bidang: 'Pendidikan',
      deskripsi:
        'Bantuan perlengkapan sekolah dan pendamping belajar bagi siswa dari keluarga kurang mampu.',
    },
    {
      judul: 'Perbaikan Jalan Lingkungan dan Sanitasi',
      bidang: 'Infrastruktur',
      deskripsi:
        'Perbaikan akses jalan, saluran air, dan fasilitas sanitasi untuk meningkatkan kualitas hidup warga.',
    },
  ]
  
  const bidang = ['Kemiskinan', 'Pendidikan', 'Kesehatan', 'Infrastruktur', 'Akses Internet']
  const bobot = { Kemiskinan: 25, Pendidikan: 20, Kesehatan: 20, Infrastruktur: 20, 'Akses Internet': 20 }
  
  // pengacak yang hasilnya selalu sama untuk wilayah yang sama
  function acak(seed) {
    let h = 2166136261
    for (const c of seed) {
      h ^= c.charCodeAt(0)
      h = Math.imul(h, 16777619)
    }
    let a = h >>> 0
    return () => {
      a = (a + 0x6d2b79f5) >>> 0
      let t = a
      t = Math.imul(t ^ (t >>> 15), t | 1)
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
  }
  
  const cache = new Map()
  
  // SEMENTARA: data demonstratif. Nanti diganti respons API Laravel.
  export function buatProfil(props) {
    if (cache.has(props.id)) return cache.get(props.id)
  
    const r = acak(props.id + props.label)
    const kesenjangan = bidang.map((label) => ({ label, nilai: Math.round(30 + r() * 65) }))
    const nilaiDari = (label) => kesenjangan.find((k) => k.label === label).nilai
    const totalBobot = Object.values(bobot).reduce((a, b) => a + b, 0)
    const indeks = Math.round(
      kesenjangan.reduce((s, k) => s + k.nilai * bobot[k.label], 0) / totalBobot
    )
  
    const [jenis, ...sisa] = props.label.split(' ')
  
    const profil = {
      id: props.id,
      jenis,
      nama: sisa.join(' '),
      kabupaten: 'Provinsi Jawa Tengah',
      penduduk: Math.round(90000 + r() * 1700000),
      luas: Math.round(3000 + r() * 150000).toLocaleString('id-ID'),
      indeksUrgensi: indeks,
      kesenjangan,
      potensi: [...potensiPool].sort(() => r() - 0.5).slice(0, 3),
      saranProgram: programPool.map((p) => ({
        ...p,
        skor: Math.min(98, Math.round(55 + nilaiDari(p.bidang) * 0.42 + r() * 4)),
        biaya: Math.round(5 + r() * 75),
        relawan: Math.round(8 + r() * 42),
        hari: Math.round(28 + r() * 150),
      })),
    }
  
    cache.set(props.id, profil)
    return profil
  }
  
  export function nilaiIndikator(props, label) {
    return buatProfil(props).kesenjangan.find((k) => k.label === label)?.nilai ?? 0
  }