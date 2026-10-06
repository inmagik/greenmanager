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

- **Data**: 2026-10-06 · **Passo**: 3 · **Stato**: confermata allo Step 4
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

- **Data**: 2026-10-06 · **Passo**: 4 · **Stato**: ipotesi, da confermare alla revisione dello Step 4
- **Decisione**: rappresenta D-016 nel modello e chiude la domanda 2 dello Step 3.
  - Le liste che gli utenti estendono sono cataloghi in tabella. Le liste da cui dipende la logica dell'applicazione (stati, origini, effetti sul censimento, unità) sono enumerazioni nel codice. Una voce di catalogo che guida un comportamento punta a un'enumerazione.
  - Nei cataloghi estendibili, una voce senza organizzazione è di sistema; una voce con organizzazione appartiene a quell'organizzazione. Una voce in uso non si cancella: chi l'ha creata la ritira, un'organizzazione nasconde una voce di sistema.
  - Sui dati di un committente valgono le voci disponibili per la sua organizzazione di gestione (D-032), anche quando lavorano un esecutore o un valutatore di un'altra organizzazione. Nell'MVP l'esecutore chiede al gestore le voci che mancano.
- **Motivazione**: le organizzazioni possono aggiungere tipi e specie senza toccare la logica, che dipende solo dalle enumerazioni. Ritirare e nascondere invece di cancellare lascia leggibili i dati storici. Un solo insieme di voci per committente tiene coerenti i dati quando due organizzazioni lavorano sullo stesso patrimonio (K2). Vedi §2.1 e §2.2 di [04-modello-dati.md](04-modello-dati.md).
- **Alternative scartate**: tutto a catalogo, anche stati e origini; voci aggiuntive dell'organizzazione che scrive il dato, con voci di più organizzazioni sullo stesso patrimonio.

## D-028 — Misure nelle osservazioni

- **Data**: 2026-10-06 · **Passo**: 4 · **Stato**: ipotesi, da confermare alla revisione dello Step 4
- **Decisione**: chiude la domanda 1 dello Step 3 e precisa D-007.
  - Diametri a 1,30 m (uno per fusto), altezza, diametro della chioma, fase di sviluppo e le misure previste dalla classe (es. altezza e larghezza della siepe) si registrano nelle osservazioni datate. Un'osservazione con misure è un rilievo.
  - L'elemento tiene una copia dell'ultimo valore valido di ogni misura, della condizione e della valutazione, per mappe, filtri ed export.
  - Gli attributi che non cambiano nel tempo (specie, materiale, tipo di prato) restano sull'elemento; un loro cambio è una correzione.
- **Motivazione**: le misure descrivono lo stato fisico in un momento, come la condizione, e i CAM chiedono di collegare all'albero lo stato nel tempo. La crescita resta distinta dalle correzioni. La serie storica serve a copertura arborea e benefici ecosistemici. Un'osservazione si aggiunge senza conflitti nella sincronizzazione offline. Vedi §4.4 di [04-modello-dati.md](04-modello-dati.md).
- **Alternative scartate**: misure come attributi dell'elemento, con lo storico delle modifiche.

## D-029 — Posto d'impianto: classi dedicate e legame di sostituzione

- **Data**: 2026-10-06 · **Passo**: 4 · **Stato**: ipotesi, da confermare alla revisione dello Step 4
- **Decisione**: chiude la domanda 5 dello Step 2.
  - Il posto d'impianto non è un'entità. Posti liberi e ceppaie (EL-15, v2) sono elementi di classi dedicate, che non contano come alberi.
  - Ogni elemento può indicare l'elemento di cui prende il posto. La catena di sostituzioni è lo storico di una posizione (es. ippocastano → posto libero → tiglio).
  - Il legame di sostituzione serve già all'MVP, per l'intervento di sostituzione (IN-10).
