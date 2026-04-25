import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { trackEvent, snapshotState } from './tracking'

interface WishlistItem {
  id: string
  name: string
  price: number
  image_url: string
}

interface WishlistStore {
  items: WishlistItem[]
  addItem: (item: WishlistItem) => void
  removeItem: (id: string) => void
  isInWishlist: (id: string) => boolean
  clearWishlist: () => void
}

export const useWishlist = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          if (state.items.some((i) => i.id === item.id)) return state
          const newItems = [...state.items, item]
          trackEvent({
            eventType: 'add_to_wishlist',
            productId: item.id,
            productName: item.name,
            price: item.price,
          })
          snapshotState({ type: 'wishlist', items: newItems.map(i => ({ id: i.id, name: i.name, price: i.price })) })
          return { items: newItems }
        }),
      removeItem: (id) =>
        set((state) => {
          const removed = state.items.find(i => i.id === id)
          const newItems = state.items.filter((i) => i.id !== id)
          if (removed) {
            trackEvent({ eventType: 'remove_from_wishlist', productId: removed.id, productName: removed.name, price: removed.price })
          }
          snapshotState({ type: 'wishlist', items: newItems.map(i => ({ id: i.id, name: i.name, price: i.price })) })
          return { items: newItems }
        }),
      isInWishlist: (id) => get().items.some((i) => i.id === id),
      clearWishlist: () => set({ items: [] }),
    }),
    { name: 'hashtag-wishlist' }
  )
)
