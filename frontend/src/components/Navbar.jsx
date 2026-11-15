import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router'
import { Menu, X } from 'lucide-react'
import logoSentra from '../assets/logo-sentra.png' 

const menu = [
  { label: 'Beranda', to: '/' },
  { label: 'Jelajahi Peta', to: '/peta' },
  { label: 'Smart Matching', to: '/smart-matching' },
  { label: 'Data', to: '/data' },
]

const gerak =
  'transition-[margin,height,border-radius,background-color,box-shadow,padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none'

function Navbar() {
  const [terbuka, setTerbuka] = useState(false)
  const [tergulir, setTergulir] = useState(false)

  const { pathname } = useLocation()
  const selaluBulat =
    pathname.startsWith('/peta') || pathname.startsWith('/smart-matching')
  const bulat = tergulir || selaluBulat

  useEffect(() => {
    const cek = () => setTergulir(window.scrollY > 2)
    cek()
    window.addEventListener('scroll', cek, { passive: true })
    return () => window.removeEventListener('scroll', cek)
  }, [])

  const kelas = ({ isActive }) =>
    isActive
      ? 'text-lg font-semibold text-sentra-green'
      : 'text-lg text-black transition hover:text-sentra-green'

  return (
    <header className="sticky top-0 z-[1100] h-[4.5rem] md:h-24">
      <div className="absolute inset-x-0 top-0">
        <div
          className={`flex items-center justify-between will-change-[margin,height] ${gerak} ${
            tergulir
              ? 'mx-3 mt-2 h-14 rounded-full bg-sentra-cream/90 px-5 shadow-xl backdrop-blur-md md:mx-10 md:mt-3 md:h-[4.5rem] md:px-8'
              : 'mx-0 mt-0 h-[4.5rem] rounded-none bg-sentra-cream px-6 shadow-md md:h-24 md:px-12'
          }`}
        >
          <div className="flex items-center gap-3">
            <img
              src={logoSentra}
              alt="Logo Sentra"
              className="h-11 w-11 shrink-0 object-contain md:h-14 md:w-14"
            />
            <div>
              {/* Warna hijau (text-sentra-green) dan ukuran dikecilin (text-xl md:text-2xl) */}
              <p className="text-xl font-extrabold leading-none tracking-tight text-sentra-green md:text-2xl font-sentra">
                SENTRA
              </p>
              <div
                className={`hidden grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:grid ${
                  bulat ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'
                }`}
              >
                <p className="overflow-hidden text-sm">
                  Spatial Needs & Response Analytics
                </p>
              </div>
            </div>
          </div>

          <nav className="hidden gap-10 md:flex">
            {menu.map((item) => (
              <NavLink key={item.to} to={item.to} className={kelas}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <button
            className="cursor-pointer md:hidden"
            onClick={() => setTerbuka(!terbuka)}
            aria-label="Buka menu"
          >
            {terbuka ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
          </button>
        </div>

        {terbuka && (
          <nav className="mx-3 mt-2 flex flex-col gap-4 rounded-2xl bg-sentra-cream/95 p-5 shadow-xl backdrop-blur-md md:hidden">
            {menu.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={kelas}
                onClick={() => setTerbuka(false)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </header>
  )
}

export default Navbar