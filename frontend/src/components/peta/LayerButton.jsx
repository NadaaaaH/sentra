import { Layers } from 'lucide-react'

function LayerButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="absolute bottom-4 left-4 z-[1000] flex h-14 w-14 cursor-pointer flex-col items-center justify-center rounded-xl bg-sentra-green text-[0.65rem] text-white shadow-md transition hover:-translate-y-0.5 hover:bg-sentra-darkergreen hover:shadow-lg md:left-8 md:h-[4.5rem] md:w-[4.5rem] md:text-xs"
    >
      <Layers className="h-5 w-5 md:h-7 md:w-7" strokeWidth={1.5} />
      Lapisan
    </button>
  )
}

export default LayerButton