import { X } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";

// Batas kategori adalah asumsi saya (79 = Tinggi, sesuai desain). Sesuaikan dengan tim.
function kategoriUrgensi(skor) {
  if (skor >= 80) return { nama: "Kritis", warna: "bg-sentra-red" };
  if (skor >= 60) return { nama: "Tinggi", warna: "bg-sentra-orange" };
  if (skor >= 40) return { nama: "Sedang", warna: "bg-sentra-yellow" };
  return { nama: "Rendah", warna: "bg-sentra-lightergreen" };
}

function ProfilWilayah({ kodeDesa = "3301012001", onClose }) {
  const [wilayah, setWilayah] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`http://localhost:8000/api/v1/regions/desa/${kodeDesa}`)
      .then((res) => {
        setWilayah(res.data.data); // Langsung simpan hasil JSON dari backend!
        setLoading(false);
      })
      .catch((err) => {
        console.error("Gagal panggil API:", err);
        setLoading(false);
      });
  }, [kodeDesa]);

  if (loading || !wilayah) {
    return (
      <aside className="absolute bottom-5 right-12 top-9 z-[1000] w-[440px] rounded-3xl bg-sentra-cream p-6 text-black shadow-xl">
        <p className="animate-pulse text-sm font-semibold">
          Memuat data dari server backend...
        </p>
      </aside>
    );
  }
  const kategori = kategoriUrgensi(wilayah.indeksUrgensi);

  // diurutkan dari skor tertinggi, maksimal 10 saran
  const saran = [...wilayah.saranProgram]
    .sort((a, b) => b.skor - a.skor)
    .slice(0, 10);

  return (
    <aside className="absolute bottom-5 right-12 top-9 z-[1000] w-[440px] max-w-[calc(100%-2rem)] overflow-y-auto rounded-3xl bg-sentra-cream shadow-xl">
      {/* HEADER HIJAU */}
      <div className="bg-sentra-green px-5 pb-3 pt-5 text-sentra-cream">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium tracking-[0.3em] text-sentra-cream/70">
            PROFIL WILAYAH
          </p>
          <button
            onClick={onClose}
            aria-label="Tutup profil"
            className="cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <h2 className="mt-5 text-3xl font-bold">
          {wilayah.jenis} {wilayah.nama}
        </h2>
        <p className="text-sm text-sentra-cream/80">{wilayah.kabupaten}</p>

        <div className="mt-3 flex gap-3 text-black">
          <div className="w-[170px] rounded-md bg-sentra-cream px-3 py-2">
            <p className="text-[11px] text-gray-600">Penduduk</p>
            <p className="font-bold">
              {wilayah.penduduk.toLocaleString("id-ID")} jiwa
            </p>
          </div>
          <div className="w-[170px] rounded-md bg-sentra-cream px-3 py-2">
            <p className="text-[11px] text-gray-600">Luas</p>
            <p className="font-bold">{wilayah.luas} ha</p>
          </div>
        </div>

        <hr className="my-4 border-white/20" />

        <p className="text-xs text-sentra-cream/80">Indeks Urgensi</p>
        <p className="text-4xl font-bold">{wilayah.indeksUrgensi}</p>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/30">
          <div
            className={`h-full ${kategori.warna}`}
            style={{ width: `${wilayah.indeksUrgensi}%` }}
          />
        </div>
        <p className="mt-1.5 text-[9px] text-sentra-cream/70">
          Skor gabungan lima indikator kebutuhan (0 = terpenuhi, 100 = sangat
          mendesak). Kategori saat ini: {kategori.nama}.
        </p>
      </div>

      <div className="px-5 py-6 text-black">
        {/* KESENJANGAN INDIKATOR */}
        <h3 className="text-xl font-bold tracking-wide">
          Kesenjangan Indikator
        </h3>
        <div className="mt-2 space-y-2.5">
          {wilayah.kesenjangan.map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-xs">
                <span>{item.label}</span>
                <span>{item.nilai}</span>
              </div>
              <div className="mt-0.5 h-2 bg-sentra-lightgreen/60">
                <div
                  className="h-full bg-sentra-green"
                  style={{ width: `${item.nilai}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* POTENSI WILAYAH */}
        <h3 className="mt-8 text-xl font-bold tracking-wide">
          Potensi Wilayah
        </h3>
        <ul className="mt-3 space-y-3">
          {wilayah.potensi.map((teks, i) => (
            <li
              key={teks}
              className="flex gap-3 border-l-[3px] border-sentra-yellow py-0.5 pl-3 text-sm"
            >
              <span className="font-bold">
                {String(i + 1).padStart(2, "0")}
              </span>
              {teks}
            </li>
          ))}
        </ul>

        {/* SARAN PROGRAM */}
        <h3 className="mt-8 text-xl font-bold tracking-wide">Saran Program</h3>
        <div className="mt-2 space-y-2.5">
          {saran.map((item) => (
            <div
              key={item.judul}
              className="rounded-md border border-sentra-stroke bg-sentra-tinybitdarkercream p-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold leading-tight">
                    {item.judul}
                  </p>
                  <p className="text-[11px]">{item.bidang}</p>
                </div>
                <span className="shrink-0 rounded-full bg-sentra-lightgreen/40 px-2.5 py-0.5 text-[10px]">
                  {item.skor}% cocok
                </span>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-sentra-lightgreen/60">
                <div
                  className="h-full rounded-full bg-sentra-green"
                  style={{ width: `${item.skor}%` }}
                />
              </div>
              <p className="mt-1.5 text-[11px] leading-snug">
                {item.deskripsi}
              </p>
              <p className="mt-1 text-[10px]">
                Perkiraan: Rp {item.biaya} juta · {item.relawan} relawan ·{" "}
                {item.hari} hari
              </p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

export default ProfilWilayah;
