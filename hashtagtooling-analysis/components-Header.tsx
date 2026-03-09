'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { ShoppingCart, Heart, Menu, X, ChevronDown } from 'lucide-react'
import { useCart } from '@/lib/store'
import { useWishlist } from '@/lib/wishlist-store'
import { Button } from '@/components/ui/button'
import { useState, useRef } from 'react'

const BUILD_LINKS = [
  { href: '/custom-mallet', label: 'Custom Mallet', desc: 'Design your perfect mallet' },
  { href: '/custom-awl', label: 'Custom Awl', desc: 'Choose your handle wood & ferrule' },
  { href: '/commissions', label: 'Commissions', desc: 'Request a bespoke piece' },
]

const SHOP_LINKS = [
  { href: '/shop', label: 'All Products', desc: 'Browse everything in stock' },
  { href: '/shop?category=mallet', label: 'Mallets', desc: 'Ready-made mallets' },
  { href: '/shop?category=awl', label: 'Awls', desc: 'Marking awls & scribers' },
  { href: '/shop?category=wood', label: 'Wood for Sale', desc: 'Offcuts, blanks & timber' },
  { href: '/adopt', label: 'Adopt a Blank', desc: 'Pick a blank, follow its journey' },
  { href: '/mystery-box', label: 'Mystery Box', desc: 'A surprise tool, mystery woods' },
  { href: '/gift-vouchers', label: 'Gift Vouchers', desc: '£25–£150, instant delivery' },
]

const EXPLORE_LINKS = [
  { href: '/wood-library', label: 'Wood Library', desc: '75+ exotic species' },
  { href: '/gallery', label: 'Gallery', desc: 'Past work & sold pieces' },
  { href: '/blog', label: 'Journal', desc: 'Workshop stories & wood guides' },
  { href: '/about', label: 'My Story', desc: 'The maker behind the tools' },
  { href: '/gift-guide', label: 'Gift Guide', desc: 'Find the perfect gift' },
  { href: '/referrals', label: 'Refer a Friend', desc: 'Share & earn £10' },
]

function isActive(href: string, pathname: string, searchParams: URLSearchParams | null): boolean {
  if (href === '/') return pathname === '/'
  if (href.startsWith('/shop')) {
    if (href === '/shop') return pathname === '/shop' && !searchParams?.get('category')
    const cat = new URLSearchParams(href.split('?')[1] || '').get('category')
    return pathname === '/shop' && searchParams?.get('category') === cat
  }
  return pathname === href || pathname.startsWith(href + '/')
}