- **Motivazione**: un'entità posto, con un albero che le rimanda, raddoppierebbe geometria e identità di ogni albero e creerebbe due modi di censire, per una feature v2. Il modello dati CAM non prevede né posti liberi né ceppaie. Vedi §4.3 di [04-modello-dati.md](04-modello-dati.md).
- **Alternative scartate**: posto d'impianto come entità con stato proprio, a cui ogni albero rimanda (Esri).

## D-030 — Codici CAM come corrispondenza

- **Data**: 2026-10-06 · **Passo**: 4 · **Stato**: ipotesi, da confermare alla revisione dello Step 4
- **Decisione**: chiude la domanda 10 dello Step 2 e precisa D-011.
  - I codici del modello dati CAM v2.1 sono un catalogo fisso. Non sono il catalogo delle classi di elemento.
  - Ogni classe ha un codice CAM predefinito. Altre corrispondenze legano un codice a una classe più alcuni valori di attributo (es. prato con tipo "in scarpata" = `S101051`).
  - In import il codice dà classe e attributi; in export l'elemento prende la corrispondenza più specifica. Le classi senza codice (posto libero, ceppaia) restano fuori dall'export CAM.
  - Aree di gestione, aree temporanee e fattori ambientali hanno una corrispondenza propria con aree, affidamenti e vincoli.
- **Motivazione**: il catalogo CAM mette nel codice materiale e collocazione (16 codici di prato, una trentina di pavimentazioni), che per noi sono attributi. Molti oggetti CAM non sono elementi del nostro modello. Una corrispondenza regge un aggiornamento del modello CAM. Vedi §4.8 di [04-modello-dati.md](04-modello-dati.md).
- **Alternative scartate**: codici CAM come catalogo delle classi di elemento.

## D-031 — Persone, esecutori e squadre

- **Data**: 2026-10-06 · **Passo**: 4 · **Stato**: ipotesi, da confermare alla revisione dello Step 4
- **Decisione**:
  - operatori, rilevatori e valutatori sono persone del dominio, distinte dagli utenti del sistema. Una persona può essere collegata a un utente;
  - l'esecutore è un'anagrafica tenuta dall'organizzazione di gestione: impresa, cooperativa, associazione, professionista o squadre interne. Se usa il sistema è collegato alla propria organizzazione;
  - le squadre appartengono all'organizzazione dell'esecutore, che le usa per tutti i suoi committenti.
- **Motivazione**: un rilevatore citato in un file importato o un agronomo che consegna solo la relazione (D-022) non hanno un account, ma i CAM e la valutazione ne chiedono il nome. L'esecutore deve esistere anche se non usa il sistema. Una ditta lavora per più committenti con le stesse squadre (scenario 4.8). Vedi §3.2 di [04-modello-dati.md](04-modello-dati.md).
- **Alternative scartate**: rilevatori e valutatori come utenti; esecutore come semplice organizzazione del sistema; squadre definite per affidamento.

## D-032 — Committente e organizzazione di gestione

- **Data**: 2026-10-06 · **Passo**: 4 · **Stato**: ipotesi, da confermare alla revisione dello Step 4
- **Decisione**: verifica D-013 e risponde alla domanda sul proprietario dell'area.
  - Il committente è il titolare del patrimonio. Ha un'organizzazione di gestione: quella del gestore, che organizza il patrimonio, emette gli affidamenti e valida.
  - Nel caso base committente e organizzazione di gestione coincidono. Nella variante di K2 il committente è il comune e l'organizzazione di gestione è l'azienda pubblica.
  - Il proprietario non è un'entità. Il comune in cui si trova l'area è un dato dell'area.
- **Motivazione**: la distinzione tra proprietario e gestore che D-013 chiedeva di verificare è già quella tra committente e organizzazione di gestione. Gli obblighi di legge (catasto, bilancio arboreo, ISTAT) restano del committente. Un consorzio o una ditta hanno aree in più comuni, e il CAM vuole il codice ISTAT per oggetto. Vedi §4.7 di [04-modello-dati.md](04-modello-dati.md).
- **Alternative scartate**: un'entità proprietario accanto al committente; il codice ISTAT solo sul committente.

