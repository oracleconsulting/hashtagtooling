'use client'

import { useEffect, useState, useMemo, Fragment, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import {
  Loader2, Plus, Trash2, ArrowLeft, Upload, X, ChevronDown, ChevronRight,
  Pencil, Package, Printer, Search, AlertTriangle,
} from 'lucide-react'
import { compressImage } from '@/lib/image-utils'
import { Suspense } from 'react'

/* ─── types ────────────────────────────────────────────────────────── */

interface WoodMaterial {
  id: string
  name: string
  color_hex: string
  grain_image_url?: string | null
}

type StockStatus = 'available' | 'reserved' | 'in_progress' | 'used' | 'allocated_sale' | 'defective' | 'gifted'
type Grade = 'A' | 'B' | 'C' | 'S'
type SuitableFor = 'head' | 'handle' | 'awl_handle' | 'square_scale'

interface StockPiece {
  id: string
  material_id: string
  sku: string
  dimensions: string | null
  weight_grams: number | null
  cost_price: number | null
  supplier: string | null
  purchase_date: string | null
  drawer_number: string | null
  location_notes: string | null
  status: StockStatus
  suitable_for: SuitableFor[]
  allocated_to_order_id: string | null
  allocated_to_product_id: string | null
  allocated_notes: string | null
  images: string[]
  grade: Grade | null
  notes: string | null
  is_cut: boolean
  created_at: string
  updated_at: string
}

const STATUS_LABELS: Record<StockStatus, string> = {
  available: 'Available',
  reserved: 'Reserved',
  in_progress: 'In Progress',
  used: 'Used',
  allocated_sale: 'Sale',
  defective: 'Defective',
  gifted: 'Gifted',
}

const STATUS_COLORS: Record<StockStatus, string> = {
  available: 'bg-emerald-900/40 text-emerald-400 border-emerald-700/50',
  reserved: 'bg-amber-900/40 text-amber-400 border-amber-700/50',
  in_progress: 'bg-blue-900/40 text-blue-400 border-blue-700/50',
  used: 'bg-zinc-800 text-zinc-500 border-zinc-700',
  allocated_sale: 'bg-purple-900/40 text-purple-400 border-purple-700/50',
  defective: 'bg-red-900/40 text-red-400 border-red-700/50',
  gifted: 'bg-pink-900/40 text-pink-400 border-pink-700/50',
}

const SUITABLE_ABBR: Record<SuitableFor, string> = { head: 'H', handle: 'Ha', awl_handle: 'A', square_scale: 'S' }

function suitableDisplay(piece: { suitable_for: SuitableFor[]; notes: string | null }): string {
  const notes = piece.notes || ''
  const malletMatch = notes.match(/^(S[CDJW]M\/T[CDJW]M)(?:\s+(Head|Handle))?/i)
  if (malletMatch) {
    const pair = malletMatch[1].toUpperCase()
    const cut = malletMatch[2] ? ` ${malletMatch[2].charAt(0).toUpperCase() + malletMatch[2].slice(1)}` : ''
    return `${pair}${cut}`
  }
  if (/^Awl\b/i.test(notes)) return 'Awl'
  if (/^Scale\b/i.test(notes)) return 'Scale'
  const labels: string[] = []
  for (const s of piece.suitable_for) {
    if (s === 'awl_handle') labels.push('Awl')
    else if (s === 'square_scale') labels.push('Scale')
    else labels.push(s.charAt(0).toUpperCase() + s.slice(1))
  }
  return labels.join(', ')
}

const inputDarkClass = 'bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500'
const selectDarkClass = 'h-9 rounded border border-zinc-700 bg-zinc-800 px-2 text-white text-sm'
const textareaDarkClass = 'w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-white placeholder:text-zinc-500'

/* ─── helpers ──────────────────────────────────────────────────────── */

function skuPrefixFromName(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return 'XX'
  if (words.length === 1) return words[0].slice(0, 4).toUpperCase()
  return words.map((w) => w[0]).join('').toUpperCase().slice(0, 4)
}

async function convertHeicToJpeg(file: File): Promise<File> {
  const form = new FormData()
  form.append('file', file)
  const resp = await fetch('/api/convert-heic', { method: 'POST', body: form })
  if (!resp.ok) throw new Error(`HEIC conversion failed (${resp.status})`)
  const blob = await resp.blob()
  return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' })
}

function isHeic(file: File): boolean {
  const t = file.type.toLowerCase()
  const n = file.name.toLowerCase()
  return t === 'image/heic' || t === 'image/heif' || n.endsWith('.heic') || n.endsWith('.heif')
}

async function uploadStockImages(stockId: string, files: File[]): Promise<{ urls: string[]; errors: string[] }> {
  const urls: string[] = []
  const errors: string[] = []
  for (const rawFile of files) {
    let processed: File = rawFile
    try {
      if (isHeic(rawFile)) {
        processed = await convertHeicToJpeg(rawFile)
        processed = await compressImage(processed)
      } else if (rawFile.type.startsWith('image/')) {
        processed = await compressImage(processed)
      }
    } catch {
      /* use original */
    }
    const rand = Math.random().toString(36).slice(2, 10)
    const path = `stock/${stockId}/${Date.now()}-${rand}.jpg`
    const { error: upErr } = await supabase.storage.from('workshop-stock').upload(path, processed, {
      upsert: true,
      contentType: 'image/jpeg',
    })
    if (upErr) {
      errors.push(upErr.message)
    } else {
      const { data: pub } = supabase.storage.from('workshop-stock').getPublicUrl(path)
      urls.push(pub.publicUrl)
    }
  }
  return { urls, errors }
}

/* ─── intake form types ────────────────────────────────────────────── */

type CutFor = '' | 'head' | 'handle'

interface IntakeLineItem {
  positions: SuitableFor[]
  label: string
  tag: string
  isMallet: boolean
  cutFor: CutFor
  count: string
  dimensions: string
  drawer_number: string
  grade: Grade | ''
  is_cut: boolean
  notes: string
}

const INTAKE_LINES_TEMPLATE: Omit<IntakeLineItem, 'count' | 'dimensions' | 'drawer_number' | 'grade' | 'notes' | 'cutFor'>[] = [
  { positions: ['head', 'handle'], label: 'SJM / TJM blanks', tag: 'SJM/TJM', isMallet: true },
  { positions: ['head', 'handle'], label: 'SDM / TDM blanks', tag: 'SDM/TDM', isMallet: true },
  { positions: ['head', 'handle'], label: 'SCM / TCM blanks', tag: 'SCM/TCM', isMallet: true },
  { positions: ['awl_handle'],     label: 'Awl blanks',       tag: 'Awl',     isMallet: false },
  { positions: ['square_scale'],   label: 'Scale blanks',     tag: 'Scale',   isMallet: false },
]

function emptyLineItem(tpl: typeof INTAKE_LINES_TEMPLATE[number]): IntakeLineItem {
  return { ...tpl, cutFor: '', count: '0', dimensions: '', drawer_number: '', grade: '', is_cut: false, notes: '' }
}

interface AddForm {
  material_id: string
  skuPrefix: string
  sku: string
  cost_price: string
  supplier: string
  purchase_date: string
  location_notes: string
  notes: string
  mode: 'intake' | 'single'
  lines: IntakeLineItem[]
  /* single-mode fields */
  dimensions: string
  weight_grams: string
  drawer_number: string
  suitable_for: SuitableFor[]
  grade: Grade | ''
  batchCount: string
}

function emptyAddForm(materialId?: string, materialName?: string): AddForm {
  return {
    material_id: materialId || '',
    skuPrefix: materialName ? skuPrefixFromName(materialName) : '',
    sku: '',
    cost_price: '',
    supplier: '',
    purchase_date: new Date().toISOString().slice(0, 10),
    location_notes: '',
    notes: '',
    mode: 'intake',
    lines: INTAKE_LINES_TEMPLATE.map(emptyLineItem),
    dimensions: '',
    weight_grams: '',
    drawer_number: '',
    suitable_for: ['head', 'handle', 'awl_handle', 'square_scale'],
    grade: '',
    batchCount: '1',
  }
}

/* ─── main component (inner, uses useSearchParams) ─────────────────── */

function WorkshopStockInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefilterMaterialId = searchParams.get('material')

  const [loading, setLoading] = useState(true)
  const [materials, setMaterials] = useState<WoodMaterial[]>([])
  const [stock, setStock] = useState<StockPiece[]>([])

  const [statusFilter, setStatusFilter] = useState<StockStatus | 'all'>('all')
  const [speciesFilter, setSpeciesFilter] = useState<string>(prefilterMaterialId || 'all')
  const [searchQuery, setSearchQuery] = useState('')

  const [expandedSpecies, setExpandedSpecies] = useState<Set<string>>(new Set())
  const [expandedPiece, setExpandedPiece] = useState<string | null>(null)
  const [editingPiece, setEditingPiece] = useState<StockPiece | null>(null)

  const [showAddForm, setShowAddForm] = useState(!!prefilterMaterialId)
  const [addForm, setAddForm] = useState<AddForm>(emptyAddForm())
  const [addingFiles, setAddingFiles] = useState<File[]>([])
  const [saving, setSaving] = useState(false)

  const [labelSkus, setLabelSkus] = useState<Set<string>>(new Set())
  const [uploadingId, setUploadingId] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionStorage.getItem('admin_auth')) { router.push('/admin'); return }
    loadAll()
  }, [router])

  useEffect(() => {
    if (prefilterMaterialId && materials.length) {
      const mat = materials.find((m) => m.id === prefilterMaterialId)
      if (mat) {
        setAddForm(emptyAddForm(mat.id, mat.name))
        setExpandedSpecies(new Set([mat.id]))
      }
    }
  }, [prefilterMaterialId, materials])

  const loadAll = async () => {
    try {
      const [matsRes, stockRes] = await Promise.all([
        supabase.from('materials').select('id, name, color_hex, grain_image_url').eq('category', 'wood').order('name'),
        supabase.from('workshop_stock').select('*').order('created_at', { ascending: false }),
      ])
      setMaterials((matsRes.data || []) as WoodMaterial[])
      setStock((stockRes.data || []) as StockPiece[])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  /* ─── stats ──────────────────────────────────────────────────────── */

  const stats = useMemo(() => {
    const total = stock.length
    const available = stock.filter((s) => s.status === 'available').length
    const reserved = stock.filter((s) => s.status === 'reserved').length
    const inProgress = stock.filter((s) => s.status === 'in_progress').length
    const uncut = stock.filter((s) => !s.is_cut && s.status === 'available').length

    const speciesCounts = new Map<string, number>()
    for (const s of stock) {
      if (s.status === 'available') speciesCounts.set(s.material_id, (speciesCounts.get(s.material_id) || 0) + 1)
    }
    const lowStockSpecies = materials.filter((m) => (speciesCounts.get(m.id) || 0) < 2 && speciesCounts.has(m.id))

    return { total, available, reserved, inProgress, uncut, lowStockSpecies }
  }, [stock, materials])

  /* ─── filtering ──────────────────────────────────────────────────── */

  const filteredStock = useMemo(() => {
    let filtered = stock
    if (statusFilter !== 'all') filtered = filtered.filter((s) => s.status === statusFilter)
    if (speciesFilter !== 'all') filtered = filtered.filter((s) => s.material_id === speciesFilter)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matNameMap = new Map(materials.map((m) => [m.id, m.name.toLowerCase()]))
      filtered = filtered.filter((s) =>
        s.sku.toLowerCase().includes(q) ||
        (s.drawer_number && s.drawer_number.toLowerCase().includes(q)) ||
        (matNameMap.get(s.material_id) || '').includes(q) ||
        (s.notes && s.notes.toLowerCase().includes(q))
      )
    }
    return filtered
  }, [stock, statusFilter, speciesFilter, searchQuery, materials])

  const groupedBySpecies = useMemo(() => {
    const groups = new Map<string, StockPiece[]>()
    for (const s of filteredStock) {
      const arr = groups.get(s.material_id) || []
      arr.push(s)
      groups.set(s.material_id, arr)
    }
    return Array.from(groups.entries())
      .map(([matId, pieces]) => ({
        material: materials.find((m) => m.id === matId),
        materialId: matId,
        pieces: pieces.sort((a, b) => a.sku.localeCompare(b.sku, undefined, { numeric: true })),
      }))
      .filter((g) => g.material)
      .sort((a, b) => (a.material?.name || '').localeCompare(b.material?.name || ''))
  }, [filteredStock, materials])

  /* ─── add piece ──────────────────────────────────────────────────── */

  const generateSequentialSkus = async (prefix: string, count: number): Promise<string[]> => {
    const [wsRes, prodRes] = await Promise.all([
      supabase.from('workshop_stock').select('sku').like('sku', `${prefix}-%`).order('sku', { ascending: false }).limit(1),
      supabase.from('products').select('sku').like('sku', `${prefix}-%`).order('sku', { ascending: false }).limit(1),
    ])
    const parseNum = (sku: string) => { const m = sku.match(/-(\d+)$/); return m ? Number.parseInt(m[1], 10) : 0 }
    let maxNum = 0
    if (wsRes.data?.[0]?.sku) maxNum = Math.max(maxNum, parseNum(wsRes.data[0].sku as string))
    if (prodRes.data?.[0]?.sku) maxNum = Math.max(maxNum, parseNum(prodRes.data[0].sku as string))

    const skus = Array.from({ length: count }, (_, i) => `${prefix}-${String(maxNum + 1 + i).padStart(3, '0')}`)

    await supabase.from('sku_sequences').upsert({ prefix, next_number: maxNum + count + 1 }, { onConflict: 'prefix' })
    return skus
  }

  const generateSku = async () => {
    if (!addForm.skuPrefix.trim()) return
    const prefix = addForm.skuPrefix.trim().toUpperCase()
    try {
      const [sku] = await generateSequentialSkus(prefix, 1)
      setAddForm((f) => ({ ...f, sku }))
    } catch (e) {
      console.error('[workshop-stock] SKU generation error:', e)
      alert(`SKU generation failed: ${(e as Record<string, unknown>)?.message || JSON.stringify(e)}`)
    }
  }

  const savePiece = async () => {
    if (!addForm.material_id || !addForm.sku) { alert('Species and SKU are required'); return }
    setSaving(true)
    try {
      const row = {
        material_id: addForm.material_id,
        sku: addForm.sku,
        dimensions: addForm.dimensions || null,
        weight_grams: addForm.weight_grams ? Number.parseInt(addForm.weight_grams, 10) : null,
        cost_price: addForm.cost_price ? Number.parseFloat(addForm.cost_price) : null,
        supplier: addForm.supplier || null,
        purchase_date: addForm.purchase_date || null,
        drawer_number: addForm.drawer_number || null,
        location_notes: addForm.location_notes || null,
        suitable_for: addForm.suitable_for,
        grade: addForm.grade || null,
        notes: addForm.notes || null,
        images: [] as string[],
      }

      const { data: inserted, error } = await supabase.from('workshop_stock').insert([row]).select('id').single()
      if (error) throw error

      if (addingFiles.length > 0 && inserted?.id) {
        const { urls } = await uploadStockImages(inserted.id, addingFiles)
        if (urls.length > 0) {
          await supabase.from('workshop_stock').update({ images: urls }).eq('id', inserted.id)
        }
      }

      setShowAddForm(false)
      setAddForm(emptyAddForm())
      setAddingFiles([])
      await loadAll()
    } catch (e: unknown) {
      console.error('[workshop-stock] save error:', e)
      const msg = e instanceof Error ? e.message : (e as Record<string, unknown>)?.message || JSON.stringify(e)
      alert(`Failed to add: ${msg}`)
    } finally {
      setSaving(false)
    }
  }

  const saveBatch = async () => {
    if (!addForm.material_id || !addForm.skuPrefix.trim()) { alert('Select a species and set a SKU prefix'); return }
    setSaving(true)
    try {
      const count = Number.parseInt(addForm.batchCount, 10) || 1
      const skus = await generateSequentialSkus(addForm.skuPrefix.trim().toUpperCase(), count)
      const rows = skus.map((sku) => ({
        material_id: addForm.material_id,
        sku,
        dimensions: addForm.dimensions || null,
        weight_grams: addForm.weight_grams ? Number.parseInt(addForm.weight_grams, 10) : null,
        cost_price: addForm.cost_price ? Number.parseFloat(addForm.cost_price) : null,
        supplier: addForm.supplier || null,
        purchase_date: addForm.purchase_date || null,
        drawer_number: addForm.drawer_number || null,
        location_notes: addForm.location_notes || null,
        suitable_for: addForm.suitable_for,
        grade: addForm.grade || null,
        notes: addForm.notes || null,
        images: [],
      }))
      console.log('[workshop-stock] inserting batch:', rows.length, 'rows, first:', rows[0])
      const { error } = await supabase.from('workshop_stock').insert(rows)
      if (error) throw error
      setShowAddForm(false)
      setAddForm(emptyAddForm())
      await loadAll()
    } catch (e: unknown) {
      console.error('[workshop-stock] batch add error:', e)
      const msg = e instanceof Error ? e.message : (e as Record<string, unknown>)?.message || JSON.stringify(e)
      alert(`Batch add failed: ${msg}`)
    } finally {
      setSaving(false)
    }
  }

  const saveIntake = async () => {
    if (!addForm.material_id || !addForm.skuPrefix.trim()) { alert('Select a species and set a SKU prefix'); return }
    const activeLines = addForm.lines.filter((l) => Number.parseInt(l.count, 10) > 0)
    if (activeLines.length === 0) { alert('Enter a count for at least one position type'); return }
    setSaving(true)
    try {
      const totalPieces = activeLines.reduce((sum, l) => sum + (Number.parseInt(l.count, 10) || 0), 0)
      const prefix = addForm.skuPrefix.trim().toUpperCase()
      const skus = await generateSequentialSkus(prefix, totalPieces)

      let skuIdx = 0
      const rows: Record<string, unknown>[] = []
      for (const line of activeLines) {
        const cnt = Number.parseInt(line.count, 10) || 0
        for (let i = 0; i < cnt; i++) {
          rows.push({
            material_id: addForm.material_id,
            sku: skus[skuIdx++],
            dimensions: line.dimensions || null,
            cost_price: addForm.cost_price ? Number.parseFloat(addForm.cost_price) : null,
            supplier: addForm.supplier || null,
            purchase_date: addForm.purchase_date || null,
            drawer_number: line.drawer_number || null,
            location_notes: addForm.location_notes || null,
            suitable_for: line.cutFor ? [line.cutFor] : line.positions,
            grade: line.grade || null,
            is_cut: line.is_cut,
            notes: [line.cutFor ? `${line.tag} ${line.cutFor.charAt(0).toUpperCase() + line.cutFor.slice(1)}` : line.tag, addForm.notes, line.notes].filter(Boolean).join(' — ') || null,
            images: [],
          })
        }
      }

      console.log('[workshop-stock] intake insert:', rows.length, 'rows across', activeLines.length, 'types')
      const { error } = await supabase.from('workshop_stock').insert(rows)
      if (error) throw error
      setShowAddForm(false)
      setAddForm(emptyAddForm())
      await loadAll()
    } catch (e: unknown) {
      console.error('[workshop-stock] intake error:', e)
      const msg = e instanceof Error ? e.message : (e as Record<string, unknown>)?.message || JSON.stringify(e)
      alert(`Intake add failed: ${msg}`)
    } finally {
      setSaving(false)
    }
  }

  /* ─── edit / update ──────────────────────────────────────────────── */

  const updatePiece = async (piece: StockPiece) => {
    const { error } = await supabase.from('workshop_stock').update({
      dimensions: piece.dimensions,
      weight_grams: piece.weight_grams,
      cost_price: piece.cost_price,
      supplier: piece.supplier,
      purchase_date: piece.purchase_date,
      drawer_number: piece.drawer_number,
      location_notes: piece.location_notes,
      suitable_for: piece.suitable_for,
      grade: piece.grade,
      notes: piece.notes,
      allocated_notes: piece.allocated_notes,
      status: piece.status,
      images: piece.images,
    }).eq('id', piece.id)
    if (error) { alert(error.message); return }
    setEditingPiece(null)
    await loadAll()
  }

  const deletePiece = async (id: string) => {
    if (!confirm('Delete this stock piece?')) return
    const { error } = await supabase.from('workshop_stock').delete().eq('id', id)
    if (error) { alert(error.message); return }
    await loadAll()
  }

  const changeStatus = async (id: string, newStatus: StockStatus) => {
    const { error } = await supabase.from('workshop_stock').update({ status: newStatus }).eq('id', id)
    if (error) { alert(error.message); return }
    await loadAll()
  }

  const addImagesToExisting = async (pieceId: string, files: File[]) => {
    setUploadingId(pieceId)
    try {
      const piece = stock.find((s) => s.id === pieceId)
      if (!piece) return
      const { urls, errors } = await uploadStockImages(pieceId, files)
      if (errors.length) console.error('Upload errors:', errors)
      const updated = [...(piece.images || []), ...urls]
      await supabase.from('workshop_stock').update({ images: updated }).eq('id', pieceId)
      await loadAll()
    } finally {
      setUploadingId(null)
    }
  }

  const removeImage = async (pieceId: string, imageUrl: string) => {
    const piece = stock.find((s) => s.id === pieceId)
    if (!piece) return
    const updated = piece.images.filter((u) => u !== imageUrl)
    await supabase.from('workshop_stock').update({ images: updated }).eq('id', pieceId)
    await loadAll()
  }

  /* ─── toggle helpers ─────────────────────────────────────────────── */

  const toggleSpecies = useCallback((matId: string) => {
    setExpandedSpecies((prev) => {
      const next = new Set(prev)
      if (next.has(matId)) next.delete(matId); else next.add(matId)
      return next
    })
  }, [])

  const toggleLabelSku = useCallback((sku: string) => {
    setLabelSkus((prev) => {
      const next = new Set(prev)
      if (next.has(sku)) next.delete(sku); else next.add(sku)
      return next
    })
  }, [])

  const suitableToggle = (arr: SuitableFor[], val: SuitableFor) =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]

  /* ─── render ─────────────────────────────────────────────────────── */

  if (loading) return <div className="container mx-auto px-4 py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-zinc-500" /></div>

  return (
    <div className="container mx-auto px-4 py-12">
      {/* nav */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Link href="/admin/dashboard"><Button variant="outline" size="sm"><ArrowLeft className="mr-2 h-4 w-4" />Dashboard</Button></Link>
        <Link href="/admin/materials"><Button variant="outline" size="sm">Materials</Button></Link>
        <Link href="/admin/inventory"><Button variant="outline" size="sm">Inventory</Button></Link>
        <Link href="/admin/products"><Button variant="outline" size="sm">Products</Button></Link>
      </div>

      {/* title + add button */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Workshop Stock</h1>
          <p className="text-sm text-zinc-500 mt-1">Raw material register — track every physical piece</p>
        </div>
        <div className="flex gap-2">
          {labelSkus.size > 0 && (
            <Button size="sm" variant="outline" onClick={() => window.open(`/admin/workshop-stock/labels?skus=${encodeURIComponent(Array.from(labelSkus).join(','))}`, '_blank')}>
              <Printer className="mr-2 h-4 w-4" />{labelSkus.size} label{labelSkus.size !== 1 ? 's' : ''}
            </Button>
          )}
          <Button size="sm" onClick={() => { setShowAddForm(true); setAddForm(emptyAddForm()) }}>
            <Plus className="mr-2 h-4 w-4" />Add Stock
          </Button>
        </div>
      </div>

      {/* stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total Pieces', value: stats.total, color: 'text-white' },
          { label: 'Available', value: stats.available, color: 'text-emerald-400' },
          { label: 'Uncut', value: stats.uncut, color: 'text-rose-400' },
          { label: 'Reserved', value: stats.reserved, color: 'text-amber-400' },
          { label: 'In Progress', value: stats.inProgress, color: 'text-blue-400' },
        ].map((s) => (
          <Card key={s.label} className="bg-brand-dark-card border-brand-dark-border">
            <CardContent className="p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-zinc-500">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {stats.lowStockSpecies.length > 0 && (
        <div className="mb-6 rounded-lg border border-amber-700/80 bg-amber-950/50 px-4 py-3 text-sm text-amber-100 flex gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
          <div>Low stock species ({'\u003C'}2 available): {stats.lowStockSpecies.map((m) => m.name).join(', ')}</div>
        </div>
      )}

      {/* search + filters */}
      <div className="flex flex-wrap gap-3 mb-6 items-end">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
            <Input className={`pl-9 ${inputDarkClass}`} placeholder="Search SKU, species, drawer..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>
        <select className={selectDarkClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StockStatus | 'all')}>
          <option value="all">All statuses</option>
          {(Object.keys(STATUS_LABELS) as StockStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <select className={`${selectDarkClass} max-w-[200px]`} value={speciesFilter} onChange={(e) => setSpeciesFilter(e.target.value)}>
          <option value="all">All species</option>
          {materials.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

      {/* add form */}
      {showAddForm && (
        <Card className="mb-6 bg-zinc-900/80 border-zinc-700">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{addForm.mode === 'intake' ? 'Stock Intake' : 'Add Single Piece'}</CardTitle>
              <div className="flex items-center gap-3">
                <div className="flex rounded-md overflow-hidden border border-zinc-600 text-xs">
                  <button
                    className={`px-3 py-1.5 ${addForm.mode === 'intake' ? 'bg-brand-orange text-black font-semibold' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                    onClick={() => setAddForm((f) => ({ ...f, mode: 'intake' }))}
                  >Intake Sheet</button>
                  <button
                    className={`px-3 py-1.5 ${addForm.mode === 'single' ? 'bg-brand-orange text-black font-semibold' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                    onClick={() => setAddForm((f) => ({ ...f, mode: 'single' }))}
                  >Single Piece</button>
                </div>
                <button onClick={() => setShowAddForm(false)} className="text-zinc-400 hover:text-white"><X className="h-5 w-5" /></button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* shared top fields — species, prefix, supplier, date, cost, notes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-5">
              <div className="md:col-span-3">
                <label className="block text-zinc-400 mb-1">Species *</label>
                <select
                  className={`${selectDarkClass} w-full`}
                  value={addForm.material_id}
                  onChange={(e) => {
                    const mat = materials.find((m) => m.id === e.target.value)
                    setAddForm((f) => ({ ...f, material_id: e.target.value, skuPrefix: mat ? skuPrefixFromName(mat.name) : f.skuPrefix }))
                  }}
                >
                  <option value="">— Select —</option>
                  {materials.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">SKU Prefix</label>
                <Input className={inputDarkClass} value={addForm.skuPrefix} onChange={(e) => setAddForm((f) => ({ ...f, skuPrefix: e.target.value }))} />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Supplier</label>
                <Input className={inputDarkClass} value={addForm.supplier} onChange={(e) => setAddForm((f) => ({ ...f, supplier: e.target.value }))} />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Purchase date</label>
                <Input type="date" className={inputDarkClass} value={addForm.purchase_date} onChange={(e) => setAddForm((f) => ({ ...f, purchase_date: e.target.value }))} />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Cost price per piece (£)</label>
                <Input type="number" step="0.01" className={inputDarkClass} value={addForm.cost_price} onChange={(e) => setAddForm((f) => ({ ...f, cost_price: e.target.value }))} />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Location notes</label>
                <Input className={inputDarkClass} value={addForm.location_notes} onChange={(e) => setAddForm((f) => ({ ...f, location_notes: e.target.value }))} placeholder="Left side, behind the..." />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">General notes</label>
                <Input className={inputDarkClass} value={addForm.notes} onChange={(e) => setAddForm((f) => ({ ...f, notes: e.target.value }))} placeholder="From March delivery..." />
              </div>
            </div>

            {addForm.mode === 'intake' ? (
              <>
                {/* intake line items table */}
                <div className="border border-zinc-700 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-zinc-800/80 text-zinc-400 text-xs uppercase tracking-wider">
                        <th className="text-left px-3 py-2 w-[140px]">Type</th>
                        <th className="text-center px-3 py-2 w-[70px]">Qty</th>
                        <th className="text-center px-3 py-2 w-[100px]">Cut for</th>
                        <th className="text-center px-3 py-2 w-[50px]">Cut</th>
                        <th className="text-left px-3 py-2">Dimensions</th>
                        <th className="text-left px-3 py-2 w-[100px]">Drawer</th>
                        <th className="text-center px-3 py-2 w-[70px]">Grade</th>
                        <th className="text-left px-3 py-2">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {addForm.lines.map((line, idx) => {
                        const cnt = Number.parseInt(line.count, 10) || 0
                        const isGroupBreak = idx === 3
                        return (
                          <tr key={line.tag} className={`border-t ${isGroupBreak ? 'border-zinc-500' : 'border-zinc-700/50'} ${cnt > 0 ? 'bg-zinc-800/30' : ''}`}>
                            <td className="px-3 py-2 font-medium text-zinc-200 whitespace-nowrap">{line.label}</td>
                            <td className="px-2 py-2">
                              <Input
                                type="number"
                                min={0}
                                className={`${inputDarkClass} w-16 text-center ${cnt > 0 ? '!border-brand-orange/60 !text-brand-orange font-bold' : ''}`}
                                value={line.count}
                                onChange={(e) => setAddForm((f) => {
                                  const lines = [...f.lines]
                                  lines[idx] = { ...lines[idx], count: e.target.value }
                                  return { ...f, lines }
                                })}
                              />
                            </td>
                            <td className="px-2 py-2 text-center">
                              {line.isMallet ? (
                                <select
                                  className={`${selectDarkClass} w-full`}
                                  value={line.cutFor}
                                  onChange={(e) => setAddForm((f) => {
                                    const lines = [...f.lines]
                                    lines[idx] = { ...lines[idx], cutFor: e.target.value as CutFor }
                                    return { ...f, lines }
                                  })}
                                >
                                  <option value="">Either</option>
                                  <option value="head">Head</option>
                                  <option value="handle">Handle</option>
                                </select>
                              ) : (
                                <span className="text-zinc-600">—</span>
                              )}
                            </td>
                            <td className="px-2 py-2 text-center">
                              <input
                                type="checkbox"
                                className="accent-emerald-500"
                                checked={line.is_cut}
                                onChange={() => setAddForm((f) => {
                                  const lines = [...f.lines]
                                  lines[idx] = { ...lines[idx], is_cut: !lines[idx].is_cut }
                                  return { ...f, lines }
                                })}
                              />
                            </td>
                            <td className="px-2 py-2">
                              <Input
                                className={inputDarkClass}
                                placeholder="85x85x520mm"
                                value={line.dimensions}
                                onChange={(e) => setAddForm((f) => {
                                  const lines = [...f.lines]
                                  lines[idx] = { ...lines[idx], dimensions: e.target.value }
                                  return { ...f, lines }
                                })}
                              />
                            </td>
                            <td className="px-2 py-2">
                              <Input
                                className={inputDarkClass}
                                placeholder="D12"
                                value={line.drawer_number}
                                onChange={(e) => setAddForm((f) => {
                                  const lines = [...f.lines]
                                  lines[idx] = { ...lines[idx], drawer_number: e.target.value }
                                  return { ...f, lines }
                                })}
                              />
                            </td>
                            <td className="px-2 py-2">
                              <select
                                className={`${selectDarkClass} w-full`}
                                value={line.grade}
                                onChange={(e) => setAddForm((f) => {
                                  const lines = [...f.lines]
                                  lines[idx] = { ...lines[idx], grade: (e.target.value || '') as Grade | '' }
                                  return { ...f, lines }
                                })}
                              >
                                <option value="">—</option>
                                <option value="S">S</option>
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                              </select>
                            </td>
                            <td className="px-2 py-2">
                              <Input
                                className={inputDarkClass}
                                placeholder="e.g. nice figure"
                                value={line.notes}
                                onChange={(e) => setAddForm((f) => {
                                  const lines = [...f.lines]
                                  lines[idx] = { ...lines[idx], notes: e.target.value }
                                  return { ...f, lines }
                                })}
                              />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-zinc-600 bg-zinc-800/50">
                        <td className="px-3 py-2 font-semibold text-zinc-300">Total</td>
                        <td className="px-3 py-2 text-center font-bold text-brand-orange">
                          {addForm.lines.reduce((s, l) => s + (Number.parseInt(l.count, 10) || 0), 0)}
                        </td>
                        <td colSpan={6} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={saveIntake}
                    disabled={saving || !addForm.material_id || addForm.lines.every((l) => (Number.parseInt(l.count, 10) || 0) === 0)}
                  >
                    {saving ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Adding...</>
                    ) : (
                      `Add ${addForm.lines.reduce((s, l) => s + (Number.parseInt(l.count, 10) || 0), 0)} pieces`
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
                </div>
              </>
            ) : (
              <>
                {/* single piece mode */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <label className="block text-zinc-400 mb-1">SKU</label>
                    <div className="flex gap-2">
                      <Input className={`flex-1 ${inputDarkClass}`} value={addForm.sku} onChange={(e) => setAddForm((f) => ({ ...f, sku: e.target.value }))} placeholder="Auto-generate →" />
                      <Button size="sm" variant="outline" onClick={generateSku} disabled={!addForm.skuPrefix}>Gen</Button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Batch count</label>
                    <Input type="number" min={1} className={inputDarkClass} value={addForm.batchCount} onChange={(e) => setAddForm((f) => ({ ...f, batchCount: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Dimensions</label>
                    <Input className={inputDarkClass} value={addForm.dimensions} onChange={(e) => setAddForm((f) => ({ ...f, dimensions: e.target.value }))} placeholder="85x85x520mm" />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Weight (g)</label>
                    <Input type="number" className={inputDarkClass} value={addForm.weight_grams} onChange={(e) => setAddForm((f) => ({ ...f, weight_grams: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Drawer / Location</label>
                    <Input className={inputDarkClass} value={addForm.drawer_number} onChange={(e) => setAddForm((f) => ({ ...f, drawer_number: e.target.value }))} placeholder="D12, Shelf 3A" />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Grade</label>
                    <select className={`${selectDarkClass} w-full`} value={addForm.grade} onChange={(e) => setAddForm((f) => ({ ...f, grade: (e.target.value || '') as Grade | '' }))}>
                      <option value="">—</option>
                      <option value="S">S — Exhibition</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-zinc-400 mb-1">Suitable for</label>
                    <div className="flex flex-wrap gap-4">
                      {(['head', 'handle', 'awl_handle', 'square_scale'] as const).map((sf) => (
                        <label key={sf} className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                          <input type="checkbox" checked={addForm.suitable_for.includes(sf)} onChange={() => setAddForm((f) => ({ ...f, suitable_for: suitableToggle(f.suitable_for, sf) }))} className="accent-brand-orange" />
                          {{head:'Head',handle:'Handle',awl_handle:'Awl Handle',square_scale:'Square Scale'}[sf]}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-zinc-400 mb-1">Photos</label>
                    <input type="file" multiple accept="image/*,.heic,.HEIC" onChange={(e) => setAddingFiles(Array.from(e.target.files || []))} className="text-sm text-zinc-400" />
                    {addingFiles.length > 0 && <p className="text-xs text-zinc-500 mt-1">{addingFiles.length} file{addingFiles.length !== 1 ? 's' : ''} selected</p>}
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  {Number.parseInt(addForm.batchCount, 10) > 1 ? (
                    <Button onClick={saveBatch} disabled={saving || !addForm.material_id}>
                      {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Adding...</> : `Add ${addForm.batchCount} pieces`}
                    </Button>
                  ) : (
                    <Button onClick={savePiece} disabled={saving || !addForm.material_id || !addForm.sku}>
                      {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Add piece'}
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* grouped stock list */}
      {groupedBySpecies.length === 0 ? (
        <Card className="bg-brand-dark-card border-brand-dark-border">
          <CardContent className="p-8 text-center text-zinc-500">
            <Package className="h-12 w-12 mx-auto mb-3 text-zinc-600" />
            <p>No workshop stock found. Add your first pieces above.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {groupedBySpecies.map(({ material: mat, materialId, pieces }) => {
            const isOpen = expandedSpecies.has(materialId)
            const availCount = pieces.filter((p) => p.status === 'available').length
            const reservedCount = pieces.filter((p) => p.status === 'reserved').length
            return (
              <Card key={materialId} className="bg-brand-dark-card border-brand-dark-border overflow-hidden">
                <button
                  type="button"
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/50 transition-colors text-left"
                  onClick={() => toggleSpecies(materialId)}
                >
                  {isOpen ? <ChevronDown className="h-4 w-4 text-zinc-400 shrink-0" /> : <ChevronRight className="h-4 w-4 text-zinc-400 shrink-0" />}
                  <div className="w-5 h-5 rounded border shrink-0" style={{ backgroundColor: mat?.color_hex }} />
                  <span className="font-medium flex-1">{mat?.name}</span>
                  <span className="text-xs text-zinc-500">
                    {availCount} available{reservedCount > 0 ? `, ${reservedCount} reserved` : ''} — {pieces.length} total
                  </span>
                  <Button size="sm" variant="outline" className="ml-2 h-7 text-xs"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowAddForm(true)
                      setAddForm(emptyAddForm(materialId, mat?.name))
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />Add
                  </Button>
                </button>
                {isOpen && (
                  <div className="border-t border-zinc-800">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-zinc-800 text-zinc-400">
                            <th className="p-2 w-8"><input type="checkbox" className="accent-brand-orange" onChange={(e) => {
                              const skuSet = new Set(labelSkus)
                              for (const p of pieces) { if (e.target.checked) skuSet.add(p.sku); else skuSet.delete(p.sku) }
                              setLabelSkus(skuSet)
                            }} /></th>
                            <th className="p-2 text-left">SKU</th>
                            <th className="p-2 text-left">Photo</th>
                            <th className="p-2 text-left">Dimensions</th>
                            <th className="p-2 text-left">Drawer</th>
                            <th className="p-2 text-left">Suitable</th>
                            <th className="p-2 text-center">Grade</th>
                            <th className="p-2 text-center">Cut</th>
                            <th className="p-2 text-center">Status</th>
                            <th className="p-2 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pieces.map((piece) => (
                            <Fragment key={piece.id}>
                              <tr
                                className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 cursor-pointer ${expandedPiece === piece.id ? 'bg-zinc-800/40' : ''}`}
                                onClick={() => setExpandedPiece(expandedPiece === piece.id ? null : piece.id)}
                              >
                                <td className="p-2" onClick={(e) => e.stopPropagation()}>
                                  <input type="checkbox" className="accent-brand-orange" checked={labelSkus.has(piece.sku)} onChange={() => toggleLabelSku(piece.sku)} />
                                </td>
                                <td className="p-2 font-mono font-medium text-brand-orange">{piece.sku}</td>
                                <td className="p-2">
                                  {piece.images?.[0] ? (
                                    <img src={piece.images[0]} alt="" className="w-10 h-10 rounded object-cover border border-zinc-700" />
                                  ) : (
                                    <div className="w-10 h-10 rounded border border-dashed border-zinc-700 flex items-center justify-center text-zinc-600">—</div>
                                  )}
                                </td>
                                <td className="p-2 text-zinc-300">{piece.dimensions || '—'}</td>
                                <td className="p-2 text-zinc-300">{piece.drawer_number || '—'}</td>
                                <td className="p-2 text-zinc-400 whitespace-nowrap">{suitableDisplay(piece)}</td>
                                <td className="p-2 text-center">
                                  {piece.grade ? <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${piece.grade === 'S' ? 'bg-brand-orange/20 text-brand-orange' : 'bg-zinc-700 text-zinc-300'}`}>{piece.grade}</span> : '—'}
                                </td>
                                <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    className="accent-emerald-500"
                                    checked={piece.is_cut}
                                    onChange={async () => {
                                      const newVal = !piece.is_cut
                                      await supabase.from('workshop_stock').update({ is_cut: newVal }).eq('id', piece.id)
                                      setStock((prev) => prev.map((s) => s.id === piece.id ? { ...s, is_cut: newVal } : s))
                                    }}
                                  />
                                </td>
                                <td className="p-2 text-center">
                                  <span className={`inline-block px-2 py-0.5 rounded border text-[10px] font-medium ${STATUS_COLORS[piece.status]}`}>
                                    {STATUS_LABELS[piece.status]}
                                  </span>
                                </td>
                                <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex gap-1 justify-center">
                                    <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => setEditingPiece({ ...piece })}>
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button size="sm" variant="destructive" className="h-7 w-7 p-0" onClick={() => deletePiece(piece.id)}>
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                              {/* expanded detail */}
                              {expandedPiece === piece.id && (
                                <tr>
                                  <td colSpan={10} className="p-4 bg-zinc-900/80 border-b border-zinc-800">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                      <div className="space-y-3">
                                        <div>
                                          <span className="text-zinc-500">Cost price:</span>{' '}
                                          <span className="text-zinc-200">{piece.cost_price != null ? `£${Number(piece.cost_price).toFixed(2)}` : '—'}</span>
                                        </div>
                                        <div>
                                          <span className="text-zinc-500">Supplier:</span>{' '}
                                          <span className="text-zinc-200">{piece.supplier || '—'}</span>
                                        </div>
                                        <div>
                                          <span className="text-zinc-500">Purchase date:</span>{' '}
                                          <span className="text-zinc-200">{piece.purchase_date || '—'}</span>
                                        </div>
                                        <div>
                                          <span className="text-zinc-500">Weight:</span>{' '}
                                          <span className="text-zinc-200">{piece.weight_grams != null ? `${piece.weight_grams}g` : '—'}</span>
                                        </div>
                                        <div>
                                          <span className="text-zinc-500">Location:</span>{' '}
                                          <span className="text-zinc-200">{[piece.drawer_number, piece.location_notes].filter(Boolean).join(' — ') || '—'}</span>
                                        </div>
                                        {piece.allocated_notes && (
                                          <div>
                                            <span className="text-zinc-500">Allocation:</span>{' '}
                                            <span className="text-zinc-200">{piece.allocated_notes}</span>
                                          </div>
                                        )}
                                        {piece.notes && (
                                          <div>
                                            <span className="text-zinc-500">Notes:</span>{' '}
                                            <span className="text-zinc-200">{piece.notes}</span>
                                          </div>
                                        )}
                                        <div className="flex gap-2 pt-2">
                                          <select
                                            className={selectDarkClass}
                                            value={piece.status}
                                            onChange={(e) => changeStatus(piece.id, e.target.value as StockStatus)}
                                          >
                                            {(Object.keys(STATUS_LABELS) as StockStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                                          </select>
                                        </div>
                                      </div>
                                      <div>
                                        <p className="text-zinc-500 mb-2">Images</p>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                          {(piece.images || []).map((url, i) => (
                                            <div key={i} className="relative group">
                                              <img src={url} alt="" className="w-20 h-20 rounded object-cover border border-zinc-700" />
                                              <button
                                                type="button"
                                                className="absolute -top-1.5 -right-1.5 bg-red-600 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => removeImage(piece.id, url)}
                                              >
                                                <X className="h-3 w-3 text-white" />
                                              </button>
                                            </div>
                                          ))}
                                          <label className="w-20 h-20 rounded border border-dashed border-zinc-600 flex items-center justify-center cursor-pointer hover:bg-zinc-800">
                                            {uploadingId === piece.id ? <Loader2 className="h-5 w-5 animate-spin text-zinc-500" /> : <Upload className="h-5 w-5 text-zinc-500" />}
                                            <input type="file" multiple accept="image/*,.heic,.HEIC" className="hidden" onChange={(e) => { if (e.target.files?.length) addImagesToExisting(piece.id, Array.from(e.target.files)) }} />
                                          </label>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* edit modal */}
      {editingPiece && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setEditingPiece(null)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit {editingPiece.sku}</h3>
              <button onClick={() => setEditingPiece(null)} className="text-zinc-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-zinc-400 mb-1">Dimensions</label>
                <Input className={inputDarkClass} value={editingPiece.dimensions ?? ''} onChange={(e) => setEditingPiece({ ...editingPiece, dimensions: e.target.value || null })} />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Weight (g)</label>
                <Input type="number" className={inputDarkClass} value={editingPiece.weight_grams ?? ''} onChange={(e) => setEditingPiece({ ...editingPiece, weight_grams: e.target.value ? Number.parseInt(e.target.value, 10) : null })} />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Cost price (£)</label>
                <Input type="number" step="0.01" className={inputDarkClass} value={editingPiece.cost_price ?? ''} onChange={(e) => setEditingPiece({ ...editingPiece, cost_price: e.target.value ? Number.parseFloat(e.target.value) : null })} />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Supplier</label>
                <Input className={inputDarkClass} value={editingPiece.supplier ?? ''} onChange={(e) => setEditingPiece({ ...editingPiece, supplier: e.target.value || null })} />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Purchase date</label>
                <Input type="date" className={inputDarkClass} value={editingPiece.purchase_date ?? ''} onChange={(e) => setEditingPiece({ ...editingPiece, purchase_date: e.target.value || null })} />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Drawer / Location</label>
                <Input className={inputDarkClass} value={editingPiece.drawer_number ?? ''} onChange={(e) => setEditingPiece({ ...editingPiece, drawer_number: e.target.value || null })} />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Location notes</label>
                <Input className={inputDarkClass} value={editingPiece.location_notes ?? ''} onChange={(e) => setEditingPiece({ ...editingPiece, location_notes: e.target.value || null })} />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Grade</label>
                <select className={`${selectDarkClass} w-full`} value={editingPiece.grade ?? ''} onChange={(e) => setEditingPiece({ ...editingPiece, grade: (e.target.value || null) as Grade | null })}>
                  <option value="">—</option>
                  <option value="S">S — Exhibition</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Suitable for</label>
                <div className="flex flex-wrap gap-3">
                  {(['head', 'handle', 'awl_handle', 'square_scale'] as const).map((sf) => (
                    <label key={sf} className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                      <input type="checkbox" checked={editingPiece.suitable_for.includes(sf)} onChange={() => setEditingPiece({ ...editingPiece, suitable_for: suitableToggle(editingPiece.suitable_for, sf) })} className="accent-brand-orange" />
                      {{head:'Head',handle:'Handle',awl_handle:'Awl',square_scale:'Scale'}[sf]}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Status</label>
                <select className={`${selectDarkClass} w-full`} value={editingPiece.status} onChange={(e) => setEditingPiece({ ...editingPiece, status: e.target.value as StockStatus })}>
                  {(Object.keys(STATUS_LABELS) as StockStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Allocation notes</label>
                <Input className={inputDarkClass} value={editingPiece.allocated_notes ?? ''} onChange={(e) => setEditingPiece({ ...editingPiece, allocated_notes: e.target.value || null })} />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Notes</label>
                <textarea className={textareaDarkClass} rows={3} value={editingPiece.notes ?? ''} onChange={(e) => setEditingPiece({ ...editingPiece, notes: e.target.value || null })} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={() => updatePiece(editingPiece)}>Save</Button>
              <Button variant="outline" onClick={() => setEditingPiece(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function WorkshopStockPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-zinc-500" /></div>}>
      <WorkshopStockInner />
    </Suspense>
  )
}
