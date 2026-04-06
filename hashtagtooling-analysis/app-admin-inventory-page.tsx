'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { Loader2, Plus, Trash2, Printer, Package } from 'lucide-react'
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
  metadata?: Record<string, unknown> | null
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

function tabMatchesParent(tab: WoodTab, sub: string | null): boolean {
  if (tab === 'all') return true
  if (tab === 'other') return !sub || !['slab', 'offcut', 'pen_blank', 'sample_pack', 'adopt'].includes(sub)
  return sub === tab
}

export default function AdminInventoryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<WoodTab>('all')
  const [parents, setParents] = useState<ProductRow[]>([])
  const [childrenByParent, setChildrenByParent] = useState<Record<string, ProductRow[]>>({})
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const [showAddParent, setShowAddParent] = useState(false)
  const [parentForm, setParentForm] = useState({
    name: '',
    subcategory: 'offcut' as string,
    description: '',
    material_species: '',
  })
  const [parentImageFile, setParentImageFile] = useState<File | null>(null)
  const [savingParent, setSavingParent] = useState(false)

  const [childForms, setChildForms] = useState<Record<string, {
    open: boolean
    prefix: string
    sku: string
    dimensions: string
    price: string
    cost_price: string
    notes: string
    file: File | null
    saving: boolean
  }>>({})

  const [selectedSkus, setSelectedSkus] = useState<Set<string>>(new Set())

  useEffect(() => {
    const ok = sessionStorage.getItem('admin_auth')
    if (!ok) {
      router.push('/admin')
      return
    }
    load()
  }, [router])

  const load = async () => {
    setLoading(true)
    try {
      const { data: woodParents, error: e1 } = await supabase
        .from('products')
        .select('*')
        .eq('category', 'wood')
        .is('parent_product_id', null)
        .order('created_at', { ascending: false })

      if (e1) throw e1

      const { data: kids, error: e2 } = await supabase
        .from('products')
        .select('*')
        .not('parent_product_id', 'is', null)
        .order('sku')

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

  const filteredParents = parents.filter((p) => tabMatchesParent(tab, p.subcategory))

  const openChildForm = (parent: ProductRow) => {
    const prefix = (parent.material_species || parent.name)
      .replace(/[^a-zA-Z]/g, '')
      .slice(0, 4)
      .toUpperCase() || 'XX'
    setChildForms((prev) => ({
      ...prev,
      [parent.id]: {
        open: true,
        prefix: prefix.slice(0, 4),
        sku: '',
        dimensions: '',
        price: '',
        cost_price: '',
        notes: '',
        file: null,
        saving: false,
      },
    }))
  }

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
      let imageUrl = parent.image_url || 'https://placehold.co/600x400/666/white?text=Wood'
      if (f.file) {
        let file = f.file
        if (file.type.startsWith('image/')) {
          try {
            file = await compressImage(file)
          } catch {
            /* use original */
          }
        }
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const path = `products/${parent.id}-child-${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage.from('products').upload(path, file)
        if (upErr) throw upErr
        const { data: pub } = supabase.storage.from('products').getPublicUrl(path)
        imageUrl = pub.publicUrl
      }

      const cost = parseFloat(f.cost_price)
      const { error } = await supabase.from('products').insert({
        name: `${parent.name} — ${f.sku}`,
        description: parent.description || '',
        price,
        category: parent.category,
        subcategory: parent.subcategory,
        image_url: imageUrl,
        stock_status: 'in_stock',
        parent_product_id: parent.id,
        sku: f.sku.trim(),
        dimensions: f.dimensions.trim() || null,
        cost_price: Number.isFinite(cost) ? cost : null,
        material_species: parent.material_species || parent.name,
        piece_notes: f.notes.trim() || null,
        sku_label_printed: false,
        metadata: parent.metadata || {},
      })

      if (error) throw error

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
          file: null,
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
      }

      const { error } = await supabase.from('products').insert({
        name: parentForm.name.trim(),
        description: parentForm.description.trim() || ' ',
        price: 0,
        category: 'wood',
        subcategory: parentForm.subcategory || null,
        image_url: imageUrl,
        stock_status: 'in_stock',
        parent_product_id: null,
        material_species: parentForm.material_species.trim() || parentForm.name.trim(),
        metadata: { species: parentForm.material_species.trim() || parentForm.name.trim() },
      })

      if (error) throw error
      setShowAddParent(false)
      setParentForm({ name: '', subcategory: 'offcut', description: '', material_species: '' })
      setParentImageFile(null)
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
            <Button variant="outline" size="sm">Dashboard</Button>
          </Link>
          <Link href="/admin/products">
            <Button variant="outline" size="sm">Products</Button>
          </Link>
          <Button size="sm" onClick={printLabels}>
            <Printer className="mr-2 h-4 w-4" />
            Print labels
          </Button>
          <Button size="sm" onClick={() => setShowAddParent(true)}>
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
            <Input
              placeholder="Species / listing name (e.g. Verawood)"
              value={parentForm.name}
              onChange={(e) => setParentForm({ ...parentForm, name: e.target.value })}
              className="bg-brand-dark border-brand-dark-border text-white"
            />
            <Input
              placeholder="Material species (short, for SKU prefix)"
              value={parentForm.material_species}
              onChange={(e) => setParentForm({ ...parentForm, material_species: e.target.value })}
              className="bg-brand-dark border-brand-dark-border text-white"
            />
            <select
              className="w-full h-10 rounded-md border border-brand-dark-border bg-brand-dark text-white px-3"
              value={parentForm.subcategory}
              onChange={(e) => setParentForm({ ...parentForm, subcategory: e.target.value })}
            >
              <option value="offcut">Offcut / blank</option>
              <option value="slab">Slab / board</option>
              <option value="pen_blank">Pen blank</option>
              <option value="sample_pack">Sample pack</option>
              <option value="adopt">Adopt a blank</option>
            </select>
            <Textarea
              placeholder="Public description"
              value={parentForm.description}
              onChange={(e) => setParentForm({ ...parentForm, description: e.target.value })}
              className="bg-brand-dark border-brand-dark-border text-white"
              rows={3}
            />
            <input
              type="file"
              accept="image/*"
              className="text-sm text-zinc-400"
              onChange={(e) => setParentImageFile(e.target.files?.[0] || null)}
            />
            <div className="flex gap-2">
              <Button disabled={savingParent} onClick={saveParent}>
                {savingParent ? 'Saving…' : 'Create listing'}
              </Button>
              <Button variant="outline" onClick={() => setShowAddParent(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredParents.length === 0 && (
        <p className="text-zinc-500">No parent listings in this tab yet.</p>
      )}

      {filteredParents.map((parent) => {
        const kids = childrenByParent[parent.id] || []
        const exp = expanded[parent.id] !== false
        const cf = childForms[parent.id]

        return (
          <Card key={parent.id} className="mb-6 bg-brand-dark-card border-brand-dark-border">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="flex gap-4">
                <div className="relative w-20 h-20 rounded overflow-hidden bg-brand-dark shrink-0">
                  {parent.image_url ? (
                    <Image src={parent.image_url} alt="" fill className="object-cover" sizes="80px" />
                  ) : (
                    <Package className="m-6 text-zinc-600" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-white text-lg">{parent.name}</CardTitle>
                  <p className="text-zinc-500 text-sm">{parent.subcategory || 'wood'} · {kids.length} piece(s)</p>
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
                        onChange={(e) =>
                          setChildForms((p) => ({ ...p, [parent.id]: { ...cf, sku: e.target.value } }))
                        }
                        className="bg-brand-dark border-brand-dark-border text-white"
                      />
                      <Input
                        placeholder="Dimensions (e.g. 85×85×520mm)"
                        value={cf.dimensions}
                        onChange={(e) =>
                          setChildForms((p) => ({ ...p, [parent.id]: { ...cf, dimensions: e.target.value } }))
                        }
                        className="bg-brand-dark border-brand-dark-border text-white"
                      />
                      <Input
                        placeholder="Sale price £"
                        type="number"
                        step="0.01"
                        value={cf.price}
                        onChange={(e) =>
                          setChildForms((p) => ({ ...p, [parent.id]: { ...cf, price: e.target.value } }))
                        }
                        className="bg-brand-dark border-brand-dark-border text-white"
                      />
                      <Input
                        placeholder="Cost price £ (internal)"
                        type="number"
                        step="0.01"
                        value={cf.cost_price}
                        onChange={(e) =>
                          setChildForms((p) => ({ ...p, [parent.id]: { ...cf, cost_price: e.target.value } }))
                        }
                        className="bg-brand-dark border-brand-dark-border text-white"
                      />
                      <Textarea
                        placeholder="Internal notes"
                        value={cf.notes}
                        onChange={(e) =>
                          setChildForms((p) => ({ ...p, [parent.id]: { ...cf, notes: e.target.value } }))
                        }
                        className="bg-brand-dark border-brand-dark-border text-white md:col-span-2"
                        rows={2}
                      />
                      <input
                        type="file"
                        accept="image/*"
                        className="text-sm md:col-span-2"
                        onChange={(e) =>
                          setChildForms((p) => ({
                            ...p,
                            [parent.id]: { ...cf, file: e.target.files?.[0] || null },
                          }))
                        }
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button disabled={cf.saving} onClick={() => saveChild(parent)}>
                        {cf.saving ? 'Saving…' : 'Save piece'}
                      </Button>
                      <Button variant="outline" onClick={() => setChildForms((p) => ({ ...p, [parent.id]: { ...cf, open: false } }))}>
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
                      {kids.map((k) => (
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
                              {k.image_url && (
                                <Image src={k.image_url} alt="" fill className="object-cover" sizes="48px" />
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
                      ))}
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
