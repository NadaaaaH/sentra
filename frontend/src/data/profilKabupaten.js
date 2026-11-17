const LABEL_KELAS = { 1: 'Aman', 2: 'Ringan', 3: 'Sedang', 4: 'Urgent', 5: 'Sangat Urgent' }

// Kode BPS berdasarkan nama wilayah (id di jateng.json itu kode singkat, bukan kode BPS)
const KODE_BY_NAMA = {
  cilacap: '3301', banyumas: '3302', purbalingga: '3303', banjarnegara: '3304',
  kebumen: '3305', purworejo: '3306', wonosobo: '3307', magelang: '3308',
  boyolali: '3309', klaten: '3310', sukoharjo: '3311', wonogiri: '3312',
  karanganyar: '3313', sragen: '3314', grobogan: '3315', blora: '3316',
  rembang: '3317', pati: '3318', kudus: '3319', jepara: '3320',
  demak: '3321', semarang: '3322', temanggung: '3323', kendal: '3324',
  batang: '3325', pekalongan: '3326', pemalang: '3327', tegal: '3328',
  brebes: '3329',
  'kota magelang': '3371', 'kota surakarta': '3372', 'kota solo': '3372',
  'kota salatiga': '3373', 'kota semarang': '3374',
  'kota pekalongan': '3375', 'kota tegal': '3376',
}

// Data penduduk (jiwa) & luas (km²) kabupaten/kota. Sumber: BPS (perlu diverifikasi).
const dataBPS = {
  '3301': { penduduk: 2007830, luas: 2124.5 },
  '3302': { penduduk: 1828570, luas: 1335.3 },
  '3303': { penduduk: 1027330, luas: 677.5 },
  '3304': { penduduk: 1047230, luas: 1023.7 },
  '3305': { penduduk: 1397560, luas: 1211.7 },
  '3306': { penduduk: 788270, luas: 1091.5 },
  '3307': { penduduk: 909660, luas: 981.4 },
  '3308': { penduduk: 1330660, luas: 1102.9 },
  '3309': { penduduk: 1090130, luas: 1008.5 },
  '3310': { penduduk: 1284390, luas: 658.2 },
  '3311': { penduduk: 932680, luas: 489.1 },
  '3312': { penduduk: 1051090, luas: 1793.7 },
  '3313': { penduduk: 955120, luas: 775.4 },
  '3314': { penduduk: 997490, luas: 941.5 },
  '3315': { penduduk: 1492890, luas: 2013.9 },
  '3316': { penduduk: 901620, luas: 1804.6 },
  '3317': { penduduk: 660170, luas: 887.1 },
  '3318': { penduduk: 1359360, luas: 1489.2 },
  '3319': { penduduk: 874630, luas: 425.1 },
  '3320': { penduduk: 1221090, luas: 1059.2 },
  '3321': { penduduk: 1240510, luas: 900.1 },
  '3322': { penduduk: 1080650, luas: 950.2 },
  '3323': { penduduk: 808450, luas: 837.7 },
  '3324': { penduduk: 1052830, luas: 1118.1 },
  '3325': { penduduk: 828880, luas: 788.6 },
  '3326': { penduduk: 1007380, luas: 837.0 },
  '3327': { penduduk: 1523620, luas: 1118.0 },
  '3328': { penduduk: 1654840, luas: 876.1 },
  '3329': { penduduk: 2043080, luas: 1902.4 },
  '3371': { penduduk: 122150, luas: 16.1 },
  '3372': { penduduk: 526870, luas: 46.0 },
  '3373': { penduduk: 198920, luas: 57.4 },
  '3374': { penduduk: 1694740, luas: 373.8 },
  '3375': { penduduk: 317520, luas: 45.2 },
  '3376': { penduduk: 282780, luas: 39.7 },
}

// Cari kode BPS 4 digit dari properti feature kabupaten
export function getKodeKab(props) {
  if (props.kode_kab) return String(props.kode_kab).replace('.0', '').trim()
  if (props.kode) return String(props.kode).replace('.0', '').trim()
  if (props.id && /^\d{4}$/.test(props.id)) return props.id
  const nama = (props.label || props.nama || '')
    .toLowerCase()
    .replace(/^(kabupaten|kab\.)\s+/, '')
    .trim()
  return KODE_BY_NAMA[nama] ?? null
}

const cache = new Map()

// Profil dasar kabupaten/kota. Indeks urgensi & indikator diisi dari API (detailKabupaten).
export function buatProfil(props) {
  const kodeKab = getKodeKab(props)
  const kunci = kodeKab ?? props.id
  if (cache.has(kunci)) return cache.get(kunci)

  const label = props.label || props.nama || ''
  const jenis = /^kota\b/i.test(label) ? 'Kota' : 'Kabupaten'
  const nama = label.replace(/^(kabupaten|kota|kab\.)\s+/i, '')
  const bps = dataBPS[kodeKab] ?? null

  const profil = {
    id: props.id,
    kodeKab,
    jenis,
    nama,
    kabupaten: 'Provinsi Jawa Tengah',
    penduduk: bps?.penduduk ?? null,
    luas: bps?.luas ?? null, // km²
    indeksUrgensi: 0,        // diisi dari BE (skala 1-5)
    kesenjangan: [],         // diisi dari BE
    potensi: [],
    saranProgram: [],
  }

  cache.set(kunci, profil)
  return profil
}

export function nilaiIndikator(props, label) {
  return buatProfil(props).kesenjangan.find((k) => k.label === label)?.nilai ?? 0
}

// Dipakai ProfilWilayah: ambil penduduk & luas berdasarkan kode BPS 4 digit
export function ambilDataBPS(kode) {
  return dataBPS[String(kode)] ?? null
}