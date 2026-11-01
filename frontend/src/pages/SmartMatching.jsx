import { useState, useRef, useEffect } from 'react'
import FormProgram from '../components/matching/FormProgram'
import HasilPencocokan from '../components/matching/HasilPencocokan'
import { contohHasil } from '../data/contohHasil'

const formAwal = { bidang: '', anggaran: '', pelaksana: '', durasi: '' }

function SmartMatching() {
  const [form, setForm] = useState(formAwal)
  const [hasil, setHasil] = useState(null)
  const [memuat, setMemuat] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setMemuat(true)
    setHasil(null)
    // SEMENTARA: jeda palsu 0,9 detik. Nanti diganti panggilan API (Axios),
    // dan setMemuat(false) dipanggil saat respons diterima.
    timer.current = setTimeout(() => {
      setHasil(contohHasil)
      setMemuat(false)
    }, 900)
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-6 lg:flex-row lg:gap-8 lg:px-10 lg:py-8">
      <FormProgram form={form} onChange={handleChange} onSubmit={handleSubmit} />
      <HasilPencocokan hasil={hasil} memuat={memuat} />
    </div>
  )
}

export default SmartMatching