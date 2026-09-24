import type { Synopsis } from '../lib/synopsis'

export type ReadingStatus = 'lu' | 'en-cours' | 'non-lu'

export interface Book {
  id: string
  title: string
  author: string
  genre: string
  year?: number
  pages?: number
  isbn?: string
  publisher?: string
  cover?: string
  /** Présentation courte du livre (quatrième de couverture), enregistrée une fois trouvée */
  synopsis?: Synopsis
  status: ReadingStatus
  rating: number
  favorite: boolean
  note?: string
  comment?: string
  addedAt: string
  finishedAt?: string
}

export interface WishItem {
  id: string
  title: string
  author: string
  genre: string
  isbn?: string
  cover?: string
  synopsis?: Synopsis
  addedAt: string
  reason?: string
}

export type ActivityKind = 'added' | 'rated' | 'finished' | 'started' | 'wishlist' | 'favorite'

export interface Activity {
  id: string
  kind: ActivityKind
  bookId?: string
  title: string
  rating?: number
  at: string
}

export const STATUS_LABEL: Record<ReadingStatus, string> = {
  lu: 'Lu',
  'en-cours': 'En cours',
  'non-lu': 'À lire',
}
