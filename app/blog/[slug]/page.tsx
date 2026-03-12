import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

export const revalidate = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ---------------------------------------------------------------------------
// Minimal markdown → HTML (server-side, no dependency)
// ---------------------------------------------------------------------------
function renderMarkdown(md: string): string {
  if (!md) return ''
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Headings
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')

  // Bold + italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // Links and images
  html = html.replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1" />')
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')

  // Unordered lists
  html = html.replace(/(^- .+$(\n|$))+/gm, (block) => {
    const items = block.trim().split('\n').map(l => `<li>${l.replace(/^- /, '')}</li>`).join('\n')
    return `<ul>\n${items}\n</ul>\n`
  })

  // Ordered lists
  html = html.replace(/(^\d+\. .+$(\n|$))+/gm, (block) => {
    const items = block.trim().split('\n').map(l => `<li>${l.replace(/^\d+\. /, '')}</li>`).join('\n')
    return `<ol>\n${items}\n</ol>\n`
  })

  // Blockquote
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')

  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr />')

  // Paragraphs
  const lines = html.split('\n')
  const result: string[] = []
  for (const line of lines) {
    const t = line.trim()
    if (!t) { result.push(''); continue }
    if (/^<(h[1-6]|ul|ol|li|blockquote|hr|img|p)/.test(t)) { result.push(t); continue }
    result.push(`<p>${t}</p>`)
  }
  return result.join('\n')
}

interface Props {
  params: Promise<{ slug: string }>
}

// ---------------------------------------------------------------------------
// generateMetadata
// ---------------------------------------------------------------------------
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const { data: post } = await supabase
    .from('blog_posts')
    .select('title, slug, excerpt, featured_image_url, meta_title, meta_description, published_at')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (!post) return { title: 'Post Not Found' }

  const title = post.meta_title || post.title
  const description = post.meta_description || post.excerpt || ''

  return {
    title,
    description,
    alternates: { canonical: `https://hashtag.guru/blog/${post.slug}` },
    openGraph: {
      title: `${title} | #TOOLING`,
      description,
      url: `https://hashtag.guru/blog/${post.slug}`,
      type: 'article',
      publishedTime: post.published_at,
      images: post.featured_image_url ? [{ url: post.featured_image_url }] : [],
    },
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (!post) notFound()

  const htmlContent = renderMarkdown(post.content || '')

  // Article JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.meta_description || post.excerpt || '',
    image: post.featured_image_url ? [post.featured_image_url] : [],
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: {
      '@type': 'Person',
      name: 'James',
      url: 'https://hashtag.guru/about',
    },
    publisher: {
      '@type': 'Organization',
      name: '#TOOLING',
      logo: { '@type': 'ImageObject', url: 'https://hashtag.guru/og-image.jpg' },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://hashtag.guru/blog/${post.slug}`,
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="container mx-auto px-4 py-16 max-w-3xl">
        {/* Breadcrumb */}
        <nav className="text-sm text-zinc-500 mb-8">
          <Link href="/blog" className="hover:text-brand-orange transition-colors">Journal</Link>
          <span className="mx-2">›</span>
          <span className="text-zinc-400">{post.title}</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <p className="text-zinc-500 text-sm mb-3">
            {new Date(post.published_at).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-white leading-tight mb-5">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="text-zinc-400 text-xl leading-relaxed">{post.excerpt}</p>
          )}
        </header>

        {/* Featured image */}
        {post.featured_image_url && (
          <div className="mb-10 rounded-lg overflow-hidden aspect-video bg-brand-dark-card">
            <img
              src={post.featured_image_url}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div
          className="blog-content"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />

        {/* Footer CTA */}
        <div className="mt-16 pt-8 border-t border-brand-dark-border">
          <p className="text-zinc-500 text-sm mb-4">
            Handcrafted tools from exotic timbers — made in the UK.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="inline-block px-5 py-2.5 bg-brand-orange text-brand-dark font-medium rounded hover:bg-brand-orange/90 transition-colors"
            >
              Browse the Shop
            </Link>
            <Link
              href="/blog"
              className="inline-block px-5 py-2.5 border border-brand-dark-border text-zinc-300 rounded hover:border-zinc-400 transition-colors"
            >
              ← Back to Journal
            </Link>
          </div>
        </div>
      </article>
    </>
  )
}
