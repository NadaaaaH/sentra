import { X } from 'lucide-react'
import {
  lapisanAdministrasi,
  lapisanIndikator,
  legenda,
} from '../../data/lapisan'

function LayerItem({ label, aktif, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full cursor-pointer items-center justify-between border border-sentra-stroke px-2 py-1.5 text-left text-sm ${
        aktif ? 'bg-sentra-yellow/50' : 'bg-sentra-cream hover:bg-sentra-bitdarkercream'
      }`}
    >
      {label}
      <span
        className={`h-3.5 w-3.5 rounded-full ${
          aktif ? 'bg-sentra-green' : 'bg-sentra-stroke'
        }`}
      />
    </button>
  )
}

function LayerPanel({ aktif, onToggle, onClose }) {
  return (
    <div className="animasi-panel absolute inset-x-0 bottom-0 z-[1000] max-h-[65%] w-full overflow-y-auto rounded-t-2xl bg-sentra-cream p-5 shadow-lg md:inset-x-auto md:bottom-5 md:left-12 md:max-h-[calc(100%-2.5rem)] md:w-[337px] md:rounded-2xl">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Lapisan Administrasi Wilayah</h3>
        <button onClick={onClose} className="cursor-pointer" aria-label="Tutup panel">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-2 space-y-1.5">
      {lapisanAdministrasi.map((item) => (
          <LayerItem
            key={item.id}
            label={item.label}
            aktif={aktif.administrasi === item.id}
            onClick={() => onToggle('administrasi', item.id)}
          />
        ))}
      </div>

      <hr className="my-5 border-sentra-stroke" />

      <h3 className="font-medium">Lapisan Indikator Wilayah</h3>
      <div className="mt-2 space-y-1.5">
        {lapisanIndikator.map((item) => (
          <LayerItem
            key={item.id}
            label={item.label}
            aktif={aktif.indikator === item.id}
            onClick={() => onToggle('indikator', item.id)}
          />
        ))}
      </div>

      <hr className="my-5 border-sentra-stroke" />

      <h3 className="font-medium">Legenda Indikator Wilayah</h3>
      <div className="mt-2 flex gap-1">
        {legenda.map((item) => (
          <div key={item.label} className="flex-1 text-center text-xs">
            <div className={`h-4 ${item.warna}`} />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  )
}

export default LayerPanel