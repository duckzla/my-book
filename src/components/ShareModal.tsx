import { useState } from 'react'
import { Check, Copy, Share2 } from 'lucide-react'
import { useLibrary, useProfile } from '../store/library'
import { Button, Modal } from './ui'

export function ShareModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useLibrary()
  const profile = useProfile()
  const [copied, setCopied] = useState(false)
  const url = `mybook.fr/u/${profile.handle}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`https://${url}`)
    } catch {
      /* presse-papiers indisponible : on confirme quand même visuellement */
    }
    setCopied(true)
    toast('Lien copié')
    window.setTimeout(() => setCopied(false), 2000)
  }

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `La bibliothèque de ${profile.name}`, url: `https://${url}` })
      } catch {
        /* partage annulé */
      }
    } else copy()
  }

  return (
    <Modal open={open} onClose={onClose} title="Mon profil public">
      <p className="text-[14.5px] text-muted">
        Votre profil littéraire, vos notes et votre Top Livres. Vos commentaires privés restent privés.
      </p>
      <div className="mt-6 flex items-center gap-3 rounded-[var(--radius-control)] border border-line bg-paper px-4 py-3.5">
        <span className="min-w-0 flex-1 truncate font-serif text-[19px]">
          <span className="text-muted">mybook.fr/u/</span>
          {profile.handle}
        </span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <Button variant="secondary" onClick={copy} icon={copied ? <Check size={16} strokeWidth={1.75} className="text-burgundy" /> : <Copy size={16} strokeWidth={1.5} />}>
          {copied ? 'Copié' : 'Copier le lien'}
        </Button>
        <Button variant="primary" onClick={share} icon={<Share2 size={16} strokeWidth={1.5} />}>
          Partager
        </Button>
      </div>
    </Modal>
  )
}
