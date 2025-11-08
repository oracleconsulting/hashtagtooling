export const MALLET_TYPES = [
  { id: 'turned-carving', name: 'Turned Carving Mallet', shape: 'turned' },
  { id: 'turned-detailing', name: 'Turned Detailing Mallet', shape: 'turned' },
  { id: 'turned-framing', name: 'Turned Framing Mallet', shape: 'turned' },
  { id: 'square-carving', name: 'Square Carving Mallet', shape: 'square' },
  { id: 'square-detailing', name: 'Square Detailing Mallet', shape: 'square' },
  { id: 'square-framing', name: 'Square Framing Mallet', shape: 'square' },
] as const

export const TRANSITION_MATERIALS = [
  { id: 'copper', name: 'Copper', hex: '#B87333' },
  { id: 'bronze', name: 'Bronze', hex: '#CD7F32' },
  { id: 'brass', name: 'Brass', hex: '#B5A642' },
  { id: 'aluminium', name: 'Aluminium', hex: '#C0C0C0' },
] as const

// Placeholder for 100+ wood types - you'll upload these later
export const WOOD_TYPES = [
  { id: 'walnut', name: 'Black Walnut', color: '#3D2817' },
  { id: 'maple', name: 'Hard Maple', color: '#E8D5B7' },
  { id: 'cherry', name: 'Cherry', color: '#9C4722' },
  { id: 'oak', name: 'White Oak', color: '#C9B27C' },
  { id: 'mahogany', name: 'Mahogany', color: '#C04000' },
  { id: 'ash', name: 'Ash', color: '#E5D1B7' },
  { id: 'beech', name: 'Beech', color: '#D9BE9C' },
  { id: 'birch', name: 'Yellow Birch', color: '#D4A76A' },
  { id: 'ebony', name: 'Ebony', color: '#282828' },
  { id: 'rosewood', name: 'Rosewood', color: '#65000B' },
  // More will be added by user later
] as const

export type MalletType = typeof MALLET_TYPES[number]['id']
export type TransitionMaterial = typeof TRANSITION_MATERIALS[number]['id']
export type WoodType = typeof WOOD_TYPES[number]['id']

export interface CustomMalletConfig {
  malletType: MalletType
  headWood: WoodType
  handleWood: WoodType
  transitionMaterial: TransitionMaterial
}



