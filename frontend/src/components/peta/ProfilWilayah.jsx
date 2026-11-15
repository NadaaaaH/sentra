import {
  X, BookOpen, Activity, MapPin, Users, Ruler, Lightbulb, CircleAlert, FileText,
} from 'lucide-react'

const WARNA_KELAS = {
  0: '#cccccc', 1: '#2c7bb6', 2: '#abd9e9', 3: '#e6e68a', 4: '#fdae61', 5: '#d7191c',
}
const NAMA_KELAS = {
  0: 'Belum dinilai', 1: 'Aman', 2: 'Ringan', 3: 'Sedang', 4: 'Urgent', 5: 'Sangat urgent',
}

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

function kategoriUrgensi(skor) {
  if (skor >= 80) return { nama: 'Kritis', hex: '#d7191c' }
  if (skor >= 60) return { nama: 'Tinggi', hex: '#F3722C' }
  if (skor >= 40) return { nama: 'Sedang', hex: '#F9C74F' }
  return { nama: 'Rendah', hex: '#90BE6D' }
}

const warnaNilai = (n) => kategoriUrgensi(n).hex
const adaIsi = (arr) => Array.isArray(arr) && arr.length > 0
const LABEL_BIDANG = {
  kesehatan: 'Kesehatan',
  pendidikan: 'Pendidikan',
  internet: 'Akses Internet',
  infrastruktur: 'Infrastruktur',
  ekonomi: 'Ekonomi',
}

function formatAnggaran(nilai) {
  return nilai == null
    ? 'Belum tersedia'
    : `Rp${Number(nilai).toLocaleString('id-ID')}`
}

function formatJarak(km) {
  if (km === null || km === undefined || km === '') return 'Belum tersedia'
  const jarak = Number(km)
  return Number.isFinite(jarak)
    ? `${jarak.toLocaleString('id-ID', { maximumFractionDigits: 2 })} km`
    : 'Belum tersedia'
}

