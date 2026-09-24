import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUpRight, Globe, PenLine, Search, Tag, X } from 'lucide-react'
import { useLibrary } from '../store/library'
import { cn, normalize, plural } from '../lib/utils'
import { BookCover } from './BookCover'

type Item =
  | { type: 'book'; id: string; label: string; sub: string; cover?: string }
  | { type: 'author'; label: string; count: number }
  | { type: 'genre'; label: string; count: number }
  | { type: 'web'; label: string }

export function GlobalSearch({ placeholder = 'Rechercher un livre, un auteur ou un genre…', autoFocus }: { placeholder?: string; autoFocus?: boolean }) {
  const { books } = useLibrary()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(0)
  const wrap = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [])

  const groups = useMemo(() => {
    const n = normalize(q)
    const authors = new Map<string, number>()
    const genres = new Map<string, number>()
    books.forEach((b) => {
      authors.set(b.author, (authors.get(b.author) ?? 0) + 1)
      genres.set(b.genre, (genres.get(b.genre) ?? 0) + 1)
    })

    if (!n) {
      // Suggestions quand le champ est vide
      const recent = [...books].sort((a, b) => b.addedAt.localeCompare(a.addedAt)).slice(0, 3)
      return {
        books: recent.map<Item>((b) => ({ type: 'book', id: b.id, label: b.title, sub: b.author, cover: b.cover })),
        authors: [...authors.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map<Item>(([label, count]) => ({ type: 'author', label, count })),
        genres: [...genres.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map<Item>(([label, count]) => ({ type: 'genre', label, count })),
        web: [] as Item[],
      }
    }
    const match = (s: string) => normalize(s).includes(n)
    return {
      books: books
        .filter((b) => match(b.title) || match(b.author))
        .slice(0, 5)
        .map<Item>((b) => ({ type: 'book', id: b.id, label: b.title, sub: b.author, cover: b.cover })),
      authors: [...authors.entries()].filter(([a]) => match(a)).slice(0, 3).map<Item>(([label, count]) => ({ type: 'author', label, count })),
      genres: [...genres.entries()].filter(([g]) => match(g)).slice(0, 3).map<Item>(([label, count]) => ({ type: 'genre', label, count })),
      web: [{ type: 'web', label: q.trim() }] as Item[],
    }
  }, [q, books])

  const flat = [...groups.books, ...groups.authors, ...groups.genres, ...groups.web]

  const choose = (item: Item) => {
    setOpen(false)
    setQ('')
    input.current?.blur()
    if (item.type === 'book') navigate(`/livre/${item.id}`)
    else if (item.type === 'author') navigate(`/bibliotheque?q=${encodeURIComponent(item.label)}`)
    else if (item.type === 'genre') navigate(`/bibliotheque?genre=${encodeURIComponent(item.label)}`)
    else navigate(`/ajouter?q=${encodeURIComponent(item.label)}`)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setCursor((c) => Math.min(c + 1, flat.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCursor((c) => Math.max(c - 1, 0))
    } else if (e.key === 'Enter' && flat[cursor]) {
      e.preventDefault()
      choose(flat[cursor])
    } else if (e.key === 'Escape') {
      setOpen(false)
      input.current?.blur()
    }
  }

  let index = -1
  const row = (item: Item) => {
    index++
    const i = index
    const active = i === cursor
    return (
      <li key={item.type + item.label + ('id' in item ? item.id : '')}>
        <button
          type="button"
          onMouseEnter={() => setCursor(i)}
          onClick={() => choose(item)}
          className={cn(
            'flex min-h-12 w-full items-center gap-3.5 rounded-[var(--radius-control)] px-3 py-2 text-left transition-colors',
            active ? 'bg-sand/55' : 'hover:bg-sand/40',
          )}
        >
          {item.type === 'book' && (
            <>
              <div className="w-8 shrink-0">
                <BookCover title={item.label} author={item.sub} src={item.cover} size="sm" className="shadow-none" />
              </div>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-serif text-[18px] leading-tight font-medium">{item.label}</span>
                <span className="block truncate text-[13px] text-muted">{item.sub}</span>
              </span>
            </>
          )}
          {item.type === 'author' && (
            <>
              <PenLine size={17} strokeWidth={1.5} className="shrink-0 text-muted" />
              <span className="flex-1 truncate text-[15px]">{item.label}</span>
              <span className="text-[12.5px] text-muted">{plural(item.count, 'livre', 'livres')}</span>
            </>
          )}
          {item.type === 'genre' && (
            <>
              <Tag size={17} strokeWidth={1.5} className="shrink-0 text-muted" />
              <span className="flex-1 truncate text-[15px]">{item.label}</span>
              <span className="text-[12.5px] text-muted">{plural(item.count, 'livre', 'livres')}</span>
            </>
          )}
          {item.type === 'web' && (
            <>
              <Globe size={17} strokeWidth={1.5} className="shrink-0 text-burgundy" />
              <span className="flex-1 truncate text-[14.5px]">
                Chercher « <span className="font-medium">{item.label}</span> » pour l'ajouter
              </span>
              <ArrowUpRight size={16} strokeWidth={1.5} className="text-muted" />
            </>
          )}
        </button>
      </li>
    )
  }

  const group = (title: string, items: Item[]) =>
    items.length > 0 && (
      <div className="py-2">
        <p className="eyebrow px-3 pb-1.5">{title}</p>
        <ul>{items.map(row)}</ul>
      </div>
    )

  const nothing = q && !groups.books.length && !groups.authors.length && !groups.genres.length

  return (
    <div ref={wrap} className="relative">
      <div
        className={cn(
          'flex items-center rounded-[var(--radius-card)] border bg-surface transition-[border-color,box-shadow]',
          open ? 'border-[#c9bfae] shadow-[0_0_0_5px_rgba(122,48,56,0.06)]' : 'border-line hover:border-[#cfc6b7]',
        )}
      >
        <Search size={19} strokeWidth={1.5} className="ml-5 shrink-0 text-muted" />
        <input
          ref={input}
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQ(e.target.value)
            setCursor(0)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-label="Rechercher dans ma bibliothèque"
          aria-expanded={open}
          className="h-[58px] min-w-0 flex-1 bg-transparent px-4 text-[16px] outline-none placeholder:text-[#a39b8f]"
        />
        {q ? (
          <button type="button" aria-label="Effacer" onClick={() => setQ('')} className="mr-2 flex size-10 items-center justify-center rounded-full text-muted hover:text-ink">
            <X size={17} strokeWidth={1.5} />
          </button>
        ) : null}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-x-0 top-[calc(100%+8px)] z-40 max-h-[min(70vh,520px)] overflow-y-auto rounded-[var(--radius-card)] border border-line bg-surface p-2 shadow-[0_24px_50px_-24px_rgba(39,37,34,0.35)]"
          >
            {!q && <p className="px-3 pt-2 pb-1 text-[12.5px] text-muted italic">Ajoutés récemment et suggestions</p>}
            {group('Livres', groups.books)}
            {group('Auteurs', groups.authors)}
            {group('Genres', groups.genres)}
            {nothing && (
              <p className="px-3 pt-3 pb-1 font-serif text-[18px] text-muted italic">Aucun livre de votre bibliothèque ne correspond.</p>
            )}
            {groups.web.length > 0 && <div className="mt-1 border-t border-line pt-2">{<ul>{groups.web.map(row)}</ul>}</div>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
