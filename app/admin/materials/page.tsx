'use client'

import { useEffect, useState, Fragment, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { Plus, Pencil, Trash2, ArrowLeft, Upload, Loader2, AlertTriangle, X, Package } from 'lucide-react'
import { compressImage } from '@/lib/image-utils'

interface Material {
  id: string
  name: string
  category: string
  color_hex: string
  mallet_head_premium: number
  mallet_handle_premium: number
  awl_handle_premium: number
  coin_premium?: number
  available: boolean
  grain_image_url?: string | null
  tap_audio_url?: string | null
  tap_audio_description?: string | null
  janka_hardness?: number | null
  specific_gravity?: number | null
  origin?: string | null
  grain_description?: string | null
  grain_type?: string | null
  texture?: string | null
  durability?: string | null
  color_description?: string | null
  available_mallet_head?: boolean
  available_mallet_handle?: boolean
  available_awl_handle?: boolean
  available_square_scale?: boolean
  description?: string | null
  uses_description?: string | null
  gallery_images?: string[] | null
  videos?: { url: string; title?: string }[] | null
}

interface BasePrice {
  id: string
  product_type: string
  style_name: string
  base_price: number
  description: string
}

type StylePricingPosition = 'head' | 'handle' | 'awl_handle' | 'square_scale'

interface MaterialStylePricingRow {
  id?: string
  material_id: string
  base_price_id: string
  position: StylePricingPosition
  /** PostgREST may return numeric columns as strings */
  premium: number | string
  stock?: number | string
}

function styleAbbreviation(styleName: string): string {
  const words = styleName.trim().split(/\s+/).filter((w) => w.length > 0)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase()
  return words
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 6)
}

function awlAbbreviation(styleName: string): string {
  const n = styleName.trim()
  if (n.includes('Small Scratch')) return 'SSA'
  if (n.includes('Large Scratch')) return 'LSA'
  if (n.includes('Small Birdcage')) return 'SBA'
  if (n.includes('Large Birdcage')) return 'LBA'
  if (n.includes('75mm') || n.includes('Burnisher')) return '75B'
  return styleAbbreviation(styleName)
}

function squareAbbreviation(styleName: string): string {
  const s = styleName.toLowerCase()
  if (s.startsWith('chode')) {
    return s.includes('titanium') ? 'Chode Ti' : 'Chode TS'
  }
  const m = s.match(/^(\d+)mm/)
  const num = m ? m[1] : ''
  const ti = s.includes('titanium')
  return num ? `${num} ${ti ? 'Ti' : 'TS'}` : styleAbbreviation(styleName)
}

/** Blank group for mallet styles: SCM & TCM → "CM", SDM & TDM → "DM", SJM & TJM → "JM" */
function malletBlankGroup(styleName: string): string {
  const abbr = styleAbbreviation(styleName)
  return abbr.length > 1 ? abbr.slice(1) : abbr
}

function pricingKey(materialId: string, basePriceId: string, position: StylePricingPosition | string) {
  return `${materialId}_${basePriceId}_${position}`
}

/** Key→input string map for one material from MSP rows (open grid + after save rehydrate). */
function buildPricingFormSliceForMaterial(
  materialId: string,
  mspRows: MaterialStylePricingRow[],
  allBasePrices: BasePrice[]
): Record<string, string> {
  const malletStyles = allBasePrices.filter((b) => b.product_type === 'mallet')
  const awlStyles = allBasePrices.filter((b) => b.product_type === 'awl')
  const squareStyles = allBasePrices.filter((b) => b.product_type === 'square')
  const next: Record<string, string> = {}

  const mid = String(materialId)
  const findRow = (bpId: string, position: StylePricingPosition) => {
    const bid = String(bpId)
    const pos = String(position)
    return mspRows.find((r) => String(r.material_id) === mid && String(r.base_price_id) === bid && String(r.position) === pos)
  }
  const numVal = (v: number | string | null | undefined, fallback = '0') => {
    if (v === null || v === undefined) return fallback
    const n = typeof v === 'number' ? v : Number.parseFloat(String(v).replace(/,/g, ''))
    return Number.isFinite(n) ? String(n) : fallback
  }

  for (const bp of malletStyles) {
    for (const pos of ['head', 'handle'] as const) {
      const row = findRow(bp.id, pos)
      next[pricingKey(materialId, bp.id, pos)] = numVal(row?.premium)
      next[pricingKey(materialId, bp.id, pos) + '_stock'] = numVal(row?.stock)
    }
  }
  for (const bp of awlStyles) {
    const row = findRow(bp.id, 'awl_handle')
    next[pricingKey(materialId, bp.id, 'awl_handle')] = numVal(row?.premium)
    next[pricingKey(materialId, bp.id, 'awl_handle') + '_stock'] = numVal(row?.stock)
  }
  for (const bp of squareStyles) {
    const row = findRow(bp.id, 'square_scale')
    next[pricingKey(materialId, bp.id, 'square_scale')] = numVal(row?.premium)
    next[pricingKey(materialId, bp.id, 'square_scale') + '_stock'] = numVal(row?.stock)
  }
  return next
}

type LoadDataResult = {
  materials: Material[]
  basePrices: BasePrice[]
  mspRows: MaterialStylePricingRow[]
}

/** PostgREST defaults to a max row cap (~1000); unbounded selects truncate. Page until exhausted. */
const MSP_PAGE_SIZE = 1000

async function fetchAllMaterialStylePricingRows(): Promise<MaterialStylePricingRow[]> {
  const all: MaterialStylePricingRow[] = []
  for (let from = 0; ; from += MSP_PAGE_SIZE) {
    const { data, error } = await supabase
      .from('material_style_pricing')
      .select('id, material_id, base_price_id, position, premium, stock')
      .order('id')
      .range(from, from + MSP_PAGE_SIZE - 1)
    if (error) throw error
    const chunk = (data || []) as MaterialStylePricingRow[]
    all.push(...chunk)
    if (chunk.length < MSP_PAGE_SIZE) break
  }
  return all
}

function mspStockIndicator(
  matId: string,
  mspRows: MaterialStylePricingRow[]
): { color: 'red' | 'orange' | 'green'; tooltip: string } {
  const rows = mspRows.filter((r) => String(r.material_id) === String(matId))
  if (rows.length === 0) return { color: 'green', tooltip: 'No pricing rows' }
  let zeroCount = 0
  let oneCount = 0
  for (const r of rows) {
    const s = typeof r.stock === 'number' ? r.stock : Number.parseInt(String(r.stock ?? '0'), 10)
    if (s === 0) zeroCount++
    else if (s === 1) oneCount++
  }
  if (zeroCount > 0) return { color: 'red', tooltip: `${zeroCount} out of stock, ${oneCount} low` }
  if (oneCount > 0) return { color: 'orange', tooltip: `${oneCount} at threshold (1)` }
  return { color: 'green', tooltip: 'All stocked' }
}

const inputDarkClass = 'bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500'
const selectDarkClass = 'w-full h-9 rounded border border-zinc-700 bg-zinc-800 px-2 text-white'
const textareaDarkClass = 'w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-white placeholder:text-zinc-500'

