import { NavLink } from 'react-router'

const menu = [
  { label: 'Beranda', to: '/' },
  { label: 'Jelajahi Peta', to: '/peta' },
  { label: 'Smart Matching', to: '/smart-matching' },
  { label: 'Data', to: '/data' },
]

function Navbar() {
  return (
    <header className="relative z-10 flex items-center justify-between bg-sentra-cream px-12 py-4 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="h-16 w-16 rounded-full bg-gray-400" />
        <div>
          <p className="text-3xl font-bold leading-none">SENTRA</p>
          <p className="text-sm">Spatial Needs & Response Analytics</p>
        </div>
      </div>

      <nav className="flex gap-10">
        {menu.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              isActive
                ? 'text-lg font-semibold text-sentra-green'
                : 'text-lg text-black hover:text-sentra-green'
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}

export default Navbar