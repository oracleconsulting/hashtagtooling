import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CustomMalletConfig } from './constants'

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image_url: string
  category?: string
  stock_status?: string
  customConfig?: CustomMalletConfig
  shipping?: { uk: number; europe: number; world: number }
  is_digital?: boolean
}

interface CartStore {
  items: CartItem[]
  appliedReferralCode: string | null
  appliedReferralDiscount: number
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  setReferral: (code: string | null, discount: number) => void
  getTotalPrice: () => number
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      appliedReferralCode: null,
      appliedReferralDiscount: 0,
      addItem: (item) => set((state) => {
        const existingItem = state.items.find(i => i.id === item.id)
        if (existingItem) {
          return {
            items: state.items.map(i =>
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            )
          }
        }
        return { items: [...state.items, { ...item, quantity: 1 }] }
      }),
      removeItem: (id) => set((state) => ({
        items: state.items.filter(i => i.id !== id)
      })),
      updateQuantity: (id, quantity) => set((state) => ({
        items: state.items.map(i =>
          i.id === id ? { ...i, quantity } : i
        )
      })),
      clearCart: () => set({ items: [], appliedReferralCode: null, appliedReferralDiscount: 0 }),
      setReferral: (code, discount) => set({ appliedReferralCode: code, appliedReferralDiscount: discount }),
      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0)
      },
    }),
    { name: 'hashtag-cart' }
  )
)

export const isCustomBuildItem = (item: CartItem): boolean =>
  Boolean(item.customConfig?.custom_build)

export const computePaymentBreakdown = (
  items: CartItem[],
  shipping: number,
  paymentPlan: 'full' | 'deposit',
  discount: number = 0,
): {
  customSubtotal: number
  stockSubtotal: number
  upfrontAmount: number
  depositAmount: number
  balanceAmount: number
  totalAmount: number
} => {
  const customSubtotal = items
    .filter(isCustomBuildItem)
    .reduce((s, i) => s + i.price * i.quantity, 0)
  const stockSubtotal = items
    .filter((i) => !isCustomBuildItem(i))
    .reduce((s, i) => s + i.price * i.quantity, 0)

  const totalAmount = customSubtotal + stockSubtotal - discount

  if (paymentPlan === 'full' || customSubtotal === 0) {
    return {
      customSubtotal,
      stockSubtotal,
      upfrontAmount: totalAmount + shipping,
      depositAmount: 0,
      balanceAmount: 0,
      totalAmount,
    }
  }

  const depositAmount = customSubtotal * 0.5
  const balanceAmount = customSubtotal * 0.5
  const upfrontAmount = depositAmount + stockSubtotal + shipping - discount

  return {
    customSubtotal,
    stockSubtotal,
    upfrontAmount: Math.max(0, upfrontAmount),
    depositAmount,
    balanceAmount,
    totalAmount,
  }
}