function Gauge({ persen, warna, children }) {
  const r = 38
  const c = 2 * Math.PI * r
  const isi = c - (c * Math.min(100, Math.max(0, persen))) / 100
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 96 96" className="h-full w-full -rotate-90">
        <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="9" />
        <circle
          cx="48" cy="48" r={r} fill="none" stroke={warna} strokeWidth="9"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={isi}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-sentra-cream">
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

function ProfilWilayah({
  wilayah,
  fasilitas,
  detailDesa,
  detailDesaLoading,
  recommendations,
  recommendationsLoading,
  detailKabupaten,
  detailKabupatenLoading,
  detailKabupatenError,
  onClose,
}) {
  const isDesa = wilayah?.jenis === 'Desa' || wilayah?.kelas != null
  const profilTampil = isDesa && detailDesa
    ? {
        ...wilayah,
        ...detailDesa,
        kabupaten: wilayah?.kabupaten ?? detailDesa.kabupaten,
      }
    : !isDesa && detailKabupaten
      ? { ...wilayah, ...detailKabupaten, kabupaten: 'Provinsi Jawa Tengah' }
    : wilayah

  const skor = Number(profilTampil?.indeksUrgensi) || 0
  const kelas = Number(wilayah?.kelas) || 0
  const modeKelas = isDesa && skor === 0 && kelas > 0

  const kategori = kategoriUrgensi(skor)
  const warnaGauge = modeKelas ? WARNA_KELAS[kelas] : kategori.hex
  const persen = modeKelas ? (kelas / 5) * 100 : skor
  const labelUrgensi = modeKelas ? profilTampil?.labelUrgensi || NAMA_KELAS[kelas] : kategori.nama

  const namaKab = NAMA_KAB[String(profilTampil?.kabupaten)] ?? profilTampil?.kabupaten

  const indikatorPerhatian = Array.isArray(detailDesa?.indikatorPerhatian)
    ? detailDesa.indikatorPerhatian
    : []

  return (
    <aside className="animasi-profil absolute inset-x-0 bottom-0 top-16 z-[1000] w-full overflow-y-auto rounded-t-3xl bg-sentra-cream shadow-2xl md:inset-x-auto md:bottom-5 md:right-12 md:top-9 md:w-[440px] md:rounded-3xl">
      {/* ===== HEADER ===== */}
      <div className="relative overflow-hidden bg-sentra-green px-5 pb-5 pt-5 text-sentra-cream">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-white/5" />

        <div className="relative flex items-center justify-between">
          <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold tracking-[0.25em]">
            {isDesa ? 'PROFIL DESA' : 'PROFIL WILAYAH'}
          </span>
          <button
            onClick={onClose}
            aria-label="Tutup profil"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/15 transition hover:bg-white/30"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h2 className="relative mt-4 text-3xl font-bold leading-tight">
          {profilTampil?.jenis} {profilTampil?.nama}
        </h2>
        {namaKab && (
          <p className="relative mt-1 flex items-center gap-1.5 text-sm text-sentra-cream/80">
            <MapPin size={14} /> {namaKab}
          </p>
        )}

        <div className="relative mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/10 px-3 py-2.5 ring-1 ring-white/15">
            <p className="flex items-center gap-1.5 text-[11px] text-sentra-cream/70">
              <Users size={12} /> Penduduk
            </p>
            <p className="mt-0.5 text-lg font-bold">
              {profilTampil?.penduduk ? profilTampil.penduduk.toLocaleString('id-ID') : '-'}
              <span className="ml-1 text-xs font-normal text-sentra-cream/70">jiwa</span>
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 px-3 py-2.5 ring-1 ring-white/15">
            <p className="flex items-center gap-1.5 text-[11px] text-sentra-cream/70">
              <Ruler size={12} /> Luas
            </p>
            <p className="mt-0.5 text-lg font-bold">
              {profilTampil?.luas || '-'}
              <span className="ml-1 text-xs font-normal text-sentra-cream/70">ha</span>
            </p>
          </div>
        </div>

        {/* Indeks urgensi */}
        <div className="relative mt-4 flex items-center gap-4 rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
          <Gauge persen={persen} warna={warnaGauge}>
            {modeKelas ? (
              <>
                <span className="text-2xl font-bold leading-none">{kelas}</span>
                <span className="text-[10px] text-sentra-cream/70">dari 5</span>
              </>
            ) : (
              <>
                <span className="text-2xl font-bold leading-none">{skor}</span>
                <span className="text-[10px] text-sentra-cream/70">/ 100</span>
              </>
            )}
          </Gauge>
          <div>
            <p className="text-[11px] uppercase tracking-widest text-sentra-cream/70">
              Indeks Urgensi
            </p>
            <span
              className="mt-1 inline-block rounded-full px-3 py-1 text-sm font-bold"
              style={{
                background: warnaGauge,
                color: modeKelas && (kelas === 2 || kelas === 3) ? '#1f2937' : kategori.nama === 'Sedang' && !modeKelas ? '#1f2937' : '#fff',
              }}
            >
              {labelUrgensi}
            </span>
            <p className="mt-2 text-[10px] leading-snug text-sentra-cream/70">
              {modeKelas
                ? 'Klasifikasi urgensi desa pada peta (1 = aman, 5 = sangat urgent).'
                : 'Skor gabungan lima indikator kebutuhan (0 = terpenuhi, 100 = sangat mendesak).'}
            </p>
          </div>
        </div>
      </div>

      {/* ===== ISI ===== */}
      <div className="space-y-8 px-5 py-6 text-black">
        {/* FASILITAS (khusus desa) */}
        {isDesa && (
          <section>
            <Judul ikon={MapPin}>Fasilitas Desa</Judul>
            {fasilitas ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
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
                  <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
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
                  <div className="mt-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
                    <p className="mb-2 text-xs font-semibold text-gray-700">
                      Beberapa sekolah di desa ini
                    </p>
                    <ul className="space-y-1.5">
                      {fasilitas.detail_sekolah.slice(0, 3).map((s) => (
                        <li key={s.id} className="flex items-start gap-2 text-[12px] text-gray-600">
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

            <div className="mt-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
              <p className="mb-2 text-xs font-semibold text-gray-700">Jarak fasilitas terdekat</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-blue-50 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-gray-500">Pendidikan</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                    <p className="text-sm font-bold text-gray-800">
                      {detailDesaLoading ? 'Memuat...' : formatJarak(detailDesa?.jarakSekolahKm)}
                    </p>
                    {!detailDesaLoading && indikatorPerhatian.includes('pendidikan') && (
                      <span
                        className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-red-600"
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
                      {detailDesaLoading ? 'Memuat...' : formatJarak(detailDesa?.jarakFaskesKm)}
                    </p>
                    {!detailDesaLoading && indikatorPerhatian.includes('kesehatan') && (
                      <span
                        className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-red-600"
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
            </div>
          </section>
        )}

        {/* KESENJANGAN */}
        <section>
          <Judul ikon={Activity}>
            {isDesa ? 'Kesenjangan Indikator' : 'Rata-rata Kesenjangan Indikator'}
          </Judul>
          {!isDesa && detailKabupaten && (
            <p className="mb-2 text-xs text-gray-500">
              Desa urgensi Sangat Urgent (merah):{' '}
              <span className="font-semibold text-red-600">
                {detailKabupaten.jumlahDesaUrgent} dari {detailKabupaten.jumlahDesa}
              </span>{' '}
              desa/kelurahan.
            </p>
          )}
          {adaIsi(profilTampil?.kesenjangan) ? (
            <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              {profilTampil.kesenjangan.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-700">{item.label}</span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                      style={{
                        background: `${warnaNilai(item.nilai)}33`,
                        color: '#1f2937',
                      }}
                    >
                      {item.nilai}
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${item.nilai}%`, background: warnaNilai(item.nilai) }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Kosong>
              {isDesa
                ? 'Data kesenjangan indikator tingkat desa belum tersedia.'
                : detailKabupatenLoading
                  ? 'Menghitung rata-rata indikator kabupaten...'
                  : detailKabupatenError ?? 'Data indikator kabupaten belum tersedia.'}
            </Kosong>
          )}
        </section>

        {isDesa && (
          <section>
            <Judul ikon={Lightbulb}>Potensi Wilayah</Judul>
            {adaIsi(profilTampil?.potensi) ? (
              <ul className="space-y-2">
                {profilTampil.potensi.map((teks, i) => (
                  <li
                    key={teks}
                    className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-sm"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sentra-yellow/60 text-xs font-bold">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {teks}
                  </li>
                ))}
              </ul>
            ) : detailDesaLoading ? (
              <Kosong>Memuat potensi wilayah...</Kosong>
            ) : (
              <Kosong>Potensi wilayah belum tersedia.</Kosong>
            )}
          </section>
        )}

        {isDesa && (
          <section>
            <Judul ikon={Lightbulb}>Rekomendasi Kegiatan</Judul>
            {recommendationsLoading ? (
              <div className="space-y-2" aria-label="Memuat rekomendasi kegiatan">
                {[0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className="h-24 animate-pulse rounded-xl border border-gray-200 bg-white/70"
                  />
                ))}
              </div>
            ) : adaIsi(recommendations) ? (
              <div className="space-y-2">
                {recommendations.map((item, index) => (
                  <article
                    key={`${item.source}-${item.category}-${item.title}-${index}`}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 shadow-sm"
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
                    <p className="mt-1 text-xs text-gray-600">{item.explanation}</p>
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
  )
}

export default ProfilWilayah