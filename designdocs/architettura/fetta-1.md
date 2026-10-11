# Prima fetta verticale: piano e avanzamento

> **Stato**: in corso · **Passo**: T2 e T3 del binario tecnico, con la prima fetta verticale (D-040) · Metodologia in [README.md](../README.md)

Questo documento contiene il piano della prima fetta verticale: la sequenza delle PR, cosa contiene ciascuna e a che punto è. Le scelte tecniche sono registrate nelle decisioni D-041 e seguenti, in [decisioni.md](../decisioni.md), e nei documenti dei componenti: §8 di [backend.md](backend.md) e [frontend.md](frontend.md). Qui si rimanda a quei documenti, senza ripeterli.

## 1. Obiettivo e perimetro

La fetta porta in produzione, dal database alla mappa, il primo pezzo del censimento (D-040):
- cataloghi (`Species`, `ElementClass`);
- committente (`Client`);
- zone e aree;
- elementi su mappa.

Insieme alla fetta si svolgono due passi del binario tecnico:
- **T3**, la corrispondenza tra dominio e componenti, che aggiorna [backend.md](backend.md) e [frontend.md](frontend.md);
- **T2**, i pattern dell'interfaccia, in `frontend-pattern.md`.

**Dentro**:
- le entità di D-040;
- i cataloghi obbligatori dell'area (`UrbanGreenType`, `AreaUse`, `UsageIntensity`) e le cause di rimozione (`RemovalCause`);
- la composizione degli elementi di gruppo (`CompositionItem`, EL-5);
- gli attributi della classe, con la loro validazione (EL-3).

**Fuori**:
- codici CAM e mappa pubblica;
- `Person`, interventi, valutazioni, osservazioni, import, e i campi copia delle osservazioni sugli elementi.

Le chiavi esterne verso queste entità si aggiungono dopo, con le loro app e una migrazione.

**Scelte del responsabile di progetto**:
- mappa con MapLibre GL e terra-draw;
- storico con django-auditlog per il tracciamento tecnico, più `ChangeRecord` scritto dai servizi di dominio;
- consegna in più PR piccole, in sequenza.

## 2. Decisioni della fetta

| Tema | Decisione | Documento |
|---|---|---|
| App di dominio e permessi | D-041 | §8.1 e §8.8 di [backend.md](backend.md) |
| Modelli di base: UUID, tracciamento, revisione | D-042 | §8.2 |
| Storico: django-auditlog e `ChangeRecord` | D-043 | §8.9 |
| Accesso ai dati del patrimonio | D-044 | §8.8 |
| Permessi diretti degli utenti (domanda 4) | D-045 | §3.1 |
| Regole dei cataloghi | D-046 | §8.4 |
| Attributi della classe senza jsonschema | D-047 | §8.4 |
| Dati iniziali dei cataloghi | D-048 | §8.4 |
| Geometrie, misure ed endpoint GeoJSON | D-049 | §8.2 e §8.6 |
| Controlli topologici come avvisi | D-050 | §8.6 |
| Elementi: codice, cartellino, composizione, ciclo di vita | D-051 | §8.7 |
| Controlli spaziali degli elementi | D-052 | §8.7 |
| Committente come filtro, storico e conflitti di revisione nell'interfaccia | D-053 | §9 di [frontend.md](frontend.md) |

I riferimenti delle decisioni del backend sono a [backend.md](backend.md). Le decisioni del frontend arrivano con le PR3 e PR4: il numero si assegna quando si scrivono, e quelli indicati più sotto per le PR4 sono provvisori.

## 3. Sequenza e avanzamento

Aggiornato al 2026-10-11.

