import { useCallback, useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { GeoJSON, Pane, useMap, useMapEvents } from 'react-leaflet'
import indonesia from '../../data/indonesia.json'
import jateng from '../../data/jateng.json'

const GAYA_INDONESIA = { color: '#FFFFFF', weight: 0.8, fillColor: '#CFD2CC', fillOpacity: 1 }

// ---------- Bersihkan lubang kecil (sliver) di poligon kabupaten ----------
function luasRing(ring) {
  let a = 0
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    a += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1]
  }
  return Math.abs(a / 2)
}

function buangLubangKecil(geojson, batas = 0.0002) {
  const bersih = (poly) => poly.filter((ring, i) => i === 0 || luasRing(ring) >= batas)
  return {
    ...geojson,
    features: geojson.features.map((f) => {
      const g = f.geometry
      if (!g) return f
      if (g.type === 'Polygon') return { ...f, geometry: { ...g, coordinates: bersih(g.coordinates) } }
      if (g.type === 'MultiPolygon')
        return { ...f, geometry: { ...g, coordinates: g.coordinates.map(bersih) } }
      return f
    }),
  }
}

const JATENG = buangLubangKecil(jateng)
const STYLE_HOVER = { color: '#111827', weight: 2, fillOpacity: 0.95 }
const STYLE_TERPILIH = { color: '#111827', weight: 3, fillOpacity: 1 }

// Semua file desa yang ada di folder data/desa (dicek dulu sebelum di-load)
const FILE_DESA = import.meta.glob('../../data/desa/desa_*.json')

// PALET WARNA URGENSI DESA
const WARNA_URGENSI = {
  1: '#2c7bb6',
  2: '#abd9e9',
  3: '#ffffbf',
  4: '#fdae61',
  5: '#d7191c',
  0: '#cccccc',
}
const NAMA_URGENSI = { 1: 'Aman', 2: 'Ringan', 3: 'Sedang', 4: 'Urgent', 5: 'Sangat urgent' }
const teksKelas = (k) => (k === 0 || k === 2 || k === 3 ? '#1f2937' : '#FFFFFF')

// PALET WARNA KABUPATEN
const PALET_KAB = [
  '#F94144', '#F3722C', '#F8961E', '#F9C74F', '#90BE6D', '#43AA8B',
  '#4D908E', '#577590', '#277DA1', '#9B5DE5', '#F15BB5', '#00BBF9',
]

const KODE_BY_NAMA = {
  cilacap: '3301', banyumas: '3302', purbalingga: '3303', banjarnegara: '3304',
  kebumen: '3305', purworejo: '3306', wonosobo: '3307', magelang: '3308',
  boyolali: '3309', klaten: '3310', sukoharjo: '3311', wonogiri: '3312',
  karanganyar: '3313', sragen: '3314', grobogan: '3315', blora: '3316',
  rembang: '3317', pati: '3318', kudus: '3319', jepara: '3320',
  demak: '3321', semarang: '3322', temanggung: '3323', kendal: '3324',
  batang: '3325', pekalongan: '3326', pemalang: '3327', tegal: '3328',
  brebes: '3329',
  'kota magelang': '3371', 'kota surakarta': '3372', 'kota solo': '3372',
  'kota salatiga': '3373', 'kota semarang': '3374',
  'kota pekalongan': '3375', 'kota tegal': '3376',
}

function bersihkanKode(v) {
  return String(v).replace('.0', '').trim()
}

function getKodeBPS(feature) {
  const p = feature.properties
  if (p.kode_kab) return bersihkanKode(p.kode_kab)
  if (p.kode) return bersihkanKode(p.kode)
  if (p.id && /^\d{4}$/.test(p.id)) return p.id
  const nama = (p.label || '').toLowerCase().replace('kabupaten ', '').trim()
  return KODE_BY_NAMA[nama] ?? null
}

// Mock jumlah desa (sementara). Kalau file desa sudah terbuka, angka asli dipakai.
function getJumlahDesa(kode) {
  const data = {
    '3301': 269, '3302': 331, '3303': 239, '3304': 278, '3305': 460, '3306': 494,
    '3307': 265, '3308': 372, '3309': 267, '3310': 401, '3311': 167, '3312': 294,
    '3313': 208, '3314': 208, '3315': 280, '3316': 295, '3317': 294, '3318': 406,
    '3319': 132, '3320': 195, '3321': 281, '3322': 235, '3323': 287, '3324': 286,
    '3325': 248, '3326': 285, '3327': 222, '3328': 287, '3329': 292,
  }
  return data[kode] ?? null
}

