# 02 — Benchmark di prodotti simili

> **Stato**: completato · **Passo**: 2 di 5 · Metodologia in [README.md](README.md)

- **Obiettivo**: capire quali feature offre il mercato (italiano ed estero) e quali vincoli impone la normativa italiana, per decidere cosa serve a GreenManager.
- **Input**: ricerca web, [01-analisi-spec-esistente.md](01-analisi-spec-esistente.md).
- **Output atteso**: le schede dei prodotti, il quadro normativo e la matrice delle feature con l'indicazione "candidata per noi".
- **Dallo Step 1**: approfondire le lacune L3 (dati dendrometrici), L6 (contesto e vincoli), L12 (dati degli interventi) e L16 (valutazione strutturata dello stato) di [01-analisi-spec-esistente.md](01-analisi-spec-esistente.md).

## 1. Prodotti analizzati

La ricerca è del 5 ottobre 2026. Le fonti sono i siti e le brochure dei produttori, i cataloghi di software (Capterra, G-Cloud britannico, catalogo cloud ACN) e alcuni articoli, indicate in fondo a ogni scheda.

**Affidabilità.** I dati vengono da quanto dichiarano i produttori e non sono stati verificati con prove d'uso. I prezzi sono indicativi e valgono per la fonte citata. "Non indicato" vuol dire che le fonti consultate non lo riportano, non che la funzione manchi.

### 1.1 Esito della lista iniziale

| Prodotto in lista | Esito |
|---|---|
| PlanIT Geo TreePlotter | Scheda in §1.4. È una famiglia di prodotti: inventario, copertura arborea, gestionale per imprese, parchi. |
| Davey TreeKeeper | Scheda in §1.4. |
| ArborNote | Scheda in §1.4. È un gestionale d'impresa, non un sistema per enti. |
| OpenTreeMap | Scheda in §1.4. Progetto fermo dal 2023, servizio di fatto dismesso. |
| i-Tree (USDA) | Scheda in §1.4. Non è un gestionale ma un insieme di strumenti di calcolo dei servizi ecosistemici, integrato da altri prodotti. |
| Soluzioni Esri | Scheda in §1.4. Corrispondono alla soluzione *ArcGIS Tree Management*. |
| R3 GIS | Scheda in §1.3. Il prodotto R3 TREES si chiama GreenSpaces dal 2020. |

La ricerca ha aggiunto i prodotti italiani GINVE, Fitos e i gestionali per giardinieri; gli esteri Ezytreev (Regno Unito), Arbokat (Germania) e greehill; e altre offerte, raccolte nelle tabelle finali di §1.3 e §1.4.

### 1.2 Segmenti di mercato

I prodotti rispondono a bisogni diversi. Per leggere le schede conviene raggrupparli per *unità di lavoro*, cioè per l'oggetto attorno a cui ruota il prodotto.

| Segmento | Per chi | Unità di lavoro | Prodotti |
|---|---|---|---|
| A. Gestione del patrimonio verde | Proprietario o gestore: enti, aziende pubbliche, campus | L'elemento censito (albero, area) e il suo storico | GreenSpaces, GINVE, TreePlotter INVENTORY, TreeKeeper, Esri Tree Management, Ezytreev, Arbokat, Cartegraph |
| B. Valutazione specialistica | Agronomi, periti, arboricoltori | La valutazione dell'albero (VTA, rischio) | Fitos, Al-beri |
| C. Gestione d'impresa | Ditte di manutenzione del verde e di cura degli alberi | Il cliente, il cantiere, l'ordine di lavoro | ArborNote, ArboStar, Aspire, TreePlotter JOBS; in Italia Gestionale Giardini Pro, Syncrogest, OK Giardiniere |
| D. Servizio con piattaforma | Enti che affidano all'esterno il censimento | La commessa di censimento | Larix Italia, Demetra, CENSIFLORA, SCM, SoilSense |
| E. Analisi e dati | Enti, ricerca | La popolazione arborea, la copertura del suolo | i-Tree, greehill, TreePlotter CANOPY, Al-beri |
| F. Partecipativo | Cittadini, associazioni, enti | L'albero mappato dai cittadini | OpenTreeMap (dismesso) |

**Dove si colloca GreenManager.** GreenManager si rivolge sia alle ditte sia agli enti e ai privati, quindi sta tra i segmenti A e C.
- I prodotti A gestiscono il patrimonio. La ditta vi compare come esecutore dei lavori: nel caso più completo (GreenSpaces) l'ente valida i lavori, li contabilizza a SAL e rileva le non conformità.
- I prodotti C gestiscono l'economia della ditta (clienti, preventivi, fatture) ma non hanno censimento né storico dell'elemento. Fa eccezione in parte ArborNote, dove l'inventario degli alberi del cliente serve a generare proposte e piani di manutenzione pluriennali.
- GreenSpaces e GINVE si rivolgono anche alle imprese, ma per la gestione tecnica (lavori, squadre, rendicontazione verso il committente), non per la gestione d'impresa.

PlanIT Geo copre i due segmenti con due prodotti separati (TreePlotter INVENTORY e TreePlotter JOBS). Il posizionamento di GreenManager è la domanda aperta 3.

### 1.3 Schede dei prodotti italiani

#### GreenSpaces — R3GIS (Bolzano)

- **Produttore**: R3GIS S.r.l., Bolzano. Il prodotto nasce come R3 TREES e prende il nome GreenSpaces nel 2020, con la versione 5.
- **Target**:
  - comuni e altri enti, aziende pubbliche che gestiscono il verde per conto di enti;
  - imprese private che gestiscono aree verdi per più clienti, consulenti per alberi e giochi.
  - Roma Capitale lo ha adottato nel 2024, partendo dal Municipio XIV.
- **Modello commerciale**:
  - SaaS a canone annuo con utenti illimitati, più un canone di set-up. L'import dei dati e le configurazioni particolari si pagano a pacchetti di ore.
  - In alternativa si installa sul server del cliente.
  - Versioni TREES (alberi), PLAY (giochi), Standard (tutti gli elementi) ed Enterprise, più moduli a pagamento.
  - È qualificato nel catalogo cloud dell'ACN (livello 1, valido 2025–2028) ed è sul MePA.
  - Il produttore dichiara oltre 2 milioni di alberi gestiti e oltre 5.000 utenti.
- **Feature principali**:
  - censimento di tutti gli elementi del verde, raggruppati in *località*: alberi (dati dendrometrici, multitronco, cartellinatura), arbusti, siepi, prati, fioriere, arredi, giochi, impianti di irrigazione;
  - macchie arbustive e fioriere con più specie, ciascuna con data di inserimento e di rimozione;
  - scheda VTA configurabile per cliente (difetti controllati, bersagli), con analisi strumentali collegate (dendrodensimetro, tomografo);
  - ricontrollo programmato in automatico, con un intervallo per ogni classe di propensione al cedimento;
  - modulo "Posti liberi" per gli alberi da sostituire; alberi monumentali e alberi dedicati ai nuovi nati (L. 10/2013);
  - lavori pianificati per località e per elemento, con diagramma di Gantt, validazione, esecuzione e rendicontazione;
  - prezzario delle lavorazioni: il costo si calcola dalla geometria dell'elemento (es. m² di prato × prezzo dello sfalcio), poi SAL e registrazione del pagamento;
  - segnalazioni dal campo, con posizione e foto, che si possono trasformare in lavori;
  - non conformità, con gravità e tempo di risoluzione per l'appaltatore;
  - ispezioni dei giochi con tag NFC;
  - app per iOS e Android che lavora anche offline;
  - stampe PDF, export XLS e SHP, import SHP. Dichiara di seguire il modello dati dei CAM 2020 (livelli di censimento 1–3);
  - moduli aggiuntivi: METEO; BENEFITS (servizi ecosistemici con algoritmi delle Università di Milano e Firenze); WATER (fabbisogno irriguo per albero); WORKS (calendario, squadre, ore, materiali e mezzi); GREEN CITY (portale pubblico).
- **Punti di forza**:
  - è il prodotto più diffuso in Italia tra quelli trovati;
  - copre il ciclo completo ispezione → lavoro → ricontrollo, con lo storico di ogni pianta;
  - è il solo prodotto analizzato che gestisce il rapporto tra committente e appaltatore (validazione, SAL, non conformità);
  - dichiara la conformità a L. 10/2013 e CAM.
- **Limiti**:
  - è un prodotto ampio, configurato dal produttore: avviarlo richiede set-up e ore di configurazione;
  - molte funzioni sono in versioni o moduli a pagamento, e i prezzi non sono pubblici;
  - le fonti non descrivono funzioni di gestione d'impresa (clienti, preventivi, fatturazione).
