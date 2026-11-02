import { ChevronDown } from 'lucide-react'

const inputClass =
  'mt-1 w-full rounded-md border border-sentra-stroke bg-white px-3 py-2 text-sm outline-none placeholder:text-gray-400 focus:border-sentra-green'

function FormProgram({
  form,
  bidangProgram,
  kategoriMemuat,
  kategoriError,
  onChange,
  onSubmit,
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
              {kategoriMemuat ? 'Memuat bidang program...' : 'Pilih bidang program'}
            </option>
            {bidangProgram.map((bidang) => (
              <option key={bidang.value} value={bidang.value} className="text-black">
                {bidang.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
        </div>
        {kategoriError && (
          <span role="alert" className="mt-1 block text-xs text-red-700">
            Gagal memuat pilihan bidang: {kategoriError}
          </span>
        )}
        {!kategoriMemuat && !kategoriError && bidangProgram.length === 0 && (
          <span role="status" className="mt-1 block text-xs text-gray-600">
            Belum ada aktivitas dengan acuan sumber daya yang valid.
          </span>
        )}
      </label>

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
        disabled={kategoriMemuat || Boolean(kategoriError) || bidangProgram.length === 0}
        className="mt-6 w-full cursor-pointer rounded-md bg-sentra-green py-2.5 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-sentra-darkergreen hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
      >
        Temukan wilayah
      </button>
    </form>
  )
}

export default FormProgram