function warnaKab(f) {
  const kode = getKodeBPS(f) ?? f.properties.id ?? ''
  const n = Number(String(kode).slice(-2)) || 0
  return PALET_KAB[n % PALET_KAB.length]
}

function ruangSidebar() {
  const desktop = window.innerWidth >= 768
  return {
    paddingTopLeft: [40, 80],
    paddingBottomRight: desktop ? [380, 40] : [20, window.innerHeight * 0.5],
  }
}

// ---------- Pill info di atas peta ----------
function InfoHover({ fitur, tipe, jumlahDesaMuat }) {
  if (!fitur) return null

  const kotak =
    'pointer-events-none absolute left-1/2 top-20 z-[1000] flex -translate-x-1/2 items-center gap-3 rounded-2xl bg-white/95 px-4 py-2.5 text-sm shadow-xl ring-1 ring-black/5 backdrop-blur md:top-6'

  if (tipe === 'desa') {
    const kelas = fitur.properties.kelas || 0
    return (
      <div className={kotak}>
        <span
          className="h-3 w-3 rounded-full ring-2 ring-white"
          style={{ background: WARNA_URGENSI[kelas] }}
        />
        <span className="font-semibold text-gray-900">{fitur.properties.nama_desa}</span>
        <span className="h-4 w-px bg-gray-200" />
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          Urgensi
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-bold"
            style={{ background: WARNA_URGENSI[kelas], color: teksKelas(kelas) }}
          >
            {fitur.properties.label || NAMA_URGENSI[kelas] || 'Belum dinilai'}
          </span>
        </span>
      </div>
    )
  }

  const kode = getKodeBPS(fitur)
  const jumlahDesa = jumlahDesaMuat?.[kode] ?? getJumlahDesa(kode)

  return (
    <div className={kotak}>
      <span className="h-3 w-3 rounded-full ring-2 ring-white" style={{ background: warnaKab(fitur) }} />
      <span className="font-semibold text-gray-900">{fitur.properties.label}</span>
      <span className="h-4 w-px bg-gray-200" />
      <span className="text-xs text-gray-500">
        {jumlahDesa != null ? (
          <>
            <b className="text-gray-800">{jumlahDesa}</b> Desa/Kelurahan
          </>
        ) : (
          'Jumlah desa belum tersedia'
        )}
      </span>
    </div>
  )
}

function LegendaUrgensi() {
  return (
    <div className="absolute bottom-6 left-28 z-[1000] hidden rounded-2xl bg-white/95 px-4 py-3 shadow-xl ring-1 ring-black/5 backdrop-blur md:block">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
        Tingkat urgensi desa
      </p>
      <div className="flex items-center gap-3">
        {[1, 2, 3, 4, 5].map((k) => (
          <div key={k} className="flex items-center gap-1.5 text-[11px] text-gray-700">
            <span
              className="h-3.5 w-3.5 rounded ring-1 ring-black/10"
              style={{ background: WARNA_URGENSI[k] }}
            />
            {NAMA_URGENSI[k]}
          </div>
        ))}
      </div>
    </div>
  )
}

