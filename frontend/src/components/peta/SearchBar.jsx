import { Search } from 'lucide-react'

function SearchBar() {
  return (
    <div className="absolute left-12 top-9 z-[1000] flex w-[335px] items-center gap-3 rounded-full bg-white px-5 py-2.5 shadow-md">
      <Search className="h-5 w-5 text-black" />
      <input
        type="text"
        placeholder="Search"
        className="w-full bg-transparent text-base outline-none placeholder:text-gray-400"
      />
    </div>
  )
}

export default SearchBar