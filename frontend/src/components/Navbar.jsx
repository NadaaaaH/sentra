import { useState, useEffect } from 'react'
import { NavLink } from 'react-router'
import { Menu, X } from 'lucide-react'

const menu = [
  { label: 'Beranda', to: '/' },
  { label: 'Jelajahi Peta', to: '/peta' },
  { label: 'Smart Matching', to: '/smart-matching' },
  { label: 'Data', to: '/data' },
]

function Navbar() {
  const [terbuka, setTerbuka] = useState(false)
  const [tergulir, setTergulir] = useState(false)

  useEffect(() => {
    const cek = () => setTergulir(window.scrollY > 20)
    cek()
    window.addEventListener('scroll', cek, { passive: true })
    return () => window.removeEventListener('scroll', cek)
  }, [])

  const kelas = ({ isActive }) =>
    isActive
      ? 'text-lg font-semibold text-sentra-green'
      : 'text-lg text-black transition hover:text-sentra-green'

  return (
    <header
      className={`sticky top-0 z-[1100] bg-sentra-cream transition-shadow duration-300 ${
        tergulir ? 'shadow-lg' : 'shadow'
      }`}
    >
      <div
        className={`flex items-center justify-between px-6 transition-all duration-300 md:px-12 ${
          tergulir ? 'py-2' : 'py-3 md:py-4'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`rounded-full bg-gray-400 transition-all duration-300 ${
              tergulir ? 'h-10 w-10 md:h-11 md:w-11' : 'h-12 w-12 md:h-16 md:w-16'
            }`}
          />
          <div>
            <p
              className={`font-bold leading-none transition-all duration-300 ${
                tergulir ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'
              }`}
            >
              SENTRA
            </p>
            <p
              className={`hidden text-sm transition-all duration-300 sm:block ${
                tergulir ? 'max-h-0 overflow-hidden opacity-0' : 'max-h-6 opacity-100'
              }`}
            >
              Spatial Needs & Response Analytics
            </p>
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
        <nav className="flex flex-col gap-4 border-t border-sentra-stroke px-6 py-4 md:hidden">
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
    </header>
  )
}

export default Navbar