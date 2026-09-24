import type { Synopsis } from '../lib/synopsis'

export type ReadingStatus = 'lu' | 'en-cours' | 'non-lu'

export interface Book {
  id: string
  title: string
  author: string
  genre: string
  year?: number
  pages?: number
  isbn?: string
  publisher?: string
  cover?: string
  /** Présentation courte du livre (quatrième de couverture), enregistrée une fois trouvée */
  synopsis?: Synopsis
  status: ReadingStatus
  rating: number
  favorite: boolean
  note?: string
  comment?: string
  addedAt: string
  finishedAt?: string
}

export interface WishItem {
  id: string
  title: string
  author: string
  genre: string
  isbn?: string
  cover?: string
  synopsis?: Synopsis
  addedAt: string
  reason?: string
}

export type ActivityKind = 'added' | 'rated' | 'finished' | 'started' | 'wishlist' | 'favorite'

export interface Activity {
  id: string
  kind: ActivityKind
  bookId?: string
  title: string
  rating?: number
  at: string
}

export const STATUS_LABEL: Record<ReadingStatus, string> = {
  lu: 'Lu',
  'en-cours': 'En cours',
  'non-lu': 'À lire',
}

export const olCover = (isbn: string) =>
  `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`

const b = (
  id: string,
  title: string,
  author: string,
  genre: string,
  isbn: string,
  extra: Partial<Book>,
): Book => ({
  id,
  title,
  author,
  genre,
  isbn,
  cover: olCover(isbn),
  status: 'non-lu',
  rating: 0,
  favorite: false,
  addedAt: '2026-01-10',
  ...extra,
})

export const SEED_BOOKS: Book[] = [
  b('nom-du-vent', 'Le Nom du Vent', 'Patrick Rothfuss', 'Fantasy', '9782352942832', {
    year: 2007,
    pages: 662,
    status: 'lu',
    rating: 5,
    favorite: true,
    addedAt: '2026-02-14',
    finishedAt: '2026-03-02',
    note: "Une lecture qui m'est restée longtemps.",
    comment:
      "Kvothe raconte sa vie comme on déplie une carte ancienne, avec patience. J'ai lu les derniers chapitres d'une traite, un dimanche de pluie, et j'ai eu du mal à revenir au monde réel. La musique y est décrite mieux que dans bien des romans sur la musique.",
  }),
  b('dune', 'Dune', 'Frank Herbert', 'Science-fiction', '9780441172719', {
    year: 1965,
    pages: 896,
    status: 'lu',
    rating: 5,
    favorite: true,
    addedAt: '2025-11-03',
    finishedAt: '2026-09-18',
    note: 'Un désert entier dans un seul livre.',
    comment:
      "Relu pour la troisième fois, et toujours cette sensation de vertige. Herbert écrit l'écologie, la religion et le pouvoir comme un seul et même mouvement. Arrakis ne quitte pas la tête.",
  }),
  b('monte-cristo', 'Le Comte de Monte-Cristo', 'Alexandre Dumas', 'Roman', '9780140449266', {
    year: 1844,
    pages: 1276,
    status: 'lu',
    rating: 5,
    favorite: true,
    addedAt: '2025-06-21',
    finishedAt: '2026-09-12',
    note: 'La vengeance comme une cathédrale.',
    comment:
      "Mille pages et pas une de trop. Edmond Dantès est devenu un compagnon de l'été. « Attendre et espérer » : je garde la formule dans un coin de mon carnet.",
  }),
  b('maitre-marguerite', 'Le Maître et Marguerite', 'Mikhaïl Boulgakov', 'Roman', '9782221116869', {
    year: 1967,
    pages: 412,
    status: 'lu',
    rating: 5,
    favorite: true,
    addedAt: '2025-09-02',
    finishedAt: '2025-10-15',
    note: 'Le diable à Moscou, et Moscou en fête.',
    comment:
      "Un livre qui rit et qui brûle en même temps. Béhémoth, le chat, m'a accompagnée pendant des semaines. Les manuscrits ne brûlent pas.",
  }),
  b('etranger', "L'Étranger", 'Albert Camus', 'Roman', '9782070360024', {
    year: 1942,
    pages: 186,
    status: 'lu',
    rating: 4,
    favorite: false,
    addedAt: '2026-09-22',
    finishedAt: '2026-09-23',
    note: 'Le soleil, surtout le soleil.',
    comment:
      "Relu d'une traite. La première phrase frappe toujours aussi fort. Meursault reste une énigme que je ne cherche plus à résoudre.",
  }),
  b('harry-potter', "Harry Potter à l'école des sorciers", 'J.K. Rowling', 'Fantasy', '9782070584628', {
    year: 1997,
    pages: 320,
    status: 'lu',
    rating: 4,
    favorite: true,
    addedAt: '2024-12-20',
    finishedAt: '2024-12-28',
    note: "Retour à l'enfance, sans regret.",
  }),
  b('petit-prince', 'Le Petit Prince', 'Antoine de Saint-Exupéry', 'Conte', '9782070612758', {
    year: 1943,
    pages: 96,
    status: 'lu',
    rating: 5,
    addedAt: '2024-08-10',
    finishedAt: '2024-08-10',
    note: "On ne voit bien qu'avec le cœur.",
  }),
  b('1984', '1984', 'George Orwell', 'Science-fiction', '9782070368228', {
    year: 1949,
    pages: 438,
    status: 'lu',
    rating: 4,
    addedAt: '2025-02-02',
    finishedAt: '2025-02-20',
  }),
  b('ecume', "L'Écume des jours", 'Boris Vian', 'Roman', '9782253140870', {
    year: 1947,
    pages: 320,
    status: 'lu',
    rating: 4,
    addedAt: '2025-04-11',
    finishedAt: '2025-04-19',
    note: 'Un nénuphar dans la poitrine.',
  }),
  b('cent-ans', 'Cent ans de solitude', 'Gabriel García Márquez', 'Roman', '9782020238113', {
    year: 1967,
    pages: 460,
    status: 'lu',
    rating: 5,
    addedAt: '2025-07-01',
    finishedAt: '2025-08-03',
  }),
  b('horde', 'La Horde du Contrevent', 'Alain Damasio', 'Science-fiction', '9782070342297', {
    year: 2004,
    pages: 736,
    status: 'en-cours',
    addedAt: '2026-09-05',
  }),
  b('sapiens', 'Sapiens', 'Yuval Noah Harari', 'Essai', '9782226257017', {
    year: 2011,
    pages: 512,
    status: 'en-cours',
    addedAt: '2026-08-14',
  }),
  b('madame-bovary', 'Madame Bovary', 'Gustave Flaubert', 'Roman', '9782070413119', {
    year: 1857,
    pages: 528,
    status: 'en-cours',
    addedAt: '2026-07-30',
  }),
  b('fondation', 'Fondation', 'Isaac Asimov', 'Science-fiction', '9782070360536', {
    year: 1951,
    pages: 416,
    status: 'lu',
    rating: 4,
    addedAt: '2025-03-15',
    finishedAt: '2025-04-01',
  }),
  b('stupeur', 'Stupeur et tremblements', 'Amélie Nothomb', 'Roman', '9782253150718', {
    year: 1999,
    pages: 192,
    status: 'non-lu',
    addedAt: '2026-06-08',
  }),
  b('germinal', 'Germinal', 'Émile Zola', 'Roman', '9782253004226', {
    year: 1885,
    pages: 608,
    status: 'non-lu',
    addedAt: '2026-05-19',
  }),
  b('anomalie', "L'Anomalie", 'Hervé Le Tellier', 'Roman', '9782072895098', {
    year: 2020,
    pages: 336,
    status: 'non-lu',
    addedAt: '2026-04-02',
  }),
  b('deuxieme-sexe', 'Le Deuxième Sexe', 'Simone de Beauvoir', 'Essai', '9782070323517', {
    year: 1949,
    pages: 408,
    status: 'non-lu',
    addedAt: '2026-03-21',
  }),
  b('hobbit', 'Le Hobbit', 'J.R.R. Tolkien', 'Fantasy', '9782267024012', {
    year: 1937,
    pages: 300,
    status: 'lu',
    rating: 4,
    addedAt: '2024-11-02',
    finishedAt: '2024-11-20',
  }),
]

