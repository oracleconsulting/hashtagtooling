'use client'

import Link from 'next/link'
import { ShoppingCart, Heart, Menu, X } from 'lucide-react'
import { useCart } from '@/lib/store'
import { useWishlist } from '@/lib/wishlist-store'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export function Header() {
  const items = useCart((state) => state.items)
  const wishlistItems = useWishlist((state) => state.items)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const wishlistCount = wishlistItems.length

  const closeMenu = () => setMobileMenuOpen(false)

  return (
    <header className="border-b border-brand-dark-border bg-brand-dark sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-heading font-bold tracking-tight text-brand-orange">
            #TOOLING
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/shop" className="text-sm font-medium text-zinc-300 hover:text-brand-orange transition-colors">
              Shop
            </Link>
            <Link href="/custom-mallet" className="text-sm font-medium text-zinc-300 hover:text-brand-orange transition-colors">
              Custom Mallet
            </Link>
            <Link href="/custom-awl" className="text-sm font-medium text-zinc-300 hover:text-brand-orange transition-colors">
              Custom Awl
            </Link>
            <Link href="/commissions" className="text-sm font-medium text-zinc-300 hover:text-brand-orange transition-colors">
              Commissions
            </Link>
            <Link href="/gallery" className="text-sm font-medium text-zinc-300 hover:text-brand-orange transition-colors">
              Gallery
            </Link>
            <Link href="/wood-library" className="text-sm font-medium text-zinc-300 hover:text-brand-orange transition-colors">
              Wood Library
            </Link>
            <Link href="/about" className="text-sm font-medium text-zinc-300 hover:text-brand-orange transition-colors">
              My Story
            </Link>
            <Link href="/blog" className="text-sm font-medium text-zinc-300 hover:text-brand-orange transition-colors">
              Journal
            </Link>
            <Link href="/wishlist" className="relative">
              <Button variant="outline" size="sm">
                <Heart className="h-4 w-4" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-brand-orange text-brand-dark text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Button>
            </Link>
            <Link href="/cart" className="relative">
              <Button variant="outline" size="sm">
                <ShoppingCart className="h-4 w-4" />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-brand-orange text-brand-dark text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Button>
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation — animated */}
        <div
          className="md:hidden overflow-hidden transition-all duration-300 ease-in-out"
          style={{ maxHeight: mobileMenuOpen ? 500 : 0 }}
        >
          <nav className="flex flex-col space-y-4 pb-4 border-t border-brand-dark-border pt-4 mt-4">
            <Link href="/shop" onClick={closeMenu} className="text-sm font-medium text-zinc-300 hover:text-brand-orange transition-colors">
              Shop
            </Link>
            <Link href="/custom-mallet" onClick={closeMenu} className="text-sm font-medium text-zinc-300 hover:text-brand-orange transition-colors">
              Custom Mallet
            </Link>
            <Link href="/custom-awl" onClick={closeMenu} className="text-sm font-medium text-zinc-300 hover:text-brand-orange transition-colors">
              Custom Awl
            </Link>
            <Link href="/commissions" onClick={closeMenu} className="text-sm font-medium text-zinc-300 hover:text-brand-orange transition-colors">
              Commissions
            </Link>
            <Link href="/gallery" onClick={closeMenu} className="text-sm font-medium text-zinc-300 hover:text-brand-orange transition-colors">
              Gallery
            </Link>
            <Link href="/wood-library" onClick={closeMenu} className="text-sm font-medium text-zinc-300 hover:text-brand-orange transition-colors">
              Wood Library
            </Link>
            <Link href="/about" onClick={closeMenu} className="text-sm font-medium text-zinc-300 hover:text-brand-orange transition-colors">
              My Story
            </Link>
            <Link href="/blog" onClick={closeMenu} className="text-sm font-medium text-zinc-300 hover:text-brand-orange transition-colors">
              Journal
            </Link>
            <Link href="/wishlist" onClick={closeMenu} className="text-sm font-medium text-zinc-300 hover:text-brand-orange transition-colors">
              Wishlist ({wishlistCount})
            </Link>
            <Link href="/cart" onClick={closeMenu} className="text-sm font-medium text-zinc-300 hover:text-brand-orange transition-colors">
              Cart ({totalItems})
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
