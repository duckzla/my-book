import { useState } from 'react'
import { useNavigate } from 'react-router'
import { AnimatePresence, Reorder, motion, useDragControls } from 'motion/react'
import { ArrowLeft, Crown, GripVertical, PenLine, Plus, X } from 'lucide-react'
import type { Book } from '../data/books'
import { TOP_LIMIT, useLibrary } from '../store/library'
import { BookCover } from '../components/BookCover'
import { RankingItem } from '../components/Ranking'
import { Button, EmptyState, PageHeader, SectionHeader } from '../components/ui'

export default function TopBooks() {
  const lib = useLibrary()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<string[]>(lib.top)

  const current = (editing ? draft : lib.top).map((id) => lib.getBook(id)).filter((b): b is Book => !!b)
  const candidates = lib.books
    .filter((b) => !draft.includes(b.id) && (b.favorite || b.rating >= 4))
    .sort((a, b) => Number(b.favorite) - Number(a.favorite) || b.rating - a.rating)

  const start = () => {
    setDraft(lib.top.filter((id) => lib.getBook(id)))
    setEditing(true)
  }
  const save = () => {
    lib.setTop(draft)
    setEditing(false)
    lib.toast('Classement enregistré')
  }

  return (
    <div>
      <button onClick={() => navigate('/profil')} className="group mb-6 inline-flex min-h-11 items-center gap-2 text-[14px] text-muted hover:text-ink">
        <ArrowLeft size={17} strokeWidth={1.5} className="transition-transform group-hover:-translate-x-0.5" /> Profil
      </button>
      <PageHeader
        title="Mon Top Livres"
        subtitle="Les livres qui comptent le plus pour moi."
        actions={
          editing ? (
            <>
              <Button onClick={() => setEditing(false)}>Annuler</Button>
              <Button variant="primary" onClick={save}>
                Enregistrer
              </Button>
            </>
          ) : (
            <Button icon={<PenLine size={16} strokeWidth={1.5} />} onClick={start}>
              Modifier mon classement
            </Button>
          )
        }
      />

      {editing && (
        <p className="mb-4 text-[13.5px] text-muted">
          Maintenez la poignée et faites glisser pour réordonner. {draft.length} / {TOP_LIMIT}
        </p>
      )}

      {current.length === 0 && !editing ? (
        <EmptyState
          icon={<Crown size={26} strokeWidth={1.25} />}
          title="Votre classement reste à écrire."
          text="Choisissez les livres qui ont compté, et donnez-leur une place."
          action={
            <Button variant="primary" onClick={start}>
              Composer mon Top
            </Button>
          }
        />
      ) : editing ? (
        <Reorder.Group axis="y" values={draft} onReorder={setDraft} className="border-t border-line">
          {current.map((b, i) => (
            <EditableRow
              key={b.id}
              book={b}
              index={i}
              onRemove={() => setDraft((d) => d.filter((x) => x !== b.id))}
            />
          ))}
        </Reorder.Group>
      ) : (
        <motion.ol layout className="border-t border-line">
          {current.map((b, i) => (
            <motion.li key={b.id} layout transition={{ type: 'spring', stiffness: 400, damping: 40 }}>
              <RankingItem book={b} index={i} />
            </motion.li>
          ))}
        </motion.ol>
      )}

      <AnimatePresence>
        {editing && (
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-14">
            <SectionHeader title="Ajouter au classement" />
            {draft.length >= TOP_LIMIT ? (
              <p className="text-[14px] text-muted">Votre Top est complet. Retirez un livre pour en ajouter un autre.</p>
            ) : candidates.length === 0 ? (
              <p className="text-[14px] text-muted">Vos coups de cœur et vos lectures les mieux notées apparaîtront ici.</p>
            ) : (
              <ul className="grid grid-cols-3 gap-4">
                {candidates.map((b) => (
                  <li key={b.id}>
                    <button onClick={() => setDraft((d) => [...d, b.id])} className="group w-full text-left" aria-label={`Ajouter ${b.title} au classement`}>
                      <div className="relative">
                        <BookCover title={b.title} author={b.author} src={b.cover} size="sm" />
                        <span className="absolute inset-0 flex items-center justify-center rounded-[var(--radius-cover)] bg-ink/0 transition-colors group-hover:bg-ink/35">
                          <span className="flex size-10 scale-90 items-center justify-center rounded-full bg-surface text-burgundy opacity-0 shadow-soft transition-all group-hover:scale-100 group-hover:opacity-100">
                            <Plus size={18} strokeWidth={1.75} />
                          </span>
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 font-serif text-[15px] leading-tight">{b.title}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}

function EditableRow({
  book,
  index,
  onRemove,
}: {
  book: Book
  index: number
  onRemove: () => void
}) {
  const controls = useDragControls()
  return (
    <Reorder.Item
      value={book.id}
      dragListener={false}
      dragControls={controls}
      className="relative bg-paper"
      whileDrag={{ scale: 1.015, boxShadow: '0 18px 40px -18px rgba(39,37,34,0.4)', zIndex: 10, backgroundColor: '#FFFCF7' }}
      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
    >
      <RankingItem
        book={book}
        index={index}
        linked={false}
        handle={
          <button
            onPointerDown={(e) => controls.start(e)}
            aria-label="Faire glisser pour réordonner"
            className="flex size-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-[var(--radius-control)] text-muted hover:bg-sand/60 hover:text-ink active:cursor-grabbing"
          >
            <GripVertical size={18} strokeWidth={1.5} />
          </button>
        }
        trailing={
          <div className="flex shrink-0 items-center">
            <button onClick={onRemove} aria-label={`Retirer ${book.title} du classement`} className="flex size-11 items-center justify-center rounded-[var(--radius-control)] text-muted hover:bg-burgundy/5 hover:text-burgundy">
              <X size={17} strokeWidth={1.5} />
            </button>
          </div>
        }
      />
    </Reorder.Item>
  )
}
