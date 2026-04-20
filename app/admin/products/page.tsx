'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { Pencil, Trash2, Plus, Loader2 } from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  stock_status: string
  image_url: string
}

function ReviewRequestButton({ product }: { product: { id: string; name: string } }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [reviewUrl, setReviewUrl] = useState('')

  const send = async () => {
    if (!name.trim() || !email.trim()) return
    setStatus('loading')
    try {
      const res = await fetch('/api/reviews/create-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: name.trim(),
          customer_email: email.trim(),
          product_id: product.id,
          source: 'historical',
          send_email: true,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setStatus('sent')
        setReviewUrl(data.review_url || '')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <div className="mt-2 p-3 bg-green-900/20 border border-green-800 rounded text-sm">
        <p className="text-green-400 font-medium text-xs">&#10003; Review request sent to {email}</p>
        {reviewUrl && (
          <button
            onClick={() => { navigator.clipboard.writeText(reviewUrl) }}
            className="text-green-600 text-xs mt-1 hover:underline"
          >
            Copy review link
          </button>
        )}
      </div>
    )
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full mt-1 text-xs"
        onClick={() => setOpen(true)}
      >
        Request Review
      </Button>
    )
  }

  return (
    <div className="mt-2 p-3 bg-zinc-900 border border-zinc-700 rounded space-y-2">
      <p className="text-xs text-zinc-400 font-medium truncate">{product.name}</p>
      <input
        type="text"
        placeholder="Customer name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-white text-sm placeholder:text-zinc-500"
      />
      <input
        type="email"
        placeholder="Customer email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-white text-sm placeholder:text-zinc-500"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1 text-xs"
          onClick={send}
          disabled={status === 'loading' || !name.trim() || !email.trim()}
        >
          {status === 'loading' ? 'Sending...' : 'Send'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => { setOpen(false); setName(''); setEmail('') }}
        >
          Cancel
        </Button>
      </div>
      {status === 'error' && <p className="text-red-400 text-xs">Failed to send. Try again.</p>}
    </div>
  )
}

export default function AdminProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'live' | 'drafts' | 'gallery'>('live')
  const [reviewStatusMap, setReviewStatusMap] = useState<Map<string, string>>(new Map())

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
      const [{ data, error }, { data: reviewedProducts }] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('product_reviews').select('product_id, token_used, published').not('product_id', 'is', null),
      ])

      if (error) throw error
      setProducts(data || [])

      const statusMap = new Map<string, string>()
      ;(reviewedProducts || []).forEach((r: { product_id: string; token_used: boolean; published: boolean }) => {
        const current = statusMap.get(r.product_id)
        if (r.published) statusMap.set(r.product_id, 'published')
        else if (r.token_used && current !== 'published') statusMap.set(r.product_id, 'received')
        else if (!current) statusMap.set(r.product_id, 'invited')
      })
      setReviewStatusMap(statusMap)
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
          <Link href="/admin/inventory">
            <Button size="lg" variant="outline">
              Inventory
            </Button>
          </Link>
          <Link href="/admin/workshop-stock">
            <Button size="lg" variant="outline">
              Workshop Stock
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
        const liveProducts = products.filter(p => !['sold', 'draft'].includes(p.stock_status))
        const draftProducts = products.filter(p => p.stock_status === 'draft')
        const galleryProducts = products.filter(p => p.stock_status === 'sold')
        const displayProducts = activeTab === 'live' ? liveProducts : activeTab === 'drafts' ? draftProducts : galleryProducts
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
              onClick={() => setActiveTab('drafts')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                activeTab === 'drafts'
                  ? 'bg-brand-orange text-brand-dark'
                  : 'border border-brand-dark-border text-zinc-300 hover:border-zinc-500'
              }`}
            >
              Drafts ({draftProducts.length})
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

          {activeTab === 'drafts' && (
            <div className="mb-6 p-4 rounded-lg border border-brand-dark-border bg-brand-dark-card">
              <p className="text-zinc-400 text-sm">
                Draft products are hidden from the public site. Edit each one to add images, then change its status to <strong className="text-white">Sold</strong> (for gallery) or <strong className="text-white">In Stock</strong> (for shop) when ready.
              </p>
            </div>
          )}

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
                {product.stock_status === 'sold' && (
                  reviewStatusMap.get(product.id) === 'published'
                    ? <span className="text-green-500 text-xs mt-2 block">★ Review published</span>
                    : reviewStatusMap.get(product.id) === 'received'
                    ? <span className="text-brand-orange text-xs mt-2 block">Review pending approval</span>
                    : reviewStatusMap.get(product.id) === 'invited'
                    ? <span className="text-zinc-500 text-xs mt-2 block">Review invited — awaiting</span>
                    : <ReviewRequestButton product={product} />
                )}
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



