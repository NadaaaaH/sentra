import { FileText, SquareArrowOutUpRight, Info } from 'lucide-react'
import { sumberUtama, komponenIndeks } from '../data/sumberData'
import Reveal from '../components/Reveal'
import KonturLatar from '../components/KonturLatar'
import Gelombang from '../components/Gelombang'

function Data() {
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-sentra-green px-6 pb-20 pt-10 md:px-14 md:pb-24 md:pt-14">
        <KonturLatar />
        <Gelombang
          className="absolute inset-x-0 -bottom-px z-[1] h-10 md:h-16"
          belakang="#A9B494"
          depan="#FDFBF2"
        />
        
        <div className="relative z-10 mx-auto max-w-7xl">
          <p className="font-semibold tracking-[0.2em] text-sentra-lightgreen">
            TRANSPARANSI DATA
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-sentra-cream md:text-4xl">
            Sumber Data SENTRA
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-snug tracking-wide text-sentra-cream">
            Setiap skor SENTRA dapat ditelusuri. Pelajari asal data, pembaruan,
            format, lisensi, serta cara setiap indikator digunakan.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            {[
              { angka: sumberUtama.length, label: 'Sumber data utama' },
              { angka: komponenIndeks.length, label: 'Indikator urgensi' },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl bg-white/10 px-5 py-3 backdrop-blur-sm"
              >
                <p className="text-3xl font-bold text-sentra-cream">{s.angka}</p>
                <p className="text-sm text-sentra-cream/80">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SUMBER DATA UTAMA */}
      <section className="px-6 py-10 md:px-14 md:py-14">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <h2 className="text-2xl font-medium md:text-3xl">Sumber Data Utama</h2>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mt-8 overflow-x-auto rounded-xl border border-sentra-stroke bg-white shadow-md md:mt-12">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-sentra-lightyellow/40 text-xs tracking-wider">
                  <tr>
                    <th className="py-4 pl-6 font-semibold md:pl-24">SUMBER</th>
                    <th className="py-4 font-semibold">JENIS DATA</th>
                    <th className="py-4 font-semibold">PEMBARUAN</th>
                    <th className="py-4 font-semibold">FORMAT</th>
                    <th className="py-4 font-semibold">LISENSI</th>
                    <th className="py-4" />
                  </tr>
                </thead>
                <tbody>
                  {sumberUtama.map((item) => (
                    <tr
                      key={item.nama}
                      className="border-t border-sentra-stroke transition hover:bg-sentra-lightyellow/20"
                    >
                      <td className="py-5 pl-6 font-semibold md:pl-24">{item.nama}</td>
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
          </Reveal>
        </div>
      </section>

      {/* KAMUS INDIKATOR */}
      <section className="bg-sentra-bitdarkercream px-6 py-10 md:px-14 md:py-14">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <p className="font-semibold tracking-[0.2em] text-sentra-green">
              KAMUS INDIKATOR
            </p>
            <h2 className="mt-2 text-2xl font-medium md:text-3xl">
              Komponen Indeks Urgensi
            </h2>
          </Reveal>

          <div className="mt-6 flex flex-wrap justify-center gap-5">
            {komponenIndeks.map((item, i) => (
              <Reveal
                key={item.nama}
                delay={(i % 3) * 0.1}
                className="w-full sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-2.5rem)/3)]"
              >
                <div className="h-full rounded-xl border border-sentra-stroke bg-sentra-cream p-6 shadow-sm transition duration-300 hover:-translate-y-1.5 hover:shadow-xl md:p-7">
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
                    <div className="flex justify-between gap-4">
                      <dt className="text-gray-600">Sumber</dt>
                      <dd className="text-right font-medium">{item.sumber}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-gray-600">Format</dt>
                      <dd className="text-right font-medium">{item.format}</dd>
                    </div>
                  </dl>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* PRINSIP PENGGUNAAN DATA */}
      <section className="px-6 py-10 md:px-14 md:py-16">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <div className="border-l-4 border-sentra-yellow bg-sentra-lightyellow/30 px-7 py-5">
              <h3 className="flex items-center gap-2 text-lg font-medium">
                <Info className="h-5 w-5" />
                Prinsip penggunaan data
              </h3>
              <p className="mt-2 text-sm leading-7 tracking-wide text-gray-600">
                SENTRA menyajikan data sebagai alat bantu pengambilan keputusan,
                bukan pengganti verifikasi lapangan. Perbedaan tahun pembaruan,
                definisi indikator, dan ketersediaan antarwilayah harus
                dipertimbangkan sebelum menjalankan program. Versi ini
                menggunakan data demonstratif untuk menampilkan seluruh fungsi
                antarmuka.
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}

export default Data