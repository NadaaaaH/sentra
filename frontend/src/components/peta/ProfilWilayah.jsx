import {
  X, BookOpen, Activity, MapPin, Users, Ruler, Lightbulb, CircleAlert, FileText,
} from 'lucide-react'
import { ambilDataBPS } from '../../data/profilKabupaten'

// Warna kelas urgensi (sama dengan peta desa)
const WARNA_KELAS = {
  0: '#cccccc', 1: '#2c7bb6', 2: '#abd9e9', 3: '#e6e68a', 4: '#fdae61', 5: '#d7191c',
}
const NAMA_KELAS = {
  0: 'Belum dinilai', 1: 'Aman', 2: 'Ringan', 3: 'Sedang', 4: 'Urgent', 5: 'Sangat urgent',
}
const teksKelas = (k) => (k === 1 || k === 5 ? '#FFFFFF' : '#1f2937')

// Kode BPS -> nama (jaga-jaga kalau `kabupaten` isinya masih kode)
const NAMA_KAB = {
  '3301': 'Kab. Cilacap', '3302': 'Kab. Banyumas', '3303': 'Kab. Purbalingga',
  '3304': 'Kab. Banjarnegara', '3305': 'Kab. Kebumen', '3306': 'Kab. Purworejo',
  '3307': 'Kab. Wonosobo', '3308': 'Kab. Magelang', '3309': 'Kab. Boyolali',
  '3310': 'Kab. Klaten', '3311': 'Kab. Sukoharjo', '3312': 'Kab. Wonogiri',
  '3313': 'Kab. Karanganyar', '3314': 'Kab. Sragen', '3315': 'Kab. Grobogan',
  '3316': 'Kab. Blora', '3317': 'Kab. Rembang', '3318': 'Kab. Pati',
  '3319': 'Kab. Kudus', '3320': 'Kab. Jepara', '3321': 'Kab. Demak',
  '3322': 'Kab. Semarang', '3323': 'Kab. Temanggung', '3324': 'Kab. Kendal',
  '3325': 'Kab. Batang', '3326': 'Kab. Pekalongan', '3327': 'Kab. Pemalang',
  '3328': 'Kab. Tegal', '3329': 'Kab. Brebes',
  '3371': 'Kota Magelang', '3372': 'Kota Surakarta', '3373': 'Kota Salatiga',
  '3374': 'Kota Semarang', '3375': 'Kota Pekalongan', '3376': 'Kota Tegal',
}

// Tingkat keparahan per bidang (nilai 0-100). Sengaja tanpa hijau supaya
// angka kecil pun tidak terkesan "aman", karena ini ukuran masalah.
function tingkatKeparahan(n) {
  if (n >= 75) return { nama: 'Sangat berat', warna: '#7F1D1D' }
  if (n >= 50) return { nama: 'Berat', warna: '#DC2626' }
  if (n >= 25) return { nama: 'Sedang', warna: '#F97316' }
  return { nama: 'Ringan', warna: '#FBBF24' }
}

// Pastikan urgensi selalu di skala 1-5. Kalau BE masih mengirim 0-100, konversi dulu.
function normalisasiUrgensi(n) {
  const v = Number(n) || 0
  if (v <= 5) return v
  if (v >= 80) return 5
  if (v >= 60) return 4
  if (v >= 40) return 3
  if (v >= 20) return 2
  return 1
}

const adaIsi = (arr) => Array.isArray(arr) && arr.length > 0

const LABEL_BIDANG = {
  kesehatan: 'Kesehatan',
  pendidikan: 'Pendidikan',
  internet: 'Akses Internet',
  infrastruktur: 'Infrastruktur',
  ekonomi: 'Ekonomi',
}

function formatAnggaran(nilai) {
  return nilai == null ? 'Belum tersedia' : `Rp${Number(nilai).toLocaleString('id-ID')}`
}

function formatJarak(km) {
  if (km === null || km === undefined || km === '') return 'Belum tersedia'
  const jarak = Number(km)
  return Number.isFinite(jarak)
    ? `${jarak.toLocaleString('id-ID', { maximumFractionDigits: 2 })} km`
    : 'Belum tersedia'
}

