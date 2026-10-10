# Registro delle decisioni

Ogni decisione ha un identificativo progressivo e non si cancella. Se viene superata, si aggiunge una nuova decisione e la vecchia passa allo stato *superata da D-xxx*.

Stati possibili:
- *ipotesi*: vale finché non viene verificata nel passo indicato
- *confermata*
- *superata da D-xxx*

---

## D-001 — Lingua della documentazione e del modello

- **Data**: 2026-10-05 · **Passo**: 0 · **Stato**: confermata
- **Decisione**: la documentazione è in italiano. I nomi di entità e campi del modello sono in inglese, con la corrispondenza nel glossario.
- **Motivazione**: il dominio e gli interlocutori sono italiani, mentre il codice Django usa nomi in inglese. Così si evita una traduzione in fase di sviluppo.
- **Alternative scartate**: tutto in italiano; tutto in inglese.

## D-002 — Unità di censimento: elemento georeferenziato

- **Data**: 2026-10-05 · **Passo**: 0 · **Stato**: confermata allo Step 3, con la precisazione di D-018
- **Decisione**: si censisce il singolo elemento con la sua geometria (albero = punto, siepe o filare = linea, prato o aiuola = poligono). Gli elementi sono raggruppati in aree. Servono GIS, PostGIS e GeoDjango.
- **Motivazione**: è lo standard dei prodotti attuali. Permette uno storico per singolo individuo, che serve per il catasto degli alberi (L. 10/2013) e per le ispezioni VTA.
- **Alternative scartate**: censimento per area con quantità per elemento, come nella specifica Access. È più semplice ma non supporta la mappa né lo storico del singolo elemento.

## D-003 — Perimetro del benchmark

- **Data**: 2026-10-05 · **Passo**: 0 · **Stato**: confermata
- **Decisione**: il benchmark copre prodotti italiani ed esteri, più la normativa italiana di settore.
- **Motivazione**: i prodotti esteri mostrano lo stato dell'arte; quelli italiani e la normativa mostrano cosa chiede il mercato locale.
- **Alternative scartate**: solo Italia; solo estero.

## D-004 — Uso in campo: web responsive, online

- **Data**: 2026-10-05 · **Passo**: 0 · **Stato**: superata da D-014
- **Decisione**: l'interfaccia è usabile da smartphone e tablet, con GPS e fotocamera dal browser e connessione sempre richiesta. L'offline resta escluso, ma il modello dati non deve precluderlo (es. UUID come identificativi).
- **Motivazione**: copre il lavoro in campo senza la complessità della sincronizzazione e della gestione dei conflitti.
- **Alternative scartate**: offline-first (PWA); solo uso da ufficio.

## D-005 — Cataloghi gestiti nell'applicazione

- **Data**: 2026-10-05 · **Passo**: 1 · **Stato**: confermata; l'ambito dei cataloghi è deciso da D-016
- **Decisione**: non si crea un database per committente e non si copiano i dizionari. I cataloghi (specie, classi di elemento, tipi di intervento, condizioni, periodicità…) sono gestiti nell'applicazione, precaricati e modificabili. Resta aperto se siano unici per tutto il sistema o personalizzabili per organizzazione (Step 3).
- **Motivazione**: nel software Access la copia dei dizionari compensava la scelta di un database per comune, nata per dare ai comuni un accesso in sola lettura che il web risolve in altro modo. Un sistema unico dà cataloghi coerenti.
- **Alternative scartate**: un database per committente, inizializzato copiando i dizionari da uno esistente (soluzione Access).

## D-006 — Specie separata dalla classe di elemento

- **Data**: 2026-10-05 · **Passo**: 1 · **Stato**: confermata allo Step 4
- **Decisione**: le specie (tassonomia botanica) sono un catalogo separato dalla classe di elemento, che deriva dall'habitus Access. La classe di elemento determina tipo di geometria, unità di misura e attributi da rilevare.
- **Motivazione**: il dizionario elementi Access mette nello stesso elenco specie botaniche e arredi. L'habitus fa già da classe (decide unità di misura e altezza) e si collega in modo naturale alle geometrie di D-002.
- **Alternative scartate**: un unico catalogo di elementi classificati per habitus (soluzione Access).

## D-007 — Stato come osservazione datata

- **Data**: 2026-10-05 · **Passo**: 1 · **Stato**: confermata allo Step 4, con la precisazione di D-028 (anche le misure sono osservazioni)
- **Decisione**: la condizione non è un attributo dell'elemento ma il valore di un'osservazione datata, con autore ed eventuali foto. Lo stato corrente di un elemento è la sua ultima osservazione.
- **Motivazione**: è il terzo pilastro (registro dello stato). Nel software Access la condizione si sovrascrive e lo storico si perde.
- **Alternative scartate**: condizione come attributo dell'elemento, aggiornato a ogni rilievo (soluzione Access).

## D-008 — Interventi con ciclo pianificato → eseguito

- **Data**: 2026-10-05 · **Passo**: 1 · **Stato**: confermata allo Step 3, con le precisazioni di D-012 e D-025
- **Decisione**: l'operazione Access diventa un intervento con ciclo pianificato → eseguito, date, esecutore e bersaglio (uno o più elementi, o un'area). La periodicità diventa una regola che genera interventi pianificati.
- **Motivazione**: è il secondo pilastro (registro delle azioni). Nel software Access le operazioni sono solo raccomandazioni legate a un censimento, con un anno e una periodicità descrittiva.
- **Alternative scartate**: operazioni come raccomandazioni annuali legate al singolo censimento (soluzione Access).

## D-009 — Classificazione delle aree: tipologia ISTAT, destinazione d'uso, intensità di fruizione

- **Data**: 2026-10-05 · **Passo**: 2 · **Stato**: confermata allo Step 4
- **Decisione**: l'area ha tre classificazioni distinte:
  - la tipologia di verde urbano dell'ISTAT, da un catalogo fisso;
  - la destinazione d'uso, da un catalogo configurabile;
  - l'intensità di fruizione.

  La categoria Access confluisce nella tipologia ISTAT, la tipologia Access nella destinazione d'uso.
- **Motivazione**: i CAM chiedono tutte e tre le informazioni al livello 1 del censimento. La tipologia ISTAT è stabile e serve alla rilevazione annuale, ma da sola non distingue aree con esigenze di manutenzione diverse. Vedi §2.3 e §2.4 di [02-benchmark.md](02-benchmark.md).
- **Alternative scartate**: una classificazione unica, ISTAT o libera; categoria e tipologia come nel software Access.

## D-010 — Valutazioni con protocolli a catalogo

- **Data**: 2026-10-05 · **Passo**: 2 · **Stato**: confermata allo Step 4, con una precisazione: nel modello la valutazione è un'entità distinta dall'osservazione, con le stesse regole del registro dello stato, e nasce sempre da un intervento di tipo valutazione (§4.10 di [04-modello-dati.md](04-modello-dati.md))
- **Decisione**: la valutazione di stabilità o di rischio è un tipo di osservazione (D-007), separata dai dati del censimento. Il protocollo di valutazione (classi, intervalli di ricontrollo, parametri) è un catalogo. Le classi di propensione al cedimento della SIA sono precaricate, e si possono aggiungere protocolli basati sul rischio, con bersagli e livello di rischio.
- **Motivazione**: nessuna legge impone un metodo. Oggi in Italia prevalgono le classi SIA, ma le linee guida CONAF del 2026 e alcuni comuni vanno verso la valutazione del rischio: un metodo fissato nel codice invecchierebbe. La linea guida per la gestione della foresta urbana pubblica (2025) chiede di tenere separati censimento e valutazione. Vedi §2.5 di [02-benchmark.md](02-benchmark.md).
- **Alternative scartate**: una scheda fissa con le sole classi SIA; un solo metodo di rischio (QTRA o ISA TRAQ).

