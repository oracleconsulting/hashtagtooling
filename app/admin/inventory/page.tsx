'use client'

import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { Loader2, Plus, Trash2, Printer, Package, X } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { compressImage } from '@/lib/image-utils'

type WoodTab = 'all' | 'slab' | 'offcut' | 'pen_blank' | 'sample_pack' | 'adopt' | 'other'

interface ProductRow {
  id: string
  name: string
  description: string | null
  price: number
  category: string
  subcategory: string | null
  image_url: string | null
  stock_status: string
  parent_product_id: string | null
  sku: string | null
  dimensions: string | null
  cost_price: number | null
  material_species: string | null
  piece_notes: string | null
  sku_label_printed: boolean | null
  material_id?: string | null
  material_ids?: string[] | null
  metadata?: Record<string, unknown> | null
  /** From `materials(...)` embed when loading parent listings */
  materials?: { grain_image_url: string | null; color_hex: string | null; name: string } | null
}

interface WoodMaterialOption {
  id: string
  name: string
  color_hex: string
  grain_image_url?: string | null
}

function childPieceThumb(k: ProductRow): { src: string | null; extraCount: number } {
  const meta = k.metadata as { images?: string[] } | null | undefined
  const imgs = meta?.images
  if (imgs && imgs.length > 0) {
    return { src: imgs[0], extraCount: Math.max(0, imgs.length - 1) }
  }
  return { src: k.image_url, extraCount: 0 }
}

function revokeObjectUrls(urls: string[]) {
  urls.forEach((u) => {
    try {
      URL.revokeObjectURL(u)
    } catch {
      /* ignore */
    }
  })
}

const TAB_LABELS: { id: WoodTab; label: string }[] = [
  { id: 'all', label: 'All stock' },
  { id: 'slab', label: 'Timber / slabs' },
  { id: 'offcut', label: 'Offcuts' },
  { id: 'pen_blank', label: 'Pen blanks' },
  { id: 'sample_pack', label: 'Sample packs' },
  { id: 'adopt', label: 'Adopt' },
  { id: 'other', label: 'Other' },
]

const KNOWN_SUBS = ['slab', 'blank', 'offcut', 'pen_blank', 'sample_pack', 'adopt', 'other']

function tabMatchesParent(tab: WoodTab, sub: string | null): boolean {
  if (tab === 'all') return true
  if (tab === 'other') return !sub || !KNOWN_SUBS.includes(sub)
  if (tab === 'slab') return sub === 'slab' || sub === 'blank'
  return sub === tab
}

function isMultiSpeciesSubcategory(sub: string): boolean {
  return sub === 'offcut' || sub === 'pen_blank' || sub === 'sample_pack'
}

function isSingleSpeciesRequired(sub: string): boolean {
  return sub === 'blank' || sub === 'slab' || sub === 'adopt'
}

