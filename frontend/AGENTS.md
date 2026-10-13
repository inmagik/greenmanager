# AGENTS.md — frontend

Istruzioni per gli agenti che lavorano sulla SPA React di GreenManager. Contesto, dominio e decisioni sono nell'[AGENTS.md](../AGENTS.md) della radice e in [designdocs/](../designdocs/README.md).

## Riferimenti

- **Architettura del frontend**: [designdocs/architettura/frontend.md](../designdocs/architettura/frontend.md). Ci sono struttura, provider, moduli, data fetching, pattern UI, i18n, strumenti e versioni.
- **Pattern per sezione** (mappa, disegno, uso in campo, liste, dettaglio e form; mappa pubblica rinviata): passo T2, [designdocs/architettura/frontend-pattern.md](../designdocs/architettura/frontend-pattern.md).
- **API**: lo schema OpenAPI del server è su `http://localhost:8000/api/schema/swagger-ui/`.
- **Origine del codice**: lo scaffold viene da `admin/` di [inmagik/data-lab](https://github.com/inmagik/data-lab), con le versioni e alcuni componenti di [inmagik/bottaro-pesatura](https://github.com/inmagik/bottaro-pesatura) (D-036, D-038).

## Comandi

Node 22 e yarn 1. I comandi partono da `frontend/`, con il server attivo su `localhost:8000` (vedi [server/AGENTS.md](../server/AGENTS.md)).

```bash
yarn install
yarn dev        # http://localhost:5173, con proxy di /api verso localhost:8000
yarn lint       # ESLint
yarn build      # tsc -b e vite build
yarn test       # vitest, le funzioni pure (es. components/Map/draw/multipart.ts)
```

Prima di ogni commit `yarn lint`, `yarn build` e `yarn test` devono passare.

## Struttura

```
frontend/src/
├── App.tsx, Navigation.tsx   provider e router
├── auth/, context/, general/ autenticazione, organizzazione corrente, dati e tema
├── components/               componenti condivisi (Table, Page, Header, AsyncSelect…)
├── hooks/                    useHasPermission, useTenant, useUrlParams
├── i18n/it/                  traduzioni, un file per modulo
├── pages/                    accesso, password, profilo, home
└── modules/<modulo>/         api/, components/, hooks/, pages/, menu.tsx, navigation.tsx,
                              permissions.ts, types.ts
```

Un modulo nuovo compare nel menu e nelle rotte senza toccare file centrali: i plugin di Vite leggono `menu.tsx` e `navigation.tsx` di ogni cartella in `src/modules/`.

## Regole

- **Lingua** (D-001):
  - identificatori in inglese;
  - i testi visibili stanno nelle traduzioni di `src/i18n/it/`, mai nel codice;
  - nell'MVP l'interfaccia è solo in italiano.
- **Moduli di dominio**: seguono i pattern di §4–§5 di `frontend.md`; elenco e parti comuni sono in §9.
  - Dai moduli dei progetti di riferimento (`datasets`, `anagrafica`) si prendono i pattern, mai il codice.
  - Un modulo ha lo stesso nome dell'app Django corrispondente.
- **Data fetching**: hook di `@inmagik/react-crud` in `api/<risorsa>.ts`. Gli header `Authorization` e `X-Tenant-ID` li aggiunge `DataProvider`.
- **Permessi**:
  - i codici in `permissions.ts` sono quelli dei `fm_permissions.py` del server;
  - una voce di menu dichiara il suo `permission`, e la `DoubleNavbar` la mostra solo a chi lo ha;
  - le azioni di scrittura stanno in `CheckPermission`;
  - il controllo vero è sempre quello del server.
- **Errori del server**: si traducono con `translateApiError` e le chiavi `serverErrors.<code>`. Il file di traduzioni di un modulo ha i suoi codici sotto `serverErrors`, da aggiungere all'unione in `src/i18n/it/index.ts`.
- **Mappa** (D-057, D-058): MapLibre e terra-draw si caricano solo nei chunk lazy. Da qualsiasi pagina si importano `@/components/Map` (che non carica MapLibre: `MiniMap` e `GeometryEditor` sono lazy) e `mapLink` di `modules/map/links.ts`; `MapView`, i layer, i controlli e il disegno (`components/Map/draw/`) si importano dal loro file, solo nel codice della pagina `/map`, di `MiniMap` e di `GeometryEditor`. Dopo `yarn build`, `index-*.js` non deve contenere né MapLibre né terra-draw (§1.2 di `frontend-pattern.md`).
- **Geometrie** (D-058): linee e poligoni multiparte si modificano sulla mappa una parte alla volta (`splitParts` e `mergeParts`); le parti con buchi restano come sono. Una geometria nuova si controlla con `geometry-check/` e si salva con la revisione, dalla mappa come dal file (§2 di `frontend-pattern.md`).
- **Uso in campo** (D-058): ogni pagina si usa anche da smartphone (`ScreenWidthGuard` lascia passare tutto); `DataProvider` manda `X-Change-Source: field` dai dispositivi con lo schermo tattile (§3 di `frontend-pattern.md`).
- **Revisione**: i form di modifica dei dati di dominio mandano la `revision` letta; un `409 revision_conflict` mostra `RevisionConflictAlert`, e il form, con la revisione come `key`, riparte dal record ricaricato (§9.2 di `frontend.md`).
- **Stile**: Prettier senza punto e virgola, virgolette doppie, riga di 120 caratteri. Import con l'alias `@/` fuori dal modulo, relativi dentro il modulo.
- **Componenti condivisi** (`components/`, `auth/`, `general/`, moduli `users` e `tenants`): vengono dai progetti di riferimento. Si modificano solo se serve, e ogni differenza va annotata in `frontend.md`.
- Non eseguire `build_image.sh`: pubblica l'immagine sul registry.
