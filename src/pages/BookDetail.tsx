import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ArrowLeft, BookX, Crown, PenLine, Trash2 } from 'lucide-react'
import { STATUS_LABEL, type Book } from '../data/books'
import { TOP_LIMIT, useLibrary, useProfile } from '../store/library'
import { formatDate } from '../lib/utils'
import { BookCover } from '../components/BookCover'
import { SynopsisBlock } from '../components/SynopsisBlock'
import { Button, EmptyState, FavoriteButton, Modal, RatingStars, StatusSelect, inputClass } from '../components/ui'

export default function BookDetail() {
  const { id } = useParams()
  const lib = useLibrary()
  const profile = useProfile()
  const navigate = useNavigate()
  const book = lib.getBook(id ?? '')
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!book) {
    return (
      <EmptyState
        icon={<BookX size={26} strokeWidth={1.25} />}
        title="Ce livre n'est plus sur l'étagère."
        text="Il a peut-être été retiré de votre bibliothèque."
        action={<Button onClick={() => navigate('/bibliotheque')}>Retour à la bibliothèque</Button>}
      />
    )
  }

  const rank = lib.top.indexOf(book.id)

  return (
    <article>
      <button
        onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/bibliotheque'))}
        className="group mb-8 inline-flex min-h-11 items-center gap-2 text-[14px] text-muted hover:text-ink"
      >
        <ArrowLeft size={17} strokeWidth={1.5} className="transition-transform group-hover:-translate-x-0.5" /> Retour
      </button>

      <div className="grid gap-10">
        {/* Couverture */}
        <div>
          <div className="mx-auto w-[62%] max-w-[340px]">
            <BookCover title={book.title} author={book.author} src={book.cover} size="lg" className="shadow-[0_2px_3px_rgba(39,37,34,0.1),0_30px_60px_-24px_rgba(39,37,34,0.45)]" />
            {rank >= 0 && (
              <p className="mt-5 flex items-center justify-center gap-2 text-[13px] text-muted">
                <Crown size={15} strokeWidth={1.5} className="text-gold" />
                N° {String(rank + 1).padStart(2, '0')} de mon Top Livres
              </p>
            )}
          </div>
        </div>

        {/* Informations */}
        <div>
          <div className="text-center">
            <p className="eyebrow">
              {book.genre}
              {book.year && <> · {book.year}</>}
              {book.pages && <> · {book.pages} pages</>}
            </p>
            <h1 className="mt-3 font-serif text-[40px] leading-[1.02] font-medium text-balance">{book.title}</h1>
            <p className="mt-3 font-serif text-[22px] text-muted italic">{book.author}</p>
          </div>

          <div className="mt-8 flex flex-col items-center gap-3 border-y border-line py-6">
            <RatingStars value={book.rating} size={22} onChange={(r) => lib.setRating(book.id, r)} />
            <span className="text-[13.5px] text-muted">{book.rating ? `${book.rating} sur 5` : 'Pas encore noté'}</span>
          </div>

          {book.note && (
            <blockquote className="mt-8 border-l-2 border-burgundy/60 pl-5 font-serif text-[24px] leading-snug italic">
              « {book.note} »
            </blockquote>
          )}

          <div className="mt-8">
            <p className="mb-3 text-[13px] font-medium">Changer le statut</p>
            <StatusSelect
              value={book.status}
              onChange={(s) => {
                lib.setStatus(book.id, s)
                lib.toast(`Statut mis à jour : ${STATUS_LABEL[s]}`)
              }}
            />
          </div>

          <div className="mt-8 flex flex-wrap gap-2.5">
            <FavoriteButton
              withLabel
              active={book.favorite}
              onToggle={() => {
                lib.toggleFavorite(book.id)
                lib.toast(book.favorite ? 'Retiré de vos coups de cœur' : 'Ajouté à vos coups de cœur')
              }}
            />
            {rank < 0 && (
              <Button
                icon={<Crown size={16} strokeWidth={1.5} />}
                onClick={() => {
                  if (lib.addToTop(book.id)) lib.toast('Ajouté à votre Top Livres')
                  else lib.toast(`Votre Top compte déjà ${TOP_LIMIT} livres`)
                }}
              >
                Ajouter au Top
              </Button>
            )}
            <Button icon={<PenLine size={16} strokeWidth={1.5} />} onClick={() => setEditing(true)}>
              {book.comment ? 'Modifier mon commentaire' : 'Écrire mon commentaire'}
            </Button>
            <Button variant="danger" icon={<Trash2 size={16} strokeWidth={1.5} />} onClick={() => setConfirmDelete(true)}>
              Supprimer
            </Button>
          </div>

          <SynopsisBlock
            className="mt-12"
            query={{ title: book.title, author: book.author, isbn: book.isbn }}
            synopsis={book.synopsis}
            onFound={(synopsis) => lib.updateBook(book.id, { synopsis })}
          />

          {/* Carnet de lecture */}
          <section className="mt-14">
            <h2 className="section-title">Mon commentaire</h2>
            <div className="relative mt-5 rounded-[var(--radius-card)] border border-line bg-surface px-6 py-6">
              <span className="absolute top-0 bottom-0 left-4 w-px bg-burgundy/20" aria-hidden />
              {book.comment ? (
                <p className="journal-lines font-serif text-[20px] text-ink/90 italic">{book.comment}</p>
              ) : (
                <button onClick={() => setEditing(true)} className="journal-lines w-full text-left font-serif text-[20px] text-muted italic hover:text-burgundy">
                  Écrire quelques lignes sur cette lecture…
                </button>
              )}
              <p className="mt-4 text-right font-serif text-[16px] text-muted">— {book.finishedAt ? `lu le ${formatDate(book.finishedAt)}` : profile.name}</p>
            </div>

            <dl className="mt-8 grid grid-cols-1 gap-5 border-t border-line pt-6">
              <div>
                <dt className="eyebrow">Date d'ajout</dt>
                <dd className="mt-1.5 font-serif text-[20px]">{formatDate(book.addedAt)}</dd>
              </div>
              <div>
                <dt className="eyebrow">Statut</dt>
                <dd className="mt-1.5 font-serif text-[20px]">{STATUS_LABEL[book.status]}</dd>
              </div>
              <div>
                <dt className="eyebrow">Note personnelle</dt>
                <dd className="mt-1.5 font-serif text-[20px]">{book.rating ? `${book.rating} / 5` : '—'}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>

      <CommentModal book={book} open={editing} onClose={() => setEditing(false)} />

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Retirer ce livre ?">
        <p className="text-[15px] text-muted">
          <span className="font-serif text-[19px] text-ink italic">{book.title}</span> sera retiré de votre bibliothèque, avec votre note et votre commentaire.
        </p>
        <div className="mt-7 grid grid-cols-2 gap-2.5">
          <Button onClick={() => setConfirmDelete(false)}>Annuler</Button>
          <Button
            variant="primary"
            onClick={() => {
              lib.removeBook(book.id)
              lib.toast('Livre retiré de la bibliothèque')
              navigate('/bibliotheque', { replace: true })
            }}
          >
            Supprimer
          </Button>
        </div>
      </Modal>
    </article>
  )
}

function CommentModal({ book, open, onClose }: { book: Book; open: boolean; onClose: () => void }) {
  const { updateBook, toast } = useLibrary()
  const [draft, setDraft] = useState(book.comment ?? '')
  const [lastOpen, setLastOpen] = useState(open)
  if (open !== lastOpen) {
    setLastOpen(open)
    if (open) setDraft(book.comment ?? '')
  }

  return (
    <Modal open={open} onClose={onClose} title="Mon commentaire">
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault()
          updateBook(book.id, { comment: draft.trim() || undefined })
          toast('Commentaire enregistré')
          onClose()
        }}
      >
        <textarea
          autoFocus
          aria-label="Mon commentaire"
          className={inputClass + ' min-h-44 resize-y py-3 font-serif text-[18px] leading-relaxed italic'}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Partagez vos impressions…"
        />
        <div className="grid grid-cols-2 gap-2.5">
          <Button type="button" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" variant="primary">
            Enregistrer
          </Button>
        </div>
      </form>
    </Modal>
  )
}