// Delay animasi bertahap (stagger) untuk tiap blok
const tunda = (ms) => ({ animationDelay: `${ms}ms` })

// ===== Semua animasi + sembunyikan scrollbar (CSS murni, tanpa mengubah logika) =====
const CSS_PROFIL = `
/* Hilangkan scrollbar tapi tetap bisa di-scroll */
.profil-scroll { scrollbar-width: none; -ms-overflow-style: none; }
.profil-scroll::-webkit-scrollbar { display: none; width: 0; height: 0; }

/* Cincin: berputar 1 kali lalu terisi sesuai nilai */
@keyframes gauge-putar {
  from { transform: rotate(-450deg); }
  to   { transform: rotate(-90deg); }
}
@keyframes gauge-isi {
  from { stroke-dashoffset: var(--gauge-penuh); }
  to   { stroke-dashoffset: var(--gauge-target); }
}
.gauge-svg {
  transform: rotate(-90deg);
  animation: gauge-putar 1.6s cubic-bezier(0.22, 1, 0.36, 1) 0.25s both;
}
.gauge-arc {
  stroke-dashoffset: var(--gauge-target);
  animation: gauge-isi 1.6s cubic-bezier(0.22, 1, 0.36, 1) 0.25s both;
}

/* Angka di tengah cincin */
@keyframes angka-muncul {
  from { opacity: 0; transform: scale(0.5); }
  to   { opacity: 1; transform: scale(1); }
}
.gauge-angka { animation: angka-muncul 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.9s both; }

/* Badge label urgensi */
@keyframes badge-pop {
  0%   { opacity: 0; transform: scale(0.6) translateY(4px); }
  70%  { transform: scale(1.08); }
  100% { opacity: 1; transform: scale(1); }
}
.badge-pop { animation: badge-pop 0.5s ease-out 1s both; }

/* Blok muncul naik pelan-pelan */
@keyframes muncul-naik {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}
.muncul { animation: muncul-naik 0.55s cubic-bezier(0.22, 1, 0.36, 1) both; }

@keyframes titik-memuat {
  0%, 80%, 100% { opacity: 0.25; transform: translateY(0); }
  40% { opacity: 1; transform: translateY(-4px); }
}
.loading-dots-card {
  display: flex;
  min-height: 56px;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.7);
  color: #355f3a;
}
.loading-dot { animation: titik-memuat 0.9s ease-in-out infinite; }
.loading-dot:nth-child(2) { animation-delay: 0.15s; }
.loading-dot:nth-child(3) { animation-delay: 0.3s; }

@keyframes bagian-memudar {
  from { opacity: 0; }
  to { opacity: 1; }
}
.bagian-fade-in { animation: bagian-memudar 0.2s ease-out both; }

/* Batang keparahan tumbuh dari kiri */
@keyframes bar-tumbuh {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}
.bar-isi { transform-origin: left center; animation: bar-tumbuh 0.9s cubic-bezier(0.22, 1, 0.36, 1) both; }

/* Lingkaran dekorasi header melayang pelan */
@keyframes melayang {
  0%, 100% { transform: translate(0, 0); }
  50%      { transform: translate(-8px, 10px); }
}
.dekor-melayang { animation: melayang 7s ease-in-out infinite; }

/* Kartu: sedikit terangkat saat disentuh */
.kartu-hidup { transition: transform 0.25s ease, box-shadow 0.25s ease; }
.kartu-hidup:hover { transform: translateY(-2px); box-shadow: 0 10px 22px -10px rgba(0, 0, 0, 0.25); }

@media (prefers-reduced-motion: reduce) {
  .gauge-svg, .gauge-arc, .gauge-angka, .badge-pop, .muncul, .bar-isi, .dekor-melayang,
  .loading-dot, .bagian-fade-in {
    animation: none !important;
  }
}
`

