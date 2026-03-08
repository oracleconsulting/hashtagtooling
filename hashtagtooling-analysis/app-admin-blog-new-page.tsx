'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import BlogEditor from '@/components/BlogEditor'

export default function AdminBlogNewPage() {
  const router = useRouter()

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('admin_auth')
    if (!isAuthenticated) router.push('/admin')
  }, [router])

  return <BlogEditor mode="new" />
}
