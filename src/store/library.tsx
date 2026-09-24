import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  type Activity,
  type ActivityKind,
  type Book,
  type ReadingStatus,
  type WishItem,
} from '../data/books'

export interface Profile {
  name: string
  /** Identifiant de l'adresse publique : mybook.fr/u/{handle} */
  handle: string
  bio: string
  /** Photo réduite, en data URL (facultative) */
  avatar?: string
  /** Date de création du profil (AAAA-MM-JJ) */
  since: string
}

export type ProfileInput = Omit<Profile, 'handle' | 'since'>

/** Point de départ choisi à la création du profil */
export type StartWith = 'vide' | 'garder'

/** « Camille Dupont » → « camille-dupont » */
export const toHandle = (name: string) =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'lecteur'

const STORAGE_KEY = 'ma-bibliotheque:v1'
const TOP_MAX = 10

interface Persisted {
  /** Absent tant que la personne n'a pas créé son profil (écran d'accueil) */
  profile?: Profile
  books: Book[]
  wishlist: WishItem[]
  top: string[]
  activity: Activity[]
}

const empty = (): Persisted => ({ books: [], wishlist: [], top: [], activity: [] })

function load(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...empty(), ...JSON.parse(raw) }
  } catch {
    /* stockage indisponible : on repart d'une bibliothèque vide */
  }
  return empty()
}

const uid = () => Math.random().toString(36).slice(2, 10)
const today = () => new Date().toISOString().slice(0, 10)

export type NewBook = Omit<Book, 'id' | 'addedAt'>

interface LibraryApi extends Persisted {
  getBook: (id: string) => Book | undefined
  addBook: (book: NewBook) => Book
  updateBook: (id: string, patch: Partial<Book>) => void
  removeBook: (id: string) => void
  setStatus: (id: string, status: ReadingStatus) => void
  setRating: (id: string, rating: number) => void
  toggleFavorite: (id: string) => void
  addWish: (item: Omit<WishItem, 'id' | 'addedAt'>) => void
  removeWish: (id: string) => void
  moveWishToLibrary: (id: string) => Book | undefined
  setTop: (ids: string[]) => void
  addToTop: (id: string) => boolean
  removeFromTop: (id: string) => void
  createProfile: (input: ProfileInput, start: StartWith) => void
  updateProfile: (input: ProfileInput) => void
  /** Efface tout, profil compris : l'écran d'accueil réapparaît */
  resetApp: () => void
  toast: (message: string) => void
  toasts: { id: string; message: string }[]
}

