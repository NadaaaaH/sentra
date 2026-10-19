import { ArrowRight, SearchCheck } from 'lucide-react'
import { useNavigate } from 'react-router'

function HasilKosong() {
  return (
    <div className="flex min-h-[570px] flex-1 flex-col items-center justify-center rounded-sm border border-dashed border-gray-500 bg-sentra-tinybitdarkercream/60 px-6 text-center">
      <SearchCheck className="h-11 w-11 text-sentra-green" strokeWidth={1.5} />
      <h3 className="mt-4 text-3xl font-medium">Siap mencocokkan program</h3>
      <p className="mt-2 max-w-md text-lg tracking-wide text-gray-500">
        Lengkapi kolom rencana program, lalu tekan tombol “Temukan wilayah”
        untuk melihat rekomendasi
      </p>
    </div>
  )
}

function HasilPencocokan({ hasil }) {
  const navigate = useNavigate()
  if (hasil === null) return <HasilKosong />

  return (
    <div className="flex-1">
      <h2 className="font-semibold tracking-[0.2em] text-sentra-green">
        HASIL PENCOCOKKAN
      </h2>

      <div className="mt-8 space-y-5">
        {hasil.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between border border-sentra-stroke bg-white px-6 py-5"
          >
            <div>
              <p className="text-lg font-medium">{item.nama}</p>
              <p className="text-gray-600">{item.lokasi}</p>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center leading-tight">
                <p className="text-lg font-semibold">{item.skor}%</p>
                <p className="text-gray-600">cocok</p>
              </div>
              <button
                onClick={() =>
                  navigate('/peta', { state: { wilayahId: item.wilayahId } })
                }
                disabled={!item.wilayahId}
                className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"
                aria-label={`Lihat ${item.nama} di peta`}
              >
                <ArrowRight className="h-6 w-6" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default HasilPencocokan