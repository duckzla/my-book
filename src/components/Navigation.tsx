import { NavLink, Link, useLocation } from 'react-router'
import { motion } from 'motion/react'
import { Bookmark, Home, Library, Plus, UserRound, type LucideIcon } from 'lucide-react'
import { cn } from '../lib/utils'

/* ---------- Logo : le marque-page ---------- */

/**
 * Ruban de marque-page bordeaux portant le monogramme M·B.
 * `size` est la hauteur ; le filet doré intérieur n'apparaît qu'en grand.
 */
export function Monogram({ size = 36 }: { size?: number }) {
  const detailed = size >= 48
  return (
    <svg height={size} width={(size * 44) / 96} viewBox="28 2 44 96" aria-hidden className="shrink-0">
      <path d="M32 6H68V94L50 80L32 94Z" fill="#7A3038" />
      {detailed && <path d="M36 10H64V85.5L50 74.5L36 85.5Z" fill="none" stroke="#B18A4A" strokeWidth="1" />}
      <text x="50" y="41" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontSize="24" fontWeight="600" fill="#FFFCF7">
        M
      </text>
      <path d="M50 46L53 49.5L50 53L47 49.5Z" fill="#B18A4A" />
      <text x="50" y="72" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontSize="24" fontWeight="600" fill="#FFFCF7">
        B
      </text>
    </svg>
  )
}

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="My Book — Accueil">
      <Monogram size={40} />
      <span className="font-serif text-[21px] leading-none font-semibold whitespace-nowrap text-ink">My Book</span>
    </Link>
  )
}

/* ---------- Navigation ---------- */

const NAV: { to: string; label: string; icon: LucideIcon; match: string[] }[] = [
  { to: '/', label: 'Accueil', icon: Home, match: ['/'] },
  { to: '/bibliotheque', label: 'Bibliothèque', icon: Library, match: ['/bibliotheque', '/livre', '/ajouter'] },
  { to: '/wishlist', label: 'Wishlist', icon: Bookmark, match: ['/wishlist'] },
  { to: '/profil', label: 'Profil', icon: UserRound, match: ['/profil', '/top'] },
]

function useActive() {
  const { pathname } = useLocation()
  return (m: string[]) => m.some((p) => (p === '/' ? pathname === '/' : pathname.startsWith(p)))
}

export function MobileNav() {
  const isActive = useActive()
  return (
    <nav
      aria-label="Navigation principale"
      className="safe-bottom fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[var(--app-width)] border-t border-line bg-surface/95 backdrop-blur-md"
    >
      <ul className="grid grid-cols-4">
        {NAV.map((item) => {
          const active = isActive(item.match)
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={cn(
                  'relative flex h-[64px] flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
                  active ? 'text-burgundy' : 'text-muted',
                )}
              >
                {active && (
                  <motion.span layoutId="mobile-active" className="absolute top-0 h-[2px] w-8 rounded-full bg-burgundy" />
                )}
                <item.icon size={21} strokeWidth={1.5} className={cn(active && 'fill-burgundy/10')} />
                {item.label}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export function MobileTopBar() {
  const { pathname } = useLocation()
  return (
    <div className="safe-top sticky top-0 z-30 border-b border-line/70 bg-paper/90 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-4">
        <Logo />
        {pathname !== '/ajouter' && (
          <Link
            to="/ajouter"
            aria-label="Ajouter un livre"
            className="-mr-2 flex size-11 items-center justify-center rounded-full text-burgundy transition-colors active:bg-sand"
          >
            <Plus size={22} strokeWidth={1.5} />
          </Link>
        )}
      </div>
    </div>
  )
}
