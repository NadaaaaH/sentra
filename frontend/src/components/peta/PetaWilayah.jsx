import { useCallback, useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { GeoJSON, Pane, useMap, useMapEvents } from 'react-leaflet'
import indonesia from '../../data/indonesia.json'
import jateng from '../../data/jateng.json'

const GAYA_INDONESIA = { color: '#FFFFFF', weight: 0.8, fillColor: '#CFD2CC', fillOpacity: 1 }

// Semua file desa yang ada di folder data/desa (dicek dulu sebelum di-load)
const FILE_DESA = import.meta.glob('../../data/desa/desa_*.json')

// PALET WARNA URGENSI
const WARNA_URGENSI = {
  1: '#2c7bb6', // Biru (Aman)
  2: '#abd9e9', // Biru Muda (Ringan)
  3: '#ffffbf', // Kuning (Sedang)
  4: '#fdae61', // Oranye (Urgent)
  5: '#d7191c', // Merah (Sangat Urgent)
  0: '#cccccc', // Abu-abu (Belum Dinilai)
}

// Kode BPS berdasarkan NAMA wilayah (lebih aman daripada menebak dari id singkat)
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

// Mock data jumlah desa (sementara). Kalau file desa sudah terbuka, angka asli dipakai.
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

function warnaDasar(id) {
  const palet = ['#94C765', '#7DBE9B', '#C9D97A', '#E3C06B', '#E0A987', '#86B6A8']
  if (!id) return palet[0]
  return palet[(id.charCodeAt(0) * 3 + id.charCodeAt(1)) % palet.length]
}

function ruangSidebar() {
  const desktop = window.innerWidth >= 768
  return {
    paddingTopLeft: [40, 80],
    paddingBottomRight: desktop ? [380, 40] : [20, window.innerHeight * 0.5],
  }
}

function InfoHover({ fitur, tipe, jumlahDesaMuat }) {
  if (!fitur) return null

  if (tipe === 'desa') {
    const kelas = fitur.properties.kelas || 0
    return (
      <div className="pointer-events-none absolute left-1/2 top-20 z-[1000] flex -translate-x-1/2 items-center gap-3 rounded-full bg-white/95 px-5 py-2 text-sm shadow-xl backdrop-blur md:top-6">
        <span className="font-semibold">{fitur.properties.nama_desa}</span>
        <span className="h-4 w-px bg-sentra-stroke" />
        <span className="flex items-center gap-1.5 text-gray-600">
          Urgensi
          <span
            className="rounded-full px-2 py-0.5 text-xs font-bold text-white"
            style={{ background: WARNA_URGENSI[kelas] }}
          >
            {fitur.properties.label}
          </span>
        </span>
      </div>
    )
  }

  // Tooltip Kabupaten
  const kode = getKodeBPS(fitur)
  const jumlahDesa = jumlahDesaMuat?.[kode] ?? getJumlahDesa(kode)

  return (
    <div className="pointer-events-none absolute left-1/2 top-20 z-[1000] flex -translate-x-1/2 items-center gap-3 rounded-full bg-white/95 px-5 py-2 text-sm shadow-xl backdrop-blur md:top-6">
      <span className="font-semibold">{fitur.properties.label}</span>
      <span className="h-4 w-px bg-sentra-stroke" />
      <span className="text-gray-600">
        {jumlahDesa != null ? (
          <>
            Memiliki <b>{jumlahDesa}</b> Desa/Kelurahan
          </>
        ) : (
          'Jumlah desa belum tersedia'
        )}
      </span>
    </div>
  )
}

function PetaWilayah({ terpilihId, indikator, onPilih }) {
  const map = useMap()
  const [hover, setHover] = useState(null)
  const [kabupatenAktif, setKabupatenAktif] = useState(null)
  const [desaData, setDesaData] = useState(null)
  const [tidakAdaData, setTidakAdaData] = useState(null)
  const [versiDesa, setVersiDesa] = useState(0)
  const [jumlahDesaMuat, setJumlahDesaMuat] = useState({})

  const onPilihRef = useRef(onPilih)
  useEffect(() => {
    onPilihRef.current = onPilih
  })

  const tandaiZoom = () =>
    map.getContainer().classList.toggle('zoom-dekat', map.getZoom() >= 8.5)
  useMapEvents({ zoomend: tandaiZoom })

  useEffect(() => {
    tandaiZoom()
    if (terpilihId) {
      const fitur = jateng.features.find((f) => f.properties.id === terpilihId)
      if (fitur) {
        map.fitBounds(L.geoJSON(fitur).getBounds(), { ...ruangSidebar(), maxZoom: 9, animate: false })
      }
      return
    }
    const t = setTimeout(() => {
      map.flyTo([-7.2, 110.2], 7.5, { duration: 2.4 })
    }, 500)
    return () => clearTimeout(t)
  }, [])

  // GAYA KABUPATEN (yang tidak aktif diredupkan)
  const gaya = useCallback(
    (f) => {
      const isAktif = getKodeBPS(f) === kabupatenAktif

      if (kabupatenAktif && !isAktif) {
        return { color: '#E5E7EB', weight: 1, fillColor: '#D1D5DB', fillOpacity: 0.3 }
      }

      return {
        color: '#FFFFFF',
        weight: isAktif ? 3 : 1.4,
        fillColor: isAktif ? '#10B981' : warnaDasar(f.properties.id),
        fillOpacity: 0.95,
      }
    },
    [kabupatenAktif, indikator],
  )

  const ambilDesa = async (kodeKab) => {
    setDesaData(null)
    setTidakAdaData(null)

    const loader = FILE_DESA[`../../data/desa/desa_${kodeKab}.json`]
    if (!loader) {
      setTidakAdaData(kodeKab)
      return
    }

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
    }
  }

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
        onPilihRef.current(feature)

        if (kodeBPS) {
          setKabupatenAktif(kodeBPS)
          ambilDesa(kodeBPS)
        }
      },
    })
  }

  // GAYA WARNA DESA (sesuai urgensi)
  const gayaDesa = (feature) => {
    const kelas = feature.properties.kelas || 0
    const isHovered =
      hover?.tipe === 'desa' &&
      hover?.data?.properties?.kode_desa === feature.properties.kode_desa

    return {
      color: '#FFFFFF',
      weight: isHovered ? 1.5 : 0.5,
      fillColor: WARNA_URGENSI[kelas],
      fillOpacity: isHovered ? 0.9 : 0.7,
    }
  }

  const eachFeatureDesa = (feature, layer) => {
    layer.bindTooltip(feature.properties.nama_desa, { direction: 'top' })
    layer.on({
      mouseover: () => setHover({ data: feature, tipe: 'desa' }),
      mouseout: () => setHover(null),
    })
  }

  const resetDesa = () => {
    setDesaData(null)
    setTidakAdaData(null)
    setKabupatenAktif(null)
    map.flyTo([-7.2, 110.2], 7.5, { duration: 1 })
  }

  const terpilih = jateng.features.find((f) => f.properties.id === terpilihId)

  return (
    <>
      {kabupatenAktif && (
        <div className="absolute top-24 left-4 z-[1000] flex flex-col gap-2">
          <button
            onClick={resetDesa}
            className="rounded-full bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-lg hover:bg-gray-100"
          >
            ← Kembali ke Peta Kabupaten
          </button>
          {tidakAdaData && (
            <div className="rounded-lg bg-white/95 px-4 py-2 text-sm text-gray-600 shadow-lg">
              Data desa untuk wilayah ini belum tersedia.
            </div>
          )}
        </div>
      )}

      <Pane name="indonesia">
        <GeoJSON data={indonesia} pane="indonesia" interactive={false} style={GAYA_INDONESIA} />
      </Pane>

      <Pane name="jateng">
        <GeoJSON data={jateng} pane="jateng" style={gaya} onEachFeature={eachFeature} />
      </Pane>

      {desaData && (
        <Pane name="desa" style={{ zIndex: 500 }}>
          <GeoJSON
            key={`desa-${kabupatenAktif}-${versiDesa}`}
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

      <InfoHover
        fitur={hover?.data ?? (terpilih && !kabupatenAktif ? terpilih : null)}
        tipe={hover?.tipe}
        jumlahDesaMuat={jumlahDesaMuat}
      />
    </>
  )
}

export default PetaWilayah