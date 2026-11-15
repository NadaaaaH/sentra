import { ChevronDown } from 'lucide-react'

const inputClass =
  'mt-1 w-full rounded-md border border-sentra-stroke bg-white px-3 py-2 text-sm outline-none placeholder:text-gray-400 focus:border-sentra-green'

function FormProgram({
  form,
  onChange,
  onSubmit,
  categories,
  categoriesLoading,
  categoriesError,
  locationQuery,
  location,
  locationOptions,
  locationLoading,
  locationError,
  onLocationQueryChange,
  onLocationSelect,
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="w-full self-start rounded-2xl border border-sentra-stroke bg-white p-5 shadow-lg lg:max-w-96"
    >
      <h2 className="text-2xl font-medium">Rencana Program</h2>

      <label className="mt-4 block text-sm">
        Bidang program
        <div className="relative">
          <select
            name="bidang"
            value={form.bidang}
            onChange={onChange}
            required
            className={`${inputClass} cursor-pointer appearance-none ${
              form.bidang === '' ? 'text-gray-400' : 'text-black'
            }`}
          >
            <option value="" disabled>
              Pilih bidang program
            </option>
            {categories.map((category) => (
              <option key={category.value} value={category.value} className="text-black">
                {category.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
        </div>
        {categoriesLoading && <span className="text-xs text-gray-500">Memuat bidang program...</span>}
        {categoriesError && (
          <span className="mt-1 block text-xs text-red-600" role="alert">{categoriesError}</span>
        )}
      </label>

      <div className="relative mt-4">
        <label htmlFor="lokasi" className="block text-sm">
          Preferensi Lokasi <span className="text-gray-500">(Opsional)</span>
        </label>
        <input
          id="lokasi"
          type="text"
          value={location ? location.label : locationQuery}
          onChange={(event) => onLocationQueryChange(event.target.value)}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={locationOptions.length > 0}
          aria-controls="pilihan-lokasi"
          placeholder="Ketik nama desa titik awal atau kabupaten tujuan..."
          className={inputClass}
        />
        {locationLoading && (
          <p className="mt-1 text-xs text-gray-500">Mencari lokasi...</p>
        )}
        {locationError && (
          <p className="mt-1 text-xs text-red-600" role="alert">{locationError}</p>
        )}
        {!location && locationQuery.trim().length > 0 && locationQuery.trim().length < 2 && (
          <p className="mt-1 text-xs text-gray-500">Ketik minimal 2 karakter.</p>
        )}
        {!location && locationQuery.trim().length >= 2 && !locationLoading && !locationError && locationOptions.length === 0 && (
          <p className="mt-1 text-xs text-gray-500">Tidak ada lokasi yang cocok.</p>
        )}
        {locationOptions.length > 0 && (
          <ul
            id="pilihan-lokasi"
            role="listbox"
            className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-sentra-stroke bg-white py-1 shadow-lg"
          >
            {locationOptions.map((option) => (
              <li key={`${option.type}-${option.code}`} role="option" aria-selected="false">
                <button
                  type="button"
                  onClick={() => onLocationSelect(option)}
                  className="flex w-full items-start justify-between gap-3 px-3 py-2 text-left hover:bg-sentra-green/10"
                >
                  <span>
                    <span className="block text-sm font-medium">{option.label}</span>
                    {option.subtitle && (
                      <span className="block text-xs text-gray-500">{option.subtitle}</span>
                    )}
                  </span>
                  <span className="shrink-0 rounded-full bg-sentra-green/10 px-2 py-0.5 text-[10px] text-sentra-green">
                    {option.kindLabel}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Desa sebagai titik awal membatasi pencarian hingga radius 30 km. Lokasi kosong mencari semua wilayah.
        </p>
      </div>

      <label className="mt-4 block text-sm">
        Anggaran tersedia (Rp)
        <input
          type="number"
          name="anggaran"
          value={form.anggaran}
          onChange={onChange}
          min="1"
          required
          placeholder="Masukkan jumlah anggaran"
          className={inputClass}
        />
      </label>

      <label className="mt-4 block text-sm">
        Jumlah pelaksana
        <input
          type="number"
          name="pelaksana"
          value={form.pelaksana}
          onChange={onChange}
          min="1"
          required
          placeholder="Masukkan jumlah sumber daya manusia"
          className={inputClass}
        />
      </label>

      <label className="mt-4 block text-sm">
        Durasi
        <input
          type="number"
          name="durasi"
          value={form.durasi}
          onChange={onChange}
          min="1"
          required
          placeholder="Masukkan durasi program dalam satuan hari"
          className={inputClass}
        />
      </label>

      <button
        type="submit"
        disabled={categoriesLoading || categories.length === 0}
        className="mt-6 w-full cursor-pointer rounded-md bg-sentra-green py-2.5 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-sentra-darkergreen hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
      >
        Temukan wilayah
      </button>
    </form>
  )
}

export default FormProgram