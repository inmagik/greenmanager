# Pattern dell'interfaccia

> **Stato**: completato con la prima fetta verticale, in attesa della revisione · **Passo**: T2 del binario tecnico · Metodologia in [README.md](../README.md)

- **Obiettivo**: fissare i pattern delle sezioni dell'interfaccia che [frontend.md](frontend.md) lascia a T2: mappa, disegno delle geometrie, uso in campo, mappa pubblica, e liste, dettaglio e form come li usano i moduli di dominio.
- **Input**: i moduli della prima fetta verticale (§9 di [frontend.md](frontend.md)), le API di §8 di [backend.md](backend.md), le decisioni D-053–D-058.
- **Parti**:
  - §1, mappa, layer e sfondi: PR4a (D-057);
  - §2, disegno e multiparte, e §3, uso in campo: PR4b (D-058);
  - §4, mappa pubblica: rinviata oltre la fetta;
  - §5, liste, dettaglio e form: i pattern dei moduli della fetta (D-053–D-056).

## 1. Mappa

Vedi D-057. La mappa usa MapLibre GL JS 6 con un wrapper nostro, in `src/components/Map/`. Il modulo `map` ne fa la pagina `/map`; i dettagli di aree ed elementi ne usano la versione piccola (`MiniMap`).

### 1.1 Componenti

| File | Cosa fa |
|---|---|
| `maplibre.ts` | l'unico modulo che importa `maplibre-gl`: CSS, indirizzo del worker (`setWorkerUrl`), classi usate dagli altri file |
| `MapView.tsx` | la mappa: sfondi, zoom, attribuzioni, scala; in 2D, senza rotazione né inclinazione. Vista iniziale, sfondo iniziale e nome accessibile si leggono una volta; `onViewChange` alla fine di ogni spostamento. I figli si montano a mappa caricata, con la mappa in `MapContext`. Quando la larghezza cambia resta fermo il bordo ovest, non il centro: un pannello che si apre a destra non sposta ciò che la mappa mostra. `compact` fa la mappa piccola delle pagine: zoom con Ctrl (⌘ su Mac) e la rotellina, due dita su smartphone, senza scala. I testi dei controlli di MapLibre sono tradotti (`mapView.controls`). Il contenitore isola i livelli dei suoi figli (`isolation: isolate`): i controlli di MapLibre non passano sopra il piede di un form che scorre sopra la mappa |
| `MapContext.ts` | `useMap()`, la mappa nei figli di `MapView` |
| `slots.ts` | i livelli dei layer (§1.3) |
| `useGeoJSONLayer.ts` | una sorgente GeoJSON con i suoi layer, in un livello |
| `useMapBbox.ts` | box e zoom della parte visibile, per il `bbox` delle action `geojson/` (§1.4) |
| `useFeatureClick.ts` | il clic o il tocco su una feature, con una tolleranza di 8 pixel e una priorità tra i layer; sospeso mentre si disegna |
| `useFitBounds.ts` | inquadra una geometria quando cambia |
| `basemaps.ts`, `BasemapSwitcher.tsx` | gli sfondi e la loro scelta (§1.5) |
| `useGeolocation.ts`, `LocateControl.tsx` | la posizione dell'utente (§1.7) |
| `MiniMap.tsx`, `LazyMiniMap.tsx` | la mappa piccola dei dettagli (§1.8) |
| `GeometryEditor.tsx`, `LazyGeometryEditor.tsx` | l'editor di una geometria nelle pagine (§2.4) |
| `draw/useTerraDraw.ts` | terra-draw sulla mappa: modalità, stili, annullamento (§2.1) |
| `draw/multipart.ts` | `splitParts` e `mergeParts`, le parti delle geometrie multiparte (§2.2) |
| `draw/GeometryDraw.tsx`, `draw/DrawToolbar.tsx` | le parti di una linea o di un poligono sulla mappa, e i loro pulsanti fuori dalla mappa (§2.3) |
| `draw/PointPicker.tsx` | un punto, con il tocco o il mirino (§2.3) |
| `useGeoJSON.ts` | la query di una action `geojson/` (§1.4) |
| `bbox.ts`, `circle.ts` | funzioni pure: box di una geometria, griglia del `bbox`, cerchio in metri |

### 1.2 Caricamento lazy