## D-033 — Interventi proposti, piano come vista, origini

- **Data**: 2026-10-06 · **Passo**: 4 · **Stato**: ipotesi, da confermare alla revisione dello Step 4
- **Decisione**: precisa D-020 e D-025.
  - Gli interventi generati da una regola di ricorrenza nascono nello stato *proposto*. La conferma del gestore li rende pianificati; una proposta scartata si elimina.
  - Il piano di manutenzione non è un'entità: è l'insieme degli interventi con origine ricorrenza di un periodo.
  - La rigenerazione conta gli interventi confermati della regola nel periodo e propone solo quelli mancanti.
  - Alle origini di D-025 si aggiungono il *ricontrollo*, pianificato da una valutazione, e la *campagna* di controllo (v2).
  - L'esecuzione parziale lascia gli elementi non eseguiti in un nuovo intervento pianificato, collegato all'originale.
- **Motivazione**: le proposte non devono arrivare all'esecutore (D-020), e uno stato le distingue senza duplicare gli interventi in un'entità piano. Il ricontrollo come intervento (D-025) ha bisogno di una sua origine. Vedi §4.5 di [04-modello-dati.md](04-modello-dati.md).
- **Alternative scartate**: entità piano con voci proposte separate dagli interventi; interventi generati direttamente come pianificati.

## D-034 — Storico delle modifiche e registri non cancellabili

- **Data**: 2026-10-06 · **Passo**: 4 · **Stato**: ipotesi, da confermare alla revisione dello Step 4
- **Decisione**:
  - lo storico delle modifiche è un'entità del dominio: record, campi cambiati, autore, organizzazione, data, motivazione, origine (web, campo, import, sincronizzazione);
  - osservazioni, valutazioni e interventi eseguiti non si cancellano: si correggono con una motivazione o si annullano;
  - la motivazione è obbligatoria per correzioni dei registri, rinvii, annullamenti e scostamenti dalle prescrizioni;
  - ogni record ha un numero di revisione, per la sincronizzazione offline in v2 (D-014).
- **Motivazione**: TR-6 e N12 chiedono uno storico non modificabile; CE-4 chiede al committente di consultare le modifiche dell'esecutore per periodo e organizzazione. Lo storico serve anche a ricostruire perimetri e classificazioni delle aree a una data. Vedi §4.1 di [04-modello-dati.md](04-modello-dati.md).
- **Alternative scartate**: solo data e autore dell'ultima modifica; storico come funzione tecnica, senza motivazione né organizzazione.

## D-035 — Geometrie e sistema di riferimento

- **Data**: 2026-10-06 · **Passo**: 4 · **Stato**: ipotesi, da confermare alla revisione dello Step 4
- **Decisione**:
  - le geometrie di elementi e aree sono semplici, non multiparte, come chiede il CAM. Un elemento ha un solo campo geometria, del tipo previsto dalla classe;
  - le geometrie si memorizzano in WGS84 (EPSG:4326); superfici e lunghezze si calcolano sull'ellissoide;
  - l'export CAM usa il sistema RDN2008 scelto per il committente (EPSG 6706 o 7791–7794);
  - si conserva la precisione dichiarata della posizione e la sua origine (GPS, mappa, import).
- **Motivazione**: WGS84 è il sistema del GPS del browser e delle mappe web. La trasformazione verso RDN2008 è di norma nulla nelle librerie, quindi le coordinate di un rilievo di precisione passano senza modifiche. Le misure sull'ellissoide valgono in tutta Italia senza scegliere un fuso. Vedi §4.2 di [04-modello-dati.md](04-modello-dati.md).
- **Alternative scartate**: memorizzazione in RDN2008 proiettato, che richiede un fuso per committente; geometrie multiparte.
