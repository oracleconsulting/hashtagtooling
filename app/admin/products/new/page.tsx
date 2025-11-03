'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { Upload, X } from 'lucide-react'
import { WOOD_TYPES } from '@/lib/constants'

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [videoUrl, setVideoUrl] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'mallet',
    stock_status: 'in_stock',
    weight_kg: '',
    dimensions: '',
    wood_types: [] as string[],
  })

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('admin_auth')
    if (!isAuthenticated) {
      router.push('/admin')
    }
  }, [router])

  const handleFileUpload = async (files: FileList | null, type: 'image' | 'video') => {
    if (!files || files.length === 0) return

    setUploadingFiles(true)
    const uploadedUrls: string[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
        const filePath = `products/${fileName}`

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(filePath, file)

        if (uploadError) {
          console.error('Upload error:', uploadError)
          alert(`Failed to upload ${file.name}`)
          continue
        }

        // Get public URL
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

  const calculateShipping = () => {
    const weight = parseFloat(formData.weight_kg) || 0
    
    if (weight === 0) return { uk: 0, europe: 0, world: 0 }
    
    // Basic shipping calculation
    let uk = 5.99
    let europe = 15.99
    let world = 25.99
    
    // Add extra for heavy items
    if (weight > 2) {
      const extraKg = weight - 2
      uk += extraKg * 2
      europe += extraKg * 5
      world += extraKg * 8
    }
    
    return { uk, europe, world }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const shipping = calculateShipping()
      
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
            wood_types: formData.wood_types,
            shipping,
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

  const shipping = calculateShipping()

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Add New Product</h1>
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Product Name *
                </label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Walnut Carving Mallet"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Description *
                </label>
                <Textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of your product..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Category *
                  </label>
                  <select
                    className="w-full h-10 rounded-md border border-zinc-300 px-3"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="mallet">Mallet</option>
                    <option value="awl">Awl</option>
                    <option value="square">Engineering Square</option>
                    <option value="coin">EDC Coin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Stock Status *
                  </label>
                  <select
                    className="w-full h-10 rounded-md border border-zinc-300 px-3"
                    value={formData.stock_status}
                    onChange={(e) => setFormData({ ...formData, stock_status: e.target.value })}
                  >
                    <option value="in_stock">In Stock</option>
                    <option value="made_to_order">Made to Order</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Price (£) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="89.99"
                />
              </div>
            </CardContent>
          </Card>

          {/* Images & Video */}
          <Card>
            <CardHeader>
              <CardTitle>Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Product Images
                </label>
                <div className="border-2 border-dashed border-zinc-300 rounded-lg p-8 text-center">
                  <Upload className="mx-auto h-12 w-12 text-zinc-400 mb-4" />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileUpload(e.target.files, 'image')}
                    className="hidden"
                    id="image-upload"
                    disabled={uploadingFiles}
                  />
                  <label htmlFor="image-upload">
                    <Button type="button" disabled={uploadingFiles} asChild>
                      <span className="cursor-pointer">
                        {uploadingFiles ? 'Uploading...' : 'Upload Images'}
                      </span>
                    </Button>
                  </label>
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
                <label className="block text-sm font-medium mb-2">
                  Product Video (Optional)
                </label>
                <div className="border-2 border-dashed border-zinc-300 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleFileUpload(e.target.files, 'video')}
                    className="hidden"
                    id="video-upload"
                    disabled={uploadingFiles}
                  />
                  <label htmlFor="video-upload">
                    <Button type="button" variant="outline" disabled={uploadingFiles} asChild>
                      <span className="cursor-pointer">
                        {uploadingFiles ? 'Uploading...' : 'Upload Video'}
                      </span>
                    </Button>
                  </label>
                </div>
                {videoUrl && (
                  <p className="text-sm text-green-600 mt-2">✓ Video uploaded</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Weight (kg)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.weight_kg}
                    onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                    placeholder="0.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Dimensions
                  </label>
                  <Input
                    value={formData.dimensions}
                    onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                    placeholder="11 x 3.5 inches"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Wood Types Used
                </label>
                <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-2">
                    {WOOD_TYPES.map((wood) => (
                      <label key={wood.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.wood_types.includes(wood.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                wood_types: [...formData.wood_types, wood.id]
                              })
                            } else {
                              setFormData({
                                ...formData,
                                wood_types: formData.wood_types.filter(id => id !== wood.id)
                              })
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{wood.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Calculator */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Calculator</CardTitle>
            </CardHeader>
            <CardContent>
              {formData.weight_kg ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-zinc-600">UK Shipping:</span>
                    <span className="font-semibold">£{shipping.uk.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-zinc-600">Europe Shipping:</span>
                    <span className="font-semibold">£{shipping.europe.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-zinc-600">Rest of World:</span>
                    <span className="font-semibold">£{shipping.world.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-4">
                    * Calculated based on weight. Adjust weight above to recalculate.
                  </p>
                </div>
              ) : (
                <p className="text-zinc-500 text-sm">
                  Enter product weight to calculate shipping costs
                </p>
              )}
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