## D-011 — Compatibilità con il modello dati CAM

- **Data**: 2026-10-05 · **Passo**: 2 · **Stato**: confermata allo Step 4, con la precisazione di D-030
- **Decisione**: GreenManager importa ed esporta i dati secondo il *Modello dati per il censimento del verde urbano* v2.1, richiamato dai CAM: codici degli oggetti, attributi, shapefile, sistema di riferimento RDN2008. Se i codici diventino il catalogo delle classi di elemento o restino una tabella di corrispondenza è una domanda aperta dello Step 4.
- **Motivazione**: i CAM rendono il modello di fatto obbligatorio negli appalti del verde pubblico, e il principale concorrente italiano lo adotta. Senza compatibilità un ente non può ricevere né consegnare un censimento conforme. Vedi §2.3 di [02-benchmark.md](02-benchmark.md).
- **Alternative scartate**: solo formati generici (CSV, GeoJSON, shapefile senza codifica).

## D-012 — Posizionamento: gestione tecnica e rapporto tra committente ed esecutore

- **Data**: 2026-10-06 · **Passo**: 3 · **Stato**: confermata
- **Decisione**: GreenManager copre la gestione tecnica del verde (censimento, stato, interventi) e il rapporto tra committente ed esecutore quando appartengono a organizzazioni diverse.
  - L'esecutore registra l'eseguito e aggiorna il censimento; il committente valida l'eseguito o lo contesta con una non conformità.
  - Prezzario, computo e SAL sono nel perimetro, ma vengono dopo l'MVP. Fin dall'MVP l'intervento eseguito registra le quantità.
  - Della gestione d'impresa si tiene solo il nucleo tecnico: anagrafica del committente, piano di manutenzione, quantità eseguite. Restano fuori CRM, preventivi, budget e fatturazione.
  - Il ciclo di D-008 si estende con la validazione (pianificato → eseguito → validato), da verificare allo Step 3.
  - La multi-tenancy, fuori perimetro, deve permettere a due organizzazioni di lavorare sullo stesso patrimonio entro i limiti di un affidamento (D-013).
- **Motivazione**: con un solo modello serve le quattro configurazioni organizzative: ente in economia, ente con appalto, ditta per più clienti, privato. È il punto in cui si incontrano i due destinatari, ditte ed enti. Risponde agli obblighi dei CAM sull'aggiornamento del censimento e sul rapporto annuale. La gestione d'impresa è un mercato di prodotti maturi ed economici, lontano dai tre pilastri. Vedi §1.2 e §2 di [03-features.md](03-features.md).
- **Alternative scartate**: solo gestione tecnica, con il committente in sola consultazione; gestione tecnica e gestione d'impresa; tutte e due le estensioni.

## D-013 — Committente e affidamento

- **Data**: 2026-10-06 · **Passo**: 3 · **Stato**: confermata allo Step 4, con la precisazione di D-032
- **Decisione**:
  - il committente è un soggetto del dominio, distinto dall'organizzazione che usa il sistema. Aree ed elementi appartengono a un committente; una ditta gestisce il verde di più committenti;
  - l'affidamento lega un committente a un esecutore per un insieme di aree, un periodo e, se serve, alcuni tipi di intervento. Ha una modalità: in economia, in appalto, in adozione o sponsorizzazione;
  - l'intervento indica l'esecutore concreto (squadra, operatore) dentro l'affidamento.

  Allo Step 4 va verificato se basta il committente o serve anche il proprietario dell'area. I due non coincidono quando un'azienda pubblica gestisce il verde per conto del comune e affida i lavori a una ditta.
- **Motivazione**: chiude le domande 4 e 5 dello Step 1. Il dizionario Access degli affidamenti mescolava la modalità di gestione e chi esegue: la modalità va nell'affidamento, l'esecutore concreto nell'intervento. L'affidamento dà anche alla multi-tenancy il perimetro entro cui un esecutore esterno lavora sul patrimonio del committente (D-012). Vedi §2.4 di [03-features.md](03-features.md).
- **Alternative scartate**: committente come semplice attributo dell'area; affidamento come catalogo di modalità (soluzione Access).

## D-014 — Uso in campo: online nell'MVP, offline in v2

- **Data**: 2026-10-06 · **Passo**: 3 · **Stato**: confermata. Supera D-004.
- **Decisione**:
  - l'interfaccia è web responsive, usabile da smartphone e tablet con GPS e fotocamera dal browser;
  - nell'MVP la connessione è richiesta;
  - in v2 la raccolta in campo funziona anche senza rete, sui dati scaricati prima di uscire: censimento, osservazioni, valutazioni, eseguito e segnalazioni. Si sincronizza al ritorno della connessione;
  - il modello dati prevede l'offline fin dall'MVP: UUID come identificativi, autore e data di ogni modifica.
- **Motivazione**: quasi tutti i prodotti con un'app di campo lavorano offline (Step 2, §1.5, punto 7), e in parchi, boschi e aree periurbane la copertura non è garantita. Rinviare l'offline alla v2 tiene fuori dall'MVP sincronizzazione e conflitti; prevederlo nel modello evita di rifarlo. Vedi TR-7 di [03-features.md](03-features.md).
- **Alternative scartate**: sempre online, con l'offline senza una versione prevista; offline già nell'MVP.

## D-015 — Mappa pubblica in sola lettura

- **Data**: 2026-10-06 · **Passo**: 3 · **Stato**: confermata
- **Decisione**: oltre all'applicazione per gli utenti autenticati, l'MVP ha una mappa pubblica in sola lettura per committente, senza autenticazione.
  - Il committente sceglie se pubblicarla e cosa: aree, elementi con i dati del censimento, interventi programmati o in corso.
  - Non si pubblicano valutazioni, non conformità, dati economici, allegati e dati personali.
  - In v2 i cittadini inviano segnalazioni dalla mappa, e c'è la scheda pubblica dell'albero dedicato. Fino ad allora le segnalazioni dei cittadini le registra il personale.

  Cambia un vincolo dello stack: il frontend non è più accessibile solo agli utenti autenticati.
- **Motivazione**: mappe pubbliche e richieste dei cittadini sono diffuse nei prodotti per enti (TreePlotter, Esri, GreenSpaces; Step 2, §4.4), e alcuni comuni le offrono già (Pistoia). Servono alla trasparenza dell'ente, all'informazione sui lavori e, in v2, alla comunicazione degli alberi dedicati. Escludere valutazioni e dati personali evita di esporre giudizi sul rischio, che comportano responsabilità, e dati di minori. Vedi §3.11 di [03-features.md](03-features.md).
- **Alternative scartate**: solo utenti autenticati, con la mappa pubblica in v2; solo utenti autenticati, con la pubblicazione affidata all'export.

## D-016 — Cataloghi di sistema con estensioni dell'organizzazione

