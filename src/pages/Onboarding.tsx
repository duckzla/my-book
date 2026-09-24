import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, BookMarked, Library, Sparkles } from 'lucide-react'
import { useLibrary, type ProfileInput, type StartWith } from '../store/library'
import { cn } from '../lib/utils'
import { Monogram } from '../components/Navigation'
import { AvatarPicker, ProfileFields } from '../components/ProfileForm'
import { Button } from '../components/ui'

const STEPS = 4

/** Premier lancement : création du profil, puis choix du point de départ. */
export default function Onboarding() {
  const { createProfile, books } = useLibrary()
  // Des livres existent déjà sur ce téléphone (profil effacé ou ancienne version) : on propose de les garder
  const hasBooks = books.length > 0
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [profile, setProfile] = useState<ProfileInput>({ name: '', bio: '' })
  const [start, setStart] = useState<StartWith>(hasBooks ? 'garder' : 'vide')
  const [showErrors, setShowErrors] = useState(false)

  const go = (to: number) => {
    setDir(to > step ? 1 : -1)
    setStep(to)
    window.scrollTo({ top: 0 })
  }

  const next = () => {
    if (step === 1 && !profile.name.trim()) {
      setShowErrors(true)
      return
    }
    if (step < STEPS - 1) go(step + 1)
    else createProfile({ ...profile, name: profile.name.trim(), bio: profile.bio.trim() }, start)
  }

  const first = profile.name.trim().split(/\s+/)[0]

  return (
    <div className="app-shell safe-top flex min-h-dvh flex-col">
      {/* En-tête : retour + progression */}
      <div className="flex h-14 items-center justify-between px-4">
        {step > 0 ? (
          <button onClick={() => go(step - 1)} aria-label="Étape précédente" className="-ml-2 flex size-11 items-center justify-center text-muted">
            <ArrowLeft size={20} strokeWidth={1.5} />
          </button>
        ) : (
          <span className="size-11" />
        )}
        {step > 0 && (
          <div className="flex gap-1.5" aria-label={`Étape ${step} sur ${STEPS - 1}`}>
            {Array.from({ length: STEPS - 1 }).map((_, i) => (
              <span key={i} className={cn('h-1 rounded-full transition-all duration-300', i < step ? 'w-6 bg-burgundy' : 'w-3 bg-line')} />
            ))}
          </div>
        )}
        <span className="size-11" />
      </div>

      <div className="relative flex-1 overflow-hidden px-6">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={step}
            custom={dir}
            initial={{ opacity: 0, x: dir * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -24 }}
            transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
            className="pb-8"
          >
            {step === 0 && (
              <div className="flex min-h-[60dvh] flex-col items-center justify-center pb-6 text-center">
                <Monogram size={132} />
                <h1 className="mt-9 font-serif text-[44px] leading-none font-medium">My Book</h1>
                <p className="mt-4 font-serif text-[22px] leading-snug text-muted italic">Votre bibliothèque de poche</p>
              </div>
            )}

            {step === 1 && (
              <>
                <h1 className="page-title mt-4">Faisons connaissance.</h1>
                <p className="mt-3 mb-8 text-[15px] text-muted">Ces informations composent votre profil de lecteur. Vous pourrez les modifier plus tard.</p>
                <ProfileFields value={profile} onChange={setProfile} showErrors={showErrors} />
              </>
            )}

            {step === 2 && (
              <>
                <h1 className="page-title mt-4">Votre portrait{first ? `, ${first}` : ''}.</h1>
                <p className="mt-3 mb-8 text-[15px] text-muted">Une photo, ou simplement votre initiale.</p>
                <AvatarPicker name={profile.name} value={profile.avatar} onChange={(avatar) => setProfile({ ...profile, avatar })} />
              </>
            )}

            {step === 3 && (
              <>
                <h1 className="page-title mt-4">Par où commencer ?</h1>
                <p className="mt-3 mb-8 text-[15px] text-muted">Vous pourrez toujours ajouter, retirer ou réinitialiser vos livres.</p>
                <div role="radiogroup" className="space-y-3">
                  {[
                    ...(hasBooks
                      ? [{ value: 'garder' as const, icon: Library, title: 'Garder mes livres', text: `Les ${books.length} livres déjà présents sur ce téléphone.` }]
                      : []),
                    { value: 'vide' as const, icon: BookMarked, title: 'Une bibliothèque vide', text: 'Vous ajoutez vos propres livres, un par un.' },
                    { value: 'exemples' as const, icon: Sparkles, title: 'Avec des livres d’exemple', text: 'Une vingtaine de classiques pour découvrir l’application.' },
                  ].map((o) => {
                    const active = start === o.value
                    return (
                      <button
                        key={o.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setStart(o.value)}
                        className={cn(
                          'flex w-full items-start gap-4 rounded-[var(--radius-card)] border p-5 text-left transition-colors',
                          active ? 'border-burgundy bg-burgundy/[0.04]' : 'border-line bg-surface',
                        )}
                      >
                        <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-full', active ? 'bg-burgundy text-surface' : 'bg-sand/70 text-burgundy')}>
                          <o.icon size={18} strokeWidth={1.5} />
                        </span>
                        <span>
                          <span className="block font-serif text-[21px] leading-tight font-medium">{o.title}</span>
                          <span className="mt-1 block text-[13.5px] text-muted">{o.text}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="sticky bottom-0 border-t border-line bg-paper/95 px-6 pt-4 pb-[calc(2rem+env(safe-area-inset-bottom))] backdrop-blur">
        <Button variant="primary" onClick={next} className="w-full min-h-12 text-[15px]">
          {step === 0 ? 'Créer mon profil' : step === STEPS - 1 ? 'Entrer dans ma bibliothèque' : 'Continuer'}
        </Button>
        {step === 2 && (
          <button onClick={next} className="mt-1 min-h-11 w-full text-[14px] text-muted">
            Passer cette étape
          </button>
        )}
      </div>
    </div>
  )
}
