import { useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Bookmark, Library, Plus, X } from 'lucide-react'
import type { WishItem } from '../data/books'
import { useLibrary } from '../store/library'
import { BookCover } from '../components/BookCover'
import { Button, EmptyState, PageHeader } from '../components/ui'

export default function Wishlist() {
  const { wishlist } = useLibrary()
  const navigate = useNavigate()
  const items = [...wishlist].sort((a, b) => b.addedAt.localeCompare(a.addedAt))

  return (
    <div>
      <PageHeader
        title="Mes envies de lecture"
        subtitle="Les livres que j’aimerais accueillir dans ma bibliothèque."
        actions={
          wishlist.length > 0 && (
            <Button icon={<Plus size={17} strokeWidth={1.5} />} onClick={() => navigate('/ajouter?dest=wishlist')}>
              Ajouter une envie
            </Button>
          )
        }
      />

      {wishlist.length === 0 ? (
        <EmptyState
          icon={<Bookmark size={26} strokeWidth={1.25} />}
          title="Votre wishlist est vide."
          text="Gardez une trace des livres que vous aimeriez découvrir."
          action={
            <Button variant="primary" onClick={() => navigate('/ajouter?dest=wishlist')}>
              Découvrir des livres
            </Button>
          }
        />
      ) : (
        <motion.ul layout className="grid grid-cols-2 gap-x-5 gap-y-10">
          <AnimatePresence mode="popLayout">
            {items.map((w) => (
              <motion.li
                key={w.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.96, transition: { duration: 0.25 } }}
              >
                <WishCard item={w} />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </div>
  )
}

function WishCard({ item }: { item: WishItem }) {
  const { moveWishToLibrary, removeWish, toast } = useLibrary()
  return (
    <article className="group relative">
      <div className="relative rounded-[var(--radius-card)] bg-sand/45 p-3 transition-colors duration-300 group-hover:bg-sand/70">
        <div className="transition-transform duration-300 group-hover:-translate-y-1">
          <BookCover title={item.title} author={item.author} src={item.cover} size="sm" className="shadow-[0_6px_14px_-8px_rgba(39,37,34,0.35)]" />
        </div>
        <button
          onClick={() => {
            removeWish(item.id)
            toast('Retiré de votre wishlist')
          }}
          aria-label={`Retirer ${item.title} de la wishlist`}
          className="absolute top-1.5 right-1.5 flex size-9 items-center justify-center rounded-full bg-surface/90 text-muted opacity-100 shadow-soft transition-opacity hover:text-ink"
        >
          <X size={15} strokeWidth={1.5} />
        </button>
      </div>

      <div className="mt-3.5">
        <h3 className="line-clamp-2 font-serif text-[19px] leading-[1.15] font-medium">{item.title}</h3>
        <p className="mt-0.5 truncate text-[13px] text-muted">{item.author}</p>
        {item.reason && <p className="mt-1.5 font-serif text-[15px] text-muted italic">« {item.reason} »</p>}
        <button
          onClick={() => {
            moveWishToLibrary(item.id)
            toast(`« ${item.title} » a rejoint votre bibliothèque`)
          }}
          className="mt-3 inline-flex min-h-10 items-center gap-1.5 text-left text-[13px] leading-snug font-medium text-ink underline decoration-line decoration-1 underline-offset-[5px] transition-colors hover:text-burgundy hover:decoration-burgundy/40"
        >
          <Library size={14} strokeWidth={1.5} /> Ajouter à ma bibliothèque
        </button>
      </div>
    </article>
  )
}