export const SEED_WISHLIST: WishItem[] = [
  {
    id: 'w-peur-sage',
    title: "La Peur du sage",
    author: 'Patrick Rothfuss',
    genre: 'Fantasy',
    isbn: '9780756404734',
    cover: olCover('9780756404734'),
    addedAt: '2026-03-03',
    reason: 'La suite, enfin.',
  },
  {
    id: 'w-guerre-paix',
    title: 'Guerre et Paix',
    author: 'Léon Tolstoï',
    genre: 'Roman',
    isbn: '9780140447934',
    cover: olCover('9780140447934'),
    addedAt: '2026-05-12',
  },
  {
    id: 'w-gens-de-dublin',
    title: 'Gens de Dublin',
    author: 'James Joyce',
    genre: 'Nouvelles',
    isbn: '9780140186475',
    cover: olCover('9780140186475'),
    addedAt: '2026-06-30',
  },
  {
    id: 'w-memoires-hadrien',
    title: "Mémoires d'Hadrien",
    author: 'Marguerite Yourcenar',
    genre: 'Roman',
    isbn: '9782070369218',
    cover: olCover('9782070369218'),
    addedAt: '2026-08-02',
    reason: 'Conseillé par ma libraire.',
  },
  {
    id: 'w-main-gauche',
    title: 'La Main gauche de la nuit',
    author: 'Ursula K. Le Guin',
    genre: 'Science-fiction',
    isbn: '9782253113164',
    cover: olCover('9782253113164'),
    addedAt: '2026-09-01',
  },
  {
    id: 'w-proust',
    title: 'Du côté de chez Swann',
    author: 'Marcel Proust',
    genre: 'Roman',
    isbn: '9782070379248',
    cover: olCover('9782070379248'),
    addedAt: '2026-09-10',
  },
]

export const SEED_TOP: string[] = ['nom-du-vent', 'maitre-marguerite', 'dune', 'monte-cristo', 'cent-ans']

export const SEED_ACTIVITY: Activity[] = [
  { id: 'a1', kind: 'added', bookId: 'etranger', title: "L'Étranger", at: '2026-09-22T19:12:00' },
  { id: 'a2', kind: 'rated', bookId: 'dune', title: 'Dune', rating: 5, at: '2026-09-18T22:40:00' },
  { id: 'a3', kind: 'finished', bookId: 'monte-cristo', title: 'Le Comte de Monte-Cristo', at: '2026-09-12T16:05:00' },
  { id: 'a4', kind: 'started', bookId: 'horde', title: 'La Horde du Contrevent', at: '2026-09-05T09:30:00' },
  { id: 'a5', kind: 'wishlist', title: 'La Main gauche de la nuit', at: '2026-09-01T18:00:00' },
]
