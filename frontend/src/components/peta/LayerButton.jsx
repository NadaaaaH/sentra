import { Layers } from 'lucide-react'

function LayerButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="absolute bottom-5 left-12 z-[1000] flex h-[100px] w-[100px] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl bg-sentra-green text-sm text-white shadow-md hover:bg-sentra-darkergreen"
    >
      <Layers className="h-10 w-10" strokeWidth={1.5} />
      Lapisan
    </button>
  )
}

export default LayerButton