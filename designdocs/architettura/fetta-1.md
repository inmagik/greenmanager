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
| Cataloghi nell'interfaccia | D-054 | §9.6 di [frontend.md](frontend.md), §8.4 di [backend.md](backend.md) |
| Zone e aree nell'interfaccia, committente disattivato | D-055 | §9.3 e §9.7 di [frontend.md](frontend.md), §8.5–§8.7 di [backend.md](backend.md) |
| Elementi nell'interfaccia | D-056 | §9.8 di [frontend.md](frontend.md) |
| Mappa con MapLibre | D-057 | §1 di [frontend-pattern.md](frontend-pattern.md), §9.9 di [frontend.md](frontend.md) |
| Disegno sulla mappa e uso in campo | D-058 | §2 e §3 di [frontend-pattern.md](frontend-pattern.md), §9.7–§9.9 di [frontend.md](frontend.md) |

I riferimenti delle decisioni del backend sono a [backend.md](backend.md). Le decisioni del frontend sono arrivate con le PR3 e PR4, con il numero assegnato quando si sono scritte.

## 3. Sequenza e avanzamento

Aggiornato al 2026-10-13.

| PR | Contenuto | Dipende da | Stato |
|---|---|---|---|
| PR1 | basi, cataloghi, committente (backend) | — | unita, [#8](https://github.com/inmagik/greenmanager/pull/8) |
| PR2a | basi geometriche, zone e aree (backend) | PR1 | unita, [#9](https://github.com/inmagik/greenmanager/pull/9) |
| PR2b | elementi, composizione, ciclo di vita (backend) | PR2a | unita, [#11](https://github.com/inmagik/greenmanager/pull/11) |
| PR2c | controlli spaziali degli elementi (backend) | PR2b | unita, [#12](https://github.com/inmagik/greenmanager/pull/12) |
| PR2d | chiusura del backend: correzioni dalle revisioni (backend) | PR2c | unita, [#22](https://github.com/inmagik/greenmanager/pull/22) |
| PR3a | parti comuni e committenti (frontend) | — | unita, [#23](https://github.com/inmagik/greenmanager/pull/23) |
| PR3b | cataloghi (frontend) | PR3a | unita, [#24](https://github.com/inmagik/greenmanager/pull/24) |
| PR3c | zone e aree (frontend) | PR3a, PR3b | unita, [#25](https://github.com/inmagik/greenmanager/pull/25) |
| PR3d | elementi (frontend) | PR3c, PR2c | unita, [#26](https://github.com/inmagik/greenmanager/pull/26) |
| PR4a | mappa: visualizzazione | PR3c, PR3d | unita, [#27](https://github.com/inmagik/greenmanager/pull/27) |
| PR4b | mappa: disegno e uso in campo | PR3d, PR4a | da fare, issue [#18](https://github.com/inmagik/greenmanager/issues/18) |

- Il backend della fetta è completo: PR1–PR2d unite. Il frontend ha i moduli dello scaffold (T4), `users` e `tenants`, e i moduli di dominio `parties` (PR3a), `catalogs` (PR3b), `territory` (PR3c), `inventory` (PR3d) e `map` (PR4a). Aree ed elementi si vedono sulla mappa, e con la PR4b le geometrie si disegnano e si modificano sulla mappa, anche multiparte; dalla mappa si crea un elemento nuovo.
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

**PR3b: cataloghi** ([#24](https://github.com/inmagik/greenmanager/pull/24); issue [#14](https://github.com/inmagik/greenmanager/issues/14); D-054).
- Modulo `catalogs`: una fabbrica di hook per tutti i cataloghi, e una definizione per catalogo che guida lista, dettaglio, form e menu. Specie e classi di elemento usano le stesse pagine, con i loro campi: voce superiore della specie, attributi della classe.
- Azioni nascondi e mostra, ritira e ripristina, elimina; scrittura in `CheckPermission`, con le regole per voce e per staff in `useCatalogPermissions`.
- Selettori per le PR3c e PR3d: `CatalogSelect`, `SpeciesSelect`, `ElementClassSelect`. Un valore salvato la cui voce è poi nascosta o ritirata resta, segnato *non disponibile*.
- Server: `locked_fields` e `with_in_use()`, che `is_in_use` usa al posto del `Collector`; filtro `rank` delle specie con più valori.
- Prova nel browser da utente non staff, senza permessi e da staff, anche a larghezza smartphone. Il caso "resta sui dati già salvati" per aree ed elementi si prova con le PR3c e PR3d.
- Uniti con la PR due autofix di Copilot: un valore selezionato ed escluso resta tra le opzioni di `CatalogSelect`; le caselle in sola lettura sono anche disabilitate, riportate a `disabled={locked}` nella PR3c.
- Riferimenti: §9.6 di [frontend.md](frontend.md), §8.4 di [backend.md](backend.md).

**PR3c: zone e aree** ([#25](https://github.com/inmagik/greenmanager/pull/25); issue [#15](https://github.com/inmagik/greenmanager/issues/15); D-055).
- Modulo `territory`: zone e aree con lista, dettaglio, form e azioni; committente e zona come filtri, aree *da sistemare*. Il dettaglio dell'area ha le schede Dati e Geometria, con gli avvisi sopra.
- Geometria senza mappa (`components/Geometry`): il perimetro si importa da un file GeoJSON, anche multiparte, controllato fino alle posizioni; `geometry-check/` ne dà misure e avvisi prima del salvataggio. `WarningsAlert` e `notifyWarnings` per gli avvisi.
- `useClientFilter` torna a pagina 1 anche nei cambi automatici e toglie i filtri che dipendono dal committente.
- Server: zone, aree ed elementi nuovi rifiutati per un committente disattivato (`client_inactive`), con il committente bloccato alla creazione; `choices/` dei committenti aperto a chi legge aree o elementi; una zona salvata non resta senza codice (`zone_code_required`).
- Prova nel browser da utente non staff con i permessi del territorio e con la sola lettura, anche a larghezza smartphone; due revisioni con `pr-reviewer` e una di Copilot, unita senza autofix. Verificati anche i punti rinviati dalla PR3b: classificazioni nascoste conservate, caselle dei cataloghi con `disabled={locked}`.
- Riferimenti: §9.3 e §9.7 di [frontend.md](frontend.md), §8.5–§8.8 di [backend.md](backend.md).

**PR3d: elementi** ([#26](https://github.com/inmagik/greenmanager/pull/26); issue [#16](https://github.com/inmagik/greenmanager/issues/16); D-056).
- Modulo `inventory`: lista con committente, ricerca, presenza e *fuori area*, e gli altri filtri nel pannello *Filtri*; dettaglio con le schede Dati e Posizione; form guidato dalla classe, con specie singola o composizione e gli attributi della classe, mandati solo quando cambiano.
- Posizione senza mappa: coordinate scritte o lette dal dispositivo (`useCurrentPosition`, con la precisione), centro dell'area, linee e poligoni da file. `geometry-check/` dà misure, area proposta e avvisi; gli alberi vicini, che il server dà solo nelle risposte delle scritture, compaiono in una notifica.
- Rimozione, correzione della rimozione e ripristino, con la motivazione e la revisione dell'elemento; sostituzione con il link all'elemento sostituito. Scheda *Elementi* nel dettaglio dell'area.
- Dalle PR3b e PR3c: caricamento ed errore di `SpeciesSelect`, genere che segue il nome scientifico nel form della specie, `client_inactive` sul campo dell'area, form e stato di modifica legati anche all'id.
- Server: `choices/` di zone e aree aperto a chi legge gli elementi, come per i committenti (D-055).
- Prova nel browser da utente non staff, con la sola lettura e con i soli permessi degli elementi, anche a larghezza smartphone; due revisioni con `pr-reviewer` e una di Copilot, unita senza autofix.
- Riferimenti: §9.8 di [frontend.md](frontend.md), §8.6–§8.8 di [backend.md](backend.md).

**PR4a: mappa, visualizzazione** ([#27](https://github.com/inmagik/greenmanager/pull/27); issue [#17](https://github.com/inmagik/greenmanager/issues/17); D-057).
- Componenti della mappa (`components/Map`): wrapper di MapLibre GL 6, con il worker a parte; sfondi raster da tile o WMS, configurati con `VITE_BASEMAPS` e controllati campo per campo; livelli fissi dei layer; `useGeoJSONLayer`, `useMapBbox`, clic sulle feature, posizione dell'utente con il cerchio di precisione; `MiniMap` lazy.
- Modulo `map`: pagina `/map` lazy, per chi legge aree o elementi; pannello dei livelli con committente, stato dei layer e legenda per categoria; pannello della feature, drawer dal basso su smartphone e colonna a destra su desktop; stato nell'URL. Aree dallo zoom 12, elementi dallo zoom 15, a ogni zoom con un committente, che la mappa inquadra.
- Dettagli di aree ed elementi: *Vedi sulla mappa* e mini mappa nelle schede Geometria e Posizione, con la geometria nuova tratteggiata prima del salvataggio.
- Ortofoto: il PCN, solo in HTTP e spesso in errore, passa dal proxy `/wms/pcn` di Vite e di nginx; `nginx.conf` è diventato `nginx.conf.template`, che risolve il nome a ogni richiesta e tiene in cache le sole immagini. MapLibre sta nel chunk `maplibre`, fuori dal bundle principale.
- Server: categoria della classe nelle proprietà di `geojson/` degli elementi.
- Prova nel browser da utente non staff, con i soli permessi degli elementi, anche a larghezza smartphone, e con l'ortofoto dell'Emilia-Romagna; due revisioni con `pr-reviewer` e una di Copilot, unita senza autofix.
- Riferimenti: §1 di [frontend-pattern.md](frontend-pattern.md), §7 e §9.9 di [frontend.md](frontend.md), §8.7 di [backend.md](backend.md).

## 5. PR da fare

### Regole delle PR del frontend

Valgono per le PR3 e PR4:
- i moduli seguono i pattern di §4–§5 di [frontend.md](frontend.md) e di `modules/tenants` e `modules/users`: pagine di lista e dettaglio, form, azioni, `navigation.tsx`, `menu.tsx`, `permissions.ts`;
- i testi visibili stanno nelle traduzioni di `src/i18n/it/`;
- i codici degli errori e degli avvisi del server si traducono con `serverErrors.<code>`: ogni PR aggiunge quelli che le servono;
- prima di ogni commit `yarn lint` e `yarn build` devono passare, e dalla PR4b `yarn test`;
- la prova manuale si fa con `runserver` e `yarn dev`, da utente non staff di un'organizzazione, con un ruolo che dà i permessi del modulo. Un utente di un'altra organizzazione non deve vedere nulla.

### PR4b. Mappa: disegno e uso in campo

Issue [#18](https://github.com/inmagik/greenmanager/issues/18). Dipende dalle PR3d e PR4a, unite.

- **Spike all'inizio** su terra-draw (`terra-draw`, `terra-draw-maplibre-gl-adapter`):
  - multiparte;
  - poligoni con buchi;
  - compatibilità dell'adapter con maplibre-gl 6;
  - trascinamento dei vertici su iOS e Android.

  Se l'adapter non regge la versione 6, si fissa maplibre-gl alla 5. Se i buchi non reggono, le parti con buchi restano bloccate e si conservano invariate.
- **Disegno**:
  - `draw/useTerraDraw.ts`;
  - `draw/multipart.ts`: `splitParts` divide una geometria multiparte in feature separate al caricamento, `mergeParts` le riunisce al salvataggio.
- **`CreateElementFlow`** (nel codice `CreateElementPanel`, §2.5 di [frontend-pattern.md](frontend-pattern.md)):
  1. scelta della classe;
  2. posizionamento: GPS, centro della mappa con il mirino, oppure disegno;
  3. `geometry-check/`, con l'area proposta e gli avvisi;
  4. `ElementForm` nel pannello.
- **`GeometryEditor`** per aree ed elementi: modifica dei vertici, "Aggiungi parte", "Elimina parte", annulla e salva con `revision`.
- **Uso in campo**: su mobile si invia `X-Change-Source: field`.
- **Test**: `vitest`, solo in sviluppo, per `multipart.ts` e gli helper del bbox.
- **Documenti**:
  - `frontend-pattern.md` completo, con le "Domande aperte": liste, dettaglio e form; mappa, disegno e multiparte; uso in campo; mappa pubblica rinviata; basemap e CORS;
  - decisione nuova, D-058: terra-draw e `ScreenWidthGuard` lasciato passare su mobile;
  - §8 di [frontend.md](frontend.md) e [README.md](README.md) di questa cartella;
  - chiusura della fetta: T2 e T3 completati, in attesa di revisione, in [designdocs/README.md](../README.md); riga **Stato** di [AGENTS.md](../../AGENTS.md); `frontend/AGENTS.md`.

**Verifica**: la prova di fine fetta (§7), anche da smartphone.

## 6. Rischi da verificare

1. **terra-draw** → verificato con lo spike della PR4b (§2.1 di [frontend-pattern.md](frontend-pattern.md)): l'adapter regge MapLibre 6, che resta; le multiparte si dividono in parti; i poligoni con buchi, che terra-draw rifiuta, restano bloccati. Il trascinamento dei vertici funziona con il tocco emulato in Chromium; sui dispositivi veri si prova alla revisione della fetta (domanda 4 di [frontend-pattern.md](frontend-pattern.md)).
2. **Ortofoto WMS** → verificato con la PR4a (§1.5 di [frontend-pattern.md](frontend-pattern.md)). Il PCN ha CORS ed EPSG:3857, ma solo HTTP, ed è lento e a volte in errore: passa dal proxy `/wms/pcn` di nginx e di Vite, con la cache delle sole immagini. Un'ortofoto regionale in HTTPS con CORS, come l'AGEA 2020 dell'Emilia-Romagna, si configura con `VITE_BASEMAPS` senza proxy.
3. **Vite 8 (Rolldown)** → verificato con la PR4a: MapLibre sta nel chunk `maplibre`, caricato solo da `MapPage` e `MiniMap` con `import()`; il worker di MapLibre 6 è un file a parte, con `setWorkerUrl`.

I rischi del backend (GeoDjango con `geom_type` nei vincoli, sovrapposizioni con `OuterRef`, schema OpenAPI del campo GeoJSON) sono chiusi con le PR2a–PR2c.

## 7. Verifica di fine fetta

**Backend**, da `server/greenmanager/`, con PostGIS e Redis attivi:
- `migrate`;
- `import_species catalogs/seeds/species_starter.csv`;
- `test`;
- `makemigrations --check --dry-run`;
- `spectacular --file /dev/null --fail-on-warn`;
- black, isort e flake8.

**Frontend**, da `frontend/`: `yarn lint`, `yarn build` e `yarn test`.

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

1. **Scelte da confermare alla revisione della fetta.** Le decisioni D-041–D-058 sono ipotesi. In particolare:
   - le scelte di D-051 (codice come testo, data di rimozione non futura, attributi controllati solo quando cambiano);
   - la composizione non obbligatoria per le classi che la prevedono;
   - le scelte di D-052 (2 m tra gli alberi, avviso dei vicini solo quando l'albero riceve una posizione, punto al centro dell'area che segue l'area).
2. **Rinviate oltre la fetta**:
   - mappa pubblica (domanda 3 di [frontend.md](frontend.md));
   - archiviazione di foto e allegati (domanda 6 di [backend.md](backend.md));
   - accesso tramite gli affidamenti (§5.4 di [04-modello-dati.md](../04-modello-dati.md));
   - invito di un utente già esistente (D-045).
3. **Prova da smartphone.** La prova di §7 è stata fatta con la PR4b da computer e da uno smartphone emulato in Chromium. Manca quella da smartphone vero, in HTTPS, su Safari per iOS e Chrome per Android (domanda 4 di [frontend-pattern.md](frontend-pattern.md)). → da fare alla revisione della fetta