- **Data**: 2026-10-06 · **Passo**: 3 · **Stato**: confermata. La rappresentazione nel modello si definisce allo Step 4.
- **Decisione**: chiude la domanda 10 dello Step 1, lasciata aperta da D-005.
  - I cataloghi di sistema sono precaricati e uguali per tutti, curati da chi gestisce il sistema.
  - Ogni organizzazione aggiunge voci proprie e nasconde le voci di sistema che non usa. Non modifica le voci di sistema.
  - I cataloghi che vengono da fonti esterne sono fissi, senza voci dell'organizzazione: tipologie ISTAT, fasi di sviluppo, codici del modello dati CAM.

  Cosa sia un'organizzazione lo decide la multi-tenancy, fuori perimetro.
- **Motivazione**: le voci di sistema danno dati confrontabili tra committenti ed export coerenti con ISTAT e CAM. Le estensioni evitano che ogni cultivar o tipo di intervento particolare passi da chi gestisce il sistema. Nascondere una voce invece di cancellarla lascia validi i dati storici. Vedi CT-1 di [03-features.md](03-features.md).
- **Alternative scartate**: un catalogo unico per tutto il sistema; una copia modificabile per organizzazione, simile alla copia dei dizionari Access scartata da D-005.

## D-017 — Attrezzature gioco: censite nell'MVP, ispezioni in v2

- **Data**: 2026-10-06 · **Passo**: 3 · **Stato**: confermata
- **Decisione**: nell'MVP le attrezzature gioco sono elementi censiti come gli altri arredi, con una classe di elemento propria. In v2 entrano le ispezioni periodiche secondo UNI EN 1176-7 (visiva ordinaria, funzionale, principale), con il meccanismo delle valutazioni: protocollo a catalogo, esito, ricontrollo programmato (D-010).
- **Motivazione**: i CAM consigliano di censire i giochi già al livello 2, e le ispezioni sono ricorrenti come i ricontrolli degli alberi, quindi il meccanismo è lo stesso. Rinviarle tiene fuori dall'MVP un dominio diverso, la sicurezza delle attrezzature, che GreenSpaces vende come prodotto separato (PLAY). Vedi ST-13 di [03-features.md](03-features.md).
- **Alternative scartate**: giochi solo censiti, senza ispezioni; ispezioni già nell'MVP.

## D-018 — Elementi di gruppo con composizione di specie

- **Data**: 2026-10-06 · **Passo**: 3 · **Stato**: confermata allo Step 4
- **Decisione**: chiude la domanda 3 dello Step 1 e precisa D-002.
  - Un elemento lineare o areale (siepe mista, aiuola, macchia arbustiva, bosco, gruppo di alberi non rilevati uno per uno) può avere una composizione: un elenco di specie con la quantità o la percentuale di ciascuna.
  - L'elemento resta l'unità di censimento, con la sua geometria e il suo storico: non esistono elementi senza posizione.
  - Gli alberi del catasto (livello 2 dei CAM) si censiscono uno per uno.
- **Motivazione**: conferma D-002 senza perdere i casi reali. Siepi miste, aiuole e macchie hanno più specie (GreenSpaces; Step 2, §1.5, punto 4), e un'area boschiva non si censisce albero per albero. Il modello dati CAM rappresenta già questi oggetti come linee e superfici. Vedi §5.1 di [03-features.md](03-features.md).
- **Alternative scartate**: elementi di gruppo con una quantità e senza geometria (censimento Access); solo elementi con una specie.

## D-019 — Zone e aree

- **Data**: 2026-10-06 · **Passo**: 3 · **Stato**: confermata allo Step 4, con la precisazione di D-035: un'area può essere multiparte, quindi le parti di un parco separate da una strada possono anche formare una sola area
- **Decisione**: chiude la domanda 7 dello Step 1.
  - Sopra l'area c'è un solo livello facoltativo, la zona (quartiere, circoscrizione, complesso di un cliente). Sostituisce la macroarea Access e corrisponde alla zona del modello dati CAM.
  - Le aree dello stesso committente non si sovrappongono. Le parti di un parco sono aree distinte della stessa zona.
  - Altri raggruppamenti si ottengono con i filtri e con la ricerca dentro un'area disegnata.
- **Motivazione**: i CAM chiedono aree non sovrapposte, perché su di esse si calcolano le superfici: aree annidate verrebbero contate due volte. Un livello copre i casi noti, le macroaree Access e i municipi. Vedi AR-4 di [03-features.md](03-features.md).
- **Alternative scartate**: macroarea come dizionario (Access); gerarchia di aree a più livelli.

## D-020 — Regole di ricorrenza e piano degli interventi

- **Data**: 2026-10-06 · **Passo**: 3 · **Stato**: confermata allo Step 4, con la precisazione di D-033
- **Decisione**: chiude la domanda 8 dello Step 1.
  - La regola di ricorrenza ha un tipo di intervento, un oggetto (un'area, o gli elementi di alcune classi in un'area), una frequenza (n volte in un periodo) o un intervallo (ogni n anni), una finestra stagionale e un affidamento.
  - Gli interventi non si generano in automatico. Il gestore genera il piano di un periodo, lo rivede e lo conferma; solo gli interventi confermati arrivano all'esecutore.
  - Rigenerare il piano non duplica gli interventi confermati. Una regola modificata vale per gli interventi non ancora confermati.
  - Ricontrolli e prescrizioni non sono ricorrenze: le loro scadenze vengono dalle valutazioni.
  - In v2 i livelli di manutenzione raccolgono più regole in un modello da applicare a più aree (gestione differenziata dei CAM).
- **Motivazione**: il piano annuale è il documento su cui ente e ditta si accordano (piano di manutenzione dei CAM), e va rivisto prima di diventare lavoro assegnato. Una generazione automatica riempirebbe il calendario di interventi da correggere uno per uno. Vedi IN-3 e lo scenario 4.3 di [03-features.md](03-features.md).
- **Alternative scartate**: periodicità descrittiva (Access); generazione automatica e continua degli interventi.

## D-021 — Osservazioni anche sulle aree

- **Data**: 2026-10-06 · **Passo**: 3 · **Stato**: confermata allo Step 4
- **Decisione**: chiude la domanda 9 dello Step 1 ed estende D-007. Un'osservazione datata, con condizione, note, foto e autore, può riguardare un'area (es. stato del prato, danni, pulizia). Le valutazioni di stabilità e di rischio restano sugli elementi.
- **Motivazione**: le note di valutazione delle aree Access (report R2) diventano uno storico. Lo stato di un'area serve anche al committente per controllare il servizio, prima di aprire una non conformità. Vedi ST-2 di [03-features.md](03-features.md).
- **Alternative scartate**: note testuali sull'area (Access); osservazioni solo sugli elementi.

## D-022 — Valutatore esterno

- **Data**: 2026-10-06 · **Passo**: 3 · **Stato**: confermata allo Step 4
- **Decisione**: chiude la domanda 9 dello Step 2. La valutazione si registra in due modi, con lo stesso contenuto minimo (protocollo, tipo, valutatore, data, classe o esito, data di ricontrollo, prescrizioni):
  - il valutatore la inserisce nel sistema con la scheda del gestore, anche se appartiene a un'altra organizzazione;
  - il gestore inserisce i dati minimi e allega la relazione del valutatore.

  La relazione firmata è sempre un allegato: il sistema non gestisce la firma digitale. Come per l'esecutore (D-012), la multi-tenancy deve permettere a un valutatore esterno di lavorare sugli alberi del suo incarico.
