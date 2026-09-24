import type { ReactNode } from 'react'
import { Link } from 'react-router'
import type { Book } from '../data/books'
import { cn } from '../lib/utils'
import { BookCover } from './BookCover'

export const rankLabel = (i: number) => String(i + 1).padStart(2, '0')

export function RankNumber({ index, className }: { index: number; className?: string }) {
  const podium = index < 3
  return (
    <span
      className={cn(
        'font-serif leading-none font-medium lining-nums',
        podium ? 'text-gold' : 'text-[#b9b0a3]',
        className,
      )}
    >
      {rankLabel(index)}
    </span>
  )
}

export function RankingItem({
  book,
  index,
  handle,
  trailing,
  linked = true,
}: {
  book: Book
  index: number
  handle?: ReactNode
  trailing?: ReactNode
  linked?: boolean
}) {
  const podium = index < 3
  const body = (
    <>
      <RankNumber index={index} className={cn('w-12 shrink-0 text-center', podium ? 'text-[40px]' : 'text-[32px]')} />
      <div className={cn('shrink-0', podium ? 'w-[64px]' : 'w-[52px]')}>
        <BookCover title={book.title} author={book.author} src={book.cover} size="sm" />
      </div>
      <div className="min-w-0 flex-1">
        {podium && (
          <p className="mb-1 text-[11px] tracking-[0.16em] text-gold uppercase">
            {index === 0 ? 'Livre de chevet' : index === 1 ? 'Deuxième place' : 'Troisième place'}
          </p>
        )}
        <h3 className={cn('line-clamp-2 font-serif leading-[1.1] font-medium', podium ? 'text-[22px]' : 'text-[19px]')}>
          {book.title}
        </h3>
        <p className="mt-1 truncate text-[13.5px] text-muted">{book.author}</p>
              </div>
    </>
  )
  return (
    <div
      className={cn(
        'flex items-center gap-3 border-b border-line py-4',
        podium && 'bg-linear-to-r from-gold/[0.08] via-gold/[0.02] to-transparent',
      )}
    >
      {handle}
      {linked ? (
        <Link to={`/livre/${book.id}`} className="group flex min-w-0 flex-1 items-center gap-3">
          {body}
        </Link>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3">{body}</div>
      )}
      {trailing}
    </div>
  )
}
