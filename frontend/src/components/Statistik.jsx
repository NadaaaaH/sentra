import { useEffect, useRef, useState } from 'react'
import { animate, useInView } from 'motion/react'
import { MapPinned, Gauge, Database, Lightbulb } from 'lucide-react'
import Reveal from './Reveal'
import jateng from '../data/jateng.json'
import { sumberUtama } from '../data/sumberData'

function Angka({ ke, durasi = 1.6 }) {
  const ref = useRef(null)
  const terlihat = useInView(ref, { once: true, margin: '-60px' })
  const [nilai, setNilai] = useState(0)

  useEffect(() => {
    if (!terlihat) return
    const kontrol = animate(0, ke, {
      duration: durasi,
      ease: 'easeOut',
      onUpdate: (v) => setNilai(Math.round(v)),
    })
    return () => kontrol.stop()
  }, [terlihat, ke, durasi])

  return <span ref={ref}>{nilai}</span>
}

const kartu = [
  {
    ikon: MapPinned,
    ke: jateng.features.length,
    label: 'Kabupaten & kota dipetakan',
    lingkaran: 'bg-sentra-lightgreen/60 text-sentra-green',
  },
  {
    ikon: Gauge,
    ke: 5,
    label: 'Indikator indeks urgensi',
    lingkaran: 'bg-sentra-orange/15 text-sentra-orange',
  },
  {
    ikon: Database,
    ke: sumberUtama.length,
    label: 'Sumber data utama',
    lingkaran: 'bg-sentra-teal/15 text-sentra-teal',
  },
  {
    ikon: Lightbulb,
    ke: 10,
    label: 'Saran program maks. per wilayah',
    lingkaran: 'bg-sentra-soga/15 text-sentra-soga',
  },
]

function Statistik() {
  return (
    <section className="px-6 py-12 md:px-16 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <h2 className="text-center text-3xl font-bold tracking-[0.15em] text-sentra-green md:text-4xl">
            SENTRA dalam Angka
          </h2>
        </Reveal>

        <div className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {kartu.map((item, i) => {
            const Ikon = item.ikon
            return (
              <Reveal key={item.label} delay={i * 0.1} className="h-full">
                <div className="kartu-stiker h-full bg-white p-5 text-center md:p-6">
                  <div
                    className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${item.lingkaran}`}
                  >
                    <Ikon className="h-7 w-7" strokeWidth={1.6} />
                  </div>
                  <p className="mt-4 text-5xl font-extrabold text-sentra-darkergreen">
                    <Angka ke={item.ke} />
                  </p>
                  <p className="mt-1 text-sm text-gray-600">{item.label}</p>
                </div>
              </Reveal>
            )
          })}
        </div>

        <Reveal delay={0.2}>
          <p className="mt-10 text-center text-sm tracking-widest text-gray-500">
            DIDUKUNG DATA DARI
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            {sumberUtama.map((s) => (
              <span
                key={s.nama}
                className="rounded-full border border-sentra-stroke bg-white px-4 py-1.5 text-sm font-medium shadow-sm transition hover:-translate-y-0.5 hover:border-sentra-green hover:text-sentra-green hover:shadow-md"
              >
                {s.nama}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export default Statistik