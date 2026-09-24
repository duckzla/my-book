// Recherche de livres « à la française » :
//  1. Open Library trouve les œuvres pertinentes (bon classement, couvertures, sujets) ;
//  2. la BnF donne, à partir des ISBN français de chaque œuvre, le titre de l'édition française.
// Si Open Library ne répond pas ou ne trouve rien, on interroge directement le catalogue de la BnF.

import { guessGenre, searchBooks, searchIsbn, type OLResult } from './openlibrary'
import {
  cleanIsbn,
  isFrenchIsbn,
  normalizeForMatch,
  pickFrenchEdition,
  recordsByIsbn,
  recordsByTitle,
  type BnfRecord,
} from './bnf'

export interface BookResult {
  key: string
  title: string
  author: string
  genre: string
  year?: number
  pages?: number
  isbn?: string
  publisher?: string
  /** Couvertures candidates, de la plus fidèle (édition française) à la plus générique */
  covers: string[]
  /** Vrai quand le titre provient d'une édition française de la BnF */
  french: boolean
}

const isbnCover = (isbn: string) => `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`

function merge(work: OLResult, fr?: BnfRecord): BookResult {
  const covers = [fr?.isbn && isbnCover(fr.isbn), work.cover].filter((c): c is string => !!c)
  return {
    key: work.key,
    title: fr?.title || work.title,
    author: fr?.authors[0] || work.author,
    genre: work.genre,
    year: fr?.year ?? work.year,
    pages: fr?.pages ?? work.pages,
    isbn: fr?.isbn ?? work.isbn,
    publisher: fr?.publisher,
    covers: [...new Set(covers)],
    french: !!fr,
  }
}

async function frenchEditionOf(work: OLResult, signal?: AbortSignal): Promise<BnfRecord | undefined> {
  const frIsbns = work.isbns.map(cleanIsbn).filter(isFrenchIsbn).slice(0, 8)
  if (!frIsbns.length) return undefined
  try {
    return pickFrenchEdition(await recordsByIsbn(frIsbns, signal), work.author)
  } catch {
    return undefined // la BnF est indisponible : on garde le titre d'Open Library
  }
}

/** Repli : recherche directe dans le catalogue de la BnF, regroupée par œuvre. */
async function searchBnfOnly(text: string, signal?: AbortSignal): Promise<BookResult[]> {
  const records = await recordsByTitle(text, signal)
  const groups = new Map<string, BnfRecord[]>()
  records
    .filter((r) => r.isbn && r.authors.length)
    .forEach((r) => {
      const k = normalizeForMatch(r.title) + '|' + normalizeForMatch(r.authors[0])
      groups.set(k, [...(groups.get(k) ?? []), r])
    })
  const q = normalizeForMatch(text)
  return [...groups.entries()]
    .map(([k, recs]) => {
      const best = pickFrenchEdition(recs)!
      // Priorité aux titres qui correspondent exactement, puis aux œuvres très éditées
      const score = (normalizeForMatch(best.title) === q ? 100 : normalizeForMatch(best.title).startsWith(q) ? 50 : 0) + recs.length
      return { k, best, score }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(({ k, best }) => ({
      key: 'bnf:' + k,
      title: best.title,
      author: best.authors[0],
      genre: 'Roman',
      year: best.year,
      pages: best.pages,
      isbn: best.isbn,
      publisher: best.publisher,
      covers: best.isbn ? [isbnCover(best.isbn)] : [],
      french: true,
    }))
}

export async function searchFrench(text: string, signal?: AbortSignal): Promise<BookResult[]> {
  let works: OLResult[] = []
  try {
    works = await searchBooks(text, signal)
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e
  }
  if (!works.length) return searchBnfOnly(text, signal)

  const editions = await Promise.all(works.map((w) => frenchEditionOf(w, signal)))
  const results = works.map((w, i) => merge(w, editions[i]))

  // Une même édition française peut remonter via deux œuvres Open Library : on dédoublonne
  const seen = new Set<string>()
  // Les œuvres éditées en France passent devant (le tri est stable : l'ordre de pertinence est conservé)
  results.sort((a, b) => Number(b.french) - Number(a.french))
  return results.filter((r) => {
    const k = normalizeForMatch(r.title) + '|' + normalizeForMatch(r.author)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

export async function searchFrenchByIsbn(raw: string, signal?: AbortSignal): Promise<BookResult[]> {
  const isbn = cleanIsbn(raw)
  const [bnf, ol] = await Promise.allSettled([recordsByIsbn([isbn], signal), searchIsbn(isbn, signal)])
  const record = bnf.status === 'fulfilled' ? pickFrenchEdition(bnf.value) : undefined
  const work = ol.status === 'fulfilled' ? ol.value[0] : undefined
  if (!record && !work) {
    if (bnf.status === 'rejected' && ol.status === 'rejected') throw new Error('Recherche indisponible')
    return []
  }
  if (!work) {
    return [
      {
        key: 'isbn:' + isbn,
        title: record!.title,
        author: record!.authors[0] ?? 'Auteur inconnu',
        genre: guessGenre(),
        year: record!.year,
        pages: record!.pages,
        isbn: record!.isbn ?? isbn,
        publisher: record!.publisher,
        covers: [isbnCover(isbn)],
        french: true,
      },
    ]
  }
  // L'ISBN saisi est celui du livre en main : sa couverture passe en premier
  const merged = merge(work, record)
  return [{ ...merged, isbn: record?.isbn ?? isbn, covers: [...new Set([isbnCover(isbn), ...merged.covers])] }]
}

/** Renvoie la première couverture qui existe vraiment (Open Library renvoie parfois 404 ou une image vide). */
export function resolveCover(urls: string[]): Promise<string | undefined> {
  return urls.reduce<Promise<string | undefined>>(
    (prev, url) =>
      prev.then(
        (found) =>
          found ??
          new Promise((resolve) => {
            const img = new Image()
            img.onload = () => resolve(img.naturalWidth > 10 ? url : undefined)
            img.onerror = () => resolve(undefined)
            img.src = url
          }),
      ),
    Promise.resolve(undefined),
  )
}
