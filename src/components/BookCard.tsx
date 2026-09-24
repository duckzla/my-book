import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import type { Book } from '../data/books'
import { useLibrary } from '../store/library'
import { cn } from '../lib/utils'
import { BookCover } from './BookCover'
import { FavoriteButton, RatingStars, StatusBadge } from './ui'

export function BookCard({ book, className, showStatus = true }: { book: Book; className?: string; showStatus?: boolean }) {
  const { toggleFavorite, toast } = useLibrary()

  return (
    <article className={cn('relative', className)}>
      <Link
        to={`/livre/${book.id}`}
        className="block rounded-[var(--radius-cover)] transition-transform duration-200 active:scale-[0.97]"
        aria-label={`${book.title}, ${book.author}`}
      >
        <BookCover title={book.title} author={book.author} src={book.cover} />
      </Link>

      {/* Favori : toujours accessible au pouce */}
      <FavoriteButton
        active={book.favorite}
        onToggle={() => {
          toggleFavorite(book.id)
          toast(book.favorite ? 'Retiré de vos coups de cœur' : 'Ajouté à vos coups de cœur')
        }}
        size={16}
        className={cn(
          'absolute top-2 right-2 bg-surface/92 shadow-soft backdrop-blur',
          book.favorite ? 'text-burgundy' : 'text-ink/70',
        )}
      />

      <Link to={`/livre/${book.id}`} className="mt-3.5 block">
        <h3 className="line-clamp-2 font-serif text-[20px] leading-[1.15] font-medium">{book.title}</h3>
        <p className="mt-1 truncate text-[13.5px] text-muted">{book.author}</p>
      </Link>
      {(book.rating > 0 || showStatus) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          {book.rating > 0 && <RatingStars value={book.rating} size={13} />}
          {showStatus && <StatusBadge status={book.status} />}
        </div>
      )}
    </article>
  )
}

export function BookListRow({ book }: { book: Book }) {
  const { toggleFavorite } = useLibrary()
  return (
    <Link
      to={`/livre/${book.id}`}
      className="grid grid-cols-[56px_1fr_auto] items-center gap-4 border-b border-line py-4 transition-colors active:bg-surface"
    >
      <BookCover title={book.title} author={book.author} src={book.cover} size="sm" />
      <div className="min-w-0">
        <h3 className="truncate font-serif text-[20px] leading-tight font-medium">{book.title}</h3>
        <p className="truncate text-[13.5px] text-muted">
          {book.author} · {book.genre}
        </p>
        <div className="mt-1.5 flex items-center gap-3">
          {book.rating > 0 && <RatingStars value={book.rating} size={12} />}
          <StatusBadge status={book.status} />
        </div>
      </div>
      <div className="flex items-center justify-end">
        {book.favorite ? (
          <FavoriteButton active onToggle={() => toggleFavorite(book.id)} size={16} className="text-burgundy" />
        ) : (
          <ChevronRight size={17} strokeWidth={1.5} className="text-[#b5ac9f]" />
        )}
      </div>
    </Link>
  )
}
