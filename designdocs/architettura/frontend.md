# Frontend

> **Stato**: completato · **Passo**: T1 del binario tecnico · Metodologia in [README.md](../README.md)

- **Obiettivo**: descrivere la SPA React di GreenManager: struttura, provider, moduli, data fetching, pattern UI di base, versioni.
- **Fonte**: `admin/` di [inmagik/data-lab](https://github.com/inmagik/data-lab) per struttura, componenti e pattern; [inmagik/bottaro-pesatura](https://github.com/inmagik/bottaro-pesatura) per le versioni (D-036, D-038). Commit e regole di copia in [README.md](README.md).
- **Fuori da questo documento**: i pattern per le singole sezioni dell'interfaccia (mappa, uso in campo, mappa pubblica…), che sono il passo T2; l'elenco dei moduli di dominio, che si definisce in T3.

## 1. Struttura

```
frontend/
├── package.json
├── vite.config.ts            alias @, proxy /api, plugin di menu e rotte
├── plugins/
│   ├── menu.ts               genera virtual:menu dai menu.tsx dei moduli
│   └── navigation.ts         genera virtual:routes dai navigation.tsx dei moduli
├── index.html
├── tsconfig.json, tsconfig.app.json, tsconfig.node.json
├── eslint.config.js, .prettierrc, postcss.config.cjs
├── Dockerfile, nginx.conf, build_image.sh
└── src/
    ├── main.tsx              stili Mantine, i18n, montaggio di App
    ├── App.tsx               catena dei provider (§2)
    ├── Navigation.tsx        router: rotte di base più quelle dei moduli
    ├── declarations.d.ts     tipi dei moduli virtuali
    ├── constants.ts          API_URL, IMAGE_URL
    ├── mantine_customization.css
    ├── auth/                 login, token, layout guest e autenticato
    ├── context/              contesto del tenant
    ├── general/              DataProvider, ThemeProvider
    ├── hooks/                useHasPermission, useTenant, useUrlParams
    ├── components/           componenti condivisi (§5)
    ├── i18n/                 traduzioni (§6)
    ├── pages/                accesso, password, profilo, home
    ├── utils.tsx, utils/     conferme, traduzione degli errori, valori dei form
    └── modules/              un modulo per area funzionale (§4)
        ├── users/
        ├── tenants/
        └── <moduli di dominio>/
```

Import con l'alias `@/` per tutto ciò che sta fuori dal modulo corrente (`@/components/Page`); import relativi dentro il modulo.

## 2. Avvio, provider e routing

`App.tsx` annida i provider in quest'ordine:

| Provider | Ruolo |
|---|---|
| `AuthProvider` | da `MakeAuthTools` di `@inmagik/react-auth`: login con email e password su `api/core/auth/token/`, rinnovo del token, dati dell'utente da `me/`. `useAuth()` dà `user`, `tokens`, `performLogout` |
| `TenantProvider` | carica i tenant dell'utente da `api/core/tenants/` e ricorda la scelta in localStorage. `useTenant()` dà `tenant`, `tenants`, `setTenant`, `isReady` |
| `DataProvider` | `QueryClient` di TanStack Query con i default di data-lab (niente refetch al focus, nessun retry). Passa a `@inmagik/react-crud`, tramite `DataFetchingAuthContext`, gli header `Authorization: Bearer …` e `X-Tenant-ID`. Al cambio di tenant annulla e svuota la cache. In sviluppo mostra i devtools |
| `ThemeProvider` | `MantineProvider` con il tema (palette `default`, spaziature aggiuntive `3xs` e `xxs`), notifiche, `ModalsProvider`, `DatesProvider` con la lingua corrente |

`Navigation.tsx` crea il router (`createBrowserRouter`):
- **rotte guest** sotto `GuestLayout`, che rimanda alla home chi è già autenticato: `/login`, `/forgot-password`, `/reset-password`, `/verify-email`, `/welcome`;
- **rotte autenticate** sotto `AuthLayout`, che rimanda al login chi non lo è: `/` (home), `/profile` e tutte le rotte dei moduli.

`AuthLayout` usa l'`AppShell` di Mantine:
- su desktop, a sinistra la `DoubleNavbar` (icone delle sezioni, voci della sezione attiva, profilo, lingua) e il `TenantSelector`;
- su smartphone, un header con logo e burger che apre lo stesso menu.

Ogni rotta è avvolta in `ScreenWidthGuard`, che oggi lascia passare tutto. È il punto in cui limitare alcune pagine sugli schermi piccoli, se T2 lo deciderà.

## 3. Menu e rotte generati dai moduli

I due plugin di Vite leggono le cartelle di `src/modules/` all'avvio e generano due moduli virtuali:
- `virtual:menu` unisce le voci restituite da `contributeToMenu(user)` nei `menu.tsx`;
- `virtual:routes` unisce gli array `routes` dei `navigation.tsx`.

Un modulo nuovo compare nel menu e nel router senza toccare file centrali. I tipi dei moduli virtuali sono in `declarations.d.ts`.

Voce di menu:

| Campo | Significato |
|---|---|
| `id` | identificativo; `sezione` o `sezione:voce`. È anche la chiave di traduzione `navigation.<id>` |
| `label` | testo di ripiego se manca la traduzione |
| `path` | rotta |
| `parent` | `null` per una sezione (icona nella barra principale), l'`id` della sezione per una voce |
| `icon` | icona di `react-icons/tb` |
| `priority` | ordine, crescente |
| `permission` | permesso richiesto; le voci senza permesso si filtrano con `hasPermission` |

## 4. Moduli

Un modulo per area funzionale, con lo stesso nome dell'app Django corrispondente quando c'è.

```
src/modules/<modulo>/
├── api/<risorsa>.ts        hook di data fetching, uno per risorsa (§5.1)
├── components/             tabelle, form, azioni, menu contestuali
├── pages/                  pagine di lista e di dettaglio
├── menu.tsx                contributeToMenu(user)
├── navigation.tsx          routes: RouteObject[]
├── permissions.ts          costanti dei permessi
└── types.ts                tipi delle risorse
```

- **`navigation.tsx`**: una rotta di sezione con `AuthLayout`; sotto, una rotta per risorsa avvolta in `CheckPermission`, con figli `index` (lista), `:id` e `:id/:tab` (dettaglio). La rotta `index` della sezione reindirizza alla prima risorsa.
- **`permissions.ts`**: un oggetto `as const` con i codici completi del backend, per esempio `{ READ_CONTENTS: "datasets.READ_CONTENTS" }`. I codici sono quelli dei `fm_permissions.py` (§4.7 di [backend.md](backend.md)).
- **`types.ts`**: i tipi delle risorse come le restituisce l'API, con i campi `<relazione>_data` annidati. Le entità operative hanno chiave UUID (D-014), quindi `id: string`. Le risorse delle app core (utenti, tenant, ruoli) hanno chiavi numeriche.
- **Moduli copiati**: `users` (utenti e ruoli, con l'assegnazione dei permessi) e `tenants` (organizzazioni e membri, visibile solo allo staff).

## 5. Pattern dei moduli di dominio

Presi dal modulo `datasets` di data-lab e dal modulo `anagrafica` di bottaro-pesatura. Qui si fissano i pattern comuni; quelli per le singole sezioni sono il passo T2.

### 5.1 API e data fetching

- In `api/<risorsa>.ts`: una costante con l'URL della risorsa (`` `${API_URL}/api/<app>/<risorse>` ``) e un hook per operazione, costruito sugli hook di `@inmagik/react-crud`:

  | Hook di react-crud | Uso | Esempio |
  |---|---|---|
  | `useList` | lista paginata con filtri | `useElements(filters)` |
  | `useDetail` | dettaglio, con `enabled` legato all'id | `useElement(id)` |
  | `useCreate`, `usePartialUpdate`, `useDelete` | scritture | `useCreateElement()` |
  | `useAction` | action del backend | `useBulkDeleteElements()` su `bulk-delete` |

- Le chiavi di TanStack Query partono dall'URL della risorsa. Dopo una scrittura si invalidano le query con quel prefisso.
- Upload multipart, download di file e risposte che non sono liste (GeoJSON, dati di grafici): `useQuery` o `useMutation` con `fetchApi` di react-crud e gli header presi da `DataFetchingAuthContext`.
- La risposta delle liste è quella di `StandardPagination` (§3.4 di [backend.md](backend.md)): `count`, `full_count`, `results`.

### 5.2 Pagina di lista

- Struttura: `Page`, poi `Header` (icona, titolo, breadcrumb, azioni), poi la barra dei filtri, poi la tabella.
- Filtri, pagina e ordinamento stanno nei parametri dell'URL (`useSearchParams` o `useUrlParams`): la lista si può ricaricare e condividere. La ricerca passa da `useDebouncedValue` (300 ms); ogni cambio di filtro riporta a pagina 1.
- Tabella con `createTable<T>()` del componente `Table`:
  - `Table.Column` con `title` (chiave di traduzione), `name`, `render`, `sortable`;
  - `Table.Selection` per la selezione multipla;
  - `Table.Footer.Left` con la `Pagination` di Mantine, `Table.Footer.Right` con il riepilogo dei risultati;
  - `TableEmptyState` quando `full_count` è 0, con le azioni di creazione.
  - Il nome della risorsa nella prima colonna è un link al dettaglio; l'ultima colonna ha il menu contestuale.
- Con righe selezionate, le azioni dell'header diventano *Annulla* ed *Elimina*. L'eliminazione chiede conferma con `modals.openConfirmModal` ed elenca i record.

### 5.3 Azioni e modali

- `Create<Risorsa>Action`: un bottone che apre `modals.open` con il form della risorsa. Al salvataggio la modale si chiude.
- `<Risorsa>ContextActions`: un `Menu` con le azioni sul record (modifica in modale; in fondo, sotto un'etichetta di zona pericolosa, l'eliminazione con `requestConfirmation`).
- Le azioni di scrittura sono avvolte in `CheckPermission` con il permesso di scrittura.

### 5.4 Form

- `@mantine/form` con validazione yup tramite `mantine-form-yup-resolver`; le etichette dei campi vengono dalle traduzioni.
- Un form per risorsa (`<Risorsa>Form`), con le prop `initialValues`, `onSubmit`, `readonly` e `layout`:
  - `modal`: una colonna, bottone di conferma in basso a destra;
  - `page`: griglia responsive (`SimpleGrid` da 1 a 4 colonne) e `FormFooter` con *Annulla* e *Salva*.
- Gli errori del backend (`ApiError`) diventano errori dei campi con `transformErrorsForForm`. Gli errori generali (`non_field_errors`) si mostrano con `AlertError` in cima al form.

### 5.5 Pagina di dettaglio

- Rotta `:id/:tab`. Le sezioni del record sono `Tabs` di Mantine; il cambio di tab cambia la rotta e conserva i parametri.
- Il primo tab mostra il form in `layout="page"` e in sola lettura; il bottone *Modifica* dell'header lo rende modificabile.
- Con modifiche non salvate, `BlockNavigation` chiede conferma prima di lasciare la pagina.
- L'header può mostrare l'ultima modifica (`lastEditDetails`), dai campi di django-auditlog (§3.4 di [backend.md](backend.md)).
- Lo storico completo delle modifiche del record si apre con `AuditHistoryModal`, copiato da bottaro-pesatura. Il rapporto con lo storico del dominio (`ChangeRecord`, D-034) si decide in T3 (domanda 3 di [backend.md](backend.md#domande-aperte)).

### 5.6 Permessi nell'interfaccia

- `hasPermission(user, permesso)` e `useHasPermission(permesso)` accettano un codice, `{ oneOf: [...] }` o `{ allOf: [...] }`. Il superuser passa sempre, come nel backend (§3.1 di [backend.md](backend.md)).
- `CheckPermission` mostra i figli solo con il permesso; `CheckStaff` solo allo staff.
- Il controllo nell'interfaccia nasconde ciò che non si può fare. Il controllo vero è quello del backend.

### 5.7 Messaggi ed errori

- Gli errori del backend si traducono con `translateApiError`, che cerca la chiave `serverErrors.<code>` con i `params` dell'errore (§4.3 di [backend.md](backend.md)). data-lab ha anche una tabella di ripiego che traduce i testi inglesi di vecchi errori: nel codice nuovo ogni errore ha un `code`.
- Esiti delle operazioni con le notifiche di Mantine; conferme con `requestConfirmation` o `modals.openConfirmModal`.

## 6. Internazionalizzazione

- i18next con react-i18next e il rilevamento della lingua dal browser; la scelta si ricorda in localStorage.
- Traduzioni in `src/i18n/<lingua>/`, un file per modulo, uniti in un unico oggetto. Chiavi comuni: `common.*`, `fields.*` (nomi dei campi), `navigation.*` (voci di menu), `validation.*` (messaggi di yup, impostati da `i18n/yup.ts`), `serverErrors.*` (codici di errore del backend). Ogni modulo ha le proprie chiavi sotto il suo nome (`datasets.list.geoDatasets`).
- **Adattamenti**:
  - l'italiano è la lingua di riferimento: il tipo delle traduzioni si ricava dai file `it`, non da `en` come in data-lab, e `fallbackLng` è `it`;
  - si copiano solo le traduzioni comuni (`auth`, `common`, `tenants`, `users`);
  - solo italiano nell'MVP (domanda 1). La struttura di i18next resta, per aggiungere altre lingue; `LanguageSelector` resta nascosto finché le lingue sono una.

## 7. Strumenti, build e immagine

- **Comandi**: `yarn dev` (Vite su `localhost:5173`, con proxy di `/api` verso `localhost:8000`), `yarn build` (`tsc -b` e `vite build`), `yarn lint`.
- **Vite**: `vite.config.ts` importa i plugin con l'estensione (`./plugins/menu.ts`), come chiede il caricamento nativo della configurazione.
- **TypeScript** in modalità `strict`, con `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax` (import di soli tipi con `import type`).
- **ESLint**: configurazione piatta con le regole raccomandate di JavaScript, typescript-eslint, react-hooks e react-refresh.
- **Prettier**: senza punto e virgola, virgolette doppie, virgola finale `es5`, riga di 120 caratteri, indentazione di 2 spazi. È la stessa configurazione in data-lab e bottaro-pesatura.
- **Lingua del codice**: identificatori in inglese (D-001); i testi visibili stanno nelle traduzioni, non nel codice.
- **Immagine**: `Dockerfile` su `nginx:1.31.1`, che serve `dist/` con il fallback su `index.html` per le rotte della SPA e senza cache per i file HTML. `build_image.sh` pubblica `docker.inmagik.com/greenmanager/frontend:latest`.

## 8. Versioni

Fonte: `frontend/package.json` di bottaro-pesatura al commit `3d4b313f00`. Gestore dei pacchetti: yarn.

**Dipendenze**

| Pacchetto | Versione | Fonte |
|---|---|---|
| `@inmagik/react-auth` | ^0.0.7 | bottaro-pesatura |
| `@inmagik/react-crud` | ^0.0.14 | bottaro-pesatura |
| `@mantine/core`, `dates`, `form`, `hooks`, `modals`, `notifications` | ^9.7.0 | bottaro-pesatura |
| `@tanstack/react-query`, `@tanstack/react-query-devtools` | ^5.104.1 | bottaro-pesatura |
| `react`, `react-dom` | ^19.3.0 | bottaro-pesatura |
| `react-router-dom` | ^7.18.4 | bottaro-pesatura |
| `react-icons` | ^5.7.0 | bottaro-pesatura |
| `dayjs` | ^1.11.23 | bottaro-pesatura |
| `yup` | ^1.7.1 | bottaro-pesatura |
| `mantine-form-yup-resolver` | ^2.0.0 | bottaro-pesatura |
| `classnames` | ^2.5.1 | bottaro-pesatura |
| `i18next` | ^26.4.2 | data-lab |
| `react-i18next` | ^17.0.15 | data-lab |
| `i18next-browser-languagedetector` | ^8.2.1 | data-lab |
| `@mantine/dropzone` | ^9.7.0 | data-lab, allineata alle altre `@mantine/*` |

**Dipendenze di sviluppo**, tutte da bottaro-pesatura:

| Pacchetto | Versione |
|---|---|
| `typescript` | ^6.0.0 |
| `vite` | ^8.3.3 |
| `@vitejs/plugin-react` | ^6.1.2 |
| `eslint` | ^10.12.0 |
| `@eslint/js` | ^10.0.1 |
| `typescript-eslint` | ^8.71.1 |
| `eslint-plugin-react-hooks` | ^7.0.1 |
| `eslint-plugin-react-refresh` | ^0.5.7 |
| `globals` | ^17.13.0 |
| `@types/node` | ^26.6.4 |
| `@types/react`, `@types/react-dom` | ^19.3.0 |
| `postcss` | ^8.5.29 |
| `postcss-preset-mantine` | ^1.18.0 |
| `postcss-simple-vars` | ^7.0.1 |

- Le librerie della mappa e del disegno delle geometrie si scelgono in T2 (domanda 2). Quelle dei grafici, quando servono, si allineano a `@mantine/charts` ^9.7.0.
- Non si copiano le librerie di data-lab legate a editor di documenti, diagrammi e simulazioni: lexical, reactflow, dagre, dnd-kit, swiper, d3-scale, chroma-js, html-to-image, xlsx. `flag-icons` serve solo al selettore della lingua, se le lingue sono più di una.
- **Verifica di T4**: i componenti copiati da data-lab, scritti per Mantine 9.3 e TypeScript 5.9, compilano con Mantine 9.7 e TypeScript 6 senza modifiche. Le correzioni fatte nello scaffold sono altre:
  - `yarn.lock` parte da quello di bottaro-pesatura. Con un lockfile nuovo yarn non trova `hashery` 1.x, una dipendenza indiretta di ESLint;
  - `Table` dà una `key` a ogni riga, per l'avviso di React sulle liste;
  - `DataProvider` chiama `setState` in un effetto per svuotare la cache al cambio di organizzazione. È voluto: la regola `react-hooks/set-state-in-effect` è disattivata su quella riga, con il motivo;
  - il bundle di produzione supera i 500 kB: la suddivisione in chunk si valuta quando arrivano i moduli di dominio.

## Domande aperte

1. **Lingue dell'interfaccia.** Solo italiano nell'MVP, mantenendo la struttura di i18next per aggiungerne altre, o anche l'inglese, già tradotto nelle parti copiate? → **chiusa** alla revisione: solo italiano; il selettore della lingua resta nascosto finché le lingue sono una (§6).
2. **Libreria della mappa.** data-lab usa Leaflet per mostrare i layer e OpenLayers per esportare le mappe delle simulazioni. GreenManager deve anche disegnare e modificare punti, linee e poligoni in campo. Alternative: Leaflet con un plugin di disegno, OpenLayers, MapLibre. Il disegno deve gestire anche linee e poligoni multiparte (D-035). → rinviata a T2, da chiudere nella prima fetta verticale (D-040)
3. **Mappa pubblica.** Rotte pubbliche nella stessa SPA, senza `AuthLayout`, o un'app separata e più leggera? → rinviata a T2
