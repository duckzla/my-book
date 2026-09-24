// Client minimal pour l'API publique Open Library (https://openlibrary.org/developers/api)
// Aucune clé n'est nécessaire. Open Library sert ici au classement des résultats,
// aux couvertures et au genre ; les titres français viennent de la BnF (voir bookSearch.ts).

export interface OLResult {
  key: string
  title: string
  author: string
  year?: number
  pages?: number
  isbn?: string
  /** Tous les ISBN connus de l'œuvre, toutes éditions et langues confondues */
  isbns: string[]
  cover?: string
  genre: string
}

const FIELDS = 'key,title,author_name,first_publish_year,cover_i,isbn,subject,number_of_pages_median'

interface OLDoc {
  key: string
  title: string
  author_name?: string[]
  first_publish_year?: number
  cover_i?: number
  isbn?: string[]
  subject?: string[]
  number_of_pages_median?: number
}

const GENRE_RULES: [RegExp, string][] = [
  [/fantasy|fantastique|magic/i, 'Fantasy'],
  [/science fiction|science-fiction|dystopi|space opera/i, 'Science-fiction'],
  [/detective|mystery|crime|polic|thriller|roman noir/i, 'Policier'],
  [/poetry|poésie|poems/i, 'Poésie'],
  [/comic|bande dessinée|graphic novel|manga/i, 'Bande dessinée'],
  [/biograph|autobiograph|memoir|mémoires/i, 'Biographie'],
  [/juvenile|children|jeunesse/i, 'Jeunesse'],
  [/fiction|novel|roman/i, 'Roman'],
  [/philosoph|history|histoire|essai|essays|economics|sociolog|politic|science\b/i, 'Essai'],
  [/short stories|nouvelles/i, 'Nouvelles'],
  [/drama|théâtre|theatre|plays/i, 'Théâtre'],
]

// Les sujets Open Library sont nombreux et bruités : on pondère par position
// et on exige un signal net avant de s'écarter de « Roman ».
export function guessGenre(subjects: string[] = []): string {
  const scores = new Map<string, number>()
  subjects.slice(0, 30).forEach((s, i) => {
    const weight = i < 6 ? 2 : 1
    for (const [re, genre] of GENRE_RULES) {
      if (re.test(s)) {
        scores.set(genre, (scores.get(genre) ?? 0) + weight)
        break
      }
    }
  })
  const fiction = scores.get('Roman') ?? 0
  // Un genre précis l'emporte sur « fiction » ; l'essai doit en plus dominer la fiction
  const best = [...scores.entries()]
    .filter(([g, n]) => g !== 'Roman' && n >= 3 && (g !== 'Essai' || n > fiction))
    .sort((a, b) => b[1] - a[1])[0]
  return best ? best[0] : 'Roman'
}

const pickIsbn = (list?: string[]) =>
  list?.find((i) => i.length === 13 && (i.startsWith('978') || i.startsWith('979'))) ?? list?.[0]

const toResult = (d: OLDoc): OLResult => {
  const isbn = pickIsbn(d.isbn)
  return {
    key: d.key,
    title: d.title,
    author: d.author_name?.[0] ?? 'Auteur inconnu',
    year: d.first_publish_year,
    pages: d.number_of_pages_median,
    isbn,
    isbns: d.isbn ?? [],
    cover: d.cover_i
      ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg`
      : isbn
        ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`
        : undefined,
    genre: guessGenre(d.subject),
  }
}

async function query(params: Record<string, string>, signal?: AbortSignal): Promise<OLResult[]> {
  const url = new URL('https://openlibrary.org/search.json')
  Object.entries({ ...params, fields: FIELDS, limit: '10' }).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Open Library a répondu ${res.status}`)
  const data = (await res.json()) as { docs: OLDoc[] }
  // On écarte les documents qui ne sont pas des livres (actes, rapports sans auteur…)
  return data.docs.filter((d) => d.author_name?.length).map(toResult)
}

export const searchBooks = (text: string, signal?: AbortSignal) => query({ q: text, lang: 'fr' }, signal)

export const searchIsbn = (isbn: string, signal?: AbortSignal) =>
  query({ isbn: isbn.replace(/[^0-9Xx]/g, '') }, signal)

export const isValidIsbn = (raw: string) => {
  const s = raw.replace(/[^0-9Xx]/g, '')
  return s.length === 10 || s.length === 13
}