function Gauge({ persen, warna, children }) {
  const r = 38
  const c = 2 * Math.PI * r
  const isi = c - (c * Math.min(100, Math.max(0, persen))) / 100
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg
        viewBox="0 0 96 96"
        className="gauge-svg h-full w-full"
        style={{ filter: `drop-shadow(0 0 6px ${warna}66)` }}
      >
        <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="9" />
        <circle
          className="gauge-arc"
          cx="48" cy="48" r={r} fill="none" stroke={warna} strokeWidth="9"
          strokeLinecap="round" strokeDasharray={c}
          style={{ '--gauge-penuh': c, '--gauge-target': isi }}
        />
      </svg>
      <div className="gauge-angka absolute inset-0 flex flex-col items-center justify-center text-sentra-cream">
        {children}
      </div>
    </div>
  )
}

function Judul({ ikon: Ikon, children }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sentra-green/10 text-sentra-green">
        <Ikon size={16} />
      </span>
      <h3 className="text-base font-bold tracking-wide">{children}</h3>
    </div>
  )
}

function Kosong({ children }) {
  return (
    <p className="rounded-xl border border-dashed border-gray-300 bg-white/60 px-3 py-3 text-xs text-gray-500">
      {children}
    </p>
  )
}

function LoadingDots({ label }) {
  return (
    <div className="loading-dots-card" role="status" aria-label={label}>
      <span className="loading-dot text-3xl font-bold leading-none" aria-hidden="true">.</span>
      <span className="loading-dot text-3xl font-bold leading-none" aria-hidden="true">.</span>
      <span className="loading-dot text-3xl font-bold leading-none" aria-hidden="true">.</span>
    </div>
  )
}

function PesanGagal({ children }) {
  return (
    <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-xs text-red-700">
      {children}
    </p>
  )
}

