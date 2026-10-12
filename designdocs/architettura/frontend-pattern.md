# Pattern dell'interfaccia

> **Stato**: in corso, prima parte con la PR4a della prima fetta verticale · **Passo**: T2 del binario tecnico · Metodologia in [README.md](../README.md)

- **Obiettivo**: fissare i pattern delle sezioni dell'interfaccia che [frontend.md](frontend.md) lascia a T2: mappa, disegno delle geometrie, uso in campo, mappa pubblica.
- **Input**: i moduli della prima fetta verticale (§9 di [frontend.md](frontend.md)), le API di §8 di [backend.md](backend.md), le decisioni D-057 e seguenti.
- **Stato delle parti**:
  - §1, mappa, layer e sfondi: con la PR4a (D-057);
  - disegno e multiparte, uso in campo, mappa pubblica rinviata: con la PR4b, che completa il documento.

## 1. Mappa

Vedi D-057. La mappa usa MapLibre GL JS 6 con un wrapper nostro, in `src/components/Map/`. Il modulo `map` ne fa la pagina `/map`; i dettagli di aree ed elementi ne usano la versione piccola (`MiniMap`).

### 1.1 Componenti

| File | Cosa fa |
|---|---|
| `maplibre.ts` | l'unico modulo che importa `maplibre-gl`: CSS, indirizzo del worker (`setWorkerUrl`), classi usate dagli altri file |
| `MapView.tsx` | la mappa: sfondi, zoom, attribuzioni, scala; in 2D, senza rotazione né inclinazione. Vista iniziale, sfondo iniziale e nome accessibile si leggono una volta; `onViewChange` alla fine di ogni spostamento. I figli si montano a mappa caricata, con la mappa in `MapContext`. Quando la larghezza cambia resta fermo il bordo ovest, non il centro: un pannello che si apre a destra non sposta ciò che la mappa mostra. `compact` fa la mappa piccola delle pagine: zoom con Ctrl (⌘ su Mac) e la rotellina, due dita su smartphone, senza scala. I testi dei controlli di MapLibre sono tradotti (`mapView.controls`) |
| `MapContext.ts` | `useMap()`, la mappa nei figli di `MapView` |
| `slots.ts` | i livelli dei layer (§1.3) |
| `useGeoJSONLayer.ts` | una sorgente GeoJSON con i suoi layer, in un livello |
| `useMapBbox.ts` | box e zoom della parte visibile, per il `bbox` delle action `geojson/` (§1.4) |
| `useFeatureClick.ts` | il clic o il tocco su una feature, con una tolleranza di 8 pixel e una priorità tra i layer |
| `useFitBounds.ts` | inquadra una geometria quando cambia |
| `basemaps.ts`, `BasemapSwitcher.tsx` | gli sfondi e la loro scelta (§1.5) |
| `useGeolocation.ts`, `LocateControl.tsx` | la posizione dell'utente (§1.7) |
| `MiniMap.tsx`, `LazyMiniMap.tsx` | la mappa piccola dei dettagli (§1.8) |
| `useGeoJSON.ts` | la query di una action `geojson/` (§1.4) |
| `bbox.ts`, `circle.ts` | funzioni pure: box di una geometria, griglia del `bbox`, cerchio in metri |

### 1.2 Caricamento lazy

MapLibre pesa circa 1 MB, 280 kB compressi, e non serve a chi lavora sulle liste. Regole:
- `@/components/Map` (`index.ts`) esporta solo ciò che non carica MapLibre: `MiniMap`, che è la versione lazy, `useGeoJSON`, le funzioni di `bbox.ts`, i tipi. Lo può importare qualsiasi pagina;
- `MapView`, i layer e i controlli si importano dal loro file, e solo dal codice caricato in modo lazy: la pagina della mappa (`modules/map/pages/MapPage.tsx`, caricata da `LazyMapPage`) e `MiniMap.tsx`;
- i moduli che portano alla mappa importano solo `modules/map/links.ts` (`mapLink`);
- `vite.config.ts` mette MapLibre in un chunk proprio, `maplibre`. Dopo `yarn build`, `index-*.js` non deve contenere MapLibre, e deve caricare `MapPage-*.js` e `MiniMap-*.js` solo con `import()`.

