import { useState, useCallback } from 'react'
import { useLocation } from 'react-router'
import { MapContainer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import '../components/peta/peta.css'
import SearchBar from '../components/peta/SearchBar'
import LayerButton from '../components/peta/LayerButton'
import LayerPanel from '../components/peta/LayerPanel'
import ZoomButtons from '../components/peta/ZoomButtons'
import ProfilWilayah from '../components/peta/ProfilWilayah'
import PetaWilayah from '../components/peta/PetaWilayah'
import jateng from '../data/jateng.json'
import { buatProfil } from '../data/profilKabupaten'
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

function JelajahiPeta() {
  const { state } = useLocation()

  const desaAwal = state?.wilayahId ? cariWilayahById(state.wilayahId) : null
  const fiturAwal = desaAwal
    ? jateng.features.find((f) => f.properties.label === desaAwal.kabupaten)
    : null

  const [panelTerbuka, setPanelTerbuka] = useState(false)
  const [aktif, setAktif] = useState({ administrasi: null, indikator: null })
  const [terpilihId, setTerpilihId] = useState(fiturAwal?.properties.id ?? null)
  const [profil, setProfil] = useState(desaAwal)
  const [profilTerbuka, setProfilTerbuka] = useState(Boolean(desaAwal))
  const [fasilitasDesa, setFasilitasDesa] = useState(null)

  // Perintah ke peta: { jenis: 'reset' | 'lepasDesa', n: counter }
  const [sinyal, setSinyal] = useState({ jenis: null, n: 0 })
  const kirimSinyal = (jenis) => setSinyal((s) => ({ jenis, n: s.n + 1 }))

  const toggleLapisan = (kelompok, id) => {
    setAktif((sebelumnya) => ({
      ...sebelumnya,
      [kelompok]: sebelumnya[kelompok] === id ? null : id,
    }))
  }

  const handlePilih = useCallback(async (feature, tipe, namaKab) => {
    if (tipe === 'desa') {
      const p = feature.properties
      setProfil({
        jenis: 'Desa',
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

      try {
        const res = await fetch(`http://127.0.0.1:8000/api/map/fasilitas-desa/${p.kode_desa}`)
        const result = await res.json()
        if (result.status === 'success') setFasilitasDesa(result.data)
      } catch (error) {
        console.error('Gagal ambil fasilitas:', error)
      }
    } else {
      setTerpilihId(feature.properties.id)
      setProfil(buatProfil(feature.properties))
      setProfilTerbuka(true)
      setPanelTerbuka(false)
      setFasilitasDesa(null)
    }
  }, [])

  // Tombol X di panel profil:
  // - dari profil desa      -> tetap di peta desa kabupaten tsb
  // - dari profil kabupaten -> kembali ke peta Jawa Tengah
  const handleTutupProfil = () => {
    const dariDesa = profil?.jenis === 'Desa'
    setProfilTerbuka(false)
    setFasilitasDesa(null)
    if (dariDesa) {
      kirimSinyal('lepasDesa')
    } else {
      setTerpilihId(null)
      kirimSinyal('reset')
    }
  }

  // Tombol "Kembali ke Peta Kabupaten" di peta
  const handleKembaliKePeta = () => {
    setProfilTerbuka(false)
    setTerpilihId(null)
    setFasilitasDesa(null)
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
          onClose={handleTutupProfil}
        />
      )}
    </div>
  )
}

export default JelajahiPeta