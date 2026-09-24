# My Book

*Votre bibliothèque de poche* : une bibliothèque personnelle pour lecteurs passionnés, sous forme d'**application mobile** (PWA installable). L'application est réalisée d'après `../promp_maquette.md`.

> « Le livre est le héros. »

## Lancer l'application

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:5173.

- `npm run build` : produit la version de production dans `dist/`.
- `npm run preview` : sert cette version en local.

## Application mobile (PWA)

L'interface est conçue uniquement pour le téléphone : navigation en bas d'écran, feuilles qui glissent depuis le bas, zones tactiles d'au moins 44 px, gestion des encoches (`safe-area`). Sur un ordinateur, l'app s'affiche dans une colonne de la largeur d'un mobile (480 px maximum).

**Installer l'app sur le téléphone.** Une PWA ne s'installe que depuis une adresse **HTTPS**. Il faut donc d'abord déployer `dist/` sur un hébergement statique (Netlify, Vercel, GitHub Pages…). Ensuite :
- Android (Chrome) : menu ⋮ → « Installer l'application ».
- iPhone (Safari) : bouton Partager → « Sur l'écran d'accueil ».

**Tester sur le téléphone pendant le développement.** `npm run dev` écoute aussi sur le réseau local : ouvrez l'adresse « Network » affichée par Vite (ex. `http://192.168.x.x:5173`), avec le téléphone sur le même Wi-Fi. L'installation et le mode hors ligne demandent cependant la version HTTPS.

**Hors ligne.** Le service worker (généré par `vite-plugin-pwa`) met en cache l'application, les polices et les couvertures déjà vues. La recherche Open Library, elle, demande une connexion.

Les icônes sont générées à partir de `public/favicon.svg` avec `npx pwa-assets-generator`.

## Stack

- React 18 + TypeScript, Vite
- Tailwind CSS v4 (les couleurs du cahier des charges sont définies en jetons dans `src/index.css`)
- `motion` pour les micro-interactions et le glisser-déposer du classement
- `lucide-react` pour les icônes (trait 1,5 px)
- `react-router` (HashRouter : l'app fonctionne sur n'importe quel hébergement statique)
- `vite-plugin-pwa` (manifeste + service worker Workbox)

## Recherche de livres : BnF + Open Library

Pour retrouver les livres **sous leur titre français**, l'app combine deux API publiques, gratuites et sans clé :

| Source | Rôle | Point d'accès |
| --- | --- | --- |
| [Open Library](https://openlibrary.org/developers/api) | Classement par pertinence, couvertures, genre, liste de tous les ISBN d'une œuvre | `openlibrary.org/search.json`, `covers.openlibrary.org` |
| [BnF, API SRU](https://api.bnf.fr/fr/api-sru-catalogue-general) | Titre, auteur, éditeur, année et pages de l'**édition française** | `catalogue.bnf.fr/api/SRU` |

Comment se déroule une recherche (`src/lib/bookSearch.ts`) :
1. Open Library trouve les œuvres. Son titre est souvent celui de l'œuvre originale (« The Name of the Wind »).
2. Pour chaque œuvre, l'app garde les ISBN français (groupe 978-2 / 979-10) et les envoie à la BnF.
3. Parmi les éditions françaises renvoyées, elle retient le **titre le plus fréquent**. Cela écarte les guides de lecture et les éditions collector. Le résultat devient « Le nom du vent ».
4. La couverture de l'édition française est essayée en premier. Si elle manque, l'app prend celle de l'œuvre, puis la couverture typographique.

La recherche par **ISBN** interroge les deux API en parallèle. Elle accepte l'ISBN-10 ou l'ISBN-13, avec ou sans tirets, et convertit automatiquement de l'un à l'autre.

Si Open Library ne répond pas ou ne trouve rien, l'app cherche directement dans le catalogue de la BnF (`recordsByTitle`).

Fichiers :
- `src/lib/bnf.ts` : client BnF, nettoyage des notices, conversions d'ISBN ;
- `src/lib/openlibrary.ts` : client Open Library, déduction du genre (`guessGenre`) ;
- `src/lib/bookSearch.ts` : combinaison des deux sources.

Limites : une recherche prend environ 2 à 3 secondes. Les livres jamais publiés en France gardent leur titre Open Library. La BnF ne fournit pas de couvertures.

## Synopsis

La fiche d'un livre affiche un **synopsis** : une présentation courte qui ne dévoile pas l'intrigue. Elle apparaît sur la fiche d'un résultat de recherche et sur la fiche d'un livre de la bibliothèque. Le code est dans `src/lib/synopsis.ts`, qui essaie les sources dans cet ordre :

1. **BnF** : quatrième de couverture de l'éditeur (zone UNIMARC 330), en français. Elle est surtout disponible pour les éditions récentes.
2. **Wikipédia en français** : introduction de l'article consacré au livre. L'app vérifie que l'article porte bien le titre du livre et mentionne l'auteur. Elle n'utilise jamais les sections « Résumé » ou « Intrigue », qui dévoilent l'histoire.
3. **Open Library** : description de l'œuvre. Elle est parfois en anglais, et l'app l'indique alors.

Une fois trouvé, le synopsis est enregistré avec le livre et n'est plus redemandé. La source est affichée sous le texte.

## Écrans

| Route | Écran |
| --- | --- |
| `#/` | Accueil : recherche globale, statistiques, coups de cœur, activité récente |
| `#/bibliotheque` | Bibliothèque : filtres, tri, vue grille ou liste |
| `#/livre/:id` | Détail d'un livre : note, statut, favori, commentaire, modification, suppression |
| `#/ajouter` | Ajouter un livre : recherche (titres français), ISBN ou saisie manuelle, puis fiche du livre avec synopsis |
| `#/wishlist` | Mes envies de lecture |
| `#/profil` | Profil public, avec la modale de partage |
| `#/top` | Mon Top Livres, réordonnable par glisser-déposer |

## Profil et données

**Premier lancement.** Un écran d'accueil (`src/pages/Onboarding.tsx`) crée le profil en 4 étapes :
1. accueil ;
2. prénom (obligatoire) et bio ;
3. photo (facultative, réduite à 256 px) ;
4. point de départ : bibliothèque vide, livres d'exemple, ou « Garder mes livres » si des livres sont déjà sur l'appareil.

**Profil.** Il se modifie depuis l'écran Profil, avec le bouton « Modifier ». Deux autres liens sont en bas de cet écran :
- « Charger les livres d'exemple » ;
- « Réinitialiser l'application », qui efface tout, profil compris, et ramène à l'écran d'accueil.

**Stockage.** Tout est conservé dans le navigateur (`localStorage`, clé `ma-bibliotheque:v1`) : profil, livres, wishlist, Top et activité. Les livres d'exemple sont dans `src/data/books.ts`.

**Limite actuelle : pas de compte en ligne.** Les données ne sont pas synchronisées entre appareils. L'adresse publique `mybook.fr/u/{prénom}` est préparée, mais ne fonctionnera qu'avec un serveur (Supabase, Firebase…).

## Organisation

```
src/
  components/   Composants réutilisables (BookCover, BookCard, GlobalSearch, Navigation, ui…)
  pages/        Les 7 écrans
  store/        État de l'application (Context React + persistance)
  lib/          Client Open Library, utilitaires
  data/         Types et données d'exemple
```
