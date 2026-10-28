import { useMap } from 'react-leaflet'

function ZoomButtons() {
  const map = useMap()

  return (
    <div
      data-abaikan-klik
      className="absolute bottom-4 right-4 z-[1000] overflow-hidden rounded-md shadow-md md:right-8"
    >
      <button
        onClick={() => map.zoomIn()}
        className="block h-8 w-8 cursor-pointer bg-sentra-stroke text-xl font-bold hover:bg-gray-300 md:h-9 md:w-9"
      >
        +
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="block h-8 w-8 cursor-pointer border-t border-gray-400 bg-sentra-stroke text-xl font-bold hover:bg-gray-300 md:h-9 md:w-9"
      >
        -
      </button>
    </div>
  )
}

export default ZoomButtons