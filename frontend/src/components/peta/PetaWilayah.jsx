import { useCallback, useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { GeoJSON, Pane, useMap, useMapEvents } from 'react-leaflet'
import indonesia from '../../data/indonesia.json'
import jateng from '../../data/jateng.json'
import { buatProfil, nilaiIndikator } from '../../data/profilKabupaten'

// palet bernuansa Jawa Tengah untuk tampilan awal (tanpa lapisan indikator)
const PALET = ['#94C765', '#7DBE9B', '#C9D97A', '#E3C06B', '#E0A987', '#86B6A8']
const GAYA_INDONESIA = { color: '#FFFFFF', weight: 0.8, fillColor: '#CFD2CC', fillOpacity: 1 }

function warnaDasar(id) {
  return PALET[(id.charCodeAt(0) * 3 + id.charCodeAt(1)) % PALET.length]
}

function warnaNilai(n) {
  if (n < 40) return '#587042' // Rendah
  if (n < 60) return '#F6C531' // Sedang
  if (n < 80) return '#DE7F1A' // Tinggi
  return '#9B1C0F' // Kritis
}

function ruangSidebar() {
  const desktop = window.innerWidth >= 768
  return {
    paddingTopLeft: [40, 80],
    paddingBottomRight: desktop ? [380, 40] : [20, window.innerHeight * 0.5],
  }
}

// kartu info yang melayang di atas peta saat kursor berada di sebuah wilayah
function InfoHover({ fitur }) {
  if (!fitur) return null
  const profil = buatProfil(fitur.properties)

  return (
    <div
      key={fitur.properties.id}
      className="animasi-panel pointer-events-none absolute left-1/2 top-20 z-[1000] flex -translate-x-1/2 items-center gap-3 rounded-full bg-white/95 px-5 py-2 text-sm shadow-xl backdrop-blur md:top-6"
    >
      <span className="font-semibold">{fitur.properties.label}</span>
      <span className="h-4 w-px bg-sentra-stroke" />
      <span className="flex items-center gap-1.5 text-gray-600">
        Indeks Urgensi
        <span
          className="rounded-full px-2 py-0.5 text-xs font-bold text-white"
          style={{ background: warnaNilai(profil.indeksUrgensi) }}
        >
          {profil.indeksUrgensi}
        </span>
      </span>
    </div>
  )
}

function PetaWilayah({ terpilihId, indikator, onPilih }) {
  const map = useMap()
  const [hover, setHover] = useState(null)

  const onPilihRef = useRef(onPilih)
  useEffect(() => {
    onPilihRef.current = onPilih
  })

  // nama kabupaten hanya tampil saat peta di-zoom cukup dekat
  const tandaiZoom = () =>
    map.getContainer().classList.toggle('zoom-dekat', map.getZoom() >= 8.5)
  useMapEvents({ zoomend: tandaiZoom })

  useEffect(() => {
    tandaiZoom()

    // dari Smart Matching: langsung ke wilayah terpilih
    if (terpilihId) {
      const fitur = jateng.features.find((f) => f.properties.id === terpilihId)
      if (fitur) {
        map.fitBounds(L.geoJSON(fitur).getBounds(), {
          ...ruangSidebar(),
          maxZoom: 9,
          animate: false,
        })
      }
      return
    }

    // animasi pembuka: dari tampilan Indonesia terbang mendekat ke Jawa Tengah
    const t = setTimeout(() => {
      map.flyTo([-7.2, 110.2], 7.5, { duration: 2.4 })
    }, 500)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const warnaFitur = useCallback(
    (f) =>
      indikator
        ? warnaNilai(nilaiIndikator(f.properties, indikator))
        : warnaDasar(f.properties.id),
    [indikator]
  )

  const gaya = useCallback(
    (f) => ({ color: '#FFFFFF', weight: 1.4, fillColor: warnaFitur(f), fillOpacity: 0.95 }),
    [warnaFitur]
  )

  const gayaAngkat = useCallback(
    (f) => ({ color: '#FFFFFF', weight: 2.2, fillColor: warnaFitur(f), fillOpacity: 1 }),
    [warnaFitur]
  )

  const eachFeature = (feature, layer) => {
    layer.bindTooltip(feature.properties.label.replace('Kabupaten ', ''), {
      permanent: true,
      direction: 'center',
      className: 'label-kab',
      interactive: false,
    })
    layer.on({
      mouseover: () => setHover(feature),
      mouseout: () => setHover(null),
      click: () => {
        map.flyToBounds(layer.getBounds(), { ...ruangSidebar(), maxZoom: 9, duration: 0.8 })
        onPilihRef.current(feature)
      },
    })
  }

  const terpilih = jateng.features.find((f) => f.properties.id === terpilihId)
  const hoverFitur = hover && hover.properties.id !== terpilihId ? hover : null

  return (
    <>
      <Pane name="indonesia">
        <GeoJSON data={indonesia} pane="indonesia" interactive={false} style={GAYA_INDONESIA} />
      </Pane>

      <Pane name="jateng">
        <GeoJSON data={jateng} pane="jateng" style={gaya} onEachFeature={eachFeature} />
      </Pane>

      <Pane name="angkat">
        {terpilih && (
          <GeoJSON
            key={`t-${terpilih.properties.id}`}
            data={terpilih}
            pane="angkat"
            interactive={false}
            style={gayaAngkat}
          />
        )}
        {hoverFitur && (
          <GeoJSON
            key={`h-${hoverFitur.properties.id}`}
            data={hoverFitur}
            pane="angkat"
            interactive={false}
            style={gayaAngkat}
          />
        )}
      </Pane>

      <InfoHover fitur={hover ?? terpilih} />
    </>
  )
}

export default PetaWilayah