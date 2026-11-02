import { X } from 'lucide-react'

// Batas kategori adalah asumsi saya (79 = Tinggi, sesuai desain). Sesuaikan dengan tim.
function kategoriUrgensi(skor) {
  if (skor >= 80) return { nama: 'Kritis', warna: 'bg-sentra-red' }
  if (skor >= 60) return { nama: 'Tinggi', warna: 'bg-sentra-orange' }
  if (skor >= 40) return { nama: 'Sedang', warna: 'bg-sentra-yellow' }
  return { nama: 'Rendah', warna: 'bg-sentra-lightergreen' }
}

function ProfilWilayah({ wilayah, memuat = false, error = '', onClose }) {
  const kategori = kategoriUrgensi(wilayah?.indeksUrgensi ?? 0)

  return (
    <aside className="animasi-profil absolute inset-x-0 bottom-0 top-16 z-[1000] w-full overflow-y-auto rounded-t-3xl bg-sentra-cream shadow-xl md:inset-x-auto md:bottom-5 md:right-12 md:top-9 md:w-[440px] md:rounded-3xl">
      {/* HEADER HIJAU */}
      <div className="bg-sentra-green px-5 pb-3 pt-5 text-sentra-cream">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium tracking-[0.3em] text-sentra-cream/70">
            PROFIL WILAYAH
          </p>
          <button onClick={onClose} aria-label="Tutup profil" className="cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <h2 className="mt-5 text-3xl font-bold">
          {wilayah ? `${wilayah.jenis} ${wilayah.nama}` : 'Detail Desa'}
        </h2>
        <p className="text-sm text-sentra-cream/80">{wilayah?.kabupaten ?? '-'}</p>

        <div className="mt-3 flex gap-3 text-black">
          <div className="w-[170px] rounded-md bg-sentra-cream px-3 py-2">
            <p className="text-[11px] text-gray-600">Penduduk</p>
            <p className="font-bold">
              {wilayah?.penduduk == null ? '-' : `${wilayah.penduduk.toLocaleString('id-ID')} jiwa`}
            </p>
          </div>
          <div className="w-[170px] rounded-md bg-sentra-cream px-3 py-2">
            <p className="text-[11px] text-gray-600">Luas</p>
            <p className="font-bold">{wilayah?.luas == null ? '-' : `${wilayah.luas} ha`}</p>
          </div>
        </div>

        <hr className="my-4 border-white/20" />

        <p className="text-xs text-sentra-cream/80">Indeks Urgensi</p>
        <p className="text-4xl font-bold">{wilayah?.indeksUrgensi ?? '-'}</p>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/30">
          <div
            className={`h-full ${kategori.warna}`}
            style={{ width: `${Math.min(wilayah?.indeksUrgensi ?? 0, 100)}%` }}
          />
        </div>
        <p className="mt-1.5 text-[9px] text-sentra-cream/70">
          {wilayah?.indeksUrgensi == null
            ? 'Skor indeks urgensi belum tersedia.'
            : `Skor gabungan kebutuhan. Kategori saat ini: ${kategori.nama}.`}
        </p>
      </div>

      <div className="px-5 py-6 text-black">
        {memuat ? (
          <p role="status">Memuat detail desa...</p>
        ) : error ? (
          <p role="alert" className="text-red-700">Gagal memuat detail desa: {error}</p>
        ) : wilayah ? (
          <>
            <h3 className="text-xl font-bold tracking-wide">Detail Desa</h3>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-gray-600">Status IDM</dt>
                <dd className="font-semibold">{wilayah.statusIdm ?? '-'}</dd>
              </div>
              <div>
                <dt className="text-gray-600">Nilai IDM</dt>
                <dd className="font-semibold">{wilayah.nilaiIdm ?? '-'}</dd>
              </div>
              <div>
                <dt className="text-gray-600">Jarak ke sekolah</dt>
                <dd className="font-semibold">
                  {wilayah.jarakSekolahKm == null ? '-' : `${wilayah.jarakSekolahKm} km`}
                </dd>
                {wilayah.indikatorPerhatian?.includes('pendidikan') && (
                  <dd className="mt-1 text-xs font-semibold text-amber-800">
                    Perlu perhatian: Pendidikan
                  </dd>
                )}
              </div>
              <div>
                <dt className="text-gray-600">Jarak ke fasilitas kesehatan</dt>
                <dd className="font-semibold">
                  {wilayah.jarakFaskesKm == null ? '-' : `${wilayah.jarakFaskesKm} km`}
                </dd>
                {wilayah.indikatorPerhatian?.includes('kesehatan') && (
                  <dd className="mt-1 text-xs font-semibold text-amber-800">
                    Perlu perhatian: Fasilitas kesehatan
                  </dd>
                )}
              </div>
              {wilayah.faskesTerdekat && (
                <div className="col-span-2">
                  <dt className="text-gray-600">Fasilitas kesehatan terdekat</dt>
                  <dd className="font-semibold">{wilayah.faskesTerdekat}</dd>
                </div>
              )}
            </dl>

            {wilayah.kesenjangan?.length > 0 && (
              <>
                <h3 className="mt-8 text-xl font-bold tracking-wide">Kesenjangan Indikator</h3>
                <div className="mt-2 space-y-2.5">
                  {wilayah.kesenjangan.map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs">
                        <span>{item.label}</span>
                        <span>{item.nilai}%</span>
                      </div>
                      <div className="mt-0.5 h-2 bg-sentra-lightgreen/60">
                        <div
                          className="h-full bg-sentra-green"
                          style={{ width: `${Math.min(Math.max(item.nilai, 0), 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {wilayah.rekomendasi && (
              <>
                <h3 className="mt-8 text-xl font-bold tracking-wide">Rekomendasi</h3>
                <p className="mt-2 text-sm">{wilayah.rekomendasi}</p>
              </>
            )}
          </>
        ) : null}
      </div>
    </aside>
  )
}

export default ProfilWilayah