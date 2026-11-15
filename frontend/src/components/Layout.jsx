import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import { motion } from 'motion/react'
import Navbar from './Navbar'
import Footer from './Footer'
import AutoSentraFont from './AutoSentraFont'

function Layout() {
  const { pathname } = useLocation()
  const halamanPeta = pathname.startsWith('/peta')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div
      className={`relative isolate flex flex-col bg-sentra-page ${
        halamanPeta ? 'h-screen overflow-hidden' : 'min-h-screen'
      }`}
    >
      <AutoSentraFont />
      <Navbar />
      <main className={halamanPeta ? 'relative min-h-0 flex-1' : 'relative flex-1'}>
        <motion.div
          key={pathname}
          className="h-full"
          initial={{ opacity: 0, y: halamanPeta ? 0 : 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <Outlet />
        </motion.div>
      </main>
      {!halamanPeta && <Footer />}
    </div>
  )
}

export default Layout