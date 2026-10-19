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
      <section className="bg-sentra-green/80 px-32 py-24">
        <p className="text-lg font-bold tracking-[0.2em] text-sentra-darkergreen">
          SELAMAT DATANG DI
        </p>

        <h1 className="text-8xl font-extrabold text-sentra-bitdarkercream">
          SENTRA
        </h1>

        <h2 className="text-4xl font-semibold text-sentra-bitdarkercream">
          Spatial Needs & Response Analytics
        </h2>

        <p className="mt-6 max-w-2xl text-xl leading-snug text-white">
          Platform Informasi Geografis untuk memetakan kebutuhan wilayah,
          menganalisis data sektoral, dan memberikan rekomendasi program
          pembangunan yang tepat sasaran berbasis wilayah di Jawa Tengah
        </p>

        <div className="mt-10 flex max-w-3xl items-center gap-3 bg-white px-5 py-4 shadow">
          <Search className="h-6 w-6 text-black" />
          <input
            type="text"
            placeholder="Cari wilayah di Jawa Tegah"
            className="w-full bg-transparent text-xl outline-none placeholder:text-gray-400"
          />
        </div>
      </section>

      {/* FITUR UTAMA */}
      <section className="px-32 py-20">
        <h2 className="text-center text-4xl font-bold tracking-[0.2em] text-sentra-green">
          Fitur Utama
        </h2>
        
        <div className="mx-auto mt-14 grid max-w-5xl grid-cols-3 gap-x-32 gap-y-10">
          {fitur.map((item) => (
            <FeatureCard key={item.title} {...item} />
            ))}
        </div>
      </section>

      {/* CARA KERJA SENTRA */}
      <section className="bg-sentra-lightgreen/50 px-28 py-16">
        <h2 className="text-xl font-semibold tracking-[0.15em] text-sentra-green">
          CARA KERJA SENTRA
        </h2>

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
    </div>
  )
}

export default Beranda