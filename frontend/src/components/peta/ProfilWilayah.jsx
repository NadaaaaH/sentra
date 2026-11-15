import {
  X, BookOpen, Activity, MapPin, Users, Ruler, Wallet, Clock, Lightbulb, Target,
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

function ProfilWilayah({ wilayah, fasilitas, onClose }) {
  const isDesa = wilayah?.jenis === 'Desa' || wilayah?.kelas != null

  const skor = Number(wilayah?.indeksUrgensi) || 0
  const kelas = Number(wilayah?.kelas) || 0
  const modeKelas = isDesa && skor === 0 && kelas > 0

  const kategori = kategoriUrgensi(skor)
  const warnaGauge = modeKelas ? WARNA_KELAS[kelas] : kategori.hex
  const persen = modeKelas ? (kelas / 5) * 100 : skor
  const labelUrgensi = modeKelas ? wilayah?.labelUrgensi || NAMA_KELAS[kelas] : kategori.nama

  const namaKab = NAMA_KAB[String(wilayah?.kabupaten)] ?? wilayah?.kabupaten

  const saran = adaIsi(wilayah?.saranProgram)
    ? [...wilayah.saranProgram].sort((a, b) => b.skor - a.skor).slice(0, 10)
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
          {wilayah?.jenis} {wilayah?.nama}
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
              {wilayah?.penduduk ? wilayah.penduduk.toLocaleString('id-ID') : '-'}
              <span className="ml-1 text-xs font-normal text-sentra-cream/70">jiwa</span>
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 px-3 py-2.5 ring-1 ring-white/15">
            <p className="flex items-center gap-1.5 text-[11px] text-sentra-cream/70">
              <Ruler size={12} /> Luas
            </p>
            <p className="mt-0.5 text-lg font-bold">
              {wilayah?.luas || '-'}
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
          </section>
        )}

        {/* KESENJANGAN */}
        <section>
          <Judul ikon={Activity}>Kesenjangan Indikator</Judul>
          {adaIsi(wilayah?.kesenjangan) ? (
            <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              {wilayah.kesenjangan.map((item) => (
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
                : 'Data kesenjangan indikator belum tersedia.'}
            </Kosong>
          )}
        </section>

        {/* POTENSI */}
        <section>
          <Judul ikon={Lightbulb}>Potensi Wilayah</Judul>
          {adaIsi(wilayah?.potensi) ? (
            <ul className="space-y-2">
              {wilayah.potensi.map((teks, i) => (
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
          ) : (
            <Kosong>
              {isDesa
                ? 'Data potensi tingkat desa belum tersedia.'
                : 'Data potensi wilayah belum tersedia.'}
            </Kosong>
          )}
        </section>

        {/* SARAN PROGRAM */}
        {saran.length > 0 && (
          <section>
            <Judul ikon={Target}>Saran Program</Judul>
            <div className="space-y-3">
              {saran.map((item) => (
                <div
                  key={item.judul}
                  className="rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold leading-tight">{item.judul}</p>
                      <span className="mt-1 inline-block rounded-full bg-sentra-green/10 px-2 py-0.5 text-[10px] font-medium text-sentra-green">
                        {item.bidang}
                      </span>
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                      {item.skor}% cocok
                    </span>
                  </div>

                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${item.skor}%` }}
                    />
                  </div>

                  <p className="mt-2 text-[12px] leading-snug text-gray-600">{item.deskripsi}</p>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-gray-50 py-1.5">
                      <Wallet size={13} className="mx-auto text-gray-400" />
                      <p className="mt-0.5 text-[11px] font-bold">Rp {item.biaya} jt</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 py-1.5">
                      <Users size={13} className="mx-auto text-gray-400" />
                      <p className="mt-0.5 text-[11px] font-bold">{item.relawan} relawan</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 py-1.5">
                      <Clock size={13} className="mx-auto text-gray-400" />
                      <p className="mt-0.5 text-[11px] font-bold">{item.hari} hari</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {!isDesa && (
          <p className="text-center text-[10px] text-gray-400">
            Data kesenjangan, potensi, dan saran program bersifat demonstratif (sementara).
          </p>
        )}
      </div>
    </aside>
  )
}

export default ProfilWilayah