- **Fonti**: brochure R3GIS per la [PA](https://www.r3gis.com/web/content/74422) e [generale](https://www.r3gis.com/web/content/99737); [pagina del prodotto](https://www.r3gis.com/it/greenspaces); [scheda ACN](https://www.acn.gov.it/portale/en/w/sa-6393); [Roma Capitale](https://www.comune.roma.it/web/it/notizia/mappatura-gestione-verde-urbano-greenspaces.page).

#### GINVE.CLOUD — Futura Sistemi (Sommacampagna, VR)

- **Produttore**: Futura Sistemi S.r.l. GINVE.CLOUD è l'evoluzione di GINVE.SHP, sviluppato da oltre 15 anni. L'app per il campo si chiama GINVE.APP.
- **Target**: pubbliche amministrazioni, imprese di manutenzione, liberi professionisti. Il produttore cita "molti comuni, imprese e professionisti" senza numeri.
- **Modello commerciale**: WebGIS in cloud; condizioni e prezzi non pubblicati.
- **Feature principali**:
  - censimento di alberi, arbusti, siepi, prati, arredi (giochi, panchine, cestini, fontane), impianti di irrigazione e illuminazione pubblica;
  - valutazione di stabilità con QTRA e Protocollo Areté;
  - indice di sicurezza calcolato per ogni albero da specie, dimensioni e difetti, e ricalcolato dopo gli interventi (es. una potatura che riduce la chioma);
  - calendario degli interventi ordinari e straordinari, mappe tematiche (es. alberi da abbattere), statistiche;
  - in campo, con l'app: ordini di lavoro, segnalazioni, nuovi interventi con posizione e foto prima e dopo;
  - stato degli interventi delle squadre visibile in tempo reale;
  - computi metrici con prezzari personalizzabili, preventivi;
  - QR code sugli elementi, flotta dei veicoli (Webfleet), servizi ecosistemici con i-Tree;
  - export SHP, GeoJSON, KML, CSV e PDF. Dichiara di seguire L. 10/2013 e CAM 2020.
- **Punti di forza**:
  - collega l'ufficio dell'ente con le squadre della ditta;
  - le foto prima e dopo documentano l'esecuzione;
  - usa metodi di valutazione del rischio riconosciuti.
- **Limiti**: le fonti non dicono se l'app lavora offline; prezzi non pubblici; documentazione pubblica sintetica.
- **Fonti**: [GINVE.CLOUD](https://www.ginve.it/ginve-cloud-2/); [home page](https://www.ginve.it/en/home-page-eng/); [articolo su verdepubblico.it](https://verdepubblico.it/la-nuova-gestione-informatizzata-del-verde-pubblico-2/).

#### Fitos — SuPerAlberi (Tarcento, UD)

- **Produttore**: SuPerAlberi srl.
- **Target**: professionisti (agronomi, arboricoltori) e gestori del verde pubblico.
- **Modello commerciale**: non indicato.
- **Feature principali**:
  - censimento georeferenziato su Google Maps con dati dendrometrici: altezza, circonferenza, chioma, impalcatura;
  - VTA per organo dell'albero: 5 comparti e oltre 15 tipi di alterazione;
  - valutazione fitopatologica con 12 parametri e gravità da 0 a 4;
  - classe di propensione al cedimento calcolata da stato fitosanitario e stato meccanico;
  - servizi ecosistemici: area fogliare, LAI, biomassa, carbonio stoccato, biodiversità;
  - report per commessa in PDF ed Excel;
  - più utenti sugli stessi dati, con la traccia di chi ha modificato cosa.
- **Punti di forza**: la valutazione più dettagliata tra i prodotti analizzati; lavora per commessa, come il professionista.
- **Limiti**: poco o nulla su interventi e manutenzione; le fonti non parlano di app né di offline; è uno strumento di valutazione, non un gestionale.
- **Fonti**: [pagina del prodotto](https://www.superalberi.it/fitos/).

#### Gestionali d'impresa per il verde (scheda di gruppo)

- **Prodotti**: Gestionale Giardini Pro, Syncrogest, OK Giardiniere (RP Soft). Offerte simili: mInterventi, Edison (Exe Progetti), Hoida.
- **Target**: imprese di giardinaggio e di manutenzione del verde, per clienti privati e pubblici.
- **Modello commerciale**:
  - SaaS a canone mensile o annuo, legato al numero di utenti. Esempio: Gestionale Giardini Pro costa 29–49 €/mese, oppure 690 € una tantum più 50 €/anno.
  - OK Giardiniere è un software per Windows con una web app (Giardy) per i rapportini.
- **Feature principali**:
  - anagrafica di clienti e fornitori, catalogo di materiali, attrezzature e lavorazioni;
  - preventivi; contratti di manutenzione, anche a pacchetti di ore che si scalano a ogni intervento, con avviso all'esaurimento;
  - interventi pianificati e assegnati alle squadre;
  - rapportini compilati in campo, con foto, ore, materiali e trasferte, firmati dal cliente e inviati in PDF;
  - consuntivi di cantiere, confronto tra preventivo e consuntivo;
  - magazzino, fatturazione elettronica.
- **Punti di forza**: coprono il ciclo economico della ditta; costano poco; sono semplici e pensati per chi lavora sul campo.
- **Limiti**: nessun censimento georeferenziato, nessuno storico della singola pianta, nessuna valutazione dello stato. L'unità di lavoro è il cliente o il cantiere, non l'elemento verde.
- **Fonti**: [Gestionale Giardini Pro](https://gestionalegiardini.com/); [Syncrogest](https://www.syncrogest.it/gestionale-giardinieri); [OK Giardiniere](https://rpsoft.it/presentazione-ok-giardiniere/); [mInterventi](https://www.minterventi.it/software-di-gestione-interventi-per-giardinieri/); [Edison](https://www.exeprogetti.it/prodotti/software-gestionale-edison-garden).

#### Altre offerte italiane

| Offerta | Tipo | Note |
|---|---|---|
| Larix Italia; Demetra (Demetrees e Demeplay) | Servizio di censimento con piattaforma WebGIS | Le due pagine hanno testi identici: verosimilmente si tratta della stessa piattaforma, di un fornitore che non viene nominato. Funzioni: catasto alberi, elementi puntuali, lineari e areali, VTA, Gantt dei lavori, giochi, app. ([Larix](https://www.larixitalia.it/censimento-del-verde-e-web-gis/), [Demetra](https://www.demetra.net/servizi/servizi-informatici/demetrees/)) |
| CENSIFLORA — Flora Napoli | Software desktop per Windows, client/server, con servizio di censimento | Archivi di alberi, siepi, aiuole, prati e arredi; VTA; prezzari, piani di manutenzione e simulazioni. Clienti citati: Aosta, Caserta, Pomezia, Mostra d'Oltremare. È un'architettura simile a quella del software Access dello Step 1. ([fonte](https://www.floranapoli.it/core-business/software-censiflora10161.html)) |
| SCM | Servizio di rilievo | Fotogrammetria aerea e da drone, immagini multispettrali, laser scanner, censimento botanico; i dati vanno su una piattaforma WebGIS. ([fonte](https://www.scmgeo.it/rilievo-del-verde/)) |
| SoilSense con Ambito Srl | Software di censimento con sensori di umidità del suolo | Rivolto ai comuni sopra i 15.000 abitanti, per il bilancio arboreo; prova gratuita di 60 giorni. ([fonte](https://www.soilsense.io/it/bilancio-arboreo)) |
| Al-beri | Monitoraggio satellitare e analisi di stabilità | Indici di stress da Sentinel-2 (NDVI, NDMI), simulazioni a elementi finiti, prove di trazione e tomografie. Si collega a GreenSpaces e si rivolge anche ai privati. È uno strumento complementare, non un gestionale. ([fonte](https://www.al-beri.com/)) |
| Plantae.Land | Società di servizi | VTA, diagnostica strumentale, trattamenti, censimento; fornisce il software come parte del servizio. ([fonte](https://www.plantae.land/approfondimenti/)) |
| Welcome2 verde | Piattaforma web e app | Compare nei risultati di ricerca (censimento, VTA, attività, anomalie), ma il sito non risponde: **non verificato**. |
| Sistemi propri dei comuni | Sviluppo interno o su commessa | Es. il sistema informativo del verde di Firenze e il WebGIS del verde di Pistoia, aperto ai cittadini. ([Pistoia](https://comune.pistoia.it/it/documenti_pubblici/sistema-informativo-verde-pubblico-censimento-alberature)) |

Un riferimento di prezzo dal lato della domanda: nel 2026 il comune di Termoli ha messo a gara una piattaforma per il verde a 15.000 € + IVA per 36 mesi, con un'opzione di altri 24 mesi fino a 10.000 € ([fonte](https://termolionline.it/2026/09/attualita/il-verde-pubblico-entra-nella-mappa-digitale-alberi-censiti-e-controlli-programmati/)).

### 1.4 Schede dei prodotti esteri

#### TreePlotter — PlanIT Geo (USA)

- **Produttore**: PlanIT Geo. La famiglia comprende:
  - TreePlotter INVENTORY (inventario);
  - CANOPY (copertura arborea e analisi);
  - JOBS (gestionale per imprese: mappe, preventivi, ordini di lavoro, fatture, collegamento a QuickBooks);
  - PARKS (beni dei parchi).
- **Target**: enti locali, non profit, campus universitari, consulenti, imprese di cura degli alberi.
- **Modello commerciale**: SaaS annuo a tariffa fissa con utenti illimitati, da 3.500 $/anno secondo Capterra. Quattro livelli di prodotto più moduli aggiuntivi.
- **Feature principali**:
  - inventario su mappa, dal web e dal campo;
  - campi configurabili, storico dei lavori, foto, statistiche e report;
  - mappa pubblica per il coinvolgimento della comunità;
  - valutazione del rischio di base inclusa;
  - moduli aggiuntivi:
    - ordini di lavoro: preventivi, richieste di servizio, flussi ed email configurabili, costi, storico per lavoro e per albero;
    - benefici ecosistemici calcolati con i-Tree;
    - raccolta dati offline;
    - valutazione del rischio con il modulo ISA TRAQ e con QTRA;
    - stima del valore dell'albero (metodo CTLA);
    - copertura del suolo ed equità nella distribuzione degli alberi;
    - API e WFS, single sign-on, import di layer SHP e CAD;
    - rilievi per i cantieri secondo la norma britannica BS 5837.
- **Punti di forza**: è il riferimento del mercato per gli enti negli USA; integra gli standard di settore; è modulare; utenti illimitati.
- **Limiti**:
  - standard e norme nordamericani o britannici;
  - gestione del patrimonio e gestione d'impresa sono in prodotti separati;
  - funzioni chiave, come ordini di lavoro e offline, sono a pagamento.
- **Fonti**: [famiglia TreePlotter](https://planitgeo.com/treeplotter/); [moduli aggiuntivi](https://planitgeo.com/customizations-and-add-on-modules/); [Capterra](https://www.capterra.com/p/154730/Tree-Plotter/).

#### TreeKeeper — Davey Resource Group (USA)

- **Produttore**: Davey Resource Group, la divisione di consulenza ambientale di Davey Tree.
- **Target**: città di ogni dimensione, servizi parchi, università, cimiteri, proprietà commerciali, non profit. Spesso è adottato dopo un inventario eseguito dalla stessa Davey (es. Park Ridge, Illinois).
- **Modello commerciale**: abbonamento annuo a livelli, con utenti e dati illimitati: 3.600 $ (livello 1), 8.000 $ (livello 2), su preventivo (livello 3). Il supporto premium è a parte.
- **Feature principali**:
  - inventario di più tipi di beni, con campi personalizzabili;
  - ordini di lavoro, anche verso appaltatori, stampabili;
  - registro delle richieste dei residenti, collegato ai sistemi 311 (il numero dei servizi comunali negli USA);
  - lavoro in campo con posizione e foto;
  - benefici ecosistemici, report filtrabili;
  - integrazione con Cartegraph, Cityworks e i GIS;
  - modulo TreeKeeper Canopy per la copertura arborea annuale.
- **Punti di forza**: è il pioniere del settore; gestisce le richieste dei cittadini; si integra con i sistemi di gestione dei beni già usati dalle città.
- **Limiti**: è legato al servizio di inventario di Davey; le fonti non parlano di offline né di valutazione del rischio.
- **Fonti**: [pagina del prodotto](https://www.davey.com/treekeeper); [Park Ridge](https://www.davey.com/portfolio/park-ridge-il_uf_0920/).

#### ArcGIS Tree Management — Esri

- **Produttore**: Esri, come soluzione della raccolta ArcGIS Solutions.
- **Target**: uffici tecnici, servizi parchi ed enti stradali che usano già ArcGIS.
- **Modello commerciale**: il modello di soluzione è gratuito, ma servono le licenze di ArcGIS Online o Enterprise, ArcGIS Pro, Field Maps, Workforce e Survey123.
- **Feature principali**:
  - inventario dal campo (Field Maps, anche offline) e dall'ufficio (ArcGIS Pro);
  - ispezioni: condizione dell'albero, malattie, parassiti, condizione del posto d'impianto e del marciapiede;
  - attività di manutenzione con tipo, date e stato;
  - incarichi alle squadre, creati da un albero o da una richiesta;
  - richieste di servizio interne e dei cittadini;
  - elenco delle specie ammesse, gestito dagli arboricoltori: una specie ritirata sparisce dalle scelte;
  - sito pubblico e app di consultazione;
  - il posto d'impianto ha uno stato proprio: piantato, disponibile, dismesso, ceppaia.
- **Punti di forza**: modello dati pubblico e documentato; il posto d'impianto è un'entità; si integra con il resto del GIS dell'ente.
- **Limiti**: richiede l'ecosistema Esri e competenze GIS; è un modello da adattare più che un prodotto finito; costi di licenza.
- **Fonti**: [introduzione](https://doc.arcgis.com/en/arcgis-solutions/latest/reference/introduction-to-tree-management.htm); [uso](https://doc.arcgis.com/en/arcgis-solutions/latest/reference/use-tree-management.htm).

#### Ezytreev — RA Information Systems (Regno Unito)

- **Produttore**: RA Information Systems, che lo dichiara leader nel Regno Unito e in Irlanda.
- **Target**: enti locali e organizzazioni pubbliche e private.
- **Modello commerciale**: SaaS, 1.000 £ per licenza all'anno (catalogo G-Cloud).
- **Feature principali**:
  - alberi, boschi, aree verdi e altri beni su mappa;
  - ispezioni sistematiche pianificate;
  - raccolta dati in campo con l'app Onsite (Android, iOS, Windows);
  - rischio calcolato con QTRA o con criteri definiti dall'utente;
  - valore ornamentale dell'albero;
  - ordini di lavoro, budget, gestione degli appaltatori;
  - richieste e reclami dei cittadini;
  - vincoli di tutela (TPO, *Tree Preservation Order*), con l'istruttoria in campo;
  - alberi privati che interferiscono con strade e reti, con il proprietario e la pratica.
- **Punti di forza**: copre anche i procedimenti amministrativi (tutela, alberi privati, reclami), oltre alla manutenzione.
- **Limiti**: è molto legato al quadro normativo britannico; prezzo per licenza.
- **Fonti**: [G-Cloud](https://www.applytosupply.digitalmarketplace.service.gov.uk/g-cloud/services/836885406057919); [Capterra](https://www.capterra.com/p/199349/EZYTREEV/).

#### Arbokat — iNovaGIS (Germania)

- **Produttore**: iNovaGIS, insieme allo studio peritale Peter Klug.
- **Target**: comuni e periti del mercato tedesco.
- **Modello commerciale**: non indicato.
- **Feature principali**:
  - catasto e controllo degli alberi secondo le linee guida FLL (2010);
  - per ogni albero, quando e da chi è stato controllato, con valore di prova legale;
  - registro completo delle modifiche e delle misure da prendere;
  - database su SQL Server o Oracle, interfaccia con ArcGIS;
  - export CSV, PDF, KML, Shapefile;
  - app di campo che scarica i dati e lavora senza connessione.
- **Punti di forza**: la tracciabilità a fini di responsabilità. In Germania il proprietario risponde della sicurezza degli alberi verso terzi e deve poter dimostrare i controlli.
- **Limiti**: mercato e norme tedeschi; installazione sul database del cliente.
- **Fonti**: [scheda Esri partner](https://www.esri.com/partners/inovagis-ohg-a2T39000000VTIJEA4/arbokat-a2d39000001QjrtAAC); [app](https://www.esri.com/partners/inovagis-ohg-a2T39000000VTIJEA4/arbokat-app-a2d39000001QjvHAAS).

#### ArborNote (USA)

- **Produttore**: ArborNote. Si dichiara il gestionale più raccomandato dall'associazione di categoria TCIA.
- **Target**: imprese di cura degli alberi e di manutenzione del verde in Nord America, per clienti residenziali e commerciali.
- **Modello commerciale**: SaaS per utente al mese: 240 $ (Essential), 350 $ (Enterprise). L'app per le squadre è separata.
- **Feature principali**:
  - mappa degli alberi del cliente, con GPS e foto;
  - CRM e vendite; proposte commerciali generate dall'inventario;
  - piani di manutenzione pluriennali;
  - preventivi, pianificazione delle squadre;
  - ordini di lavoro con moduli di sicurezza e checklist;
  - trattamenti fitosanitari;
  - costi di commessa, firma elettronica;
  - integrazioni con QuickBooks, HubSpot e ArcGIS.
- **Punti di forza**: l'inventario diventa uno strumento di vendita: dagli alberi del cliente nascono la proposta e il piano pluriennale.
- **Limiti**: è orientato al rapporto commerciale con il cliente privato; nessuna funzione per enti pubblici né per la normativa.
- **Fonti**: [Capterra](https://www.capterra.com/p/206772/ArborNote/).

#### i-Tree — USDA Forest Service (USA)

- **Produttore**: il servizio forestale degli Stati Uniti, con alcuni partner.
- **Target**: enti, non profit, ricerca.
- **Modello commerciale**: gratuito. I modelli sono pubblicati e sottoposti a revisione scientifica.
- **Feature principali**:
  - i-Tree Eco, applicazione desktop: struttura e benefici di una popolazione di alberi, a partire da specie, diametro, altezza, chioma e condizione;
  - i-Tree Canopy, online: copertura arborea da foto aeree;
  - altri strumenti: Landscape, MyTree, Planting, Database;
  - quantifica carbonio, inquinanti rimossi e deflusso idrico evitato;
  - ha dati meteo e di inquinamento per diversi paesi europei;
  - TreePlotter ne usa l'API di calcolo; GINVE lo integra; R3GIS lo offre come servizio.
- **Punti di forza**: è lo standard di fatto per i servizi ecosistemici; gratuito.
- **Limiti**:
  - non è un gestionale: niente app di campo né interventi;
  - in Italia si usa soprattutto in ambito accademico, con alcune prove su inventari comunali (es. Varese, circa 8.000 alberi pubblici).
- **Fonti**: [i-Tree in Europa (2023)](https://www.itreetools.org/documents/1000/2023-12-20_Article_I-Tree_in_Europe_EN.pdf).

#### OpenTreeMap — Azavea (USA)

- **Produttore**: Azavea, con Urban Ecos. Azavea è stata acquisita da Element 84 nel febbraio 2023.
- **Target**: città e organizzazioni che vogliono un inventario partecipativo (es. PhillyTreeMap, San Francisco, Sacramento).
- **Modello commerciale**: software open source su GitHub, più un servizio ospitato offerto da Azavea.
- **Feature principali**: mappa collaborativa in cui cittadini, associazioni ed enti censiscono gli alberi; calcolo dei servizi ecosistemici; app per iOS e Android. È scritto in Django con PostGIS.
- **Stato**: l'ultimo commit del repository principale è dell'agosto 2023. Il dominio opentreemap.org oggi ospita contenuti estranei al progetto. Il servizio è di fatto dismesso.
- **Punti di forza**: il modello partecipativo. Lo stack è lo stesso di GreenManager (Django, PostGIS), quindi il codice è un riferimento utile per il modello dati.
- **Limiti**: progetto fermo; pensato per l'inventario partecipativo, non per la manutenzione.
- **Fonti**: [otm-core su GitHub](https://github.com/OpenTreeMap/otm-core); [acquisizione di Azavea](https://geospatialworld.net/news/element-84-azavea-geospatial-solutions/).

#### greehill (Europa)

- **Produttore**: greehill. È partner di Davey negli USA e di Civica nel Regno Unito.
- **Target**: città.
- **Modello commerciale**: campagne di scansione più piattaforma; prezzi non indicati.
- **Feature principali**:
  - gemello digitale 3D di ogni albero, ricavato da fotocamere, laser scanner mobili e terrestri, immagini satellitari e apprendimento automatico;
  - analisi della salute della chioma, delle specie, del rischio e del valore;
  - collegamento con ispezioni e manutenzione;
  - dichiara oltre 130 città, tra cui Lisbona (circa 20.000 alberi) e Leoben (circa 3.000).
- **Punti di forza**: censisce in modo automatico grandi numeri di alberi.
- **Limiti**: dipende da campagne di scansione; i dati vanno integrati in un gestionale.
- **Fonti**: [Civica](https://www.civica.com/en-gb/news-library/greehill-ai-urban-forestry-partnership); [Davey](https://davey.com/about/newsroom/drg-and-greehill-partner-to-deliver-digital-tree-inventory-to-us-cities); [Leoben](https://www.smartcitiesworld.net/news/austrian-city-uses-digital-twin-to-manage-its-urban-trees-7922).

#### Altri prodotti esteri

| Prodotto | Segmento | Note |
|---|---|---|
| ArboStar (USA) | C | Gestionale per imprese di cura degli alberi: CRM, preventivi, pianificazione, GPS delle squadre, mezzi, fatture, mappe, offline. Da 150–250 $/mese secondo le fonti; dichiara oltre 2.000 imprese. ([Capterra](https://www.capterra.com/p/198069/ArboStar)) |
| Aspire, ServiceTitan (USA) | C | Gestionale per imprese del paesaggio: contratti di manutenzione ricorrenti, ordini di lavoro, squadre, preventivi, fatturazione, mezzi. ([fonte](https://youraspire.com/industries/landscape-business-software/equipment-management)) |
| Cartegraph, OpenGov (USA) | A | Gestione dei beni pubblici in generale (strade, reti, edifici, alberi), con un modulo alberi: ispezioni, stima del valore CTLA, ordini di lavoro, costi di manodopera, mezzi e materiali. ([fonte](https://govlaunch.com/products/cartegraph-work-order-management)) |
| Green GIS, mevivo Baumkataster (Germania) | A | Catasti degli alberi web con i protocolli di controllo FLL. ([fonte](https://www.ki-syndikat.de/tools/green-gis/)) |

### 1.5 Osservazioni trasversali

Queste osservazioni servono alla matrice delle feature (§3) e allo Step 3. Tra parentesi i prodotti in cui compare ciascun elemento.

1. **Ciclo ispezione → intervento → ricontrollo.** Nei prodotti per enti l'esito dell'ispezione decide gli interventi e la data del controllo successivo (GreenSpaces: intervallo per classe di propensione al cedimento; GINVE: indice ricalcolato dopo l'intervento; Ezytreev: ispezioni sistematiche). Conferma D-007 e D-008 e dà una forma concreta alla lacuna L13.
2. **Il metodo di valutazione del rischio è nazionale.** VTA con classi di propensione al cedimento in Italia, ISA TRAQ negli USA, QTRA nel Regno Unito (usato anche da GINVE e TreePlotter), linee guida FLL in Germania. GreenSpaces e TreePlotter rendono configurabile la scheda di valutazione. Approfondito in §2.5; è l'input per la lacuna L16.
3. **Il posto d'impianto è un'entità.** In Esri il posto ha uno stato (piantato, disponibile, dismesso, ceppaia); in GreenSpaces i "posti liberi" guidano le sostituzioni. Risponde in parte alla lacuna L5 (ciclo di vita dell'elemento) e alla domanda 5.
4. **Elementi di gruppo.** GreenSpaces gestisce macchie arbustive e fioriere con più specie, ciascuna con data di inserimento e rimozione. È un precedente per la domanda 3 dello Step 1 (elementi di gruppo).
5. **L'economia degli interventi** è presente in tutti i prodotti maturi, con forme diverse secondo il segmento. È l'input per la lacuna L12.
   - Per l'ente: prezzario, costo calcolato dalla geometria, SAL e pagamento (GreenSpaces); computi con prezzari (GINVE).
   - Per la ditta: costi di commessa, preventivo e consuntivo (ArborNote, ArboStar, gestionali italiani); ore, materiali e mezzi per intervento (GreenSpaces WORKS).
6. **Le segnalazioni** hanno due origini: i cittadini (TreeKeeper con il 311, Esri, Ezytreev) e gli operatori in campo (GreenSpaces, GINVE). In entrambi i casi possono diventare interventi. Le **non conformità** sono invece il controllo di qualità del committente sul lavoro della ditta (GreenSpaces).
7. **Quasi tutti lavorano offline in campo**: GreenSpaces, TreePlotter (a pagamento), Esri Field Maps, Arbokat, ArboStar. D-004 va in direzione opposta al mercato (domanda 4).
8. **Servizi ecosistemici.** i-Tree è il riferimento ed è integrato da altri prodotti (TreePlotter, GINVE, GreenSpaces come servizio). GreenSpaces offre anche un calcolo con algoritmi di università italiane. È un tema di portale pubblico e di bilancio arboreo, più che di gestione quotidiana.
9. **In Italia la normativa è un argomento di vendita.** GreenSpaces e GINVE dichiarano la conformità a L. 10/2013 (catasto, alberi monumentali, alberi per i nuovi nati, bilancio arboreo) e al modello dati e ai livelli di censimento dei CAM 2020. SCM e SoilSense vendono proprio sull'obbligo di censimento e di bilancio arboreo. Verificato in §2.2 e §2.3: i livelli di censimento dei CAM sono confermati, e il modello dati a cui rimandano è scritto da R3GIS.
10. **Censimento e software si vendono spesso insieme.** Nel segmento D, e di fatto anche TreeKeeper e greehill, il software arriva con il censimento eseguito dal fornitore. L'import di un censimento esistente è un servizio a parte (GreenSpaces). Collegato alla domanda 2 dello Step 1 (import dei dati esistenti).
11. **Modelli di prezzo.**
    - Prodotti per enti: canone annuo con utenti illimitati (TreePlotter da 3.500 $, TreeKeeper 3.600–8.000 $, Ezytreev 1.000 £ per licenza).
    - Gestionali d'impresa: canone per utente al mese (ArborNote 240–350 $; gestionali italiani 29–49 €).
    - Il bando di Termoli dà un ordine di grandezza italiano: circa 5.000 € l'anno.
12. **Vendere alla PA italiana** richiede la qualificazione ACN dei servizi cloud (GreenSpaces è qualificato) ed è facilitato dal MePA. Infrastruttura e deploy sono fuori dal perimetro della specifica, ma questo è un vincolo per l'adozione da parte degli enti.
13. **Telerilevamento e intelligenza artificiale** (greehill, Al-beri, TreePlotter CANOPY, i dati satellitari di e-GEOS per Roma) sono una tendenza. Arrivano come fonti di dati esterne e non cambiano il modello di base.
14. **Nome.** La ricerca non ha trovato prodotti del settore chiamati "GreenManager". Non è una verifica sui marchi.

**Termini emersi.** Quelli adottati sono registrati nel [glossario](glossario.md); vedi §5.2.

| Termine | Significato | Dove compare |
|---|---|---|
| Località | Area che raggruppa gli elementi censiti; corrisponde alla nostra area | GreenSpaces |
| Posto d'impianto | Posizione in cui c'è o può esserci un albero, con uno stato proprio (occupato, libero, ceppaia, dismesso) | Esri, GreenSpaces |
| Segnalazione | Problema rilevato in campo o da un cittadino, che può diventare un intervento | GreenSpaces, GINVE, TreeKeeper, Esri, Ezytreev |
| Non conformità | Lavoro non eseguito a regola d'arte, con gravità e termine per la correzione | GreenSpaces |
| Ricontrollo | Ispezione successiva, programmata in base all'esito della precedente | GreenSpaces |
| Ordine di lavoro | Incarico a una squadra o a un appaltatore per uno o più interventi | quasi tutti |
| Prezzario | Elenco dei costi unitari delle lavorazioni, usato per calcolare il costo degli interventi | GreenSpaces, GINVE, CENSIFLORA |
| SAL (stato di avanzamento lavori) | Elenco dei lavori eseguiti in un periodo, base per il pagamento all'appaltatore | GreenSpaces |

## 2. Contesto normativo italiano

La ricerca è del 5 ottobre 2026. Le fonti sono i testi delle norme, i documenti tecnici a cui le norme rimandano e le linee guida di associazioni e ordini professionali, indicate in fondo a ogni paragrafo.

**Affidabilità.** È una lettura tecnica, non un parere legale. I punti sulla responsabilità (§2.5) e sui procedimenti autorizzativi (§2.6) vanno verificati con un legale prima di diventare regole di business vincolanti.

Le fonti hanno **forza** diversa, indicata così nelle tabelle:
- **legge**: obbligo diretto (es. L. 10/2013);
- **appalti**: obbligo per l'ente quando affida un servizio, e quindi per la ditta che lo esegue (CAM);
- **standard**: riferimento tecnico richiamato dalle norme o adottato di fatto (modello dati del censimento, classi SIA, norme UNI);
- **linea guida**: buona pratica raccomandata da associazioni o ordini professionali;
- **statistica**: dati chiesti dall'ISTAT.

### 2.1 Quadro d'insieme

| Fonte | Forza | A chi si applica | Cosa chiede, in breve | § |
|---|---|---|---|---|
| L. 10/2013, art. 2 (modifica la L. 113/1992) | legge | Comuni | Catasto degli alberi pubblici; bilancio arboreo di fine mandato; un albero per ogni nuovo nato | 2.2 |
| L. 10/2013, art. 7; DM 23/10/2014; circolare MiPAAF 461/2020 | legge | Comuni, proprietari | Censimento e tutela degli alberi monumentali; interventi comunicati o autorizzati | 2.6 |
| CAM Verde pubblico, DM 63/2020 | appalti | Enti che affidano progettazione e manutenzione del verde; ditte aggiudicatarie | Censimento a tre livelli; piano di manutenzione; aggiornamento del censimento; rapporto annuale | 2.3 |
| Modello dati per il censimento del verde urbano, v2.1 (2020) | standard | Chi realizza il censimento secondo i CAM | Catalogo degli oggetti, codifica, attributi, formato di consegna | 2.3 |
| ISTAT, rilevazione "Dati ambientali nelle città" | statistica | Comuni capoluogo | Superfici per tipologia di verde, numero di alberi, abbattimenti per causa, bilancio arboreo | 2.4 |
| Codice civile, artt. 2043 e 2051 | legge | Proprietario o custode dell'albero | Responsabilità per i danni causati dagli alberi | 2.5 |
| SIA: classi di propensione al cedimento (2008) e protocollo di valutazione (2015) | standard | Valutatori, gestori | Classi A–D e intervalli massimi di ricontrollo | 2.5 |
| Linea guida per la gestione della foresta urbana pubblica (2025) | linea guida | Gestori pubblici | Censimento separato dalla valutazione; tipi di valutazione; piano di gestione arborea | 2.5 |
| Linee guida nazionali CONAF sul rischio arboreo (2026) | linea guida | Proprietari, gestori, professionisti | Valutazione del rischio secondo UNI ISO 31000; parametri minimi; tracciabilità delle decisioni | 2.5 |
| D.Lgs. 42/2004, Codice dei beni culturali e del paesaggio | legge | Ville, parchi e giardini storici | Interventi soggetti ad autorizzazione | 2.6 |
| UNI EN 1176-7 | standard | Gestori di aree gioco | Ispezioni periodiche delle attrezzature | 2.7 |
| D.Lgs. 150/2012 e PAN (DM 22/01/2014) | legge | Chi esegue trattamenti fitosanitari | Difesa integrata, operatori abilitati, informazione alla popolazione | 2.7 |
| Reg. (UE) 2024/1991, art. 8 | legge | Stato, con regioni ed enti locali | Nessuna perdita netta di verde urbano e copertura arborea al 2030 rispetto al 2024 | 2.7 |

### 2.2 Legge 10/2013, norme per lo sviluppo degli spazi verdi urbani

L'art. 2 modifica la L. 113/1992 ("un albero per ogni neonato") e vi aggiunge l'art. 3-bis.

| Obbligo | Chi | Contenuto | Dati e funzioni per GreenManager |
|---|---|---|---|
| Catasto degli alberi (art. 3-bis, c. 1) | Comuni | Censire e classificare gli alberi piantati in aree urbane di proprietà pubblica. | Inventario degli alberi pubblici. Il contenuto minimo è fissato dai CAM (livello 2, §2.3). |
| Bilancio arboreo (art. 3-bis, c. 2) | Il sindaco, due mesi prima della fine del mandato | Rapporto tra il numero di alberi in aree urbane pubbliche all'inizio e alla fine del mandato; stato di consistenza e manutenzione delle aree verdi. | Conteggio degli alberi presenti a una data qualsiasi, quindi data di messa a dimora e data di rimozione per ogni albero. Report per periodo con alberi piantati e abbattuti, superfici e manutenzioni eseguite. |
| Un albero per ogni nuovo nato (art. 1, c. 1) | Comuni sopra i 15.000 abitanti | Mettere a dimora un albero entro 6 mesi dalla registrazione anagrafica di ogni nato o minore adottato. La messa a dimora si può differire per la stagione o per gravi motivi tecnici. | Albero collegato a una registrazione anagrafica, con la scadenza dei 6 mesi. |
| Comunicazione alla famiglia (art. 1, c. 2) | Ufficio anagrafe | Comunicare a chi ha chiesto la registrazione la specie e il luogo dell'albero. | Specie e posizione dell'albero dedicato, pronte da comunicare. |
| Alberi celebrativi (art. 1, c. 2) | Comuni | Procedura per alberi messi a dimora a spese di cittadini, imprese o associazioni, per celebrazioni o commemorazioni. | Stessa dedica, con il donatore. |
| Alberi monumentali (art. 7) | Comuni, regioni, ministero | Vedi §2.6. | Vedi §2.6. |
| Verde pubblico sul sito del comune (art. 6, c. 4) | Comuni e province | Dare conto ogni anno sul sito delle aree acquisite e sistemate a verde pubblico. | Superfici delle aree e loro variazione nell'anno. |

Note:
- **Chi deve fare il catasto.** Il testo dell'art. 3-bis dice "ciascun comune". I CAM e l'ISTAT lo riferiscono ai comuni sopra i 15.000 abitanti, a cui si applica la L. 113/1992. Per GreenManager la differenza conta poco: il catasto serve comunque.
- **Come si calcola il bilancio.** La legge non lo dice. La linea guida del 2025 (§2.5) consiglia di calcolarlo ogni anno, togliendo dal conteggio gli alberi abbattuti.
- **Dati personali.** L'albero per il nuovo nato collega un albero a un minore. Va deciso quali dati registrare (domanda 7).

Fonti: [L. 10/2013, testo vigente da Normattiva (copia sul sito del MASE)](https://mase.gov.it/sites/default/files/archivio/allegati/comitato%20verde%20pubblico/legge_14_01_2013_10_verde_urbano.pdf).

### 2.3 CAM Verde pubblico (DM 63/2020) e modello dati del censimento

**Cosa sono.** I Criteri ambientali minimi (DM 10 marzo 2020, n. 63, GU n. 90 del 4/4/2020) si applicano all'affidamento della progettazione e della manutenzione del verde pubblico, e alla fornitura di piante, fertilizzanti e impianti di irrigazione.
- Le stazioni appaltanti devono inserire nei bandi almeno le specifiche tecniche e le clausole contrattuali dei CAM (oggi art. 57 del D.Lgs. 36/2023). Valgono quindi per l'ente e, di riflesso, per la ditta che vince l'appalto.
- I CAM del 2020 sono in vigore. Il MASE ne ha in programma l'aggiornamento per il 2026, ma non c'è ancora un nuovo decreto.

**Il censimento a tre livelli (Scheda B dei CAM).** L'ente deve avere almeno il livello 1 prima di affidare la manutenzione.

| Livello | Obbligo | Contenuto minimo |
|---|---|---|
| 1. Anagrafica delle aree gestite | Tutti i comuni | Codice area; nome area; classificazione per destinazione d'uso; classificazione ISTAT (§2.4); intensità di fruizione; data di inizio e di fine gestione; perimetro; rilevatore; data del rilievo. |
| 2. Alberi | Comuni sopra i 25.000 abitanti, e dal 2021 sopra i 15.000 | Codice pianta, univoco nel comune o nell'area; codice area; posizione, dentro un'area del livello 1; data di inizio; data di fine (abbattimento); specie (nome scientifico); nome comune\*; diametro del tronco a 1,30 m (cm); altezza (m); diametro della chioma (m)\*; fase di sviluppo (nuovo impianto, giovane, adulta, senescente); protezione (monumentale o di particolare interesse); rilevatore; data del rilievo. |
| 3. Tutti gli elementi | Raccomandato | Tutti gli elementi del verde, classificati secondo le lavorazioni che ricevono: un prato in scarpata si falcia con mezzi e costi diversi da uno in un'area sportiva. Serve a tracciare attività, costi e non conformità, e per gli appalti complessi (global service). |

\* facoltativo.

Dettagli dei livelli 1 e 2:
- **Perimetro.** Può essere *reale* (parchi, rotonde, aree sportive) o *fittizio*. Il perimetro fittizio si usa per le aree stradali, dove si gestiscono solo gli alberi e i tornelli: si disegna tutta la strada e la si marca come fittizia, perché non falsi le superfici gestite.
- **Alberi.** Ai campi minimi vanno collegate le informazioni sullo stato nel tempo (es. altezza di impalcatura), le valutazioni di stabilità e gli interventi passati e pianificati. I CAM consigliano di censire al livello 2 anche giochi e attrezzi sportivi, che richiedono ispezioni periodiche.
- **Formato.** Sistema di riferimento ufficiale RDN2008 (codici EPSG 6706, 7791–7794), poligoni delle aree non sovrapposti, consegna in shapefile.

**Clausole che producono dati.** Riguardano la ditta aggiudicataria:
- **Piano di gestione e manutenzione**, basato sul censimento e sulla *gestione differenziata*: livelli di manutenzione diversi (numero di interventi all'anno) secondo tipologia, dimensione e fruizione dell'area. Contiene cronoprogramma, stima dei costi, ore di manodopera e mezzi, e un processo di gestione del rischio: contesto, identificazione, valutazione, mitigazione, comunicazione.
- **Catasto degli alberi**: se l'ente non lo ha, la ditta si impegna a realizzarlo.
- **Aggiornamento del censimento** dopo gli interventi eseguiti.
- **Rapporto periodico** annuale. Comprende la formazione del personale, il piano di comunicazione e il reimpiego di sfalci e potature. Riferisce anche su tutela della fauna, uso di fitosanitari e fertilizzanti, impianti di irrigazione, rifiuti, lubrificanti e fornitori delle piante.
- **Manutenzione degli alberi**: niente capitozzatura, cimatura o potatura drastica; gli abbattimenti rilevanti vanno concordati prima con l'ente.
- **Fitosanitari**: difesa integrata e biologica, informazione alla popolazione, operatori abilitati (§2.7).
- **Criterio premiante**: la ditta si impegna a portare il censimento dell'ente al livello superiore.

**Il modello dati del censimento.** I CAM rimandano al *Modello dati per il censimento del verde urbano* del Politecnico di Milano e di R3GIS (v2.1, 2020), pubblicato sul sito del Ministero. È di fatto lo standard nazionale.
- **Codice dell'oggetto** di 7 caratteri, `TXYYZZZ`: tipo di geometria (S superficie, L linea, P punto), tipo principale, tipo secondario, attributo. Esempio: `P103108` è l'albero (punto, vegetazione, pianta, albero).
- **Quattro tipi principali**:
  - vegetazione: alberi, siepi, filari, prati, aiuole, macchie;
  - arredo urbano: pavimentazioni, giochi, panchine, elementi dell'impianto di irrigazione;
  - fruizione e gestione: aree di gestione, anche fittizie o "in attesa di censimento"; aree temporanee come cantieri, sponsor, concessioni; aree funzionali come aree gioco, aree cani, orti;
  - fattori ambientali: aree di quarantena e focolai di parassiti, interferenze con le linee tranviarie, sinistri, anche con richiesta di risarcimento.
- **Attributi comuni** a tutti gli oggetti: codice ISTAT del comune, zona, area, identificativo, codice dell'oggetto, data di posa, data di rimozione, data di aggiornamento, autore della modifica, note, foto.
- **Attributi degli alberi**: codice nell'area, genere, specie, varietà, altezza, diametro del tronco, diametro della chioma, stato.
- **Regole topologiche**:
  - ogni elemento sta dentro un'area di gestione;
  - dentro l'area, i poligoni di vegetazione e di arredo coprono tutto il suolo, senza buchi né sovrapposizioni;
  - le geometrie sono semplici, non multiparte;
  - le misure (superficie, lunghezza) si calcolano dalla geometria.
- **Precisione**: scala nominale 1:500, ±10 cm.
- **Storico**: solo la data di posa e la data di rimozione di ogni oggetto.

Osservazioni:
- Il modello è coerente con D-002 e D-006: la classe dell'elemento determina il tipo di geometria. Però mette nella classe anche il materiale o la collocazione (es. "pavimentazione in pietra", "prato in scarpata"), che per noi possono essere attributi.
- È scritto da R3GIS, il produttore di GreenSpaces: la conformità ai CAM dichiarata da GreenSpaces (§1.3) coincide con l'adozione di questo modello.
- Lo stato dell'albero è un campo unico. Per noi è l'ultima osservazione (D-007), da esportare in quel campo.
- La compatibilità con il modello, almeno in import ed export, è un requisito di fatto per lavorare con gli enti italiani (domanda 10).

Fonti: [CAM, allegato al DM 63/2020 (MASE)](https://www.mase.gov.it/portale/documents/d/guest/cam_verde_pubblico_06-02-2020-pdf); [Modello dati per il censimento del verde urbano v2.1](https://www.mase.gov.it/sites/default/files/archivio/allegati/GPP/2020/modello_dati_per_il_censimento_del_verde_urbano_2_1_con_allegati.pdf); [aggiornamento dei CAM nel 2026](https://www.lavoripubblici.it/news/criteri-ambientali-minimi-cam-2026-appalti-37772).

### 2.4 Rilevazione ISTAT "Dati ambientali nelle città"

Ogni anno l'ISTAT chiede i dati sul verde urbano ai comuni capoluogo di provincia e di città metropolitana (109, più Cesena). I CAM la richiamano: la classificazione ISTAT è un campo del livello 1.

**Tipologie di verde urbano** (istruzioni del questionario 2024, dati 2023):

| Tipologia | Definizione sintetica |
|---|---|
| Verde storico | Ville, giardini e parchi di interesse artistico o storico, tutelati dal D.Lgs. 42/2004 |
| Parchi urbani | Parchi aperti al pubblico non vincolati, esclusi i piccoli spazi di quartiere |
| Verde attrezzato | Piccoli parchi e giardini di quartiere, con giochi, aree cani, panchine |
| Aree di arredo urbano | Verde legato alla viabilità: rotonde, spartitraffico, aiuole, alberature stradali, piste ciclabili |
| Forestazione urbana | Nuovi boschi urbani e periurbani su aree prima libere |
| Giardini scolastici | Verde di pertinenza delle scuole comunali |
| Orti botanici | — |
| Orti urbani | Appezzamenti comunali assegnati ai cittadini |
| Giardini zoologici | — |
| Cimiteri | — |
| Aree sportive all'aperto | Verde dei campi sportivi e delle aree ludico-ricreative |
| Aree boschive | Superfici boscate, secondo la definizione FAO |
| Verde incolto | Aree verdi urbane senza manutenzione programmata |
| Altro | Aree non comprese nelle voci precedenti |

**Altri dati richiesti**, che GreenManager potrebbe produrre:
- numero di alberi al 31 dicembre, e se il conteggio riporta la specie, è georeferenziato ed è un vero catasto;
- alberi **abbattuti nell'anno, per causa**: rischio di caduta (malattia, pericolo, esito di una valutazione di stabilità), eventi atmosferici, altre cause da descrivere;
- alberi per i nuovi nati: numero, specie e luogo, se sono nel censimento e se hanno coordinate;
- presenza di misure di gestione del rischio di cedimento;
- bilancio arboreo di fine mandato, con gli alberi all'inizio e alla fine;
- nuovi interventi di forestazione urbana, con il numero di alberi piantati;
- superficie di ogni tipologia, e aree cedute o destinate ad altro uso nell'anno.

Osservazioni:
- La classificazione ISTAT risponde alla domanda 1: è un catalogo nazionale, stabile e già richiesto dai CAM. Non basta però per la gestione, perché non distingue aree con esigenze di manutenzione diverse. Per questo i CAM chiedono anche una classificazione per destinazione d'uso e l'intensità di fruizione.
- La causa dell'abbattimento è un dato da strutturare nell'intervento (lacuna L12).

Fonti: [ISTAT, istruzioni del questionario Verde 2024](https://www.istat.it/fascicoloSidi/1720/Istruzioni%202024%20-%20Verde.pdf); [ISTAT, nota metodologica di Ambiente urbano 2022](https://www.istat.it/it/files//2023/12/Nota-metodologica.pdf).

### 2.5 Valutazione della stabilità e del rischio degli alberi

**Perché conta.** Il proprietario o il gestore è custode dell'albero (art. 2051 c.c.) e risponde dei danni che provoca (anche art. 2043 c.c.). Sul piano penale, le linee guida CONAF richiamano gli artt. 677, 589 e 590 c.p.
- Nessuna legge impone un metodo di valutazione.
- Documentare controlli e decisioni è però il modo per dimostrare la diligenza del custode. È lo stesso motivo per cui Arbokat, in Germania, punta sulla tracciabilità (§1.4).

**Classi di propensione al cedimento (CPC) della SIA.** È il metodo più diffuso in Italia e deriva dal VTA. Le classi misurano la **pericolosità** dell'albero, non il rischio: non considerano chi o che cosa l'albero può colpire.

| Classe | Propensione | Significato | Controllo successivo |
|---|---|---|---|
| A | Trascurabile | Nessun difetto significativo visibile | Visivo, entro 5 anni |
| B | Bassa | Difetti lievi | Visivo, entro 3 anni; indagini strumentali a giudizio del tecnico |
| C | Moderata | Difetti significativi, di norma con indagini strumentali | Visivo, entro 2 anni |
| C/D | Elevata | Difetti gravi; fattore di sicurezza drasticamente ridotto | Il tecnico prescrive interventi, poi rivaluta l'albero e assegna una nuova classe. Se gli interventi non sono possibili, l'albero passa in classe D |
| D | Estrema | Fattore di sicurezza esaurito | Abbattimento |

**Protocollo SIA** (2015). Stabilisce come si arriva alla classe:
- quattro fasi: anamnesi, diagnosi, prognosi, prescrizioni;
- un'analisi visiva, integrata se serve da analisi strumentali (dendrodensimetro, tomografo…), ripetibili e riferite a punti precisi dell'albero;
- una relazione **datata e firmata** dal valutatore, con: metodo e strumenti, elementi critici, punti di sondaggio e referti, foto se pattuite, classe e giudizio sintetico, prescrizioni;
- la validità della valutazione coincide con il turno di ricontrollo, fissato dal valutatore entro il massimo della classe. Decade prima se ci sono eventi meteo estremi, malattie o lavori vicino all'albero.

**Linea guida per la gestione della foresta urbana pubblica** (Associazione Pubblici Giardini e SIA, pubblicata da ANCI nel 2025):
- **Censimento e valutazione sono separati.** Il censimento (codice, posizione, cartellino, specie, diametro a 1,30 m, altezza) non contiene giudizi sul rischio, perché la valutazione comporta una responsabilità diversa. Si possono fare insieme, ma restano due prestazioni distinte.
- **Tipi di valutazione**, in ordine di approfondimento:
  - visiva speditiva;
  - visiva speditiva massiva, dopo un evento meteo straordinario;
  - ordinaria;
  - avanzata a terra, con strumenti;
  - avanzata in quota;
  - biomeccanica, con prove di trazione.

  Ognuna produce una scheda digitale; quelle avanzate anche referti e foto.
- **Esiti**, a titolo di esempio: condizioni buone; normali; non ordinarie, con intervento urgente; critiche, con intervento indifferibile o delimitazione dell'area; pericolo grave e imminente, con intervento dei Vigili del fuoco. Il pericolo grave va comunicato subito al gestore, in modo tracciato.
- **Ruoli.**
  - Il *gestore* fissa i bersagli e il rischio accettabile, sceglie gli interventi e i tempi.
  - Il *valutatore* valuta l'albero.
  - Il gestore dovrebbe far usare sempre la propria scheda di valutazione, per avere dati coerenti nel tempo anche se cambiano i valutatori.
- **Altre indicazioni**:
  - aggiornare il censimento almeno ogni 5 anni;
  - calcolare il bilancio arboreo ogni anno;
  - misurare la copertura arborea pubblica, cioè la proiezione delle chiome sulla superficie di riferimento;
  - redigere un piano di gestione arborea a vent'anni, aggiornato ogni tre.

**Linee guida nazionali CONAF sul rischio arboreo** (delibera n. 88 del 18/03/2026). Le ha approvate l'ordine nazionale dei dottori agronomi e forestali. Secondo la stampa di settore sono state discusse con il Comitato per lo sviluppo del verde pubblico e con il MASE. Non sono una norma di legge.
- La valutazione di stabilità è considerata una valutazione del **rischio**, da gestire secondo la norma UNI ISO 31000:2018.
- Parametri minimi obbligatori della valutazione:
  - A. stato fisiologico e fitosanitario;
  - B. difetti strutturali e resistenza meccanica;
  - C. contesto e bersagli: area di potenziale caduta, bersagli, frequenza d'uso, livello di rischio;
  - D. valore economico ed ecosistemico dell'albero;
  - E. condizioni del suolo nella zona di protezione dell'albero.
- L'abbattimento è l'ultima risorsa e va motivato con i parametri. Per filari e alberate la decisione può riguardare l'intero sistema, non il singolo albero.
- Ogni fase va documentata: metodo, parametri, livello di rischio, interventi proposti, motivazioni.

**Altri metodi** usati in Italia:
- *QTRA*, britannico, offerto da GINVE, TreePlotter ed Ezytreev (§1.3, §1.4).
- *Protocollo Aretè*, che combina la pericolosità con quattro classi di bersaglio. Il Comune di Trento (oltre 18.000 alberi) sta passando dalle CPC a questo approccio, con una carta di vulnerabilità per ciascun bersaglio: valore dei beni esposti, presenza stabile di persone, traffico veicolare, traffico ciclopedonale. Nel 2025 attendeva le linee guida nazionali e l'adeguamento del proprio software gestionale.
- *ISA TRAQ*, negli USA (§1.4).

**Indicazioni per il modello.** Sono l'input per la lacuna L16 e la domanda 6.
1. La valutazione è un tipo di osservazione (D-007). Ha: protocollo, tipo di valutazione, valutatore (professionista abilitato), data, esito in una scala che dipende dal protocollo, data del prossimo controllo, prescrizioni, allegati (relazione firmata, referti, foto, punti di sondaggio).
2. Protocolli e classi vanno in un catalogo, non nel codice: oggi le CPC della SIA, domani il rischio secondo CONAF o Aretè.
3. La data di ricontrollo deriva dalla classe, entro il massimo del protocollo, e il valutatore può anticiparla. Genera un controllo pianificato, come in GreenSpaces (§1.5, punto 1).
4. Le prescrizioni generano interventi pianificati con una scadenza. Per la classe C/D, dopo l'intervento serve una nuova valutazione (lacuna L13).
5. Bersagli e frequenza d'uso sono dati di contesto fissati dal gestore, sull'area o sul tratto di strada, non sull'albero. Si collegano all'intensità di fruizione dei CAM.
6. Dopo un evento meteo straordinario serve una campagna di controllo speditiva sugli alberi della zona colpita.
7. Valutazioni e interventi non si cancellano né si sovrascrivono: lo storico è la prova della diligenza (lacune L7 e L17).

Fonti: [SIA, classi di propensione al cedimento (Arbor n. 24, 2008)](https://www.sacrimonti.org/documents/25223/109143/57-Protocollo_classi_prop_cedimento.pdf/cce2f798-bcfb-4b95-899d-2bcad6963c12); [protocollo SIA sulla valutazione di stabilità (2015)](https://www.isaitalia.org/images/pdf/Protocollo_valutazione_di_stabilita.pdf); [Linea guida per la gestione della foresta urbana pubblica (2025)](https://www.anci.it/wp-content/uploads/2025/05/2025-1_Linea_guida_gestione_foresta_urbana_pubblica.pdf); [linee guida CONAF (2026)](https://www.conaf.it/wp-content/uploads/2026/03/Linee-guida.pdf) e [articolo di presentazione](https://www.agricultura.it/2026/03/27/un-quadro-unitario-per-la-gestione-del-verde-urbano-dal-conaf-ecco-le-linee-guida-nazionali/); [Comune di Trento, risposta all'interrogazione n. 16/2025](https://www.comune.trento.it/ocmultibinary/download/40566/1546618/5/74d8e6c9ce78b040115ce9641a07be16.pdf/file/risp%2Bis%2B16_2025.pdf).

### 2.6 Vincoli: alberi monumentali, verde storico, organismi nocivi

**Alberi monumentali.** Li regolano l'art. 7 della L. 10/2013, il DM 23/10/2014 e la circolare MiPAAF n. 461 del 5/3/2020.
- **Cosa sono**:
  - alberi isolati o in formazioni boschive, rari per età, dimensioni, pregio naturalistico o riferimenti storici e culturali;
  - **filari e alberate** di pregio, anche in città;
  - alberi in complessi architettonici storici: ville, monasteri, orti botanici, residenze storiche.

  Il DM del 2014 fissa sette criteri: età e dimensioni, forma e portamento, valore ecologico, rarità botanica, architettura vegetale, pregio paesaggistico, pregio storico-culturale-religioso.
- **Censimento**: lo fanno i comuni; le regioni compongono gli elenchi regionali; il ministero dell'agricoltura (oggi MASAF) tiene l'elenco nazionale.
- **Sanzioni**: abbattere o danneggiare un albero monumentale costa da 5.000 a 100.000 €.
- **Interventi**, secondo la circolare del 2020:
  - con semplice *comunicazione* di inizio lavori, se poco incisivi: valutazioni fitopatologiche e di stabilità, rimonda del secco, cura delle ferite, trattamenti, concimazioni, manutenzione degli ancoraggi;
  - con *autorizzazione* del comune, dopo il parere vincolante del ministero, se incisivi: potatura della chioma, interventi sulle radici, consolidamenti, opere nell'area di protezione dell'albero, abbattimento;
  - in caso di pericolo imminente, con un'ordinanza urgente del sindaco;
  - a lavori finiti, una relazione tecnica con foto va inviata a comune, regione e ministero;
  - in alternativa, si approva una volta un piano di gestione pluriennale (consigliati 5 anni), dopo il quale gli interventi previsti non richiedono altri atti.

**Verde storico.** Ville, parchi e giardini di interesse artistico o storico sono beni culturali (D.Lgs. 42/2004, art. 10) o beni paesaggistici (art. 136). Gli interventi richiedono l'autorizzazione della Soprintendenza. Riguarda gli enti e i privati con ville storiche, che sono tra i destinatari di GreenManager. È anche la prima tipologia ISTAT (§2.4).

**Organismi nocivi.** Le lotte obbligatorie, ad esempio contro il cancro colorato del platano, impongono prescrizioni sugli interventi nelle zone delimitate dai Servizi fitosanitari regionali. Il modello dati CAM le rappresenta come aree di quarantena e focolai (§2.3).

**Indicazioni per il modello.** Sono l'input per la lacuna L6.
- Serve un concetto di **vincolo**, con:
  - un tipo: monumentale, bene culturale, paesaggistico, quarantena…;
  - un riferimento: il codice nell'elenco nazionale, l'atto di vincolo, il provvedimento;
  - un oggetto: un albero, un filare, un'area o una zona disegnata sulla mappa.
- Il vincolo cambia il **ciclo dell'intervento** (D-008):
  - per alcuni tipi di intervento serve una comunicazione o un'autorizzazione prima dell'esecuzione, e una rendicontazione dopo;
  - l'intervento deve poter registrare gli estremi dell'atto: ente, numero, data, parere (domanda 8).
- La monumentalità può riguardare un filare intero: vale per elementi lineari e gruppi, non solo per il singolo albero.

Fonti: [L. 10/2013, art. 7](https://mase.gov.it/sites/default/files/archivio/allegati/comitato%20verde%20pubblico/legge_14_01_2013_10_verde_urbano.pdf); [Regione Emilia-Romagna, la normativa nazionale sugli alberi monumentali, con la circolare 461/2020](https://ambiente.regione.emilia-romagna.it/it/parchi-natura2000/sistema-regionale/alberi-monumentali/allegati/05-la-normativa-nazionale_l-canini.pdf/@@download/file); [ISTAT, istruzioni del questionario Verde 2024](https://www.istat.it/fascicoloSidi/1720/Istruzioni%202024%20-%20Verde.pdf) per la definizione di verde storico.

### 2.7 Altri riferimenti

| Riferimento | Contenuto | Effetto su GreenManager |
|---|---|---|
| UNI EN 1176-7, aree gioco | Tre livelli di ispezione delle attrezzature: visiva ordinaria, con frequenza decisa dal gestore; funzionale, ogni 1–3 mesi; principale, ogni anno. | Se i giochi entrano nel perimetro, seguono lo stesso schema di ispezioni ricorrenti degli alberi. I CAM consigliano di censirli già al livello 2; GreenSpaces li gestisce con un prodotto apposito (PLAY). |
| D.Lgs. 150/2012 e PAN (DM 22/01/2014) | Nelle aree frequentate dalla popolazione: difesa integrata, informazione preventiva, operatori con certificato di abilitazione. I CAM li richiamano. | Il trattamento è un intervento con dati propri: prodotto, dose, area trattata, operatore abilitato, avviso al pubblico. Gli obblighi di registrazione vanno verificati se i trattamenti entrano nell'MVP. |
| Reg. (UE) 2024/1991 sul ripristino della natura, art. 8 | Entro il 2030 nessuna perdita netta, a livello nazionale, di verde urbano e di copertura arborea urbana rispetto al 2024; dal 2031 una tendenza in crescita. Si misura con i dati satellitari Copernicus (ISPRA). L'Italia ha inviato la bozza del piano nazionale a settembre 2026; i comuni sono tra gli attuatori. | Nessun obbligo diretto di dati per il singolo comune, ma la copertura arborea diventa un indicatore politico. Il diametro della chioma e le superfici delle aree permettono di calcolarla sul patrimonio censito. |
| D.Lgs. 36/2023, codice dei contratti pubblici, art. 57 | Rende obbligatori i CAM negli appalti pubblici. | Vedi §2.3. |

Fonti: [CATAS, superfici e ispezioni delle aree gioco](https://catas.com/uploads/media/catas-sup-parchi.pdf); [ISPRA, art. 8 del Regolamento sul ripristino della natura](https://www.isprambiente.gov.it/it/ripristino-della-natura/il-pnr-negli-interventi/art-8-ripristino-degli-ecosistemi-urbani); [invio della bozza del piano italiano](https://www.edilportale.com/news/2026/09/ambiente/piano-di-ripristino-della-natura-bozza-italiana-alla-ue_112023_52.html).

### 2.8 Sintesi: requisiti dal contesto normativo

Requisiti da portare nella matrice delle feature (§3) e allo Step 3.

| ID | Requisito | Forza | Fonte | Lacuna o domanda |
|---|---|---|---|---|
| N1 | Anagrafica delle aree con perimetro, classificazione d'uso, classificazione ISTAT, intensità di fruizione, date di inizio e fine gestione. Il perimetro può essere fittizio (aree stradali) ed è allora escluso dalle superfici. | appalti | CAM, livello 1 | L1; domanda 1 |
| N2 | Catasto degli alberi con i campi minimi dei CAM: codice, area, posizione, specie, diametro a 1,30 m, altezza, diametro della chioma, fase di sviluppo, protezione, rilevatore, data del rilievo. | legge, appalti | L. 10/2013; CAM, livello 2 | L3 |
| N3 | Data di messa a dimora (o di posa) e di rimozione per ogni elemento e area, per contare il patrimonio a una data qualsiasi. | legge, appalti | L. 10/2013; CAM; modello dati | L5 |
| N4 | Bilancio arboreo per un periodo: alberi all'inizio e alla fine, piantati, abbattuti; stato e manutenzione delle aree. Calcolabile ogni anno. | legge | L. 10/2013; linea guida 2025 | — |
| N5 | Causa dell'abbattimento strutturata: rischio o malattia (anche da valutazione), evento atmosferico, altro. | statistica | ISTAT | L12 |
| N6 | Alberi dedicati (nuovi nati, celebrazioni): dedica, data della registrazione, scadenza di 6 mesi, specie e luogo da comunicare. | legge | L. 113/1992 | domanda 7 |
| N7 | Vincoli su alberi, filari e aree (monumentale, storico, quarantena), con il riferimento all'elenco o all'atto. | legge | L. 10/2013, art. 7; D.Lgs. 42/2004 | L6 |
| N8 | Interventi soggetti a comunicazione o autorizzazione, con gli estremi dell'atto e la rendicontazione finale. | legge | circolare 461/2020; D.Lgs. 42/2004 | L6; domanda 8 |
| N9 | Valutazioni di stabilità o di rischio come osservazioni strutturate: protocollo da catalogo, tipo, valutatore, classe, data di ricontrollo, prescrizioni, relazione firmata e allegati. | standard, linea guida | SIA; linea guida 2025; CONAF | L16; domanda 6 |
| N10 | Ricontrollo programmato in base alla classe; prescrizioni che generano interventi con scadenza; nuova valutazione dopo l'intervento. | standard | SIA | L13 |
| N11 | Bersagli e frequenza d'uso come dati di contesto, fissati dal gestore. | linea guida | CONAF; linea guida 2025; Aretè | L6; L16 |
| N12 | Storico non modificabile di valutazioni e interventi, con autore e data. | legge (indiretta) | art. 2051 c.c.; CONAF | L7; L17 |
| N13 | Import ed export secondo il modello dati CAM v2.1: codici `TXYYZZZ`, shapefile, RDN2008. | appalti, standard | CAM; modello dati | L21; domanda 10 |
| N14 | Aggiornamento del censimento dell'ente da parte della ditta, a seguito degli interventi. | appalti | CAM | domanda 3 |
| N15 | Rapporto periodico annuale della ditta all'ente. | appalti | CAM | domanda 3 |
| N16 | Livello di manutenzione per area (gestione differenziata), da cui derivano le frequenze degli interventi ricorrenti. | appalti | CAM | domanda 8 dello Step 1 |
| N17 | Campagna di controllo dopo un evento meteo straordinario. | linea guida | linea guida 2025 | — |
| N18 | Ispezioni ricorrenti delle attrezzature gioco. | standard | UNI EN 1176-7 | perimetro |
| N19 | Dati dei trattamenti fitosanitari e avviso al pubblico. | legge | D.Lgs. 150/2012; PAN; CAM | L12 |
| N20 | Indicatori: numero di alberi, superfici per tipologia ISTAT, copertura arborea. | statistica, linea guida | ISTAT; linea guida 2025; Reg. (UE) 2024/1991 | — |

**Effetti sullo Step 1.**
- **Lacune**:
  - L3 (dati dendrometrici) ha ora un contenuto minimo (N2);
  - L6 (contesto e vincoli) si divide in vincoli (N7, N8) e bersagli (N11);
  - L16 (valutazione strutturata) ha uno schema (N9, N10);
  - L12 (dati degli interventi) guadagna la causa dell'abbattimento, gli estremi delle autorizzazioni e i dati dei trattamenti (N5, N8, N19). Il resto (costi, ore, materiali) dipende dal posizionamento (domanda 3).
- **Decisioni**:
  - le fonti sono coerenti con D-002 (posizione del singolo albero, aree come poligoni) e con D-006 (la classe determina la geometria);
  - confermano D-007; la linea guida del 2025 aggiunge che i dati del censimento e le valutazioni vanno tenuti separati;
  - arricchiscono D-008: un intervento può richiedere un atto prima dell'esecuzione.

**Decisioni.** Dal contesto normativo vengono tre decisioni, registrate alla chiusura del passo (§5.1):
- la classificazione ISTAT come classificazione standard dell'area, accanto a una classificazione d'uso configurabile e all'intensità di fruizione (D-009, domanda 1);
- i protocolli di valutazione come catalogo, con le CPC della SIA precaricate e la possibilità di aggiungere bersagli e livello di rischio (D-010, domanda 6);
- import ed export compatibili con il modello dati CAM v2.1 (D-011, domanda 10).

**Termini emersi.** Quelli adottati sono registrati nel [glossario](glossario.md); vedi §5.2.

| Termine | Significato | Fonte |
|---|---|---|
| Catasto degli alberi | Censimento degli alberi pubblici richiesto dalla L. 10/2013; corrisponde al livello 2 dei CAM | L. 10/2013; CAM |
| Bilancio arboreo | Confronto tra gli alberi pubblici all'inizio e alla fine del mandato del sindaco, con lo stato delle aree verdi | L. 10/2013 |
| Livello di censimento | Grado di dettaglio del censimento secondo i CAM: 1 aree, 2 alberi, 3 tutti gli elementi | CAM |
| Area fittizia | Area di gestione disegnata per comodità, che non corrisponde a una superficie gestita (es. un viale di cui si gestiscono solo gli alberi) | CAM; modello dati |
| Classificazione ISTAT | Tipologia di verde urbano usata dall'ISTAT (verde storico, verde attrezzato…) | ISTAT |
| Intensità di fruizione | Quanto un'area è frequentata; orienta priorità e livello di manutenzione | CAM |
| Gestione differenziata | Livelli di manutenzione diversi secondo tipologia e fruizione dell'area | CAM |
| Fase di sviluppo | Stadio dell'albero: nuovo impianto, giovane, adulto, senescente | CAM |
| Albero monumentale | Albero, filare o alberata iscritto nell'elenco nazionale; gli interventi richiedono comunicazione o autorizzazione | L. 10/2013 |
| Valutazione di stabilità | Esame dell'albero che ne stabilisce la propensione al cedimento (VTA, VSA) | SIA |
| Classe di propensione al cedimento (CPC) | Classe A–D della SIA che esprime la pericolosità dell'albero e fissa il controllo successivo | SIA |
| Bersaglio | Persona o bene che un albero può colpire cadendo | CONAF; Aretè |
| Prescrizione | Intervento indicato dal valutatore, con un termine | SIA |
| Gestore, valutatore | Chi decide il rischio accettabile e gli interventi; chi valuta l'albero | linea guida 2025 |
| Vincolo | Tutela che limita gli interventi su un elemento o un'area (monumentale, storico, quarantena) | L. 10/2013; D.Lgs. 42/2004 |

## 3. Matrice delle feature

La matrice mette a confronto le feature dei prodotti (§1) e i requisiti normativi (§2.8), e dice per ognuna se è candidata per GreenManager. Le priorità (MVP, v2, futuro) si decidono allo Step 3.

**Come leggerla.**
- Le righe sono raggruppate per area funzionale. L'identificativo (C1, V3…) serve a citarle allo Step 3.
- Le colonne sono dieci prodotti, scelti per coprire i segmenti di §1.2. Gli altri prodotti compaiono nelle note.
- Simboli:
  - ● la feature c'è, secondo il produttore;
  - ◐ c'è in parte, oppure solo in un modulo o in un prodotto a pagamento;
  - – le fonti non la indicano. Come in §1, non vuol dire che manchi.
- **Candidata**:
  - **sì**: candidata per GreenManager;
  - **forse**: dipende da una domanda aperta o da una scelta dello Step 3, indicata nelle note;
  - **no**: non candidata, con il motivo.
- Nelle note, N, L e D rimandano ai requisiti di §2.8, alle lacune dello Step 1 e al [registro delle decisioni](decisioni.md). "Domanda n" è una domanda aperta di questo documento.

| Sigla | Prodotto | Segmento (§1.2) |
|---|---|---|
| GS | GreenSpaces (R3GIS) | A |
| GI | GINVE.CLOUD (Futura Sistemi) | A |
| FI | Fitos (SuPerAlberi) | B |
| GG | Gestionali italiani per giardinieri (scheda di gruppo) | C |
| TP | TreePlotter (PlanIT Geo), con i moduli e i prodotti della famiglia | A, C |
| TK | TreeKeeper (Davey) | A |
| ES | ArcGIS Tree Management (Esri) | A |
| EZ | Ezytreev | A |
| AK | Arbokat | A |
| AN | ArborNote | C |

### 3.1 Censimento

| ID | Feature | GS | GI | FI | GG | TP | TK | ES | EZ | AK | AN | Candidata | Note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| C1 | Inventario georeferenziato degli alberi | ● | ● | ● | – | ● | ● | ● | ● | ● | ● | sì | D-002; N2 |
| C2 | Elementi lineari e areali: siepi, filari, prati, aiuole | ● | ● | – | – | – | ◐ | – | ● | – | – | sì | D-002; CAM, livello 3 |
| C3 | Arredi e altri beni non vegetali | ● | ● | – | – | ◐ | ● | – | ● | – | – | sì | Elementi non vegetali (D-006); CAM, livello 3. TP: prodotto PARKS |
| C4 | Elementi di gruppo con più specie (macchie, fioriere) | ● | – | – | – | – | – | – | – | – | – | forse | Domanda 3 dello Step 1 → Step 3 |
| C5 | Dati dendrometrici: diametro, altezza, chioma, multitronco | ● | ● | ● | – | – | – | – | – | – | – | sì | N2; L3 |
| C6 | Attributi definiti dall'utente | ◐ | – | – | – | ● | ● | – | – | – | – | forse | Step 4: attributi fissi per classe di elemento (D-006) o definiti dall'utente. GS: configurati dal produttore |
| C7 | Codice leggibile e targhetta sull'elemento (cartellino, QR code) | ● | ● | – | – | – | – | – | – | – | – | sì | L2; il cartellino è nella linea guida 2025 |
| C8 | Catalogo delle specie ammesse, con il ritiro delle specie | – | – | – | – | – | – | ● | – | – | – | sì | D-005; D-006 |
| C9 | Ciclo di vita: date di posa e di rimozione, storico dell'elemento | ● | – | – | – | – | – | ◐ | – | – | – | sì | N3; L5. ES: stato del posto d'impianto |
| C10 | Posto d'impianto con stato proprio | ● | – | – | – | – | – | ● | – | – | – | forse | Domanda 5 |
| C11 | Anagrafica delle aree secondo i CAM: classificazioni, fruizione, perimetro fittizio | ● | ◐ | – | – | – | – | – | – | – | – | sì | N1; D-009. GI dichiara la conformità ai CAM senza dettagli |
| C12 | Vincoli di tutela su alberi e aree | ● | – | – | – | – | – | – | ● | – | – | sì | N7; L6. GS: alberi monumentali; EZ: TPO |
| C13 | Alberi dedicati ai nuovi nati | ● | – | – | – | – | – | – | – | – | – | sì | N6; domanda 7 |
| C14 | Alberi privati che interferiscono con strade e reti | – | – | – | – | – | – | – | ● | – | – | no | È un procedimento verso terzi, non la gestione del proprio verde |

### 3.2 Mappa e GIS

| ID | Feature | GS | GI | FI | GG | TP | TK | ES | EZ | AK | AN | Candidata | Note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| G1 | Mappa web degli elementi e delle aree | ● | ● | ● | – | ● | ● | ● | ● | ● | ● | sì | L1 |
| G2 | Mappe tematiche (es. alberi da abbattere) | – | ● | – | – | – | – | – | – | – | – | sì | |
| G3 | API e servizi verso altri GIS (WFS, ArcGIS) | – | – | – | – | ● | ● | ● | – | ● | ● | forse | Priorità allo Step 3. TK: Cartegraph, Cityworks |

### 3.3 Stato e valutazioni

| ID | Feature | GS | GI | FI | GG | TP | TK | ES | EZ | AK | AN | Candidata | Note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| V1 | Ispezioni datate, con lo storico dell'elemento | ● | ● | ● | – | ● | – | ● | ● | ● | – | sì | D-007; L14 |
| V2 | Valutazione di stabilità strutturata | ● | ● | ● | – | ● | – | – | ● | ● | – | sì | N9; L16. GS: VTA; GI: QTRA, Aretè; FI: CPC; TP: di base, TRAQ e QTRA a modulo; EZ: QTRA; AK: FLL |
| V3 | Più protocolli o scheda configurabile | ● | ◐ | – | – | ◐ | – | – | ● | – | – | sì | N9; D-010. GS, EZ: scheda o criteri dell'utente; GI, TP: più metodi a scelta |
| V4 | Rischio con bersagli | ● | ● | – | – | ◐ | – | – | ● | – | – | sì | N11 |
| V5 | Valutazione fitosanitaria strutturata | – | – | ● | – | – | – | ● | – | – | – | sì | Parametro A delle linee guida CONAF |
| V6 | Analisi strumentali e referti collegati | ● | – | – | – | – | – | – | – | – | – | sì | N9. Anche Al-beri |
| V7 | Ricontrollo programmato secondo l'esito | ● | – | – | – | – | – | – | ◐ | – | – | sì | N10. EZ: ispezioni sistematiche pianificate |
| V8 | Esito aggiornato dopo l'intervento | – | ● | – | – | – | – | – | – | – | – | sì | N10; L13 |
| V9 | Campagna di controllo dopo un evento meteo | – | – | – | – | – | – | – | – | – | – | sì | N17 |
| V10 | Valore dell'albero (CTLA, valore ornamentale) | – | – | – | – | ◐ | – | – | ● | – | – | forse | Parametro D delle linee guida CONAF; priorità allo Step 3. Anche Cartegraph |
| V11 | Tracciabilità di controlli e modifiche: chi, quando | ◐ | – | ● | – | – | – | – | – | ● | – | sì | N12; L7; L17 |

### 3.4 Pianificazione degli interventi

| ID | Feature | GS | GI | FI | GG | TP | TK | ES | EZ | AK | AN | Candidata | Note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| I1 | Interventi pianificati su elementi e aree, con calendario | ● | ● | – | ● | ◐ | ● | ● | ● | ◐ | ● | sì | D-008. GS: Gantt; AK: misure da prendere |
| I2 | Interventi ricorrenti e piani pluriennali | – | – | – | ◐ | – | – | – | – | – | ● | sì | N16; L10; domanda 8 dello Step 1. GG: contratti di manutenzione; anche Aspire |
| I3 | Interventi generati da valutazioni e segnalazioni | ● | ◐ | – | – | ◐ | ◐ | ● | ◐ | – | – | sì | N10; L13 |
| I4 | Effetto dell'intervento sul censimento (abbattimento, messa a dimora) | – | – | – | – | – | – | ◐ | – | – | – | sì | N3; N14; L13. ES: stato del posto d'impianto |
| I5 | Atto autorizzativo prima dell'esecuzione | – | – | – | – | – | – | – | ◐ | – | – | sì | N8; domanda 8. EZ: istruttoria sugli alberi tutelati |
| I6 | Validazione dei lavori da parte del committente | ● | – | – | – | – | – | – | – | – | – | forse | Domanda 3 |

### 3.5 Esecuzione in campo

| ID | Feature | GS | GI | FI | GG | TP | TK | ES | EZ | AK | AN | Candidata | Note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| E1 | Incarico a squadre o appaltatori (ordine di lavoro) | ● | ● | – | ● | ◐ | ● | ● | ● | – | ● | sì | Esecutore dell'intervento (D-008). La forma dell'ordine dipende dalla domanda 3 |
| E2 | Registrazione dell'eseguito in campo, con foto | ● | ● | – | ● | ● | ● | ● | ● | – | ● | sì | D-008; L15 |
| E3 | Foto prima e dopo l'intervento | – | ● | – | – | – | – | – | – | – | – | sì | |
| E4 | Avanzamento degli interventi in tempo reale | – | ● | – | – | – | – | – | – | – | – | sì | Viene con l'uso online (D-004) |
| E5 | Ore, materiali e mezzi per intervento | ◐ | – | – | ● | – | – | – | – | – | – | forse | L12; domanda 3. GS: modulo WORKS; anche Cartegraph |
| E6 | Rapportino firmato dal cliente | – | – | – | ● | – | – | – | – | – | ● | forse | Domanda 3 |
| E7 | Dati dei trattamenti fitosanitari | – | – | – | – | – | – | – | – | – | ● | sì | N19 |
| E8 | Causa dell'abbattimento | – | – | – | – | – | – | – | – | – | – | sì | N5 |
| E9 | Flotta e posizione dei mezzi | – | ● | – | – | – | – | – | – | – | – | no | Fuori dal dominio del verde; al più un'integrazione. Anche ArboStar |

### 3.6 Segnalazioni e controllo di qualità

| ID | Feature | GS | GI | FI | GG | TP | TK | ES | EZ | AK | AN | Candidata | Note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| S1 | Segnalazioni dal campo, con posizione e foto | ● | ● | – | – | – | – | ● | – | – | – | sì | Possono diventare interventi (I3) |
| S2 | Richieste e reclami dei cittadini | – | – | – | – | ◐ | ● | ● | ● | – | – | forse | Domanda 11. TP: nel modulo degli ordini di lavoro |
| S3 | Non conformità sui lavori della ditta | ● | – | – | – | – | – | – | – | – | – | forse | Domanda 3 |

### 3.7 Economia degli interventi

| ID | Feature | GS | GI | FI | GG | TP | TK | ES | EZ | AK | AN | Candidata | Note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| X1 | Prezzario e costo calcolato dalla geometria | ● | ● | – | ◐ | – | – | – | – | – | – | forse | Domanda 3. GI: computi metrici; GG: catalogo delle lavorazioni; anche CENSIFLORA |
| X2 | SAL e pagamenti all'appaltatore | ● | – | – | – | – | – | – | – | – | – | forse | Domanda 3 |
| X3 | Preventivi | – | ● | – | ● | ◐ | – | – | – | – | ● | forse | Domanda 3. TP: modulo degli ordini di lavoro e prodotto JOBS |
| X4 | Budget e costi a consuntivo | – | – | – | ● | ◐ | – | – | ● | – | ● | forse | Domanda 3; L12 |

### 3.8 Gestione d'impresa

| ID | Feature | GS | GI | FI | GG | TP | TK | ES | EZ | AK | AN | Candidata | Note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| B1 | Clienti e CRM | – | – | – | ● | ◐ | – | – | – | – | ● | forse | Domanda 3. Il committente serve comunque (domanda 4 dello Step 1) |
| B2 | Contratti di manutenzione | – | – | – | ● | – | – | – | – | – | – | forse | Domanda 3. Anche Aspire |
| B3 | Proposte commerciali generate dall'inventario | – | – | – | – | – | – | – | – | – | ● | forse | Domanda 3 |
| B4 | Fatturazione, magazzino, contabilità | – | – | – | ● | ◐ | – | – | – | – | ◐ | no | Fuori dal dominio del verde; al più un'integrazione. TP, AN: collegamento a QuickBooks |

### 3.9 Altri beni

| ID | Feature | GS | GI | FI | GG | TP | TK | ES | EZ | AK | AN | Candidata | Note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A1 | Giochi, con ispezioni periodiche | ● | ◐ | – | – | – | – | – | – | – | – | forse | N18; domanda 12. GS: prodotto PLAY, tag NFC; GI: solo censimento; anche Demetra |
| A2 | Gestione di impianti: irrigazione, illuminazione | ● | ● | – | – | – | – | – | – | – | – | no | Fuori dal dominio del verde. Gli elementi dell'irrigazione si possono censire come arredi (C3) |

### 3.10 Report, export e import

| ID | Feature | GS | GI | FI | GG | TP | TK | ES | EZ | AK | AN | Candidata | Note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| R1 | Report e statistiche | ● | ● | ● | ◐ | ● | ● | – | – | – | – | sì | F4 dello Step 1. GG: consuntivi di cantiere |
| R2 | Export tabellare e PDF | ● | ● | ● | ● | – | – | – | – | ● | – | sì | L21 |
| R3 | Export GIS: SHP, GeoJSON, KML | ● | ● | – | – | – | – | ● | – | ● | – | sì | L21. ES: nativo in ArcGIS |
| R4 | Formato del modello dati CAM | ● | ◐ | – | – | – | – | – | – | – | – | sì | N13; D-011; domanda 10 |
| R5 | Report normativi: bilancio arboreo, dati ISTAT, rapporto annuale CAM | ◐ | ◐ | – | – | – | – | – | – | – | – | sì | N4; N15; N20. GS e GI dichiarano la conformità alla L. 10/2013; anche SoilSense. Il rapporto annuale dipende dalla domanda 3 |
| R6 | Import di dati GIS (SHP, CAD) | ● | – | – | – | ● | – | ● | – | – | – | sì | L21; domanda 2 dello Step 1 |

### 3.11 Uso in campo

| ID | Feature | GS | GI | FI | GG | TP | TK | ES | EZ | AK | AN | Candidata | Note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| M1 | Uso in campo, con GPS e foto | ● | ● | – | ● | ● | ● | ● | ● | ● | ● | sì | Web responsive, non app nativa (D-004) |
| M2 | Lavoro offline | ● | – | – | – | ◐ | – | ● | – | ● | – | no | D-004; domanda 4. Anche ArboStar |

### 3.12 Servizi ecosistemici e dati da remoto

| ID | Feature | GS | GI | FI | GG | TP | TK | ES | EZ | AK | AN | Candidata | Note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Q1 | Benefici ecosistemici per albero | ◐ | ● | ● | – | ◐ | ● | – | – | – | – | forse | Priorità allo Step 3. Riferimento: i-Tree |
| Q2 | Copertura arborea | – | – | – | – | ◐ | ◐ | – | – | – | – | sì | N20, come indicatore calcolato dal diametro della chioma censito; l'analisi da immagini non è candidata. TP: CANOPY; TK: Canopy |
| Q3 | Censimento o monitoraggio da scansioni e immagini | – | – | – | – | – | – | – | – | – | – | no | Fonti di dati esterne, da importare (§1.5, punto 13): greehill, SCM, Al-beri |

### 3.13 Portale pubblico

| ID | Feature | GS | GI | FI | GG | TP | TK | ES | EZ | AK | AN | Candidata | Note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| P1 | Mappa pubblica di consultazione | ◐ | – | – | – | ● | – | ● | – | – | – | forse | Domanda 11. GS: modulo GREEN CITY; anche OpenTreeMap e il WebGIS di Pistoia |
| P2 | Censimento partecipativo dei cittadini | – | – | – | – | – | – | – | – | – | – | no | È il modello di OpenTreeMap, oggi dismesso; lontano dalla gestione del verde |

### 3.14 Sintesi della matrice

| Area | sì | forse | no |
|---|---|---|---|
| Censimento | 10 | 3 | 1 |
| Mappa e GIS | 2 | 1 | 0 |
| Stato e valutazioni | 10 | 1 | 0 |
| Pianificazione degli interventi | 5 | 1 | 0 |
| Esecuzione in campo | 6 | 2 | 1 |
| Segnalazioni e controllo di qualità | 1 | 2 | 0 |
| Economia degli interventi | 0 | 4 | 0 |
| Gestione d'impresa | 0 | 3 | 1 |
| Altri beni | 0 | 1 | 1 |
| Report, export e import | 6 | 0 | 0 |
| Uso in campo | 1 | 0 | 1 |
| Servizi ecosistemici e dati da remoto | 1 | 1 | 1 |
| Portale pubblico | 0 | 1 | 1 |
| **Totale (69)** | **42** | **20** | **7** |

**Da cosa dipendono le 20 feature incerte:**
- domanda 3, posizionamento: 11 feature, cioè l'economia, la gestione d'impresa e il rapporto tra committente e ditta (I6, E5, E6, S3, X1–X4, B1–B3);
- domanda 11, accesso pubblico: P1, S2;
- domanda 12, giochi: A1;
- domanda 5, posto d'impianto: C10;
- domanda 3 dello Step 1, elementi di gruppo: C4;
- priorità da fissare allo Step 3: G3, V10, Q1;
- scelta di modellazione dello Step 4: C6.

**Copertura dei requisiti normativi.** Ogni requisito di §2.8 compare in almeno una riga.

| Requisito | Righe | Requisito | Righe |
|---|---|---|---|
| N1 | C11 | N11 | V4 |
| N2 | C1, C5 | N12 | V11 |
| N3 | C9, I4 | N13 | R4 |
| N4 | R5 | N14 | I4 |
| N5 | E8 | N15 | R5 |
| N6 | C13 | N16 | I2 |
| N7 | C12 | N17 | V9 |
| N8 | I5 | N18 | A1 |
| N9 | V2, V3, V6 | N19 | E7 |
| N10 | V7, V8, I3 | N20 | R5, Q2 |

## 4. Indicazioni per lo Step 3

### 4.1 Requisiti di base

Sono le feature presenti nella maggior parte dei prodotti per la gestione del patrimonio (segmento A), o richieste dalla normativa italiana. Senza di esse GreenManager non regge il confronto:
- censimento georeferenziato di alberi e altri elementi, su mappa (C1–C3, G1);
- dati dendrometrici e anagrafica delle aree secondo i CAM (C5, C11);
- ispezioni con lo storico e valutazione di stabilità (V1, V2);
- interventi pianificati, assegnati a un esecutore e registrati in campo con foto (I1, E1, E2, M1);
- report, export tabellari e GIS, import GIS (R1–R3, R6);
- per il mercato italiano: modello dati CAM, report normativi, vincoli e alberi dedicati (R4, R5, C12, C13).

### 4.2 Elementi distintivi

Sono feature presenti in uno o due prodotti, con un valore chiaro per il nostro dominio:
- **ciclo valutazione → intervento → ricontrollo**: ricontrollo programmato secondo l'esito (V7, GreenSpaces) ed esito aggiornato dopo l'intervento (V8, GINVE). Insieme chiudono la lacuna L13;
- **posto d'impianto** (C10, Esri e GreenSpaces): guida le sostituzioni e rende più preciso il bilancio arboreo;
- **protocolli di valutazione configurabili** (V3, GreenSpaces ed Ezytreev): sono la base di D-010;
- **tracciabilità a fini di responsabilità** (V11, Arbokat): in Italia la richiede la custodia dell'albero (§2.5);
- **rapporto tra committente e ditta**: validazione dei lavori, SAL, non conformità (I6, X2, S3). C'è solo in GreenSpaces.

### 4.3 Opportunità di differenziazione

1. **Patrimonio e ditta nello stesso prodotto.** Nessun prodotto analizzato copre insieme la gestione del patrimonio (segmento A) e la gestione d'impresa (segmento C). GreenSpaces non ha clienti e preventivi; i gestionali per giardinieri non hanno il censimento; PlanIT Geo usa due prodotti distinti. È lo spazio più libero, ma anche quello che allarga di più il perimetro: dipende dalla domanda 3.
2. **Rischio secondo le linee guida CONAF.** Le linee guida sono del marzo 2026. I prodotti italiani dichiarano CPC, QTRA o Aretè, e il Comune di Trento attendeva l'adeguamento del proprio software (§2.5). Un catalogo di protocolli con bersagli e livello di rischio (D-010) permette di seguirle da subito.
3. **Requisiti normativi che nessun prodotto dichiara**: causa dell'abbattimento (E8), campagna dopo un evento meteo (V9), atto autorizzativo prima dell'intervento (I5), effetto dell'intervento sul censimento (I4). Possono esistere senza essere pubblicizzati: vanno verificati prima di farne un argomento di vendita.
4. **Avvio semplice.** GreenSpaces richiede set-up e ore di configurazione, mentre un comune come Termoli ha messo a gara circa 5.000 € l'anno (§1.3). Cataloghi precaricati con le classificazioni nazionali (D-005, D-009, D-010) riducono il lavoro di avvio per enti piccoli e ditte.
5. **Privati con verde storico.** Nessuna scheda cita ville e giardini storici privati tra i destinatari. Per loro contano i vincoli e le autorizzazioni (C12, I5; D.Lgs. 42/2004, §2.6).

### 4.4 Tensioni con i vincoli attuali

- **Offline** (M2): i prodotti con app di campo lavorano offline, D-004 lo esclude (domanda 4).
- **Accesso solo per utenti autenticati** (P1, S2): mappe pubbliche e richieste dei cittadini sono diffuse nei prodotti per enti (domanda 11).
- **Vendita alla PA**: la qualificazione ACN dei servizi cloud è fuori perimetro, ma condiziona l'adozione da parte degli enti (§1.5, punto 12).

### 4.5 Dalla matrice ai moduli dello Step 3

Proposta di distribuzione delle righe nei moduli previsti in [03-features.md](03-features.md). Le righe con esito *no* non compaiono; M1 (uso in campo) vale per tutti i moduli.

| Modulo dello Step 3 | Righe della matrice |
|---|---|
| Territorio e aree | C11, C12, G1–G3 |
| Censimento degli elementi | C1–C10, C13 |
| Cataloghi | C8, V3; classificazioni delle aree (D-009) |
| Interventi pianificati ed eseguiti | I1–I5, E1–E4, E7, E8, S1 |
| Monitoraggio dello stato e foto | V1–V11 |
| Report ed export | R1–R6, Q1, Q2 |
| Da aggiungere se lo richiede la domanda 3 | Economia e rapporto con il committente (I6, E5, E6, S3, X1–X4); gestione d'impresa (B1–B3) |
| Da aggiungere se lo richiedono le domande 11 e 12 | Portale pubblico e richieste dei cittadini (P1, S2); giochi (A1) |

### 4.6 Domande da chiudere per prime

La domanda 3 (posizionamento) decide più di metà delle feature incerte e l'esistenza di due moduli: conviene chiuderla per prima allo Step 3. Subito dopo vengono la 4 (offline) e la 11 (accesso pubblico), che toccano vincoli di progetto.

## 5. Esito del passo

Le decisioni e i termini seguenti sono registrati in [decisioni.md](decisioni.md) e nel [glossario](glossario.md).

### 5.1 Decisioni

| ID | Decisione | Motivazione | Stato |
|---|---|---|---|
| D-009 | L'area ha tre classificazioni distinte: la tipologia di verde urbano dell'ISTAT (catalogo fisso), la destinazione d'uso (catalogo configurabile) e l'intensità di fruizione. La categoria Access confluisce nella prima, la tipologia Access nella seconda. | I CAM chiedono tutte e tre al livello 1 del censimento (§2.3). La tipologia ISTAT è stabile e serve alla rilevazione annuale, ma da sola non distingue aree con esigenze di manutenzione diverse (§2.4). | ipotesi, da confermare allo Step 4 |
| D-010 | La valutazione di stabilità o di rischio è un tipo di osservazione (D-007), separata dai dati del censimento. I protocolli sono un catalogo, con le CPC della SIA precaricate e la possibilità di aggiungere protocolli basati sul rischio (bersagli, livello di rischio). | Nessuna legge impone un metodo. Oggi prevalgono le CPC, ma le linee guida CONAF del 2026 e alcuni comuni vanno verso il rischio (§2.5). La linea guida del 2025 tiene separati censimento e valutazione. | ipotesi, da confermare allo Step 4 |
| D-011 | Import ed export compatibili con il modello dati CAM v2.1: codici degli oggetti, attributi, shapefile, sistema di riferimento RDN2008. | I CAM rendono il modello di fatto obbligatorio negli appalti del verde pubblico, e il principale concorrente italiano lo adotta (§2.3). | ipotesi, da confermare allo Step 4 |

Le decisioni precedenti non cambiano stato. Il benchmark e la normativa sono coerenti con D-002, D-006, D-007 e D-008 (§2.8), che restano ipotesi da verificare nei passi indicati. D-004 resta confermata, anche se va in direzione opposta al mercato (domanda 4).

### 5.2 Glossario

- **Termini aggiunti**: Posto d'impianto, Segnalazione, Ricontrollo, Ordine di lavoro, Catasto degli alberi, Bilancio arboreo, Livello di censimento, Area fittizia, Tipologia di verde urbano, Destinazione d'uso, Intensità di fruizione, Livello di manutenzione, Fase di sviluppo, Vincolo, Albero monumentale, Valutazione, Protocollo di valutazione, Classe di propensione al cedimento, Bersaglio, Prescrizione, Gestore, Valutatore, Codice dell'oggetto (modello dati CAM).
- **Voci riviste**: Categoria di area e Tipologia di area, che confluiscono nelle nuove classificazioni (D-009); Osservazione, di cui la valutazione è un tipo (D-010).
- **Termini non aggiunti**: Località, sinonimo di area in GreenSpaces; Prezzario, SAL e Non conformità, che dipendono dalla domanda 3. Le definizioni restano in §1.5.
- **Un'ambiguità da evitare.** In D-008 "bersaglio" indica gli elementi o l'area su cui si fa l'intervento. Nella valutazione del rischio indica chi o che cosa l'albero può colpire. Dallo Step 3 conviene chiamare il primo *oggetto dell'intervento* e riservare *bersaglio* al rischio.

## Domande aperte

Le domande 1 e 6 sono chiuse. Le altre sono rinviate al passo indicato, nel cui documento sono riportate.

Ereditate dallo [Step 1](01-analisi-spec-esistente.md#domande-aperte):
1. **Classificazione delle aree** (domanda 6 dello Step 1): categoria e tipologia vanno tenute distinte o unificate? Conviene adottare una classificazione standard del verde urbano, ad esempio le tipologie usate dall'ISTAT? → **chiusa** da D-009 (ipotesi, da confermare allo Step 4): i CAM chiedono la tipologia ISTAT, da un catalogo fisso, e la destinazione d'uso, da un catalogo configurabile, più l'intensità di fruizione (§2.3, §2.4).
2. **Fonti dei cataloghi** (domanda 1 dello Step 1): il database Access non è disponibile. Da quali fonti si costruiscono i cataloghi iniziali (specie, tipi di intervento, condizioni, periodicità)? → rinviata allo Step 4
   - *Esito dello Step 2*: il benchmark dà le fonti di alcuni cataloghi:
     - classi di elemento: catalogo degli oggetti del modello dati CAM (allegato 1);
     - tipologie di area e cause di abbattimento: ISTAT;
     - classi di valutazione: SIA; tipi ed esiti della valutazione: linea guida 2025;
     - fasi di sviluppo: CAM.

     Restano senza fonte le specie, i tipi di intervento e le periodicità.

Emerse dalle schede dei prodotti:

3. **Posizionamento.** GreenManager copre solo la gestione tecnica del verde (censimento, stato, interventi) o anche la gestione d'impresa della ditta (clienti, preventivi, contratti, fatturazione)? E il rapporto tra committente e ditta (validazione dei lavori, SAL, non conformità)? Vedi §1.2. Dalla risposta dipendono 11 delle 20 feature incerte della matrice (§3.14). → rinviata allo Step 3
4. **Offline.** I principali prodotti con app di campo lavorano offline (§1.5, punto 7). Va confermato D-004, cioè niente offline, almeno per l'MVP? → rinviata allo Step 3
5. **Posto d'impianto.** Il posto d'impianto va modellato come entità distinta dall'albero, con un suo stato? Vedi §1.5, punto 3. → rinviata allo Step 4
6. **Metodi di valutazione del rischio.** Quali supportare (VTA con classi di propensione al cedimento, QTRA, ISA TRAQ), e con una scheda fissa o configurabile? → **chiusa** da D-010 (ipotesi, da confermare allo Step 4): protocolli in un catalogo, con le CPC della SIA precaricate e la possibilità di aggiungere protocolli basati sul rischio (§2.5). Il contenuto della scheda si definisce allo Step 4.

Emerse dal contesto normativo:

7. **Alberi dedicati e dati personali.** Per gli alberi dei nuovi nati si registra il nome del bambino, un riferimento all'atto anagrafico o nessun dato personale? Vedi §2.2. → rinviata allo Step 3
8. **Autorizzazioni.** GreenManager registra solo gli estremi delle comunicazioni e delle autorizzazioni, o gestisce anche il procedimento (istanza, parere, esito)? Vedi §2.6. → rinviata allo Step 3
9. **Valutatore esterno.** Le valutazioni le inserisce il professionista nel sistema, con la scheda del gestore, o si caricano la sua relazione e i suoi dati? Incide sulla firma della relazione e sulla coerenza dei dati nel tempo (§2.5). → rinviata allo Step 3
10. **Modello dati CAM.** I codici del modello dati CAM diventano il catalogo delle classi di elemento, o restano una corrispondenza usata per l'import e l'export? Vedi §2.3 e D-011. → rinviata allo Step 4

Emerse dalla matrice delle feature:

11. **Accesso pubblico.** Lo stack prevede un'applicazione accessibile solo a utenti autenticati, ma diversi prodotti per enti hanno una mappa pubblica e raccolgono le richieste dei cittadini (P1, S2). Il vincolo resta, o serve almeno una consultazione pubblica in sola lettura? → rinviata allo Step 3
12. **Giochi.** Le attrezzature gioco entrano nel perimetro con le loro ispezioni periodiche (UNI EN 1176-7, §2.7), o restano elementi censiti come gli altri arredi? Vedi A1. → rinviata allo Step 3
