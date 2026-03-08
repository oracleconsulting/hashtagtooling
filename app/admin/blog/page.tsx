'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { Loader2, Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

export default function AdminBlogPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState<BlogPost[]>([])

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('admin_auth')
    if (!isAuthenticated) {
      router.push('/admin')
      return
    }
    loadPosts()
  }, [router])

  const loadPosts = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('blog_posts')
      .select('id, title, slug, excerpt, published, published_at, created_at, updated_at')
      .order('created_at', { ascending: false })
    setPosts(data || [])
    setLoading(false)
  }

  const togglePublished = async (post: BlogPost) => {
    const updates: Partial<BlogPost> = {
      published: !post.published,
    }
    if (!post.published && !post.published_at) {
      updates.published_at = new Date().toISOString()
    }
    await supabase.from('blog_posts').update(updates).eq('id', post.id)
    loadPosts()
  }

  const deletePost = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    await supabase.from('blog_posts').delete().eq('id', id)
    loadPosts()
  }

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
        <h1 className="font-heading text-4xl font-bold text-brand-orange">Blog Posts</h1>
        <div className="flex gap-2">
          <Link href="/admin/dashboard">
            <Button variant="outline" size="sm">← Dashboard</Button>
          </Link>
          <Link href="/admin/blog/new">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Post
            </Button>
          </Link>
        </div>
      </div>

      {posts.length === 0 ? (
        <Card className="bg-brand-dark-card border border-brand-dark-border">
          <CardContent className="p-12 text-center">
            <p className="text-zinc-400 mb-4">No blog posts yet.</p>
            <Link href="/admin/blog/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Write Your First Post
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-brand-dark-card border border-brand-dark-border">
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-brand-dark-border">
                  <th className="text-left p-4 text-zinc-400 text-sm font-medium">Title</th>
                  <th className="text-left p-4 text-zinc-400 text-sm font-medium hidden md:table-cell">Slug</th>
                  <th className="text-center p-4 text-zinc-400 text-sm font-medium">Status</th>
                  <th className="text-left p-4 text-zinc-400 text-sm font-medium hidden lg:table-cell">Date</th>
                  <th className="text-center p-4 text-zinc-400 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} className="border-b border-brand-dark-border last:border-0 hover:bg-zinc-800/30 transition-colors">
                    <td className="p-4">
                      <p className="font-medium text-white">{post.title}</p>
                      {post.excerpt && (
                        <p className="text-zinc-500 text-sm mt-0.5 line-clamp-1">{post.excerpt}</p>
                      )}
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <span className="text-zinc-400 text-sm font-mono">{post.slug}</span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => togglePublished(post)}
                        title={post.published ? 'Click to unpublish' : 'Click to publish'}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                          post.published
                            ? 'bg-green-900/40 text-green-400 hover:bg-red-900/40 hover:text-red-400'
                            : 'bg-zinc-800 text-zinc-400 hover:bg-green-900/40 hover:text-green-400'
                        }`}
                      >
                        {post.published ? (
                          <><Eye className="h-3 w-3" /> Published</>
                        ) : (
                          <><EyeOff className="h-3 w-3" /> Draft</>
                        )}
                      </button>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <span className="text-zinc-400 text-sm">
                        {post.published_at
                          ? new Date(post.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                          : new Date(post.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 justify-center">
                        {post.published && (
                          <Link href={`/blog/${post.slug}`} target="_blank">
                            <Button size="sm" variant="outline" title="View live post">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                        <Link href={`/admin/blog/edit/${post.id}`}>
                          <Button size="sm" variant="outline">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deletePost(post.id, post.title)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
