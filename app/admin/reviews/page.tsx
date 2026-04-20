'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'
import { AdminProductPreview } from '@/components/AdminProductPreview'

interface Review {
  id: string
  product_id: string | null
  order_id: string | null
  customer_name: string
  customer_email: string
  rating: number
  title: string | null
  body: string | null
  verified_purchase: boolean
  published: boolean
  review_token: string
  token_used: boolean
  source: string
  product_description: string | null
  created_at: string
  published_at: string | null
}

interface Product {
  id: string
  name: string
  image_url?: string
  category?: string
  created_at?: string
  description?: string
  price?: number
  stock_status?: string
  metadata?: {
    images?: string[]
    head_wood?: string
    handle_wood?: string
  }
}

export default function AdminReviewsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState<Review[]>([])
  const [products, setProducts] = useState<Product[]>([])

  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteProductId, setInviteProductId] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [productDropdownOpen, setProductDropdownOpen] = useState(false)
  const [inviteDescription, setInviteDescription] = useState('')
  const [inviteSource, setInviteSource] = useState('historical')
  const [inviting, setInviting] = useState(false)
  const [inviteResult, setInviteResult] = useState<{ url: string } | null>(null)

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('admin_auth')
    if (!isAuthenticated) { router.push('/admin'); return }
    loadData()
  }, [router])

  const loadData = async () => {
    try {
      const [reviewsRes, productsRes] = await Promise.all([
        supabase.from('product_reviews').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('id, name, image_url, category, created_at, description, price, stock_status, metadata').is('parent_product_id', null).in('stock_status', ['in_stock', 'made_to_order', 'sold']).order('name'),
      ])
      setReviews((reviewsRes.data || []) as Review[])
      setProducts((productsRes.data || []) as Product[])
    } catch (err) {
      console.error('Error loading reviews:', err)
    } finally {
      setLoading(false)
    }
  }

  const pending = reviews.filter((r) => r.token_used && !r.published && r.rating > 0)
  const published = reviews.filter((r) => r.published)
  const invited = reviews.filter((r) => !r.token_used)
  const avgRating = published.length > 0
    ? (published.reduce((s, r) => s + r.rating, 0) / published.length).toFixed(1)
    : '—'

  const reviewedProductIds = new Set(
    reviews.filter((r) => r.product_id).map((r) => r.product_id)
  )
  const availableProducts = products.filter((p) => !reviewedProductIds.has(p.id))
  const selectedProduct = availableProducts.find((p) => p.id === inviteProductId) || null
  const filteredProducts = availableProducts.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  )

  const approveReview = async (id: string) => {
    await supabase.from('product_reviews').update({ published: true, published_at: new Date().toISOString() }).eq('id', id)
    loadData()
  }

  const rejectReview = async (id: string) => {
    if (!confirm('Delete this review?')) return
    await supabase.from('product_reviews').delete().eq('id', id)
    loadData()
  }

  const unpublishReview = async (id: string) => {
    await supabase.from('product_reviews').update({ published: false, published_at: null }).eq('id', id)
    loadData()
  }

  const sendInvitation = async () => {
    if (!inviteName.trim() || !inviteEmail.trim()) return
    setInviting(true)
    setInviteResult(null)
    try {
      const res = await fetch('/api/reviews/create-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: inviteName.trim(),
          customer_email: inviteEmail.trim(),
          product_id: inviteProductId || null,
          source: inviteSource,
          product_description: inviteDescription.trim() || null,
          send_email: true,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setInviteResult({ url: data.review_url })
        setInviteName('')
        setInviteEmail('')
        setInviteProductId('')
        setProductSearch('')
        setInviteDescription('')
        loadData()
      } else {
        alert(data.error || 'Failed to send invitation')
      }
    } catch {
      alert('Connection error')
    } finally {
      setInviting(false)
    }
  }

  const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n)

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-heading text-4xl font-bold text-brand-orange">Reviews</h1>
        <Link href="/admin/dashboard"><Button variant="outline" size="sm">Dashboard</Button></Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <Card className="bg-brand-dark-card border border-brand-dark-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-brand-orange">{published.length}</p>
            <p className="text-zinc-400 text-xs">Published</p>
          </CardContent>
        </Card>
        <Card className="bg-brand-dark-card border border-brand-dark-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-400">{pending.length}</p>
            <p className="text-zinc-400 text-xs">Pending Approval</p>
          </CardContent>
        </Card>
        <Card className="bg-brand-dark-card border border-brand-dark-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-zinc-400">{invited.length}</p>
            <p className="text-zinc-400 text-xs">Invited (awaiting)</p>
          </CardContent>
        </Card>
        <Card className="bg-brand-dark-card border border-brand-dark-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-brand-orange">{avgRating}</p>
            <p className="text-zinc-400 text-xs">Average Rating</p>
          </CardContent>
        </Card>
      </div>

      {/* Invite form */}
      <Card className="bg-brand-dark-card border border-brand-dark-border mb-10">
        <CardHeader><CardTitle className="text-white">Invite Review</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Customer Name *</label>
              <Input className="bg-brand-dark border-brand-dark-border text-white placeholder:text-zinc-500" value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="John Smith" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Customer Email *</label>
              <Input className="bg-brand-dark border-brand-dark-border text-white placeholder:text-zinc-500" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="john@example.com" type="email" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Link to Product (optional)</label>
              <div className="relative">
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => { setProductSearch(e.target.value); setProductDropdownOpen(true) }}
                  onFocus={() => setProductDropdownOpen(true)}
                  placeholder="Search products..."
                  className="w-full h-10 px-3 py-2 bg-brand-dark border border-brand-dark-border rounded-md text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-orange"
                />
                {productDropdownOpen && productSearch.length > 0 && (
                  <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg max-h-64 overflow-y-auto shadow-lg">
                    <button
                      type="button"
                      onClick={() => { setInviteProductId(''); setProductSearch(''); setProductDropdownOpen(false) }}
                      className="w-full px-3 py-2 text-left text-sm text-zinc-400 hover:bg-zinc-800 flex items-center gap-3"
                    >
                      General review (no specific product)
                    </button>
                    {filteredProducts.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => { setInviteProductId(p.id); setProductSearch(p.name); setProductDropdownOpen(false) }}
                        className="w-full px-3 py-2 text-left text-sm text-white hover:bg-zinc-800 flex items-center gap-3"
                      >
                        {p.image_url && !p.image_url.includes('placehold') ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={p.metadata?.images?.[0] || p.image_url} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-zinc-800 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="truncate">{p.name}</p>
                          {p.category && p.created_at && (
                            <p className="text-zinc-500 text-xs">{p.category} · {new Date(p.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</p>
                          )}
                        </div>
                      </button>
                    ))}
                    {filteredProducts.length === 0 && (
                      <p className="px-3 py-2 text-sm text-zinc-500">No matching products</p>
                    )}
                  </div>
                )}
              </div>
              <p className="text-xs text-zinc-500 mt-1">{availableProducts.length} products awaiting review · {reviewedProductIds.size} invited/reviewed</p>
              <AdminProductPreview product={selectedProduct} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Source</label>
              <select
                className="w-full h-10 rounded-md border border-brand-dark-border bg-brand-dark text-white px-3"
                value={inviteSource}
                onChange={(e) => setInviteSource(e.target.value)}
              >
                <option value="historical">Historical order</option>
                <option value="instagram">Instagram sale</option>
                <option value="website">Website order</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Product Description (optional — for items not in database)</label>
            <Input
              className="bg-brand-dark border-brand-dark-border text-white placeholder:text-zinc-500"
              value={inviteDescription}
              onChange={(e) => setInviteDescription(e.target.value)}
              placeholder="e.g. Cocobolo Carving Mallet, 2023"
            />
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={sendInvitation} disabled={inviting || !inviteName.trim() || !inviteEmail.trim()}>
              {inviting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : 'Send Invitation'}
            </Button>
            {inviteResult && (
              <div className="flex-1">
                <p className="text-green-400 text-sm mb-1">Invitation sent! Review link:</p>
                <code className="text-xs text-zinc-300 bg-brand-dark px-3 py-1.5 rounded block break-all">{inviteResult.url}</code>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pending reviews */}
      {pending.length > 0 && (
        <section className="mb-10">
          <h2 className="font-heading text-xl font-bold text-amber-400 mb-4">Pending Approval ({pending.length})</h2>
          <div className="space-y-4">
            {pending.map((r) => (
              <Card key={r.id} className="bg-brand-dark-card border border-amber-500/30">
                <CardContent className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="text-brand-orange text-lg tracking-wider">{stars(r.rating)}</p>
                      {r.title && <p className="font-semibold text-white mt-1">{r.title}</p>}
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-white">{r.customer_name}</p>
                      <p className="text-zinc-500">{r.customer_email}</p>
                      <p className="text-zinc-600 text-xs">{new Date(r.created_at).toLocaleDateString('en-GB')}</p>
                      <span className="text-xs text-zinc-600 capitalize">{r.source}</span>
                    </div>
                  </div>
                  {r.body && <p className="text-zinc-300 mb-4">{r.body}</p>}
                  {r.product_description && <p className="text-xs text-zinc-500 mb-2">Product: {r.product_description}</p>}
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => approveReview(r.id)}>Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => rejectReview(r.id)}>Reject</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Published reviews */}
      <section className="mb-10">
        <h2 className="font-heading text-xl font-bold text-white mb-4">Published ({published.length})</h2>
        {published.length === 0 ? (
          <p className="text-zinc-500 text-sm">No published reviews yet. Approve pending reviews or invite customers above.</p>
        ) : (
          <div className="space-y-3">
            {published.map((r) => {
              const productLabel = products.find((p) => p.id === r.product_id)?.name || r.product_description || '—'
              return (
                <Card key={r.id} className="bg-brand-dark-card border border-brand-dark-border">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-brand-orange">{stars(r.rating)}</span>
                        <span className="text-white font-medium">{r.customer_name}</span>
                        {r.title && <span className="text-zinc-400 text-sm">— {r.title}</span>}
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-zinc-500">{productLabel}</span>
                        <span className="text-zinc-600">{new Date(r.created_at).toLocaleDateString('en-GB')}</span>
                        <Button size="sm" variant="outline" onClick={() => unpublishReview(r.id)}>Unpublish</Button>
                      </div>
                    </div>
                    {r.body && <p className="text-zinc-400 text-sm mt-2">{r.body}</p>}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      {/* Invited but not yet submitted */}
      {invited.length > 0 && (
        <section>
          <h2 className="font-heading text-xl font-bold text-zinc-400 mb-4">Awaiting Response ({invited.length})</h2>
          <div className="space-y-2">
            {invited.map((r) => (
              <Card key={r.id} className="bg-brand-dark-card border border-brand-dark-border">
                <CardContent className="p-4 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-white">{r.customer_name}</span>
                    <span className="text-zinc-500">{r.customer_email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-600 capitalize">{r.source}</span>
                    <span className="text-zinc-600">{new Date(r.created_at).toLocaleDateString('en-GB')}</span>
                    <Button size="sm" variant="outline" onClick={() => rejectReview(r.id)}>Delete</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