function ProfilWilayah({
  wilayah,
  fasilitas,
  fasilitasLoading,
  fasilitasError,
  detailDesa,
  detailDesaLoading,
  detailDesaError,
  tahapTampil,
  recommendations,
  recommendationsLoading,
  recommendationsError,
  recommendationContext,
  onClearRecommendationContext,
  detailKabupaten,
  detailKabupatenLoading,
  detailKabupatenError,
  onClose,
}) {
  const isDesa = wilayah?.jenis === 'Desa'
  const rekomendasiTampil = isDesa && tahapTampil >= 4 && !recommendationsLoading

  const profilTampil =
    isDesa && detailDesa
      ? { ...wilayah, ...detailDesa, kabupaten: wilayah?.kabupaten ?? detailDesa.kabupaten }
      : !isDesa && detailKabupaten
        ? { ...wilayah, ...detailKabupaten, kabupaten: 'Provinsi Jawa Tengah' }
        : wilayah

  // ----- Penduduk & luas kabupaten/kota: dicari lewat kode BPS dari BE -----
  const kodeKab = !isDesa ? (detailKabupaten?.kodeKab ?? wilayah?.kodeKab) : null
  const bps = kodeKab ? ambilDataBPS(kodeKab) : null
  const penduduk = profilTampil?.penduduk || bps?.penduduk || null
  const luas = profilTampil?.luas || bps?.luas || null

  // ----- Indeks urgensi (skala 1-5) -----
  const nilaiUrgensi = isDesa
    ? Number(wilayah?.kelas) || 0
    : normalisasiUrgensi(profilTampil?.indeksUrgensi)
  const kelasBulat = Math.min(5, Math.max(0, Math.round(nilaiUrgensi)))
  const warnaGauge = WARNA_KELAS[kelasBulat]
  const persen = (nilaiUrgensi / 5) * 100
  const labelUrgensi = isDesa
    ? profilTampil?.labelUrgensi || NAMA_KELAS[kelasBulat]
    : NAMA_KELAS[kelasBulat]
  const teksNilai = nilaiUrgensi.toLocaleString('id-ID', { maximumFractionDigits: 1 })
  const menungguIndeks = !isDesa && nilaiUrgensi === 0 && detailKabupatenLoading

  const namaKab = NAMA_KAB[String(profilTampil?.kabupaten)] ?? profilTampil?.kabupaten

  const indikatorPerhatian = Array.isArray(detailDesa?.indikatorPerhatian)
    ? detailDesa.indikatorPerhatian
    : []

  return (
    <>
      <style>{CSS_PROFIL}</style>
      <aside className="profil-scroll animasi-profil absolute inset-x-0 bottom-0 top-16 z-[1000] w-full overflow-y-auto rounded-t-3xl bg-sentra-cream shadow-2xl md:inset-x-auto md:bottom-5 md:right-12 md:top-9 md:w-[440px] md:rounded-3xl">
        {/* ===== HEADER ===== */}
        <div className="relative overflow-hidden bg-gradient-to-br from-sentra-green to-sentra-green/90 px-5 pb-5 pt-5 text-sentra-cream">
          <div className="dekor-melayang pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div
            className="dekor-melayang pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-white/5"
            style={{ animationDelay: '-3s' }}
          />

          <div className="muncul relative flex items-center justify-between">
            <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold tracking-[0.25em] backdrop-blur-sm">
              {isDesa ? 'PROFIL DESA' : 'PROFIL WILAYAH'}
            </span>
            <button
              onClick={onClose}
              aria-label="Tutup profil"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/15 transition duration-300 hover:rotate-90 hover:bg-white/30 active:scale-90"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <h2 className="muncul relative mt-4 text-3xl font-bold leading-tight" style={tunda(80)}>
            {profilTampil?.jenis} {profilTampil?.nama}
          </h2>
          {namaKab && (
            <p
              className="muncul relative mt-1 flex items-center gap-1.5 text-sm text-sentra-cream/80"
              style={tunda(140)}
            >
              <MapPin size={14} /> {namaKab}
            </p>
          )}

          {/* Penduduk & luas: hanya kabupaten/kota */}
          {!isDesa && (
            <div className="muncul relative mt-4 grid grid-cols-2 gap-3" style={tunda(200)}>
              <div className="rounded-2xl bg-white/10 px-3 py-2.5 ring-1 ring-white/15 backdrop-blur-sm">
                <p className="flex items-center gap-1.5 text-[11px] text-sentra-cream/70">
                  <Users size={12} /> Penduduk
                </p>
                <p className="mt-0.5 text-lg font-bold">
                  {penduduk ? Number(penduduk).toLocaleString('id-ID') : '-'}
                  <span className="ml-1 text-xs font-normal text-sentra-cream/70">jiwa</span>
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 px-3 py-2.5 ring-1 ring-white/15 backdrop-blur-sm">
                <p className="flex items-center gap-1.5 text-[11px] text-sentra-cream/70">
                  <Ruler size={12} /> Luas
                </p>
                <p className="mt-0.5 text-lg font-bold">
                  {luas ? Number(luas).toLocaleString('id-ID', { maximumFractionDigits: 1 }) : '-'}
                  <span className="ml-1 text-xs font-normal text-sentra-cream/70">km²</span>
                </p>
              </div>
            </div>
          )}

          {/* Indeks urgensi */}
          <div
            className="muncul relative mt-4 flex items-center gap-4 rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur-sm"
            style={tunda(240)}
          >
            {/* key: animasi diputar ulang kalau nilai/wilayah berubah */}
            <Gauge key={`${profilTampil?.nama}-${nilaiUrgensi}`} persen={persen} warna={warnaGauge}>
              {menungguIndeks ? (
                <span className="text-xs text-sentra-cream/70">Memuat…</span>
              ) : nilaiUrgensi > 0 ? (
                <>
                  <span className="text-2xl font-bold leading-none">{teksNilai}</span>
                  <span className="text-[10px] text-sentra-cream/70">dari 5</span>
                </>
              ) : (
                <span className="text-xl font-bold leading-none">-</span>
              )}
            </Gauge>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-sentra-cream/70">
                Indeks Urgensi
              </p>
              <span
                key={`badge-${labelUrgensi}`}
                className="badge-pop mt-1 inline-block rounded-full px-3 py-1 text-sm font-bold shadow-md"
                style={{ background: warnaGauge, color: teksKelas(kelasBulat) }}
              >
                {menungguIndeks ? 'Menghitung…' : labelUrgensi}
              </span>
              <p className="mt-2 text-[10px] leading-snug text-sentra-cream/70">
                {isDesa
                  ? 'Skala 1–5 (1 = aman, 5 = sangat urgent), sesuai warna pada peta.'
                  : 'Skala 1–5 (1 = aman, 5 = sangat urgent), rata-rata dari seluruh desa/kelurahan di wilayah ini.'}
              </p>
            </div>
          </div>
        </div>

        {/* ===== ISI ===== */}
        <div className="space-y-8 px-5 py-6 pb-10 text-black">
          {/* FASILITAS (khusus desa) */}
          {isDesa && (
            <section className="muncul" style={tunda(320)}>
              <Judul ikon={MapPin}>Fasilitas Desa</Judul>
              {fasilitasLoading ? (
                <LoadingDots label="Memuat fasilitas desa" />
              ) : fasilitasError ? (
                <PesanGagal>{fasilitasError}</PesanGagal>
              ) : fasilitas ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="kartu-hidup flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
                      <div className="rounded-xl bg-blue-100 p-2.5 text-blue-600">
                        <BookOpen size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-gray-500">Pendidikan</p>
                        <p className="text-xl font-bold leading-tight">
                          {fasilitas.total_sekolah}{' '}
                          <span className="text-xs font-normal text-gray-500">sekolah</span>
                        </p>
                      </div>
                    </div>
                    <div className="kartu-hidup flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
                      <div className="rounded-xl bg-red-100 p-2.5 text-red-600">
                        <Activity size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-gray-500">Kesehatan</p>
                        <p className="text-xl font-bold leading-tight">
                          {fasilitas.total_faskes}{' '}
                          <span className="text-xs font-normal text-gray-500">faskes</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {fasilitas.detail_sekolah?.length > 0 && (
                    <div className="kartu-hidup mt-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
                      <p className="mb-2 text-xs font-semibold text-gray-700">
                        Beberapa sekolah di desa ini
                      </p>
                      <ul className="space-y-1.5">
                        {fasilitas.detail_sekolah.slice(0, 3).map((s, i) => (
                          <li
                            key={s.id}
                            className="muncul flex items-start gap-2 text-[12px] text-gray-600"
                            style={tunda(450 + i * 90)}
                          >
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                            <span className="leading-tight">
                              {s.nama}{' '}
                              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                                {s.jenjang}
                              </span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <Kosong>Data fasilitas belum tersedia.</Kosong>
              )}

              <div className="kartu-hidup mt-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
                <p className="mb-2 text-xs font-semibold text-gray-700">Jarak fasilitas terdekat</p>
                {detailDesaLoading || tahapTampil < 1 ? (
                  <LoadingDots label="Memuat jarak fasilitas terdekat" />
                ) : detailDesaError ? (
                  <PesanGagal>Gagal memuat jarak fasilitas.</PesanGagal>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-blue-50 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-gray-500">Pendidikan</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                        <p className="text-sm font-bold text-gray-800">
                          {formatJarak(detailDesa?.jarakSekolahKm)}
                        </p>
                        {indikatorPerhatian.includes('pendidikan') && (
                          <span
                            className="inline-flex animate-pulse items-center gap-0.5 text-[10px] font-semibold text-red-600"
                            aria-label="Perlu perhatian: jarak sekolah lebih dari 1 km"
                            title="Jarak sekolah lebih dari 1 km"
                          >
                            <CircleAlert size={13} aria-hidden="true" />
                            Perlu perhatian!
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500">sekolah terdekat</p>
                    </div>
                    <div className="rounded-xl bg-red-50 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-gray-500">Kesehatan</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                        <p className="text-sm font-bold text-gray-800">
                          {formatJarak(detailDesa?.jarakFaskesKm)}
                        </p>
                        {indikatorPerhatian.includes('kesehatan') && (
                          <span
                            className="inline-flex animate-pulse items-center gap-0.5 text-[10px] font-semibold text-red-600"
                            aria-label="Perlu perhatian: jarak fasilitas kesehatan lebih dari 3 km"
                            title="Jarak fasilitas kesehatan lebih dari 3 km"
                          >
                            <CircleAlert size={13} aria-hidden="true" />
                            Perlu perhatian!
                          </span>
                        )}
                      </div>
                      <p className="truncate text-[10px] text-gray-500">
                        {detailDesa?.faskesTerdekat
                          ? `${detailDesa.faskesTerdekat}${detailDesa.tipeFaskesTerdekat ? ` · ${detailDesa.tipeFaskesTerdekat}` : ''}`
                          : 'faskes terdekat'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* TINGKAT KEPARAHAN PER BIDANG */}
          <section
            className={isDesa ? (tahapTampil >= 2 ? 'bagian-fade-in' : '') : 'muncul'}
            style={!isDesa ? tunda(320) : undefined}
          >
            <Judul ikon={Activity}>Tingkat Keparahan</Judul>

            {!isDesa && detailKabupaten && (
              <p className="mb-2 text-xs text-gray-500">
                Desa dengan kelas Sangat Urgent:{' '}
                <span className="font-semibold text-red-600">
                  {detailKabupaten.jumlahDesaUrgent} dari {detailKabupaten.jumlahDesa}
                </span>{' '}
                desa/kelurahan.
              </p>
            )}

            {isDesa && (detailDesaLoading || tahapTampil < 2) ? (
              <LoadingDots label="Memuat tingkat keparahan" />
            ) : isDesa && detailDesaError ? (
              <PesanGagal>Gagal memuat tingkat keparahan.</PesanGagal>
            ) : !isDesa && detailKabupatenLoading ? (
              <LoadingDots label="Memuat tingkat keparahan" />
            ) : !isDesa && detailKabupatenError ? (
              <PesanGagal>{detailKabupatenError}</PesanGagal>
            ) : adaIsi(profilTampil?.kesenjangan) ? (
              <div className="kartu-hidup rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="mb-3 text-[11px] leading-snug text-gray-500">
                  {isDesa
                    ? 'Semakin panjang dan gelap batangnya, semakin parah kondisi di bidang tersebut.'
                    : 'Rata-rata dari seluruh desa/kelurahan. Semakin panjang dan gelap batangnya, semakin parah kondisi di bidang tersebut.'}
                </p>

                <div className="space-y-3.5">
                  {profilTampil.kesenjangan.map((item, idx) => {
                    const nilai = Number(item.nilai) || 0
                    const t = tingkatKeparahan(nilai)
                    return (
                      <div key={item.label}>
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-medium text-gray-800">{item.label}</span>
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                            style={{ background: `${t.warna}22`, color: t.warna }}
                          >
                            {t.nama}
                          </span>
                        </div>
                        <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="bar-isi h-full rounded-full"
                            style={{
                              width: `${Math.min(100, nilai)}%`,
                              background: t.warna,
                              animationDelay: `${600 + idx * 110}ms`,
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Legenda */}
                <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-gray-100 pt-3">
                  {[10, 30, 60, 90].map((n) => {
                    const t = tingkatKeparahan(n)
                    return (
                      <span key={n} className="flex items-center gap-1 text-[10px] text-gray-500">
                        <span className="h-2.5 w-2.5 rounded-sm" style={{ background: t.warna }} />
                        {t.nama}
                      </span>
                    )
                  })}
                </div>
              </div>
            ) : (
              <Kosong>
                {isDesa
                  ? 'Data tingkat keparahan tingkat desa belum tersedia.'
                  : 'Data tingkat keparahan belum tersedia.'}
              </Kosong>
            )}
          </section>

          {isDesa && (
            <section className={tahapTampil >= 3 ? 'bagian-fade-in' : ''}>
              <Judul ikon={Lightbulb}>Potensi Wilayah</Judul>
              {detailDesaLoading || tahapTampil < 3 ? (
                <LoadingDots label="Memuat potensi wilayah" />
              ) : detailDesaError ? (
                <PesanGagal>Gagal memuat potensi wilayah.</PesanGagal>
              ) : adaIsi(profilTampil?.potensi) ? (
                <ul className="space-y-2">
                  {profilTampil.potensi.map((teks, i) => (
                    <li
                      key={teks}
                      className="kartu-hidup muncul flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-sm"
                      style={tunda(600 + i * 90)}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sentra-yellow/60 text-xs font-bold">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {teks}
                    </li>
                  ))}
                </ul>
              ) : (
                <Kosong>Potensi wilayah belum tersedia.</Kosong>
              )}
            </section>
          )}

          {isDesa && (
            <section className={rekomendasiTampil ? 'bagian-fade-in' : ''}>
              <Judul ikon={Lightbulb}>Rekomendasi Kegiatan</Judul>
              {recommendationContext && (
                <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-sentra-green/20 bg-sentra-green/5 px-3 py-2">
                  <p className="text-xs leading-relaxed text-gray-700">
                    Sesuai rencana: {LABEL_BIDANG[recommendationContext.bidang] ?? recommendationContext.bidang}
                    {' · '}{formatAnggaran(recommendationContext.budget)}
                    {' · '}{recommendationContext.people} orang
                    {' · '}{recommendationContext.duration} hari
                  </p>
                  <button
                    type="button"
                    onClick={onClearRecommendationContext}
                    className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-sentra-green hover:bg-sentra-green/10"
                  >
                    Hapus
                  </button>
                </div>
              )}
              {!rekomendasiTampil ? (
                <LoadingDots label="Memuat rekomendasi kegiatan" />
              ) : recommendationsError ? (
                <PesanGagal>{recommendationsError}</PesanGagal>
              ) : adaIsi(recommendations) ? (
                <div className="space-y-2">
                  {recommendations.map((item, index) => (
                    <article
                      key={`${item.source}-${item.category}-${item.title}-${index}`}
                      className="kartu-hidup muncul rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 shadow-sm"
                      style={tunda(700 + Math.min(index, 6) * 90)}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-sentra-green/10 px-2 py-0.5 text-xs font-semibold text-sentra-green">
                          {LABEL_BIDANG[item.category] ?? item.category}
                        </span>
                        {item.source === 'ai' && (
                          <span className="rounded-full bg-sentra-yellow/40 px-2 py-0.5 text-xs font-semibold text-gray-700">
                            Saran AI
                          </span>
                        )}
                      </div>
                      <h4 className="mt-2 font-semibold text-gray-900">{item.title}</h4>
                      {item.description && (
                        <p className="mt-1 text-xs text-gray-600">{item.description}</p>
                      )}
                      {typeof item.explanation === 'string'
                        && item.explanation.trim() !== ''
                        && (
                          typeof item.description !== 'string'
                          || item.explanation.trim().toLowerCase() !== item.description.trim().toLowerCase()
                        )
                        && (
                          <p className="mt-1 text-xs text-gray-600">{item.explanation}</p>
                        )}
                      <p className="mt-2 text-xs text-gray-600">
                        Anggaran: {formatAnggaran(item.budget_min)}–{formatAnggaran(item.budget_max)}
                        {' · '}Pelaksana: {item.people ?? 'Belum tersedia'}
                        {' · '}Durasi: {item.duration ?? 'Belum tersedia'}
                        {item.duration != null ? ' hari' : ''}
                      </p>
                      {(item.kabupaten || item.desa) && (
                        <p className="mt-1 text-xs text-gray-500">
                          {[item.desa, item.kabupaten].filter(Boolean).join(', ')}
                        </p>
                      )}
                      {item.file_url && (
                        <a
                          href={item.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-sentra-green hover:underline"
                        >
                          <FileText size={14} /> Lihat dokumen
                        </a>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <Kosong>Rekomendasi kegiatan belum tersedia.</Kosong>
              )}
            </section>
          )}
        </div>
      </aside>
    </>
  )
}

export default ProfilWilayah