MapLibre pesa circa 1 MB, 280 kB compressi, e non serve a chi lavora sulle liste. Regole:
- `@/components/Map` (`index.ts`) esporta solo ciò che non carica MapLibre: `MiniMap` e `GeometryEditor`, che sono le versioni lazy, `useGeoJSON`, le funzioni di `bbox.ts`, i tipi. Lo può importare qualsiasi pagina;
- `MapView`, i layer, i controlli e il disegno (`draw/`) si importano dal loro file, e solo dal codice caricato in modo lazy: la pagina della mappa (`modules/map/pages/MapPage.tsx`, caricata da `LazyMapPage`), `MiniMap.tsx` e `GeometryEditor.tsx`. `DrawToolbar` non carica né MapLibre né terra-draw: ne importa solo i tipi;
- i moduli che portano alla mappa importano solo `modules/map/links.ts` (`mapLink`);
- `vite.config.ts` mette MapLibre e terra-draw in chunk propri, `maplibre` e `terra-draw` (170 kB, 37 kB compressi). Dopo `yarn build`, `index-*.js` non deve contenere né l'uno né l'altro, e deve caricare `MapPage-*.js`, `MiniMap-*.js` e `GeometryEditor-*.js` solo con `import()`.

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
  | `selection` | la feature scelta, e la posizione di un elemento nuovo mentre se ne compila il form |
  | `drawing` | la geometria che si disegna o si modifica: i layer di terra-draw, le parti bloccate, il punto (§2) |
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
  - nginx risolve il nome del servizio a ogni richiesta, con il DNS del container (`resolver`): con un nome scritto nel `proxy_pass`, senza DNS all'avvio non partirebbe nemmeno il resto dell'applicazione. Resta un caso: un container il cui `/etc/resolv.conf` non ha nessun `nameserver` non parte (`no name servers defined`). Docker scrive sempre i DNS nel container, anche senza rete.
- OpenStreetMap chiede di non usare le sue tile per un traffico importante: in produzione serve un fornitore di tile, o tile proprie (domanda 1).

### 1.6 Pagina della mappa: `map`

- **Rotta** `/map`, lazy (`LazyMapPage`). Si apre a chi legge le aree o gli elementi, e mostra i layer che l'utente legge. La voce di menu *Mappa* è la prima.
- **Pannello dei livelli**, in alto a sinistra sopra la mappa, chiuso all'apertura su smartphone:
  - il committente, lo stesso filtro delle liste (`useClientFilter`, D-053); sceglierlo inquadra le sue aree;
  - aree ed elementi, con lo stato del layer: in caricamento, da avvicinare, troncato, in errore. Sotto gli elementi la legenda delle categorie;
  - lo sfondo.
- **Clic**: la feature sotto il dito, con la priorità punti, linee e poligoni degli elementi, poi aree. Un clic dove non c'è nulla chiude il pannello della feature. Sui layer il puntatore è una mano.
- **Pannello della feature**: titolo, segni (rimosso, provvisoria, fittizia), avvisi del record, dati principali; *Apri la scheda* e *Inquadra*. Legge il dettaglio del record. Il contenitore (`MapSidePanel`) è lo stesso del nuovo elemento (§2.5).
  - Su smartphone è un drawer dal basso, alto il 45% dello schermo, senza sfondo scuro: la mappa sopra resta usabile. La feature toccata va al centro della parte della mappa sopra il drawer, e *Inquadra* ne tiene conto.
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

  Gli spostamenti sostituiscono la voce della cronologia; la scelta di una feature ne aggiunge una, e *indietro* torna alla precedente. Ogni cambio parte dall'URL di quel momento, non dai parametri dell'ultimo render: uno spostamento che segue subito una scelta, come quando il pannello si chiude e la mappa si allarga, la conserva.
- **Nuovo elemento**: il pulsante dell'intestazione, per chi scrive gli elementi, apre il flusso di §2.5.
- **Vista all'apertura**: quella dell'URL; altrimenti la mappa inquadra, senza animazione, la feature scelta o, con un committente, le sue aree; altrimenti l'Italia. *Inquadra* e la scelta del committente inquadrano con l'animazione.

### 1.7 Posizione dell'utente

