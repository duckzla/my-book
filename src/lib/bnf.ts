// Client pour l'API SRU du catalogue de la Bibliothèque nationale de France.
// https://api.bnf.fr/fr/api-sru-catalogue-general — gratuite, sans clé, CORS ouvert.
// Elle fournit les titres des éditions françaises ; elle ne fournit pas de couvertures.

const SRU = 'https://catalogue.bnf.fr/api/SRU'
const DC = 'http://purl.org/dc/elements/1.1/'

export interface BnfRecord {
  title: string // titre nettoyé (sans mentions de responsabilité ni d'édition)
  rawTitle: string
  authors: string[] // « Prénom Nom », uniquement les auteurs du texte
  isbn?: string
  publisher?: string
  year?: number
  pages?: number
}

/* ---------- ISBN ---------- */

export const cleanIsbn = (raw: string) => raw.replace(/[^0-9Xx]/g, '').toUpperCase()

/** ISBN attribués aux pays francophones : groupe 2 (et 979-10 pour la France). */
export const isFrenchIsbn = (isbn: string) =>
  (isbn.length === 13 && (isbn.startsWith('9782') || isbn.startsWith('97910'))) || (isbn.length === 10 && isbn.startsWith('2'))

export function isbn13to10(isbn: string): string | undefined {
  if (isbn.length !== 13 || !isbn.startsWith('978')) return undefined
  const core = isbn.slice(3, 12)
  const sum = [...core].reduce((s, d, i) => s + Number(d) * (10 - i), 0)
  const check = (11 - (sum % 11)) % 11
  return core + (check === 10 ? 'X' : String(check))
}

export function isbn10to13(isbn: string): string | undefined {
  if (isbn.length !== 10) return undefined
  const core = '978' + isbn.slice(0, 9)
  const sum = [...core].reduce((s, d, i) => s + Number(d) * (i % 2 ? 3 : 1), 0)
  return core + String((10 - (sum % 10)) % 10)
}

/* ---------- Nettoyage des notices ---------- */

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export function cleanTitle(raw: string, authors: string[] = []): string {
  let t = raw.split(' / ')[0] // retire « / Auteur ; traduit par… »
  t = t.replace(/\s*\((?:[^()]*(?:éd\.|édition|nouv|présentation|collector|limitée|poche)[^()]*)\)\s*/gi, ' ') // mentions d'édition
  t = t.split(' ; ')[0] // « Dune ; [suivi de] Le messie de Dune » → « Dune »
  t = t.split(' : ')[0] // retire les sous-titres (« : roman », « : Serpentard »…)
  t = t.replace(/\[[^\]]*\]/g, '').replace(/\s{2,}/g, ' ').trim()
  // Une notice sans « / » garde parfois l'auteur collé au titre : « Dune (Éd. limitée) Frank Herbert »
  if (!raw.includes(' / ')) {
    for (const author of authors) {
      const last = author.split(' ').pop()!
      const at = t.lastIndexOf(last)
      if (at > 0) {
        // remonte sur le prénom et les initiales qui précèdent le nom
        const before = t.slice(0, at).replace(/(?:\s+(?:[A-ZÉ]\.|[A-ZÉ][\p{L}'-]+))*\s*$/u, '')
        if (before.trim()) t = before
      }
    }
  }
  return capitalize(t.replace(/^["«\s]+|["»\s]+$/g, ''))
}

/** « Herbert, Frank (1920-1986). Auteur du texte » → « Frank Herbert » */
export function cleanAuthor(raw: string): string {
  // Retire « (dates) » et la fonction (« . Auteur du texte »), sans couper les initiales « J. K. »
  const name = raw
    .replace(/\s*\([^)]*\).*$/, '')
    .replace(/\.\s+(?:Auteur|Illustrat|Traduct|Éditeur|Préfaci|Adaptat).*$/i, '')
    .trim()
  const [last, first] = name.split(/,\s*/)
  return first ? `${first} ${last}` : last
}

/* ---------- Requêtes ---------- */

function parse(xml: string): BnfRecord[] {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  const records = [...doc.getElementsByTagNameNS('http://www.openarchives.org/OAI/2.0/oai_dc/', 'dc')]
  return records.flatMap((r) => {
    const all = (tag: string) => [...r.getElementsByTagNameNS(DC, tag)].map((n) => (n.textContent ?? '').trim())
    const rawTitle = all('title')[0]
    if (!rawTitle) return []
    const isbn = all('identifier')
      .filter((i) => i.startsWith('ISBN'))
      .map(cleanIsbn)
      .find((i) => i.length === 13 || i.length === 10)
    const authors = all('creator')
      .filter((c) => /auteur du texte/i.test(c))
      .map(cleanAuthor)
    const pages = all('format').map((f) => f.match(/(\d+)\s*p\./)?.[1]).find(Boolean)
    const year = all('date').map((d) => d.match(/\d{4}/)?.[0]).find(Boolean)
    const publisher = all('publisher')[0]?.replace(/\s*\([^)]*\)\s*$/, '').replace(/^Éd\.\s*/, '')
    return [
      {
        rawTitle,
        title: cleanTitle(rawTitle, authors),
        authors: [...new Set(authors)],
        isbn,
        publisher,
        year: year ? Number(year) : undefined,
        pages: pages ? Number(pages) : undefined,
      },
    ]
  })
}

async function sru(query: string, max: number, signal?: AbortSignal): Promise<BnfRecord[]> {
  const url = new URL(SRU)
  url.search = new URLSearchParams({
    version: '1.2',
    operation: 'searchRetrieve',
    recordSchema: 'dublincore',
    maximumRecords: String(max),
    query,
  }).toString()
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`La BnF a répondu ${res.status}`)
  return parse(await res.text())
}

