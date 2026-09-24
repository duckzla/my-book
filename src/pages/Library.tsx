import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { BookMarked, Check, Heart, LayoutGrid, List, Plus, Search, SearchX, SlidersHorizontal, X } from 'lucide-react'
import { useLibrary } from '../store/library'
import { cn, normalize } from '../lib/utils'
import { BookCard, BookListRow } from '../components/BookCard'
import { Button, EmptyState, Modal, PageHeader, Segmented, inputClass } from '../components/ui'

type Statut = 'tous' | 'lus' | 'en-cours' | 'a-lire'
type Sort = 'recent' | 'titre' | 'auteur' | 'note'

const SORTS: { value: Sort; label: string }[] = [
  { value: 'recent', label: 'Plus récemment ajouté' },
  { value: 'titre', label: 'Titre' },
  { value: 'auteur', label: 'Auteur' },
  { value: 'note', label: 'Note' },
]

const TABS = [
  { value: 'tous', label: 'Tous' },
  { value: 'lus', label: 'Lus' },
  { value: 'en-cours', label: 'En cours' },
  { value: 'a-lire', label: 'À lire' },
] as const

const VIEW_KEY = 'ma-bibliotheque:vue'

export default function Library() {
  const { books } = useLibrary()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [sort, setSort] = useState<Sort>('recent')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [view, setView] = useState<'grid' | 'list'>(() => {
    try {
      return (localStorage.getItem(VIEW_KEY) as 'grid' | 'list') || 'grid'
    } catch {
      return 'grid'
    }
  })

  const q = params.get('q') ?? ''
  const genre = params.get('genre')
  const statut = (params.get('statut') as Statut) || 'tous'
  const coeur = params.get('coeur') === '1'

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  // Les compteurs des onglets reflètent toujours toute la bibliothèque, quel que soit le filtre coups de cœur
  const counts = useMemo(
    () => ({
      tous: books.length,
      lus: books.filter((b) => b.status === 'lu').length,
      'en-cours': books.filter((b) => b.status === 'en-cours').length,
      'a-lire': books.filter((b) => b.status === 'non-lu').length,
    }),
    [books],
  )

  const visible = useMemo(() => {
    const n = normalize(q)
    const list = books.filter((b) => {
      if (statut === 'lus' && b.status !== 'lu') return false
      if (statut === 'en-cours' && b.status !== 'en-cours') return false
      if (statut === 'a-lire' && b.status !== 'non-lu') return false
      if (coeur && !b.favorite) return false
      if (genre && b.genre !== genre) return false
      if (n && ![b.title, b.author, b.genre].some((s) => normalize(s).includes(n))) return false
      return true
    })
    const byText = (a: string, b: string) => a.localeCompare(b, 'fr', { sensitivity: 'base' })
    const lastName = (s: string) => s.split(' ').slice(-1)[0]
    return [...list].sort((a, b) => {
      if (sort === 'titre') return byText(a.title.replace(/^(le |la |les |l’|l')/i, ''), b.title.replace(/^(le |la |les |l’|l')/i, ''))
      if (sort === 'auteur') return byText(lastName(a.author), lastName(b.author))
      if (sort === 'note') return b.rating - a.rating || byText(a.title, b.title)
      return b.addedAt.localeCompare(a.addedAt)
    })
  }, [books, q, genre, statut, coeur, sort])

  const changeView = (v: string) => {
    setView(v as 'grid' | 'list')
    try {
      localStorage.setItem(VIEW_KEY, v)
    } catch {
      /* ignore */
    }
  }

  return (
    <div>
      <PageHeader
        title="Ma Bibliothèque"
        subtitle="Votre collection, votre histoire."
      />

      {books.length === 0 ? (
        <EmptyState
          icon={<BookMarked size={26} strokeWidth={1.25} />}
          title="Votre bibliothèque commence ici."
          text="Ajoutez votre premier livre pour commencer votre collection."
          action={
            <Button variant="primary" icon={<Plus size={17} strokeWidth={1.75} />} onClick={() => navigate('/ajouter')}>
              Ajouter un livre
            </Button>
          }
        />
      ) : (
        <>
          {/* Barre d'outils : onglets de statut, puis recherche + coups de cœur + tri */}
          <div className="sticky top-14 z-20 -mx-4 mb-6 border-b border-line bg-paper/92 px-4 pb-3 backdrop-blur-md">
            <div role="tablist" aria-label="Statut de lecture" className="grid grid-cols-4">
              {TABS.map((t) => {
                const active = statut === t.value
                return (
                  <button
                    key={t.value}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setParam('statut', t.value === 'tous' ? null : t.value)}
                    className={cn(
                      'relative flex min-h-14 flex-col items-center justify-center text-[14px] transition-colors',
                      active ? 'font-medium text-ink' : 'text-muted',
                    )}
                  >
                    {t.label}
                    <span className={cn('text-[12px] tabular-nums', active ? 'text-burgundy' : 'text-[#a39b8f]')}>{counts[t.value]}</span>
                    {active && (
                      <motion.span
                        layoutId="statut-tab"
                        className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-burgundy"
                        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                      />
                    )}
                  </button>
                )
              })}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <div className="relative min-w-0 flex-1">
                <Search size={17} strokeWidth={1.5} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" />
                <input
                  value={q}
                  onChange={(e) => setParam('q', e.target.value || null)}
                  placeholder="Rechercher…"
                  aria-label="Rechercher dans ma bibliothèque"
                  className={inputClass + ' min-h-11 pr-10 pl-10'}
                />
                {q && (
                  <button aria-label="Effacer" onClick={() => setParam('q', null)} className="absolute top-1/2 right-1 flex size-9 -translate-y-1/2 items-center justify-center text-muted">
                    <X size={16} strokeWidth={1.5} />
                  </button>
                )}
              </div>
              <button
                type="button"
                aria-pressed={coeur}
                aria-label={coeur ? 'Afficher tous les livres' : 'Afficher seulement les coups de cœur'}
                onClick={() => setParam('coeur', coeur ? null : '1')}
                className={cn(
                  'flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-control)] border transition-colors',
                  coeur ? 'border-burgundy bg-burgundy text-surface' : 'border-line bg-surface text-ink',
                )}
              >
                <Heart size={18} strokeWidth={1.5} className={cn('transition-[fill]', coeur && 'fill-surface')} />
              </button>
              <button
                type="button"
                aria-label="Tri et affichage"
                onClick={() => setSettingsOpen(true)}
                className="relative flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-control)] border border-line bg-surface text-ink"
              >
                <SlidersHorizontal size={18} strokeWidth={1.5} />
                {sort !== 'recent' && <span className="absolute top-2 right-2 size-1.5 rounded-full bg-burgundy" aria-hidden />}
              </button>
            </div>

            {genre && (
              <button
                onClick={() => setParam('genre', null)}
                className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-full border border-gold/50 bg-gold/8 px-3.5 text-[13px] font-medium text-ink"
              >
                Genre : {genre} <X size={14} strokeWidth={1.5} />
              </button>
            )}
          </div>

          <p className="mb-6 text-[13px] text-muted">
            {visible.length} {visible.length > 1 ? 'livres' : 'livre'}
            {coeur && <> · coups de cœur</>}
            {q && <> pour « {q} »</>}
            {sort !== 'recent' && <> · triés par {SORTS.find((x) => x.value === sort)!.label.toLowerCase()}</>}
          </p>

          {visible.length === 0 ? (
            coeur && statut === 'tous' && !q && !genre ? (
              <EmptyState
                icon={<Heart size={26} strokeWidth={1.25} />}
                title="Pas encore de coups de cœur."
                text="Les livres qui vous marquent peuvent apparaître ici."
              />
            ) : (
              <EmptyState
                icon={<SearchX size={26} strokeWidth={1.25} />}
                title="Aucun livre ne correspond."
                text="Essayez un autre filtre, ou ajoutez ce livre à votre collection."
                action={
                  <div className="flex flex-wrap justify-center gap-2.5">
                    <Button onClick={() => setParams({}, { replace: true })}>Réinitialiser les filtres</Button>
                    {q && (
                      <Link to={`/ajouter?q=${encodeURIComponent(q)}`}>
                        <Button variant="primary" icon={<Plus size={16} strokeWidth={1.75} />}>
                          Chercher « {q} »
                        </Button>
                      </Link>
                    )}
                  </div>
                }
              />
            )
          ) : view === 'grid' ? (
            <motion.div layout className="grid grid-cols-2 gap-x-5 gap-y-10">
              <AnimatePresence mode="popLayout">
                {visible.map((b) => (
                  <motion.div
                    key={b.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.25 }}
                  >
                    <BookCard book={b} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div>
              {visible.map((b) => (
                <BookListRow key={b.id} book={b} />
              ))}
            </div>
          )}
        </>
      )}

      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Tri et affichage">
        <p className="mb-2 text-[13px] font-medium">Trier par</p>
        <div role="radiogroup" className="-mx-2">
          {SORTS.map((o) => (
            <button
              key={o.value}
              role="radio"
              aria-checked={sort === o.value}
              onClick={() => setSort(o.value)}
              className="flex min-h-12 w-full items-center justify-between rounded-[var(--radius-control)] px-2 text-left text-[15px] active:bg-sand/50"
            >
              {o.label}
              {sort === o.value && <Check size={18} strokeWidth={1.75} className="text-burgundy" />}
            </button>
          ))}
        </div>
        <p className="mt-5 mb-2 text-[13px] font-medium">Affichage</p>
        <Segmented
          value={view}
          onChange={changeView}
          className="w-full"
          options={[
            { value: 'grid', label: <><LayoutGrid size={16} strokeWidth={1.5} /> Grille</> },
            { value: 'list', label: <><List size={16} strokeWidth={1.5} /> Liste</> },
          ]}
        />
        <Button variant="primary" className="mt-6 w-full" onClick={() => setSettingsOpen(false)}>
          Voir les livres
        </Button>
      </Modal>
    </div>
  )
}
