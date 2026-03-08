'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BlogEditor, { PostFormData } from '@/components/BlogEditor'
import { Loader2 } from 'lucide-react'

export default function AdminBlogEditPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [post, setPost] = useState<PostFormData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('admin_auth')
    if (!isAuthenticated) {
      router.push('/admin')
      return
    }
    loadPost()
  }, [id, router])

  const loadPost = async () => {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      setError('Post not found')
    } else {
      setPost({
        id: data.id,
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt || '',
        content: data.content || '',
        featured_image_url: data.featured_image_url || '',
        published: data.published,
        published_at: data.published_at || '',
        meta_title: data.meta_title || '',
        meta_description: data.meta_description || '',
      })
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-red-400">{error || 'Post not found'}</p>
      </div>
    )
  }

  return <BlogEditor mode="edit" initialData={post} />
}
