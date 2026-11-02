import { useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { ArrowRight, SearchCheck } from 'lucide-react'

function HasilKosong() {
  return (
    <div className="flex min-h-[320px] flex-1 flex-col items-center justify-center rounded-sm border border-dashed border-gray-500 bg-sentra-tinybitdarkercream/60 px-6 text-center lg:min-h-96">
      <SearchCheck className="h-9 w-9 text-sentra-green" strokeWidth={1.5} />
      <h3 className="mt-4 text-2xl font-medium">Siap mencocokkan program</h3>
      <p className="mt-2 max-w-md text-base tracking-wide text-gray-500">
        Lengkapi kolom rencana program, lalu tekan tombol “Temukan wilayah”
        untuk melihat rekomendasi
      </p>
    </div>
  )
}

function HasilMemuat() {
  return (
    <div className="flex-1">
      <h2 className="font-semibold tracking-[0.2em] text-sentra-green">
        MENCARI WILAYAH...
      </h2>
      <div className="mt-6 space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-16 animate-pulse border border-sentra-stroke bg-white/70"
          />
        ))}
      </div>
    </div>
  )
}

function HasilPencocokan({ hasil, pesanHasil = '', memuat = false, error = '' }) {
  const navigate = useNavigate()

  if (memuat) return <HasilMemuat />
  if (error) {
    return (
      <div role="alert" className="flex-1 rounded border border-red-300 bg-red-50 p-5 text-red-800">
        Gagal memuat hasil pencocokan: {error}
      </div>
    )
  }
  if (hasil === null) return <HasilKosong />
  if (hasil.length === 0) {
    return (
      <div className="flex min-h-[320px] flex-1 items-center justify-center rounded-sm border border-dashed border-gray-500 px-6 text-center text-gray-600">
        {pesanHasil || 'Belum ada wilayah dengan data indikator yang cukup untuk bidang ini.'}
      </div>
    )
  }

  return (
    <div className="flex-1">
      <h2 className="font-semibold tracking-[0.2em] text-sentra-green">
        HASIL PENCOCOKKAN
      </h2>

      <div className="mt-8 space-y-5">
        {hasil.map((item, i) => (
          <motion.div
            key={item.region_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="flex items-center justify-between gap-4 border border-sentra-stroke bg-white px-4 py-3.5 transition hover:-translate-y-0.5 hover:border-sentra-green/50 hover:shadow-md md:px-5"
          >
            <div>
              <p className="font-medium">{item.village_name}</p>
              <p className="text-gray-600">Kec. {item.district_name}</p>
              <p className="mt-1 text-xs text-gray-600">
                Urgensi: {item.urgency_level} · Kelayakan: {item.feasibility_status}
              </p>
              <p className="mt-2 text-sm">{item.match_reason}</p>
              <p className="mt-1 text-sm text-sentra-green">{item.recommended_action}</p>
            </div>

            <div className="flex items-center gap-4 md:gap-6">
              <div className="text-center leading-tight">
                <p className="font-semibold">{item.match_score}%</p>
                <p className="text-gray-600">cocok</p>
              </div>
              <button
                onClick={() =>
                  navigate('/peta', { state: { wilayahId: item.region_id } })
                }
                disabled={!item.region_id}
                className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"
                aria-label={`Lihat ${item.village_name} di peta`}
              >
                <ArrowRight className="h-6 w-6" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default HasilPencocokan