export default function MaterialsAdminPage() {
  const router = useRouter()
  const [materials, setMaterials] = useState<Material[]>([])
  const [basePrices, setBasePrices] = useState<BasePrice[]>([])
  const [loading, setLoading] = useState(true)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [editingBasePrice, setEditingBasePrice] = useState<BasePrice | null>(null)
  const [showAddMaterial, setShowAddMaterial] = useState(false)
  const [showAddBasePrice, setShowAddBasePrice] = useState(false)
  const [uploadingGrainId, setUploadingGrainId] = useState<string | null>(null)
  const [uploadingTapAudioId, setUploadingTapAudioId] = useState<string | null>(null)

  const [newMaterial, setNewMaterial] = useState({
    name: '',
    category: 'wood',
    color_hex: '#000000',
    mallet_head_premium: 0,
    mallet_handle_premium: 0,
    awl_handle_premium: 0,
    available_mallet_head: true,
    available_mallet_handle: true,
    available_awl_handle: true,
    available_square_scale: true,
  })

  const [newBasePrice, setNewBasePrice] = useState({
    product_type: 'mallet',
    style_name: '',
    base_price: 0,
    description: '',
  })

  const [materialStylePricing, setMaterialStylePricing] = useState<MaterialStylePricingRow[]>([])
  const [expandedPricingMaterialId, setExpandedPricingMaterialId] = useState<string | null>(null)
  const [pricingForm, setPricingForm] = useState<Record<string, string>>({})
  const [savingPricingSection, setSavingPricingSection] = useState<null | 'mallet' | 'awl' | 'square'>(null)
  const [lowStockBannerDismissed, setLowStockBannerDismissed] = useState(false)
  const [showAddTransition, setShowAddTransition] = useState(false)
  const [newTransition, setNewTransition] = useState({
    name: '',
    color_hex: '#888888',
    mallet_head_premium: 0,
    awl_handle_premium: 0,
    coin_premium: 0,
  })

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('admin_auth')
    if (!isAuthenticated) {
      router.push('/admin')
      return
    }

    loadData()
  }, [router])

  const loadData = async (): Promise<LoadDataResult | undefined> => {
    try {
      const [materialsRes, basePricesRes] = await Promise.all([
        supabase.from('materials').select('*').order('category').order('name'),
        supabase.from('base_prices').select('*').order('product_type').order('style_name'),
      ])

      if (materialsRes.error) throw materialsRes.error
      if (basePricesRes.error) throw basePricesRes.error

      const mats = (materialsRes.data || []) as Material[]
      const bp = (basePricesRes.data || []) as BasePrice[]
      const mspRows = await fetchAllMaterialStylePricingRows()

      setMaterials(mats)
      setBasePrices(bp)
      setMaterialStylePricing(mspRows)

      return { materials: mats, basePrices: bp, mspRows }
    } catch (error) {
      console.error('Error loading data:', error)
      return undefined
    } finally {
      setLoading(false)
    }
  }

  const seedAllStylePricingForWood = async (materialId: string, allBase: BasePrice[]) => {
    const malletStyles = allBase.filter((b) => b.product_type === 'mallet')
    const awlStyles = allBase.filter((b) => b.product_type === 'awl')
    const squareStyles = allBase.filter((b) => b.product_type === 'square')
    const rows: { material_id: string; base_price_id: string; position: StylePricingPosition; premium: number }[] = []
    for (const bp of malletStyles) {
      rows.push(
        { material_id: materialId, base_price_id: bp.id, position: 'head', premium: 0 },
        { material_id: materialId, base_price_id: bp.id, position: 'handle', premium: 0 }
      )
    }
    for (const bp of awlStyles) {
      rows.push({ material_id: materialId, base_price_id: bp.id, position: 'awl_handle', premium: 0 })
    }
    for (const bp of squareStyles) {
      rows.push({ material_id: materialId, base_price_id: bp.id, position: 'square_scale', premium: 0 })
    }
    if (rows.length === 0) return
    const { error } = await supabase.from('material_style_pricing').insert(rows)
    if (error) console.error('Seed style pricing:', error)
  }

  const addMaterial = async () => {
    try {
      const insertPayload =
        newMaterial.category === 'wood'
          ? {
              name: newMaterial.name,
              category: 'wood',
              color_hex: newMaterial.color_hex,
              mallet_head_premium: 0,
              mallet_handle_premium: 0,
              awl_handle_premium: 0,
              available: true,
              available_mallet_head: newMaterial.available_mallet_head,
              available_mallet_handle: newMaterial.available_mallet_handle,
              available_awl_handle: newMaterial.available_awl_handle,
              available_square_scale: newMaterial.available_square_scale,
            }
          : newMaterial

      const { data: inserted, error } = await supabase.from('materials').insert([insertPayload]).select('id').single()
      if (error) throw error

      if (inserted?.id && newMaterial.category === 'wood') {
        await seedAllStylePricingForWood(inserted.id, basePrices)
      }

      setShowAddMaterial(false)
      setNewMaterial({
        name: '',
        category: 'wood',
        color_hex: '#000000',
        mallet_head_premium: 0,
        mallet_handle_premium: 0,
        awl_handle_premium: 0,
        available_mallet_head: true,
        available_mallet_handle: true,
        available_awl_handle: true,
        available_square_scale: true,
      })
      loadData()
    } catch (error) {
      console.error('Error adding material:', error)
      alert('Failed to add material')
    }
  }

  const addTransitionMaterial = async () => {
    if (!newTransition.name.trim()) return
    try {
      const { error } = await supabase.from('materials').insert([
        {
          name: newTransition.name.trim(),
          category: 'transition',
          color_hex: newTransition.color_hex,
          mallet_head_premium: newTransition.mallet_head_premium,
          mallet_handle_premium: 0,
          awl_handle_premium: newTransition.awl_handle_premium,
          coin_premium: newTransition.coin_premium,
          available: true,
        },
      ])
      if (error) throw error
      setShowAddTransition(false)
      setNewTransition({ name: '', color_hex: '#888888', mallet_head_premium: 0, awl_handle_premium: 0, coin_premium: 0 })
      loadData()
    } catch (e) {
      console.error(e)
      alert('Failed to add transition material')
    }
  }

  const normalizeMalletStock = (slice: Record<string, string>, materialId: string) => {
    const groups = new Map<string, BasePrice[]>()
    for (const bp of malletBasePrices) {
      const g = malletBlankGroup(bp.style_name)
      const arr = groups.get(g) || []
      arr.push(bp)
      groups.set(g, arr)
    }
    const result = { ...slice }
    for (const [, bps] of groups) {
      if (bps.length < 2) continue
      for (const pos of ['head', 'handle'] as const) {
        let min = Infinity
        for (const bp of bps) {
          const v = Number.parseInt(result[pricingKey(materialId, bp.id, pos) + '_stock'] ?? '0', 10)
          if (v < min) min = v
        }
        const val = String(min === Infinity ? 0 : min)
        for (const bp of bps) {
          result[pricingKey(materialId, bp.id, pos) + '_stock'] = val
        }
      }
    }
    return result
  }

  const openPricingGrid = (materialId: string) => {
    const slice = buildPricingFormSliceForMaterial(materialId, materialStylePricing, basePrices)
    setPricingForm((prev) => ({
      ...prev,
      ...normalizeMalletStock(slice, materialId),
    }))
    setExpandedPricingMaterialId(materialId)
  }

  const persistMspUpsert = async (
    section: 'mallet' | 'awl' | 'square',
    rows: { material_id: string; base_price_id: string; position: StylePricingPosition; premium: number; stock: number }[]
  ) => {
    const normalized = rows.map((r) => ({
      material_id: r.material_id,
      base_price_id: r.base_price_id,
      position: r.position,
      premium: Math.round((Number.isFinite(r.premium) ? r.premium : 0) * 100) / 100,
      stock: Number.isFinite(r.stock) ? r.stock : 0,
    }))
    console.log(`[MSP ${section}] upsert`, { count: normalized.length, sample: normalized[0] })
    const { data, error } = await supabase
      .from('material_style_pricing')
      .upsert(normalized, {
        onConflict: 'material_id,base_price_id,position',
        ignoreDuplicates: false,
        defaultToNull: false,
      })
      .select('id, material_id, base_price_id, position, premium, stock')

    if (error) {
      console.error(`[MSP ${section}] error:`, error)
      alert(`Failed to save: ${error.message}${error.hint ? ` — ${error.hint}` : ''}`)
      return false
    }
    console.log(`[MSP ${section}] OK`, data?.length, 'rows')
    return true
  }

  const saveMalletPremiums = async (materialId: string) => {
    setSavingPricingSection('mallet')
    try {
      const malletStyles = basePrices.filter((b) => b.product_type === 'mallet')
      const rows: { material_id: string; base_price_id: string; position: StylePricingPosition; premium: number; stock: number }[] = []
      for (const bp of malletStyles) {
        for (const pos of ['head', 'handle'] as const) {
          const key = pricingKey(materialId, bp.id, pos)
          const raw = pricingForm[key]
          const v = parseFloat(raw === undefined || raw === '' ? '0' : String(raw))
          const stockRaw = pricingForm[key + '_stock']
          const sv = parseInt(stockRaw === undefined || stockRaw === '' ? '0' : String(stockRaw), 10)
          rows.push({
            material_id: materialId,
            base_price_id: bp.id,
            position: pos,
            premium: Number.isFinite(v) ? v : 0,
            stock: Number.isFinite(sv) ? sv : 0,
          })
        }
      }
      const ok = await persistMspUpsert('mallet', rows)
      if (!ok) return
      const fresh = await loadData()
      if (fresh) {
        const slice = buildPricingFormSliceForMaterial(materialId, fresh.mspRows, fresh.basePrices)
        setPricingForm((prev) => ({ ...prev, ...normalizeMalletStock(slice, materialId) }))
      }
      alert('Saved successfully')
    } catch (e) {
      console.error(e)
      alert('Failed to save mallet premiums')
    } finally {
      setSavingPricingSection(null)
    }
  }

  const saveAwlPremiums = async (materialId: string) => {
    setSavingPricingSection('awl')
    try {
      const awlStyles = basePrices.filter((b) => b.product_type === 'awl')
      const rows: { material_id: string; base_price_id: string; position: StylePricingPosition; premium: number; stock: number }[] = []
      for (const bp of awlStyles) {
        const key = pricingKey(materialId, bp.id, 'awl_handle')
        const raw = pricingForm[key]
        const v = parseFloat(raw === undefined || raw === '' ? '0' : String(raw))
        const stockRaw = pricingForm[key + '_stock']
        const sv = parseInt(stockRaw === undefined || stockRaw === '' ? '0' : String(stockRaw), 10)
        rows.push({
          material_id: materialId,
          base_price_id: bp.id,
          position: 'awl_handle',
          premium: Number.isFinite(v) ? v : 0,
          stock: Number.isFinite(sv) ? sv : 0,
        })
      }
      const ok = await persistMspUpsert('awl', rows)
      if (!ok) return
      const fresh = await loadData()
      if (fresh) {
        const slice = buildPricingFormSliceForMaterial(materialId, fresh.mspRows, fresh.basePrices)
        setPricingForm((prev) => ({ ...prev, ...normalizeMalletStock(slice, materialId) }))
      }
      alert('Saved successfully')
    } catch (e) {
      console.error(e)
      alert('Failed to save awl premiums')
    } finally {
      setSavingPricingSection(null)
    }
  }

  const saveSquarePremiums = async (materialId: string) => {
    setSavingPricingSection('square')
    try {
      const squareStyles = basePrices.filter((b) => b.product_type === 'square')
      const rows: { material_id: string; base_price_id: string; position: StylePricingPosition; premium: number; stock: number }[] = []
      for (const bp of squareStyles) {
        const key = pricingKey(materialId, bp.id, 'square_scale')
        const raw = pricingForm[key]
        const v = parseFloat(raw === undefined || raw === '' ? '0' : String(raw))
        const stockRaw = pricingForm[key + '_stock']
        const sv = parseInt(stockRaw === undefined || stockRaw === '' ? '0' : String(stockRaw), 10)
        rows.push({
          material_id: materialId,
          base_price_id: bp.id,
          position: 'square_scale',
          premium: Number.isFinite(v) ? v : 0,
          stock: Number.isFinite(sv) ? sv : 0,
        })
      }
      const ok = await persistMspUpsert('square', rows)
      if (!ok) return
      const fresh = await loadData()
      if (fresh) {
        const slice = buildPricingFormSliceForMaterial(materialId, fresh.mspRows, fresh.basePrices)
        setPricingForm((prev) => ({ ...prev, ...normalizeMalletStock(slice, materialId) }))
      }
      alert('Saved successfully')
    } catch (e) {
      console.error(e)
      alert('Failed to save square premiums')
    } finally {
      setSavingPricingSection(null)
    }
  }

  const toggleWoodAppAvailability = async (
    materialId: string,
    field: 'available_mallet_head' | 'available_mallet_handle' | 'available_awl_handle' | 'available_square_scale',
    currentValue: boolean
  ) => {
    const { error } = await supabase.from('materials').update({ [field]: !currentValue }).eq('id', materialId)
    if (error) {
      console.error(error)
      alert('Failed to update availability')
      return
    }
    loadData()
  }

  const toggleWoodMasterAvailable = async (materialId: string, currentValue: boolean) => {
    const { error } = await supabase.from('materials').update({ available: !currentValue }).eq('id', materialId)
    if (error) {
      console.error(error)
      alert('Failed to update availability')
      return
    }
    loadData()
  }

  const uploadGrainImage = async (materialId: string, file: File) => {
    setUploadingGrainId(materialId)
    try {
      let processedFile: File = file
      let fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      if (fileExt === 'heic' || fileExt === 'heif' || file.type === 'image/heic' || file.type === 'image/heif') {
        let converted = false

        try {
          const heic2any = (await import('heic2any')).default
          const convertedBlob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 })
          const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob
          processedFile = new File([blob], file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg'), { type: 'image/jpeg' })
          fileExt = 'jpg'
          converted = true
        } catch (heicError) {
          console.warn('heic2any failed, trying canvas fallback:', heicError)
        }

        if (!converted) {
          try {
            const bitmap = await createImageBitmap(file)
            const canvas = document.createElement('canvas')
            canvas.width = bitmap.width
            canvas.height = bitmap.height
            const ctx = canvas.getContext('2d')!
            ctx.drawImage(bitmap, 0, 0)
            const jpegBlob = await new Promise<Blob>((resolve, reject) => {
              canvas.toBlob(
                (b) => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))),
                'image/jpeg',
                0.85
              )
            })
            processedFile = new File([jpegBlob], file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg'), { type: 'image/jpeg' })
            fileExt = 'jpg'
            converted = true
            bitmap.close()
          } catch (canvasError) {
            console.warn('Canvas fallback failed, trying server conversion:', canvasError)
          }
        }

        if (!converted) {
          try {
            const fd = new FormData()
            fd.append('file', file)
            const res = await fetch('/api/convert-heic', { method: 'POST', body: fd })
            if (!res.ok) throw new Error(`Server returned ${res.status}`)
            const jpegBlob = await res.blob()
            processedFile = new File([jpegBlob], file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg'), { type: 'image/jpeg' })
            fileExt = 'jpg'
            converted = true
          } catch (serverError) {
            console.error('Server HEIC conversion also failed:', serverError)
          }
        }

        if (!converted) {
          alert(`Could not convert ${file.name}. Try using the Files app on your iPhone to convert to JPG first, or take a screenshot of the photo.`)
          setUploadingGrainId(null)
          return
        }
      }
      if (processedFile.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp'].includes(fileExt)) {
        try {
          processedFile = await compressImage(processedFile)
          fileExt = 'jpg'
        } catch (compressError) {
          console.warn('Image compression failed, uploading original:', compressError)
        }
      }
      const filePath = `grains/${materialId}-${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('wood-grains').upload(filePath, processedFile, { upsert: true })
      if (uploadError) throw uploadError
      const { data: urlData } = supabase.storage.from('wood-grains').getPublicUrl(filePath)
      const { error: updateError } = await supabase.from('materials').update({ grain_image_url: urlData.publicUrl }).eq('id', materialId)
      if (updateError) throw updateError
      loadData()
    } catch (error) {
      console.error('Grain upload error:', error)
      alert('Failed to upload grain image')
    } finally {
      setUploadingGrainId(null)
    }
  }

  const uploadTapAudio = async (materialId: string, file: File) => {
    setUploadingTapAudioId(materialId)
    try {
      const allowed = ['mp3', 'wav', 'm4a', 'ogg', 'mp4', 'aac', 'x-m4a']
      let fileExt = file.name.includes('.') ? (file.name.split('.').pop()?.toLowerCase() ?? '') : ''
      const mime = file.type.toLowerCase()
      const mimeAudioOk =
        mime.startsWith('audio/') ||
        mime === 'video/mp4'

      if (!allowed.includes(fileExt)) {
        if (mimeAudioOk) {
          if (mime === 'audio/mp4' || mime === 'audio/x-m4a' || mime === 'video/mp4') fileExt = 'm4a'
          else if (mime === 'audio/aac') fileExt = 'aac'
          else if (mime === 'audio/mpeg') fileExt = 'mp3'
          else if (mime.includes('wav')) fileExt = 'wav'
          else if (mime.includes('ogg')) fileExt = 'ogg'
          else fileExt = 'm4a'
        } else {
          alert('Please upload MP3, WAV, M4A, OGG, AAC, or similar audio.')
          setUploadingTapAudioId(null)
          return
        }
      }

      const filePath = `audio/${materialId}-${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('tap-audio').upload(filePath, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data: urlData } = supabase.storage.from('tap-audio').getPublicUrl(filePath)
      const { error: updateError } = await supabase.from('materials').update({ tap_audio_url: urlData.publicUrl }).eq('id', materialId)
      if (updateError) throw updateError
      loadData()
    } catch (error) {
      console.error('Tap audio upload error:', error)
      alert('Failed to upload tap audio')
    } finally {
      setUploadingTapAudioId(null)
    }
  }

  const updateMaterial = async (material: Material) => {
    try {
      const baseUpdate: Record<string, unknown> = {
        awl_handle_premium: material.awl_handle_premium,
        available: material.available,
        tap_audio_description: material.tap_audio_description ?? null,
        janka_hardness: material.janka_hardness ?? null,
        specific_gravity: material.specific_gravity ?? null,
        origin: material.origin ?? null,
        grain_description: material.grain_description ?? null,
        grain_type: material.grain_type ?? null,
        texture: material.texture ?? null,
        durability: material.durability ?? null,
        color_description: material.color_description ?? null,
        description: material.description ?? null,
        uses_description: material.uses_description ?? null,
        gallery_images: material.gallery_images ?? [],
        videos: material.videos ?? [],
      }
      if (material.category === 'wood') {
        baseUpdate.available_mallet_head = material.available_mallet_head ?? true
        baseUpdate.available_mallet_handle = material.available_mallet_handle ?? true
        baseUpdate.available_awl_handle = material.available_awl_handle ?? true
        baseUpdate.available_square_scale = material.available_square_scale ?? true
      } else if (material.category === 'transition') {
        baseUpdate.mallet_head_premium = material.mallet_head_premium
        baseUpdate.mallet_handle_premium = material.mallet_handle_premium
        baseUpdate.coin_premium = material.coin_premium ?? 0
      } else {
        baseUpdate.mallet_head_premium = material.mallet_head_premium
        baseUpdate.mallet_handle_premium = material.mallet_handle_premium
      }

      const { error } = await supabase.from('materials').update(baseUpdate).eq('id', material.id)

      if (error) throw error

      setEditingMaterial(null)
      loadData()
    } catch (error) {
      console.error('Error updating material:', error)
      alert('Failed to update material')
    }
  }

  const deleteMaterial = async (id: string) => {
    if (!confirm('Delete this material?')) return

    try {
      const { error } = await supabase.from('materials').delete().eq('id', id)
      if (error) throw error
      loadData()
    } catch (error) {
      console.error('Error deleting material:', error)
      alert('Failed to delete material')
    }
  }

  const addBasePrice = async () => {
    try {
      const { error } = await supabase.from('base_prices').insert([newBasePrice])
      if (error) throw error

      setShowAddBasePrice(false)
      setNewBasePrice({
        product_type: 'mallet',
        style_name: '',
        base_price: 0,
        description: '',
      })
      loadData()
    } catch (error) {
      console.error('Error adding base price:', error)
      alert('Failed to add base price')
    }
  }

  const updateBasePrice = async (bp: BasePrice) => {
    try {
      const { error } = await supabase
        .from('base_prices')
        .update({
          base_price: bp.base_price,
          description: bp.description,
        })
        .eq('id', bp.id)

      if (error) throw error

      setEditingBasePrice(null)
      loadData()
    } catch (error) {
      console.error('Error updating base price:', error)
      alert('Failed to update base price')
    }
  }

  const woodMaterials = materials.filter((m) => m.category === 'wood')
  const transitionMaterials = materials.filter((m) => m.category === 'transition')
  const malletBasePrices = basePrices.filter((bp) => bp.product_type === 'mallet')
  const awlBasePrices = basePrices.filter((bp) => bp.product_type === 'awl')
  const squareBasePrices = basePrices.filter((bp) => bp.product_type === 'square')

  const malletStockPartners = useMemo(() => {
    const groups = new Map<string, string[]>()
    for (const bp of malletBasePrices) {
      const g = malletBlankGroup(bp.style_name)
      const arr = groups.get(g) || []
      arr.push(bp.id)
      groups.set(g, arr)
    }
    const partners = new Map<string, string[]>()
    for (const [, ids] of groups) {
      for (const id of ids) partners.set(id, ids.filter((x) => x !== id))
    }
    return partners
  }, [malletBasePrices])

  const lowStockWarnings = useMemo(() => {
    const posLabel: Record<string, string> = { head: 'Head', handle: 'Handle', awl_handle: 'Awl', square_scale: 'Scale' }
    const posAvailField: Record<string, keyof Material> = {
      head: 'available_mallet_head',
      handle: 'available_mallet_handle',
      awl_handle: 'available_awl_handle',
      square_scale: 'available_square_scale',
    }
    const bpMap = new Map(basePrices.map((bp) => [bp.id, bp]))
    const matMap = new Map(woodMaterials.map((m) => [m.id, m]))

    const seenMalletBlank = new Set<string>()
    const out: { material: Material; label: string; count: number }[] = []
    for (const row of materialStylePricing) {
      const mat = matMap.get(row.material_id)
      if (!mat) continue
      const avail = posAvailField[row.position]
      if (avail && mat[avail] === false) continue
      const s = typeof row.stock === 'number' ? row.stock : Number.parseInt(String(row.stock ?? '0'), 10)
      if (s > 1) continue
      const bp = bpMap.get(row.base_price_id)
      if (!bp) continue

      if (bp.product_type === 'mallet') {
        const blankKey = `${row.material_id}_${malletBlankGroup(bp.style_name)}_${row.position}`
        if (seenMalletBlank.has(blankKey)) continue
        seenMalletBlank.add(blankKey)
        const group = malletBlankGroup(bp.style_name)
        const groupAbbrs = malletBasePrices
          .filter((b) => malletBlankGroup(b.style_name) === group)
          .map((b) => styleAbbreviation(b.style_name))
        out.push({ material: mat, label: `${groupAbbrs.join('/')} ${posLabel[row.position] ?? row.position}`, count: s })
      } else {
        const styleName = bp.product_type === 'awl' ? awlAbbreviation(bp.style_name) : squareAbbreviation(bp.style_name)
        out.push({ material: mat, label: `${styleName} ${posLabel[row.position] ?? row.position}`, count: s })
      }
    }
    return out.sort((a, b) => a.count - b.count || a.material.name.localeCompare(b.material.name))
  }, [woodMaterials, materialStylePricing, basePrices, malletBasePrices])

  if (loading) return <div className="container mx-auto px-4 py-12">Loading...</div>

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8 flex gap-2">
        <Link href="/admin/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
        </Link>
        <Link href="/admin/products">
          <Button variant="outline" size="sm">
            Products
          </Button>
        </Link>
        <Link href="/admin/workshop-stock">
          <Button variant="outline" size="sm">
            Workshop Stock
          </Button>
        </Link>
      </div>

      <h1 className="text-4xl font-bold mb-8">Materials & Pricing</h1>

      {lowStockWarnings.length > 0 && !lowStockBannerDismissed && (
        <div className="mb-6 rounded-lg border border-amber-700/80 bg-amber-950/50 px-4 py-3 text-sm text-amber-100">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" aria-hidden />
            <div className="min-w-0 flex-1 space-y-1">
              {(() => {
                const grouped = new Map<string, { name: string; items: string[] }>()
                for (const w of lowStockWarnings) {
                  const existing = grouped.get(w.material.id) || { name: w.material.name, items: [] }
                  existing.items.push(`${w.label} (${w.count})`)
                  grouped.set(w.material.id, existing)
                }
                return Array.from(grouped.entries()).map(([id, g]) => (
                  <p key={id}>Low stock: {g.name} — {g.items.join(', ')}</p>
                ))
              })()}
            </div>
            <button
              type="button"
              className="shrink-0 rounded p-1 text-amber-200/80 hover:bg-amber-900/60 hover:text-amber-50"
              aria-label="Dismiss low stock warnings"
              onClick={() => setLowStockBannerDismissed(true)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Base Prices */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Base Prices</CardTitle>
            <Button size="sm" onClick={() => setShowAddBasePrice(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Base Price
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Mallets</h3>
              {malletBasePrices.map(bp => (
                <div key={bp.id} className="flex items-center gap-4 p-3 border rounded mb-2">
                  {editingBasePrice?.id === bp.id ? (
                    <>
                      <div className="flex-1">
                        <p className="font-medium">{bp.style_name}</p>
                        <Input
                          type="number"
                          step="0.01"
                          value={editingBasePrice.base_price}
                          onChange={(e) => setEditingBasePrice({
                            ...editingBasePrice,
                            base_price: parseFloat(e.target.value)
                          })}
                          className="w-32 mt-1"
                        />
                      </div>
                      <Button size="sm" onClick={() => updateBasePrice(editingBasePrice)}>
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingBasePrice(null)}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1">
                        <p className="font-medium">{bp.style_name}</p>
                        <p className="text-sm text-zinc-400">{bp.description}</p>
                      </div>
                      <p className="font-bold text-lg">£{bp.base_price.toFixed(2)}</p>
                      <Button size="sm" variant="outline" onClick={() => setEditingBasePrice(bp)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div>
              <h3 className="font-semibold mb-2">Awls</h3>
              {awlBasePrices.map(bp => (
                <div key={bp.id} className="flex items-center gap-4 p-3 border rounded mb-2">
                  {editingBasePrice?.id === bp.id ? (
                    <>
                      <div className="flex-1">
                        <p className="font-medium">{bp.style_name}</p>
                        <Input
                          type="number"
                          step="0.01"
                          value={editingBasePrice.base_price}
                          onChange={(e) => setEditingBasePrice({
                            ...editingBasePrice,
                            base_price: parseFloat(e.target.value)
                          })}
                          className="w-32 mt-1"
                        />
                      </div>
                      <Button size="sm" onClick={() => updateBasePrice(editingBasePrice)}>
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingBasePrice(null)}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1">
                        <p className="font-medium">{bp.style_name}</p>
                        <p className="text-sm text-zinc-400">{bp.description}</p>
                      </div>
                      <p className="font-bold text-lg">£{bp.base_price.toFixed(2)}</p>
                      <Button size="sm" variant="outline" onClick={() => setEditingBasePrice(bp)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div>
              <h3 className="font-semibold mb-2">Squares</h3>
              {squareBasePrices.length === 0 ? (
                <p className="text-sm text-zinc-500">No square base prices yet.</p>
              ) : (
                squareBasePrices.map(bp => (
                  <div key={bp.id} className="flex items-center gap-4 p-3 border border-zinc-700 rounded mb-2">
                    {editingBasePrice?.id === bp.id ? (
                      <>
                        <div className="flex-1">
                          <p className="font-medium">{bp.style_name}</p>
                          <Input
                            type="number"
                            step="0.01"
                            value={editingBasePrice.base_price}
                            onChange={(e) => setEditingBasePrice({
                              ...editingBasePrice,
                              base_price: parseFloat(e.target.value)
                            })}
                            className={`w-32 mt-1 ${inputDarkClass}`}
                          />
                        </div>
                        <Button size="sm" onClick={() => updateBasePrice(editingBasePrice)}>
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingBasePrice(null)}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1">
                          <p className="font-medium">{bp.style_name}</p>
                          <p className="text-sm text-zinc-400">{bp.description}</p>
                        </div>
                        <p className="font-bold text-lg">£{bp.base_price.toFixed(2)}</p>
                        <Button size="sm" variant="outline" onClick={() => setEditingBasePrice(bp)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {showAddBasePrice && (
            <div className="mt-4 p-4 border border-zinc-700 rounded bg-brand-dark-card bg-zinc-900/80">
              <h4 className="font-semibold mb-3 text-zinc-200">Add Base Price</h4>
              <div className="space-y-3">
                <select
                  className={`h-10 rounded-md px-3 ${selectDarkClass}`}
                  value={newBasePrice.product_type}
                  onChange={(e) => setNewBasePrice({ ...newBasePrice, product_type: e.target.value })}
                >
                  <option value="mallet">Mallet</option>
                  <option value="awl">Awl</option>
                  <option value="square">Square</option>
                </select>
                <Input
                  placeholder="Style name (e.g., Turned Carving Mallet)"
                  value={newBasePrice.style_name}
                  onChange={(e) => setNewBasePrice({ ...newBasePrice, style_name: e.target.value })}
                  className={inputDarkClass}
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Base price"
                  value={newBasePrice.base_price || ''}
                  onChange={(e) => setNewBasePrice({ ...newBasePrice, base_price: parseFloat(e.target.value) })}
                  className={inputDarkClass}
                />
                <Input
                  placeholder="Description"
                  value={newBasePrice.description}
                  onChange={(e) => setNewBasePrice({ ...newBasePrice, description: e.target.value })}
                  className={inputDarkClass}
                />
                <div className="flex gap-2">
                  <Button onClick={addBasePrice}>Add</Button>
                  <Button variant="outline" onClick={() => setShowAddBasePrice(false)}>Cancel</Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wood Materials */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Wood Materials</CardTitle>
            <Button size="sm" onClick={() => setShowAddMaterial(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Material
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[calc(100vh-10rem)]">
            <table className="w-full">
              <thead className="sticky top-0 z-20">
                <tr className="border-b border-zinc-700">
                  <th className="text-left p-2 text-zinc-300 bg-zinc-950">Material</th>
                  <th className="text-center p-2 text-zinc-300 bg-zinc-950">Grain</th>
                  <th className="text-center p-2 text-zinc-300 bg-zinc-950">Mallet (per style)</th>
                  <th className="text-center p-2 text-zinc-300 w-14 bg-zinc-950" title="Mallet head">Head</th>
                  <th className="text-center p-2 text-zinc-300 w-14 bg-zinc-950" title="Mallet handle">Handle</th>
                  <th className="text-center p-2 text-zinc-300 w-14 bg-zinc-950" title="Awl handle">Awl</th>
                  <th className="text-center p-2 text-zinc-300 w-14 bg-zinc-950" title="Engineering square scale">Scale</th>
                  <th className="text-center p-2 text-zinc-300 w-14 bg-zinc-950" title="Master on/off — hides from ENTIRE site (library, builders, shop)">Live</th>
                  <th className="text-center p-2 text-zinc-300 w-10 bg-zinc-950" title="Stock status across all style/position combos">
                    Stk
                  </th>
                  <th className="text-center p-2 text-zinc-300 bg-zinc-950">Actions</th>
                </tr>
              </thead>
              <tbody>
                {woodMaterials.map((mat) => {
                  const stockInd = mspStockIndicator(mat.id, materialStylePricing)
                  const dotColor = stockInd.color === 'red' ? 'bg-red-500' : stockInd.color === 'orange' ? 'bg-orange-400' : 'bg-emerald-400'
                  return (
                  <Fragment key={mat.id}>
                  <tr className="border-b">
                    {editingMaterial?.id === mat.id ? (
                      <>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded border"
                              style={{ backgroundColor: mat.color_hex }}
                            />
                            <span className="font-medium">{mat.name}</span>
                          </div>
                        </td>
                        <td className="p-2">
                          <input
                            type="file"
                            id={`grain-${mat.id}`}
                            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.HEIC,.heif,.HEIF"
                            className="hidden"
                            onChange={(e) => { if (e.target.files?.[0]) uploadGrainImage(mat.id, e.target.files[0]) }}
                            disabled={uploadingGrainId === mat.id}
                          />
                          {uploadingGrainId === mat.id ? (
                            <div className="w-12 h-12 rounded border border-dashed flex items-center justify-center">
                              <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
                            </div>
                          ) : mat.grain_image_url ? (
                            <label htmlFor={`grain-${mat.id}`} className="cursor-pointer block w-12 h-12 rounded overflow-hidden border border-zinc-600 hover:opacity-80">
                              <img src={mat.grain_image_url} alt="" className="w-full h-full object-cover" title="Replace grain image" />
                            </label>
                          ) : (
                            <label htmlFor={`grain-${mat.id}`} className="cursor-pointer w-12 h-12 rounded border border-dashed border-zinc-500 flex items-center justify-center hover:bg-zinc-800">
                              <Upload className="h-5 w-5 text-zinc-500" />
                            </label>
                          )}
                        </td>
                        <td className="p-2 text-center text-sm text-zinc-500">
                          Use &quot;Edit pricing&quot; below
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            title="Mallet head"
                            checked={mat.available_mallet_head !== false}
                            onChange={() =>
                              toggleWoodAppAvailability(mat.id, 'available_mallet_head', mat.available_mallet_head !== false)
                            }
                            className="accent-brand-orange"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            title="Mallet handle"
                            checked={mat.available_mallet_handle !== false}
                            onChange={() =>
                              toggleWoodAppAvailability(mat.id, 'available_mallet_handle', mat.available_mallet_handle !== false)
                            }
                            className="accent-brand-orange"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            title="Awl handle"
                            checked={mat.available_awl_handle !== false}
                            onChange={() =>
                              toggleWoodAppAvailability(mat.id, 'available_awl_handle', mat.available_awl_handle !== false)
                            }
                            className="accent-brand-orange"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            title="Square scale"
                            checked={mat.available_square_scale !== false}
                            onChange={() =>
                              toggleWoodAppAvailability(mat.id, 'available_square_scale', mat.available_square_scale !== false)
                            }
                            className="accent-brand-orange"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            title="Available (master)"
                            checked={editingMaterial.available}
                            onChange={(e) => setEditingMaterial({
                              ...editingMaterial,
                              available: e.target.checked
                            })}
                            className="accent-brand-orange"
                          />
                        </td>
                        <td className="p-2 text-center" title={stockInd.tooltip}>
                          <span className={`inline-block w-3 h-3 rounded-full ${dotColor}`} />
                        </td>
                        <td className="p-2">
                          <div className="flex gap-2 justify-center">
                            <Button size="sm" onClick={() => updateMaterial(editingMaterial)}>
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingMaterial(null)}>
                              Cancel
                            </Button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded border"
                              style={{ backgroundColor: mat.color_hex }}
                            />
                            <span className="font-medium">{mat.name}</span>
                          </div>
                        </td>
                        <td className="p-2">
                          <input type="file" id={`grain-${mat.id}`} accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.HEIC,.heif,.HEIF" className="hidden" onChange={(e) => { if (e.target.files?.[0]) uploadGrainImage(mat.id, e.target.files[0]) }} disabled={uploadingGrainId === mat.id} />
                          {uploadingGrainId === mat.id ? (
                            <div className="w-12 h-12 rounded border border-dashed flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-zinc-500" /></div>
                          ) : mat.grain_image_url ? (
                            <label htmlFor={`grain-${mat.id}`} className="cursor-pointer block w-12 h-12 rounded overflow-hidden border"><img src={mat.grain_image_url} alt="" className="w-full h-full object-cover" /></label>
                          ) : (
                            <label htmlFor={`grain-${mat.id}`} className="cursor-pointer w-12 h-12 rounded border border-dashed flex items-center justify-center"><Upload className="h-5 w-5 text-zinc-500" /></label>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          <Button
                            type="button"
                            size="sm"
                            variant={expandedPricingMaterialId === mat.id ? 'default' : 'outline'}
                            onClick={() =>
                              expandedPricingMaterialId === mat.id
                                ? setExpandedPricingMaterialId(null)
                                : openPricingGrid(mat.id)
                            }
                          >
                            {expandedPricingMaterialId === mat.id ? 'Close grid' : 'View pricing'}
                          </Button>
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            title="Mallet head"
                            checked={mat.available_mallet_head !== false}
                            onChange={() =>
                              toggleWoodAppAvailability(mat.id, 'available_mallet_head', mat.available_mallet_head !== false)
                            }
                            className="accent-brand-orange"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            title="Mallet handle"
                            checked={mat.available_mallet_handle !== false}
                            onChange={() =>
                              toggleWoodAppAvailability(mat.id, 'available_mallet_handle', mat.available_mallet_handle !== false)
                            }
                            className="accent-brand-orange"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            title="Awl handle"
                            checked={mat.available_awl_handle !== false}
                            onChange={() =>
                              toggleWoodAppAvailability(mat.id, 'available_awl_handle', mat.available_awl_handle !== false)
                            }
                            className="accent-brand-orange"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            title="Square scale"
                            checked={mat.available_square_scale !== false}
                            onChange={() =>
                              toggleWoodAppAvailability(mat.id, 'available_square_scale', mat.available_square_scale !== false)
                            }
                            className="accent-brand-orange"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            title="Available (master)"
                            checked={mat.available}
                            onChange={() => toggleWoodMasterAvailable(mat.id, mat.available)}
                            className="accent-brand-orange"
                          />
                        </td>
                        <td className="p-2 text-center" title={stockInd.tooltip}>
                          <span className={`inline-block w-3 h-3 rounded-full ${dotColor}`} />
                        </td>
                        <td className="p-2">
                          <div className="flex gap-2 justify-center">
                            <Link href={`/admin/workshop-stock?material=${mat.id}`}>
                              <Button size="sm" variant="outline" title="Workshop stock for this species">
                                <Package className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button size="sm" variant="outline" onClick={() => setEditingMaterial(mat)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => deleteMaterial(mat.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                  {expandedPricingMaterialId === mat.id && (
                    <tr>
                      <td colSpan={10} className="p-4 border-b border-zinc-800 bg-brand-dark-card bg-zinc-900/95">
                        <div className="space-y-8 overflow-x-auto text-zinc-200">
                          {((mat.available_mallet_head ?? true) || (mat.available_mallet_handle ?? true)) && malletBasePrices.length > 0 && (
                            <div className="space-y-3">
                              <p className="text-sm font-medium text-zinc-200">Mallet — stock &amp; premiums</p>
                              <p className="text-xs text-zinc-500">Manage stock &amp; pricing in <Link href={`/admin/workshop-stock?material=${mat.id}`} className="text-brand-orange hover:underline">Workshop Stock</Link></p>
                              <div className="inline-block min-w-full">
                                <table className="text-xs border-collapse border border-zinc-700">
                                  <thead>
                                    <tr>
                                      <th rowSpan={2} className="border border-zinc-700 p-2 text-left bg-zinc-800 text-zinc-300">Position</th>
                                      {malletBasePrices.map((bp) => (
                                        <th
                                          key={bp.id}
                                          colSpan={2}
                                          className="border border-zinc-700 p-1.5 text-center bg-zinc-800 text-zinc-300"
                                          title={bp.style_name}
                                        >
                                          {styleAbbreviation(bp.style_name)}
                                        </th>
                                      ))}
                                    </tr>
                                    <tr>
                                      {malletBasePrices.map((bp) => (
                                        <Fragment key={bp.id}>
                                          <th className="border border-zinc-700 px-1 py-0.5 text-center bg-zinc-800/60 text-zinc-400 w-14">Stk</th>
                                          <th className="border border-zinc-700 px-1 py-0.5 text-center bg-zinc-800/60 text-zinc-400 w-20">£</th>
                                        </Fragment>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(['head', 'handle'] as const).map((pos) => (
                                      <tr key={pos}>
                                        <td className="border border-zinc-700 p-2 font-medium capitalize bg-zinc-900/80 text-zinc-200">
                                          {pos}
                                        </td>
                                        {malletBasePrices.map((bp) => {
                                          const key = pricingKey(mat.id, bp.id, pos)
                                          const stockKey = key + '_stock'
                                          const sv = Number.parseInt(pricingForm[stockKey] ?? '0', 10)
                                          const stockCls = sv === 0 ? 'text-red-400' : sv === 1 ? 'text-orange-400' : 'text-zinc-300'
                                          return (
                                            <Fragment key={key}>
                                              <td className={`border border-zinc-700 px-2 py-1.5 text-center ${stockCls} font-medium`}>
                                                {pricingForm[stockKey] ?? '0'}
                                              </td>
                                              <td className="border border-zinc-700 px-2 py-1.5 text-right text-zinc-300">
                                                £{Number(pricingForm[key] ?? '0').toFixed(0)}
                                              </td>
                                            </Fragment>
                                          )
                                        })}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {(mat.available_awl_handle ?? true) && awlBasePrices.length > 0 && (
                            <div className="space-y-3">
                              <p className="text-sm font-medium text-zinc-200">Awl — stock &amp; premiums</p>
                              <div className="inline-block min-w-full">
                                <table className="text-xs border-collapse border border-zinc-700">
                                  <thead>
                                    <tr>
                                      <th rowSpan={2} className="border border-zinc-700 p-2 text-left bg-zinc-800 text-zinc-300">Style</th>
                                      {awlBasePrices.map((bp) => (
                                        <th
                                          key={bp.id}
                                          colSpan={2}
                                          className="border border-zinc-700 p-1.5 text-center bg-zinc-800 text-zinc-300"
                                          title={bp.style_name}
                                        >
                                          {awlAbbreviation(bp.style_name)}
                                        </th>
                                      ))}
                                    </tr>
                                    <tr>
                                      {awlBasePrices.map((bp) => (
                                        <Fragment key={bp.id}>
                                          <th className="border border-zinc-700 px-1 py-0.5 text-center bg-zinc-800/60 text-zinc-400 w-14">Stk</th>
                                          <th className="border border-zinc-700 px-1 py-0.5 text-center bg-zinc-800/60 text-zinc-400 w-20">£</th>
                                        </Fragment>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr>
                                      <td className="border border-zinc-700 p-2 font-medium bg-zinc-900/80 text-zinc-200">Premium</td>
                                      {awlBasePrices.map((bp) => {
                                        const key = pricingKey(mat.id, bp.id, 'awl_handle')
                                        const stockKey = key + '_stock'
                                        const sv = parseInt(pricingForm[stockKey] ?? '0', 10)
                                        const stockCls = sv === 0 ? 'text-red-400' : sv === 1 ? 'text-orange-400' : 'text-zinc-300'
                                        return (
                                          <Fragment key={key}>
                                            <td className={`border border-zinc-700 px-2 py-1.5 text-center ${stockCls} font-medium`}>
                                              {pricingForm[stockKey] ?? '0'}
                                            </td>
                                            <td className="border border-zinc-700 px-2 py-1.5 text-right text-zinc-300">
                                              £{Number(pricingForm[key] ?? '0').toFixed(0)}
                                            </td>
                                          </Fragment>
                                        )
                                      })}
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {(mat.available_square_scale ?? true) && squareBasePrices.length > 0 && (
                            <div className="space-y-3">
                              <p className="text-sm font-medium text-zinc-200">Square — stock &amp; premiums</p>
                              <div className="inline-block min-w-full">
                                <table className="text-xs border-collapse border border-zinc-700">
                                  <thead>
                                    <tr>
                                      <th rowSpan={2} className="border border-zinc-700 p-2 text-left bg-zinc-800 text-zinc-300">Size</th>
                                      {squareBasePrices.map((bp) => (
                                        <th
                                          key={bp.id}
                                          colSpan={2}
                                          className="border border-zinc-700 p-1.5 text-center bg-zinc-800 text-zinc-300"
                                          title={bp.style_name}
                                        >
                                          {squareAbbreviation(bp.style_name)}
                                        </th>
                                      ))}
                                    </tr>
                                    <tr>
                                      {squareBasePrices.map((bp) => (
                                        <Fragment key={bp.id}>
                                          <th className="border border-zinc-700 px-1 py-0.5 text-center bg-zinc-800/60 text-zinc-400 w-14">Stk</th>
                                          <th className="border border-zinc-700 px-1 py-0.5 text-center bg-zinc-800/60 text-zinc-400 w-20">£</th>
                                        </Fragment>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr>
                                      <td className="border border-zinc-700 p-2 font-medium bg-zinc-900/80 text-zinc-200">Premium</td>
                                      {squareBasePrices.map((bp) => {
                                        const key = pricingKey(mat.id, bp.id, 'square_scale')
                                        const stockKey = key + '_stock'
                                        const sv = parseInt(pricingForm[stockKey] ?? '0', 10)
                                        const stockCls = sv === 0 ? 'text-red-400' : sv === 1 ? 'text-orange-400' : 'text-zinc-300'
                                        return (
                                          <Fragment key={key}>
                                            <td className={`border border-zinc-700 px-2 py-1.5 text-center ${stockCls} font-medium`}>
                                              {pricingForm[stockKey] ?? '0'}
                                            </td>
                                            <td className="border border-zinc-700 px-2 py-1.5 text-right text-zinc-300">
                                              £{Number(pricingForm[key] ?? '0').toFixed(0)}
                                            </td>
                                          </Fragment>
                                        )
                                      })}
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                  {editingMaterial?.id === mat.id && (
                    <tr>
                      <td colSpan={10} className="p-4 border-b border-zinc-800 bg-brand-dark-card bg-zinc-900/95">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <label className="block font-medium mb-1 text-zinc-300">Janka Hardness</label>
                            <Input type="number" value={editingMaterial.janka_hardness ?? ''} onChange={(e) => setEditingMaterial({ ...editingMaterial, janka_hardness: e.target.value ? parseInt(e.target.value, 10) : null })} className={`w-full ${inputDarkClass}`} />
                          </div>
                          <div>
                            <label className="block font-medium mb-1 text-zinc-300">Specific Gravity</label>
                            <Input type="number" step="0.01" value={editingMaterial.specific_gravity ?? ''} onChange={(e) => setEditingMaterial({ ...editingMaterial, specific_gravity: e.target.value ? parseFloat(e.target.value) : null })} className={`w-full ${inputDarkClass}`} />
                          </div>
                          <div>
                            <label className="block font-medium mb-1 text-zinc-300">Origin</label>
                            <Input value={editingMaterial.origin ?? ''} onChange={(e) => setEditingMaterial({ ...editingMaterial, origin: e.target.value || null })} className={`w-full ${inputDarkClass}`} placeholder="e.g. North America" />
                          </div>
                          <div>
                            <label className="block font-medium mb-1 text-zinc-300">Grain Type</label>
                            <select className={selectDarkClass} value={editingMaterial.grain_type ?? ''} onChange={(e) => setEditingMaterial({ ...editingMaterial, grain_type: e.target.value || null })}>
                              <option value="">—</option>
                              <option value="straight">Straight</option>
                              <option value="interlocked">Interlocked</option>
                              <option value="wavy">Wavy</option>
                              <option value="irregular">Irregular</option>
                              <option value="spiral">Spiral</option>
                              <option value="roey">Roey</option>
                            </select>
                          </div>
                          <div>
                            <label className="block font-medium mb-1 text-zinc-300">Texture</label>
                            <select className={selectDarkClass} value={editingMaterial.texture ?? ''} onChange={(e) => setEditingMaterial({ ...editingMaterial, texture: e.target.value || null })}>
                              <option value="">—</option>
                              <option value="fine">Fine</option>
                              <option value="medium">Medium</option>
                              <option value="coarse">Coarse</option>
                            </select>
                          </div>
                          <div>
                            <label className="block font-medium mb-1 text-zinc-300">Durability</label>
                            <select className={selectDarkClass} value={editingMaterial.durability ?? ''} onChange={(e) => setEditingMaterial({ ...editingMaterial, durability: e.target.value || null })}>
                              <option value="">—</option>
                              <option value="very_high">Very High</option>
                              <option value="high">High</option>
                              <option value="moderate">Moderate</option>
                              <option value="low">Low</option>
                            </select>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block font-medium mb-1 text-zinc-300">Grain Description</label>
                            <textarea rows={2} className={textareaDarkClass} value={editingMaterial.grain_description ?? ''} onChange={(e) => setEditingMaterial({ ...editingMaterial, grain_description: e.target.value || null })} placeholder="Describe the grain and figure" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block font-medium mb-1 text-zinc-300">Colour Description</label>
                            <Input value={editingMaterial.color_description ?? ''} onChange={(e) => setEditingMaterial({ ...editingMaterial, color_description: e.target.value || null })} className={`w-full ${inputDarkClass}`} placeholder="e.g. Dark chocolate brown" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block font-medium mb-1 text-zinc-300">History / Description</label>
                            <textarea rows={4} className={textareaDarkClass} value={editingMaterial.description ?? ''} onChange={(e) => setEditingMaterial({ ...editingMaterial, description: e.target.value || null })} placeholder="The story and history of this wood species" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block font-medium mb-1 text-zinc-300">Common Uses</label>
                            <textarea rows={3} className={textareaDarkClass} value={editingMaterial.uses_description ?? ''} onChange={(e) => setEditingMaterial({ ...editingMaterial, uses_description: e.target.value || null })} placeholder="Musical instruments, tool handles, furniture, etc." />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block font-medium mb-1 text-zinc-300">Gallery Images (URLs, one per line)</label>
                            <textarea
                              rows={3}
                              className={textareaDarkClass}
                              value={(editingMaterial.gallery_images || []).join('\n')}
                              onChange={(e) => setEditingMaterial({
                                ...editingMaterial,
                                gallery_images: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean),
                              })}
                              placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                            />
                            <p className="text-xs text-zinc-500 mt-1">Upload gallery images to storage then paste URLs here</p>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block font-medium mb-1 text-zinc-300">Videos (one per line: URL | Title)</label>
                            <textarea
                              rows={3}
                              className={textareaDarkClass}
                              value={(editingMaterial.videos || []).map((v) => v.title ? `${v.url} | ${v.title}` : v.url).join('\n')}
                              onChange={(e) => setEditingMaterial({
                                ...editingMaterial,
                                videos: e.target.value.split('\n').map((line) => {
                                  const [url, ...rest] = line.split('|').map((s) => s.trim())
                                  if (!url) return null
                                  return { url, title: rest.join('|').trim() || undefined }
                                }).filter(Boolean) as { url: string; title?: string }[],
                              })}
                              placeholder="https://youtu.be/abcd1234 | Working with Lignum Vitae"
                            />
                            <p className="text-xs text-zinc-500 mt-1">YouTube links auto-embed. Format: URL | Optional title</p>
                          </div>
                          <div className="md:col-span-2 border-t border-zinc-700 pt-4 mt-4">
                            <label className="block font-medium mb-2 text-zinc-300">Tap Test Audio</label>
                            <input
                              type="file"
                              accept="audio/*,.m4a,.mp3,.wav,.ogg,.aac,.mp4,.x-m4a"
                              className="hidden"
                              id={`tap-audio-${editingMaterial.id}`}
                              onChange={(e) => { if (e.target.files?.[0]) uploadTapAudio(editingMaterial.id, e.target.files[0]) }}
                              disabled={uploadingTapAudioId === editingMaterial.id}
                            />
                            {uploadingTapAudioId === editingMaterial.id ? (
                              <div className="flex items-center gap-2 text-sm text-zinc-500">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Uploading...
                              </div>
                            ) : editingMaterial.tap_audio_url ? (
                              <div className="space-y-2">
                                <audio controls className="w-full max-w-xs h-8" src={editingMaterial.tap_audio_url} />
                                <div className="flex gap-2">
                                  <label htmlFor={`tap-audio-${editingMaterial.id}`} className="text-sm text-brand-orange hover:underline cursor-pointer">
                                    Replace audio
                                  </label>
                                </div>
                              </div>
                            ) : (
                              <label htmlFor={`tap-audio-${editingMaterial.id}`} className="inline-flex items-center gap-2 px-3 py-2 rounded border border-dashed border-zinc-500 hover:bg-zinc-800 cursor-pointer text-sm text-zinc-200">
                                <Upload className="h-4 w-4" />
                                Upload audio (MP3, WAV, M4A, OGG)
                              </label>
                            )}
                            <Input
                              className={`mt-2 ${inputDarkClass}`}
                              placeholder="e.g. Deep, resonant ring with a warm sustain"
                              value={editingMaterial.tap_audio_description ?? ''}
                              onChange={(e) => setEditingMaterial({ ...editingMaterial, tap_audio_description: e.target.value || null })}
                            />
                            <p className="text-xs text-zinc-500 mt-1">Description shown below the player on Wood Library</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </Fragment>
                )
                })}
              </tbody>
            </table>
          </div>

          {showAddMaterial && (
            <div className="mx-6 mb-6 mt-4 p-4 border border-zinc-700 rounded bg-brand-dark-card bg-zinc-900/80">
              <h4 className="font-semibold mb-3 text-zinc-200">Add Material</h4>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Material name"
                  value={newMaterial.name}
                  onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                  className={inputDarkClass}
                />
                <select
                  className={`h-10 rounded-md px-3 ${selectDarkClass}`}
                  value={newMaterial.category}
                  onChange={(e) => setNewMaterial({ ...newMaterial, category: e.target.value })}
                >
                  <option value="wood">Wood</option>
                  <option value="transition">Transition</option>
                </select>
                <Input
                  type="color"
                  value={newMaterial.color_hex}
                  onChange={(e) => setNewMaterial({ ...newMaterial, color_hex: e.target.value })}
                  className="h-10 bg-zinc-800 border-zinc-700"
                />
                {newMaterial.category === 'transition' && (
                  <>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Mallet transition premium"
                      value={newMaterial.mallet_head_premium || ''}
                      onChange={(e) => setNewMaterial({ ...newMaterial, mallet_head_premium: parseFloat(e.target.value) || 0 })}
                      className={inputDarkClass}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Mallet handle (unused)"
                      value={newMaterial.mallet_handle_premium || ''}
                      onChange={(e) => setNewMaterial({ ...newMaterial, mallet_handle_premium: parseFloat(e.target.value) || 0 })}
                      className={inputDarkClass}
                    />
                  </>
                )}
                {newMaterial.category === 'transition' && (
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Awl handle premium"
                    value={newMaterial.awl_handle_premium || ''}
                    onChange={(e) => setNewMaterial({ ...newMaterial, awl_handle_premium: parseFloat(e.target.value) || 0 })}
                    className={inputDarkClass}
                  />
                )}
                {newMaterial.category === 'wood' && (
                  <div className="col-span-2 flex flex-wrap gap-4 text-sm text-zinc-300">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newMaterial.available_mallet_head}
                        onChange={(e) => setNewMaterial({ ...newMaterial, available_mallet_head: e.target.checked })}
                        className="accent-brand-orange"
                      />
                      Head
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newMaterial.available_mallet_handle}
                        onChange={(e) => setNewMaterial({ ...newMaterial, available_mallet_handle: e.target.checked })}
                        className="accent-brand-orange"
                      />
                      Handle
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newMaterial.available_awl_handle}
                        onChange={(e) => setNewMaterial({ ...newMaterial, available_awl_handle: e.target.checked })}
                        className="accent-brand-orange"
                      />
                      Awl
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newMaterial.available_square_scale}
                        onChange={(e) => setNewMaterial({ ...newMaterial, available_square_scale: e.target.checked })}
                        className="accent-brand-orange"
                      />
                      Scale
                    </label>
                  </div>
                )}
                {newMaterial.category === 'wood' && (
                  <p className="col-span-2 text-sm text-zinc-400">
                    After adding, use &quot;Edit pricing&quot; in the table to set premiums per style (mallet, awl, square).
                  </p>
                )}
              </div>
              <div className="flex gap-2 mt-3">
                <Button onClick={addMaterial}>Add Material</Button>
                <Button variant="outline" onClick={() => setShowAddMaterial(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transition & Coin Materials — fixed pricing */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <CardTitle>Transition &amp; coin materials</CardTitle>
              <p className="text-sm text-zinc-500 font-normal mt-1">
                Fixed pricing (same regardless of mallet size or style). Mallet column is the transition piece; awl is ferrule; coin is EDC coin premium.
              </p>
            </div>
            <Button size="sm" onClick={() => setShowAddTransition(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add transition
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showAddTransition && (
            <div className="mb-6 p-4 border border-zinc-700 rounded bg-zinc-900/80 space-y-3">
              <h4 className="font-semibold text-zinc-200">New transition material</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Input placeholder="Name" value={newTransition.name} onChange={(e) => setNewTransition({ ...newTransition, name: e.target.value })} />
                <Input type="color" value={newTransition.color_hex} onChange={(e) => setNewTransition({ ...newTransition, color_hex: e.target.value })} />
                <Input type="number" step="0.01" placeholder="Mallet (£)" value={newTransition.mallet_head_premium || ''} onChange={(e) => setNewTransition({ ...newTransition, mallet_head_premium: parseFloat(e.target.value) || 0 })} />
                <Input type="number" step="0.01" placeholder="Awl ferrule (£)" value={newTransition.awl_handle_premium || ''} onChange={(e) => setNewTransition({ ...newTransition, awl_handle_premium: parseFloat(e.target.value) || 0 })} />
                <Input type="number" step="0.01" placeholder="Coin (£)" value={newTransition.coin_premium || ''} onChange={(e) => setNewTransition({ ...newTransition, coin_premium: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="flex gap-2">
                <Button onClick={addTransitionMaterial}>Add</Button>
                <Button variant="outline" onClick={() => setShowAddTransition(false)}>Cancel</Button>
              </div>
            </div>
          )}
          <div className="space-y-2">
            {transitionMaterials.map((mat) => (
              <div key={mat.id} className="flex flex-wrap items-center gap-4 p-3 border rounded">
                <div className="w-8 h-8 rounded border shrink-0" style={{ backgroundColor: mat.color_hex }} />
                <span className="font-medium flex-1 min-w-[120px]">{mat.name}</span>
                {editingMaterial?.id === mat.id ? (
                  <>
                    <div className="flex flex-wrap gap-2 items-center">
                      <label className="text-xs text-zinc-500">Mallet</label>
                      <Input
                        type="number"
                        step="0.01"
                        className="w-24 h-9"
                        value={editingMaterial.mallet_head_premium}
                        onChange={(e) => setEditingMaterial({ ...editingMaterial, mallet_head_premium: parseFloat(e.target.value) || 0 })}
                      />
                      <label className="text-xs text-zinc-500">Awl</label>
                      <Input
                        type="number"
                        step="0.01"
                        className="w-24 h-9"
                        value={editingMaterial.awl_handle_premium}
                        onChange={(e) => setEditingMaterial({ ...editingMaterial, awl_handle_premium: parseFloat(e.target.value) || 0 })}
                      />
                      <label className="text-xs text-zinc-500">Coin</label>
                      <Input
                        type="number"
                        step="0.01"
                        className="w-24 h-9"
                        value={editingMaterial.coin_premium ?? 0}
                        onChange={(e) => setEditingMaterial({ ...editingMaterial, coin_premium: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <Button size="sm" onClick={() => updateMaterial(editingMaterial)}>Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingMaterial(null)}>Cancel</Button>
                  </>
                ) : (
                  <>
                    <span className="text-sm text-zinc-400">Mallet £{mat.mallet_head_premium.toFixed(2)}</span>
                    <span className="text-sm text-zinc-400">Awl £{mat.awl_handle_premium.toFixed(2)}</span>
                    <span className="text-sm text-zinc-400">Coin £{(mat.coin_premium ?? 0).toFixed(2)}</span>
                    <Button size="sm" variant="outline" onClick={() => setEditingMaterial({ ...mat, coin_premium: mat.coin_premium ?? 0 })}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteMaterial(mat.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

