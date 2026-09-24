import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router'
import { motion } from 'motion/react'
import { MobileNav, MobileTopBar } from './components/Navigation'
import { Toaster } from './components/ui'
import { useLibrary } from './store/library'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import Library from './pages/Library'
import BookDetail from './pages/BookDetail'
import AddBook from './pages/AddBook'
import Wishlist from './pages/Wishlist'
import Profile from './pages/Profile'
import TopBooks from './pages/TopBooks'

const TITLES: [RegExp, string][] = [
  [/^\/bibliotheque/, 'Bibliothèque'],
  [/^\/livre/, 'Livre'],
  [/^\/ajouter/, 'Ajouter un livre'],
  [/^\/wishlist/, 'Wishlist'],
  [/^\/profil/, 'Profil'],
  [/^\/top/, 'Mon Top Livres'],
]

export default function App() {
  const { pathname } = useLocation()
  const { profile } = useLibrary()

  useEffect(() => {
    window.scrollTo({ top: 0 })
    const t = TITLES.find(([re]) => re.test(pathname))
    document.title = t ? `${t[1]} · My Book` : 'My Book'
  }, [pathname])

  if (!profile) {
    return (
      <>
        <Onboarding />
        <Toaster />
      </>
    )
  }

  return (
    <div className="app-shell">
      <MobileTopBar />
      <main className="pb-[calc(96px+env(safe-area-inset-bottom))]">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
          className="px-4 pt-7"
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/bibliotheque" element={<Library />} />
            <Route path="/livre/:id" element={<BookDetail />} />
            <Route path="/ajouter" element={<AddBook />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/profil" element={<Profile />} />
            <Route path="/top" element={<TopBooks />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </motion.div>
      </main>
      <MobileNav />
      <Toaster />
    </div>
  )
}