- `useGeolocation(enabled)` segue la posizione del dispositivo (`watchPosition`), con la precisione dichiarata. Gli errori sono quelli di `useCurrentPosition` (§9.2 di [frontend.md](frontend.md)), tradotti con `geolocation.errors`. Il browser dà la posizione solo in HTTPS o su localhost.
- `LocateControl`, sotto lo zoom: accende e spegne la posizione. La prima posizione centra la mappa, almeno allo zoom 17; le successive spostano solo il punto, con il cerchio della precisione. Un errore arriva in una notifica, e il pulsante diventa rosso.

### 1.8 Mini mappa e "Vedi sulla mappa"

- `MiniMap` (`LazyMiniMap`): una mappa piccola, `compact`, con le geometrie di un record. Una geometria `proposed` è tratteggiata, in arancio: la scheda Geometria dell'area e la scheda Posizione dell'elemento la usano per la geometria nuova, prima del salvataggio. Si inquadra sulle geometrie quando cambiano.
- *Vedi sulla mappa*, nell'intestazione dei dettagli di aree ed elementi: `mapLink` apre `/map` con il committente e il record, che la mappa sceglie e inquadra.

## 2. Disegno e multiparte

Vedi D-058. Linee e poligoni si disegnano e si modificano con terra-draw; un punto si posa senza.

### 2.1 terra-draw

- `useTerraDraw(kind, onReady)`, in un figlio di `MapView`, crea l'istanza con l'adapter per MapLibre e la ferma con il componente, se la mappa c'è ancora. Ha due modalità:
  - `linestring` o `polygon`, che disegna una parte nuova;
  - `select`, in cui si sceglie una parte e se ne modificano i vertici.
- L'annullamento è quello di terra-draw, di sessione (le parti finite) e di modalità (i vertici della parte in corso).
- I layer di terra-draw stanno nel livello `drawing` (§1.3). Le coordinate hanno 9 decimali, circa un decimo di millimetro.
- `onReady`, letto una volta, carica le parti e registra gli eventi: le chiamate di `setState` arrivano dagli eventi di terra-draw, non dal corpo di un effetto. Anche il tipo di geometria si legge una volta: un disegno di un altro tipo è un altro componente, con la sua `key`.
- **Spike** all'inizio della PR4b (ottobre 2026, terra-draw 1.37, adapter 1.5, MapLibre 6.14):

  | Punto | Esito |
  |---|---|
  | geometrie multiparte | non ci sono: lo store ha solo `Point`, `LineString` e `Polygon`. Ogni parte è una feature (§2.2) |
  | poligoni con buchi | la validazione dei poligoni li rifiuta (`Feature has holes`): le parti con buchi restano bloccate e si conservano |
  | adapter con MapLibre 6 | funziona; l'adapter dichiara `maplibre-gl` dalla versione 4. MapLibre resta alla 6 |
  | trascinamento dei vertici sul telefono | provato in Chromium con il tocco emulato (eventi touch, contesto mobile): scelta di una parte, trascinamento di un vertice senza spostare la mappa, parte nuova, eliminazione, annullamento. Sui dispositivi veri resta da provare (domanda 4) |

### 2.2 Parti: `multipart.ts`

- `splitParts(geometry, kind, precision)` divide una geometria, semplice o multiparte, nelle sue parti:
  - le parti modificabili, con le coordinate arrotondate alla precisione di terra-draw e senza la quota;
  - le parti bloccate, cioè i poligoni con buchi. Anche una parte che terra-draw rifiuta per altri motivi resta bloccata;
  - le coordinate di partenza di ogni parte, per la chiave delle sue coordinate arrotondate (`partKey`).
- `mergeParts(kind, parts, { originals, locked })` riunisce le parti nella geometria da salvare: un punto, o una linea o un poligono sempre multiparte, come li salva il server.
  - Una parte non toccata riprende le coordinate di partenza: l'arrotondamento non diventa una modifica.
  - Le parti bloccate seguono quelle modificabili, come erano.
  - Senza parti la geometria è `null`.
- `partsOverlap(parts)` dice se due poligoni fra le parti si sovrappongono: il server rifiuta un poligono multiparte così (`geometry_invalid`). Due parti che si toccano in un vertice non si sovrappongono. Il controllo è sul piano delle coordinate e guida il disegno; quello vero resta del server, che rifiuta anche due parti con un lato in comune, che a mano non si disegnano.
- I test (`multipart.test.ts`) coprono la divisione, i buchi, la precisione, le coordinate riprese, il giro completo e la sovrapposizione delle parti.

### 2.3 Modifica sulla mappa