| PR | Contenuto | Dipende da | Stato |
|---|---|---|---|
| PR1 | basi, cataloghi, committente (backend) | — | unita, [#8](https://github.com/inmagik/greenmanager/pull/8) |
| PR2a | basi geometriche, zone e aree (backend) | PR1 | unita, [#9](https://github.com/inmagik/greenmanager/pull/9) |
| PR2b | elementi, composizione, ciclo di vita (backend) | PR2a | unita, [#11](https://github.com/inmagik/greenmanager/pull/11) |
| PR2c | controlli spaziali degli elementi (backend) | PR2b | unita, [#12](https://github.com/inmagik/greenmanager/pull/12) |
| PR2d | chiusura del backend: correzioni dalle revisioni (backend) | PR2c | unita, [#22](https://github.com/inmagik/greenmanager/pull/22) |
| PR3a | parti comuni e committenti (frontend) | — | unita, [#23](https://github.com/inmagik/greenmanager/pull/23) |
| PR3b | cataloghi (frontend) | PR3a | da fare, issue [#14](https://github.com/inmagik/greenmanager/issues/14) |
| PR3c | zone e aree (frontend) | PR3a, PR3b | da fare, issue [#15](https://github.com/inmagik/greenmanager/issues/15) |
| PR3d | elementi (frontend) | PR3c, PR2c | da fare, issue [#16](https://github.com/inmagik/greenmanager/issues/16) |
| PR4a | mappa: visualizzazione | PR3c | da fare, issue [#17](https://github.com/inmagik/greenmanager/issues/17) |
| PR4b | mappa: disegno e uso in campo | PR3d, PR4a | da fare, issue [#18](https://github.com/inmagik/greenmanager/issues/18) |

- Il backend della fetta è completo: PR1–PR2d unite. Il frontend ha i moduli dello scaffold (T4), `users` e `tenants`, e il primo modulo di dominio, `parties` (PR3a). Fino alle PR3b–PR3d gli altri dati di dominio si vedono dall'admin Django (`/admin/`) e dallo schema OpenAPI (`/api/schema/swagger-ui/`).
- La PR2 e la PR3 del piano iniziale sono state divise: la PR2 in quattro, con la PR2d per le correzioni finali, la PR3 in quattro. Anche la mappa, PR4 nel piano iniziale, è divisa in due. Così ogni PR resta nella misura che la revisione di Copilot copre in uno o due giri.
- I rilievi delle revisioni rinviati a dopo sono nella issue [#10](https://github.com/inmagik/greenmanager/issues/10). Quelli delle PR2a–PR2c sono stati corretti nella PR2d ([#22](https://github.com/inmagik/greenmanager/pull/22)); nella #10 restano i due della PR1 sull'ordine dei lock.

## 4. PR fatte

**PR1: basi, cataloghi, committente** ([#8](https://github.com/inmagik/greenmanager/pull/8); D-041–D-048).
- App `core`: `TrackedModel`, `ChangeRecord` immutabile, errori con codice, servizi, mixin delle view.
- App `catalogs`: voci di sistema e dell'organizzazione, nascoste e ritirate, attributi della classe, dati iniziali e comando `import_species`.
- App `parties`: il committente, gestito dalla sua organizzazione.
- Permessi diretti degli utenti modificabili solo dallo staff (domanda 4).
- Riferimenti: §8.1–§8.5, §8.8 e §8.9 di [backend.md](backend.md).

**PR2a: basi geometriche, zone e aree** ([#9](https://github.com/inmagik/greenmanager/pull/9); D-049, D-050).
- Geometrie normalizzate, con le misure sull'ellissoide.
- Campo GeoJSON e action `geojson`.
- Zone, e aree con le loro classificazioni.
- Sovrapposizioni come avvisi, con `geometry-check`.
- Riferimenti: §8.6.

**PR2b: elementi e composizione** ([#11](https://github.com/inmagik/greenmanager/pull/11); D-051).
- App `inventory`: elementi con il codice mai riusato, il cartellino, la geometria del tipo della classe, specie e composizione, gli attributi.
- Rimozione, ripristino e sostituzione, con le loro action.
- Riferimenti: §8.7.

**PR2c: controlli spaziali degli elementi** ([#12](https://github.com/inmagik/greenmanager/pull/12); D-052).
- Area proposta e `geometry-check` degli elementi.
- Avvisi "fuori area" e "alberi vicini".
- Posizione provvisoria al centro dell'area, e verifica della posizione.
- Riferimenti: §8.7.

**PR2d: chiusura del backend** ([#22](https://github.com/inmagik/greenmanager/pull/22); issue [#20](https://github.com/inmagik/greenmanager/issues/20)).
- Correzioni dalle revisioni delle PR2a–PR2c, tre delle quali dalla issue #10.
- `bbox` della action `geojson` nei limiti di WGS84, e schema della risposta con le geometrie nello `srid` richiesto.
- `area_not_available` nel `geometry-check/` delle aree.
- Nome della voce in `catalog_entry_not_available` solo se l'organizzazione la vede, anche per gli attributi delle classi.
- Riferimenti: §8.2, §8.4 e §8.6.

**PR3a: parti comuni e committenti** ([#23](https://github.com/inmagik/greenmanager/pull/23); issue [#13](https://github.com/inmagik/greenmanager/issues/13); D-053).
- Parti comuni: voci di menu con permesso, traduzioni comuni e `serverErrors` dei moduli, riepilogo dell'ultima modifica, conflitto di revisione con *Ricarica*.
- Modulo `parties`: lista, dettaglio, form, azioni (crea, modifica, disattiva, elimina), storico tecnico.
- `ClientSelect` e `useClientFilter`, per le PR3c e PR3d.
- Prova nel browser da utente non staff, anche a larghezza smartphone.
- Riferimenti: §9 di [frontend.md](frontend.md).

## 5. PR da fare

### Regole delle PR del frontend

Valgono per le PR3 e PR4:
- i moduli seguono i pattern di §4–§5 di [frontend.md](frontend.md) e di `modules/tenants` e `modules/users`: pagine di lista e dettaglio, form, azioni, `navigation.tsx`, `menu.tsx`, `permissions.ts`;
- i testi visibili stanno nelle traduzioni di `src/i18n/it/`;
- i codici degli errori e degli avvisi del server si traducono con `serverErrors.<code>`: ogni PR aggiunge quelli che le servono;
- prima di ogni commit `yarn lint` e `yarn build` devono passare;
- la prova manuale si fa con `runserver` e `yarn dev`, da utente non staff di un'organizzazione, con un ruolo che dà i permessi del modulo. Un utente di un'altra organizzazione non deve vedere nulla.

### PR3b. Cataloghi

Issue [#14](https://github.com/inmagik/greenmanager/issues/14). Dipende dalla PR3a.

- `api/createCatalogApi.ts`: una fabbrica di hook, uguale per tutti i cataloghi (`api/catalogs/<catalogo>/`), con le action `hide/`, `unhide/` e `choices/`.
- Lista e dettaglio generici, guidati da una configurazione, per i cataloghi semplici: tipologie ISTAT, destinazioni d'uso, intensità di fruizione, cause di rimozione, attributi.
- Pagine dedicate:
  - **specie**: rango, genere e genitore, nome scientifico e comune;
  - **classi di elemento**: tipo di geometria, unità, `species_mode`, `counts_as_tree`, attributi della classe (`class_attributes`). I campi bloccati quando la classe è in uso sono in sola lettura.
- Badge "sistema" e "organizzazione"; azioni nascondi e mostra sulle voci di sistema; filtri `available`, `scope`, `retired`, `hidden`.
- Selettori per i form degli altri moduli: `CatalogSelect`, `SpeciesSelect` (`AsyncSelect`, sulle sole voci disponibili), `ElementClassSelect`.
- La lettura è aperta a ogni membro; la scrittura chiede `catalogs.WRITE_CATALOGS`. Solo lo staff modifica le voci di sistema (`system_entry_read_only`).
- `i18n/it/catalogs.ts` e i codici di errore dei cataloghi.

**Verifica**: si nasconde una voce di sistema, che sparisce dai selettori e resta sui dati già salvati. Si aggiunge una specie propria. Una voce in uso non si elimina.

### PR3c. Zone e aree

Issue [#15](https://github.com/inmagik/greenmanager/issues/15). Dipende dalle PR3a e PR3b.

- **Zone**: lista con il filtro per committente, dettaglio, form; il codice è facoltativo, e se manca lo assegna il server.
- **Aree**:
  - lista con il committente come filtro, il flag `has_overlaps` e il filtro "da sistemare";
  - dettaglio con le schede Dati e Geometria. La scheda Elementi arriva con la PR3d;
  - form con le classificazioni (`CatalogSelect`), il periodo di gestione e il flag di area fittizia.
- **Geometria senza mappa**:
  - `GeometryFileInput` legge un file `.geojson`: è l'import di una geometria di AR-2. La mappa arriva con la PR4a;
  - `GeometrySummary` mostra tipo, numero di parti, superficie e perimetro;
  - prima del salvataggio, `geometry-check/` dà misure e avvisi.
- `WarningsAlert` in `src/components/`: mostra l'elenco `warnings` di una risposta, tradotto con `serverErrors.<code>` e `params`. Lo usa anche la PR3d.
- `@types/geojson`; `i18n/it/territory.ts`; permessi `territory.READ_AREAS` e `territory.WRITE_AREAS`.
- **Dalla PR3a**: `ClientSelect` e `useClientFilter` hanno qui i primi consumatori. Dal riepilogo della revisione di Copilot sulla PR3a:
  - quando `useClientFilter` cambia il filtro da solo (committente ricordato rimesso nell'URL, committente non più visibile scartato), la lista deve tornare a pagina 1: oggi resta la pagina dell'URL;
  - `choices/` dei committenti chiede `parties.READ_CLIENTS`: chi legge zone e aree senza quel permesso avrebbe un errore nel filtro. Da decidere: aprire `choices/` a chi ha un permesso di lettura dei dati del patrimonio (servono permessi in alternativa, che `ActionPermission` oggi non ha), oppure mostrare il filtro solo con `READ_CLIENTS`;
  - domanda 5 di [frontend.md](frontend.md): il server accetta dati nuovi per un committente disattivato.

**Verifica**: si crea una zona e un'area con una geometria multiparte da file, e si vede la superficie calcolata. Un'area sovrapposta a un'altra mostra l'avviso e compare nel filtro "da sistemare".

### PR3d. Elementi

Issue [#16](https://github.com/inmagik/greenmanager/issues/16). Dipende dalla PR3c. Usa le API della PR2c ([#12](https://github.com/inmagik/greenmanager/pull/12)), già unita.

- **Lista**:
  - filtri `area`, `zone`, `element_class`, `category`, `species`, `location_status`, `removed`, `present_on` e `outside_area`;
  - il flag "fuori area";
  - ordinamento per codice.
- **Dettaglio**: dati, composizione, attributi, posizione, sostituzione, storico.
- **`ElementForm`**, guidato dalla classe:
  - specie singola o `CompositionEditor` secondo `species_mode`;
  - `AttributesFields` per gli attributi della classe (D-047);
  - posizione da coordinate, da "Usa la mia posizione" (GPS del browser, con la precisione) o al centro dell'area (`area_center`);
  - area proposta e avvisi da `geometry-check/`.
- **Azioni**: rimuovi, con data, causa e motivazione; ripristina, con motivazione.
- Scheda Elementi nel dettaglio dell'area.
- `i18n/it/inventory.ts`, con i codici degli errori e degli avvisi (`element_outside_area`, `element_near_tree`); permessi `inventory.READ_ELEMENTS` e `inventory.WRITE_ELEMENTS`.

**Verifica**:
- si crea un albero da coordinate e uno con il GPS, e si ricevono l'area proposta e gli avvisi;
- si crea una siepe con la composizione;
- si rimuove l'albero con la causa e si controlla lo storico;
- un albero al centro dell'area resta provvisorio finché non si verifica la posizione.

### PR4a. Mappa: visualizzazione

Issue [#17](https://github.com/inmagik/greenmanager/issues/17). Dipende dalla PR3c; gli elementi sulla mappa vogliono anche la PR3d.

- **Dipendenze**: `maplibre-gl`, con un wrapper nostro, senza `react-map-gl`.
- **`src/components/Map/`**:
  - `MapView` e `MapContext`;
  - `basemaps.ts`: OSM in sviluppo, ortofoto WMS (PCN o regionali) configurabili con `VITE_BASEMAPS`;
  - `BasemapSwitcher`, che cambia la visibilità dei layer e mai lo stile;
  - `useGeoJSONLayer` e `useMapBbox`, sull'action `geojson/` con `bbox`. Le aree si caricano dallo zoom 12, gli elementi dallo zoom 15 o con un committente nel filtro;
  - `useGeolocation`, la posizione dell'utente con il cerchio di precisione;
  - `MiniMap`, caricata in modo lazy, per i dettagli.
- **`src/modules/map/`**:
  - rotta `/map` lazy, così MapLibre resta in un chunk separato;
  - `MapPage` con il pannello dei layer e `FeaturePanel`, un `Drawer` in basso su mobile e a destra su desktop;
  - stato della mappa nell'URL.
- Pulsante "Vedi sulla mappa" nei dettagli di aree ed elementi.
- **Documenti**:
  - decisione nuova, numero provvisorio D-054: MapLibre, che chiude la domanda 2 di [frontend.md](frontend.md), e il chunk lazy della mappa;
  - prima parte di `frontend-pattern.md` (T2): mappa, layer e basemap.

**Verifica**:
- `yarn build` mette MapLibre nel chunk della mappa;
- aree ed elementi compaiono sulla mappa e si aprono nel pannello;
- l'ortofoto si carica, o il rischio CORS è risolto (§6).

### PR4b. Mappa: disegno e uso in campo

Issue [#18](https://github.com/inmagik/greenmanager/issues/18). Dipende dalle PR3d e PR4a.

- **Spike all'inizio** su terra-draw (`terra-draw`, `terra-draw-maplibre-gl-adapter`):
  - multiparte;
  - poligoni con buchi;
  - compatibilità dell'adapter con maplibre-gl 6;
  - trascinamento dei vertici su iOS e Android.

  Se l'adapter non regge la versione 6, si fissa maplibre-gl alla 5. Se i buchi non reggono, le parti con buchi restano bloccate e si conservano invariate.
- **Disegno**:
  - `draw/useTerraDraw.ts`;
  - `draw/multipart.ts`: `splitParts` divide una geometria multiparte in feature separate al caricamento, `mergeParts` le riunisce al salvataggio.
- **`CreateElementFlow`**:
  1. scelta della classe;
  2. posizionamento: GPS, centro della mappa con il mirino, oppure disegno;
  3. `geometry-check/`, con l'area proposta e gli avvisi;
  4. `ElementForm` nel pannello.
- **`GeometryEditor`** per aree ed elementi: modifica dei vertici, "Aggiungi parte", "Elimina parte", annulla e salva con `revision`.
- **Uso in campo**: su mobile si invia `X-Change-Source: field`.
- **Test**: `vitest`, solo in sviluppo, per `multipart.ts` e gli helper del bbox.
- **Documenti**:
  - `frontend-pattern.md` completo, con le "Domande aperte": liste, dettaglio e form; mappa, disegno e multiparte; uso in campo; mappa pubblica rinviata; basemap e CORS;
  - decisione nuova, numero provvisorio D-055: terra-draw e `ScreenWidthGuard` lasciato passare su mobile;
  - §8 di [frontend.md](frontend.md) e [README.md](README.md) di questa cartella;
  - chiusura della fetta: T2 e T3 completati, in attesa di revisione, in [designdocs/README.md](../README.md); riga **Stato** di [AGENTS.md](../../AGENTS.md); `frontend/AGENTS.md`.

**Verifica**: la prova di fine fetta (§7), anche da smartphone.

## 6. Rischi da verificare

1. **terra-draw**: multiparte e buchi, adapter con maplibre-gl 6, trascinamento dei vertici sui dispositivi mobili. È lo spike all'inizio della PR4b.
2. **Ortofoto WMS**: CORS, HTTP o HTTPS, EPSG:3857. Se serve, un proxy in `nginx.conf`.
3. **Vite 8 (Rolldown)**: controllare nell'output della build che MapLibre stia nel chunk lazy.

I rischi del backend (GeoDjango con `geom_type` nei vincoli, sovrapposizioni con `OuterRef`, schema OpenAPI del campo GeoJSON) sono chiusi con le PR2a–PR2c.

## 7. Verifica di fine fetta

**Backend**, da `server/greenmanager/`, con PostGIS e Redis attivi:
- `migrate`;
- `import_species catalogs/seeds/species_starter.csv`;
- `test`;
- `makemigrations --check --dry-run`;
- `spectacular --file /dev/null --fail-on-warn`;
- black, isort e flake8.

**Frontend**, da `frontend/`: `yarn lint` e `yarn build`.

**Prova end-to-end**, con `runserver` e `yarn dev`, da utente non staff di un'organizzazione:
1. crea un committente;
2. nasconde una voce di sistema e aggiunge una specie propria;
3. crea una zona e un'area con una geometria multiparte, e vede la superficie calcolata;
4. crea un albero dalla mappa, con il GPS o con il mirino; riceve l'area proposta e l'avviso se è fuori area o vicino a un altro albero;
5. crea una siepe multiparte con la composizione;
6. modifica una parte e la salva;
7. rimuove l'albero con la causa e controlla lo storico.

La stessa prova si fa da smartphone, in HTTPS. Un utente di un'altra organizzazione non vede nulla.

## 8. Modo di lavoro

- Una PR alla volta, su un branch `fetta1-prN-…` che parte da `main`. Commit in italiano, "Fetta 1: …".
- Prima del push, una revisione del diff con l'agente `pr-reviewer`, rispetto a questo documento e alle decisioni.
- Il push e l'apertura della PR aspettano la conferma del responsabile di progetto. Poi c'è la revisione di Copilot.
- I rilievi validi lasciati fuori da una PR vanno nella issue [#10](https://github.com/inmagik/greenmanager/issues/10).
- Dopo l'unione di una PR si aggiornano la tabella di §3 e la issue della PR.

## Domande aperte

1. **Scelte da confermare alla revisione della fetta.** Le decisioni D-041–D-053 sono ipotesi. In particolare:
   - le scelte di D-051 (codice come testo, data di rimozione non futura, attributi controllati solo quando cambiano);
   - la composizione non obbligatoria per le classi che la prevedono;
   - le scelte di D-052 (2 m tra gli alberi, avviso dei vicini solo quando l'albero riceve una posizione, punto al centro dell'area che segue l'area).
2. **Rinviate oltre la fetta**:
   - mappa pubblica (domanda 3 di [frontend.md](frontend.md));
   - archiviazione di foto e allegati (domanda 6 di [backend.md](backend.md));
   - accesso tramite gli affidamenti (§5.4 di [04-modello-dati.md](../04-modello-dati.md));
   - invito di un utente già esistente (D-045).