const quote = (s: string) => `"${s.replace(/"/g, ' ')}"`

/** Toutes les variantes (ISBN-10 / ISBN-13) sous lesquelles la BnF peut avoir indexé ces livres. */
function isbnVariants(isbns: string[]) {
  const out = new Set<string>()
  isbns.forEach((i) => {
    out.add(i)
    const other = i.length === 13 ? isbn13to10(i) : isbn10to13(i)
    if (other) out.add(other)
  })
  return [...out]
}

export function recordsByIsbn(isbns: string[], signal?: AbortSignal) {
  const variants = isbnVariants(isbns.map(cleanIsbn)).slice(0, 16)
  if (!variants.length) return Promise.resolve([])
  return sru(variants.map((i) => `bib.isbn all ${quote(i)}`).join(' or '), 12, signal)
}

export function recordsByTitle(text: string, signal?: AbortSignal) {
  return sru(`bib.title all ${quote(text)} and bib.doctype any "a"`, 50, signal)
}

/* ---------- Choix de l'édition de référence ---------- */

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

/**
 * Parmi les éditions françaises d'une même œuvre, retient le titre le plus fréquent
 * (écarte les guides de lecture, éditions collector, etc.) et une édition récente qui le porte.
 */
export function pickFrenchEdition(records: BnfRecord[], authorHint?: string): BnfRecord | undefined {
  const last = authorHint ? norm(authorHint).split(' ').pop() : undefined
  const byAuthor = last ? records.filter((r) => r.authors.some((a) => norm(a).includes(last))) : records
  const pool = (byAuthor.length ? byAuthor : records).filter((r) => r.isbn && r.title)
  if (!pool.length) return undefined

  const votes = new Map<string, number>()
  pool.forEach((r) => votes.set(norm(r.title), (votes.get(norm(r.title)) ?? 0) + 1))
  const winner = [...votes.entries()].sort((a, b) => b[1] - a[1] || a[0].length - b[0].length)[0][0]

  return pool
    .filter((r) => norm(r.title) === winner)
    .sort((a, b) => (b.isbn!.length - a.isbn!.length) || (b.year ?? 0) - (a.year ?? 0))[0]
}

export { norm as normalizeForMatch }