- **Linee e poligoni** (`GeometryDraw`): ogni parte è una feature di terra-draw.
  - Toccare una parte la sceglie e ne mostra i vertici: si trascinano, e trascinando il punto a metà di un lato se ne aggiunge uno. Su un computer il clic destro toglie un vertice. Esc toglie la scelta.
  - Una parte non si sposta intera: con un dito succederebbe per errore. Un poligono non può incrociarsi, né disegnandolo né spostandone i vertici: il server lo rifiuterebbe (`geometry_invalid`).
  - Due poligoni che si sovrappongono il server li rifiuta allo stesso modo. terra-draw controlla ogni parte da sola: la sovrapposizione la segnala un testo sopra i pulsanti (`partsOverlap`), finché si spostano i vertici o si elimina una parte. Nel nuovo elemento dalla mappa (§2.5) il passo della posizione non va avanti.
  - Le parti bloccate sono grigie e tratteggiate; un testo dice che si cambiano solo da file.
  - Senza parti, la mappa parte disegnando la prima.
- **Pulsanti** (`DrawToolbar`), fuori dalla mappa, con un testo su cosa fare: *Aggiungi parte*, *Elimina parte* (della parte scelta), *Fine parte* e *Annulla la parte* mentre se ne disegna una, *Annulla l'ultima modifica*. *Fine parte* chiude la parte come il tasto Invio, e si attiva quando la parte ha i vertici che servono: due per una linea, tre per un poligono. Un poligono si chiude anche toccando il primo vertice. Il testo è annunciato agli screen reader (`aria-live`).
- **Comunicazione con la pagina**: `GeometryDraw` dà la geometria riunita alla fine di ogni modifica, non all'apertura: la geometria salvata non è una modifica. La fine di una modifica è l'evento `finish` di terra-draw (una parte finita, un vertice spostato, aggiunto o tolto), più l'eliminazione di una parte e l'annullamento. I controlli (`DrawControls`) vanno alla pagina, che li mostra dove vuole; tornano `null` quando il disegno finisce.
- **Stile**: la geometria nuova è arancio, come quella proposta nella mini mappa (§1.8), più scura quando è scelta. I vertici sono più grandi di quelli predefiniti, perché si toccano con un dito.
- **Punto** (`PointPicker`): un tocco sulla mappa posa il punto dove è il dito. Il mirino, una croce al centro della parte visibile della mappa, è più preciso: si sposta la mappa e il punto si posa sotto il mirino (`placeAtCrosshair`). Su un telefono il centro è quello della parte sopra il drawer. `show` porta la mappa su un punto dato da fuori, come la posizione del dispositivo.

### 2.4 Editor nelle pagine: `GeometryEditor`

- `GeometryEditor` (`LazyGeometryEditor`, esportato da `@/components/Map`): i pulsanti, poi una mappa di 420 pixel, non `compact`, perché un dito deve poter spostare la mappa e i vertici. Sopra la mappa: la posizione dell'utente (§1.7) e lo sfondo, in una tendina.
- Prende il tipo di geometria, la geometria da modificare e le geometrie di riferimento (`context`), verdi sotto quella nuova: la geometria salvata, l'area di un elemento nuovo, le altre aree del committente. La mappa le inquadra, anche quando arrivano dopo.
- Dove si usa, sempre accanto al file o alle coordinate, con `geometry-check/` e il salvataggio con la revisione come prima:

  | Pagina | Modalità | Riferimento |
  |---|---|---|
  | area, scheda *Geometria* (*Modifica il perimetro*) | sulla mappa, le parti salvate; da file | il perimetro salvato |
  | area nuova, form | sulla mappa; da file | le aree del committente |
  | elemento, scheda *Posizione* | punto: coordinate, sulla mappa, centro dell'area; linee e poligoni: sulla mappa, le parti salvate, o da file | la posizione salvata |
  | elemento nuovo, form | come la scheda *Posizione* | l'area scelta, per chi legge le aree |

- Sulla mappa la mini mappa non c'è: l'editor mostra già la geometria salvata. Finché la geometria non cambia, *Salva* resta disattivato; una geometria senza parti non si salva, e il testo lo dice.

### 2.5 Nuovo elemento dalla mappa

