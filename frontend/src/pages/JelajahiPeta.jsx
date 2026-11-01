import 'leaflet/dist/leaflet.css'
import '../components/peta/peta.css'
import { useState } from 'react'
import { useLocation } from 'react-router'
import { MapContainer, TileLayer } from 'react-leaflet'
import { cariWilayahTerdekat, cariWilayahById } from '../data/contohWilayah'
import SearchBar from '../components/peta/SearchBar'
import LayerButton from '../components/peta/LayerButton'
import LayerPanel from '../components/peta/LayerPanel'
import ZoomButtons from '../components/peta/ZoomButtons'
import TitikTerpilih from '../components/peta/TitikTerpilih'
import ProfilWilayah from '../components/peta/ProfilWilayah'

const BATAS_JAWA_TENGAH = [
  [-8.8, 108.0],
  [-5.8, 112.2],
]

function JelajahiPeta() {
  const [panelTerbuka, setPanelTerbuka] = useState(false)
  const [aktif, setAktif] = useState({ administrasi: null, indikator: null })
  const { state } = useLocation()

  // kalau datang dari Smart Matching, langsung pilih wilayahnya dan buka sidebar
  const wilayahAwal = state?.wilayahId ? cariWilayahById(state.wilayahId) : null

  const [terpilih, setTerpilih] = useState(
    wilayahAwal ? { latlng: { lat: wilayahAwal.posisi[0], lng: wilayahAwal.posisi[1] }, wilayah: wilayahAwal } : null
  )
  const [profilTerbuka, setProfilTerbuka] = useState(wilayahAwal !== null)

  const toggleLapisan = (kelompok, id) => {
    setAktif((sebelumnya) => ({
      ...sebelumnya,
      [kelompok]: sebelumnya[kelompok] === id ? null : id,
    }))
  }

  // klik peta: titik dan pop-up pindah ke lokasi baru, sidebar kanan tertutup
  const handleKlikPeta = (latlng) => {
    setTerpilih({ latlng, wilayah: cariWilayahTerdekat(latlng) })
    setProfilTerbuka(false)
  }

  const handleBukaLapisan = () => {
    setPanelTerbuka(true)
    // di HP, dua panel tidak muat bersamaan
    if (window.innerWidth < 768) setProfilTerbuka(false)
  }

  // klik pop-up: sidebar kanan terbuka, sidebar kiri (Lapisan) otomatis tertutup
  const handleBukaProfil = () => {
    setProfilTerbuka(true)
    setPanelTerbuka(false)
  }

  // X pada pop-up: pop-up dan titik hilang
  const handleTutupPopup = () => {
    setTerpilih(null)
    setProfilTerbuka(false)
  }

  return (
    <div className="relative isolate h-full">
      <MapContainer
        center={wilayahAwal ? wilayahAwal.posisi : [-7.15, 110.1]}
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
        <ZoomButtons />
        <TitikTerpilih
          terpilih={terpilih}
          tampilPopup={!profilTerbuka}
          onKlik={handleKlikPeta}
          onBuka={handleBukaProfil}
          onTutup={handleTutupPopup}
        />
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

      {terpilih && profilTerbuka && (
        <ProfilWilayah
          wilayah={terpilih.wilayah}
          onClose={() => setProfilTerbuka(false)}
        />
      )}
    </div>
  )
}

export default JelajahiPeta