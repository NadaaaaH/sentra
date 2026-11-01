import {
  Search,
  Map,
  ScanSearch,
  Siren,
  Lightbulb,
  Link2,
  Database,
} from 'lucide-react'
import FeatureCard from '../components/FeatureCard'
import Reveal from '../components/Reveal'
import FiturMarquee from '../components/FiturMarquee'
import KonturLatar from '../components/KonturLatar'
import HeroVisual from '../components/HeroVisual'
import Gelombang from '../components/Gelombang'
import { Link } from 'react-router'

const fitur = [
  {
    icon: Map,
    title: 'Peta Interaktif',
    description: 'Jelajahi wilayah Jawa Tengah secara visual dan atur lapisannya.',
    tone: 'green',
  },
  {
    icon: ScanSearch,
    title: 'Analisis Kebutuhan',
    description: 'Identifikasi masalah, potensi, dan kesenjangan wilayah.',
    tone: 'yellow',
  },
  {
    icon: Siren,
    title: 'Indeks Urgensi',
    description: 'Tentukan prioritas wilayah berdasarkan data dan pembobotan indikator.',
    tone: 'green',
  },
  {
    icon: Lightbulb,
    title: 'Rekomendasi Program',
    description: 'Dapatkan rekomendasi program yang sesuai dengan kebutuhan wilayah.',
    tone: 'yellow',
  },
  {
    icon: Link2,
    title: 'Smart Matching',
    description: 'Cocokkan program dengan wilayah yang paling sesuai berdasarkan kriteria.',
    tone: 'green',
  },
  {
    icon: Database,
    title: 'Data & Sumber',
    description: 'Akses data indikator, data wilayah, dan data lainnya dari sumber terpercaya.',
    tone: 'yellow',
  },
]

const caraKerja = [
  {
    title: 'Jelajahi peta',
    description:
      'Pahami pola kebutuhan lintas wilayah melalui peta dan indikator yang dapat dipilih.',
  },
  {
    title: 'Analisis Wilayah',
    description:
      'Telusuri profil, fasilitas, kesenjangan wilayah serta bobot pembentuk urgensi.',
  },
  {
    title: 'Rekomendasi',
    description:
      'Dapatkan rekomendasi sesuai wilayah dan cocokkan program dengan kebutuhan wilayah.',
  },
]

function Beranda() {
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-sentra-hero px-6 pb-24 pt-16 md:px-16 lg:px-32 lg:pb-28 lg:pt-16">
        <KonturLatar />
        <Gelombang
          className="absolute inset-x-0 -bottom-px z-[1] h-10 md:h-16"
          belakang="#A9B494"
          depan="#FDFBF2"
        />
        
        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-lg font-bold tracking-[0.2em] text-sentra-darkergreen">
              SELAMAT DATANG DI
            </p>

            <h1 className="text-5xl font-extrabold text-sentra-bitdarkercream md:text-7xl lg:text-7xl">
              SENTRA
            </h1>

            <h2 className="text-2xl font-semibold text-sentra-bitdarkercream md:text-3xl">
              Spatial Needs & Response Analytics
            </h2>

            <p className="mt-6 max-w-2xl text-lg leading-snug text-sentra-cream">
              Platform Informasi Geografis untuk memetakan kebutuhan wilayah,
              menganalisis data sektoral, dan memberikan rekomendasi program
              pembangunan yang tepat sasaran berbasis wilayah di Jawa Tengah
            </p>

            <div className="mt-10 flex max-w-3xl items-center gap-3 bg-white px-5 py-3 shadow-lg">
              <Search className="h-6 w-6 text-black" />
              <input
                type="text"
                placeholder="Cari wilayah di Jawa Tengah"
                className="w-full bg-transparent text-lg outline-none placeholder:text-gray-400"
              />
            </div>
          </div>

          <HeroVisual />
        </div>
      </section>

      {/* FITUR UTAMA */}
      <section className="bg-sentra-page py-16 lg:py-20">
        <Reveal>
          <h2 className="px-6 text-center text-3xl font-bold tracking-[0.2em] text-sentra-green md:text-4xl">
            Fitur Utama
          </h2>
          <p className="mx-auto mt-3 max-w-xl px-6 text-center text-gray-500">
            Semua yang Anda butuhkan untuk memahami kebutuhan wilayah dan
            menentukan program yang tepat.
          </p>
        </Reveal>

        <div className="mt-8">
          <FiturMarquee daftar={fitur} />
        </div>
      </section>

      {/* CARA KERJA SENTRA */}
      <section className="bg-sentra-sage px-6 py-12 md:px-16 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-xl font-semibold tracking-[0.15em] text-sentra-green">
          CARA KERJA SENTRA
        </h2>
      </div>

        <div className="mt-10 grid grid-cols-3 gap-10">
          {caraKerja.map((item) => (
            <div
              key={item.title}
              className="rounded-lg border border-sentra-stroke bg-sentra-tinybitdarkercream p-7">
              <h3 className="font-mono text-xl font-semibold tracking-widest text-black">
                {item.title}
              </h3>
              <p className="mt-3 font-mono text-sm leading-relaxed tracking-widest text-gray-700">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>
            {/* AJAKAN BERTINDAK */}
            <section className="px-6 py-16 lg:py-20">
        <Reveal>
          <div className="mx-auto max-w-5xl rounded-3xl bg-sentra-darkergreen px-8 py-12 text-center text-sentra-cream shadow-xl">
            <h2 className="text-3xl font-bold md:text-4xl">
              Siap menjelajahi Jawa Tengah?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sentra-cream/80">
              Lihat kebutuhan tiap wilayah di peta, atau cocokkan rencana
              programmu dengan wilayah yang paling membutuhkan.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to="/peta"
                className="rounded-full bg-sentra-yellow px-7 py-3 font-semibold text-black transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                Jelajahi Peta
              </Link>
              <Link
                to="/smart-matching"
                className="rounded-full border border-sentra-cream/60 px-7 py-3 font-semibold transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                Coba Smart Matching
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  )
}

export default Beranda