const Ctx = createContext<LibraryApi | null>(null)

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(load)
  const [toasts, setToasts] = useState<{ id: string; message: string }[]>([])
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* ignore */
    }
  }, [state])

  const toast = useCallback((message: string) => {
    const id = uid()
    setToasts((t) => [...t.slice(-2), { id, message }])
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])

  const log = (kind: ActivityKind, title: string, bookId?: string, rating?: number): Activity => ({
    id: uid(),
    kind,
    title,
    bookId,
    rating,
    at: new Date().toISOString(),
  })

  const pushActivity = (s: Persisted, a: Activity): Activity[] => [a, ...s.activity].slice(0, 30)

  const api = useMemo<LibraryApi>(() => {
    const addBook = (nb: NewBook): Book => {
      const book: Book = { ...nb, id: uid(), addedAt: today() }
      if (book.status === 'lu' && !book.finishedAt) book.finishedAt = today()
      setState((s) => ({
        ...s,
        books: [book, ...s.books],
        activity: pushActivity(s, log('added', book.title, book.id)),
      }))
      return book
    }

    return {
      ...state,
      toasts,
      toast,
      getBook: (id) => state.books.find((x) => x.id === id),
      addBook,
      updateBook: (id, patch) =>
        setState((s) => ({ ...s, books: s.books.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      removeBook: (id) =>
        setState((s) => ({
          ...s,
          books: s.books.filter((x) => x.id !== id),
          top: s.top.filter((x) => x !== id),
        })),
      setStatus: (id, status) =>
        setState((s) => {
          const book = s.books.find((x) => x.id === id)
          if (!book || book.status === status) return s
          const kind: ActivityKind | null = status === 'lu' ? 'finished' : status === 'en-cours' ? 'started' : null
          return {
            ...s,
            books: s.books.map((x) =>
              x.id === id ? { ...x, status, finishedAt: status === 'lu' ? today() : x.finishedAt } : x,
            ),
            activity: kind ? pushActivity(s, log(kind, book.title, id)) : s.activity,
          }
        }),
      setRating: (id, rating) =>
        setState((s) => {
          const book = s.books.find((x) => x.id === id)
          if (!book) return s
          return {
            ...s,
            books: s.books.map((x) => (x.id === id ? { ...x, rating } : x)),
            activity: rating ? pushActivity(s, log('rated', book.title, id, rating)) : s.activity,
          }
        }),
      toggleFavorite: (id) =>
        setState((s) => {
          const book = s.books.find((x) => x.id === id)
          if (!book) return s
          return {
            ...s,
            books: s.books.map((x) => (x.id === id ? { ...x, favorite: !x.favorite } : x)),
            activity: !book.favorite ? pushActivity(s, log('favorite', book.title, id)) : s.activity,
          }
        }),
      addWish: (item) =>
        setState((s) => ({
          ...s,
          wishlist: [{ ...item, id: uid(), addedAt: today() }, ...s.wishlist],
          activity: pushActivity(s, log('wishlist', item.title)),
        })),
      removeWish: (id) => setState((s) => ({ ...s, wishlist: s.wishlist.filter((w) => w.id !== id) })),
      moveWishToLibrary: (id) => {
        const w = stateRef.current.wishlist.find((x) => x.id === id)
        if (!w) return undefined
        setState((s) => ({ ...s, wishlist: s.wishlist.filter((x) => x.id !== id) }))
        return addBook({
          title: w.title,
          author: w.author,
          genre: w.genre,
          isbn: w.isbn,
          cover: w.cover,
          synopsis: w.synopsis,
          status: 'non-lu',
          rating: 0,
          favorite: false,
        })
      },
      setTop: (ids) => setState((s) => ({ ...s, top: ids.slice(0, TOP_MAX) })),
      addToTop: (id) => {
        if (stateRef.current.top.includes(id) || stateRef.current.top.length >= TOP_MAX) return false
        setState((s) => ({ ...s, top: [...s.top, id] }))
        return true
      },
      removeFromTop: (id) => setState((s) => ({ ...s, top: s.top.filter((x) => x !== id) })),
      createProfile: (input, start) =>
        setState((s) => ({
          ...(start === 'garder' ? s : empty()),
          profile: { ...input, handle: toHandle(input.name), since: today() },
        })),
      updateProfile: (input) =>
        setState((s) => (s.profile ? { ...s, profile: { ...s.profile, ...input, handle: toHandle(input.name) } } : s)),
      resetApp: () => setState(empty()),
    }
  }, [state, toasts, toast])

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useLibrary() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useLibrary doit être utilisé dans LibraryProvider')
  return ctx
}

export function useStats() {
  const { books } = useLibrary()
  return useMemo(() => {
    const read = books.filter((b) => b.status === 'lu')
    const rated = books.filter((b) => b.rating > 0)
    const avg = rated.length ? rated.reduce((a, b) => a + b.rating, 0) / rated.length : 0
    const genres = new Map<string, number>()
    books.forEach((b) => genres.set(b.genre, (genres.get(b.genre) ?? 0) + 1))
    return {
      total: books.length,
      read: read.length,
      reading: books.filter((b) => b.status === 'en-cours').length,
      unread: books.filter((b) => b.status === 'non-lu').length,
      favorites: books.filter((b) => b.favorite).length,
      average: avg,
      genres: [...genres.entries()].sort((a, b) => b[1] - a[1]),
    }
  }, [books])
}

export const TOP_LIMIT = TOP_MAX

/** Profil de la personne ; disponible partout une fois l'écran d'accueil passé. */
export function useProfile(): Profile {
  const { profile } = useLibrary()
  if (!profile) throw new Error('Profil absent : l’écran d’accueil doit être affiché')
  return profile
}
