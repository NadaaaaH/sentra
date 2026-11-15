import { Link } from 'react-router'
import Gelombang from './Gelombang'
import Gunungan from './Gunungan'
import BatikLatar from './BatikLatar'

const tautan = [
  { label: 'Beranda', to: '/' },
  { label: 'Jelajahi Peta', to: '/peta' },
  { label: 'Smart Matching', to: '/smart-matching' },
  { label: 'Data & Sumber', to: '/data' },
]

function Footer() {
  return (
    <footer className="mt-auto">
      <Gelombang
        className="relative -mb-px h-10 md:h-16"
        belakang="#A9B494"
        depan="#587042"
      />

      <div className="relative overflow-hidden bg-sentra-green text-sentra-cream">
        <BatikLatar opacity={0.06} />

        <Gunungan className="absolute -bottom-8 left-6 h-52 opacity-25 md:left-20 md:h-72" />
        <Gunungan
        arah={-1}
        className="absolute -bottom-8 right-6 h-52 opacity-25 md:right-20 md:h-72"
        />

        <div className="relative z-10 mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-3 md:px-12">
          <div>
            <p className="text-3xl font-bold">SENTRA</p>
            <p className="mt-1 text-sm">Spatial Needs & Response Analytics</p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-sentra-cream/80">
              Platform informasi geografis untuk memetakan kebutuhan wilayah
              dan merekomendasikan program pembangunan di Jawa Tengah.
            </p>
          </div>

          <div>
            <p className="font-semibold tracking-widest">TAUTAN UTAMA</p>
            <ul className="mt-4 space-y-2 text-sm">
              {tautan.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-sentra-cream/80 transition hover:text-white hover:underline"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-semibold tracking-widest">TENTANG PROYEK</p>
            <ul className="mt-4 space-y-2 text-sm text-sentra-cream/80">
              <li>Proyek akademik Kelompok 11 - A2</li>
              <li>Cakupan wilayah: Jawa Tengah</li>
              <li>Data yang ditampilkan masih berupa data demonstratif</li>
            </ul>
          </div>
        </div>

        <div className="relative z-10 border-t border-white/15">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-5 font-mono text-xs tracking-wider text-sentra-cream/70 md:flex-row md:justify-between md:px-12">
            <p>© 2026 SENTRA · Spatial Needs & Response Analytics</p>
            <p>Developed for academic project</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer