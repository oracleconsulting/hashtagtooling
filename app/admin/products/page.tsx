'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { Pencil, Trash2, Plus } from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  stock_status: string
  image_url: string
}

export default function AdminProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'live' | 'gallery'>('live')

  useEffect(() => {
    // Check auth
    const isAuthenticated = sessionStorage.getItem('admin_auth')
    if (!isAuthenticated) {
      router.push('/admin')
      return
    }

    loadProducts()
  }, [router])

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Failed to delete product')
    }
  }

  const markAsSold = async (id: string, name: string) => {
    if (!confirm(`Mark "${name}" as sold?`)) return
    try {
      const { error } = await supabase
        .from('products')
        .update({ stock_status: 'sold' })
        .eq('id', id)
      if (error) throw error
      loadProducts()
    } catch (error) {
      console.error('Error marking as sold:', error)
      alert('Failed to update — please try again.')
    }
  }

  const logout = () => {
    sessionStorage.removeItem('admin_auth')
    router.push('/admin')
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-zinc-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-heading text-4xl font-bold text-brand-orange">Manage Products</h1>
        <div className="flex gap-4">
          <Link href="/admin/dashboard">
            <Button size="lg" variant="outline">
              Dashboard
            </Button>
          </Link>
          <Link href="/admin/site-images">
            <Button size="lg" variant="outline">
              Site Images
            </Button>
          </Link>
          <Link href="/admin/materials">
            <Button size="lg" variant="outline">
              Materials & Pricing
            </Button>
          </Link>
          <Link href="/admin/orders">
            <Button size="lg" variant="outline">
              Orders
            </Button>
          </Link>
          <Link href="/admin/commissions">
            <Button size="lg" variant="outline">
              Commissions
            </Button>
          </Link>
          <Link href="/admin/products/new">
            <Button size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Add Product
            </Button>
          </Link>
          <Button variant="outline" onClick={logout}>
            Logout
          </Button>
        </div>
      </div>

      {(() => {
        const liveProducts = products.filter(p => p.stock_status !== 'sold')
        const galleryProducts = products.filter(p => p.stock_status === 'sold')
        const displayProducts = activeTab === 'live' ? liveProducts : galleryProducts
        return (<>
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('live')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                activeTab === 'live'
                  ? 'bg-brand-orange text-brand-dark'
                  : 'border border-brand-dark-border text-zinc-300 hover:border-zinc-500'
              }`}
            >
              Live Products ({liveProducts.length})
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                activeTab === 'gallery'
                  ? 'bg-brand-orange text-brand-dark'
                  : 'border border-brand-dark-border text-zinc-300 hover:border-zinc-500'
              }`}
            >
              Gallery / Sold ({galleryProducts.length})
            </button>
          </div>

          {activeTab === 'gallery' && (
            <div className="mb-6 p-4 rounded-lg border border-brand-dark-border bg-brand-dark-card">
              <p className="text-zinc-400 text-sm">
                Historic sold pieces shown on the <a href="/gallery" className="text-brand-orange underline">/gallery</a> page. Upload images to populate the gallery timeline.
              </p>
            </div>
          )}

      {displayProducts.length === 0 ? (
        <Card className="bg-brand-dark-card border border-brand-dark-border">
          <CardContent className="p-12 text-center">
            <p className="text-zinc-400 mb-4">{activeTab === 'live' ? 'No live products yet' : 'No sold/gallery items yet'}</p>
            <Link href="/admin/products/new">
              <Button>Add Your First Product</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayProducts.map((product) => (
            <Card key={product.id} className="bg-brand-dark-card border border-brand-dark-border">
              <CardContent className="p-4">
                <div className="aspect-square bg-brand-dark rounded-lg mb-4 overflow-hidden">
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-semibold mb-1 text-white">{product.name}</h3>
                <p className="text-sm text-zinc-400 mb-2 line-clamp-2">
                  {product.description}
                </p>
                <p className="text-lg font-bold mb-4 text-brand-orange">£{product.price.toFixed(2)}</p>
                <div className="flex gap-2">
                  <Link href={`/admin/products/edit/${product.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </Link>
                  {product.stock_status !== 'sold' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => markAsSold(product.id, product.name)}
                      className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                      title="Mark as Sold"
                    >
                      Sold
                    </Button>
                  )}
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => deleteProduct(product.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
        </>)
      })()}
    </div>
  )
}



