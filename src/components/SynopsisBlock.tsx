import { useEffect, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { getSynopsis, type Synopsis, type SynopsisQuery } from '../lib/synopsis'
import { cn } from '../lib/utils'

const LONG = 360

/**
 * Affiche le synopsis d'un livre. Si aucun n'est fourni, il est cherché en ligne
 * puis transmis via `onFound` (pour être enregistré avec le livre).
 */
export function SynopsisBlock({
  query,
  synopsis,
  onFound,
  className,
}: {
  query: SynopsisQuery
  synopsis?: Synopsis
  onFound?: (s: Synopsis) => void
  className?: string
}) {
  const [fetched, setFetched] = useState<{ key: string; value?: Synopsis; done: boolean }>()
  const [open, setOpen] = useState(false)
  const key = `${query.title}|${query.author}|${query.isbn ?? ''}`

  useEffect(() => {
    if (synopsis || !query.title) return
    let alive = true
    getSynopsis(query).then((value) => {
      if (!alive) return
      setFetched({ key, value, done: true })
      if (value) onFound?.(value)
    })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, synopsis])

  const current = synopsis ?? (fetched?.key === key ? fetched.value : undefined)
  const loading = !synopsis && !(fetched?.key === key && fetched.done)
  const long = (current?.text.length ?? 0) > LONG

  return (
    <section className={className} aria-busy={loading}>
      <h2 className="section-title">Synopsis</h2>

      {loading ? (
        <div className="mt-4 space-y-2.5" aria-label="Chargement du synopsis">
          {[100, 96, 92, 60].map((w, i) => (
            <div key={i} className="h-3.5 animate-pulse rounded-full bg-sand/80" style={{ width: `${w}%` }} />
          ))}
        </div>
      ) : current ? (
        <>
          {current.lang === 'en' && (
            <p className="mt-3 inline-block rounded-full bg-sand/70 px-2.5 py-0.5 text-[11.5px] text-muted">Disponible en anglais uniquement</p>
          )}
          <p
            lang={current.lang}
            className={cn('mt-3 font-serif text-[18.5px] leading-[1.55] text-ink/90', long && !open && 'line-clamp-6')}
          >
            {current.text}
          </p>
          {long && (
            <button
              onClick={() => setOpen((o) => !o)}
              className="mt-1 min-h-10 text-[13.5px] font-medium text-burgundy underline decoration-burgundy/30 underline-offset-4"
            >
              {open ? 'Réduire' : 'Lire la suite'}
            </button>
          )}
          <p className="mt-2 text-[12px] text-muted">
            Source :{' '}
            {current.url ? (
              <a href={current.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 underline decoration-line underline-offset-2">
                {current.source}
                <ArrowUpRight size={11} strokeWidth={1.5} />
              </a>
            ) : current.source === 'BnF' ? (
              'quatrième de couverture, catalogue de la BnF'
            ) : (
              current.source
            )}
          </p>
        </>
      ) : (
        <p className="mt-3 font-serif text-[18px] text-muted italic">Pas de synopsis disponible pour ce livre.</p>
      )}
    </section>
  )
}