- **Motivazione**: la linea guida del 2025 chiede che il gestore usi la propria scheda, per avere dati coerenti anche se cambiano i valutatori. Molti incarichi però si chiudono con la consegna di una relazione, e il professionista non sempre lavora nel sistema del cliente. Il contenuto minimo comune mantiene attivi ricontrolli, prescrizioni e report. Vedi ST-5 di [03-features.md](03-features.md).
- **Alternative scartate**: solo inserimento da parte del valutatore; solo caricamento della relazione.

## D-023 — Alberi dedicati senza dati anagrafici

- **Data**: 2026-10-06 · **Passo**: 3 · **Stato**: confermata allo Step 4. La verifica sui dati personali è in §4.9 di [04-modello-dati.md](04-modello-dati.md): il testo della dedica si pubblica solo con il consenso registrato della famiglia; resta una verifica legale prima del rilascio
- **Decisione**: chiude la domanda 7 dello Step 2.
  - Per l'albero dedicato a un nuovo nato o a un minore adottato non si registrano dati anagrafici del bambino.
  - Si registrano: tipo di dedica, data della registrazione anagrafica (da cui la scadenza dei 6 mesi), un riferimento fornito dall'ufficio anagrafe e un testo della dedica facoltativo, scelto dalla famiglia, che si può pubblicare.
  - Per gli alberi celebrativi si registra il donatore: persona, impresa o associazione.
