import { useRef, useState } from 'react'
import { Camera, Trash2 } from 'lucide-react'
import type { ProfileInput } from '../store/library'
import { resizeImage } from '../lib/image'
import { cn } from '../lib/utils'
import { Field, inputClass } from './ui'

export function Avatar({ name, src, size = 96, className }: { name: string; src?: string; size?: number; className?: string }) {
  return (
    <div
      className={cn('flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-burgundy font-serif leading-none text-surface', className)}
      style={{ width: size, height: size, fontSize: size * 0.46 }}
    >
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : (name.trim()[0] ?? '·').toUpperCase()}
    </div>
  )
}

export function AvatarPicker({ value, name, onChange }: { value?: string; name: string; onChange: (v?: string) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={() => input.current?.click()}
        aria-label={value ? 'Changer la photo' : 'Ajouter une photo'}
        className="relative rounded-full"
      >
        <Avatar name={name} src={value} size={104} className="border-4 border-surface shadow-soft" />
        <span className="absolute right-0 bottom-0 flex size-9 items-center justify-center rounded-full border-2 border-surface bg-ink text-surface">
          <Camera size={16} strokeWidth={1.5} />
        </span>
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (!file) return
          try {
            setError(null)
            onChange(await resizeImage(file))
          } catch {
            setError('Cette image n’a pas pu être lue.')
          }
        }}
      />
      {value ? (
        <button type="button" onClick={() => onChange(undefined)} className="mt-2 inline-flex min-h-10 items-center gap-1.5 text-[13px] text-muted">
          <Trash2 size={14} strokeWidth={1.5} /> Retirer la photo
        </button>
      ) : (
        <p className="mt-2 text-[13px] text-muted">Photo facultative</p>
      )}
      {error && <p className="mt-1 text-[13px] text-burgundy">{error}</p>}
    </div>
  )
}

/** Champs du profil : prénom et bio. */
export function ProfileFields({
  value,
  onChange,
  showErrors,
}: {
  value: ProfileInput
  onChange: (v: ProfileInput) => void
  showErrors?: boolean
}) {
  const set = (patch: Partial<ProfileInput>) => onChange({ ...value, ...patch })
  const missingName = showErrors && !value.name.trim()
  return (
    <div className="space-y-5">
      <Field label="Prénom ou pseudo">
        <input
          className={cn(inputClass, 'font-serif text-[20px]', missingName && 'border-burgundy')}
          value={value.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="Camille"
          autoComplete="given-name"
          maxLength={40}
        />
        {missingName && <span className="mt-1.5 block text-[13px] text-burgundy">Indiquez un prénom pour continuer.</span>}
      </Field>
      <Field label="Bio" hint="Quelques mots sur votre rapport aux livres.">
        <textarea
          className={inputClass + ' min-h-24 resize-none py-3 font-serif text-[18px] italic'}
          value={value.bio}
          onChange={(e) => set({ bio: e.target.value })}
          placeholder="Je lis pour voyager sans partir."
          maxLength={160}
        />
      </Field>
    </div>
  )
}
