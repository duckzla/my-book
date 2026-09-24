import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, Barcode, ChevronRight, Loader2, PenLine, Search, WifiOff } from 'lucide-react'
import { isValidIsbn } from '../lib/openlibrary'
import { resolveCover, searchFrench, searchFrenchByIsbn, type BookResult } from '../lib/bookSearch'
import { useLibrary } from '../store/library'
import { cn, normalize } from '../lib/utils'
import { BookCover } from '../components/BookCover'
import { SynopsisBlock } from '../components/SynopsisBlock'
import type { Synopsis } from '../lib/synopsis'
import { Button, Field, PageHeader, RatingStars, Segmented, Switch, inputClass } from '../components/ui'

type Mode = 'recherche' | 'isbn'
type Destination = 'non-lu' | 'en-cours' | 'lu' | 'wishlist'

const DESTINATIONS: { value: Destination; title: string; text: string }[] = [
  { value: 'non-lu', title: 'Possédé — Pas encore lu', text: 'Il attend sur l’étagère.' },
  { value: 'en-cours', title: 'Possédé — En cours', text: 'Sur ma table de chevet.' },
  { value: 'lu', title: 'Possédé — Lu', text: 'Déjà refermé, prêt à être noté.' },
  { value: 'wishlist', title: 'Envie de lecture', text: 'À accueillir un jour dans ma bibliothèque.' },
]

const GENRES = ['Roman', 'Fantasy', 'Science-fiction', 'Essai', 'Policier', 'Poésie', 'Biographie', 'Jeunesse', 'Conte', 'Nouvelles', 'Théâtre', 'Bande dessinée']

interface Selection {
  title: string
  author: string
  genre: string
  cover?: string
  covers?: string[]
  isbn?: string
  year?: number
  pages?: number
  publisher?: string
  /** Clé d'œuvre Open Library, pour chercher un synopsis */
  workKey?: string
  synopsis?: Synopsis
  /** Saisie manuelle : pas de fiche en ligne, les champs sont ouverts d'emblée */
  manual?: boolean
}