- *Nuovo elemento*, nell'intestazione della pagina `/map`, apre il pannello del nuovo elemento (`CreateElementPanel`) al posto di quello della feature, in tre passi:
  1. **classe**: dice se si posa un punto, una linea o un poligono;
  2. **posizione**, sulla mappa:
     - un punto: la posizione del dispositivo (*Usa la mia posizione*, con la precisione), il mirino o un tocco. Il testo dice quale punto è posato;
     - linee e poligoni: il disegno di §2.3, con i pulsanti nel pannello;
  3. **dati**: il form dell'elemento (`ElementForm`, con `mapPosition` e il layout `panel`, a una colonna). La posizione vi compare come testo, con *Cambia posizione*, che torna al passo 2, e con il controllo: misure, area proposta, avvisi. Il committente è quello del filtro della mappa, se è attivo.
- **Stato**: il flusso (`createElement.ts`) tiene la classe, la posizione e il passo. Il form, una volta aperto, resta montato mentre la posizione cambia, e i valori scritti restano. Una classe di un altro tipo di geometria toglie la posizione e il form; una dello stesso tipo li lascia, e il form la segue. Una classe scelta nel form torna al passo della classe.
- **Mappa durante il flusso**: un tocco non sceglie le feature. Al passo 3 la posizione posata si vede come una feature scelta. Dopo il salvataggio la mappa sceglie l'elemento nuovo, e una notifica dice degli alberi vicini.
- **Su un telefono** il pannello è il drawer di §1.6: alto il 45% dello schermo al passo della posizione, che usa la mappa, e l'85% ai passi della classe e dei dati.
  - La tendina delle classi si apre dentro il drawer (`withinPortal: false`), non in un portale. In un portale, posizionata prima di conoscere la propria larghezza, finiva oltre il bordo destro: Chrome sul telefono allargava la pagina, la tendina si nascondeva, e il ciclo si ripeteva a ogni frame.
- **Uscita**: chiudere il pannello con una posizione già posata chiede conferma, e così lasciare la pagina (`BlockNavigation`).

## 3. Uso in campo

Vedi D-014 e D-058. Nell'MVP l'uso in campo è online.

- **Schermi piccoli**: ogni pagina si usa anche da smartphone. `ScreenWidthGuard` resta senza limiti. Su uno schermo stretto:
  - l'`AppShell` ha l'intestazione con il menu a scomparsa;
  - le liste tengono le colonne principali e il menu delle azioni (§9 di [frontend.md](frontend.md));
  - i pannelli della mappa sono drawer dal basso (§1.6, §2.5).
- **Tocco**: i clic sulla mappa hanno una tolleranza di 8 pixel (§1.1); i vertici sono più grandi; i comandi del disegno sono pulsanti, non gesti né tasti (§2.3).
- **Posizione del dispositivo**: una lettura nei form (`useCurrentPosition`), o seguita sulla mappa (`useGeolocation`, §1.7), sempre con la precisione dichiarata. Il browser la dà solo in HTTPS o su localhost.
- **Origine delle modifiche**: `DataProvider` manda a ogni richiesta `X-Change-Source`, che il server scrive in `ChangeRecord` (D-043):
  - `field` quando il puntatore principale è uno schermo tattile (`pointer: coarse`): smartphone e tablet;
  - `web` negli altri casi, compreso un computer con la finestra stretta.
- **Prova da smartphone**: serve HTTPS, per la posizione. Si usa un tunnel HTTPS verso il server di sviluppo, con il suo host tra gli `allowedHosts` di Vite, o un ambiente di prova in HTTPS.
- **Fotocamera**: arriva con le foto delle osservazioni, dopo la fetta.
- **Offline**: in v2 (D-014). Il modello lo prevede già: UUID, revisione, origine delle modifiche.

## 4. Mappa pubblica

Rinviata oltre la prima fetta (domanda 3 di [frontend.md](frontend.md)). Da decidere:
- la forma: rotte pubbliche nella stessa SPA, fuori da `AuthLayout`, o un'app separata e più leggera;
- un endpoint pubblico in sola lettura, che rispetti `public_excluded` di aree ed elementi.

I componenti di §1 (`MapView`, layer, sfondi, `geojson/` con il `bbox`) valgono anche per la mappa pubblica.

## 5. Liste, dettaglio e form

I pattern di base sono in §5 di [frontend.md](frontend.md); le parti comuni dei moduli di dominio in §9.2. Qui, come li usano i moduli della fetta (D-053–D-056).

