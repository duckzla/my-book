// Synopsis d'un livre : une présentation courte, sans dévoiler l'intrigue.
// Sources, par ordre de préférence :
//  1. BnF — quatrième de couverture de l'éditeur (zone UNIMARC 330), en français ;
//  2. Wikipédia en français — introduction de l'article consacré au livre (jamais les sections d'intrigue) ;
//  3. Open Library — description de l'œuvre, parfois en anglais.

import { cleanIsbn, isbn10to13, isbn13to10, normalizeForMatch as norm } from './bnf'

export interface Synopsis {
  text: string
  source: 'BnF' | 'Wikipédia' | 'Open Library'
  url?: string
  lang: 'fr' | 'en'
}

export interface SynopsisQuery {
  title: string
  author: string
  isbn?: string
  /** Clé d'œuvre Open Library (« /works/OL…W ») si connue */
  workKey?: string
}

const MAX = 900

/** Coupe proprement à la fin d'une phrase pour rester dans l'esprit d'une quatrième de couverture. */
function trim(text: string, max = MAX) {
  const t = text.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max)
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '), cut.lastIndexOf('» '))
  return (end > max * 0.5 ? cut.slice(0, end + 1) : cut.replace(/\s+\S*$/, '')) + (end > max * 0.5 ? '' : '…')
}

/* ---------- 1. BnF : quatrième de couverture ---------- */

async function fromBnf(isbn: string): Promise<Synopsis | undefined> {
  const clean = cleanIsbn(isbn)
  const variants = [clean, clean.length === 13 ? isbn13to10(clean) : isbn10to13(clean)].filter(Boolean) as string[]
  const url = new URL('https://catalogue.bnf.fr/api/SRU')
  url.search = new URLSearchParams({
    version: '1.2',
    operation: 'searchRetrieve',
    recordSchema: 'unimarcxchange',
    maximumRecords: '3',
    query: variants.map((i) => `bib.isbn all "${i}"`).join(' or '),
  }).toString()
  const res = await fetch(url)
  if (!res.ok) return undefined
  const doc = new DOMParser().parseFromString(await res.text(), 'application/xml')
  for (const field of doc.getElementsByTagNameNS('*', 'datafield')) {
    if (field.getAttribute('tag') !== '330') continue
    const text = [...field.getElementsByTagNameNS('*', 'subfield')]
      .filter((s) => s.getAttribute('code') === 'a')
      .map((s) => s.textContent ?? '')
      .join(' ')
    if (text.length > 80) return { text: trim(text), source: 'BnF', lang: 'fr' }
  }
  return undefined
}

/* ---------- 2. Wikipédia : introduction de l'article du livre ---------- */

const WIKI = 'https://fr.wikipedia.org'

async function fromWikipedia(title: string, author: string): Promise<Synopsis | undefined> {
  const last = norm(author).split(' ').pop() ?? ''
  const search = new URL(WIKI + '/w/api.php')
  search.search = new URLSearchParams({
    action: 'query',
    list: 'search',
    srsearch: `${title} ${author.split(' ').pop() ?? ''}`,
    srlimit: '6',
    format: 'json',
    origin: '*',
  }).toString()
  const res = await fetch(search)
  if (!res.ok) return undefined
  const data = (await res.json()) as { query?: { search: { title: string }[] } }
  // L'article doit porter le titre du livre (« Dune » ou « Dune (roman) »), pas celui de l'auteur
  const candidates = (data.query?.search ?? [])
    .map((r) => r.title)
    .filter((t) => norm(t.replace(/\s*\([^)]*\)$/, '')) === norm(title))
    .slice(0, 3)

  for (const page of candidates) {
    const r = await fetch(`${WIKI}/api/rest_v1/page/summary/${encodeURIComponent(page.replace(/ /g, '_'))}`)
    if (!r.ok) continue
    const s = (await r.json()) as {
      type?: string
      description?: string
      extract?: string
      content_urls?: { mobile?: { page?: string } }
    }
    const about = norm(`${s.description ?? ''} ${s.extract ?? ''}`)
    // On vérifie qu'il s'agit bien d'un livre de cet auteur (et pas d'un film ou d'une homonymie)
    if (s.type === 'disambiguation' || !s.extract || (last && !about.includes(last))) continue
    return { text: trim(s.extract), source: 'Wikipédia', url: s.content_urls?.mobile?.page, lang: 'fr' }
  }
  return undefined
}

/* ---------- 3. Open Library : description de l'œuvre ---------- */

async function fromOpenLibrary(q: SynopsisQuery): Promise<Synopsis | undefined> {
  let key = q.workKey
  if (!key && q.isbn) {
    const r = await fetch(`https://openlibrary.org/isbn/${cleanIsbn(q.isbn)}.json`)
    if (r.ok) key = ((await r.json()) as { works?: { key: string }[] }).works?.[0]?.key
  }
  if (!key?.startsWith('/works/')) return undefined
  const r = await fetch(`https://openlibrary.org${key}.json`)
  if (!r.ok) return undefined
  const work = (await r.json()) as { description?: string | { value: string } }
  const raw = typeof work.description === 'string' ? work.description : work.description?.value
  if (!raw || raw.length < 80) return undefined
  // Retire les liens et notes de bas de description (« ([source][1]) », « ---------- See also… »)
  const text = raw.split(/\n-{3,}|\r?\n\s*\[1\]/)[0].replace(/\(\[[^\]]*\]\[\d+\]\)|\[([^\]]+)\]\([^)]*\)/g, '$1')
  // Détection simple de la langue : présence de mots-outils français
  const fr = (text.match(/\b(le|la|les|des|une|est|dans|qui)\b/gi) ?? []).length
  const en = (text.match(/\b(the|and|of|is|in|who|with)\b/gi) ?? []).length
  return { text: trim(text), source: 'Open Library', url: `https://openlibrary.org${key}`, lang: fr >= en ? 'fr' : 'en' }
}

/* ---------- Orchestration ---------- */

const cache = new Map<string, Promise<Synopsis | undefined>>()

// Le résultat est mis en cache et partagé entre écrans : les requêtes ne sont donc pas annulables.
export function getSynopsis(q: SynopsisQuery): Promise<Synopsis | undefined> {
  const key = `${norm(q.title)}|${norm(q.author)}|${q.isbn ?? ''}`
  const cached = cache.get(key)
  if (cached) return cached

  const safe = <T,>(p: Promise<T>) => p.catch(() => undefined)

  const run = (async () => {
    if (q.isbn) {
      const bnf = await safe(fromBnf(q.isbn))
      if (bnf) return bnf
    }
    if (q.title && q.author) {
      const wiki = await safe(fromWikipedia(q.title, q.author))
      if (wiki) return wiki
    }
    return safe(fromOpenLibrary(q))
  })()

  cache.set(key, run)
  run.then((r) => {
    if (!r) cache.delete(key) // pas de synopsis : on pourra réessayer plus tard
  })
  return run
}
