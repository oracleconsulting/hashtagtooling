'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Hammer } from 'lucide-react'

const HIDE_PATHS = [
  '/custom-mallet',
  '/custom-awl',
  '/custom-square',
  '/cart',
  '/shop',
  '/commissions',
  '/gift-vouchers',
  '/checkout',
]

function shouldHide(pathname: string): boolean {
  if (pathname.startsWith('/admin')) return true
  return HIDE_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

export function FloatingBuildCTA() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || shouldHide(pathname)) {
      setVisible(false)
      setOpen(false)
      return
    }

    const handleScroll = () => {
      setVisible(window.scrollY > 300)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [pathname, mounted])

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  if (!mounted || shouldHide(pathname)) return null

  return (
    <div
      className={`fixed bottom-6 right-6 md:bottom-8 md:right-8 z-40 transition-all duration-300 ease-out ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
      }`}
    >
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 px-4 py-2.5 md:px-5 md:py-3 rounded-full bg-brand-orange text-[#1A1A1A] font-semibold text-sm md:text-base shadow-lg hover:bg-brand-orange-hover transition-colors"
          aria-expanded={open}
          aria-haspopup="true"
          aria-label="Build your own tool"
        >
          <Hammer className="h-4 w-4 md:h-5 md:w-5" />
          Build Your Own
        </button>

        {open && (
          <div
            ref={popoverRef}
            className="absolute bottom-full right-0 mb-2 w-48 rounded-lg bg-brand-dark-card border border-brand-dark-border shadow-xl py-2"
          >
            <Link
              href="/custom-mallet"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-zinc-300 hover:bg-brand-dark hover:text-brand-orange transition-colors"
            >
              Custom Mallet →
            </Link>
            <Link
              href="/custom-awl"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-zinc-300 hover:bg-brand-dark hover:text-brand-orange transition-colors"
            >
              Custom Awl →
            </Link>
            <Link
              href="/custom-square"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-zinc-300 hover:bg-brand-dark hover:text-brand-orange transition-colors"
            >
              Engineering Square →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