- **Liste**:
  - l'intestazione ha il titolo e l'azione di creazione, in `CheckPermission`;
  - sotto, i filtri principali sempre visibili (committente, ricerca, stato) e gli altri nel pannello *Filtri*, che dice quanti sono attivi;
  - filtri, ordinamento e pagina stanno nell'URL. Il committente è un filtro unico per zone, aree ed elementi (`useClientFilter`, §9.3 di [frontend.md](frontend.md));
  - la tabella ha un messaggio diverso per la lista vuota e per i filtri senza risultati. Su smartphone restano le colonne principali e le azioni;
  - la selezione multipla c'è solo dove il server ha un'azione su più record.
- **Dettaglio** (`/<risorsa>/:id/:tab`):
  - l'intestazione ha i segni del record, il riepilogo dell'ultima modifica, *Vedi sulla mappa*, *Storico*, il pulsante che modifica la scheda aperta e il menu delle azioni;
  - gli avvisi del record stanno sopra le schede;
  - la scheda dei dati è il form in sola lettura; la geometria o la posizione hanno una scheda propria, con l'editor di §2.4;
  - durante la modifica il menu delle azioni è nascosto, e lasciare la pagina o la scheda chiede conferma.
- **Form**:
  - un form per entità, con un layout per la modale, la pagina e il pannello della mappa;
  - sezioni con un titolo, e campi guidati dai dati, come la classe per gli elementi;
  - le voci dei cataloghi si scelgono con i selettori di §9.6 di [frontend.md](frontend.md); un valore salvato non più disponibile resta, con una nota;
  - la geometria si controlla con `geometry-check/` prima del salvataggio;
  - la modifica manda la revisione letta, e un conflitto mostra *Ricarica*;
  - gli errori del server vanno sui campi, tradotti con `serverErrors`.
- **Azioni**:
  - le modali di modifica, rimozione e ripristino leggono il record all'apertura;
  - le azioni di un solo campo non mandano la revisione;
  - gli errori fuori dai form arrivano in una notifica.

## Domande aperte

1. **Sfondi in produzione.** OpenStreetMap non regge un traffico importante, e il PCN è lento, solo in HTTP e a volte in errore. Quali sfondi per le installazioni: un fornitore di tile, tile proprie, le ortofoto regionali dei committenti? Un WMS si usa solo con CORS e HTTPS, o dietro il proxy dell'applicazione come il PCN (§1.5). Si sceglie per installazione con `VITE_BASEMAPS`, o serve uno sfondo per committente, nei dati? → da decidere con il deploy
2. **Etichette sulla mappa.** Codici e nomi sulla mappa vogliono i glifi dei caratteri, cioè un servizio di font per MapLibre. Servono, o bastano il pannello della feature e la legenda? → da decidere alla revisione della fetta
3. **Elementi rimossi sulla mappa.** La mappa mostra i presenti. Serve il filtro della presenza della lista, per esempio per vedere i presenti a una data o i rimossi di un periodo? → da decidere alla revisione della fetta
4. **Disegno sui dispositivi veri.** Lo spike ha provato il tocco in Chromium, emulato. Il trascinamento dei vertici e delle parti, il mirino e la posizione del dispositivo funzionano su Safari per iOS e su Chrome per Android, in HTTPS? → da provare alla revisione della fetta, con la prova di §7 di [fetta-1.md](fetta-1.md)
5. **Vertici da togliere con il dito.** Un vertice si toglie con il clic destro, che su un telefono non c'è; restano l'annullamento e il ridisegno della parte. Serve un pulsante, o il tocco lungo? → da decidere alla revisione della fetta
6. **Parti con buchi.** Si cambiano solo da file. Servono sulla mappa, con un'altra libreria o un'estensione di terra-draw, o sono abbastanza rare? → da decidere alla revisione della fetta
7. **Aggancio e percorsi.** terra-draw aggancia i vertici a quelli di altre geometrie, e una linea si potrebbe tracciare camminando, con la posizione del dispositivo. Servono, per esempio per una siepe lungo il bordo di un'area o per un filare? → dopo la fetta, con l'uso in campo (TR-4)
8. **Liste in campo.** Su smartphone le liste restano tabelle con le colonne principali (§5). In campo si cerca un elemento dalla lista, per codice o specie, o dalla mappa? Serve una lista a schede, o basta la mappa? Le domande su dettaglio e form sono la 6 e la 7 di [frontend.md](frontend.md). → da decidere alla revisione della fetta, con la prova da smartphone
