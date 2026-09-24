import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowRight, Crown, PenLine, Share2, Trash2 } from 'lucide-react'
import { useLibrary, useProfile, useStats, type ProfileInput } from '../store/library'
import { BookCover } from '../components/BookCover'
import { RankingItem } from '../components/Ranking'
import { ShareModal } from '../components/ShareModal'
import { Button, Modal, SectionHeader, StatBlock } from '../components/ui'
import { Avatar, AvatarPicker, ProfileFields } from '../components/ProfileForm'

export default function Profile() {
  const lib = useLibrary()
  const stats = useStats()
  const navigate = useNavigate()
  const profile = useProfile()
  const [sharing, setSharing] = useState(false)
  const [editing, setEditing] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const since = new Date(profile.since + 'T12:00:00').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  const top = lib.top.map((id) => lib.getBook(id)).filter((b) => !!b).slice(0, 5)
  const genres = stats.genres.slice(0, 4)
  const maxGenre = genres[0]?.[1] ?? 1
  const lastRead = lib.books
    .filter((b) => b.status === 'lu' && b.finishedAt)
    .sort((a, b) => (b.finishedAt ?? '').localeCompare(a.finishedAt ?? ''))
    .slice(0, 6)

  return (
    <div>
      {/* Carte d'identité littéraire */}
      <header className="relative overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
        <div className="h-24 bg-sand/60" aria-hidden>
          <svg className="h-full w-full text-line" preserveAspectRatio="none" viewBox="0 0 400 100">
            {Array.from({ length: 60 }).map((_, i) => (
              <rect key={i} x={i * 7 + 2} y={30 + ((i * 37) % 30)} width={5} height={100} fill="currentColor" opacity={0.25 + ((i * 13) % 5) / 12} />
            ))}
          </svg>
        </div>
        <div className="flex flex-col items-center px-6 pb-8 text-center">
          <Avatar name={profile.name} src={profile.avatar} size={96} className="-mt-12 border-4 border-surface" />
          <div className="mt-4 min-w-0 flex-1">
            <h1 className="page-title break-words">{profile.name}</h1>
            {profile.bio && <p className="mt-2 font-serif text-[21px] text-muted italic">« {profile.bio} »</p>}
          </div>
          <div className="mt-6 flex flex-col items-center gap-2">
            <div className="flex gap-2">
              <Button icon={<PenLine size={16} strokeWidth={1.5} />} onClick={() => setEditing(true)}>
                Modifier
              </Button>
              <Button variant="primary" icon={<Share2 size={16} strokeWidth={1.5} />} onClick={() => setSharing(true)}>
                Partager mon profil
              </Button>
            </div>
            <p className="text-[12.5px] text-muted">Membre depuis {since}</p>
          </div>
        </div>
      </header>

      {/* Statistiques */}
      <section aria-label="Statistiques" className="mt-10 grid grid-cols-3 divide-x divide-line border-y border-line py-6 text-center">
        <StatBlock value={stats.total} label="Livres" />
        <StatBlock value={stats.read} label="Livres lus" />
        <StatBlock value={stats.average ? stats.average.toLocaleString('fr-FR', { maximumFractionDigits: 1, minimumFractionDigits: 1 }) : '—'} label="Note moyenne" />
      </section>

      <div className="mt-14 grid gap-14">
        {/* Genres */}
        <section>
          <SectionHeader title="Mes genres préférés" />
          {genres.length === 0 && <p className="font-serif text-[19px] text-muted italic">Vos genres préférés apparaîtront avec vos premiers livres.</p>}
          <ul className="space-y-6">
            {genres.map(([g, n], i) => (
              <li key={g}>
                <Link to={`/bibliotheque?genre=${encodeURIComponent(g)}`} className="group block">
                  <div className="mb-2 flex items-baseline justify-between">
                    <span className="font-serif text-[21px] font-medium group-hover:text-burgundy">{g}</span>
                    <span className="text-[13px] text-muted tabular-nums">
                      {Math.round((n / stats.total) * 100)} %
                    </span>
                  </div>
                  <div className="h-[3px] rounded-full bg-sand">
                    <div
                      className="h-full rounded-full transition-[width] duration-700"
                      style={{ width: `${(n / maxGenre) * 100}%`, background: i === 0 ? 'var(--color-burgundy)' : 'var(--color-ink)', opacity: i === 0 ? 1 : 0.55 - i * 0.1 }}
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Top Livres */}
        <section>
          <SectionHeader
            title="Mon Top Livres"
            action={
              <Link to="/top" className="group flex items-center gap-1.5 pb-1 text-[13.5px] text-muted hover:text-burgundy">
                Voir le classement <ArrowRight size={15} strokeWidth={1.5} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            }
          />
          {top.length ? (
            <div className="-mt-4">
              {top.map((b, i) => (
                <RankingItem key={b.id} book={b} index={i} />
              ))}
            </div>
          ) : (
            <div className="rounded-[var(--radius-card)] border border-dashed border-line p-8 text-center">
              <Crown size={24} strokeWidth={1.25} className="mx-auto text-gold" />
              <p className="mt-3 font-serif text-[22px]">Votre classement reste à écrire.</p>
              <Button className="mt-5" onClick={() => navigate('/top')}>
                Composer mon Top
              </Button>
            </div>
          )}
        </section>
      </div>

      {lastRead.length > 0 && (
        <section className="mt-16">
          <SectionHeader title="Dernièrement refermés" />
          <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2">
            {lastRead.map((b) => (
              <Link key={b.id} to={`/livre/${b.id}`} className="w-[110px] shrink-0 transition-transform duration-300 hover:-translate-y-1">
                <BookCover title={b.title} author={b.author} src={b.cover} size="sm" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mt-20 flex flex-col items-center border-t border-line pt-6">
        <button onClick={() => setConfirmReset(true)} className="inline-flex min-h-11 items-center gap-2 text-[13px] text-muted hover:text-burgundy">
          <Trash2 size={14} strokeWidth={1.5} /> Réinitialiser l’application
        </button>
      </div>

      <ShareModal open={sharing} onClose={() => setSharing(false)} />
      <EditProfileModal open={editing} onClose={() => setEditing(false)} />

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Tout effacer ?">
        <p className="text-[15px] text-muted">
          Votre profil, vos livres, votre wishlist et votre Top seront supprimés de ce téléphone. Vous reviendrez à l’écran d’accueil.
        </p>
        <div className="mt-7 grid grid-cols-2 gap-2.5">
          <Button onClick={() => setConfirmReset(false)}>Annuler</Button>
          <Button
            variant="primary"
            onClick={() => {
              setConfirmReset(false)
              lib.resetApp()
              navigate('/', { replace: true })
            }}
          >
            Tout effacer
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function EditProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { updateProfile, toast } = useLibrary()
  const profile = useProfile()
  const toInput = (): ProfileInput => ({ name: profile.name, bio: profile.bio, avatar: profile.avatar })
  const [draft, setDraft] = useState<ProfileInput>(toInput)
  const [showErrors, setShowErrors] = useState(false)
  const [lastOpen, setLastOpen] = useState(open)
  if (open !== lastOpen) {
    setLastOpen(open)
    if (open) {
      setDraft(toInput())
      setShowErrors(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Mon profil">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!draft.name.trim()) {
            setShowErrors(true)
            return
          }
          updateProfile({ ...draft, name: draft.name.trim(), bio: draft.bio.trim() })
          toast('Profil mis à jour')
          onClose()
        }}
      >
        <AvatarPicker name={draft.name} value={draft.avatar} onChange={(avatar) => setDraft({ ...draft, avatar })} />
        <div className="mt-6">
          <ProfileFields value={draft} onChange={setDraft} showErrors={showErrors} />
        </div>
        <div className="mt-7 grid grid-cols-2 gap-2.5">
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