export function Header() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const items = useCart((state) => state.items)
  const wishlistItems = useWishlist((state) => state.items)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState<Record<string, boolean>>({})
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const wishlistCount = wishlistItems.length

  const closeMenu = () => {
    setMobileMenuOpen(false)
    setMobileExpanded({})
  }

  const handleMouseEnter = (key: string) => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current)
      hoverTimer.current = null
    }
    setOpenDropdown(key)
  }

  const handleMouseLeave = () => {
    hoverTimer.current = setTimeout(() => {
      setOpenDropdown(null)
      hoverTimer.current = null
    }, 300)
  }

  const toggleMobileSection = (key: string) => {
    setMobileExpanded((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const DropdownGroup = ({
    id,
    title,
    links,
  }: {
    id: string
    title: string
    links: { href: string; label: string; desc: string }[]
  }) => (
    <div
      className="relative"
      onMouseEnter={() => handleMouseEnter(id)}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className="flex items-center gap-1 text-sm font-medium text-zinc-300 hover:text-brand-orange transition-colors py-4"
        aria-expanded={openDropdown === id}
        aria-haspopup="true"
      >
        {title}
        <ChevronDown className={`h-4 w-4 transition-transform ${openDropdown === id ? 'rotate-180' : ''}`} />
      </button>
      {openDropdown === id && (
        <div
          className="absolute top-full left-0 pt-0"
          onMouseEnter={() => handleMouseEnter(id)}
          onMouseLeave={handleMouseLeave}
        >
          <div className="bg-[#222] border-t-2 border-brand-orange rounded-b-lg shadow-xl min-w-[240px] py-3">
            <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-brand-orange">
              {title}
            </p>
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpenDropdown(null)}
                className={`block px-4 py-2 hover:bg-brand-dark transition-colors ${
                  isActive(link.href, pathname, searchParams) ? 'text-brand-orange' : 'text-zinc-300'
                }`}
              >
                <span className="font-medium">{link.label}</span>
                <span className="block text-xs text-zinc-500">{link.desc}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <header className="border-b border-brand-dark-border bg-brand-dark sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-heading font-bold tracking-tight text-brand-orange shrink-0">
            #TOOLING
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <DropdownGroup id="build" title="Build" links={BUILD_LINKS} />
            <DropdownGroup id="shop" title="Shop" links={SHOP_LINKS} />
            <DropdownGroup id="explore" title="Explore" links={EXPLORE_LINKS} />
            <div className="flex items-center gap-2 ml-4 pl-4 border-l border-brand-dark-border">
              <Link href="/wishlist" className="relative" aria-label="Wishlist">
                <Button variant="outline" size="sm">
                  <Heart className="h-4 w-4" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-brand-orange text-brand-dark text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {wishlistCount}
                    </span>
                  )}
                </Button>
              </Link>
              <Link href="/cart" className="relative" aria-label="Cart">
                <Button variant="outline" size="sm">
                  <ShoppingCart className="h-4 w-4" />
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-brand-orange text-brand-dark text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </Button>
              </Link>
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <div
          className="md:hidden overflow-hidden transition-all duration-300 ease-in-out"
          style={{ maxHeight: mobileMenuOpen ? 1200 : 0 }}
        >
          <nav className="flex flex-col pb-4 border-t border-brand-dark-border pt-4 mt-4">
            <div className="flex items-center justify-between mb-4">
              <Link href="/cart" onClick={closeMenu} className="flex items-center gap-2 text-zinc-300">
                <ShoppingCart className="h-5 w-5" />
                Cart ({totalItems})
              </Link>
              <Link href="/wishlist" onClick={closeMenu} className="flex items-center gap-2 text-zinc-300">
                <Heart className="h-5 w-5" />
                Wishlist ({wishlistCount})
              </Link>
            </div>

            <div className="space-y-1">
              <button
                onClick={() => toggleMobileSection('build')}
                className="w-full text-left py-2 text-xs font-semibold uppercase tracking-wider text-brand-orange"
              >
                Build {mobileExpanded.build ? '−' : '+'}
              </button>
              {mobileExpanded.build && (
                <div className="pl-4 space-y-2 pb-3">
                  {BUILD_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={closeMenu}
                      className={`block py-1.5 text-sm ${isActive(link.href, pathname, searchParams) ? 'text-brand-orange' : 'text-zinc-300'}`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}

              <button
                onClick={() => toggleMobileSection('shop')}
                className="w-full text-left py-2 text-xs font-semibold uppercase tracking-wider text-brand-orange"
              >
                Shop {mobileExpanded.shop ? '−' : '+'}
              </button>
              {mobileExpanded.shop && (
                <div className="pl-4 space-y-2 pb-3">
                  {SHOP_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={closeMenu}
                      className={`block py-1.5 text-sm ${isActive(link.href, pathname, searchParams) ? 'text-brand-orange' : 'text-zinc-300'}`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}

              <button
                onClick={() => toggleMobileSection('explore')}
                className="w-full text-left py-2 text-xs font-semibold uppercase tracking-wider text-brand-orange"
              >
                Explore {mobileExpanded.explore ? '−' : '+'}
              </button>
              {mobileExpanded.explore && (
                <div className="pl-4 space-y-2 pb-3">
                  {EXPLORE_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={closeMenu}
                      className={`block py-1.5 text-sm ${isActive(link.href, pathname, searchParams) ? 'text-brand-orange' : 'text-zinc-300'}`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}
