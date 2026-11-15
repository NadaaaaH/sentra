import { useCallback, useEffect, useRef, useState } from 'react'
import FormProgram from '../components/matching/FormProgram'
import HasilPencocokan from '../components/matching/HasilPencocokan'
import { apiFetch } from '../lib/api'

const formAwal = { bidang: '', anggaran: '', pelaksana: '', durasi: '' }
const PAGE_SIZE = 5

function mapMatch(item) {
  return {
    ...item,
    id: item.region_id,
    wilayahId: item.region_id,
    nama: item.village_name,
    lokasi: `${item.district_name}, ${item.county_name ?? 'Jawa Tengah'}`,
    skor: item.match_score,
  }
}

function SmartMatching() {
  const [form, setForm] = useState(formAwal)
  const [categories, setCategories] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [categoriesError, setCategoriesError] = useState(null)
  const [locationQuery, setLocationQuery] = useState('')
  const [location, setLocation] = useState(null)
  const [locationOptions, setLocationOptions] = useState([])
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState(null)
  const [hasil, setHasil] = useState(null)
  const [hasilMessage, setHasilMessage] = useState('')
  const [hasilError, setHasilError] = useState(null)
  const [memuat, setMemuat] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadMoreError, setLoadMoreError] = useState(null)
  const locationTimer = useRef(null)
  const locationRequest = useRef(null)
  const matchRequest = useRef(null)
  const loadMoreRequest = useRef(null)
  const matchPayload = useRef(null)

  const clearResults = useCallback(() => {
    matchRequest.current?.abort()
    loadMoreRequest.current?.abort()
    loadMoreRequest.current = null
    matchPayload.current = null
    setHasil(null)
    setHasilMessage('')
    setHasilError(null)
    setMemuat(false)
    setHasMore(false)
    setLoadingMore(false)
    setLoadMoreError(null)
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    apiFetch('/api/v1/smart-matching/categories', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Gagal memuat bidang program (${response.status})`)
        const result = await response.json()
        if (result.status !== 'success' || !Array.isArray(result.data)) {
          throw new Error(result.message ?? 'Format daftar bidang program tidak valid.')
        }
        setCategories(result.data)
      })
      .catch((error) => {
        if (!controller.signal.aborted) setCategoriesError(error.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setCategoriesLoading(false)
      })

    return () => controller.abort()
  }, [])

  useEffect(() => () => {
    clearTimeout(locationTimer.current)
    locationRequest.current?.abort()
    matchRequest.current?.abort()
    loadMoreRequest.current?.abort()
    loadMoreRequest.current = null
  }, [])

  const handleChange = (event) => {
    clearResults()
    setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }))
  }

  const handleLocationQueryChange = useCallback((query) => {
    setLocationQuery(query)
    setLocation(null)
    setLocationOptions([])
    setLocationError(null)
    clearResults()
    setMemuat(false)
    clearTimeout(locationTimer.current)
    locationRequest.current?.abort()

    const normalizedQuery = query.trim()
    if (normalizedQuery.length < 2) {
      setLocationLoading(false)
      return
    }

    setLocationLoading(true)
    locationTimer.current = setTimeout(() => {
      const controller = new AbortController()
      locationRequest.current = controller
      apiFetch(`/api/v1/smart-matching/locations?q=${encodeURIComponent(normalizedQuery)}`, {
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) throw new Error(`Gagal mencari lokasi (${response.status})`)
          const result = await response.json()
          if (result.status !== 'success' || !Array.isArray(result.data)) {
            throw new Error(result.message ?? 'Format hasil pencarian lokasi tidak valid.')
          }
          setLocationOptions(result.data)
        })
        .catch((error) => {
          if (!controller.signal.aborted) setLocationError(error.message)
        })
        .finally(() => {
          if (!controller.signal.aborted) setLocationLoading(false)
        })
    }, 250)
  }, [clearResults])

  const handleLocationSelect = (selectedLocation) => {
    clearResults()
    setLocation(selectedLocation)
    setLocationQuery(selectedLocation.label)
    setLocationOptions([])
    setLocationError(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (locationQuery.trim() && !location) {
      setLocationError('Pilih lokasi dari daftar hasil atau kosongkan kolom lokasi.')
      return
    }

    matchRequest.current?.abort()
    loadMoreRequest.current?.abort()
    loadMoreRequest.current = null
    const controller = new AbortController()
    matchRequest.current = controller
    setMemuat(true)
    setHasil(null)
    setHasilMessage('')
    setHasilError(null)
    setHasMore(false)
    setLoadingMore(false)
    setLoadMoreError(null)

    const payload = {
      ...form,
      offset: 0,
      limit: PAGE_SIZE,
      ...(location
        ? { location_type: location.type, location_code: location.code }
        : {}),
    }
    matchPayload.current = payload

    try {
      const response = await apiFetch('/api/v1/smart-matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
      const result = await response.json()
      if (!response.ok) {
        const validationMessage = Object.values(result.errors ?? {}).flat().join(' ')
        throw new Error(validationMessage || result.message || `Pencocokan gagal (${response.status})`)
      }
      if (result.status !== 'success' || !Array.isArray(result.data)) {
        throw new Error(result.message ?? 'Format hasil pencocokan tidak valid.')
      }
      if (!result.meta || typeof result.meta.has_more !== 'boolean') {
        throw new Error('Metadata hasil pencocokan tidak valid.')
      }
      setHasil(result.data.map(mapMatch))
      setHasMore(result.meta.has_more)
      setHasilMessage(result.message ?? '')
    } catch (error) {
      if (!controller.signal.aborted) setHasilError(error.message)
    } finally {
      if (!controller.signal.aborted) setMemuat(false)
    }
  }

  const handleLoadMore = async () => {
    if (loadingMore || loadMoreRequest.current || !hasMore || !matchPayload.current || !hasil) return

    const controller = new AbortController()
    loadMoreRequest.current = controller
    setLoadingMore(true)
    setLoadMoreError(null)

    try {
      const response = await apiFetch('/api/v1/smart-matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...matchPayload.current, offset: hasil.length }),
        signal: controller.signal,
      })
      const result = await response.json()
      if (!response.ok) {
        const validationMessage = Object.values(result.errors ?? {}).flat().join(' ')
        throw new Error(validationMessage || result.message || `Pencocokan gagal (${response.status})`)
      }
      if (result.status !== 'success' || !Array.isArray(result.data)) {
        throw new Error(result.message ?? 'Format hasil pencocokan tidak valid.')
      }
      if (!result.meta || typeof result.meta.has_more !== 'boolean') {
        throw new Error('Metadata hasil pencocokan tidak valid.')
      }

      setHasil((previous) => [...(previous ?? []), ...result.data.map(mapMatch)])
      setHasMore(result.meta.has_more)
    } catch (error) {
      if (!controller.signal.aborted) setLoadMoreError(error.message)
    } finally {
      if (!controller.signal.aborted) setLoadingMore(false)
      if (loadMoreRequest.current === controller) loadMoreRequest.current = null
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-7xl flex-col gap-6 px-6 py-10 lg:flex-row lg:gap-10 lg:px-14 lg:py-16">
      <div className="w-full self-start lg:max-w-96">
        <FormProgram
          form={form}
          onChange={handleChange}
          onSubmit={handleSubmit}
          categories={categories}
          categoriesLoading={categoriesLoading}
          categoriesError={categoriesError}
          locationQuery={locationQuery}
          location={location}
          locationOptions={locationOptions}
          locationLoading={locationLoading}
          locationError={locationError}
          onLocationQueryChange={handleLocationQueryChange}
          onLocationSelect={handleLocationSelect}
        />
      </div>
      <HasilPencocokan
        hasil={hasil}
        memuat={memuat}
        message={hasilMessage}
        error={hasilError}
        hasMore={hasMore}
        loadingMore={loadingMore}
        loadMoreError={loadMoreError}
        onLoadMore={handleLoadMore}
        recommendationContext={{
          bidang: form.bidang,
          budget: form.anggaran,
          people: form.pelaksana,
          duration: form.durasi,
        }}
      />
    </div>
  )
}

export default SmartMatching
