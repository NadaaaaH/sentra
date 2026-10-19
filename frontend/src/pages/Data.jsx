import { FileText, SquareArrowOutUpRight, Info } from 'lucide-react'
import { sumberUtama, komponenIndeks } from '../data/sumberData'

function Data() {
  return (
    <div>
      {/* HERO */}
      <section className="bg-sentra-green px-15 py-10">
        <p className="font-semibold tracking-[0.2em] text-sentra-lightgreen">
          TRANSPARANSI DATA
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-sentra-cream">
          Sumber Data SENTRA
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-snug tracking-wide text-sentra-cream">
          Setiap skor SENTRA dapat ditelusuri. Pelajari asal data, pembaruan,
          format, lisensi, serta cara setiap indikator digunakan.
        </p>
      </section>

      {/* SUMBER DATA UTAMA */}
      <section className="px-14 py-14">
        <h2 className="text-3xl font-medium">Sumber Data Utama</h2>

        <div className="mt-12 overflow-x-auto border border-sentra-stroke">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-sentra-lightyellow/40 text-xs tracking-wider">
              <tr>
                <th className="py-4 pl-24 font-semibold">SUMBER</th>
                <th className="py-4 font-semibold">JENIS DATA</th>
                <th className="py-4 font-semibold">PEMBARUAN</th>
                <th className="py-4 font-semibold">FORMAT</th>
                <th className="py-4 font-semibold">LISENSI</th>
                <th className="py-4" />
              </tr>
            </thead>
            <tbody>
              {sumberUtama.map((item) => (
                <tr key={item.nama} className="border-t border-sentra-stroke">
                  <td className="py-5 pl-24 font-semibold">{item.nama}</td>
                  <td className="py-5 pr-4">{item.jenis}</td>
                  <td className="py-5 pr-4">{item.pembaruan}</td>
                  <td className="py-5 pr-4">
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {item.format}
                    </span>
                  </td>
                  <td className="py-5 pr-4">{item.lisensi}</td>
                  <td className="py-5 pr-10">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Buka situs ${item.nama}`}
                    >
                      <SquareArrowOutUpRight className="h-4 w-4" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* KAMUS INDIKATOR */}
      <section className="bg-sentra-bitdarkercream/60 px-14 py-14">
        <p className="font-semibold tracking-[0.2em] text-sentra-green">
          KAMUS INDIKATOR
        </p>
        <h2 className="mt-2 text-3xl font-medium">Komponen Indeks Urgensi</h2>

        <div className="mt-6 flex flex-wrap justify-center gap-5">
          {komponenIndeks.map((item) => (
            <div
              key={item.nama}
              className="w-full max-w-[436px] border border-sentra-stroke bg-sentra-cream p-7"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-2xl font-semibold">{item.nama}</h3>
                <span className="bg-sentra-lightyellow px-2 py-0.5 text-[10px] font-semibold">
                  Bobot {item.bobot}%
                </span>
              </div>

              <p className="mt-5 min-h-[44px] text-sm leading-relaxed tracking-wide text-gray-600">
                {item.deskripsi}
              </p>

              <hr className="my-5 border-sentra-stroke" />

              <dl className="space-y-3 text-sm tracking-wide">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Sumber</dt>
                  <dd className="font-medium">{item.sumber}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Format</dt>
                  <dd className="font-medium">{item.format}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </section>

      {/* PRINSIP PENGGUNAAN DATA */}
      <section className="px-14 py-16">
        <div className="border-l-4 border-sentra-yellow bg-sentra-lightyellow/30 px-7 py-5">
          <h3 className="flex items-center gap-2 text-lg font-medium">
            <Info className="h-5 w-5" />
            Prinsip penggunaan data
          </h3>
          <p className="mt-2 text-sm leading-7 tracking-wide text-gray-600">
            SENTRA menyajikan data sebagai alat bantu pengambilan keputusan,
            bukan pengganti verifikasi lapangan. Perbedaan tahun pembaruan,
            definisi indikator, dan ketersediaan antarwilayah harus
            dipertimbangkan sebelum menjalankan program. Versi ini menggunakan
            data demonstratif untuk menampilkan seluruh fungsi antarmuka.
          </p>
        </div>
      </section>
    </div>
  )
}

export default Data