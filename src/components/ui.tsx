import { useEffect, useId, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { AnimatePresence, motion, useDragControls } from 'motion/react'
import { Check, ChevronDown, Heart, Star, X } from 'lucide-react'
import { cn } from '../lib/utils'
import { STATUS_LABEL, type ReadingStatus } from '../data/books'
import { useLibrary } from '../store/library'

/* ---------- Boutons ---------- */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: 'sm' | 'md'
  icon?: ReactNode
}

export function Button({ variant = 'secondary', size = 'md', icon, className, children, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] font-medium whitespace-nowrap transition-[background,color,border-color,transform] duration-200 select-none active:scale-[0.98] disabled:opacity-45 disabled:active:scale-100',
        size === 'md' ? 'min-h-11 px-4.5 text-[14px]' : 'min-h-9 px-3 text-[13px]',
        variant === 'primary' && 'bg-burgundy text-surface hover:bg-burgundy-dark',
        variant === 'secondary' && 'border border-line bg-surface text-ink hover:border-[#cfc6b7] hover:bg-[#fbf8f2]',
        variant === 'ghost' && 'text-ink hover:bg-sand/60',
        variant === 'danger' && 'border border-line bg-surface text-burgundy hover:border-burgundy/40 hover:bg-burgundy/5',
        className,
      )}
    >
      {icon}
      {children}
    </button>
  )
}

export function IconButton({
  label,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      {...rest}
      className={cn(
        'inline-flex size-11 items-center justify-center rounded-[var(--radius-control)] text-muted transition-colors hover:bg-sand/60 hover:text-ink',
        className,
      )}
    >
      {children}
    </button>
  )
}

/* ---------- En-tête de page ---------- */

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="mb-8 flex flex-col gap-5">
      <div>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="mt-3 font-serif text-[20px] text-muted italic">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2.5">{actions}</div>}
    </header>
  )
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4 border-b border-line pb-3">
      <h2 className="section-title">{title}</h2>
      {action}
    </div>
  )
}

/* ---------- Note (étoiles) ---------- */

export function RatingStars({
  value,
  onChange,
  size = 15,
  className,
}: {
  value: number
  onChange?: (v: number) => void
  size?: number
  className?: string
}) {
  const [hover, setHover] = useState(0)
  const shown = hover || value
  const interactive = !!onChange
  return (
    <div
      className={cn('flex items-center', interactive ? 'gap-0.5' : 'gap-[2px]', className)}
      onMouseLeave={() => setHover(0)}
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={value ? `Note : ${value} sur 5` : 'Pas encore noté'}
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= shown
        const star = (
          <Star
            size={size}
            strokeWidth={1.5}
            className={cn(
              'transition-all duration-150',
              filled ? 'fill-gold text-gold' : 'fill-transparent text-[#cbbfae]',
              interactive && hover >= i && 'scale-110',
            )}
          />
        )
        return interactive ? (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={value === i}
            aria-label={`${i} étoile${i > 1 ? 's' : ''}`}
            onMouseEnter={() => setHover(i)}
            onClick={() => onChange(value === i ? 0 : i)}
            className="-m-0.5 flex size-9 items-center justify-center rounded-md"
          >
            {star}
          </button>
        ) : (
          <span key={i}>{star}</span>
        )
      })}
    </div>
  )
}

/* ---------- Favori ---------- */

export function FavoriteButton({
  active,
  onToggle,
  size = 18,
  className,
  withLabel,
}: {
  active: boolean
  onToggle: () => void
  size?: number
  className?: string
  withLabel?: boolean
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? 'Retirer des coups de cœur' : 'Ajouter aux coups de cœur'}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onToggle()
      }}
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-colors',
        withLabel
          ? cn(
              'min-h-11 rounded-[var(--radius-control)] border px-4 text-[14px] font-medium',
              active ? 'border-burgundy/30 bg-burgundy/[0.06] text-burgundy' : 'border-line bg-surface text-ink hover:bg-[#fbf8f2]',
            )
          : 'size-9 rounded-full',
        className,
      )}
    >
      <motion.span
        key={active ? 'on' : 'off'}
        initial={{ scale: active ? 0.6 : 1 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 15 }}
        className="flex"
      >
        <Heart
          size={size}
          strokeWidth={1.5}
          className={cn(
            'transition-[fill,color] duration-300',
            active ? 'fill-burgundy text-burgundy' : 'fill-transparent text-current',
          )}
        />
      </motion.span>
      {withLabel && (active ? 'Coup de cœur' : 'Ajouter aux coups de cœur')}
    </button>
  )
}

/* ---------- Statut ---------- */

const STATUS_DOT: Record<ReadingStatus, string> = {
  lu: 'bg-ink',
  'en-cours': 'bg-burgundy',
  'non-lu': 'bg-transparent ring-1 ring-muted ring-inset',
}

export function StatusBadge({ status, className }: { status: ReadingStatus; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[13px] text-muted', className)}>
      <span className={cn('size-1.5 rounded-full', STATUS_DOT[status])} />
      {STATUS_LABEL[status]}
    </span>
  )
}

export function StatusSelect({ value, onChange }: { value: ReadingStatus; onChange: (s: ReadingStatus) => void }) {
  return (
    <Segmented
      value={value}
      onChange={(v) => onChange(v as ReadingStatus)}
      options={(Object.keys(STATUS_LABEL) as ReadingStatus[]).map((s) => ({ value: s, label: STATUS_LABEL[s] }))}
    />
  )
}

