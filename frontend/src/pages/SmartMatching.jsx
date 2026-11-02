import { useEffect, useState } from 'react'
import FormProgram from '../components/matching/FormProgram'
import HasilPencocokan from '../components/matching/HasilPencocokan'

const formAwal = { bidang: '', anggaran: '', pelaksana: '', durasi: '' }
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

function SmartMatching() {
  const [form, setForm] = useState(formAwal)
  const [bidangProgram, setBidangProgram] = useState([])
  const [kategoriMemuat, setKategoriMemuat] = useState(true)
  const [kategoriError, setKategoriError] = useState('')
  const [hasil, setHasil] = useState(null)
  const [pesanHasil, setPesanHasil] = useState('')
  const [memuat, setMemuat] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/smart-matching/categories`, {
          headers: { Accept: 'application/json' },
        })
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.message || 'Tidak dapat memuat bidang program.')
        }

        setBidangProgram(payload.data)
      } catch (requestError) {
        setKategoriError(requestError.message || 'Tidak dapat terhubung ke server.')
      } finally {
        setKategoriMemuat(false)
      }
    }

    loadCategories()
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMemuat(true)
    setHasil(null)
    setPesanHasil('')
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/smart-matching`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bidang: form.bidang,
          anggaran: Number(form.anggaran),
          pelaksana: Number(form.pelaksana),
          durasi: Number(form.durasi),
        }),
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.message || 'Gagal mencocokkan program dengan wilayah.')
      }

      setHasil(payload.data)
      setPesanHasil(payload.message || '')
    } catch (requestError) {
      setError(requestError.message || 'Tidak dapat terhubung ke server.')
    } finally {
      setMemuat(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-6 lg:flex-row lg:gap-8 lg:px-10 lg:py-8">
      <FormProgram
        form={form}
        bidangProgram={bidangProgram}
        kategoriMemuat={kategoriMemuat}
        kategoriError={kategoriError}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />
      <HasilPencocokan
        hasil={hasil}
        pesanHasil={pesanHasil}
        memuat={memuat}
        error={error}
      />
    </div>
  )
}

export default SmartMatching