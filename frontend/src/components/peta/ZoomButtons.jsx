import { useMap } from 'react-leaflet'

function ZoomButtons() {
  const map = useMap()

  return (
    <div className="absolute bottom-5 right-4 z-[1000] overflow-hidden rounded-md shadow-md">
      <button
        onClick={() => map.zoomIn()}
        className="block h-[50px] w-[50px] cursor-pointer bg-sentra-stroke text-2xl font-bold hover:bg-gray-300"
      >
        +
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="block h-[50px] w-[50px] cursor-pointer border-t border-gray-400 bg-sentra-stroke text-2xl font-bold hover:bg-gray-300"
      >
        -
      </button>

      <div data-abaikan-klik className="absolute bottom-5 right-4 z-[1000] overflow-hidden rounded-md shadow-md"></div>
    </div>
  )
}

export default ZoomButtons