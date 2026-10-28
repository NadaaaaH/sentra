import { useState } from 'react'
import { useMap, useMapEvents } from 'react-leaflet'
import { X } from 'lucide-react'

function TitikTerpilih({ terpilih, tampilPopup, onKlik, onBuka, onTutup }) {
  const map = useMap()
  const [, perbarui] = useState(0)

  useMapEvents({
    click: (e) => {
      if (e.originalEvent.target.closest('[data-abaikan-klik]')) return
      onKlik(e.latlng)
    },
    move: () => perbarui((n) => n + 1),
    zoom: () => perbarui((n) => n + 1),
    zoomend: () => perbarui((n) => n + 1),
    resize: () => perbarui((n) => n + 1),
  })

  if (!terpilih) return null

  const { x, y } = map.latLngToContainerPoint(terpilih.latlng)
  const { wilayah } = terpilih

  // titik terlalu dekat tepi kanan: pop-up dibuka ke kiri
  const balik = x > map.getSize().x - 260

  return (
    <>
      {tampilPopup && (
        <div
          data-abaikan-klik
          className="absolute z-[1000]"
          style={{ left: x, top: y - 36 }}
        >
          <svg
            className={`pointer-events-none absolute left-0 top-0 overflow-visible ${
              balik ? '-scale-x-100 origin-left' : ''
            }`}
            width="64"
            height="36"
          >
            <path d="M0 36 L28 0 L64 0" fill="none" stroke="#222" strokeWidth="1" />
          </svg>

          <div
            role="button"
            tabIndex={0}
            onClick={onBuka}
            onKeyDown={(e) => e.key === 'Enter' && onBuka()}
            className={`absolute top-0 -translate-y-1/2 cursor-pointer whitespace-nowrap rounded-md border border-sentra-green bg-sentra-cream py-1 pl-2 pr-7 text-sm leading-tight shadow-md transition hover:shadow-lg ${
              balik ? 'right-16' : 'left-16'
            }`}
          >
            <p>{wilayah.nama}</p>
            <p>{wilayah.kabupaten}</p>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onTutup()
              }}
              aria-label="Tutup"
              className="absolute right-1.5 top-1 cursor-pointer text-gray-500 hover:text-black"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      <div
        className="pointer-events-none absolute z-[1000] flex h-3 w-3 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#6b6f80] bg-[#e4e4ec]"
        style={{ left: x, top: y }}
      >
        <span className="h-1 w-1 rounded-full bg-[#3f4254]" />
      </div>
    </>
  )
}

export default TitikTerpilih