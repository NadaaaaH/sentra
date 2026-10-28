import { Link } from 'react-router'

const tautan = [
  { label: 'Beranda', to: '/' },
  { label: 'Jelajahi Peta', to: '/peta' },
  { label: 'Smart Matching', to: '/smart-matching' },
  { label: 'Data & Sumber', to: '/data' },
]

function Footer() {
  return (
    <footer className="mt-auto">
      {/* gelombang bergerak: dua lapis dengan kecepatan berbeda */}
      <div className="relative -mb-px h-10 overflow-hidden md:h-16" aria-hidden="true">
        <svg
          className="ombak-belakang absolute bottom-0 left-0 h-full w-[200%]"
          viewBox="0 0 2880 120"
          preserveAspectRatio="none"
        >
          <g fill="#A9B494">
            <path d="M0 50 C240 110 480 0 720 50 C960 100 1200 -10 1440 50 L1440 120 L0 120 Z" />
            <path
              transform="translate(1440 0)"
              d="M0 50 C240 110 480 0 720 50 C960 100 1200 -10 1440 50 L1440 120 L0 120 Z"
            />
          </g>
        </svg>

        <svg
          className="ombak-depan absolute bottom-0 left-0 h-full w-[200%]"
          viewBox="0 0 2880 120"
          preserveAspectRatio="none"
        >
          <g fill="#587042">
            <path d="M0 80 C240 40 480 120 720 80 C960 40 1200 120 1440 80 L1440 120 L0 120 Z" />
            <path
              transform="translate(1440 0)"
              d="M0 80 C240 40 480 120 720 80 C960 40 1200 120 1440 80 L1440 120 L0 120 Z"
            />
          </g>
        </svg>
      </div>

      <div className="bg-sentra-green text-sentra-cream">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-3 md:px-12">
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

        <div className="border-t border-white/15">
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