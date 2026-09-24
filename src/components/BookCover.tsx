import { useState } from 'react'
import { cn, hash } from '../lib/utils'

// Couvertures de secours : tons sourds, typographie éditoriale
const PALETTES = [
  { bg: '#5B252B', fg: '#F3E6D6', rule: '#B18A4A' },
  { bg: '#2F3B35', fg: '#EDE5D6', rule: '#B18A4A' },
  { bg: '#2C3440', fg: '#E9E1D2', rule: '#C9A56A' },
  { bg: '#8A6A3F', fg: '#FBF5EA', rule: '#FBF5EA' },
  { bg: '#E8DED0', fg: '#272522', rule: '#7A3038' },
  { bg: '#3A302B', fg: '#EFE3D0', rule: '#B18A4A' },
  { bg: '#6E7A68', fg: '#F7F4EE', rule: '#F7F4EE' },
]

interface Props {
  title: string
  author: string
  /** Une couverture, ou plusieurs candidates essayées dans l'ordre */
  src?: string | string[]
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function BookCover({ title, author, src, className, size = 'md' }: Props) {
  const sources = (Array.isArray(src) ? src : [src]).filter((s): s is string => !!s)
  const key = sources.join('|')
  const [state, setState] = useState({ key, index: 0, loaded: false })
  // Nouvelle liste de sources : on repart de la première
  if (state.key !== key) setState({ key, index: 0, loaded: false })
  const current = sources[state.index]
  const loaded = state.loaded
  const fail = () => setState((s) => ({ ...s, index: s.index + 1, loaded: false }))
  const showImage = !!current
  const p = PALETTES[hash(title + author) % PALETTES.length]

  return (
    <div
      className={cn(
        'relative aspect-[2/3] w-full overflow-hidden rounded-[var(--radius-cover)] bg-sand shadow-book',
        className,
      )}
    >
      {(!showImage || !loaded) && (
        <div
          className="absolute inset-0 flex flex-col justify-between p-[9%] text-center"
          style={{ background: p.bg, color: p.fg }}
          aria-hidden={!!showImage}
        >
          <div className="mx-auto h-px w-1/3 opacity-70" style={{ background: p.rule }} />
          <div>
            <p
              className={cn(
                'font-serif leading-[1.05] font-medium text-balance',
                size === 'sm' ? 'text-[13px]' : size === 'lg' ? 'text-[30px]' : 'text-[20px]',
              )}
            >
              {title}
            </p>
            <div className="mx-auto my-[8%] h-px w-6 opacity-70" style={{ background: p.rule }} />
            <p className={cn('tracking-[0.14em] uppercase opacity-80', size === 'sm' ? 'text-[6px]' : 'text-[9px]')}>
              {author}
            </p>
          </div>
          <p className={cn('font-serif italic opacity-60', size === 'sm' ? 'text-[7px]' : 'text-[11px]')}>M·B</p>
        </div>
      )}
      {showImage && (
        <img
          key={current}
          src={current}
          alt={`Couverture de ${title}`}
          loading="lazy"
          onLoad={(e) => {
            // Open Library renvoie parfois une image 1×1 quand la couverture n'existe pas
            if ((e.currentTarget as HTMLImageElement).naturalWidth < 10) fail()
            else setState((s) => ({ ...s, loaded: true }))
          }}
          onError={fail}
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition-opacity duration-500',
            loaded ? 'opacity-100' : 'opacity-0',
          )}
        />
      )}
      {/* Reliure : léger dégradé côté dos pour l'effet objet */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, rgba(0,0,0,0.18) 0%, rgba(255,255,255,0.10) 2.5%, rgba(0,0,0,0.04) 5%, transparent 9%)',
        }}
      />
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-black/5 ring-inset" />
    </div>
  )
}