function PetaWilayah({ terpilihId, onPilih, sinyal, onKembali, initialDesaId }) {
  const map = useMap()
  const initialKodeKab = initialDesaId ? bersihkanKode(initialDesaId).slice(0, 4) : null
  const initialKabupaten = initialKodeKab
    ? JATENG.features.find((feature) => getKodeBPS(feature) === initialKodeKab)
    : null
  const [hover, setHover] = useState(null)
  const [kabupatenAktif, setKabupatenAktif] = useState(initialKabupaten ? initialKodeKab : null)
  const [namaKabAktif, setNamaKabAktif] = useState(initialKabupaten?.properties.label ?? null)
  const [desaData, setDesaData] = useState(null)
  const [memuatDesa, setMemuatDesa] = useState(false)
  const [tidakAdaData, setTidakAdaData] = useState(null)
  const [versiDesa, setVersiDesa] = useState(0)
  const [jumlahDesaMuat, setJumlahDesaMuat] = useState({})

  const layerTerpilihRef = useRef(null)
  const desaGeoJsonRef = useRef(null)
  const initialDesaLoadRef = useRef(false)
  const initialDesaFocusRef = useRef(false)
  const initialTerpilihIdRef = useRef(terpilihId)

  const onPilihRef = useRef(onPilih)
  useEffect(() => {
    onPilihRef.current = onPilih
  })

  const tandaiZoom = useCallback(
    () => map.getContainer().classList.toggle('zoom-dekat', map.getZoom() >= 8.5),
    [map],
  )
  useMapEvents({ zoomend: tandaiZoom })

  useEffect(() => {
    tandaiZoom()
    if (initialTerpilihIdRef.current) {
      const fitur = JATENG.features.find((f) => f.properties.id === initialTerpilihIdRef.current)
      if (fitur) {
        map.fitBounds(L.geoJSON(fitur).getBounds(), { ...ruangSidebar(), maxZoom: 9, animate: false })
      }
      return
    }
    const t = setTimeout(() => {
      map.flyTo([-7.2, 110.2], 7.5, { duration: 2.4 })
    }, 500)
    return () => clearTimeout(t)
  }, [map, tandaiZoom])

  // Tandai mode desa di container (opsional untuk CSS: sembunyikan label kabupaten)
  useEffect(() => {
    map.getContainer().classList.toggle('mode-desa', Boolean(kabupatenAktif))
  }, [kabupatenAktif, map])

  // GAYA KABUPATEN
  const gaya = useCallback(
    (f) => {
      const isAktif = getKodeBPS(f) === kabupatenAktif

      // Kabupaten aktif: hanya garis tepi, supaya desa di atasnya terlihat jelas
      if (isAktif) {
        return {
          color: '#065F46',
          weight: 3,
          lineJoin: 'round',
          fillColor: '#10B981',
          fillOpacity: desaData ? 0.06 : 0.35,
        }
      }

      // Kabupaten lain diredupkan
      if (kabupatenAktif) {
        return { color: '#E5E7EB', weight: 0.8, fillColor: '#D1D5DB', fillOpacity: 0.3 }
      }

      return {
        color: '#FFFFFF',
        weight: 1.2,
        lineJoin: 'round',
        fillColor: warnaKab(f),
        fillOpacity: 0.9,
      }
    },
    [kabupatenAktif, desaData],
  )

  const ambilDesa = useCallback(async (kodeKab, preserveCurrent = false) => {
    if (!preserveCurrent) {
      setDesaData(null)
      setTidakAdaData(null)
      layerTerpilihRef.current = null
    }

    const loader = FILE_DESA[`../../data/desa/desa_${kodeKab}.json`]
    if (!loader) {
      setTidakAdaData(kodeKab)
      return
    }

    setMemuatDesa(true)
    try {
      const module = await loader()
      const data = module.default
      const jumlah = data.features.filter(
        (f) => bersihkanKode(f.properties.kode_kab) === kodeKab,
      ).length
      setJumlahDesaMuat((prev) => ({ ...prev, [kodeKab]: jumlah }))
      setDesaData(data)
      setVersiDesa((v) => v + 1)
    } catch (error) {
      console.error('Gagal memuat data desa:', error)
      setTidakAdaData(kodeKab)
    } finally {
      setMemuatDesa(false)
    }
  }, [])

  useEffect(() => {
    if (!initialDesaId || !initialKabupaten || initialDesaLoadRef.current) return
    initialDesaLoadRef.current = true
    ambilDesa(initialKodeKab, true)
  }, [ambilDesa, initialDesaId, initialKabupaten, initialKodeKab])

  useEffect(() => {
    if (!initialDesaId || !desaData || initialDesaFocusRef.current) return

    const targetLayer = desaGeoJsonRef.current
      ?.getLayers()
      .find((layer) => bersihkanKode(layer.feature?.properties?.kode_desa) === initialDesaId)
    if (!targetLayer) return

    initialDesaFocusRef.current = true
    layerTerpilihRef.current = targetLayer
    targetLayer.setStyle(STYLE_TERPILIH)
    targetLayer.bringToFront()
    map.flyTo(targetLayer.getBounds().getCenter(), 14, { duration: 1.2 })
  }, [desaData, initialDesaId, map])

  const eachFeature = (feature, layer) => {
    layer.bindTooltip(feature.properties.label.replace('Kabupaten ', ''), {
      permanent: true,
      direction: 'center',
      className: 'label-kab',
      interactive: false,
    })
    layer.on({
      mouseover: () => setHover({ data: feature, tipe: 'kabupaten' }),
      mouseout: () => setHover(null),
      click: () => {
        const kodeBPS = getKodeBPS(feature)
        map.flyToBounds(layer.getBounds(), { ...ruangSidebar(), maxZoom: 11, duration: 1.2 })

        onPilihRef.current(feature, 'kabupaten', null, kodeBPS)

        if (kodeBPS) {
          setKabupatenAktif(kodeBPS)
          setNamaKabAktif(feature.properties.label)
          ambilDesa(kodeBPS)
        }
      },
    })
  }

  // GAYA DESA
  const gayaDesa = (feature) => ({
    color: '#FFFFFF',
    weight: 0.6,
    lineJoin: 'round',
    fillColor: WARNA_URGENSI[feature.properties.kelas || 0],
    fillOpacity: 0.85,
  })
  const lepasPilihanDesa = useCallback(() => {
    const layer = layerTerpilihRef.current
    if (layer?.feature) layer.setStyle(gayaDesa(layer.feature))
    layerTerpilihRef.current = null
  }, [])

  const eachFeatureDesa = (feature, layer) => {
    layer.bindTooltip(feature.properties.nama_desa, { direction: 'top', sticky: true })
    layer.on({
      mouseover: () => {
        if (layerTerpilihRef.current !== layer) layer.setStyle(STYLE_HOVER)
        layer.bringToFront()
        setHover({ data: feature, tipe: 'desa' })
      },
      mouseout: () => {
        if (layerTerpilihRef.current !== layer) layer.setStyle(gayaDesa(feature))
        setHover(null)
      },
      click: () => {
        lepasPilihanDesa()
        layerTerpilihRef.current = layer
        layer.setStyle(STYLE_TERPILIH)
        layer.bringToFront()
        onPilihRef.current(feature, 'desa', namaKabAktif)
      },
    })
  }

  const resetDesa = useCallback(() => {
    layerTerpilihRef.current = null
    setDesaData(null)
    setTidakAdaData(null)
    setMemuatDesa(false)
    setKabupatenAktif(null)
    setNamaKabAktif(null)
    setHover(null)
    map.flyTo([-7.2, 110.2], 7.5, { duration: 1 })
  }, [map])

  // Sinyal dari parent (tombol X di panel profil)
  useEffect(() => {
    if (!sinyal || sinyal.n === 0) return
    // The parent signal must also reset the Leaflet layer state owned here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (sinyal.jenis === 'reset') resetDesa()
    else if (sinyal.jenis === 'lepasDesa') lepasPilihanDesa()
  }, [lepasPilihanDesa, resetDesa, sinyal])

  const terpilih = JATENG.features.find((f) => f.properties.id === terpilihId)

  return (
    <>
      {kabupatenAktif && (
        <div className="absolute left-4 top-24 z-[1000] flex flex-col gap-2">
          <button
            onClick={() => {
              resetDesa()
              onKembali?.()
            }}
            className="rounded-full bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-lg ring-1 ring-black/5 hover:bg-gray-100"
          >
            ← Kembali ke Peta Kabupaten
          </button>
          {memuatDesa && (
            <div className="flex items-center gap-2 rounded-xl bg-white/95 px-4 py-2 text-sm text-gray-600 shadow-lg">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-emerald-600" />
              Memuat data desa…
            </div>
          )}
          {tidakAdaData && (
            <div className="rounded-xl bg-white/95 px-4 py-2 text-sm text-gray-600 shadow-lg">
              Data desa untuk wilayah ini belum tersedia.
            </div>
          )}
        </div>
      )}

      <Pane name="indonesia">
        <GeoJSON data={indonesia} pane="indonesia" interactive={false} style={GAYA_INDONESIA} />
      </Pane>

      <Pane name="jateng">
        <GeoJSON data={JATENG} pane="jateng" style={gaya} onEachFeature={eachFeature} />
      </Pane>

      {desaData && (
        <Pane name="desa" style={{ zIndex: 500 }}>
          <GeoJSON
            key={`desa-${kabupatenAktif}-${versiDesa}-${namaKabAktif}`}
            ref={desaGeoJsonRef}
            data={desaData}
            style={gayaDesa}
            onEachFeature={eachFeatureDesa}
            filter={(feature) =>
              bersihkanKode(feature.properties.kode_kab) === bersihkanKode(kabupatenAktif)
            }
          />
        </Pane>
      )}

      <Pane name="angkat">
        {terpilih && !kabupatenAktif && (
          <GeoJSON
            key={`t-${terpilih.properties.id}`}
            data={terpilih}
            pane="angkat"
            interactive={false}
            style={gaya}
          />
        )}
      </Pane>

      {desaData && <LegendaUrgensi />}

      <InfoHover
        fitur={hover?.data ?? (terpilih && !kabupatenAktif ? terpilih : null)}
        tipe={hover?.tipe}
        jumlahDesaMuat={jumlahDesaMuat}
      />
    </>
  )
}

export default PetaWilayah