- **Motivazione**: per gli obblighi della L. 113/1992 (scadenza, specie e luogo da comunicare, numero per l'ISTAT) bastano la data e un riferimento. Il legame con la persona resta all'anagrafe, che lo ha già e che comunica alla famiglia specie e luogo (art. 1, c. 2). Si riducono al minimo i dati personali, che qui riguardano minori. Vedi EL-14 di [03-features.md](03-features.md).
- **Alternative scartate**: nome del bambino nel sistema; nessun riferimento all'atto anagrafico.

## D-024 — Autorizzazioni: estremi dell'atto, non procedimento

- **Data**: 2026-10-06 · **Passo**: 3 · **Stato**: confermata allo Step 4, con una precisazione: l'atto è un'entità propria, perché copre più interventi e un intervento può richiedere più atti (§4.10 di [04-modello-dati.md](04-modello-dati.md))
- **Decisione**: chiude la domanda 8 dello Step 2.
  - Sull'intervento si registrano gli estremi delle comunicazioni e delle autorizzazioni: ente, tipo di atto, numero, data, esito.
  - Il sistema avvisa quando si pianifica un intervento su un oggetto vincolato.
  - Il procedimento (istanza, pareri, termini) non si gestisce.
  - In v2 una tabella per tipo di vincolo e tipo di intervento dice quali interventi richiedono una comunicazione o un'autorizzazione, e l'eseguito non si registra senza gli estremi. La relazione di fine lavori parte dalla scheda dell'elemento in PDF.
- **Motivazione**: il procedimento si svolge tra comune, ministero e Soprintendenza, con strumenti propri. Al gestore serve dimostrare di avere l'atto prima di eseguire: gli estremi bastano per la tracciabilità (N8) e per la relazione di fine lavori. Vedi IN-13, IN-14 e lo scenario 4.7 di [03-features.md](03-features.md).
- **Alternative scartate**: gestione del procedimento; nessun dato sugli atti.

## D-025 — Ciclo dell'intervento e della non conformità

- **Data**: 2026-10-06 · **Passo**: 3 · **Stato**: confermata allo Step 4, con la precisazione di D-033
- **Decisione**: verifica e precisa D-008 e D-012.
  - **Stati dell'intervento**: pianificato, eseguito, validato, annullato. Un intervento si può registrare direttamente come eseguito. Il rinvio cambia la data senza cambiare lo stato; l'annullamento richiede una motivazione.
  - **Origine**: manuale, regola di ricorrenza (D-020), prescrizione, segnalazione, non conformità (intervento correttivo).
  - **Oggetto**: uno o più elementi, o un'area. Se l'esecuzione è parziale, la parte eseguita si registra e la restante resta pianificata in un nuovo intervento collegato.
  - **Validazione**: serve solo se l'affidamento la prevede; altrimenti l'eseguito è lo stato finale. È esplicita, senza validazione tacita, e non si dà con una non conformità aperta. Prima della validazione l'esecutore può correggere l'eseguito, con lo storico delle correzioni; dopo, l'intervento non si modifica.
  - **Non conformità**: riguarda un intervento eseguito, un intervento scaduto e non eseguito, o un'area dell'affidamento. Ha gravità e termine. Stati: aperta → risolta (dall'esecutore, con l'intervento correttivo) → chiusa (dal committente), oppure di nuovo aperta.
  - **Assegnazione**: nell'MVP l'esecutore si indica sul singolo intervento (affidamento e squadra). L'ordine di lavoro, che raggruppa più interventi in un incarico numerato, arriva in v2.
  - **Ricontrollo**: è un intervento pianificato di tipo valutazione, la cui esecuzione produce la valutazione (D-010). L'incarico a un valutatore esterno è un affidamento per quel tipo di intervento.
- **Motivazione**: è il ciclo che emerge dagli scenari 4.3–4.8 di [03-features.md](03-features.md) (§5.2). Legare la validazione all'affidamento dà un solo modello per K1, dove non serve, e per K2, dove serve. Il ricontrollo come intervento mette nello stesso calendario lavori e controlli, e usa l'affidamento anche per gli incarichi di valutazione.
- **Alternative scartate**: validazione obbligatoria per tutti gli interventi; non conformità come nota sull'intervento; ordine di lavoro obbligatorio già nell'MVP.

## D-026 — Software Access: nessun import dedicato, report coperti nel contenuto

- **Data**: 2026-10-06 · **Passo**: 3 · **Stato**: confermata allo Step 4
- **Decisione**: chiude le domande 2 e 11 dello Step 1.
  - Non c'è un import dedicato dei database Access. Un censimento esistente, Access o altro, entra con l'import generico (shapefile, GeoJSON, CSV) o con l'import CAM.
  - Un elemento senza coordinate precise entra con una posizione provvisoria, segnalata finché non viene verificata in campo. Un record aggregato per area diventa un elemento di gruppo (D-018) con la geometria dell'area come posizione provvisoria, oppure tanti elementi in posizione provvisoria.
  - I report Access non si riproducono con lo stesso impianto: il loro contenuto è coperto dall'inventario e dal registro degli interventi, come proposto allo Step 1 (§5.4).
- **Motivazione**: il database originale non è disponibile (domanda 1 dello Step 1) e il software è del 2000; un convertitore dedicato servirebbe a pochi casi. La posizione provvisoria mantiene D-002 (ogni elemento ha una geometria) e permette di partire da elenchi senza coordinate, frequenti nei comuni. Vedi EL-10, RE-8 e §5.1 di [03-features.md](03-features.md).
- **Alternative scartate**: import dedicato dei file `.mdb`; elementi senza geometria; report con lo stesso impianto Access.

## D-027 — Rappresentazione dei cataloghi e cataloghi tra organizzazioni

- **Data**: 2026-10-06 · **Passo**: 4 · **Stato**: confermata
- **Decisione**: rappresenta D-016 nel modello e chiude la domanda 2 dello Step 3.
  - Le liste che gli utenti estendono sono cataloghi in tabella. Le liste da cui dipende la logica dell'applicazione (stati, origini, effetti sul censimento, unità) sono enumerazioni nel codice. Una voce di catalogo che guida un comportamento punta a un'enumerazione.
  - Nei cataloghi estendibili, una voce senza organizzazione è di sistema; una voce con organizzazione appartiene a quell'organizzazione. Una voce in uso non si cancella: chi l'ha creata la ritira, un'organizzazione nasconde una voce di sistema.
  - Sui dati di un committente valgono le voci disponibili per la sua organizzazione di gestione (D-032), anche quando lavorano un esecutore o un valutatore di un'altra organizzazione. Nell'MVP l'esecutore chiede al gestore le voci che mancano.
- **Motivazione**: le organizzazioni possono aggiungere tipi e specie senza toccare la logica, che dipende solo dalle enumerazioni. Ritirare e nascondere invece di cancellare lascia leggibili i dati storici. Un solo insieme di voci per committente tiene coerenti i dati quando due organizzazioni lavorano sullo stesso patrimonio (K2). Vedi §2.1 e §2.2 di [04-modello-dati.md](04-modello-dati.md).
- **Alternative scartate**: tutto a catalogo, anche stati e origini; voci aggiuntive dell'organizzazione che scrive il dato, con voci di più organizzazioni sullo stesso patrimonio.

## D-028 — Misure nelle osservazioni

- **Data**: 2026-10-06 · **Passo**: 4 · **Stato**: confermata
- **Decisione**: chiude la domanda 1 dello Step 3 e precisa D-007.
  - Diametri a 1,30 m (uno per fusto), altezza, diametro della chioma, fase di sviluppo e le misure previste dalla classe (es. altezza e larghezza della siepe) si registrano nelle osservazioni datate. Un'osservazione con misure è un rilievo.
  - L'elemento tiene una copia dell'ultimo valore valido di ogni misura, della condizione e della valutazione, per mappe, filtri ed export.
  - Gli attributi che non cambiano nel tempo (specie, materiale, tipo di prato) restano sull'elemento; un loro cambio è una correzione.
- **Motivazione**: le misure descrivono lo stato fisico in un momento, come la condizione, e i CAM chiedono di collegare all'albero lo stato nel tempo. La crescita resta distinta dalle correzioni. La serie storica serve a copertura arborea e benefici ecosistemici. Un'osservazione si aggiunge senza conflitti nella sincronizzazione offline. Vedi §4.4 di [04-modello-dati.md](04-modello-dati.md).
- **Alternative scartate**: misure come attributi dell'elemento, con lo storico delle modifiche.

## D-029 — Posto d'impianto: classi dedicate e legame di sostituzione

- **Data**: 2026-10-06 · **Passo**: 4 · **Stato**: confermata
- **Decisione**: chiude la domanda 5 dello Step 2.
  - Il posto d'impianto non è un'entità. Posti liberi e ceppaie (EL-15, v2) sono elementi di classi dedicate, che non contano come alberi.
  - Ogni elemento può indicare l'elemento di cui prende il posto. La catena di sostituzioni è lo storico di una posizione (es. ippocastano → posto libero → tiglio).
  - Il legame di sostituzione serve già all'MVP, per l'intervento di sostituzione (IN-10).
- **Motivazione**: un'entità posto, con un albero che le rimanda, raddoppierebbe geometria e identità di ogni albero e creerebbe due modi di censire, per una feature v2. Il modello dati CAM non prevede né posti liberi né ceppaie. Vedi §4.3 di [04-modello-dati.md](04-modello-dati.md).
- **Alternative scartate**: posto d'impianto come entità con stato proprio, a cui ogni albero rimanda (Esri).

## D-030 — Codici CAM come corrispondenza

- **Data**: 2026-10-06 · **Passo**: 4 · **Stato**: confermata
- **Decisione**: chiude la domanda 10 dello Step 2 e precisa D-011.
  - I codici del modello dati CAM v2.1 sono un catalogo fisso. Non sono il catalogo delle classi di elemento.
  - Ogni classe ha un codice CAM predefinito. Altre corrispondenze legano un codice a una classe più alcuni valori di attributo (es. prato con tipo "in scarpata" = `S101051`).
  - In import il codice dà classe e attributi; in export l'elemento prende la corrispondenza più specifica. Le classi senza codice (posto libero, ceppaia) restano fuori dall'export CAM.
  - Aree di gestione, aree temporanee e fattori ambientali hanno una corrispondenza propria con aree, affidamenti e vincoli.
- **Motivazione**: il catalogo CAM mette nel codice materiale e collocazione (16 codici di prato, una trentina di pavimentazioni), che per noi sono attributi. Molti oggetti CAM non sono elementi del nostro modello. Una corrispondenza regge un aggiornamento del modello CAM. Vedi §4.8 di [04-modello-dati.md](04-modello-dati.md).
- **Alternative scartate**: codici CAM come catalogo delle classi di elemento.

## D-031 — Persone, esecutori e squadre

- **Data**: 2026-10-06 · **Passo**: 4 · **Stato**: confermata
- **Decisione**:
  - operatori, rilevatori e valutatori sono persone del dominio, distinte dagli utenti del sistema. Una persona può essere collegata a un utente;
  - l'esecutore è un'anagrafica tenuta dall'organizzazione di gestione: impresa, cooperativa, associazione, professionista o squadre interne. Se usa il sistema è collegato alla propria organizzazione;
  - le squadre appartengono all'organizzazione dell'esecutore, che le usa per tutti i suoi committenti.
- **Motivazione**: un rilevatore citato in un file importato o un agronomo che consegna solo la relazione (D-022) non hanno un account, ma i CAM e la valutazione ne chiedono il nome. L'esecutore deve esistere anche se non usa il sistema. Una ditta lavora per più committenti con le stesse squadre (scenario 4.8). Vedi §3.2 di [04-modello-dati.md](04-modello-dati.md).
- **Alternative scartate**: rilevatori e valutatori come utenti; esecutore come semplice organizzazione del sistema; squadre definite per affidamento.

## D-032 — Committente e organizzazione di gestione

- **Data**: 2026-10-06 · **Passo**: 4 · **Stato**: confermata
- **Decisione**: verifica D-013 e risponde alla domanda sul proprietario dell'area.
  - Il committente è il titolare del patrimonio. Ha un'organizzazione di gestione: quella del gestore, che organizza il patrimonio, emette gli affidamenti e valida.
  - Nel caso base committente e organizzazione di gestione coincidono. Nella variante di K2 il committente è il comune e l'organizzazione di gestione è l'azienda pubblica.
  - Il proprietario non è un'entità. Il comune in cui si trova l'area è un dato dell'area.
- **Motivazione**: la distinzione tra proprietario e gestore che D-013 chiedeva di verificare è già quella tra committente e organizzazione di gestione. Gli obblighi di legge (catasto, bilancio arboreo, ISTAT) restano del committente. Un consorzio o una ditta hanno aree in più comuni, e il CAM vuole il codice ISTAT per oggetto. Vedi §4.7 di [04-modello-dati.md](04-modello-dati.md).
- **Alternative scartate**: un'entità proprietario accanto al committente; il codice ISTAT solo sul committente.

## D-033 — Interventi proposti, piano come vista, origini

- **Data**: 2026-10-06 · **Passo**: 4 · **Stato**: confermata
- **Decisione**: precisa D-020 e D-025.
  - Gli interventi generati da una regola di ricorrenza nascono nello stato *proposto*. La conferma del gestore li rende pianificati; una proposta scartata si elimina.
  - Il piano di manutenzione non è un'entità: è l'insieme degli interventi con origine ricorrenza di un periodo.
  - La rigenerazione conta gli interventi confermati della regola nel periodo e propone solo quelli mancanti.
  - Alle origini di D-025 si aggiungono il *ricontrollo*, pianificato da una valutazione, e la *campagna* di controllo (v2).
  - L'esecuzione parziale lascia gli elementi non eseguiti in un nuovo intervento pianificato, collegato all'originale.
- **Motivazione**: le proposte non devono arrivare all'esecutore (D-020), e uno stato le distingue senza duplicare gli interventi in un'entità piano. Il ricontrollo come intervento (D-025) ha bisogno di una sua origine. Vedi §4.5 di [04-modello-dati.md](04-modello-dati.md).
- **Alternative scartate**: entità piano con voci proposte separate dagli interventi; interventi generati direttamente come pianificati.

## D-034 — Storico delle modifiche e registri non cancellabili

- **Data**: 2026-10-06 · **Passo**: 4 · **Stato**: confermata
- **Decisione**:
  - lo storico delle modifiche è un'entità del dominio: record, campi cambiati, autore, organizzazione, data, motivazione, origine (web, campo, import, sincronizzazione);
  - osservazioni, valutazioni e interventi eseguiti non si cancellano: si correggono con una motivazione o si annullano;
  - la motivazione è obbligatoria per correzioni dei registri, rinvii, annullamenti e scostamenti dalle prescrizioni;
  - ogni record ha un numero di revisione, per la sincronizzazione offline in v2 (D-014).
- **Motivazione**: TR-6 e N12 chiedono uno storico non modificabile; CE-4 chiede al committente di consultare le modifiche dell'esecutore per periodo e organizzazione. Lo storico serve anche a ricostruire perimetri e classificazioni delle aree a una data. Vedi §4.1 di [04-modello-dati.md](04-modello-dati.md).
- **Alternative scartate**: solo data e autore dell'ultima modifica; storico come funzione tecnica, senza motivazione né organizzazione.

## D-035 — Geometrie e sistema di riferimento

- **Data**: 2026-10-06 · **Passo**: 4 · **Stato**: confermata alla revisione dello Step 4, con una modifica: linee e poligoni anche multiparte. L'ipotesi iniziale prevedeva solo geometrie semplici
- **Decisione**:
  - le geometrie di elementi e aree sono punti, linee o poligoni. Linee e poligoni possono essere multiparte; i punti sono semplici. Un elemento ha un solo campo geometria, del tipo previsto dalla classe;
  - le geometrie si memorizzano in WGS84 (EPSG:4326); superfici e lunghezze si calcolano sull'ellissoide, sommando le parti;
  - l'export CAM usa il sistema RDN2008 scelto per il committente (EPSG 6706 o 7791–7794). Il CAM vuole geometrie semplici: l'export scrive un oggetto per ogni parte;
  - si conserva la precisione dichiarata della posizione e la sua origine (GPS, mappa, import).
- **Motivazione**:
  - WGS84 è il sistema del GPS del browser e delle mappe web. La trasformazione verso RDN2008 è di norma nulla nelle librerie, quindi le coordinate di un rilievo di precisione passano senza modifiche;
  - le misure sull'ellissoide valgono in tutta Italia senza scegliere un fuso;
  - con le multiparte una siepe interrotta da un passo carraio, un prato diviso dai vialetti o un parco diviso da una strada restano una sola unità di gestione, con un codice e un intervento. Le feature multiparte degli shapefile degli enti si importano senza spezzarle, e il vincolo del CAM si rispetta all'export. Vedi §4.2 di [04-modello-dati.md](04-modello-dati.md).
- **Alternative scartate**: memorizzazione in RDN2008 proiettato, che richiede un fuso per committente; geometrie solo semplici, come il CAM, con le parti come elementi o aree distinti (ipotesi iniziale).

## D-036 — Scaffold dai progetti di riferimento

- **Data**: 2026-10-06 · **Passo**: T1 · **Stato**: confermata alla revisione di T1, con una precisazione: da bottaro-pesatura si prendono anche alcuni componenti e i pattern CRUD del modulo `anagrafica`
- **Decisione**:
  - backend e frontend nascono copiando lo scaffold di [inmagik/data-lab](https://github.com/inmagik/data-lab): struttura, settings, app core (`auth_core`, `tenants`, `jobs_core`, `inmagik_utils`), componenti e pattern di modelli, API e interfaccia;
  - le versioni delle dipendenze vengono da [inmagik/bottaro-pesatura](https://github.com/inmagik/bottaro-pesatura), più aggiornato; Python 3.14;
  - da bottaro-pesatura si copiano anche `AuditlogActorMixin`, per l'autore delle voci di django-auditlog con l'autenticazione JWT, e `AuditHistoryModal`, che mostra lo storico di un record. Il suo modulo `anagrafica` è un secondo riferimento per i pattern CRUD, accanto a `datasets` di data-lab;
  - lo scaffold parte dai commit più recenti dei due progetti al momento della copia;
  - dalle app di dominio dei progetti di riferimento si copiano i pattern, non il codice;
  - le convenzioni proprie di bottaro-pesatura (identificatori in italiano, single-tenant, compatibilità con SQLite) non si applicano.
- **Motivazione**: i progetti INMAGIK recenti usano lo stesso stack (Django, React, PostgreSQL) e risolvono già autenticazione, multi-tenancy, permessi e job. Riusare lo scaffold dà al team un codice che conosce e componenti condivisi tra i progetti. Vedi [architettura/README.md](architettura/README.md).
- **Alternative scartate**: scaffold progettato da zero; template generico di Django e React.

## D-037 — Organizzazione come tenant

- **Data**: 2026-10-06 · **Passo**: T1 · **Stato**: confermata
- **Decisione**:
  - l'entità di confine `Organization` del modello dati è il `Tenant` dell'app `tenants`, e `User` è l'utente di `auth_core`;
  - gli utenti appartengono a una o più organizzazioni tramite `TenantMembership`; i ruoli sono definiti per organizzazione;
  - ogni richiesta autenticata indica l'organizzazione con l'header `X-Tenant-ID`;
  - i dati del patrimonio appartengono a un committente e si filtrano tramite `Client.managing_organization`. L'accesso degli esecutori e dei valutatori di un'altra organizzazione tramite gli affidamenti si definisce in T3.
- **Motivazione**: il tenant di data-lab è l'organizzazione che usa il sistema, come in §3.1 di [04-modello-dati.md](04-modello-dati.md). I dati del patrimonio non possono avere il tenant come unico proprietario, perché sullo stesso patrimonio lavorano più organizzazioni (D-012, D-032). Vedi §3.2 di [architettura/backend.md](architettura/backend.md).
- **Alternative scartate**: tenant come committente, che non regge una ditta con più committenti; un'istanza per cliente senza tenant, come in bottaro-pesatura, che non regge esecutori di un'altra organizzazione.

## D-038 — Frontend come SPA a moduli

- **Data**: 2026-10-06 · **Passo**: T1 · **Stato**: confermata alla revisione di T1, con la precisazione di D-036 sul modulo `anagrafica`
- **Decisione**:
  - una sola SPA React con Vite, TypeScript e Mantine, organizzata in moduli che contribuiscono da soli al menu e alle rotte;
  - data fetching con `@inmagik/react-crud` e TanStack Query; autenticazione con `@inmagik/react-auth`;
  - form con `@mantine/form` e yup; traduzioni con i18next, con l'italiano come lingua di riferimento. Nell'MVP l'interfaccia è solo in italiano;
  - pattern di lista, dettaglio, form e azioni del modulo `datasets` di data-lab e del modulo `anagrafica` di bottaro-pesatura. I pattern per sezione si definiscono in T2.
- **Motivazione**: è il frontend dei progetti di riferimento, con componenti e pattern già condivisi. I moduli che si registrano da soli permettono di aggiungere le aree del dominio senza toccare file centrali. Vedi [architettura/frontend.md](architettura/frontend.md).
- **Alternative scartate**: un'app separata per ogni area funzionale; un'altra libreria di componenti.

## D-039 — Job asincroni e pianificati

- **Data**: 2026-10-06 · **Passo**: T1 · **Stato**: confermata
- **Decisione**: i lavori lunghi o periodici girano fuori dalla richiesta HTTP con l'app `jobs_core`, su django-rq, rq-scheduler e Redis. Usi previsti: import ed export, generazione degli interventi proposti, scadenzario. L'elenco si definisce in T3.
- **Motivazione**: import di file CAM o shapefile e generazione del piano (D-020, D-033) possono durare più di una richiesta. `jobs_core` traccia ogni esecuzione e restituisce subito l'identificativo, che il frontend usa per seguirne lo stato. Vedi §3.3 di [architettura/backend.md](architettura/backend.md).
- **Alternative scartate**: Celery; esecuzione sincrona nella richiesta.

## D-040 — Sequenza dei passi dopo le revisioni dello Step 4 e di T1

- **Data**: 2026-10-09 · **Passo**: revisione dello Step 4 e di T1 · **Stato**: confermata
- **Decisione**:
  - dopo la chiusura dello Step 4 e di T1 si fa subito lo scaffold (T4), prima dello Step 5 e di T2;
  - T3 e T2 si svolgono insieme a una prima fetta verticale: cataloghi (`Species`, `ElementClass`), committente (`Client`), zone e aree, elementi su mappa. I documenti di T3 e T2 registrano le scelte fatte nella fetta;
  - lo Step 5 (`spec.md`) procede in parallelo e non blocca lo sviluppo.
- **Motivazione**:
  - varie ipotesi di T1 si verificano solo con il codice: Django 6.1 con le librerie di data-lab, Mantine 9.7 e TypeScript 6;
  - le domande rinviate a T3 e T2 (filtro per organizzazione tramite il committente, permessi per tenant, storico, libreria della mappa) sono le più rischiose e si chiudono meglio su una fetta che funziona;
  - lo Step 5 serve a chi legge la specifica dall'esterno; per lo sviluppo bastano [03-features.md](03-features.md) e [04-modello-dati.md](04-modello-dati.md). Vedi [README.md](README.md).
- **Alternative scartate**: la sequenza Step 5 → T2 → T3 → T4, con tutta la documentazione chiusa prima del codice.

## D-041 — App di dominio e permessi della prima fetta

- **Data**: 2026-10-10 · **Passo**: T3, prima fetta verticale · **Stato**: ipotesi, da confermare alla revisione della fetta
- **Decisione**:
  - le app di dominio seguono §5.1 di [04-modello-dati.md](04-modello-dati.md), con dipendenze in un solo verso: `core` ← `catalogs` ← `parties` ← `territory` ← `inventory`. La prima PR della fetta porta `core`, `catalogs` e `parties`; `territory` e `inventory` arrivano con la seconda;
  - `core` non ha endpoint: contiene i modelli astratti, `ChangeRecord`, gli errori e i mixin dei viewset;
  - permessi: i cataloghi si leggono senza permessi da ogni membro dell'organizzazione e si scrivono con `catalogs.WRITE_CATALOGS`; i committenti hanno `parties.READ_CLIENTS` e `parties.WRITE_CLIENTS`. Le aree e gli elementi avranno `READ_*` e `WRITE_*` per app;
  - ogni risorsa che si sceglie nei form ha l'action `choices/`: le voci filtrate come la lista, senza paginazione, in forma compatta.
- **Motivazione**: le dipendenze in un solo verso permettono di aggiungere le app una alla volta. I cataloghi servono ai form di aree ed elementi: chiedere un permesso per leggerli costringerebbe ad assegnarlo a tutti. `choices/` risolve con una richiesta i menu a tendina dei form. Vedi §8 di [architettura/backend.md](architettura/backend.md).
- **Alternative scartate**: un permesso di lettura dei cataloghi; un'app unica per il dominio.

## D-042 — Modelli di base e concorrenza

- **Data**: 2026-10-10 · **Passo**: T3, prima fetta verticale · **Stato**: ipotesi, da confermare alla revisione della fetta
- **Decisione**:
  - tutte le entità di dominio, cataloghi compresi, hanno una chiave UUID. Le voci di sistema hanno una chiave deterministica, `uuid5` del modello e del codice, uguale in ogni installazione;
  - i campi comuni (§3.1 di [04-modello-dati.md](04-modello-dati.md)) sono colonne di `core.TrackedModel`: `created_at`, `created_by`, `updated_at`, `updated_by`, `revision`. Non si ricavano dalle voci di django-auditlog;
  - `revision` cresce a ogni salvataggio. Chi modifica un record può rimandare la revisione che ha letto: se nel frattempo è cambiata, l'API risponde `409` con codice `revision_conflict`.
- **Motivazione**:
  - chiavi uguali per tutte le entità semplificano il frontend e la sincronizzazione della v2; le chiavi deterministiche permettono a dati iniziali, test e import di riferirsi alle voci di sistema;
  - le colonne costano meno delle sottoquery sulle voci di auditlog, e la revisione serve alla sincronizzazione offline (§4.1 di [04-modello-dati.md](04-modello-dati.md));
  - il controllo della revisione evita che una modifica in campo cancelli in silenzio quella di un collega.
- **Alternative scartate**: chiavi intere per i cataloghi; date e autori annotati da django-auditlog (`standard_auditlog_manager`).

## D-043 — Storico delle modifiche: django-auditlog e ChangeRecord

- **Data**: 2026-10-10 · **Passo**: T3, prima fetta verticale · **Stato**: confermata (scelta del responsabile di progetto)
- **Decisione**:
  - django-auditlog registra le modifiche di tutti i modelli di dominio, per il tracciamento tecnico e la modale dello storico dei record (action `history`). I campi di tracciamento ne restano fuori;
  - `ChangeRecord`, nell'app `core`, è lo storico di dominio dei dati operativi (D-034). Lo scrivono i servizi di dominio, nella transazione della modifica: entità, record, committente, operazione (creazione, modifica, annullamento), campi cambiati con valore precedente e nuovo, motivazione, autore, organizzazione, data, origine (web, campo, import, sincronizzazione, sistema);
  - l'origine `field` la dichiara il frontend con l'header `X-Change-Source`; le modifiche dall'admin hanno origine `system`;
  - il committente di `ChangeRecord` è un identificativo, non una chiave esterna: lo storico sopravvive ai record e `core` non dipende dalle app di dominio. Un record cancellato perché inserito per errore lascia un *annullamento* con i suoi ultimi valori;
  - lo storico non si modifica né si cancella, anche fuori dall'ORM: un trigger del database rifiuta `UPDATE` e `DELETE`, tranne l'autore messo a `NULL` quando si cancella l'utente.
- **Motivazione**: chiude la domanda 3 di [architettura/backend.md](architettura/backend.md). Motivazione, origine e approvazione (v2) sono dati di dominio, che il committente consulta (CE-4). django-auditlog resta il registro tecnico, già usato dallo scaffold e dal frontend.
- **Alternative scartate**: estendere le voci di django-auditlog con dati aggiuntivi; solo django-auditlog, con `ChangeRecord` rinviato ai registri.

## D-044 — Accesso ai dati del patrimonio e nome del campo dell'organizzazione

- **Data**: 2026-10-10 · **Passo**: T3, prima fetta verticale · **Stato**: ipotesi, da confermare alla revisione della fetta
- **Decisione**:
  - i modelli di dominio chiamano `organization` la chiave verso il tenant, come il modello dati (`managing_organization` per il committente). `TenantScopedModel` e `TenantScopedViewSetMixin` restano alle app core;
  - il QuerySet di ogni dato del patrimonio ha `visible_to(organization)` ed `editable_by(organization)`. Nell'MVP entrambi danno i record dei committenti gestiti dall'organizzazione. L'accesso degli esecutori tramite gli affidamenti estenderà questi due metodi, non le view;
  - `ClientScopedViewSetMixin` usa `visible_to` per le letture ed `editable_by` per le scritture. Senza tenant nella richiesta non si vede nulla, nemmeno dallo staff;
  - le voci di catalogo disponibili sui dati di un committente sono quelle della sua organizzazione di gestione (D-027).
- **Motivazione**: chiude la domanda 5 di [architettura/backend.md](architettura/backend.md). I cataloghi hanno un'organizzazione facoltativa e i dati del patrimonio passano dal committente: nessuno dei due può usare il campo `tenant` obbligatorio dello scaffold, quindi il nome del modello dati non costa modifiche alle app core.
- **Alternative scartate**: campo `tenant` sulle entità di dominio; un tenant copiato su ogni dato del patrimonio.

## D-045 — Permessi diretti solo dallo staff

- **Data**: 2026-10-10 · **Passo**: T3, prima fetta verticale · **Stato**: ipotesi, da confermare alla revisione della fetta
- **Decisione**:
  - i permessi diretti di un utente (`User.permissions`) li cambia solo lo staff, per ogni utente (errore `direct_permissions_staff_only`). Dentro un'organizzazione i permessi si danno con i ruoli, che sono per tenant;
  - i permessi diretti non diventano per tenant;
  - l'invito di un utente che esiste già in un'altra organizzazione resta rinviato agli affidamenti. Fino ad allora le appartenenze le aggiunge lo staff.
- **Motivazione**: chiude la domanda 4 di [architettura/backend.md](architettura/backend.md). I permessi diretti valgono in tutte le organizzazioni dell'utente: un amministratore di un'organizzazione non deve poterli dare. Permessi diretti per tenant duplicherebbero i ruoli. L'invito serve quando un esecutore o un valutatore di un'altra organizzazione entra nel sistema, cioè con gli affidamenti.
- **Alternative scartate**: permessi diretti per tenant; permessi diretti modificabili da chi ha `WRITE_ROLES`, come nello scaffold.

## D-046 — Regole dei cataloghi nell'API

- **Data**: 2026-10-10 · **Passo**: T3, prima fetta verticale · **Stato**: ipotesi, da confermare alla revisione della fetta
- **Decisione**:
  - le voci di sistema le crea, modifica ed elimina solo lo staff (errore `system_entry_read_only`); il loro codice non cambia (`catalog_code_immutable`). Le stesse regole valgono nell'admin, che salva con i servizi;
  - un'organizzazione nasconde e mostra le voci di sistema con le action `hide/` e `unhide/`; una voce in uso non si elimina (`catalog_entry_in_use`), si ritira;
  - alcuni campi non cambiano quando la voce è in uso: tipo di geometria e modalità della specie di una classe, tipo di un attributo;
  - a una classe si aggiungono solo attributi disponibili per la sua organizzazione; quelli già presenti restano anche se poi vengono nascosti o ritirati;
  - i cataloghi fissi hanno `retired` ma non `organization` né `hidden_by`: una fonte ufficiale può togliere una voce, e una classificazione obbligatoria non si nasconde;
  - il codice di una voce, se manca, si ricava dal nome. Il nome di una specie è il suo nome scientifico;
  - nell'MVP gli attributi sono solo voci di sistema (EL-4 è in v2);
  - `RemovalCause` entra nella prima fetta, perché la data e la causa di rimozione servono già all'elemento (EL-7).
- **Motivazione**: applica D-016 e D-027 all'API. Bloccare i campi che decidono la logica evita che gli elementi esistenti diventino incoerenti con la loro classe.
- **Alternative scartate**: voci di sistema modificabili dalle organizzazioni; cancellazione logica delle voci.

## D-047 — Attributi della classe validati senza jsonschema

- **Data**: 2026-10-10 · **Passo**: T3, prima fetta verticale · **Stato**: ipotesi, da confermare alla revisione della fetta
- **Decisione**: i valori di `Element.attributes` si validano con una funzione dell'app `catalogs` (`validate_attributes`), che legge gli attributi della classe e restituisce un errore con codice per ogni attributo: sconosciuto, misura, ritirato, obbligatorio, tipo o valore non valido. Le misure si rifiutano, perché vanno nelle osservazioni (D-028). I valori di attributi tolti dalla classe o ritirati restano se non cambiano.
- **Motivazione**: chiude la nota su `jsonschema` di §7 di [architettura/backend.md](architettura/backend.md). I tipi sono pochi e fissi; i messaggi di jsonschema andrebbero ricondotti a codici che il frontend traduce.
- **Alternative scartate**: uno schema JSON generato dalla classe e validato con jsonschema.

## D-048 — Dati iniziali dei cataloghi

- **Data**: 2026-10-10 · **Passo**: T3, prima fetta verticale · **Stato**: ipotesi, da confermare alla revisione della fetta
- **Decisione**:
  - i cataloghi piccoli si caricano con una migrazione di dati, con i valori scritti nella migrazione: le 14 tipologie ISTAT, le intensità di fruizione, le cause di rimozione, 20 classi di elemento, alcuni attributi. Le destinazioni d'uso sono un elenco provvisorio, da rivedere con i primi committenti (§2.7 di [04-modello-dati.md](04-modello-dati.md));
  - le specie si caricano con il comando `import_species`, da un file CSV. Il file `catalogs/seeds/species_starter.csv` ha 72 specie urbane comuni e i loro 48 generi, da verificare sulla nomenclatura di riferimento. La fonte definitiva resta quella proposta allo Step 4, con le licenze da verificare.
- **Motivazione**: le migrazioni danno a ogni installazione le stesse voci, con le stesse chiavi (D-042). L'elenco delle specie cresce e si cura nel tempo: un comando idempotente lo aggiorna senza nuove migrazioni.
- **Alternative scartate**: fixture da caricare a mano; specie in una migrazione.