export default function AdminInventoryPage() {
  const router = useRouter()
  const speciesMenuRef = useRef<HTMLDivElement>(null)

  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<WoodTab>('all')
  const [parents, setParents] = useState<ProductRow[]>([])
  const [childrenByParent, setChildrenByParent] = useState<Record<string, ProductRow[]>>({})
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const [woodMaterials, setWoodMaterials] = useState<WoodMaterialOption[]>([])
  const [basePricesForSeed, setBasePricesForSeed] = useState<{ id: string; product_type: string }[]>([])

  const [showAddParent, setShowAddParent] = useState(false)
  const [parentForm, setParentForm] = useState({
    name: '',
    subcategory: 'offcut',
    description: '',
    material_species: '',
    material_id: null as string | null,
    material_ids: [] as string[],
    speciesQuery: '',
    speciesMenuOpen: false,
    showAddSpeciesForm: false,
    newSpeciesName: '',
    newSpeciesColor: '#6B4423',
  })
  const [parentImageFile, setParentImageFile] = useState<File | null>(null)
  const [savingParent, setSavingParent] = useState(false)
  const [savingNewSpecies, setSavingNewSpecies] = useState(false)

  type ChildFormFields = {
    open: boolean
    prefix: string
    sku: string
    dimensions: string
    price: string
    cost_price: string
    notes: string
    files: File[]
    previewUrls: string[]
    saving: boolean
  }

  const [childForms, setChildForms] = useState<Record<string, ChildFormFields>>({})

  const [selectedSkus, setSelectedSkus] = useState<Set<string>>(new Set())

  const resetParentForm = useCallback(() => {
    setParentForm({
      name: '',
      subcategory: 'offcut',
      description: '',
      material_species: '',
      material_id: null,
      material_ids: [],
      speciesQuery: '',
      speciesMenuOpen: false,
      showAddSpeciesForm: false,
      newSpeciesName: '',
      newSpeciesColor: '#6B4423',
    })
    setParentImageFile(null)
  }, [])

  const loadWoodMaterials = useCallback(async () => {
    const [{ data: mats, error: e1 }, { data: bp, error: e2 }] = await Promise.all([
      supabase.from('materials').select('id, name, color_hex, grain_image_url').eq('category', 'wood').order('name'),
      supabase.from('base_prices').select('id, product_type'),
    ])
    if (!e1 && mats) setWoodMaterials(mats as WoodMaterialOption[])
    if (!e2 && bp) setBasePricesForSeed(bp)
  }, [])

  useEffect(() => {
    const ok = sessionStorage.getItem('admin_auth')
    if (!ok) {
      router.push('/admin')
      return
    }
    loadWoodMaterials()
    load()
  }, [router, loadWoodMaterials])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!speciesMenuRef.current?.contains(e.target as Node)) {
        setParentForm((p) => ({ ...p, speciesMenuOpen: false }))
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const { data: woodParents, error: e1 } = await supabase
        .from('products')
        .select(
          `
          *,
          materials (
            grain_image_url,
            color_hex,
            name
          )
        `
        )
        .eq('category', 'wood')
        .is('parent_product_id', null)
        .order('name')

      if (e1) throw e1

      const { data: kids, error: e2 } = await supabase.from('products').select('*').not('parent_product_id', 'is', null).order('sku')

      if (e2) throw e2

      const byParent: Record<string, ProductRow[]> = {}
      for (const k of (kids || []) as ProductRow[]) {
        const pid = k.parent_product_id as string
        if (!byParent[pid]) byParent[pid] = []
        byParent[pid].push(k)
      }

      setParents((woodParents || []) as ProductRow[])
      setChildrenByParent(byParent)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filteredMaterials = useMemo(() => {
    const q = parentForm.speciesQuery.trim().toLowerCase()
    if (!q) return woodMaterials
    return woodMaterials.filter((m) => m.name.toLowerCase().includes(q))
  }, [woodMaterials, parentForm.speciesQuery])

  const multiMode = isMultiSpeciesSubcategory(parentForm.subcategory)

  const seedStylePricingForNewWood = async (materialId: string) => {
    const mallet = basePricesForSeed.filter((b) => b.product_type === 'mallet')
    const awl = basePricesForSeed.filter((b) => b.product_type === 'awl')
    const square = basePricesForSeed.filter((b) => b.product_type === 'square')
    const rows: { material_id: string; base_price_id: string; position: string; premium: number }[] = []
    for (const bp of mallet) {
      rows.push(
        { material_id: materialId, base_price_id: bp.id, position: 'head', premium: 0 },
        { material_id: materialId, base_price_id: bp.id, position: 'handle', premium: 0 }
      )
    }
    for (const bp of awl) {
      rows.push({ material_id: materialId, base_price_id: bp.id, position: 'awl_handle', premium: 0 })
    }
    for (const bp of square) {
      rows.push({ material_id: materialId, base_price_id: bp.id, position: 'square_scale', premium: 0 })
    }
    if (rows.length === 0) return
    const { error } = await supabase.from('material_style_pricing').insert(rows)
    if (error) console.error('Seed style pricing:', error)
  }

  const createAndSelectSpecies = async () => {
    const name = parentForm.newSpeciesName.trim()
    if (!name) {
      alert('Enter a species name')
      return
    }
    setSavingNewSpecies(true)
    try {
      const { data: inserted, error } = await supabase
        .from('materials')
        .insert({
          name,
          category: 'wood',
          color_hex: parentForm.newSpeciesColor,
          mallet_head_premium: 0,
          mallet_handle_premium: 0,
          awl_handle_premium: 0,
          available: true,
          available_mallet_head: true,
          available_mallet_handle: true,
          available_awl_handle: true,
          available_square_scale: true,
        })
        .select('id, name, color_hex')
        .single()

      if (error) throw error
      if (!inserted) throw new Error('No row returned')

      await seedStylePricingForNewWood(inserted.id)

      const opt: WoodMaterialOption = {
        id: inserted.id,
        name: inserted.name,
        color_hex: inserted.color_hex,
      }
      setWoodMaterials((prev) => [...prev, opt].sort((a, b) => a.name.localeCompare(b.name)))

      const sub = parentForm.subcategory
      const isMulti = sub === 'offcut' || sub === 'pen_blank' || sub === 'sample_pack'

      if (isMulti) {
        setParentForm((p) => {
          const nextIds = p.material_ids.includes(opt.id) ? p.material_ids : [...p.material_ids, opt.id]
          const names = nextIds.map((id) => (id === opt.id ? opt.name : woodMaterials.find((w) => w.id === id)?.name)).filter(Boolean) as string[]
          return {
            ...p,
            material_ids: nextIds,
            material_species: names.join(', '),
            showAddSpeciesForm: false,
            newSpeciesName: '',
            speciesQuery: '',
          }
        })
      } else {
        setParentForm((p) => ({
          ...p,
          material_id: opt.id,
          material_species: opt.name,
          name: p.name.trim() ? p.name : opt.name,
          showAddSpeciesForm: false,
          newSpeciesName: '',
          speciesMenuOpen: false,
          speciesQuery: opt.name,
        }))
      }
    } catch (e: unknown) {
      console.error(e)
      alert(e instanceof Error ? e.message : 'Failed to create species')
    } finally {
      setSavingNewSpecies(false)
    }
  }

  const selectSingleMaterial = (m: WoodMaterialOption) => {
    setParentForm((p) => ({
      ...p,
      material_id: m.id,
      material_species: m.name,
      name: p.name.trim() ? p.name : m.name,
      speciesQuery: m.name,
      speciesMenuOpen: false,
    }))
  }

  const toggleMultiMaterial = (m: WoodMaterialOption) => {
    setParentForm((p) => {
      const has = p.material_ids.includes(m.id)
      const nextIds = has ? p.material_ids.filter((id) => id !== m.id) : [...p.material_ids, m.id]
      const names = nextIds
        .map((id) => woodMaterials.find((w) => w.id === id)?.name)
        .filter(Boolean) as string[]
      return {
        ...p,
        material_ids: nextIds,
        material_species: names.join(', '),
        speciesQuery: '',
        speciesMenuOpen: false,
      }
    })
  }

  const removeMultiChip = (id: string) => {
    setParentForm((p) => {
      const nextIds = p.material_ids.filter((x) => x !== id)
      const names = nextIds
        .map((mid) => woodMaterials.find((w) => w.id === mid)?.name)
        .filter(Boolean) as string[]
      return { ...p, material_ids: nextIds, material_species: names.join(', ') }
    })
  }

  const filteredParents = parents.filter((p) => tabMatchesParent(tab, p.subcategory))

  const openChildForm = (parent: ProductRow) => {
    const prefix = (parent.material_species || parent.name)
      .replace(/[^a-zA-Z]/g, '')
      .slice(0, 4)
      .toUpperCase() || 'XX'
    setChildForms((prev) => {
      const old = prev[parent.id]
      if (old?.previewUrls?.length) revokeObjectUrls(old.previewUrls)
      return {
        ...prev,
        [parent.id]: {
          open: true,
          prefix: prefix.slice(0, 4),
          sku: '',
          dimensions: '',
          price: '',
          cost_price: '',
          notes: '',
          files: [],
          previewUrls: [],
          saving: false,
        },
      }
    })
  }

  const handlePieceImages = (parentId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || [])
    e.target.value = ''
    setChildForms((prev) => {
      const cf = prev[parentId]
      if (!cf) return prev
      revokeObjectUrls(cf.previewUrls)
      const merged = [...cf.files, ...picked].slice(0, 8)
      return {
        ...prev,
        [parentId]: {
          ...cf,
          files: merged,
          previewUrls: merged.map((f) => URL.createObjectURL(f)),
        },
      }
    })
  }

  const removePieceImage = (parentId: string, index: number) => {
    setChildForms((prev) => {
      const cf = prev[parentId]
      if (!cf) return prev
      revokeObjectUrls(cf.previewUrls)
      const merged = cf.files.filter((_, i) => i !== index)
      return {
        ...prev,
        [parentId]: {
          ...cf,
          files: merged,
          previewUrls: merged.map((f) => URL.createObjectURL(f)),
        },
      }
    })
  }

  /** SKU: Postgres `generate_sku` uses `sku_sequences` — one counter per prefix (e.g. ARGE-001 → ARGE-002). */
  const generateSku = async (parentId: string) => {
    const f = childForms[parentId]
    if (!f?.prefix.trim()) return
    const { data, error } = await supabase.rpc('generate_sku', { prefix_code: f.prefix.trim().toUpperCase() })
    if (error) {
      console.error(error)
      alert(error.message)
      return
    }
    setChildForms((prev) => ({
      ...prev,
      [parentId]: { ...prev[parentId], sku: (data as string) || '' },
    }))
  }

  const saveChild = async (parent: ProductRow) => {
    const f = childForms[parent.id]
    if (!f) return
    if (!f.sku.trim()) {
      alert('Generate or enter a SKU')
      return
    }
    const price = parseFloat(f.price)
    if (!Number.isFinite(price) || price < 0) {
      alert('Enter a valid sale price')
      return
    }

    setChildForms((prev) => ({ ...prev, [parent.id]: { ...f, saving: true } }))

    try {
      const parentGrain = parent.materials?.grain_image_url
      let initialImageUrl =
        parent.image_url || parentGrain || 'https://placehold.co/600x400/666/white?text=Wood'

      const cost = parseFloat(f.cost_price)
      const mids = parent.material_ids && parent.material_ids.length > 0 ? parent.material_ids : []
      const baseMeta =
        parent.metadata && typeof parent.metadata === 'object' && !Array.isArray(parent.metadata)
          ? { ...parent.metadata }
          : {}

      const { data: inserted, error: insErr } = await supabase
        .from('products')
        .insert({
          name: `${parent.name} — ${f.sku}`,
          description: parent.description || '',
          price,
          category: parent.category,
          subcategory: parent.subcategory,
          image_url: initialImageUrl,
          stock_status: 'in_stock',
          parent_product_id: parent.id,
          sku: f.sku.trim(),
          dimensions: f.dimensions.trim() || null,
          cost_price: Number.isFinite(cost) ? cost : null,
          material_species: parent.material_species || parent.name,
          material_id: parent.material_id ?? null,
          material_ids: mids,
          piece_notes: f.notes.trim() || null,
          sku_label_printed: false,
          metadata: baseMeta,
        })
        .select('id')
        .single()

      if (insErr) throw insErr
      const newId = inserted?.id as string
      if (!newId) throw new Error('No product id returned')

      const uploadedUrls: string[] = []
      for (const rawFile of f.files) {
        let processed = rawFile
        if (rawFile.type.startsWith('image/')) {
          try {
            processed = await compressImage(rawFile)
          } catch {
            /* use original */
          }
        }
        const rand = Math.random().toString(36).slice(2, 10)
        const path = `inventory/${newId}/${Date.now()}-${rand}.jpg`
        const { error: upErr } = await supabase.storage.from('products').upload(path, processed, {
          upsert: true,
          contentType: processed.type || 'image/jpeg',
        })
        if (!upErr) {
          const { data: pub } = supabase.storage.from('products').getPublicUrl(path)
          uploadedUrls.push(pub.publicUrl)
        }
      }

      if (uploadedUrls.length > 0) {
        const { error: upErr } = await supabase
          .from('products')
          .update({
            image_url: uploadedUrls[0],
            metadata: { ...baseMeta, images: uploadedUrls },
          })
          .eq('id', newId)
        if (upErr) throw upErr
      }

      revokeObjectUrls(f.previewUrls)

      setChildForms((prev) => ({
        ...prev,
        [parent.id]: {
          ...f,
          open: false,
          saving: false,
          sku: '',
          dimensions: '',
          price: '',
          cost_price: '',
          notes: '',
          files: [],
          previewUrls: [],
        },
      }))
      load()
    } catch (e: unknown) {
      console.error(e)
      alert(e instanceof Error ? e.message : 'Failed to save piece')
      setChildForms((prev) => ({ ...prev, [parent.id]: { ...f, saving: false } }))
    }
  }

  const saveParent = async () => {
    if (!parentForm.name.trim()) return

    if (multiMode) {
      if (parentForm.material_ids.length === 0) {
        alert('Select at least one species for this listing type')
        return
      }
    } else if (isSingleSpeciesRequired(parentForm.subcategory)) {
      if (!parentForm.material_id) {
        alert('Select a species from the materials list')
        return
      }
    }

    setSavingParent(true)
    try {
      let imageUrl = 'https://placehold.co/600x400/666/white?text=Wood+listing'
      if (parentImageFile) {
        let file = parentImageFile
        if (file.type.startsWith('image/')) {
          try {
            file = await compressImage(file)
          } catch {
            /* */
          }
        }
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const path = `products/parent-${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage.from('products').upload(path, file)
        if (upErr) throw upErr
        const { data: pub } = supabase.storage.from('products').getPublicUrl(path)
        imageUrl = pub.publicUrl
      } else if (!multiMode && parentForm.material_id) {
        const m = woodMaterials.find((w) => w.id === parentForm.material_id)
        if (m?.grain_image_url) imageUrl = m.grain_image_url
      } else if (multiMode && parentForm.material_ids.length > 0) {
        for (const mid of parentForm.material_ids) {
          const m = woodMaterials.find((w) => w.id === mid)
          if (m?.grain_image_url) {
            imageUrl = m.grain_image_url
            break
          }
        }
      }

      const speciesLabel =
        parentForm.material_species.trim() ||
        (multiMode
          ? parentForm.material_ids.map((id) => woodMaterials.find((m) => m.id === id)?.name).filter(Boolean).join(', ')
          : parentForm.name.trim())

      const { error } = await supabase.from('products').insert({
        name: parentForm.name.trim(),
        description: parentForm.description.trim() || ' ',
        price: 0,
        category: 'wood',
        subcategory: parentForm.subcategory || null,
        image_url: imageUrl,
        stock_status: 'in_stock',
        parent_product_id: null,
        material_species: speciesLabel || parentForm.name.trim(),
        material_id: multiMode ? null : parentForm.material_id,
        material_ids: multiMode ? parentForm.material_ids : [],
        metadata: { species: speciesLabel },
      })

      if (error) throw error
      setShowAddParent(false)
      resetParentForm()
      load()
    } catch (e) {
      console.error(e)
      alert('Failed to create listing')
    } finally {
      setSavingParent(false)
    }
  }

  const updateChildField = async (id: string, patch: Partial<ProductRow>) => {
    const { error } = await supabase.from('products').update(patch).eq('id', id)
    if (error) {
      alert(error.message)
      return
    }
    load()
  }

  const deleteChild = async (id: string) => {
    if (!confirm('Delete this piece?')) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) alert(error.message)
    else load()
  }

  const toggleLabelPrinted = async (id: string, current: boolean | null) => {
    await updateChildField(id, { sku_label_printed: !current })
  }

  const printLabels = () => {
    const skus = [...selectedSkus]
    if (skus.length === 0) {
      alert('Select pieces with checkboxes first')
      return
    }
    window.open(`/admin/inventory/labels?skus=${encodeURIComponent(skus.join(','))}`, '_blank')
  }

  const noSpeciesMatch =
    parentForm.speciesQuery.trim().length > 0 &&
    filteredMaterials.length === 0 &&
    !parentForm.showAddSpeciesForm

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="flex flex-wrap justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-brand-orange">Inventory</h1>
          <p className="text-zinc-400 text-sm mt-1">Wood listings: parent species + individual pieces with SKUs</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/dashboard">
            <Button variant="outline" size="sm">
              Dashboard
            </Button>
          </Link>
          <Link href="/admin/products">
            <Button variant="outline" size="sm">
              Products
            </Button>
          </Link>
          <Button size="sm" onClick={printLabels}>
            <Printer className="mr-2 h-4 w-4" />
            Print labels
          </Button>
          <Button
            size="sm"
            onClick={() => {
              resetParentForm()
              setShowAddParent(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add parent listing
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {TAB_LABELS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded text-sm font-medium ${
              tab === t.id ? 'bg-brand-orange text-brand-dark' : 'border border-brand-dark-border text-zinc-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {showAddParent && (
        <Card className="mb-8 bg-brand-dark-card border-brand-dark-border">
          <CardHeader>
            <CardTitle className="text-white">New parent listing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Listing name</label>
              <Input
                placeholder={multiMode ? 'e.g. Mixed Exotic Pen Blanks — 10 Pack' : 'e.g. Verawood — Figured'}
                value={parentForm.name}
                onChange={(e) => setParentForm({ ...parentForm, name: e.target.value })}
                className="bg-brand-dark border-brand-dark-border text-white"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-500 block mb-1">Subcategory</label>
              <select
                className="w-full h-10 rounded-md border border-brand-dark-border bg-brand-dark text-white px-3"
                value={parentForm.subcategory}
                onChange={(e) =>
                  setParentForm((p) => ({
                    ...p,
                    subcategory: e.target.value,
                    material_id: null,
                    material_ids: [],
                    material_species: '',
                    speciesQuery: '',
                  }))
                }
              >
                <option value="blank">Timber / general blank</option>
                <option value="slab">Slab / board</option>
                <option value="offcut">Offcuts</option>
                <option value="pen_blank">Pen blanks</option>
                <option value="sample_pack">Sample pack</option>
                <option value="adopt">Adopt a blank</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div ref={speciesMenuRef} className="relative space-y-2">
              <label className="text-xs text-zinc-500 block mb-1">
                {multiMode ? 'Species (multi-select)' : 'Species (materials database)'}
              </label>

              {multiMode && parentForm.material_ids.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {parentForm.material_ids.map((id) => {
                    const m = woodMaterials.find((w) => w.id === id)
                    if (!m) return null
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full border border-brand-dark-border bg-brand-dark text-xs text-white"
                      >
                        <span className="w-4 h-4 rounded-full border border-zinc-600 shrink-0" style={{ backgroundColor: m.color_hex }} />
                        {m.name}
                        <button type="button" className="p-0.5 hover:text-brand-orange" onClick={() => removeMultiChip(id)} aria-label={`Remove ${m.name}`}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )
                  })}
                </div>
              )}

              <Input
                placeholder="Type to search species…"
                value={parentForm.speciesQuery}
                onChange={(e) => setParentForm((p) => ({ ...p, speciesQuery: e.target.value, speciesMenuOpen: true }))}
                onFocus={() => setParentForm((p) => ({ ...p, speciesMenuOpen: true }))}
                className="bg-brand-dark border-brand-dark-border text-white"
                autoComplete="off"
              />

              {parentForm.speciesMenuOpen && (
                <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-md border border-brand-dark-border bg-zinc-900 shadow-lg">
                  {filteredMaterials.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm text-white hover:bg-brand-orange/20 flex items-center gap-2"
                      onClick={() => (multiMode ? toggleMultiMaterial(m) : selectSingleMaterial(m))}
                    >
                      <span className="w-5 h-5 rounded-full border border-zinc-600 shrink-0" style={{ backgroundColor: m.color_hex }} />
                      {m.name}
                      {multiMode && parentForm.material_ids.includes(m.id) ? ' ✓' : ''}
                    </button>
                  ))}
                  {filteredMaterials.length === 0 && (
                    <p className="px-3 py-2 text-xs text-zinc-500">No species match. Add new below.</p>
                  )}
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm text-brand-orange border-t border-brand-dark-border hover:bg-brand-orange/10"
                    onClick={() => setParentForm((p) => ({ ...p, showAddSpeciesForm: true, speciesMenuOpen: false }))}
                  >
                    + Add new species…
                  </button>
                </div>
              )}

              {(parentForm.showAddSpeciesForm || noSpeciesMatch) && (
                <div className="p-3 rounded border border-brand-orange/40 bg-brand-dark space-y-2">
                  <p className="text-xs text-zinc-400">New wood species</p>
                  <Input
                    placeholder="Species name"
                    value={parentForm.newSpeciesName}
                    onChange={(e) => setParentForm((p) => ({ ...p, newSpeciesName: e.target.value }))}
                    className="bg-zinc-900 border-brand-dark-border text-white"
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-zinc-500">Colour</label>
                    <input
                      type="color"
                      value={parentForm.newSpeciesColor}
                      onChange={(e) => setParentForm((p) => ({ ...p, newSpeciesColor: e.target.value }))}
                      className="h-9 w-14 rounded border border-brand-dark-border bg-transparent cursor-pointer"
                    />
                  </div>
                  <Button type="button" size="sm" disabled={savingNewSpecies} onClick={createAndSelectSpecies}>
                    {savingNewSpecies ? 'Creating…' : 'Create & select'}
                  </Button>
                </div>
              )}

              {!multiMode && parentForm.material_id && (
                <p className="text-xs text-zinc-500">
                  Linked: {woodMaterials.find((w) => w.id === parentForm.material_id)?.name || parentForm.material_species}
                </p>
              )}
            </div>

            <Textarea
              placeholder="Public description"
              value={parentForm.description}
              onChange={(e) => setParentForm({ ...parentForm, description: e.target.value })}
              className="bg-brand-dark border-brand-dark-border text-white"
              rows={3}
            />
            <input type="file" accept="image/*" className="text-sm text-zinc-400" onChange={(e) => setParentImageFile(e.target.files?.[0] || null)} />
            <div className="flex gap-2">
              <Button disabled={savingParent} onClick={saveParent}>
                {savingParent ? 'Saving…' : 'Create listing'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddParent(false)
                  resetParentForm()
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredParents.length === 0 && <p className="text-zinc-500">No parent listings in this tab yet.</p>}

      {filteredParents.map((parent) => {
        const kids = childrenByParent[parent.id] || []
        const exp = expanded[parent.id] !== false
        const cf = childForms[parent.id]

        return (
          <Card key={parent.id} className="mb-6 bg-brand-dark-card border-brand-dark-border">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="flex gap-4">
                <div className="relative w-20 h-20 rounded overflow-hidden bg-brand-dark shrink-0">
                  {parent.materials?.grain_image_url ? (
                    <Image
                      src={parent.materials.grain_image_url}
                      alt={parent.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : parent.image_url ? (
                    <Image src={parent.image_url} alt={parent.name} fill className="object-cover" sizes="80px" />
                  ) : parent.materials?.color_hex ? (
                    <div className="absolute inset-0" style={{ backgroundColor: parent.materials.color_hex }} title={parent.materials.name} />
                  ) : (
                    <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center">
                      <Package className="h-8 w-8 text-zinc-600" />
                    </div>
                  )}
                </div>
                <div>
                  <CardTitle className="text-white text-lg">{parent.name}</CardTitle>
                  <p className="text-zinc-500 text-sm">
                    {parent.subcategory || 'wood'} · {kids.length} piece(s)
                    {parent.material_species ? ` · ${parent.material_species}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setExpanded((e) => ({ ...e, [parent.id]: !exp }))}>
                  {exp ? 'Collapse' : 'Expand'}
                </Button>
                <Button size="sm" onClick={() => openChildForm(parent)}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add piece
                </Button>
              </div>
            </CardHeader>
            {exp && (
              <CardContent>
                {cf?.open && (
                  <div className="mb-6 p-4 rounded border border-brand-dark-border space-y-3">
                    <p className="text-sm text-zinc-400 font-medium">New piece</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex gap-2">
                        <Input
                          placeholder="SKU prefix (2–4 letters)"
                          value={cf.prefix}
                          onChange={(e) =>
                            setChildForms((p) => ({
                              ...p,
                              [parent.id]: { ...cf, prefix: e.target.value.toUpperCase().slice(0, 4) },
                            }))
                          }
                          className="bg-brand-dark border-brand-dark-border text-white"
                        />
                        <Button type="button" variant="outline" onClick={() => generateSku(parent.id)}>
                          Generate SKU
                        </Button>
                      </div>
                      <Input
                        placeholder="SKU"
                        value={cf.sku}
                        onChange={(e) => setChildForms((p) => ({ ...p, [parent.id]: { ...cf, sku: e.target.value } }))}
                        className="bg-brand-dark border-brand-dark-border text-white"
                      />
                      <Input
                        placeholder="Dimensions (e.g. 85×85×520mm)"
                        value={cf.dimensions}
                        onChange={(e) => setChildForms((p) => ({ ...p, [parent.id]: { ...cf, dimensions: e.target.value } }))}
                        className="bg-brand-dark border-brand-dark-border text-white"
                      />
                      <Input
                        placeholder="Sale price £"
                        type="number"
                        step="0.01"
                        value={cf.price}
                        onChange={(e) => setChildForms((p) => ({ ...p, [parent.id]: { ...cf, price: e.target.value } }))}
                        className="bg-brand-dark border-brand-dark-border text-white"
                      />
                      <Input
                        placeholder="Cost price £ (internal)"
                        type="number"
                        step="0.01"
                        value={cf.cost_price}
                        onChange={(e) => setChildForms((p) => ({ ...p, [parent.id]: { ...cf, cost_price: e.target.value } }))}
                        className="bg-brand-dark border-brand-dark-border text-white"
                      />
                      <Textarea
                        placeholder="Internal notes"
                        value={cf.notes}
                        onChange={(e) => setChildForms((p) => ({ ...p, [parent.id]: { ...cf, notes: e.target.value } }))}
                        className="bg-brand-dark border-brand-dark-border text-white md:col-span-2"
                        rows={2}
                      />
                      <div className="md:col-span-2">
                        <label className="text-sm text-zinc-400 mb-2 block">Photos (up to 8)</label>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.HEIC"
                          multiple
                          className="text-sm text-zinc-400"
                          onChange={(e) => handlePieceImages(parent.id, e)}
                        />
                        {cf.previewUrls.length > 0 && (
                          <div className="flex gap-2 mt-3 flex-wrap">
                            {cf.previewUrls.map((url, i) => (
                              <div key={url} className="relative w-20 h-20">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={url}
                                  alt=""
                                  className="w-20 h-20 rounded object-cover border border-brand-dark-border"
                                />
                                <button
                                  type="button"
                                  onClick={() => removePieceImage(parent.id, i)}
                                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 rounded-full text-white text-xs flex items-center justify-center"
                                  aria-label="Remove photo"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button disabled={cf.saving} onClick={() => saveChild(parent)}>
                        {cf.saving ? 'Saving…' : 'Save piece'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setChildForms((p) => {
                            const cur = p[parent.id]
                            if (!cur) return p
                            if (cur.previewUrls.length) revokeObjectUrls(cur.previewUrls)
                            return {
                              ...p,
                              [parent.id]: { ...cur, open: false, files: [], previewUrls: [] },
                            }
                          })
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-brand-dark-border text-left text-zinc-400">
                        <th className="pb-2 pr-2 w-8">
                          <input
                            type="checkbox"
                            aria-label="Select all"
                            onChange={(e) => {
                              const next = new Set(selectedSkus)
                              if (e.target.checked) {
                                kids.forEach((k) => {
                                  if (k.sku) next.add(k.sku)
                                })
                              } else {
                                kids.forEach((k) => {
                                  if (k.sku) next.delete(k.sku)
                                })
                              }
                              setSelectedSkus(next)
                            }}
                          />
                        </th>
                        <th className="pb-2">SKU</th>
                        <th className="pb-2">Thumb</th>
                        <th className="pb-2">Dimensions</th>
                        <th className="pb-2">Sale</th>
                        <th className="pb-2">Cost</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2">Label</th>
                        <th className="pb-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {kids.map((k) => {
                        const { src: thumbSrc, extraCount } = childPieceThumb(k)
                        return (
                        <tr key={k.id} className="border-b border-brand-dark-border/60">
                          <td className="py-2 pr-2">
                            {k.sku && (
                              <input
                                type="checkbox"
                                checked={k.sku ? selectedSkus.has(k.sku) : false}
                                onChange={(e) => {
                                  const next = new Set(selectedSkus)
                                  if (e.target.checked && k.sku) next.add(k.sku)
                                  else if (k.sku) next.delete(k.sku)
                                  setSelectedSkus(next)
                                }}
                              />
                            )}
                          </td>
                          <td className="py-2 text-white font-mono">{k.sku || '—'}</td>
                          <td className="py-2">
                            <div className="relative w-12 h-12 rounded overflow-hidden bg-brand-dark">
                              {thumbSrc && <Image src={thumbSrc} alt="" fill className="object-cover" sizes="48px" />}
                              {extraCount > 0 && (
                                <span className="absolute bottom-0 right-0 rounded-tl bg-black/75 text-white text-[10px] font-medium px-1 py-0.5 leading-none">
                                  +{extraCount}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2 text-zinc-300 max-w-[140px] truncate">{k.dimensions || '—'}</td>
                          <td className="py-2 text-brand-orange">{formatPrice(k.price)}</td>
                          <td className="py-2 text-zinc-500">{k.cost_price != null ? formatPrice(k.cost_price) : '—'}</td>
                          <td className="py-2">
                            <select
                              className="bg-brand-dark border border-brand-dark-border rounded px-2 py-1 text-xs"
                              value={k.stock_status}
                              onChange={(e) => updateChildField(k.id, { stock_status: e.target.value })}
                            >
                              <option value="in_stock">In stock</option>
                              <option value="sold">Sold</option>
                              <option value="out_of_stock">Out of stock</option>
                              <option value="draft">Draft</option>
                            </select>
                          </td>
                          <td className="py-2">
                            <label className="flex items-center gap-1 text-xs text-zinc-400 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={Boolean(k.sku_label_printed)}
                                onChange={() => toggleLabelPrinted(k.id, k.sku_label_printed)}
                              />
                              Printed
                            </label>
                          </td>
                          <td className="py-2">
                            <Button size="sm" variant="destructive" onClick={() => deleteChild(k.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {kids.length === 0 && <p className="text-zinc-500 text-sm py-4">No pieces yet — add one above.</p>}
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}
