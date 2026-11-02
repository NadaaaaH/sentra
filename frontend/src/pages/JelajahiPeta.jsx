import 'leaflet/dist/leaflet.css'
import '../components/peta/peta.css'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import { GeoJSON, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import SearchBar from '../components/peta/SearchBar'
import LayerButton from '../components/peta/LayerButton'
import LayerPanel from '../components/peta/LayerPanel'
import ZoomButtons from '../components/peta/ZoomButtons'
import ProfilWilayah from '../components/peta/ProfilWilayah'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

const BATAS_JAWA_TENGAH = [
  [-8.8, 108.0],
  [-5.8, 112.2],
]

async function getApiData(path, signal) {
  const response = await fetch(`${API_BASE_URL}${path}`, { signal })
  const payload = await response.json()

  if (!response.ok) {
    throw new Error(payload.message || `Permintaan gagal (${response.status})`)
  }

  return payload
}

const gayaDesa = {
  color: '#315b46',
  weight: 1,
  fillColor: '#73a887',
  fillOpacity: 0.16,
}

function LapisanDesa({ onPilihDesa, onStatus }) {
  const map = useMap()
  const [lapisan, setLapisan] = useState(null)
  const timer = useRef(null)
  const controller = useRef(null)
  const nomorPermintaan = useRef(0)

  const onEachFeature = useCallback((feature, layer) => {
    layer.on('click', () => {
      const kodeDesa = feature.properties?.kode_desa
      if (kodeDesa) onPilihDesa(kodeDesa)
    })
  }, [onPilihDesa])

  const muatDesaTerlihat = useCallback(() => {
    window.clearTimeout(timer.current)
    controller.current?.abort()

    const zoom = map.getZoom()
    if (zoom < 10) {
      nomorPermintaan.current++
      setLapisan(null)
      onStatus('Perbesar peta ke level 10 untuk melihat batas desa.')
      return
    }

    const bounds = map.getBounds()
    const params = new URLSearchParams({
      west: bounds.getWest().toFixed(4),
      south: bounds.getSouth().toFixed(4),
      east: bounds.getEast().toFixed(4),
      north: bounds.getNorth().toFixed(4),
      zoom: String(zoom),
    })
    const key = params.toString()
    const nomor = ++nomorPermintaan.current

    onStatus('Memuat batas desa di area peta...')
    timer.current = window.setTimeout(async () => {
      const requestController = new AbortController()
      controller.current = requestController

      try {
        const data = await getApiData(
          `/api/map/desa?${key}`,
          requestController.signal
        )
        if (data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
          throw new Error('Format data peta desa tidak valid.')
        }
        if (nomor !== nomorPermintaan.current) return

        setLapisan({ data, key })
        onStatus(
          data.truncated
            ? 'Batas desa terlalu banyak untuk area ini. Perbesar peta agar lebih ringan.'
            : ''
        )
      } catch (error) {
        if (!requestController.signal.aborted && nomor === nomorPermintaan.current) {
          onStatus(`Gagal memuat peta desa: ${error.message}`)
        }
      }
    }, 200)
  }, [map, onStatus])

  useMapEvents({ moveend: muatDesaTerlihat })

  useEffect(() => {
    timer.current = window.setTimeout(muatDesaTerlihat, 0)

    return () => {
      window.clearTimeout(timer.current)
      controller.current?.abort()
    }
  }, [muatDesaTerlihat])

  if (!lapisan) return null

  return (
    <GeoJSON
      key={lapisan.key}
      data={lapisan.data}
      style={gayaDesa}
      onEachFeature={onEachFeature}
    />
  )
}

function JelajahiPeta() {
  const { state } = useLocation()
  const [panelTerbuka, setPanelTerbuka] = useState(false)
  const [aktif, setAktif] = useState({ administrasi: null, indikator: null })
  const [statusPeta, setStatusPeta] = useState('')
  const [detail, setDetail] = useState(null)
  const [detailMemuat, setDetailMemuat] = useState(Boolean(state?.wilayahId))
  const [errorDetail, setErrorDetail] = useState('')
  const [profilTerbuka, setProfilTerbuka] = useState(Boolean(state?.wilayahId))
  const nomorPermintaan = useRef(0)

  const bukaDetailDesa = useCallback(async (kodeDesa) => {
    const nomor = ++nomorPermintaan.current
    setDetail(null)
    setErrorDetail('')
    setDetailMemuat(true)
    setProfilTerbuka(true)
    setPanelTerbuka(false)

    try {
      const payload = await getApiData(
        `/api/v1/regions/desa/${encodeURIComponent(kodeDesa)}`
      )

      if (!payload.data) throw new Error('Data detail desa tidak ditemukan.')
      if (nomor === nomorPermintaan.current) setDetail(payload.data)
    } catch (error) {
      if (nomor === nomorPermintaan.current) setErrorDetail(error.message)
    } finally {
      if (nomor === nomorPermintaan.current) setDetailMemuat(false)
    }
  }, [])

  useEffect(() => {
    if (!state?.wilayahId) return undefined

    const nomor = ++nomorPermintaan.current
    const controller = new AbortController()
    getApiData(
      `/api/v1/regions/desa/${encodeURIComponent(state.wilayahId)}`,
      controller.signal
    )
      .then((payload) => {
        if (!payload.data) throw new Error('Data detail desa tidak ditemukan.')
        if (nomor === nomorPermintaan.current) setDetail(payload.data)
      })
      .catch((error) => {
        if (!controller.signal.aborted && nomor === nomorPermintaan.current) {
          setErrorDetail(error.message)
        }
      })
      .finally(() => {
        if (nomor === nomorPermintaan.current) setDetailMemuat(false)
      })

    return () => controller.abort()
  }, [state?.wilayahId])

  const toggleLapisan = (kelompok, id) => {
    setAktif((sebelumnya) => ({
      ...sebelumnya,
      [kelompok]: sebelumnya[kelompok] === id ? null : id,
    }))
  }

  const handleBukaLapisan = () => {
    setPanelTerbuka(true)
    // di HP, dua panel tidak muat bersamaan
    if (window.innerWidth < 768) setProfilTerbuka(false)
  }

  const handleTutupPopup = () => {
    nomorPermintaan.current++
    setDetail(null)
    setErrorDetail('')
    setDetailMemuat(false)
    setProfilTerbuka(false)
  }

  return (
    <div className="relative isolate h-full">
      <MapContainer
        center={[-7.15, 110.1]}
        zoom={9}
        minZoom={9}
        maxBounds={BATAS_JAWA_TENGAH}
        maxBoundsViscosity={1.0}
        zoomControl={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          noWrap={true}
        />
        <LapisanDesa onPilihDesa={bukaDetailDesa} onStatus={setStatusPeta} />
        <ZoomButtons />
      </MapContainer>

      {statusPeta && (
        <div
          role={statusPeta.startsWith('Gagal') ? 'alert' : 'status'}
          className="absolute bottom-4 left-4 z-[1000] max-w-[min(90%,28rem)] rounded bg-white p-3 text-sm shadow"
        >
          {statusPeta}
        </div>
      )}

      <SearchBar />

      {panelTerbuka ? (
        <LayerPanel
          aktif={aktif}
          onToggle={toggleLapisan}
          onClose={() => setPanelTerbuka(false)}
        />
      ) : (
        <LayerButton onClick={handleBukaLapisan} />
      )}

      {profilTerbuka && (
        <ProfilWilayah
          wilayah={detail}
          memuat={detailMemuat}
          error={errorDetail}
          onClose={handleTutupPopup}
        />
      )}
    </div>
  )
}

export default JelajahiPeta