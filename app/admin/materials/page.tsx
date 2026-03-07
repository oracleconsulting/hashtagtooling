'use client'

import { useEffect, useState, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { Plus, Pencil, Trash2, ArrowLeft, Upload, Loader2 } from 'lucide-react'

interface Material {
  id: string
  name: string
  category: string
  color_hex: string
  mallet_head_premium: number
  mallet_handle_premium: number
  awl_handle_premium: number
  available: boolean
  grain_image_url?: string | null
  janka_hardness?: number | null
  specific_gravity?: number | null
  origin?: string | null
  grain_description?: string | null
  grain_type?: string | null
  texture?: string | null
  durability?: string | null
  color_description?: string | null
}

interface BasePrice {
  id: string
  product_type: string
  style_name: string
  base_price: number
  description: string
}

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

  const [newMaterial, setNewMaterial] = useState({
    name: '',
    category: 'wood',
    color_hex: '#000000',
    mallet_head_premium: 0,
    mallet_handle_premium: 0,
    awl_handle_premium: 0,
  })

  const [newBasePrice, setNewBasePrice] = useState({
    product_type: 'mallet',
    style_name: '',
    base_price: 0,
    description: '',
  })

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('admin_auth')
    if (!isAuthenticated) {
      router.push('/admin')
      return
    }

    loadData()
  }, [router])

  const loadData = async () => {
    try {
      const [materialsRes, basePricesRes] = await Promise.all([
        supabase.from('materials').select('*').order('category').order('name'),
        supabase.from('base_prices').select('*').order('product_type').order('style_name')
      ])

      if (materialsRes.error) throw materialsRes.error
      if (basePricesRes.error) throw basePricesRes.error

      setMaterials(materialsRes.data || [])
      setBasePrices(basePricesRes.data || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const addMaterial = async () => {
    try {
      const { error } = await supabase.from('materials').insert([newMaterial])
      if (error) throw error

      setShowAddMaterial(false)
      setNewMaterial({
        name: '',
        category: 'wood',
        color_hex: '#000000',
        mallet_head_premium: 0,
        mallet_handle_premium: 0,
        awl_handle_premium: 0,
      })
      loadData()
    } catch (error) {
      console.error('Error adding material:', error)
      alert('Failed to add material')
    }
  }

  const uploadGrainImage = async (materialId: string, file: File) => {
    setUploadingGrainId(materialId)
    try {
      let processedFile: File = file
      let fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      if (fileExt === 'heic' || fileExt === 'heif' || file.type === 'image/heic' || file.type === 'image/heif') {
        try {
          const heic2any = (await import('heic2any')).default
          const convertedBlob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 })
          const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob
          processedFile = new File([blob], file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg'), { type: 'image/jpeg' })
          fileExt = 'jpg'
        } catch {
          alert('Could not convert HEIC. Try uploading a JPG.')
          setUploadingGrainId(null)
          return
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

  const updateMaterial = async (material: Material) => {
    try {
      const { error } = await supabase
        .from('materials')
        .update({
          mallet_head_premium: material.mallet_head_premium,
          mallet_handle_premium: material.mallet_handle_premium,
          awl_handle_premium: material.awl_handle_premium,
          available: material.available,
          janka_hardness: material.janka_hardness ?? null,
          specific_gravity: material.specific_gravity ?? null,
          origin: material.origin ?? null,
          grain_description: material.grain_description ?? null,
          grain_type: material.grain_type ?? null,
          texture: material.texture ?? null,
          durability: material.durability ?? null,
          color_description: material.color_description ?? null,
        })
        .eq('id', material.id)

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

  if (loading) return <div className="container mx-auto px-4 py-12">Loading...</div>

  const woodMaterials = materials.filter(m => m.category === 'wood')
  const transitionMaterials = materials.filter(m => m.category === 'transition')
  const malletBasePrices = basePrices.filter(bp => bp.product_type === 'mallet')
  const awlBasePrices = basePrices.filter(bp => bp.product_type === 'awl')

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
      </div>

      <h1 className="text-4xl font-bold mb-8">Materials & Pricing</h1>

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
                        <p className="text-sm text-zinc-600">{bp.description}</p>
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
                        <p className="text-sm text-zinc-600">{bp.description}</p>
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
          </div>

          {showAddBasePrice && (
            <div className="mt-4 p-4 border rounded bg-zinc-50">
              <h4 className="font-semibold mb-3">Add Base Price</h4>
              <div className="space-y-3">
                <select
                  className="w-full h-10 rounded-md border px-3"
                  value={newBasePrice.product_type}
                  onChange={(e) => setNewBasePrice({ ...newBasePrice, product_type: e.target.value })}
                >
                  <option value="mallet">Mallet</option>
                  <option value="awl">Awl</option>
                </select>
                <Input
                  placeholder="Style name (e.g., Turned Carving Mallet)"
                  value={newBasePrice.style_name}
                  onChange={(e) => setNewBasePrice({ ...newBasePrice, style_name: e.target.value })}
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Base price"
                  value={newBasePrice.base_price || ''}
                  onChange={(e) => setNewBasePrice({ ...newBasePrice, base_price: parseFloat(e.target.value) })}
                />
                <Input
                  placeholder="Description"
                  value={newBasePrice.description}
                  onChange={(e) => setNewBasePrice({ ...newBasePrice, description: e.target.value })}
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
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Material</th>
                  <th className="text-center p-2">Grain</th>
                  <th className="text-right p-2">Mallet Head</th>
                  <th className="text-right p-2">Mallet Handle</th>
                  <th className="text-right p-2">Awl Handle</th>
                  <th className="text-center p-2">Available</th>
                  <th className="text-center p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {woodMaterials.map(mat => (
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
                            accept="image/*"
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
                        <td className="p-2">
                          <Input
                            type="number"
                            step="0.01"
                            value={editingMaterial.mallet_head_premium}
                            onChange={(e) => setEditingMaterial({
                              ...editingMaterial,
                              mallet_head_premium: parseFloat(e.target.value)
                            })}
                            className="w-24 text-right"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            step="0.01"
                            value={editingMaterial.mallet_handle_premium}
                            onChange={(e) => setEditingMaterial({
                              ...editingMaterial,
                              mallet_handle_premium: parseFloat(e.target.value)
                            })}
                            className="w-24 text-right"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            step="0.01"
                            value={editingMaterial.awl_handle_premium}
                            onChange={(e) => setEditingMaterial({
                              ...editingMaterial,
                              awl_handle_premium: parseFloat(e.target.value)
                            })}
                            className="w-24 text-right"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            checked={editingMaterial.available}
                            onChange={(e) => setEditingMaterial({
                              ...editingMaterial,
                              available: e.target.checked
                            })}
                          />
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
                          <input type="file" id={`grain-${mat.id}`} accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) uploadGrainImage(mat.id, e.target.files[0]) }} disabled={uploadingGrainId === mat.id} />
                          {uploadingGrainId === mat.id ? (
                            <div className="w-12 h-12 rounded border border-dashed flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-zinc-500" /></div>
                          ) : mat.grain_image_url ? (
                            <label htmlFor={`grain-${mat.id}`} className="cursor-pointer block w-12 h-12 rounded overflow-hidden border"><img src={mat.grain_image_url} alt="" className="w-full h-full object-cover" /></label>
                          ) : (
                            <label htmlFor={`grain-${mat.id}`} className="cursor-pointer w-12 h-12 rounded border border-dashed flex items-center justify-center"><Upload className="h-5 w-5 text-zinc-500" /></label>
                          )}
                        </td>
                        <td className="p-2 text-right">
                          {mat.mallet_head_premium === 0 ? '—' : `+£${mat.mallet_head_premium.toFixed(2)}`}
                        </td>
                        <td className="p-2 text-right">
                          {mat.mallet_handle_premium === 0 ? '—' : `+£${mat.mallet_handle_premium.toFixed(2)}`}
                        </td>
                        <td className="p-2 text-right">
                          {mat.awl_handle_premium === 0 ? '—' : `+£${mat.awl_handle_premium.toFixed(2)}`}
                        </td>
                        <td className="p-2 text-center">
                          {mat.available ? '✓' : '✗'}
                        </td>
                        <td className="p-2">
                          <div className="flex gap-2 justify-center">
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
                  {editingMaterial?.id === mat.id && (
                    <tr>
                      <td colSpan={7} className="p-4 bg-zinc-100 dark:bg-zinc-900 border-b">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <label className="block font-medium mb-1">Janka Hardness</label>
                            <Input type="number" value={editingMaterial.janka_hardness ?? ''} onChange={(e) => setEditingMaterial({ ...editingMaterial, janka_hardness: e.target.value ? parseInt(e.target.value, 10) : null })} className="w-full" />
                          </div>
                          <div>
                            <label className="block font-medium mb-1">Specific Gravity</label>
                            <Input type="number" step="0.01" value={editingMaterial.specific_gravity ?? ''} onChange={(e) => setEditingMaterial({ ...editingMaterial, specific_gravity: e.target.value ? parseFloat(e.target.value) : null })} className="w-full" />
                          </div>
                          <div>
                            <label className="block font-medium mb-1">Origin</label>
                            <Input value={editingMaterial.origin ?? ''} onChange={(e) => setEditingMaterial({ ...editingMaterial, origin: e.target.value || null })} className="w-full" placeholder="e.g. North America" />
                          </div>
                          <div>
                            <label className="block font-medium mb-1">Grain Type</label>
                            <select className="w-full h-9 rounded border px-2" value={editingMaterial.grain_type ?? ''} onChange={(e) => setEditingMaterial({ ...editingMaterial, grain_type: e.target.value || null })}>
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
                            <label className="block font-medium mb-1">Texture</label>
                            <select className="w-full h-9 rounded border px-2" value={editingMaterial.texture ?? ''} onChange={(e) => setEditingMaterial({ ...editingMaterial, texture: e.target.value || null })}>
                              <option value="">—</option>
                              <option value="fine">Fine</option>
                              <option value="medium">Medium</option>
                              <option value="coarse">Coarse</option>
                            </select>
                          </div>
                          <div>
                            <label className="block font-medium mb-1">Durability</label>
                            <select className="w-full h-9 rounded border px-2" value={editingMaterial.durability ?? ''} onChange={(e) => setEditingMaterial({ ...editingMaterial, durability: e.target.value || null })}>
                              <option value="">—</option>
                              <option value="very_high">Very High</option>
                              <option value="high">High</option>
                              <option value="moderate">Moderate</option>
                              <option value="low">Low</option>
                            </select>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block font-medium mb-1">Grain Description</label>
                            <textarea rows={2} className="w-full rounded border px-2 py-1 text-sm" value={editingMaterial.grain_description ?? ''} onChange={(e) => setEditingMaterial({ ...editingMaterial, grain_description: e.target.value || null })} placeholder="Describe the grain and figure" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block font-medium mb-1">Colour Description</label>
                            <Input value={editingMaterial.color_description ?? ''} onChange={(e) => setEditingMaterial({ ...editingMaterial, color_description: e.target.value || null })} className="w-full" placeholder="e.g. Dark chocolate brown" />
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

          {showAddMaterial && (
            <div className="mt-4 p-4 border rounded bg-zinc-50">
              <h4 className="font-semibold mb-3">Add Material</h4>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Material name"
                  value={newMaterial.name}
                  onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                />
                <select
                  className="h-10 rounded-md border px-3"
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
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Mallet head premium"
                  value={newMaterial.mallet_head_premium || ''}
                  onChange={(e) => setNewMaterial({ ...newMaterial, mallet_head_premium: parseFloat(e.target.value) || 0 })}
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Mallet handle premium"
                  value={newMaterial.mallet_handle_premium || ''}
                  onChange={(e) => setNewMaterial({ ...newMaterial, mallet_handle_premium: parseFloat(e.target.value) || 0 })}
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Awl handle premium"
                  value={newMaterial.awl_handle_premium || ''}
                  onChange={(e) => setNewMaterial({ ...newMaterial, awl_handle_premium: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="flex gap-2 mt-3">
                <Button onClick={addMaterial}>Add Material</Button>
                <Button variant="outline" onClick={() => setShowAddMaterial(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transition Materials */}
      <Card>
        <CardHeader>
          <CardTitle>Transition Materials</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {transitionMaterials.map(mat => (
              <div key={mat.id} className="flex items-center gap-4 p-3 border rounded">
                <div
                  className="w-8 h-8 rounded border"
                  style={{ backgroundColor: mat.color_hex }}
                />
                <span className="font-medium flex-1">{mat.name}</span>
                <span className="text-sm text-zinc-600">
                  Premium: £{mat.mallet_head_premium.toFixed(2)}
                </span>
                <Button size="sm" variant="outline" onClick={() => setEditingMaterial(mat)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="destructive" onClick={() => deleteMaterial(mat.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

