'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { Upload, X, Loader2 } from 'lucide-react'
import { compressImage } from '@/lib/image-utils'

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [videoUrl, setVideoUrl] = useState('')
  const [availableWoods, setAvailableWoods] = useState<{ id: string; name: string; color_hex: string }[]>([])

  const [originalStockStatus, setOriginalStockStatus] = useState<string>('')
  const [waitlistCount, setWaitlistCount] = useState(0)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'mallet',
    subcategory: '',
    stock_status: 'in_stock',
    is_digital: false,
    weight_kg: '',
    dimensions: '',
    wood_species: '',
    head_wood: '',
    handle_wood: '',
    shipping_uk: '5.99',
    shipping_europe: '15.99',
    shipping_world: '25.99',
    featured: false,
    display_order: 0,
  })
  const [digitalFileUrl, setDigitalFileUrl] = useState('')
  const [digitalFileName, setDigitalFileName] = useState('')
  const [uploadingDigital, setUploadingDigital] = useState(false)
  const [mysteryTier, setMysteryTier] = useState<'carver' | 'detailer' | 'joiner'>('carver')

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('admin_auth')
    if (!isAuthenticated) {
      router.push('/admin')
      return
    }
    loadProduct()
  }, [router, id])

  useEffect(() => {
    const loadWoods = async () => {
      const { data, error } = await supabase
        .from('materials')
        .select('id, name, color_hex')
        .eq('category', 'wood')
        .order('name')
      if (!error && data) setAvailableWoods(data)
    }
    loadWoods()
  }, [])

  const loadProduct = async () => {
    if (!id) return
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (error) throw error

      if (!data) {
        alert('Product not found — it may have been deleted.')
        router.push('/admin/products')
        return
      }

      setOriginalStockStatus(data.stock_status ?? '')
      setFormData({
        name: data.name ?? '',
        description: data.description ?? '',
        price: String(data.price ?? ''),
        category: data.category ?? 'mallet',
        subcategory: data.subcategory ?? '',
        stock_status: data.stock_status ?? 'in_stock',
        is_digital: Boolean(data.is_digital),
        weight_kg: data.metadata?.weight_kg ?? '',
        dimensions: data.metadata?.dimensions ?? '',
        wood_species: data.metadata?.species ?? '',
        head_wood: data.metadata?.head_wood ?? '',
        handle_wood: data.metadata?.handle_wood ?? '',
        shipping_uk: data.metadata?.shipping?.uk?.toString() ?? '5.99',
        shipping_europe: data.metadata?.shipping?.europe?.toString() ?? '15.99',
        shipping_world: data.metadata?.shipping?.world?.toString() ?? '25.99',
        featured: Boolean(data.metadata?.featured),
        display_order: Number(data.metadata?.display_order) || 0,
      })
      setDigitalFileUrl(data.digital_file_url ?? '')
      setDigitalFileName(data.digital_file_name ?? '')
      setMysteryTier((data.metadata?.tier as 'carver' | 'detailer' | 'joiner') || 'carver')
      setImageUrls(data.metadata?.images?.length ? data.metadata.images : (data.image_url ? [data.image_url] : []))
      setVideoUrl(data.metadata?.video ?? '')

      const { count } = await supabase
        .from('stock_notifications')
        .select('id', { count: 'exact', head: true })
        .eq('product_id', id)
        .eq('notified', false)
      setWaitlistCount(count ?? 0)
    } catch (err) {
      console.error('Error loading product:', err)
      alert('Failed to load product')
      router.push('/admin/products')
    } finally {
      setPageLoading(false)
    }
  }

  const handleDigitalFileUpload = async (files: FileList | null) => {
    if (!files?.length) return
    setUploadingDigital(true)
    try {
      const file = files[0]
      const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf'
      const path = `${Math.random().toString(36).substring(2)}-${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('digital-downloads').upload(path, file)
      if (error) throw error
      setDigitalFileUrl(path)
      setDigitalFileName(file.name)
    } catch (e) {
      console.error('Digital upload error:', e)
      alert('Failed to upload file')
    } finally {
      setUploadingDigital(false)
    }
  }

  const handleFileUpload = async (files: FileList | null, type: 'image' | 'video') => {
    if (!files || files.length === 0) return

    setUploadingFiles(true)
    const uploadedUrls: string[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        let file = files[i]
        let fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'

        if (fileExt === 'heic' || fileExt === 'heif' || file.type === 'image/heic' || file.type === 'image/heif') {
          let converted = false

          try {
            const heic2any = (await import('heic2any')).default
            const convertedBlob = await heic2any({
              blob: file,
              toType: 'image/jpeg',
              quality: 0.85,
            })
            const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob
            file = new File(
              [blob],
              file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg'),
              { type: 'image/jpeg' }
            )
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
              file = new File(
                [jpegBlob],
                file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg'),
                { type: 'image/jpeg' }
              )
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
              file = new File(
                [jpegBlob],
                file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg'),
                { type: 'image/jpeg' }
              )
              fileExt = 'jpg'
              converted = true
            } catch (serverError) {
              console.error('Server HEIC conversion also failed:', serverError)
            }
          }

          if (!converted) {
            alert(`Could not convert ${file.name}. Try using the Files app on your iPhone to convert to JPG first, or take a screenshot of the photo.`)
            continue
          }
        }

        if (file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp'].includes(fileExt)) {
          try {
            file = await compressImage(file)
            fileExt = 'jpg'
          } catch (compressError) {
            console.warn('Image compression failed, uploading original:', compressError)
          }
        }

        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
        const filePath = `products/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(filePath, file)

        if (uploadError) {
          console.error('Upload error:', uploadError)
          alert(`Failed to upload ${file.name}`)
          continue
        }

        const { data } = supabase.storage.from('products').getPublicUrl(filePath)
        if (data?.publicUrl) uploadedUrls.push(data.publicUrl)
      }

      if (type === 'image') {
        setImageUrls((prev) => [...prev, ...uploadedUrls])
      } else {
        setVideoUrl(uploadedUrls[0] || '')
      }
    } catch (error) {
      console.error('Error uploading files:', error)
      alert('Error uploading files')
    } finally {
      setUploadingFiles(false)
    }
  }

  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.is_digital && !digitalFileUrl) {
      alert('Please upload a digital file for digital products.')
      return
    }
    setLoading(true)

    try {
      const linkedIds: string[] = []
      if (formData.head_wood) {
        const hw = availableWoods.find((w) => w.name === formData.head_wood)
        if (hw) linkedIds.push(hw.id)
      }
      if (formData.handle_wood) {
        const hlw = availableWoods.find((w) => w.name === formData.handle_wood)
        if (hlw && !linkedIds.includes(hlw.id)) linkedIds.push(hlw.id)
      }
      if (formData.category === 'wood' && formData.wood_species) {
        const sp = availableWoods.find((w) => w.name === formData.wood_species)
        if (sp && !linkedIds.includes(sp.id)) linkedIds.push(sp.id)
      }

      const { error } = await supabase
        .from('products')
        .update({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          category: formData.category,
          subcategory: formData.category === 'wood' ? (formData.subcategory || null) : null,
          stock_status: formData.stock_status,
          is_digital: formData.is_digital,
          digital_file_url: formData.is_digital && digitalFileUrl ? digitalFileUrl : null,
          digital_file_name: formData.is_digital && digitalFileName ? digitalFileName : null,
          image_url: imageUrls[0] || 'https://placehold.co/600x400/666/white?text=No+Image',
          material_id: linkedIds[0] || null,
          material_ids: linkedIds,
          metadata: {
            images: imageUrls,
            video: videoUrl,
            weight_kg: formData.is_digital ? undefined : formData.weight_kg,
            dimensions: formData.is_digital ? undefined : formData.dimensions,
            species: formData.category === 'wood' ? (formData.wood_species || undefined) : undefined,
            tier: formData.category === 'mystery' ? mysteryTier : undefined,
            head_wood: formData.head_wood,
            handle_wood: formData.handle_wood,
            shipping: formData.is_digital
              ? undefined
              : {
                  uk: parseFloat(formData.shipping_uk) || 0,
                  europe: parseFloat(formData.shipping_europe) || 0,
                  world: parseFloat(formData.shipping_world) || 0,
                },
            featured: formData.featured,
            display_order: Number(formData.display_order) || 0,
          },
        })
        .eq('id', id)

      if (error) throw error

      const stockChangedToInStock = originalStockStatus !== 'in_stock' && formData.stock_status === 'in_stock'
      let notifiedCount = 0
      if (stockChangedToInStock && waitlistCount > 0) {
        try {
          const res = await fetch('/api/send-stock-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productId: id,
              productName: formData.name,
              productUrl: `/product/${id}`,
            }),
          })
          const data = await res.json()
          notifiedCount = data.count ?? 0
        } catch {
          // Non-blocking
        }
      }

      if (notifiedCount > 0) {
        alert(`✓ Saved — ${notifiedCount} customer${notifiedCount === 1 ? '' : 's'} notified`)
      } else {
        alert('Product updated successfully!')
      }
      router.push('/admin/products')
    } catch (error) {
      console.error('Error updating product:', error)
      alert('Failed to update product')
    } finally {
      setLoading(false)
    }
  }

  const [markingSold, setMarkingSold] = useState(false)

  const handleMarkAsSold = async () => {
    if (!confirm('Mark this product as sold? This will update the stock status immediately.')) return
    setMarkingSold(true)
    try {
      const { error } = await supabase
        .from('products')
        .update({ stock_status: 'sold' })
        .eq('id', id)
      if (error) throw error
      setFormData((prev) => ({ ...prev, stock_status: 'sold' }))
      setOriginalStockStatus('sold')
      alert('Marked as sold.')
    } catch (err) {
      console.error('Error marking as sold:', err)
      alert('Failed to update — please try again.')
    } finally {
      setMarkingSold(false)
    }
  }

  if (pageLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="font-heading text-4xl font-bold text-brand-orange">Edit Product</h1>
          <div className="flex gap-3">
            {formData.stock_status !== 'sold' && (
              <Button
                variant="outline"
                onClick={handleMarkAsSold}
                disabled={markingSold}
                className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
              >
                {markingSold ? 'Updating…' : 'Mark as Sold'}
              </Button>
            )}
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="bg-brand-dark-card border border-brand-dark-border">
            <CardHeader>
              <CardTitle className="text-white">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-zinc-300">Product Name *</label>
                <Input
                  required
                  className="bg-brand-dark border border-brand-dark-border text-white placeholder:text-zinc-500"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Walnut Carving Mallet"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-zinc-300">Description *</label>
                <Textarea
                  required
                  className="bg-brand-dark border border-brand-dark-border text-white placeholder:text-zinc-500"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-300">Category *</label>
                  <select
                    className="w-full h-10 rounded-md border border-brand-dark-border bg-brand-dark text-white px-3"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="mallet">Mallet</option>
                    <option value="awl">Awl</option>
                    <option value="square">Engineering Square</option>
                    <option value="coin">EDC Coin</option>
                    <option value="wood">Wood for Sale</option>
                    <option value="mystery">Mystery Box</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-300">Stock Status *</label>
                  <select
                    className="w-full h-10 rounded-md border border-brand-dark-border bg-brand-dark text-white px-3"
                    value={formData.stock_status}
                    onChange={(e) => setFormData({ ...formData, stock_status: e.target.value })}
                  >
                    <option value="draft">Draft (hidden from site)</option>
                    <option value="in_stock">In Stock</option>
                    <option value="made_to_order">Made to Order</option>
                    <option value="out_of_stock">Out of Stock</option>
                    <option value="sold">Sold</option>
                  </select>
                  {waitlistCount > 0 && (
                    <p className="text-zinc-400 text-sm mt-1.5">📧 {waitlistCount} customer{waitlistCount === 1 ? '' : 's'} waiting for notification</p>
                  )}
                </div>
              </div>

              {formData.category === 'wood' && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-300">Subcategory</label>
                  <select
                    className="w-full h-10 rounded-md border border-brand-dark-border bg-brand-dark text-white px-3"
                    value={formData.subcategory}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                  >
                    <option value="">Select subcategory...</option>
                    <option value="adopt">Adopt a Blank</option>
                    <option value="offcut">Offcut / Turning Blank</option>
                    <option value="sample_pack">Sample Pack</option>
                    <option value="slab">Slab / Board</option>
                    <option value="pen_blank">Pen Blank</option>
                  </select>
                </div>
              )}

              {formData.category === 'mystery' && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-300">Tier</label>
                  <select
                    className="w-full h-10 rounded-md border border-brand-dark-border bg-brand-dark text-white px-3"
                    value={mysteryTier}
                    onChange={(e) => setMysteryTier(e.target.value as 'carver' | 'detailer' | 'joiner')}
                  >
                    <option value="carver">Carver</option>
                    <option value="detailer">Detailer</option>
                    <option value="joiner">Joiner</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2 text-zinc-300">Price (£) *</label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  className="bg-brand-dark border border-brand-dark-border text-white placeholder:text-zinc-500"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="89.99"
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="rounded border-brand-dark-border bg-brand-dark text-brand-orange focus:ring-brand-orange"
                  />
                  <span className="text-sm text-zinc-300">Featured (e.g. homepage)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_digital}
                    onChange={(e) => setFormData({ ...formData, is_digital: e.target.checked })}
                    className="rounded border-brand-dark-border bg-brand-dark text-brand-orange focus:ring-brand-orange"
                  />
                  <span className="text-sm text-zinc-300">Digital Product</span>
                </label>
              </div>

              {formData.is_digital && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-300">Digital File</label>
                  <div className="border-2 border-dashed border-brand-dark-border rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-10 w-10 text-zinc-500 mb-3" />
                    <input
                      type="file"
                      accept=".pdf,.zip,.doc,.docx"
                      onChange={(e) => handleDigitalFileUpload(e.target.files)}
                      className="hidden"
                      id="digital-upload-edit"
                      disabled={uploadingDigital}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploadingDigital}
                      onClick={() => document.getElementById('digital-upload-edit')?.click()}
                    >
                      {uploadingDigital ? 'Uploading...' : digitalFileName ? 'Replace File' : 'Upload File'}
                    </Button>
                    {digitalFileName && <p className="text-sm text-zinc-400 mt-2">Current: {digitalFileName}</p>}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2 text-zinc-300">Display order (lower = first in shop)</label>
                <Input
                  type="number"
                  className="bg-brand-dark border border-brand-dark-border text-white placeholder:text-zinc-500"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value, 10) || 0 })}
                  placeholder="0"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-brand-dark-card border border-brand-dark-border">
            <CardHeader>
              <CardTitle className="text-white">Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-zinc-300">Product Images</label>
                <div className="border-2 border-dashed border-brand-dark-border rounded-lg p-8 text-center">
                  <Upload className="mx-auto h-12 w-12 text-zinc-500 mb-4" />
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.HEIC,.heif,.HEIF"
                    multiple
                    onChange={(e) => handleFileUpload(e.target.files, 'image')}
                    className="hidden"
                    id="image-upload-edit"
                    disabled={uploadingFiles}
                  />
                  <Button
                    type="button"
                    disabled={uploadingFiles}
                    onClick={() => document.getElementById('image-upload-edit')?.click()}
                  >
                    {uploadingFiles ? 'Uploading...' : 'Upload Images'}
                  </Button>
                  <p className="text-sm text-zinc-500 mt-2">JPG, PNG, WEBP (max 5MB each)</p>
                </div>
                {imageUrls.length > 0 && (
                  <div className="grid grid-cols-4 gap-4 mt-4">
                    {imageUrls.map((url, index) => (
                      <div key={index} className="relative aspect-square">
                        <img
                          src={url}
                          alt={`Product ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-zinc-300">Product Video (Optional)</label>
                <div className="border-2 border-dashed border-brand-dark-border rounded-lg p-8 text-center">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleFileUpload(e.target.files, 'video')}
                    className="hidden"
                    id="video-upload-edit"
                    disabled={uploadingFiles}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploadingFiles}
                    onClick={() => document.getElementById('video-upload-edit')?.click()}
                  >
                    {uploadingFiles ? 'Uploading...' : 'Upload Video'}
                  </Button>
                </div>
                {videoUrl && <p className="text-sm text-green-600 mt-2">✓ Video uploaded</p>}
              </div>
            </CardContent>
          </Card>

          {formData.category === 'wood' && !formData.is_digital && (
            <Card className="bg-brand-dark-card border border-brand-dark-border">
              <CardHeader>
                <CardTitle className="text-white">Wood Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-300">Species</label>
                  <select
                    className="w-full h-10 rounded-md border border-brand-dark-border bg-brand-dark text-white px-3"
                    value={formData.wood_species}
                    onChange={(e) => setFormData({ ...formData, wood_species: e.target.value })}
                  >
                    <option value="">Select species...</option>
                    {availableWoods.map((wood) => (
                      <option key={wood.id} value={wood.name}>{wood.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-300">Approximate dimensions</label>
                  <Input
                    className="bg-brand-dark border border-brand-dark-border text-white placeholder:text-zinc-500"
                    value={formData.dimensions}
                    onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                    placeholder="e.g. 150mm x 40mm x 40mm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-300">Weight (kg)</label>
                  <Input
                    type="number"
                    step="0.01"
                    className="bg-brand-dark border border-brand-dark-border text-white placeholder:text-zinc-500"
                    value={formData.weight_kg}
                    onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                    placeholder="0.5"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {!formData.is_digital && (
          <Card className="bg-brand-dark-card border border-brand-dark-border">
            <CardHeader>
              <CardTitle className="text-white">Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.category !== 'wood' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-300">Weight (kg)</label>
                    <Input
                      type="number"
                      step="0.01"
                      className="bg-brand-dark border border-brand-dark-border text-white placeholder:text-zinc-500"
                      value={formData.weight_kg}
                      onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                      placeholder="0.5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-300">Dimensions</label>
                    <Input
                      className="bg-brand-dark border border-brand-dark-border text-white placeholder:text-zinc-500"
                      value={formData.dimensions}
                      onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                      placeholder="11 x 3.5 inches"
                    />
                  </div>
                </div>
              )}
              {formData.category !== 'wood' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-300">Head Wood</label>
                  <select
                    className="w-full h-10 rounded-md border border-brand-dark-border bg-brand-dark text-white px-3"
                    value={formData.head_wood}
                    onChange={(e) => setFormData({ ...formData, head_wood: e.target.value })}
                  >
                    <option value="">Select head wood...</option>
                    {availableWoods.map((wood) => (
                      <option key={wood.id} value={wood.name}>{wood.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-300">Handle Wood</label>
                  <select
                    className="w-full h-10 rounded-md border border-brand-dark-border bg-brand-dark text-white px-3"
                    value={formData.handle_wood}
                    onChange={(e) => setFormData({ ...formData, handle_wood: e.target.value })}
                  >
                    <option value="">Select handle wood...</option>
                    {availableWoods.map((wood) => (
                      <option key={wood.id} value={wood.name}>{wood.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              )}
            </CardContent>
          </Card>
          )}

          {!formData.is_digital && (
          <Card className="bg-brand-dark-card border border-brand-dark-border">
            <CardHeader>
              <CardTitle className="text-white">Shipping Costs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-300">UK Shipping (£)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.shipping_uk}
                    onChange={(e) => setFormData({ ...formData, shipping_uk: e.target.value })}
                    placeholder="5.99"
                    className="bg-brand-dark border border-brand-dark-border text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-300">Europe Shipping (£)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.shipping_europe}
                    onChange={(e) => setFormData({ ...formData, shipping_europe: e.target.value })}
                    placeholder="15.99"
                    className="bg-brand-dark border border-brand-dark-border text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-300">Rest of World (£)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.shipping_world}
                    onChange={(e) => setFormData({ ...formData, shipping_world: e.target.value })}
                    placeholder="25.99"
                    className="bg-brand-dark border border-brand-dark-border text-white"
                  />
                </div>
              </div>
              <p className="text-xs text-zinc-500">Set to 0 for free shipping. These costs will be shown to the customer at checkout.</p>
            </CardContent>
          </Card>
          )}

          <div className="flex gap-4">
            <Button type="submit" size="lg" className="flex-1" disabled={loading || uploadingFiles}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={() => router.back()} disabled={loading}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
