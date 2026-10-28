import { Outlet, useLocation } from 'react-router'
import Navbar from './Navbar'
import Footer from './Footer'

function Layout() {
  const { pathname } = useLocation()
  const halamanPeta = pathname.startsWith('/peta')

  return (
    <div
      className={`flex flex-col bg-sentra-page ${
        halamanPeta ? 'h-screen overflow-hidden' : 'min-h-screen'
      }`}
    >
      <Navbar />
      <main className={halamanPeta ? 'relative min-h-0 flex-1' : 'flex-1'}>
        <Outlet />
      </main>
      {!halamanPeta && <Footer />}
    </div>
  )
}

export default Layout