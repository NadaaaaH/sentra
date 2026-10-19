import { useState } from 'react'
import FormProgram from '../components/matching/FormProgram'
import HasilPencocokan from '../components/matching/HasilPencocokan'
import { contohHasil } from '../data/contohHasil'

const formAwal = { bidang: '', anggaran: '', pelaksana: '', durasi: '' }

function SmartMatching() {
  const [form, setForm] = useState(formAwal)
  const [hasil, setHasil] = useState(null)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Sementara memakai data contoh. Nanti diganti panggilan API (Axios).
    setHasil(contohHasil)
  }

  return (
    <div className="mx-auto flex max-w-7xl gap-10 px-12 py-12">
      <FormProgram form={form} onChange={handleChange} onSubmit={handleSubmit} />
      <HasilPencocokan hasil={hasil} />
    </div>
  )
}

export default SmartMatching