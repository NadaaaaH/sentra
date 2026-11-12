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

const BATAS_INDONESIA = [
  [-16, 85],
  [12, 150],
]

const LABEL_INDIKATOR = {
  kemiskinan: 'Kemiskinan',
  pendidikan: 'Pendidikan',
  kesehatan: 'Kesehatan',
  internet: 'Akses Internet',
  infrastruktur: 'Infrastruktur',
}

// laut bergradasi dengan pola titik halus
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

  const toggleLapisan = (kelompok, id) => {
    setAktif((sebelumnya) => ({
      ...sebelumnya,
      [kelompok]: sebelumnya[kelompok] === id ? null : id,
    }))
  }

  const handlePilih = useCallback((feature) => {
    setTerpilihId(feature.properties.id)
    setProfil(buatProfil(feature.properties))
    setProfilTerbuka(true)
    setPanelTerbuka(false)
  }, [])

  const handleTutupProfil = () => {
    setProfilTerbuka(false)
    setTerpilihId(null)
  }

  const handleBukaLapisan = () => {
    setPanelTerbuka(true)
    if (window.innerWidth < 768) handleTutupProfil()
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
        <ProfilWilayah wilayah={profil} onClose={handleTutupProfil} />
      )}
    </div>
  )
}

export default JelajahiPeta