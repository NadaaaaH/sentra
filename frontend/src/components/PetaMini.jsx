import { useState } from 'react'
import { Link } from 'react-router'
import { motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import Reveal from './Reveal'
import jateng from '../data/jateng.json'
import { buatProfil } from '../data/profilKabupaten'

// palet yang sama dengan halaman peta
const PALET = ['#94C765', '#7DBE9B', '#C9D97A', '#E3C06B', '#E0A987', '#86B6A8']
const warnaDasar = (id) => PALET[(id.charCodeAt(0) * 3 + id.charCodeAt(1)) % PALET.length]

function warnaNilai(n) {
  if (n < 40) return '#587042'
  if (n < 60) return '#F6C531'
  if (n < 80) return '#DE7F1A'
  return '#9B1C0F'
}

// ---- ubah koordinat GeoJSON menjadi path SVG (dihitung sekali) ----
const semuaPoligon = (geom) =>
  geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates

let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
jateng.features.forEach((f) =>
  semuaPoligon(f.geometry).forEach((poli) =>
    poli.forEach((ring) =>
      ring.forEach(([x, y]) => {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      })
    )
  )
)

const k = Math.cos((((minY + maxY) / 2) * Math.PI) / 180)
const W = 600
const skala = W / ((maxX - minX) * k)
const H = (maxY - minY) * skala
const proyeksi = ([x, y]) =>
  `${((x - minX) * k * skala).toFixed(1)} ${((maxY - y) * skala).toFixed(1)}`

const bentuk = jateng.features.map((f) => ({
  id: f.properties.id,
  label: f.properties.label,
  props: f.properties,
  d: semuaPoligon(f.geometry)
    .map((poli) => poli.map((ring) => 'M' + ring.map(proyeksi).join('L') + 'Z').join(''))
    .join(''),
}))

function PetaMini() {
  const [aktif, setAktif] = useState(null)
  const profil = aktif ? buatProfil(aktif.props) : null

  return (
    <section className="px-6 py-12 md:px-16 lg:py-16">
      <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-[1fr_1.35fr]">
        <Reveal>
          <div className="kartu-stiker bg-sentra-green p-8 text-sentra-cream">
            <p className="text-sm font-semibold tracking-[0.2em] text-sentra-lightgreen">
              JELAJAHI WILAYAH
            </p>
            <h2 className="mt-2 text-3xl font-bold md:text-4xl">Peta Jawa Tengah</h2>
            <p className="mt-3 leading-relaxed text-sentra-cream/90">
              35 kabupaten dan kota, masing-masing dengan profil kebutuhan,
              potensi, dan saran program sendiri.
            </p>

            <div
              key={aktif?.id ?? 'kosong'}
              className="animasi-panel mt-6 min-h-24 rounded-2xl bg-white/15 p-4"
            >
              {aktif ? (
                <>
                  <p className="text-sm text-sentra-cream/80">Wilayah terpilih</p>
                  <p className="text-xl font-bold">{aktif.label}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                    Indeks Urgensi
                    <span
                      className="rounded-full px-2.5 py-0.5 font-bold"
                      style={{
                        background: warnaNilai(profil.indeksUrgensi),
                        color:
                          profil.indeksUrgensi >= 40 && profil.indeksUrgensi < 60
                            ? '#1f2d14'
                            : '#fff',
                      }}
                    >
                      {profil.indeksUrgensi}
                    </span>
                    <span className="text-sentra-cream/70">(data demonstratif)</span>
                  </div>
                </>
              ) : (
                <p className="text-sentra-cream/90">
                  Arahkan kursor (atau ketuk) salah satu wilayah pada peta.
                </p>
              )}
            </div>

            <Link
              to="/peta"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-sentra-yellow px-6 py-3 font-semibold text-black transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              Buka Peta Lengkap <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="kartu-stiker bg-gradient-to-br from-[#E8F3EE] to-[#D9E6EB] p-4 md:p-8">
            <svg
              viewBox={`-10 -10 ${W + 20} ${H + 20}`}
              className="h-auto w-full drop-shadow-xl"
              role="img"
              aria-label="Peta kabupaten dan kota di Jawa Tengah"
              onMouseLeave={() => setAktif(null)}
            >
              <g>
                {bentuk.map((b, i) => (
                  <motion.path
                    key={b.id}
                    d={b.d}
                    fill={warnaDasar(b.id)}
                    stroke="#fff"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                    className="cursor-pointer"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.03, duration: 0.4 }}
                    onMouseEnter={() => setAktif(b)}
                    onClick={() => setAktif(b)}
                  />
                ))}
              </g>

              {aktif && (
                <g key={aktif.id} className="peta-mini-angkat" style={{ pointerEvents: 'none' }}>
                  <path
                    d={aktif.d}
                    fill={warnaDasar(aktif.id)}
                    stroke="#fff"
                    strokeWidth="2.2"
                    strokeLinejoin="round"
                  />
                </g>
              )}
            </svg>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export default PetaMini