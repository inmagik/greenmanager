# Frontend

> **Stato**: completato per T1; §9 in corso con T3 e la prima fetta verticale · **Passo**: T1 e T3 del binario tecnico · Metodologia in [README.md](../README.md)

- **Obiettivo**: descrivere la SPA React di GreenManager: struttura, provider, moduli, data fetching, pattern UI di base, versioni.
- **Fonte**: `admin/` di [inmagik/data-lab](https://github.com/inmagik/data-lab) per struttura, componenti e pattern; [inmagik/bottaro-pesatura](https://github.com/inmagik/bottaro-pesatura) per le versioni (D-036, D-038). Commit e regole di copia in [README.md](README.md).
- **Moduli di dominio**: elenco, parti comuni e regole sono in §9, che cresce con la prima fetta verticale (T3, D-040).
- **Fuori da questo documento**: i pattern per le singole sezioni dell'interfaccia (mappa, uso in campo, mappa pubblica…), che sono il passo T2.

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
- **rotte guest** sotto `GuestLayout`, che rimanda alla home chi è già autenticato: `/login`, `/forgot-password`, `/reset-password`, `/welcome`. data-lab ha anche `/verify-email`, che non chiama nessun endpoint: non si copia, perché l'attivazione dell'account passa dal link verso `/welcome`;
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
| `permission` | facoltativo: la `DoubleNavbar` mostra la voce solo a chi ha il permesso nell'organizzazione corrente (`hasPermission`) |

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
  - `Table.Selection` per la selezione multipla, con `getRowLabel` per il nome accessibile delle caselle (di solito il nome del record);
  - `Table.Footer.Left` con la `Pagination` di Mantine, `Table.Footer.Right` con il riepilogo dei risultati;
  - `TableEmptyState` quando `full_count` è 0, con le azioni di creazione.
  - Il nome della risorsa nella prima colonna è un link al dettaglio; l'ultima colonna ha il menu contestuale, il cui pulsante ha un `aria-label` tradotto con il nome del record.
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
- Lo storico completo delle modifiche del record si apre con `AuditHistoryModal`, copiato da bottaro-pesatura. Il rapporto con lo storico del dominio (`ChangeRecord`, D-034) è in §9.4 (D-053).

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

- **Comandi**: `yarn dev` (Vite su `localhost:5173`, con proxy di `/api` verso `localhost:8000` che conserva l'host del browser: così i link `next` della paginazione restano sul proxy), `yarn build` (`tsc -b` e `vite build`), `yarn lint`.
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
  - `Table` dà a ogni riga come `key` l'`id` del record, o quella di `getRowKey`, così lo stato dei componenti non passa da una riga all'altra quando cambiano ordinamento o pagina;
  - `DataProvider` chiama `setState` in un effetto per svuotare la cache al cambio di organizzazione. È voluto: la regola `react-hooks/set-state-in-effect` è disattivata su quella riga, con il motivo;
  - il bundle di produzione supera i 500 kB: la suddivisione in chunk si valuta quando arrivano i moduli di dominio.
- **Revisione della PR dello scaffold**, correzioni al modulo `users`:
  - disattivazione e riattivazione mandano solo `is_active`; il salvataggio dei dati solo nome ed email, quello di ruoli e permessi solo quei campi, quello di un ruolo solo nome e permessi. In data-lab si mandava l'intero record, che poteva riscrivere valori cambiati nel frattempo;
  - gli errori delle azioni fuori dai form (menu, conferme, eliminazioni multiple, sblocco) si mostrano in una notifica con `notifyApiError` di `utils.tsx`: in data-lab si perdevano. Disattiva ed Elimina sono disabilitati sul proprio account;
  - il form di ruoli e permessi mostra gli errori del server; i gruppi di permessi hanno un nome tradotto (`roles.modules.<app>`), le caselle un nome accessibile;
  - nella scheda "Ruoli e permessi" il pulsante Modifica richiede `WRITE_USERS` e `WRITE_ROLES`: il salvataggio è una modifica dell'utente, e il server vuole `WRITE_ROLES` per cambiare i ruoli. Allo staff basta `WRITE_USERS`, perché può cambiare i permessi diretti; senza `WRITE_ROLES` i ruoli restano in sola lettura. L'assegnazione di un ruolo dal dettaglio del ruolo (`grant_to`) richiede solo `WRITE_ROLES`;
  - la rimozione del ruolo, dagli utenti selezionati o da un utente col menu della riga, chiama `revoke_from`. In data-lab la prima scriveva solo in console, la seconda mandava l'intero utente;
  - `RoleMultiSelect` e `UserMultiSelect` tengono tra le opzioni gli elementi selezionati anche quando la ricerca non li restituisce.
- **Revisione della PR dello scaffold**, correzioni ai componenti condivisi:
  - testi in italiano dove erano scritti nel codice in inglese: errori del login (`login()` lancia un codice, `auth.loginErrors` lo traduce), pulsanti di `BlockNavigation`, `PermissionTooltip`;
  - `AlertError` mostra l'azione solo con `actionPermission` anche nella variante di errore (es. lo sblocco dell'utente);
  - accessibilità: `aria-label` sui pulsanti dei menu contestuali e sulle caselle di selezione di `Table`; l'ordinamento delle colonne è un pulsante, usabile da tastiera, con l'etichetta che dice la direzione corrente.
- **Seconda revisione della PR dello scaffold**:
  - `Table` ha i ruoli ARIA di una tabella (`table`, `rowgroup`, `row`, `columnheader` con `aria-sort`, `cell`); una riga intercetta il clic solo se ha `onRowClick`, e lascia ai link, ai pulsanti e alle caselle il loro comportamento;
  - testi nelle traduzioni: `AuditHistoryModal` (con i codici delle azioni del server), `AsyncSelect`, i placeholder; errori di attivazione, reset e cambio della password sui campi, con il token non valido tradotto; tolti i testi dei dataset e delle simulazioni di data-lab;
  - `TenantSelector` usa `Menu` di Mantine, accessibile da tastiera; `AsyncSelect` ha un pulsante per svuotarlo e un nome accessibile; le ricerche e i filtri hanno un `aria-label`; i tooltip di `PermissionTooltip` e `Header` si aprono anche dal focus;
  - pagine "Pagina non trovata" e "Accesso non consentito" (`components/StatusPage`): per i percorsi sconosciuti, per i dettagli di un record che non esiste (prima il caricamento non finiva) e per le rotte senza permesso (prima la pagina restava vuota);
  - profilo: `useUpdateMe` chiamava `me//` (`useAction` aggiunge la `/` finale) e il salvataggio falliva; ora aggiorna anche l'utente di `AuthProvider`. `TenantProvider` ricarica le organizzazioni solo quando cambia l'utente, non i suoi dati;
  - lo sblocco dell'utente chiama `unlock/` con la `/` finale; il login distingue l'account bloccato (`account_locked`);
  - la home toglie l'header mobile dall'altezza, come `Page`; `Redirect` sostituisce la voce della cronologia.
- **Quarta revisione della PR dello scaffold**:
  - i permessi valgono nell'organizzazione corrente, come nel server (§3.1 di [backend.md](backend.md)): `useHasPermission` e il menu usano `useTenantUser()`, con i permessi diretti più quelli dei ruoli dell'organizzazione corrente. `all_permissions` di `me/` unisce i ruoli di tutte le organizzazioni;
  - codici dei permessi in inglese (`READ_USERS`, `WRITE_USERS`, `READ_ROLES`, `WRITE_ROLES`) e rotte del modulo `users` in inglese (`/users/users`, `/users/roles`; in data-lab `/utenti/utenti`, `/utenti/ruoli`), come gli altri identificatori (D-001).
- **Quinta revisione della PR dello scaffold**:
  - le liste con selezione la svuotano a ogni cambio di ricerca, ordinamento o pagina, e le azioni multiple mandano solo i record elencati nella conferma: in data-lab potevano eliminare organizzazioni o togliere ruoli a utenti non più visibili;
  - le righe e i contenuti a tutta larghezza di `Table` occupano `headers.length` colonne: con una in più la griglia ne creava una implicita, e la tabella si allargava rispetto all'intestazione.
- **Prima fetta verticale (T3)**:
  - nel dettaglio dell'utente i permessi diretti si cambiano solo dallo staff, come nel server (D-045). Per gli altri il form dei permessi li mostra in sola lettura, con una nota che rimanda ai ruoli;
  - la voce di menu ha il campo `permission` anche nel tipo (`declarations.d.ts`), e la `DoubleNavbar` filtra le voci con `hasPermission`. Prima ogni `menu.tsx` filtrava le proprie, come fa ancora `users`;
  - `i18n/it/index.ts` unisce le chiavi `serverErrors` dei file dei moduli a quelle di `common.ts`, che l'unione semplice degli oggetti sovrascriverebbe (§9.2);
  - `AsyncSelect` accetta `label`, `description` e `withAsterisk`, come gli altri campi di un form: `SpeciesSelect` lo usa nei form (§9.6).

## 9. Moduli di dominio

Si scrive in T3, insieme alla prima fetta verticale (D-040): ogni PR del frontend aggiunge i suoi moduli. Decisione D-053.

### 9.1 Moduli

Un modulo per app Django di dominio, con lo stesso nome (§8.1 di [backend.md](backend.md)).

| Modulo | Risorse e rotte | Permessi | Arriva con |
|---|---|---|---|
| `parties` | committenti, `/parties/clients` | `parties.READ_CLIENTS`, `parties.WRITE_CLIENTS` | PR3a |
| `catalogs` | sette cataloghi, `/catalogs/<catalogo>` | lettura per ogni membro, `catalogs.WRITE_CATALOGS` | PR3b |
| `territory` | zone e aree | `territory.READ_AREAS`, `territory.WRITE_AREAS` | PR3c |
| `inventory` | elementi | `inventory.READ_ELEMENTS`, `inventory.WRITE_ELEMENTS` | PR3d |
| `map` | mappa, `/map` | quelli dei layer mostrati | PR4a |

### 9.2 Parti comuni

- **Menu**: una voce dichiara il suo `permission`, e la `DoubleNavbar` la mostra solo a chi lo ha nell'organizzazione corrente (§3).
- **Traduzioni**:
  - in `common.ts`, oltre alle chiavi di §6: `fields.*` dei campi di tracciamento (autore, date, revisione), `tracking.*` per il riepilogo dell'ultima modifica, `revisionConflict.*`, e i codici di errore usati da più moduli (`revision_conflict`, `client_not_available`, `client_immutable`);
  - il file di un modulo ha le sue chiavi sotto il nome del modulo, più una chiave `serverErrors` con i codici di errore suoi (es. `client_has_related_data` in `parties.ts`). `i18n/it/index.ts` unisce i `serverErrors` di `common.ts` e dei moduli: un modulo nuovo vi aggiunge i suoi, oltre a registrare il file.
- **Tracciamento** (`utils/tracking.ts`):
  - `TrackedRecord` è il tipo dei campi di tracciamento che il server restituisce per ogni dato di dominio (D-042);
  - `lastEditDetails(record)` scrive chi ha creato e modificato il record, quando, e la revisione: è il testo dell'"ultima modifica" nell'intestazione del dettaglio (`Header`).
- **Conflitto di revisione** (D-042, D-053):
  - il form di modifica manda la `revision` del record che ha letto;
  - se nel frattempo il record è cambiato, il server risponde `409 revision_conflict`: il form lo riconosce con `isRevisionConflict` e mostra `RevisionConflictAlert`, un avviso con il pulsante *Ricarica*;
  - *Ricarica* rilegge il record. Il form ha come `key` la revisione, quindi riparte dai valori nuovi; le modifiche non salvate si perdono, e l'avviso lo dice;
  - la modifica in modale legge il dettaglio del record all'apertura, così manda l'ultima revisione e non quella della riga della lista;
  - le azioni che cambiano un solo campo (es. disattiva) non mandano la revisione: non sovrascrivono gli altri dati;
  - nel dettaglio, *Modifica* resta disabilitato mentre il record si ricarica, per esempio subito dopo un salvataggio: il form deve partire dalla revisione nuova;
  - nel dettaglio, durante la modifica, il menu delle azioni è nascosto: un'azione cambierebbe la revisione e ricaricherebbe il form, perdendo le modifiche.

### 9.3 Committente come filtro

Vedi D-053. I dati del patrimonio (zone, aree, elementi) appartengono a un committente, e un'organizzazione ne gestisce più di uno.
- `ClientSelect` (`modules/parties/components/`) sceglie un committente tra quelli dell'action `choices/`, con la ricerca nel testo. Con `activeOnly` mostra solo i committenti attivi: si usa nei form dei dati nuovi. Un committente disattivato è segnato nell'opzione. Il server accetta dati nuovi anche per un committente disattivato: il limite oggi è solo nell'interfaccia (domanda 5).
- `useClientFilter` (`modules/parties/hooks/`) dà il committente scelto come filtro di una lista, e la funzione per cambiarlo:
  - il valore sta nel parametro `client` dell'URL, che le API delle liste accettano come filtro: la lista si ricarica e si condivide;
  - l'ultimo valore si ricorda nel browser (localStorage), per organizzazione. Una lista aperta senza il parametro riparte da quel valore, e lo scrive nell'URL;
  - il valore è unico per le liste di zone, aree ed elementi: chi lavora su un committente lo ritrova passando da una lista all'altra;
  - un committente che non è più tra le scelte (eliminato, o di un'altra organizzazione) si scarta;
  - cambiare committente riporta la lista a pagina 1.

### 9.4 Storico nell'interfaccia

Vedi D-043 e D-053.
- La modale dello storico (`AuditHistoryModal`) legge l'action `history/` del record: lo storico tecnico di django-auditlog.
  - I nomi dei campi sono i `verbose_name` dei modelli, in italiano, e i valori delle scelte sono le etichette.
  - I campi di tracciamento restano fuori (`register_audit`), e così la geometria di aree ed elementi: superficie, perimetro e lunghezza ne mostrano le modifiche (§8.6 di [backend.md](backend.md)).
- L'intestazione del dettaglio mostra autore, date e revisione dai campi di tracciamento (`lastEditDetails`), che sono colonne del record e non voci di django-auditlog (D-042).
- `ChangeRecord`, lo storico di dominio con motivazione e origine, nella fetta non ha un'interfaccia né un endpoint (domanda 4).

### 9.5 Committenti: `parties`

`api/parties/clients/` (§8.5 di [backend.md](backend.md)).
- **Lista**: ricerca per nome, codice fiscale o codice ISTAT; filtri per stato e per tipo; ordinamento per nome e per ultima modifica. Un errore di caricamento si mostra sopra la tabella; ricerca e filtri senza risultati hanno un messaggio proprio, diverso dalla lista vuota. Nessuna selezione multipla: il server non ha un'eliminazione multipla dei committenti.
- **Dettaglio** (`/parties/clients/:id`), senza schede: il form in sola lettura, i pulsanti *Storico* e *Modifica*, il menu con disattiva o riattiva ed elimina. Un committente disattivato ha un avviso con *Riattiva*.
- **Form**: denominazione e tipo obbligatori; codice ISTAT di 5 o 6 cifre, codice fiscale o partita IVA, recapiti, sistema di riferimento per l'export CAM, note. `active` non è nel form: cambia con le azioni disattiva e riattiva.
- **Eliminazione**: solo per un committente inserito per errore. Uno con dati collegati non si elimina (`client_has_related_data`): l'errore tradotto invita a disattivarlo.
- L'organizzazione di gestione non è nel form: la cambia solo lo staff (`managing_organization_staff_only`), e il caso (K2, §4.7 di [04-modello-dati.md](../04-modello-dati.md)) non serve alla fetta.

### 9.6 Cataloghi: `catalogs`

`api/catalogs/<catalogo>/` (§8.4 di [backend.md](backend.md)). Vedi D-054.

- **Hook**: `createCatalogApi(slug)` dà gli hook di un catalogo, uguali per tutti: lista, dettaglio, `choices/`, scritture, `hide/` e `unhide/`, l'URL dello storico. Le istanze dei sette cataloghi sono in `api/catalogs.ts`. Una scrittura invalida le query di tutti i cataloghi, perché una voce è incorporata in altre: gli attributi nelle classi, la voce superiore nelle specie.
- **Definizioni** (`definitions.ts`), una per catalogo:
  - rotta, chiave delle traduzioni, icona, hook;
  - se il catalogo è estendibile (voci di sistema più quelle delle organizzazioni) o fisso, e se le organizzazioni vi aggiungono voci;
  - i campi oltre a quelli comuni (codice, descrizione, ordine, fonte), con un tipo: `enum`, `number`, `text`, `boolean`, `list`, più la voce superiore della specie e gli attributi della classe. Un campo può essere obbligatorio, derivato dal server (in sola lettura, mai inviato) o visibile solo con certi valori del form, come i valori ammessi di un attributo a scelta;
  - quali campi sono colonne e filtri della lista.

  Le definizioni guidano lista, dettaglio, form e menu: ogni catalogo ha la sua voce nella sezione *Cataloghi*.
- **Specie e classi** usano le stesse pagine, con i loro campi:
  - specie: il nome scientifico al posto del nome, livello, genere (dal server), nome comune, famiglia, voce superiore, sinonimi, riferimento esterno. La voce superiore si sceglie con `SpeciesSelect`: tra i generi per una specie o un ibrido, tra generi, specie e ibridi per una cultivar (il filtro `rank` del server accetta più valori). Un genere non ha voce superiore. Epiteti e cultivar non sono nel form: restano quelli dell'import;
  - classi: categoria, tipo di geometria, unità, modalità della specie, conta come albero, posto d'impianto, e gli attributi della classe, in un editor che li ordina e li segna obbligatori. Un attributo nuovo si sceglie tra quelli disponibili; uno già nella classe resta anche se poi è nascosto o ritirato.
- **Lista**: ricerca; filtri del catalogo (livello, categoria, tipo…), origine (sistema o organizzazione) e disponibilità (disponibili, non disponibili, nascoste, ritirate); colonne del catalogo, origine e stato. Nessuna selezione multipla: il server non ha un'eliminazione multipla delle voci.
- **Dettaglio** (`/catalogs/<catalogo>/:id`): il form in sola lettura, *Storico*, *Modifica*, il menu delle azioni. Una voce nascosta o ritirata ha un avviso, con *Mostra* o *Ripristina* per chi può.
- **Azioni**:
  - nascondi e mostra, sulle voci di sistema dei cataloghi estendibili;
  - ritira e ripristina, che mandano solo `retired`, senza la revisione (§9.2);
  - elimina: una voce in uso non si elimina (`catalog_entry_in_use`), e l'errore tradotto invita a ritirarla o nasconderla.
- **Permessi** (`useCatalogPermissions`):
  - la lettura è aperta a ogni membro, e le voci di menu non hanno permesso; la scrittura chiede `WRITE_CATALOGS`;
  - le azioni di scrittura stanno in `CheckPermission`, come negli altri moduli; l'hook aggiunge le regole che `CheckPermission` non esprime, perché dipendono dalla voce (di sistema o no) e dall'utente (staff o no);
  - le voci di sistema le modificano, ritirano ed eliminano solo gli utenti dello staff; nasconderle è una scelta dell'organizzazione, con `WRITE_CATALOGS`;
  - nei cataloghi senza voci delle organizzazioni (attributi e tipologie ISTAT) solo lo staff crea voci, che sono di sistema. Negli altri, il form di creazione dello staff ha la casella *Voce di sistema*.
- **Campi bloccati**: il server dà in `locked_fields` i campi che non cambiano perché la voce è in uso (tipo di geometria e modalità della specie di una classe, tipo di dato e flag di misura di un attributo). Il form li disabilita e ne dice il motivo. Anche il codice di una voce di sistema è disabilitato.
- **Selettori** per i form degli altri moduli:
  - `CatalogSelect`: le voci disponibili di un catalogo (`choices/`), con filtri, gruppi ed esclusioni facoltativi;
  - `ElementClassSelect`: le classi, raggruppate per categoria. `onChange` dà anche la classe scelta, con geometria, modalità della specie e attributi, che guidano il form dell'elemento (PR3d);
  - `SpeciesSelect`: cerca tra le specie disponibili sulla lista paginata, perché il catalogo ha migliaia di voci;
  - un valore già salvato, la cui voce è poi nascosta o ritirata, resta: il selettore lo mostra con la nota *non disponibile*. Un valore disponibile ma fuori dai filtri del selettore si mostra senza la nota.

## Domande aperte

1. **Lingue dell'interfaccia.** Solo italiano nell'MVP, mantenendo la struttura di i18next per aggiungerne altre, o anche l'inglese, già tradotto nelle parti copiate? → **chiusa** alla revisione: solo italiano; il selettore della lingua resta nascosto finché le lingue sono una (§6).
2. **Libreria della mappa.** data-lab usa Leaflet per mostrare i layer e OpenLayers per esportare le mappe delle simulazioni. GreenManager deve anche disegnare e modificare punti, linee e poligoni in campo. Alternative: Leaflet con un plugin di disegno, OpenLayers, MapLibre. Il disegno deve gestire anche linee e poligoni multiparte (D-035). → rinviata a T2, da chiudere nella prima fetta verticale (D-040)
3. **Mappa pubblica.** Rotte pubbliche nella stessa SPA, senza `AuthLayout`, o un'app separata e più leggera? → rinviata a T2
4. **Storico di dominio nell'interfaccia.** `ChangeRecord` ha motivazione, organizzazione e origine di ogni modifica, e il committente consulta le modifiche di un periodo (CE-4, TR-6). Serve un endpoint con i filtri (committente, periodo, entità, record) e una pagina, o una scheda nei dettagli accanto allo storico tecnico? → rinviata oltre la prima fetta (D-053)
5. **Committente disattivato e dati nuovi.** Il form dei dati nuovi propone solo i committenti attivi (`ClientSelect` con `activeOnly`), ma il server accetta zone, aree ed elementi anche per un committente disattivato. Il server deve rifiutarli, per esempio con `client_not_available`, o un committente disattivato deve poter ricevere dati, per esempio da un import? → da decidere con la PR3c
