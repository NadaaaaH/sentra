import { motion } from 'motion/react'
import { MapPin } from 'lucide-react'

const muncul = (delay) => ({
  initial: { opacity: 0, y: 30, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.6, delay, ease: 'easeOut' },
})

const titik = [
  { x: 110, y: 195, warna: '#587042' },
  { x: 170, y: 170, warna: '#F6C531' },
  { x: 225, y: 150, warna: '#DE7F1A' },
  { x: 285, y: 160, warna: '#9B1C0F' },
  { x: 250, y: 210, warna: '#587042' },
  { x: 330, y: 185, warna: '#F6C531' },
  { x: 195, y: 225, warna: '#DE7F1A' },
]

function HeroVisual() {
  return (
    // Kotak berskala: tinggi mengikuti rasio, dan semua posisi/ukuran di dalam
    // memakai cqw (persen lebar kotak ini), sehingga susunan tetap sama di zoom apa pun.
    <div
      className="relative mx-auto hidden aspect-[100/85] w-full min-w-0 max-w-[34rem] md:block"
      style={{ containerType: 'inline-size' }}
    >
      {/* KARTU PETA */}
      <motion.div
        {...muncul(0.2)}
        className="absolute left-[6cqw] right-[3cqw] top-[5cqw] h-[63cqw] overflow-hidden rounded-[4cqw] border border-white/60 bg-sentra-cream shadow-2xl"
      >
        <svg
          viewBox="0 0 400 277"
          className="h-full w-full"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <g stroke="#D8D8D8" strokeWidth="1" opacity="0.7">
            {[50, 100, 150, 200, 250, 300, 350].map((x) => (
              <line key={`v${x}`} x1={x} y1="0" x2={x} y2="277" />
            ))}
            {[55, 110, 165, 220].map((y) => (
              <line key={`h${y}`} x1="0" y1={y} x2="400" y2={y} />
            ))}
          </g>

          {/* siluet abstrak (bukan bentuk asli Jawa Tengah), diposisikan di tengah kartu */}
          <g transform="translate(0 -49)">
            <path
              d="M30 210 C60 170 110 175 150 160 C200 140 230 120 290 130 C340 138 370 150 380 175 C385 200 350 215 310 220 C260 228 230 250 180 245 C130 240 90 250 60 240 C40 235 25 225 30 210 Z"
              fill="#A9B494"
              fillOpacity="0.55"
              stroke="#587042"
              strokeWidth="2"
            />

            {titik.map((t, i) => (
              <motion.circle
                key={i}
                cx={t.x}
                cy={t.y}
                r="9"
                fill={t.warna}
                stroke="#FAF7E6"
                strokeWidth="3"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8 + i * 0.1, type: 'spring', stiffness: 260, damping: 14 }}
                style={{ transformOrigin: `${t.x}px ${t.y}px` }}
              />
            ))}
          </g>
        </svg>
      </motion.div>

      {/* CHIP LOKASI: menjorok ke kiri-atas peta */}
      <motion.div
        {...muncul(0.9)}
        className="absolute left-0 top-0 z-20 flex items-center gap-[1.2cqw] rounded-full bg-white px-[3cqw] py-[1.4cqw] text-[2.6cqw] font-medium shadow-lg"
      >
        <MapPin className="h-[3cqw] w-[3cqw] text-sentra-green" />
        Kab. Batang, Jawa Tengah
      </motion.div>

      {/* KARTU INDEKS URGENSI: kiri bawah, menjorok keluar peta */}
      <motion.div
        {...muncul(1.2)}
        className="absolute bottom-0 left-0 z-10 w-[40cqw] rounded-[3cqw] bg-sentra-green p-[3cqw] text-sentra-cream shadow-xl"
      >
        <p className="text-[2.2cqw] text-sentra-cream/80">Indeks Urgensi</p>
        <p className="mt-[0.5cqw] text-[7cqw] font-bold leading-none">79</p>
        <div className="mt-[2cqw] h-[1.4cqw] overflow-hidden rounded-full bg-white/30">
          <div className="h-full w-[79%] rounded-full bg-sentra-orange" />
        </div>
        <p className="mt-[1.5cqw] text-[2cqw] text-sentra-cream/80">
          Kategori: Tinggi
        </p>
      </motion.div>

      {/* KARTU REKOMENDASI: kanan, lebih tinggi dari kartu urgensi */}
      <motion.div
        {...muncul(1.5)}
        className="absolute right-0 top-[59cqw] z-10 w-[49cqw] rounded-[3cqw] bg-white p-[3cqw] shadow-xl"
      >
        <div className="flex items-start justify-between gap-[1.5cqw]">
          <div className="min-w-0">
            <p className="text-[2.5cqw] font-semibold leading-tight">
              Layanan Kesehatan Terpadu
            </p>
            <p className="mt-[0.6cqw] text-[2cqw] text-gray-500">Kesehatan</p>
          </div>
          <span className="shrink-0 rounded-full bg-sentra-lightgreen/40 px-[1.6cqw] py-[0.5cqw] text-[1.9cqw] font-medium">
            94% cocok
          </span>
        </div>
        <div className="mt-[2cqw] h-[1.4cqw] rounded-full bg-sentra-lightgreen/50">
          <div className="h-full w-[94%] rounded-full bg-sentra-green" />
        </div>
      </motion.div>
    </div>
  )
}

export default HeroVisual