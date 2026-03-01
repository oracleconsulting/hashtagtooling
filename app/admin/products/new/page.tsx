'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { Upload, X } from 'lucide-react'

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [videoUrl, setVideoUrl] = useState('')
  const [availableWoods, setAvailableWoods] = useState<{ id: string; name: string; color_hex: string }[]>([])
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'mallet',
    stock_status: 'in_stock',
    weight_kg: '',
    dimensions: '',
    head_wood: '',
    handle_wood: '',
    shipping_uk: '5.99',
    shipping_europe: '15.99',
    shipping_world: '25.99',
  })

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('admin_auth')
    if (!isAuthenticated) {
      router.push('/admin')
    }
  }, [router])

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

  const handleFileUpload = async (files: FileList | null, type: 'image' | 'video') => {
    if (!files || files.length === 0) return

    setUploadingFiles(true)
    const uploadedUrls: string[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        let file = files[i]
        let fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'

        // Convert HEIC/HEIF to JPEG (dynamic import: heic2any uses window, so load only in browser)
        if (fileExt === 'heic' || fileExt === 'heif' || file.type === 'image/heic' || file.type === 'image/heif') {
          try {
            const heic2any = (await import('heic2any')).default
            const convertedBlob = await heic2any({
              blob: file,
              toType: 'image/jpeg',
              quality: 0.9,
            })
            const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob
            file = new File(
              [blob],
              file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg'),
              { type: 'image/jpeg' }
            )
            fileExt = 'jpg'
          } catch (conversionError) {
            console.error('HEIC conversion failed:', conversionError)
            alert(`Could not convert ${file.name}. Try converting to JPG on your phone before uploading.`)
            continue
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

        const { data } = supabase.storage
          .from('products')
          .getPublicUrl(filePath)

        if (data?.publicUrl) {
          uploadedUrls.push(data.publicUrl)
        }
      }

      if (type === 'image') {
        setImageUrls([...imageUrls, ...uploadedUrls])
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
    setImageUrls(imageUrls.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.from('products').insert([
        {
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          category: formData.category,
          stock_status: formData.stock_status,
          image_url: imageUrls[0] || 'https://placehold.co/600x400/666/white?text=No+Image',
          metadata: {
            images: imageUrls,
            video: videoUrl,
            weight_kg: formData.weight_kg,
            dimensions: formData.dimensions,
            head_wood: formData.head_wood,
            handle_wood: formData.handle_wood,
            shipping: {
              uk: parseFloat(formData.shipping_uk) || 0,
              europe: parseFloat(formData.shipping_europe) || 0,
              world: parseFloat(formData.shipping_world) || 0,
            },
          }
        }
      ])

      if (error) throw error

      alert('Product added successfully!')
      router.push('/admin/products')
    } catch (error) {
      console.error('Error adding product:', error)
      alert('Failed to add product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="font-heading text-4xl font-bold text-brand-orange">Add New Product</h1>
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card className="bg-brand-dark-card border border-brand-dark-border">
            <CardHeader>
              <CardTitle className="text-white">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-zinc-300">
                  Product Name *
                </label>
                <Input
                  required
                  className="bg-brand-dark border border-brand-dark-border text-white placeholder:text-zinc-500"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Walnut Carving Mallet"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-zinc-300">
                  Description *
                </label>
                <Textarea
                  required
                  className="bg-brand-dark border border-brand-dark-border text-white placeholder:text-zinc-500"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of your product..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-300">
                    Category *
                  </label>
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
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-300">
                    Stock Status *
                  </label>
                  <select
                    className="w-full h-10 rounded-md border border-brand-dark-border bg-brand-dark text-white px-3"
                    value={formData.stock_status}
                    onChange={(e) => setFormData({ ...formData, stock_status: e.target.value })}
                  >
                    <option value="in_stock">In Stock</option>
                    <option value="made_to_order">Made to Order</option>
                    <option value="out_of_stock">Out of Stock</option>
                    <option value="sold">Sold</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-zinc-300">
                  Price (£) *
                </label>
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
            </CardContent>
          </Card>

          {/* Images & Video */}
          <Card className="bg-brand-dark-card border border-brand-dark-border">
            <CardHeader>
              <CardTitle className="text-white">Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-zinc-300">
                  Product Images
                </label>
                <div className="border-2 border-dashed border-brand-dark-border rounded-lg p-8 text-center">
                  <Upload className="mx-auto h-12 w-12 text-zinc-500 mb-4" />
                  <input
                    type="file"
                    accept="image/*,.heic,.HEIC"
                    multiple
                    onChange={(e) => handleFileUpload(e.target.files, 'image')}
                    className="hidden"
                    id="image-upload"
                    disabled={uploadingFiles}
                  />
                  <Button
                    type="button"
                    disabled={uploadingFiles}
                    onClick={() => document.getElementById('image-upload')?.click()}
                  >
                    {uploadingFiles ? 'Uploading...' : 'Upload Images'}
                  </Button>
                  <p className="text-sm text-zinc-500 mt-2">
                    JPG, PNG, WEBP (max 5MB each)
                  </p>
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
                <label className="block text-sm font-medium mb-2 text-zinc-300">
                  Product Video (Optional)
                </label>
                <div className="border-2 border-dashed border-brand-dark-border rounded-lg p-8 text-center">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleFileUpload(e.target.files, 'video')}
                    className="hidden"
                    id="video-upload"
                    disabled={uploadingFiles}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploadingFiles}
                    onClick={() => document.getElementById('video-upload')?.click()}
                  >
                    {uploadingFiles ? 'Uploading...' : 'Upload Video'}
                  </Button>
                </div>
                {videoUrl && (
                  <p className="text-sm text-green-600 mt-2">✓ Video uploaded</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Specifications */}
          <Card className="bg-brand-dark-card border border-brand-dark-border">
            <CardHeader>
              <CardTitle className="text-white">Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-300">
                    Weight (kg)
                  </label>
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
                  <label className="block text-sm font-medium mb-2 text-zinc-300">
                    Dimensions
                  </label>
                  <Input
                    className="bg-brand-dark border border-brand-dark-border text-white placeholder:text-zinc-500"
                    value={formData.dimensions}
                    onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                    placeholder="11 x 3.5 inches"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-300">
                    Head Wood
                  </label>
                  <select
                    className="w-full h-10 rounded-md border border-brand-dark-border bg-brand-dark text-white px-3"
                    value={formData.head_wood}
                    onChange={(e) => setFormData({ ...formData, head_wood: e.target.value })}
                  >
                    <option value="">Select head wood...</option>
                    {availableWoods.map(wood => (
                      <option key={wood.id} value={wood.name}>{wood.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-300">
                    Handle Wood
                  </label>
                  <select
                    className="w-full h-10 rounded-md border border-brand-dark-border bg-brand-dark text-white px-3"
                    value={formData.handle_wood}
                    onChange={(e) => setFormData({ ...formData, handle_wood: e.target.value })}
                  >
                    <option value="">Select handle wood...</option>
                    {availableWoods.map(wood => (
                      <option key={wood.id} value={wood.name}>{wood.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Costs */}
          <Card className="bg-brand-dark-card border border-brand-dark-border">
            <CardHeader>
              <CardTitle className="text-white">Shipping Costs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-300">
                    UK Shipping (£)
                  </label>
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
                  <label className="block text-sm font-medium mb-2 text-zinc-300">
                    Europe Shipping (£)
                  </label>
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
                  <label className="block text-sm font-medium mb-2 text-zinc-300">
                    Rest of World (£)
                  </label>
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
              <p className="text-xs text-zinc-500">
                Set to 0 for free shipping. These costs will be shown to the customer at checkout.
              </p>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Button
              type="submit"
              size="lg"
              className="flex-1"
              disabled={loading || uploadingFiles}
            >
              {loading ? 'Adding Product...' : 'Add Product'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

