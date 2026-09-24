import { Link } from 'react-router'
import { ArrowRight, BookmarkPlus, BookOpen, BookOpenCheck, Heart, Plus, Star } from 'lucide-react'
import type { Activity } from '../data/books'
import { useLibrary, useProfile, useStats } from '../store/library'
import { relativeDate } from '../lib/utils'
import { GlobalSearch } from '../components/GlobalSearch'
import { BookCard } from '../components/BookCard'
import { BookCover } from '../components/BookCover'
import { EmptyState, SectionHeader, StatBlock } from '../components/ui'

function greeting() {
  const h = new Date().getHours()
  return h >= 18 || h < 5 ? 'Bonsoir' : 'Bonjour'
}

const ACTIVITY_ICON = {
  added: Plus,
  rated: Star,
  finished: BookOpenCheck,
  started: BookOpen,
  wishlist: BookmarkPlus,
  favorite: Heart,
}

function ActivityText({ a }: { a: Activity }) {
  const t = <em className="font-serif text-[18px] not-italic font-medium text-ink">{a.title}</em>
  switch (a.kind) {
    case 'added':
      return <>Vous avez ajouté {t} à votre bibliothèque</>
    case 'rated':
      return (
        <>
          Vous avez noté {t} <span className="text-gold tracking-tight">{'★'.repeat(a.rating ?? 0)}</span>
        </>
      )
    case 'finished':
      return <>Vous avez terminé {t}</>
    case 'started':
      return <>Vous avez commencé {t}</>
    case 'wishlist':
      return <>Vous avez ajouté {t} à votre wishlist</>
    case 'favorite':
      return <>{t} rejoint vos coups de cœur</>
  }
}

export default function Home() {
  const { books, activity } = useLibrary()
  const profile = useProfile()
  const stats = useStats()
  const favorites = books.filter((b) => b.favorite).slice(0, 5)
  const reading = books.filter((b) => b.status === 'en-cours')
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div>
      <header className="mb-8">
        <p className="eyebrow mb-3 first-letter:uppercase">{today}</p>
        <h1 className="page-title">
          {greeting()}, {profile.name.split(' ')[0]}.
        </h1>
        <p className="mt-3 font-serif text-[20px] text-muted italic">Votre bibliothèque vous attend.</p>
      </header>

      <GlobalSearch />

      {/* Statistiques éditoriales */}
      <section aria-label="Ma collection" className="mt-10 grid grid-cols-3 divide-x divide-line border-y border-line py-6">
        <StatBlock value={stats.read} label="Livres lus" className="pr-4" />
        <StatBlock value={stats.reading} label="En cours" className="px-4" />
        <StatBlock value={stats.unread} label="À lire" className="pl-4" />
      </section>

      {/* Coups de cœur */}
      <section className="mt-14">
        <SectionHeader
          title="Mes coups de cœur"
          action={
            favorites.length > 0 && (
              <Link to="/bibliotheque?coeur=1" className="group flex items-center gap-1.5 pb-1 text-[13.5px] text-muted hover:text-burgundy">
                Tout voir <ArrowRight size={15} strokeWidth={1.5} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            )
          }
        />
        {favorites.length ? (
          <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-5 overflow-x-auto px-4 pt-2 pb-4">
            {favorites.map((b) => (
              <BookCard key={b.id} book={b} showStatus={false} className="w-[150px] shrink-0 snap-start" />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Heart size={26} strokeWidth={1.25} />}
            title="Pas encore de coups de cœur."
            text="Les livres qui vous marquent peuvent apparaître ici."
          />
        )}
      </section>

      <div className="mt-14 grid gap-14">
        {/* Activité récente */}
        <section>
          <SectionHeader title="Activité récente" />
          {activity.length ? (
            <ol className="relative">
              {activity.slice(0, 6).map((a) => {
                const Icon = ACTIVITY_ICON[a.kind]
                const inner = (
                  <>
                    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-muted transition-colors group-hover:border-burgundy/30 group-hover:text-burgundy">
                      <Icon size={15} strokeWidth={1.5} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] leading-snug text-ink/85">
                        <ActivityText a={a} />
                      </span>
                      <span className="mt-1 block text-[12.5px] text-muted">{relativeDate(a.at)}</span>
                    </span>
                  </>
                )
                const exists = a.bookId && books.some((b) => b.id === a.bookId)
                return (
                  <li key={a.id} className="border-b border-line/70 last:border-0">
                    {exists ? (
                      <Link to={`/livre/${a.bookId}`} className="group flex gap-4 py-4">
                        {inner}
                      </Link>
                    ) : (
                      <div className="group flex gap-4 py-4">{inner}</div>
                    )}
                  </li>
                )
              })}
            </ol>
          ) : (
            <p className="font-serif text-[19px] text-muted italic">Votre carnet de lecture est encore vierge.</p>
          )}
          <Link
            to="/ajouter"
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] border border-line bg-surface px-4.5 text-[14px] font-medium transition-colors hover:border-burgundy/40 hover:text-burgundy"
          >
            <Plus size={16} strokeWidth={1.5} /> Ajouter un livre
          </Link>
        </section>

        {/* En cours de lecture */}
        {reading.length > 0 && (
          <section>
            <SectionHeader title="Sur ma table de chevet" />
            <ul className="space-y-3">
              {reading.map((b) => (
                <li key={b.id}>
                  <Link
                    to={`/livre/${b.id}`}
                    className="group flex items-center gap-4 rounded-[var(--radius-card)] border border-transparent p-2 -mx-2 transition-colors hover:border-line hover:bg-surface"
                  >
                    <div className="w-[54px] shrink-0">
                      <BookCover title={b.title} author={b.author} src={b.cover} size="sm" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-serif text-[20px] leading-tight font-medium">{b.title}</p>
                      <p className="truncate text-[13.5px] text-muted">{b.author}</p>
                    </div>
                    <ArrowRight size={16} strokeWidth={1.5} className="mr-2 shrink-0 text-[#b5ac9f] transition-transform group-hover:translate-x-0.5 group-hover:text-burgundy" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}
