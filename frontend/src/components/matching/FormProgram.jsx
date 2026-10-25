import { ChevronDown } from "lucide-react";
import { bidangProgram } from "../../data/contohHasil";
import axios from "axios";

const inputClass =
  "mt-1.5 w-full rounded-md border border-sentra-stroke bg-white px-3 py-2.5 text-sm outline-none placeholder:text-gray-400 focus:border-sentra-green";

function FormProgram({ form, onChange, onSubmit }) {
  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-[443px] self-start border border-gray-500 bg-white p-6"
    >
      <h2 className="text-3xl font-medium">Rencana Program</h2>

      <label className="mt-6 block text-sm">
        Bidang program
        <div className="relative">
          <select
            name="bidang"
            value={form.bidang}
            onChange={onChange}
            required
            className={`${inputClass} cursor-pointer appearance-none ${
              form.bidang === "" ? "text-gray-400" : "text-black"
            }`}
          >
            <option value="" disabled>
              Pilih bidang program
            </option>
            {bidangProgram.map((b) => (
              <option key={b} value={b} className="text-black">
                {b}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
        </div>
      </label>

      <label className="mt-6 block text-sm">
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

      <label className="mt-6 block text-sm">
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

      <label className="mt-6 block text-sm">
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
        className="mt-8 w-full cursor-pointer rounded-md bg-sentra-green py-3 text-lg font-semibold text-white hover:bg-sentra-darkergreen"
      >
        Temukan wilayah
      </button>
    </form>
  );
}

export default FormProgram;
