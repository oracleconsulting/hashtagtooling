import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { BreadcrumbJsonLd } from '@/components/BreadcrumbJsonLd'

export const revalidate = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const metadata: Metadata = {
  title: 'Journal',
  description: 'Woodworking thoughts, tool builds, material discoveries and workshop updates from the #TOOLING workshop.',
  alternates: { canonical: 'https://hashtag.guru/blog' },
  openGraph: {
    title: 'Journal | #TOOLING',
    description: 'Woodworking thoughts, tool builds, material discoveries and workshop updates from the #TOOLING workshop.',
    url: 'https://hashtag.guru/blog',
  },
}

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  featured_image_url: string | null
  published_at: string
}

export default async function BlogPage() {
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, featured_image_url, published_at')
    .eq('published', true)
    .order('published_at', { ascending: false })

  const allPosts: BlogPost[] = posts || []

  return (
    <>
    <BreadcrumbJsonLd items={[
      { name: 'Home', url: 'https://hashtag.guru' },
      { name: 'Journal', url: 'https://hashtag.guru/blog' },
    ]} />
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      {/* Page header */}
      <div className="mb-12">
        <h1 className="font-heading text-5xl font-bold text-brand-orange mb-3">Journal</h1>
        <p className="text-zinc-400 text-lg">
          Woodworking thoughts, tool builds, material discoveries and workshop updates.
        </p>
      </div>

      {allPosts.length === 0 ? (
        <p className="text-zinc-500 text-center py-16">No posts yet — check back soon.</p>
      ) : (
        <div className="space-y-10">
          {allPosts.map((post, index) => (
            <article
              key={post.id}
              className={`${index < allPosts.length - 1 ? 'pb-10 border-b border-brand-dark-border' : ''}`}
            >
              <Link href={`/blog/${post.slug}`} className="group block">
                <div className={`grid gap-6 ${post.featured_image_url ? 'md:grid-cols-3' : ''}`}>
                  {post.featured_image_url && (
                    <div className="md:col-span-1 aspect-[4/3] rounded-lg overflow-hidden bg-brand-dark-card">
                      <img
                        src={post.featured_image_url}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className={post.featured_image_url ? 'md:col-span-2' : ''}>
                    <p className="text-zinc-500 text-sm mb-2">
                      {new Date(post.published_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                    <h2 className="font-heading text-2xl font-bold text-white group-hover:text-brand-orange transition-colors mb-3 leading-snug">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-zinc-400 leading-relaxed line-clamp-3">{post.excerpt}</p>
                    )}
                    <span className="inline-block mt-4 text-brand-orange text-sm font-medium group-hover:underline">
                      Read more →
                    </span>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
    </>
  )
}
