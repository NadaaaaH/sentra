import { useState, useCallback, useRef, useEffect } from 'react'
import { useLocation } from 'react-router'
import { MapContainer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import '../components/peta/peta.css'
import { apiFetch } from '../lib/api'
import SearchBar from '../components/peta/SearchBar'
import LayerButton from '../components/peta/LayerButton'
import LayerPanel from '../components/peta/LayerPanel'
import ZoomButtons from '../components/peta/ZoomButtons'
import ProfilWilayah from '../components/peta/ProfilWilayah'
import PetaWilayah from '../components/peta/PetaWilayah'
import jateng from '../data/jateng.json'
import { cariWilayahById } from '../data/contohWilayah'

const BATAS_INDONESIA = [ [-16, 85], [12, 150] ]

const LABEL_INDIKATOR = {
  kemiskinan: 'Kemiskinan',
  pendidikan: 'Pendidikan',
  kesehatan: 'Kesehatan',
  internet: 'Akses Internet',
  infrastruktur: 'Infrastruktur',
}

const LATAR_LAUT = {
  background:
    'radial-gradient(rgba(88,112,66,0.14) 1px, transparent 1.6px) 0 0 / 24px 24px, radial-gradient(circle at 30% 20%, #F5FAFC, #D9E6EB)',
}

function detailDesaUrl(kodeDesa, context) {
  const params = new URLSearchParams()
  params.set('include_recommendations', 'false')
  if (context?.bidang) {
    params.set('bidang', context.bidang)
    params.set('budget', context.budget)
    params.set('people', context.people)
    params.set('duration', context.duration)
  }
  const query = params.toString()
  return `/api/v1/regions/desa/${kodeDesa}${query ? `?${query}` : ''}`
}

function recommendationsUrl(kodeDesa, context) {
  const params = new URLSearchParams()
  if (context?.bidang) {
    params.set('bidang', context.bidang)
    params.set('budget', context.budget)
    params.set('people', context.people)
    params.set('duration', context.duration)
  }
  const query = params.toString()
  return `/api/v1/regions/desa/${kodeDesa}/recommendations${query ? `?${query}` : ''}`
}

function JelajahiPeta() {
  const { state } = useLocation()
  const [recommendationContext, setRecommendationContext] = useState(
    () => state?.recommendationContext ?? null,
  )

  const desaAwal = state?.wilayahId ? cariWilayahById(state.wilayahId) : null
  const kodeKabAwal = /^\d{10}$/.test(state?.wilayahId ?? '')
    ? state.wilayahId.slice(0, 4)
    : null
  const initialProfile = desaAwal ?? (state?.wilayahId
    ? { jenis: 'Desa', kodeDesa: state.wilayahId, nama: '', kabupaten: '' }
    : null)
  const fiturAwal = kodeKabAwal
    ? jateng.features.find((f) => f.properties.id === kodeKabAwal)
    : desaAwal
      ? jateng.features.find((f) => f.properties.label === desaAwal.kabupaten)
      : null

  const [panelTerbuka, setPanelTerbuka] = useState(false)
  const [aktif, setAktif] = useState({ administrasi: null, indikator: null })
  const [terpilihId, setTerpilihId] = useState(fiturAwal?.properties.id ?? null)
  const [profil, setProfil] = useState(initialProfile)
  const [profilTerbuka, setProfilTerbuka] = useState(Boolean(state?.wilayahId))
  const [fasilitasDesa, setFasilitasDesa] = useState(null)
  const [fasilitasDesaLoading, setFasilitasDesaLoading] = useState(Boolean(state?.wilayahId))
  const [fasilitasDesaError, setFasilitasDesaError] = useState(null)
  const [detailDesa, setDetailDesa] = useState(null)
  const [detailDesaLoading, setDetailDesaLoading] = useState(Boolean(state?.wilayahId))
  const [detailDesaError, setDetailDesaError] = useState(null)
  const [recommendations, setRecommendations] = useState(null)
  const [recommendationsLoading, setRecommendationsLoading] = useState(Boolean(state?.wilayahId))
  const [recommendationsError, setRecommendationsError] = useState(null)
  const [tahapDetailTampil, setTahapDetailTampil] = useState(0)
  const [detailKabupaten, setDetailKabupaten] = useState(null)
  const [detailKabupatenLoading, setDetailKabupatenLoading] = useState(false)
  const [detailKabupatenError, setDetailKabupatenError] = useState(null)
  const detailRequestRef = useRef(null)
  const recommendationsRequestRef = useRef(null)

  // Perintah ke peta: { jenis: 'reset' | 'lepasDesa', n: counter }
  const [sinyal, setSinyal] = useState({ jenis: null, n: 0 })
  const kirimSinyal = (jenis) => setSinyal((s) => ({ jenis, n: s.n + 1 }))

  useEffect(() => {
    if (!state?.wilayahId) return undefined

    const controller = new AbortController()
    const recommendationsController = new AbortController()
    detailRequestRef.current = controller
    recommendationsRequestRef.current = recommendationsController
    const { signal } = controller
    const recommendationsSignal = recommendationsController.signal

    apiFetch(`/api/map/fasilitas-desa/${state.wilayahId}`, { signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Gagal mengambil fasilitas desa (${response.status})`)
        const result = await response.json()
        if (signal.aborted) return
        if (result.status !== 'success') {
          throw new Error(result.message ?? 'Data fasilitas tidak tersedia')
        }
        setFasilitasDesa(result.data)
      })
      .catch((error) => {
        if (!signal.aborted) {
          console.error('Gagal ambil fasilitas:', error)
          setFasilitasDesaError('Gagal memuat fasilitas desa.')
        }
      })
      .finally(() => {
        if (!signal.aborted) setFasilitasDesaLoading(false)
      })

    apiFetch(detailDesaUrl(state.wilayahId, state?.recommendationContext ?? null), { signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Gagal mengambil detail desa (${response.status})`)
        const result = await response.json()
        if (signal.aborted) return
        if (!result.data) throw new Error(result.message ?? 'Data detail desa tidak tersedia')
        setDetailDesa(result.data)
      })
      .catch((error) => {
        if (!signal.aborted) {
          console.error('Gagal ambil detail desa:', error)
          setDetailDesaError('Gagal memuat data desa.')
        }
      })
      .finally(() => {
        if (!signal.aborted) setDetailDesaLoading(false)
      })

    apiFetch(recommendationsUrl(state.wilayahId, state?.recommendationContext ?? null), {
      signal: recommendationsSignal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Gagal mengambil rekomendasi kegiatan (${response.status})`)
        const result = await response.json()
        if (recommendationsSignal.aborted) return
        if (result.status !== 'success' || !result.data) {
          throw new Error(result.message ?? 'Data rekomendasi tidak tersedia')
        }
        setRecommendations(result.data.recommendations)
      })
      .catch((error) => {
        if (!recommendationsSignal.aborted) {
          console.error('Gagal ambil rekomendasi kegiatan:', error)
          setRecommendationsError('Gagal memuat rekomendasi kegiatan.')
          setRecommendations([])
        }
      })
      .finally(() => {
        if (!recommendationsSignal.aborted) setRecommendationsLoading(false)
      })

    return () => {
      controller.abort()
      recommendationsController.abort()
    }
  }, [state?.wilayahId, state?.recommendationContext])

  useEffect(() => {
    if (profil?.jenis !== 'Desa' || detailDesaLoading) return undefined

    const timers = [
      window.setTimeout(() => setTahapDetailTampil(1), 0),
      window.setTimeout(() => setTahapDetailTampil(2), 200),
      window.setTimeout(() => setTahapDetailTampil(3), 400),
      window.setTimeout(() => setTahapDetailTampil(4), 600),
    ]

    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [profil?.jenis, profil?.kodeDesa, detailDesaLoading])

  const toggleLapisan = (kelompok, id) => {
    setAktif((sebelumnya) => ({
      ...sebelumnya,
      [kelompok]: sebelumnya[kelompok] === id ? null : id,
    }))
  }

  const handlePilih = useCallback((feature, tipe, namaKab, kodeKab) => {
    if (tipe === 'desa') {
      const p = feature.properties
      detailRequestRef.current?.abort()
      recommendationsRequestRef.current?.abort()
      const controller = new AbortController()
      const recommendationsController = new AbortController()
      detailRequestRef.current = controller
      recommendationsRequestRef.current = recommendationsController
      const { signal } = controller
      const recommendationsSignal = recommendationsController.signal

      setProfil({
        jenis: 'Desa',
        kodeDesa: p.kode_desa,
        nama: p.nama_desa,
        kabupaten: namaKab ?? p.kode_kab,
        kelas: p.kelas,
        labelUrgensi: p.label,
        indeksUrgensi: 0,
        saranProgram: [],
        kesenjangan: [],
        potensi: [],
        penduduk: 0,
        luas: 0,
      })
      setProfilTerbuka(true)
      setPanelTerbuka(false)
      setFasilitasDesa(null)
      setFasilitasDesaError(null)
      setFasilitasDesaLoading(true)
      setDetailDesa(null)
      setDetailDesaError(null)
      setDetailDesaLoading(true)
      setTahapDetailTampil(0)
      setRecommendations(null)
      setRecommendationsError(null)
      setRecommendationsLoading(true)
      setDetailKabupaten(null)
      setDetailKabupatenLoading(false)
      setDetailKabupatenError(null)

      apiFetch(`/api/map/fasilitas-desa/${p.kode_desa}`, { signal })
        .then(async (response) => {
          if (!response.ok) throw new Error(`Gagal mengambil fasilitas desa (${response.status})`)
          const result = await response.json()
          if (signal.aborted) return
          if (result.status !== 'success') {
            throw new Error(result.message ?? 'Data fasilitas tidak tersedia')
          }
          setFasilitasDesa(result.data)
        })
        .catch((error) => {
          if (!signal.aborted) {
            console.error('Gagal ambil fasilitas:', error)
            setFasilitasDesaError('Gagal memuat fasilitas desa.')
          }
        })
        .finally(() => {
          if (!signal.aborted) setFasilitasDesaLoading(false)
        })

      const context = recommendationContext
      apiFetch(detailDesaUrl(p.kode_desa, context), { signal })
        .then(async (response) => {
          if (!response.ok) throw new Error(`Gagal mengambil detail desa (${response.status})`)
          const result = await response.json()
          if (signal.aborted) return
          if (!result.data) throw new Error(result.message ?? 'Data detail desa tidak tersedia')
          setDetailDesa(result.data)
        })
        .catch((error) => {
          if (!signal.aborted) {
            console.error('Gagal ambil detail desa:', error)
            setDetailDesaError('Gagal memuat data desa.')
          }
        })
        .finally(() => {
          if (!signal.aborted) setDetailDesaLoading(false)
        })

      apiFetch(recommendationsUrl(p.kode_desa, context), { signal: recommendationsSignal })
        .then(async (response) => {
          if (!response.ok) throw new Error(`Gagal mengambil rekomendasi kegiatan (${response.status})`)
          const result = await response.json()
          if (recommendationsSignal.aborted) return
          if (result.status !== 'success' || !result.data) {
            throw new Error(result.message ?? 'Data rekomendasi tidak tersedia')
          }
          setRecommendations(result.data.recommendations)
        })
        .catch((error) => {
          if (!recommendationsSignal.aborted) {
            console.error('Gagal ambil rekomendasi kegiatan:', error)
            setRecommendationsError('Gagal memuat rekomendasi kegiatan.')
            setRecommendations([])
          }
        })
        .finally(() => {
          if (!recommendationsSignal.aborted) setRecommendationsLoading(false)
        })
    } else {
      detailRequestRef.current?.abort()
      recommendationsRequestRef.current?.abort()
      const controller = new AbortController()
      detailRequestRef.current = controller
      const label = feature.properties.label ?? ''
      const isKota = label.startsWith('Kota ')

      setTerpilihId(feature.properties.id)
      setProfil({
        jenis: isKota ? 'Kota' : 'Kabupaten',
        nama: label.replace(/^(Kabupaten|Kota)\s+/, ''),
        kabupaten: 'Provinsi Jawa Tengah',
      })
      setProfilTerbuka(true)
      setPanelTerbuka(false)
      setFasilitasDesa(null)
      setFasilitasDesaError(null)
      setFasilitasDesaLoading(false)
      setDetailDesa(null)
      setDetailDesaError(null)
      setDetailDesaLoading(false)
      setTahapDetailTampil(0)
      setRecommendations(null)
      setRecommendationsError(null)
      setRecommendationsLoading(false)
      setDetailKabupaten(null)
      setDetailKabupatenError(null)

      if (!kodeKab) {
        setDetailKabupatenLoading(false)
        setDetailKabupatenError('Kode kabupaten tidak tersedia untuk wilayah ini.')
        return
      }

      setDetailKabupatenLoading(true)
      apiFetch(`/api/v1/regions/kabupaten/${kodeKab}`, { signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) throw new Error(`Gagal mengambil indikator kabupaten (${response.status})`)
          const result = await response.json()
          if (controller.signal.aborted) return
          if (result.status !== 'success' || !result.data) {
            throw new Error(result.message ?? 'Data indikator kabupaten tidak tersedia.')
          }
          setDetailKabupaten(result.data)
        })
        .catch((error) => {
          if (!controller.signal.aborted) {
            console.error('Gagal ambil indikator kabupaten:', error)
            setDetailKabupatenError(error.message)
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setDetailKabupatenLoading(false)
        })
    }
  }, [recommendationContext])

  const handleClearRecommendationContext = useCallback(() => {
    setRecommendationContext(null)
    if (profil?.jenis !== 'Desa' || !profil.kodeDesa) return

    recommendationsRequestRef.current?.abort()
    const controller = new AbortController()
    recommendationsRequestRef.current = controller
    const { signal } = controller

    setRecommendations(null)
    setRecommendationsError(null)
    setRecommendationsLoading(true)

    apiFetch(recommendationsUrl(profil.kodeDesa, null), { signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Gagal mengambil rekomendasi kegiatan (${response.status})`)
        const result = await response.json()
        if (signal.aborted) return
        if (result.status !== 'success' || !result.data) {
          throw new Error(result.message ?? 'Data rekomendasi tidak tersedia')
        }
        setRecommendations(result.data.recommendations)
      })
      .catch((error) => {
        if (!signal.aborted) {
          console.error('Gagal ambil rekomendasi kegiatan:', error)
          setRecommendationsError('Gagal memuat rekomendasi kegiatan.')
          setRecommendations([])
        }
      })
      .finally(() => {
        if (!signal.aborted) setRecommendationsLoading(false)
      })
  }, [profil])

  // Tombol X di panel profil:
  // - dari profil desa      -> tetap di peta desa kabupaten tsb
  // - dari profil kabupaten -> kembali ke peta Jawa Tengah
  const handleTutupProfil = () => {
    detailRequestRef.current?.abort()
    recommendationsRequestRef.current?.abort()
    detailRequestRef.current = null
    recommendationsRequestRef.current = null
    const dariDesa = profil?.jenis === 'Desa'
    setProfilTerbuka(false)
    setFasilitasDesa(null)
    setFasilitasDesaError(null)
    setFasilitasDesaLoading(false)
    setDetailDesa(null)
    setDetailDesaError(null)
    setDetailDesaLoading(false)
    setTahapDetailTampil(0)
    setRecommendations(null)
    setRecommendationsError(null)
    setRecommendationsLoading(false)
    setDetailKabupaten(null)
    setDetailKabupatenLoading(false)
    setDetailKabupatenError(null)
    if (dariDesa) {
      kirimSinyal('lepasDesa')
    } else {
      setTerpilihId(null)
      kirimSinyal('reset')
    }
  }

  // Tombol "Kembali ke Peta Kabupaten" di peta
  const handleKembaliKePeta = () => {
    detailRequestRef.current?.abort()
    recommendationsRequestRef.current?.abort()
    detailRequestRef.current = null
    recommendationsRequestRef.current = null
    setProfilTerbuka(false)
    setTerpilihId(null)
    setFasilitasDesa(null)
    setFasilitasDesaError(null)
    setFasilitasDesaLoading(false)
    setDetailDesa(null)
    setDetailDesaError(null)
    setDetailDesaLoading(false)
    setTahapDetailTampil(0)
    setRecommendations(null)
    setRecommendationsError(null)
    setRecommendationsLoading(false)
    setDetailKabupaten(null)
    setDetailKabupatenLoading(false)
    setDetailKabupatenError(null)
  }

  const handleBukaLapisan = () => {
    setPanelTerbuka(true)
    if (window.innerWidth < 768) setProfilTerbuka(false)
  }

  return (
    <div className="relative isolate h-full">
      <MapContainer
        center={[-2.5, 118]}
        zoom={5.5}
        minZoom={5.5}
        zoomSnap={0.25}
        maxBounds={BATAS_INDONESIA}
        maxBoundsViscosity={1.0}
        zoomControl={false}
        className="h-full w-full"
        style={LATAR_LAUT}
      >
        <PetaWilayah
          terpilihId={terpilihId}
          indikator={LABEL_INDIKATOR[aktif.indikator] ?? null}
          onPilih={handlePilih}
          sinyal={sinyal}
          onKembali={handleKembaliKePeta}
          initialDesaId={kodeKabAwal ? state.wilayahId : null}
        />
        <ZoomButtons />
      </MapContainer>

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

      {profil && profilTerbuka && (
        <ProfilWilayah
          wilayah={profil}
          fasilitas={fasilitasDesa}
          fasilitasLoading={fasilitasDesaLoading}
          fasilitasError={fasilitasDesaError}
          detailDesa={detailDesa}
          detailDesaLoading={detailDesaLoading}
          detailDesaError={detailDesaError}
          tahapTampil={tahapDetailTampil}
          recommendations={recommendations}
          recommendationsLoading={recommendationsLoading}
          recommendationsError={recommendationsError}
          recommendationContext={recommendationContext}
          onClearRecommendationContext={handleClearRecommendationContext}
          detailKabupaten={detailKabupaten}
          detailKabupatenLoading={detailKabupatenLoading}
          detailKabupatenError={detailKabupatenError}
          onClose={handleTutupProfil}
        />
      )}
    </div>
  )
}

export default JelajahiPeta