/* ---------- Statistique ---------- */

export function StatBlock({ value, label, className }: { value: ReactNode; label: string; className?: string }) {
  return (
    <div className={cn('min-w-0', className)}>
      <p className="font-serif text-[36px] leading-none font-medium lining-nums">{value}</p>
      <p className="mt-2 text-[13px] text-muted">{label}</p>
    </div>
  )
}

/* ---------- Onglets / segments / filtres ---------- */

export function Segmented({
  value,
  onChange,
  options,
  className,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: ReactNode; ariaLabel?: string }[]
  className?: string
}) {
  const id = useId()
  return (
    <div role="tablist" className={cn('inline-flex rounded-[var(--radius-control)] border border-line bg-surface p-1', className)}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={o.ariaLabel}
            onClick={() => onChange(o.value)}
            className={cn(
              'relative flex min-h-9 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-[7px] px-3 text-[13px] font-medium transition-colors',
              active ? 'text-surface' : 'text-muted hover:text-ink',
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-[7px] bg-ink"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            )}
            <span className="relative flex items-center gap-1.5">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export function FilterChips<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string; count?: number }[]
}) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-[13px] font-medium transition-colors',
              active
                ? 'border-burgundy bg-burgundy text-surface'
                : 'border-line bg-transparent text-ink hover:border-[#cbbfae] hover:bg-surface',
            )}
          >
            {o.label}
            {o.count !== undefined && (
              <span className={cn('tabular-nums', active ? 'text-surface/70' : 'text-muted')}>{o.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export function Select({
  value,
  onChange,
  options,
  label,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  label: string
}) {
  return (
    <label className="relative inline-flex min-h-11 items-center rounded-[var(--radius-control)] border border-line bg-surface text-[13px] font-medium transition-colors hover:border-[#cbbfae]">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-full min-h-11 cursor-pointer appearance-none bg-transparent pr-9 pl-3.5 outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={15} strokeWidth={1.5} className="pointer-events-none absolute right-3 text-muted" />
    </label>
  )
}

/* ---------- Formulaire ---------- */

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-[12.5px] text-muted">{hint}</span>}
    </label>
  )
}

export const inputClass =
  'w-full min-h-12 rounded-[var(--radius-control)] border border-line bg-surface px-4 text-[15px] text-ink placeholder:text-[#a39b8f] outline-none transition-[border-color,box-shadow] focus:border-[#bfb4a3] focus:shadow-[0_0_0_4px_rgba(122,48,56,0.07)]'

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-12 w-full items-center justify-between gap-4 text-left"
    >
      <span className="text-[15px]">{label}</span>
      <span
        className={cn(
          'relative inline-flex h-[26px] w-[44px] shrink-0 rounded-full transition-colors duration-200',
          checked ? 'bg-burgundy' : 'bg-line',
        )}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 600, damping: 35 }}
          className={cn('absolute top-[3px] size-5 rounded-full bg-surface shadow-sm', checked ? 'right-[3px]' : 'left-[3px]')}
        />
      </span>
    </button>
  )
}

/* ---------- États vides ---------- */

export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode
  title: string
  text: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center rounded-[var(--radius-card)] border border-dashed border-line px-6 py-16 text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-sand/60 text-burgundy">{icon}</div>
      <h3 className="font-serif text-[28px] leading-tight font-medium">{title}</h3>
      <p className="mt-2 max-w-sm text-[15px] text-muted">{text}</p>
      {action && <div className="mt-7">{action}</div>}
    </div>
  )
}

/* ---------- Modale ---------- */

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  const drag = useDragControls()
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <motion.div
            className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
            // Glisser vers le bas pour fermer, comme une feuille native
            drag="y"
            dragListener={false}
            dragControls={drag}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 600) onClose()
            }}
            className="relative max-h-[92dvh] w-full max-w-[var(--app-width)] overflow-y-auto rounded-t-[18px] border border-line bg-surface p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] shadow-[0_24px_60px_-20px_rgba(39,37,34,0.35)]"
          >
            <div
              onPointerDown={(e) => drag.start(e)}
              className="-mx-6 -mt-6 mb-2 flex h-8 cursor-grab touch-none items-center justify-center"
              aria-hidden
            >
              <span className="h-1 w-10 rounded-full bg-line" />
            </div>
            <div className="mb-5 flex items-start justify-between gap-4">
              <h2 className="font-serif text-[28px] leading-tight font-medium">{title}</h2>
              <IconButton label="Fermer" onClick={onClose} className="-mt-1.5 -mr-2.5">
                <X size={19} strokeWidth={1.5} />
              </IconButton>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

/* ---------- Notifications ---------- */

export function Toaster() {
  const { toasts } = useLibrary()
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(84px+env(safe-area-inset-bottom))] z-[70] flex flex-col items-center gap-2 px-4"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-3 rounded-full bg-ink py-2.5 pr-5 pl-3 text-[14px] text-surface shadow-[0_12px_30px_-12px_rgba(39,37,34,0.6)]"
          >
            <span className="flex size-6 items-center justify-center rounded-full bg-surface/12">
              <Check size={14} strokeWidth={2} className="text-gold" />
            </span>
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