MapLibre 6 cerca il worker accanto al proprio modulo, che il bundle sposta. `maplibre.ts` importa il worker con `?url`: Vite lo copia tra i file della build (`maplibre-gl-worker-*.mjs`) e `setWorkerUrl` gliene dà l'indirizzo.

### 1.3 Layer e livelli

- Una sorgente GeoJSON per insieme di dati (aree, elementi, feature scelta, posizione dell'utente), con `useGeoJSONLayer(id, { data, layers, slot, visible })`:
  - i layer si aggiungono una volta, con lo stile fisso; poi i dati cambiano con `setData` e la visibilità con il layout. Un layer tolto e rimesso andrebbe in cima al suo livello;
  - l'`id` delle feature è anche una proprietà (`promoteId`): MapLibre scarta gli id che non sono numeri, e gli id del dominio sono UUID;
  - l'id di un layer nella mappa è `<sorgente>:<layer>` (`layerId`).
- **Livelli**: lo stile ha un layer vuoto alla fine di ogni livello, e un layer si aggiunge prima di quello del suo livello. L'ordine, dal basso, non dipende da quando i componenti si montano:

  | Livello | Contenuto |
  |---|---|
  | sfondi | i layer raster degli sfondi, nello stile |
  | `surfaces` | i poligoni grandi, sotto il resto: le aree |
  | `features` | gli elementi |
  | `selection` | la feature scelta |
  | `position` | la posizione dell'utente |

- **Stile** (`modules/map/layers.ts`):
  - aree: riempimento verde acqua quasi trasparente, bordo che si allarga con lo zoom;
  - elementi: colore per categoria della classe (`category`, dalle proprietà di `geojson/`): vegetazione verde, arredi arancio, giochi viola, impianti ciano, altro grigio. Poligoni riempiti e bordati, linee spesse, punti come cerchi che crescono con lo zoom. Una posizione provvisoria ha il bordo giallo;
  - feature scelta: arancio, sopra tutto, presa dal dettaglio del record, così si vede anche fuori dai layer (un altro committente, un elemento rimosso);
  - la legenda delle categorie sta nel pannello dei livelli.
- Le espressioni di stile usano `["geometry-type"]`, che dà `Point`, `LineString` o `Polygon` anche per le geometrie multiparte.

### 1.4 Dati: `geojson/` e `bbox`

- `useGeoJSON(endpoint, query, enabled)` chiama `<risorsa>/geojson/` con i filtri della lista. La chiave della query parte dall'URL della risorsa: una scrittura aggiorna anche la mappa. Mentre arriva una box nuova restano le feature della precedente; non quelle di altri filtri, come un altro committente, che resterebbero cliccabili.
- Le risorse hanno i loro hook: `useAreasGeoJSON` (`territory`) e `useElementsGeoJSON` (`inventory`).
- **`bbox`**: la parte visibile, allargata a una griglia che dipende dallo zoom (`snapBbox`): il passo è la larghezza di una tile allo zoom intero. I piccoli spostamenti danno la stessa box, e la query non cambia. La box resta nei limiti di WGS84, che il server controlla (`bbox_invalid`).
- **Soglie**:
  - aree dallo zoom 12, elementi dallo zoom 15;
  - con un committente nel filtro, a ogni zoom. Le aree del committente arrivano tutte insieme, senza `bbox`: la mappa le inquadra quando si sceglie il committente;
  - sotto la soglia il pannello dice di avvicinare la mappa o di scegliere un committente.
- **Troncamento**: oltre `GEOJSON_MAX_FEATURES` (10.000) il server dà `truncated: true`, e il pannello dice che non tutti i dati sono nella mappa e di avvicinarla. Per le aree di un committente, che arrivano senza `bbox`, avvicinare non serve, e il pannello lo dice in un altro modo.
- Gli elementi sono i presenti (`removed=false`).

### 1.5 Sfondi e ortofoto

- Uno sfondo è un layer raster da tile (`tiles`, con `{z}/{x}/{y}`) o da un WMS (`wms`), per il quale la mappa chiede un'immagine per tile in EPSG:3857 (`BBOX={bbox-epsg-3857}`).
- Lo stile contiene tutti gli sfondi; ne è visibile uno. `BasemapSwitcher` cambia la visibilità dei layer, mai lo stile: uno stile nuovo toglierebbe i layer aggiunti. MapLibre non scarica le tile dei layer nascosti.
- **Configurazione**: `VITE_BASEMAPS`, letta alla build, è una lista JSON di sfondi. Si controlla ogni campo, con il suo tipo, e gli `id` devono essere unici, perché danno il nome ai layer. Una lista non valida si segnala nella console, e restano gli sfondi predefiniti: un campo sbagliato non rompe la mappa. Esempio, con un'ortofoto regionale:

  ```json
  [
    { "id": "osm", "tiles": ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      "attribution": "© OpenStreetMap", "maxzoom": 19 },
    { "id": "er2020", "label": "Ortofoto AGEA 2020",
      "wms": { "url": "https://servizigis.regione.emilia-romagna.it/wms/agea2020_rgb", "layers": "Agea2020_RGB" },
      "attribution": "© Regione Emilia-Romagna", "maxzoom": 20 }
  ]
  ```

  Campi: `id`; `label`, se manca la traduzione `mapView.basemaps.<id>`; `tiles` o `wms`, non entrambi (`url`, `layers`, `format` con `image/jpeg` predefinito, `version` 1.1.1 o 1.3.0); `attribution`; `maxzoom`, un intero da 0 a 24, oltre il quale la mappa ingrandisce le tile dell'ultimo zoom. Gli indirizzi possono essere relativi all'applicazione, per un servizio dietro il suo proxy.
- **Predefiniti**: OpenStreetMap, per lo sviluppo, e l'ortofoto 2012 del Portale Cartografico Nazionale (PCN).
- **Verifica dei servizi** (ottobre 2026):

  | Servizio | CORS | HTTPS | EPSG:3857 | Note |
  |---|---|---|---|---|
  | PCN, ortofoto 2012 e 2006 | sì (`*`) | no: HTTPS rimanda a HTTP | sì | lento (fino a 3 s per tile) e a volte in errore |
  | Emilia-Romagna, AGEA 2020 | sì | sì | sì | solo il territorio regionale |

  Senza CORS un WMS non si usa: MapLibre disegna le immagini con WebGL, che le vuole dello stesso dominio o con CORS. Un servizio solo in HTTP non si carica da un'applicazione in HTTPS (contenuto misto).
- **Proxy del PCN**: `/wms/pcn` in `vite.config.ts` e in `nginx.conf.template` inoltra a `http://wms.pcn.minambiente.it/ogc`.
  - nginx tiene in cache per 30 giorni le risposte che sono immagini: un WMS dà gli errori in XML con lo stato 200, e non vanno in cache.
  - nginx risolve il nome del servizio a ogni richiesta, con il DNS del container (`resolver`): con un nome scritto nel `proxy_pass`, senza DNS all'avvio non partirebbe nemmeno il resto dell'applicazione.
- OpenStreetMap chiede di non usare le sue tile per un traffico importante: in produzione serve un fornitore di tile, o tile proprie (domanda 1).

### 1.6 Pagina della mappa: `map`

- **Rotta** `/map`, lazy (`LazyMapPage`). Si apre a chi legge le aree o gli elementi, e mostra i layer che l'utente legge. La voce di menu *Mappa* è la prima.
- **Pannello dei livelli**, in alto a sinistra sopra la mappa, chiuso all'apertura su smartphone:
  - il committente, lo stesso filtro delle liste (`useClientFilter`, D-053); sceglierlo inquadra le sue aree;
  - aree ed elementi, con lo stato del layer: in caricamento, da avvicinare, troncato, in errore. Sotto gli elementi la legenda delle categorie;
  - lo sfondo.
- **Clic**: la feature sotto il dito, con la priorità punti, linee e poligoni degli elementi, poi aree. Un clic dove non c'è nulla chiude il pannello della feature. Sui layer il puntatore è una mano.
- **Pannello della feature**: titolo, segni (rimosso, provvisoria, fittizia), avvisi del record, dati principali; *Apri la scheda* e *Inquadra*. Legge il dettaglio del record.
  - Su smartphone è un drawer dal basso, alto il 45% della mappa, senza sfondo scuro: la mappa sopra resta usabile. La feature toccata va al centro della parte sopra il drawer, e *Inquadra* ne tiene conto.
  - Su desktop è una colonna di 360 pixel a destra, accanto alla mappa, che si restringe senza che il pannello ne copra i controlli; ciò che la mappa mostra resta al suo posto.
  - Una feature di un layer che l'utente non legge, per esempio da un link condiviso, non si sceglie.
- **Stato nell'URL** (`useMapUrlState`), così la mappa si ricarica e si condivide:

  | Parametro | Valore |
  |---|---|
  | `view` | `zoom/latitudine/longitudine`, come nei link di OpenStreetMap |
  | `basemap` | id dello sfondo |
  | `layers` | layer visibili, separati da virgole; senza il parametro, tutti |
  | `area`, `element` | id della feature scelta |
  | `client` | committente del filtro (`useClientFilter`) |

  Gli spostamenti sostituiscono la voce della cronologia; la scelta di una feature ne aggiunge una, e *indietro* torna alla precedente.
- **Vista all'apertura**: quella dell'URL; altrimenti la mappa inquadra, senza animazione, la feature scelta o, con un committente, le sue aree; altrimenti l'Italia. *Inquadra* e la scelta del committente inquadrano con l'animazione.

### 1.7 Posizione dell'utente

- `useGeolocation(enabled)` segue la posizione del dispositivo (`watchPosition`), con la precisione dichiarata. Gli errori sono quelli di `useCurrentPosition` (§9.2 di [frontend.md](frontend.md)), tradotti con `geolocation.errors`. Il browser dà la posizione solo in HTTPS o su localhost.
- `LocateControl`, sotto lo zoom: accende e spegne la posizione. La prima posizione centra la mappa, almeno allo zoom 17; le successive spostano solo il punto, con il cerchio della precisione. Un errore arriva in una notifica, e il pulsante diventa rosso.

### 1.8 Mini mappa e "Vedi sulla mappa"

- `MiniMap` (`LazyMiniMap`): una mappa piccola, `compact`, con le geometrie di un record. Una geometria `proposed` è tratteggiata, in arancio: la scheda Geometria dell'area e la scheda Posizione dell'elemento la usano per la geometria nuova, prima del salvataggio. Si inquadra sulle geometrie quando cambiano.
- *Vedi sulla mappa*, nell'intestazione dei dettagli di aree ed elementi: `mapLink` apre `/map` con il committente e il record, che la mappa sceglie e inquadra.

## 2. Da completare con la PR4b

- Disegno con terra-draw, geometrie multiparte, `CreateElementFlow` e `GeometryEditor` (§5 di [fetta-1.md](fetta-1.md)).
- Uso in campo: `X-Change-Source: field`, `ScreenWidthGuard` su smartphone, prova in HTTPS.
- Mappa pubblica, rinviata (domanda 3 di [frontend.md](frontend.md)).
- Liste, dettaglio e form: i pattern di §5 di [frontend.md](frontend.md) come li hanno usati i moduli della fetta.

## Domande aperte

1. **Sfondi in produzione.** OpenStreetMap non regge un traffico importante, e il PCN è lento, solo in HTTP e a volte in errore. Quali sfondi per le installazioni: un fornitore di tile, tile proprie, le ortofoto regionali dei committenti? Si sceglie per installazione con `VITE_BASEMAPS`, o serve uno sfondo per committente, nei dati? → da decidere con il deploy
2. **Etichette sulla mappa.** Codici e nomi sulla mappa vogliono i glifi dei caratteri, cioè un servizio di font per MapLibre. Servono, o bastano il pannello della feature e la legenda? → da decidere alla revisione della fetta
3. **Elementi rimossi sulla mappa.** La mappa mostra i presenti. Serve il filtro della presenza della lista, per esempio per vedere i presenti a una data o i rimossi di un periodo? → da decidere alla revisione della fetta
