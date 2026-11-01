import { Search } from 'lucide-react'

function SearchBar() {
  return (
    <div className="absolute left-4 right-4 top-4 z-[1000] flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-md md:left-8 md:right-auto md:top-6 md:w-72">
      <Search className="h-4 w-4 shrink-0 text-black" />
      <input
        type="text"
        placeholder="Search"
        className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
      />
    </div>
  )
}

export default SearchBar