export default function AddBook() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const lib = useLibrary()

  const [mode, setMode] = useState<Mode>('recherche')
  const [text, setText] = useState(params.get('q') ?? '')
  const [isbn, setIsbn] = useState('')
  const [results, setResults] = useState<BookResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)
  const [selected, setSelected] = useState<Selection | null>(null)

  const [dest, setDest] = useState<Destination>(params.get('dest') === 'wishlist' ? 'wishlist' : 'non-lu')
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [favorite, setFavorite] = useState(false)
  const resultsScroll = useRef(0)

  // Une nouvelle recherche arrive par l'adresse (ex. depuis la recherche globale) alors que l'écran est déjà ouvert
  const qParam = params.get('q')
  useEffect(() => {
    if (qParam !== null) {
      setMode('recherche')
      setText(qParam)
      setSelected(null)
    }
  }, [qParam])

  // Recherche (Open Library + BnF), avec un léger délai pendant la frappe
  useEffect(() => {
    if (mode !== 'recherche') return
    const q = text.trim()
    if (q.length < 2) {
      setResults([])
      setSearched(false)
      setError(null)
      return
    }
    const ctrl = new AbortController()
    const t = window.setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        setResults(await searchFrench(q, ctrl.signal))
        setSearched(true)
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setError("La recherche en ligne n'a pas abouti. Vérifiez votre connexion, ou saisissez le livre à la main.")
      } finally {
        if (!ctrl.signal.aborted) setLoading(false)
      }
    }, 380)
    return () => {
      ctrl.abort()
      window.clearTimeout(t)
    }
  }, [text, mode])

  const lookupIsbn = async () => {
    if (!isValidIsbn(isbn)) {
      setError('Un ISBN compte 10 ou 13 chiffres.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const r = await searchFrenchByIsbn(isbn)
      setResults(r)
      setSearched(true)
      if (r[0]) choose(r[0])
    } catch {
      setError("La recherche en ligne n'a pas abouti. Vérifiez votre connexion, ou saisissez le livre à la main.")
    } finally {
      setLoading(false)
    }
  }

  const choose = (r: Selection & { key?: string }) => {
    const covers = r.covers ?? []
    setSelected({
      title: r.title,
      author: r.author,
      genre: r.genre,
      covers,
      isbn: r.isbn,
      year: r.year,
      pages: r.pages,
      publisher: r.publisher,
      workKey: r.key?.startsWith('/works/') ? r.key : undefined,
      manual: r.manual,
    })
    // La fiche s'ouvre comme une nouvelle page : on mémorise la position dans les résultats
    resultsScroll.current = window.scrollY
    window.scrollTo({ top: 0 })
    // Retient la première couverture réellement disponible, pour l'enregistrer avec le livre
    resolveCover(covers).then((cover) =>
      setSelected((cur) => (cur && cur.title === r.title && cur.author === r.author ? { ...cur, cover } : cur)),
    )
  }

  const backToResults = () => {
    setSelected(null)
    setRating(0)
    setComment('')
    setFavorite(false)
    requestAnimationFrame(() => window.scrollTo({ top: resultsScroll.current }))
  }

  const duplicate =
    selected && lib.books.find((b) => normalize(b.title) === normalize(selected.title) && normalize(b.author) === normalize(selected.author))

  const submit = async () => {
    if (!selected || !selected.title.trim()) return
    const cover = selected.cover ?? (await resolveCover(selected.covers ?? []))
    const { covers: _covers, workKey: _key, manual: _manual, ...rest } = selected
    const base = { ...rest, cover, title: selected.title.trim(), author: selected.author.trim() || 'Auteur inconnu' }
    if (dest === 'wishlist') {
      lib.addWish({ title: base.title, author: base.author, genre: base.genre, cover: base.cover, isbn: base.isbn, synopsis: base.synopsis })
      lib.toast(`« ${base.title} » ajouté à votre wishlist`)
      navigate('/wishlist')
      return
    }
    const book = lib.addBook({
      ...base,
      status: dest,
      rating: dest === 'lu' ? rating : 0,
      comment: dest === 'lu' ? comment.trim() || undefined : undefined,
      favorite,
    })
    lib.toast(`« ${book.title} » a rejoint votre bibliothèque`)
    navigate(`/livre/${book.id}`)
  }

  if (selected) {
    const meta = [selected.genre, selected.year, selected.pages && `${selected.pages} pages`, selected.publisher].filter(Boolean)
    return (
      <div>
        <button onClick={backToResults} className="group mb-6 inline-flex min-h-11 items-center gap-2 text-[14px] text-muted hover:text-ink">
          <ArrowLeft size={17} strokeWidth={1.5} className="transition-transform group-hover:-translate-x-0.5" />
          {selected.manual ? 'Retour' : 'Résultats'}
        </button>

        {/* Fiche du livre */}
        <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="mx-auto w-[56%] max-w-[230px]">
            <BookCover
              title={selected.title || 'Sans titre'}
              author={selected.author}
              src={selected.cover ?? selected.covers}
              size="lg"
              className="shadow-[0_2px_3px_rgba(39,37,34,0.1),0_26px_50px_-22px_rgba(39,37,34,0.45)]"
            />
          </div>
          <div className="mt-7 text-center">
            {meta.length > 0 && <p className="eyebrow">{meta.join(' · ')}</p>}
            <h1 className="mt-3 font-serif text-[36px] leading-[1.05] font-medium text-balance">{selected.title || 'Nouveau livre'}</h1>
            {selected.author && <p className="mt-2 font-serif text-[21px] text-muted italic">{selected.author}</p>}
          </div>

          {duplicate && (
            <p className="mt-6 rounded-[var(--radius-control)] bg-gold/10 px-4 py-3 text-center text-[13.5px] text-ink/80">
              Ce livre est déjà dans votre bibliothèque ({duplicate.status === 'lu' ? 'lu' : 'pas encore lu'}).
            </p>
          )}

          {!selected.manual && selected.title && selected.author && (
            <SynopsisBlock
              className="mt-10 border-t border-line pt-8"
              query={{ title: selected.title, author: selected.author, isbn: selected.isbn, workKey: selected.workKey }}
              synopsis={selected.synopsis}
              onFound={(synopsis) => setSelected((cur) => (cur ? { ...cur, synopsis } : cur))}
            />
          )}

          {/* Saisie manuelle uniquement : les livres trouvés en ligne ne se modifient pas */}
          {selected.manual && (
            <div className="mt-8 space-y-4 rounded-[var(--radius-card)] border border-line bg-surface px-4 pt-4 pb-5">
              <Field label="Titre">
                <input className={inputClass + ' font-serif text-[20px]'} value={selected.title} onChange={(e) => setSelected({ ...selected, title: e.target.value })} placeholder="Le titre du livre" />
              </Field>
              <Field label="Auteur">
                <input className={inputClass} value={selected.author} onChange={(e) => setSelected({ ...selected, author: e.target.value })} placeholder="Nom de l’auteur" />
              </Field>
              <Field label="Genre">
                <div className="flex flex-wrap gap-1.5">
                  {GENRES.slice(0, 8).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setSelected({ ...selected, genre: g })}
                      className={cn(
                        'min-h-9 rounded-full border px-3.5 text-[13px] transition-colors',
                        selected.genre === g ? 'border-ink bg-ink text-surface' : 'border-line text-ink hover:bg-paper',
                      )}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          )}
        </motion.article>

        {/* Où le ranger ? */}
        <section className="mt-12">
          <h2 className="section-title mb-5">Où le ranger ?</h2>
          <div role="radiogroup" className="grid gap-2.5">
            {DESTINATIONS.map((d) => {
              const active = dest === d.value
              return (
                <button
                  key={d.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setDest(d.value)}
                  className={cn(
                    'flex min-h-[72px] items-start gap-3.5 rounded-[var(--radius-card)] border p-4 text-left transition-colors',
                    active ? 'border-burgundy bg-burgundy/[0.04]' : 'border-line bg-surface hover:border-[#cbbfae]',
                  )}
                >
                  <span className={cn('mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors', active ? 'border-burgundy' : 'border-[#c6bcad]')}>
                    {active && <motion.span layoutId="dest-dot" className="size-2.5 rounded-full bg-burgundy" />}
                  </span>
                  <span>
                    <span className="block text-[15px] font-medium">{d.title}</span>
                    <span className="mt-0.5 block text-[13px] text-muted">{d.text}</span>
                  </span>
                </button>
              )
            })}
          </div>

          <AnimatePresence initial={false}>
            {dest === 'lu' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
                className="overflow-hidden"
              >
                <div className="space-y-6 pt-8">
                  <div>
                    <p className="mb-2 text-[13px] font-medium">Votre note</p>
                    <RatingStars value={rating} onChange={setRating} size={26} />
                  </div>
                  <Field label="Votre commentaire">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Partagez vos impressions…"
                      className={inputClass + ' min-h-32 resize-y py-3 font-serif text-[18px] leading-relaxed italic'}
                    />
                  </Field>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {dest !== 'wishlist' && (
            <div className="mt-6 border-t border-line pt-2">
              <Switch checked={favorite} onChange={setFavorite} label="Ajouter à mes coups de cœur" />
            </div>
          )}

          <div className="sticky bottom-[calc(72px+env(safe-area-inset-bottom))] mt-8 -mx-4 border-t border-line bg-paper/95 px-4 py-4 backdrop-blur">
            <Button variant="primary" onClick={submit} disabled={!selected.title.trim()} className="w-full">
              {dest === 'wishlist' ? 'Ajouter à ma wishlist' : 'Ajouter à ma bibliothèque'}
            </Button>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div>
      <button onClick={() => navigate(-1)} className="group mb-6 inline-flex min-h-11 items-center gap-2 text-[14px] text-muted hover:text-ink">
        <ArrowLeft size={17} strokeWidth={1.5} className="transition-transform group-hover:-translate-x-0.5" /> Retour
      </button>
      <PageHeader title="Ajouter un livre" subtitle="Ajoutez une nouvelle lecture à votre bibliothèque." />

      <section>
        <Segmented
          value={mode}
          onChange={(v) => {
            setMode(v as Mode)
            setResults([])
            setError(null)
            setSearched(false)
          }}
          className="mb-5 w-full"
          options={[
            { value: 'recherche', label: <><Search size={15} strokeWidth={1.5} /> Rechercher un livre</> },
            { value: 'isbn', label: <><Barcode size={15} strokeWidth={1.5} /> ISBN</> },
          ]}
        />

        {mode === 'recherche' ? (
          <div className="relative">
            <Search size={18} strokeWidth={1.5} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
            <input
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Titre, auteur…"
              aria-label="Rechercher un livre par titre ou auteur"
              className={inputClass + ' min-h-14 pl-12 text-[16px]'}
            />
            {loading && <Loader2 size={18} strokeWidth={1.5} className="absolute top-1/2 right-4 -translate-y-1/2 animate-spin text-muted" />}
          </div>
        ) : (
          <form
            className="flex flex-col gap-2.5"
            onSubmit={(e) => {
              e.preventDefault()
              lookupIsbn()
            }}
          >
            <input
              autoFocus
              inputMode="numeric"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              placeholder="978-2-07-036002-4"
              aria-label="ISBN"
              className={inputClass + ' min-h-14 flex-1 text-[16px] tracking-wide tabular-nums'}
            />
            <Button type="submit" variant="primary" className="min-h-14 px-6" disabled={loading}>
              {loading ? <Loader2 size={17} className="animate-spin" /> : 'Rechercher'}
            </Button>
          </form>
        )}

        <p className="mt-2.5 text-[12.5px] text-muted">Titres des éditions françaises : catalogue de la BnF. Couvertures : Open Library.</p>

        {loading && results.length === 0 && (
          <p className="mt-6 flex items-center gap-2.5 font-serif text-[18px] text-muted italic">
            <Loader2 size={16} strokeWidth={1.5} className="animate-spin not-italic" /> Recherche des éditions françaises…
          </p>
        )}

        {error && (
          <p className="mt-4 flex items-start gap-2.5 rounded-[var(--radius-control)] border border-line bg-surface p-4 text-[14px] text-muted">
            <WifiOff size={17} strokeWidth={1.5} className="mt-0.5 shrink-0" /> {error}
          </p>
        )}

        {/* Résultats */}
        {results.length > 0 && (
          <ul className="mt-6 grid grid-cols-1 gap-1">
            {results.map((r) => (
                <li key={r.key}>
                  <button
                    onClick={() => choose(r)}
                    className="flex w-full items-center gap-4 rounded-[var(--radius-card)] border border-transparent p-3 text-left transition-colors active:border-line active:bg-surface"
                  >
                    <div className="w-12 shrink-0">
                      <BookCover title={r.title} author={r.author} src={r.covers} size="sm" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 font-serif text-[19px] leading-tight font-medium">{r.title}</p>
                      <p className="mt-0.5 truncate text-[13px] text-muted">
                        {r.author}
                        {(r.publisher || r.year) && (
                          <span className="block truncate text-[12.5px] text-[#9a9186]">
                            {[r.publisher, r.year].filter(Boolean).join(' · ')}
                          </span>
                        )}
                      </p>
                    </div>
                    <ChevronRight size={17} strokeWidth={1.5} className="shrink-0 text-[#b5ac9f]" />
                  </button>
                </li>
            ))}
          </ul>
        )}
        {searched && !loading && results.length === 0 && !error && (
          <p className="mt-6 font-serif text-[19px] text-muted italic">Aucun résultat. Essayez un autre titre, ou saisissez-le à la main.</p>
        )}

        <button
          onClick={() => choose({ title: mode === 'recherche' ? text.trim() : '', author: '', genre: 'Roman', manual: true })}
          className="mt-5 inline-flex min-h-11 items-center gap-2 text-[14px] text-muted underline decoration-line underline-offset-4 hover:text-burgundy"
        >
          <PenLine size={15} strokeWidth={1.5} /> Saisir le livre manuellement
        </button>
      </section>
    </div>
  )
}
