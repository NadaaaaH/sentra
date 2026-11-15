import { useNavigate } from 'react-router'
import { useState } from 'react'
import { motion } from 'motion/react'
import { ArrowRight, ChevronDown, SearchCheck } from 'lucide-react'

function HasilKosong({ message }) {
  return (
    <div className="flex min-h-[320px] flex-1 flex-col items-center justify-center rounded-sm border border-dashed border-gray-500 bg-sentra-tinybitdarkercream/60 px-6 text-center lg:min-h-96">
      <SearchCheck className="h-9 w-9 text-sentra-green" strokeWidth={1.5} />
      <h3 className="mt-4 text-2xl font-medium">
        {message ? 'Belum ada wilayah yang cocok' : 'Siap mencocokkan program'}
      </h3>
      <p className="mt-2 max-w-md text-base tracking-wide text-gray-500">
        {message || 'Lengkapi kolom rencana program, lalu tekan tombol “Temukan wilayah” untuk melihat rekomendasi.'}
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

function ringkasanKelayakan(message = '', sufficient = false) {
  if (sufficient) return 'Sumber daya sudah sesuai kebutuhan'

  const mentionsBudget = message.includes('Anggaran')
  const mentionsPeople = message.includes('Jumlah pelaksana')
  const mentionsDuration = message.includes('Durasi pelaksanaan')

  const issues = []
  if (mentionsBudget) issues.push('anggaran')
  if (mentionsPeople) issues.push('pelaksana')
  if (mentionsDuration) issues.push('durasi')

  if (issues.length > 1) {
    const formattedIssues = issues.length === 2
      ? `${issues[0]} dan ${issues[1]}`
      : `${issues.slice(0, -1).join(', ')}, dan ${issues.at(-1)}`
    return `${formattedIssues[0].toUpperCase()}${formattedIssues.slice(1)} berpotensi tidak mencukupi`
  }
  if (mentionsBudget) return 'Anggaran berpotensi tidak mencukupi'
  if (mentionsPeople) return 'Jumlah pelaksana berpotensi kurang'
  if (mentionsDuration) return 'Durasi berpotensi tidak mencukupi'
  return ''
}

function ringkasanAlasan(reason = '') {
  const activityReferenceIndex = reason.indexOf(' Acuan aktivitas terdekat adalah')
  return activityReferenceIndex < 0 ? reason : reason.slice(0, activityReferenceIndex).trim()
}

function KartuHasil({ item, index, navigate, recommendationContext }) {
  const [expanded, setExpanded] = useState(false)
  const resourcesSufficient = item.resources_sufficient === true
  const warningSummary = ringkasanKelayakan(item.feasibility_message, resourcesSufficient)
  const matchReason = ringkasanAlasan(item.match_reason)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="border border-sentra-stroke bg-white px-4 py-3.5 transition hover:-translate-y-0.5 hover:border-sentra-green/50 hover:shadow-md md:px-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="order-1 min-w-0 flex-1">
          <p className="font-medium">{item.nama}</p>
          <p className="text-gray-600">{item.lokasi}</p>
        </div>

        {warningSummary && (
          <p className={`order-3 w-full text-sm ${resourcesSufficient ? 'text-green-700' : 'text-amber-700'} md:order-2 md:w-auto`}>
            {warningSummary}
          </p>
        )}

        <div className="order-2 flex items-center gap-4 md:order-3 md:gap-6">
          <div className="text-center leading-tight">
            <p className="font-semibold">{item.skor}%</p>
            <p className="text-gray-600">cocok</p>
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              setExpanded((isExpanded) => !isExpanded)
            }}
            aria-expanded={expanded}
            aria-controls={`match-details-${item.id}`}
            aria-label={`${expanded ? 'Tutup' : 'Buka'} rincian kecocokan ${item.nama}`}
            className="cursor-pointer"
          >
            <ChevronDown
              className={`h-5 w-5 transition-transform${expanded ? ' rotate-180' : ''}`}
            />
          </button>
          <button
            type="button"
            onClick={() =>
              navigate('/peta', {
                state: {
                  wilayahId: item.wilayahId,
                  recommendationContext,
                },
              })
            }
            disabled={!item.wilayahId}
            className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"
            aria-label={`Lihat ${item.nama} di peta`}
          >
            <ArrowRight className="h-6 w-6" />
          </button>
        </div>
      </div>

      {expanded && (
        <div id={`match-details-${item.id}`} className="mt-3 border-t border-sentra-stroke pt-3">
          {item.feasibility_message && (
            <p className={`text-sm ${resourcesSufficient ? 'text-green-700' : 'text-amber-700'}`}>
              {item.feasibility_message}
            </p>
          )}
          <p className="mt-1 text-sm text-gray-600">
            Kebutuhan bidang: {item.urgency_level}
            {item.distance_km !== null && item.distance_km !== undefined && (
              <> · Jarak dari titik awal: {item.distance_km} km</>
            )}
          </p>
          {matchReason && (
            <p className="mt-1 text-sm text-gray-500">{matchReason}</p>
          )}
          {item.program_match_score !== undefined && (
            <p className="mt-1 text-xs text-gray-500">
              Program {item.program_match_score}%
              {item.proximity_score !== null && item.proximity_score !== undefined
                ? ` · Jarak ${item.proximity_score}%`
                : ''}
            </p>
          )}
        </div>
      )}
    </motion.div>
  )
}

function HasilPencocokan({
  hasil,
  memuat = false,
  message = '',
  error = null,
  hasMore = false,
  loadingMore = false,
  loadMoreError = null,
  onLoadMore,
  recommendationContext,
}) {
  const navigate = useNavigate()

  if (memuat) return <HasilMemuat />
  if (error) {
    return (
      <div className="flex min-h-[320px] flex-1 items-center justify-center rounded-sm border border-red-200 bg-red-50 px-6 text-center lg:min-h-96">
        <p className="max-w-md text-sm text-red-700" role="alert">{error}</p>
      </div>
    )
  }
  if (hasil === null || hasil.length === 0) return <HasilKosong message={message} />

  return (
    <div className="flex-1">
      <h2 className="font-semibold tracking-[0.2em] text-sentra-green">
        HASIL PENCOCOKKAN
      </h2>
      {message && <p className="mt-2 text-sm text-gray-600">{message}</p>}

      <div className="mt-8 space-y-5">
        {hasil.map((item, index) => (
          <KartuHasil
            key={item.id}
            item={item}
            index={index}
            navigate={navigate}
            recommendationContext={recommendationContext}
          />
        ))}
      </div>
      {hasMore && (
        <div className="mt-6">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="cursor-pointer rounded-md bg-sentra-green px-4 py-2 font-semibold text-white transition hover:bg-sentra-darkergreen disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingMore ? 'Memuat...' : 'Tampilkan lebih banyak'}
          </button>
          {loadMoreError && (
            <p className="mt-2 text-sm text-red-600" role="alert">
              Gagal memuat hasil lainnya. Coba lagi.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default HasilPencocokan