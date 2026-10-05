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

- **Data**: 2026-10-05 · **Passo**: 0 · **Stato**: ipotesi, da confermare allo Step 3
- **Decisione**: si censisce il singolo elemento con la sua geometria (albero = punto, siepe o filare = linea, prato o aiuola = poligono). Gli elementi sono raggruppati in aree. Servono GIS, PostGIS e GeoDjango.
- **Motivazione**: è lo standard dei prodotti attuali. Permette uno storico per singolo individuo, che serve per il catasto degli alberi (L. 10/2013) e per le ispezioni VTA.
- **Alternative scartate**: censimento per area con quantità per elemento, come nella specifica Access. È più semplice ma non supporta la mappa né lo storico del singolo elemento.

## D-003 — Perimetro del benchmark

- **Data**: 2026-10-05 · **Passo**: 0 · **Stato**: confermata
- **Decisione**: il benchmark copre prodotti italiani ed esteri, più la normativa italiana di settore.
- **Motivazione**: i prodotti esteri mostrano lo stato dell'arte; quelli italiani e la normativa mostrano cosa chiede il mercato locale.
- **Alternative scartate**: solo Italia; solo estero.

## D-004 — Uso in campo: web responsive, online

- **Data**: 2026-10-05 · **Passo**: 0 · **Stato**: confermata
- **Decisione**: l'interfaccia è usabile da smartphone e tablet, con GPS e fotocamera dal browser e connessione sempre richiesta. L'offline resta escluso, ma il modello dati non deve precluderlo (es. UUID come identificativi).
- **Motivazione**: copre il lavoro in campo senza la complessità della sincronizzazione e della gestione dei conflitti.
- **Alternative scartate**: offline-first (PWA); solo uso da ufficio.

## D-005 — Cataloghi gestiti nell'applicazione

- **Data**: 2026-10-05 · **Passo**: 1 · **Stato**: confermata
- **Decisione**: non si crea un database per committente e non si copiano i dizionari. I cataloghi (specie, classi di elemento, tipi di intervento, condizioni, periodicità…) sono gestiti nell'applicazione, precaricati e modificabili. Resta aperto se siano unici per tutto il sistema o personalizzabili per organizzazione (Step 3).
- **Motivazione**: nel software Access la copia dei dizionari compensava la scelta di un database per comune, nata per dare ai comuni un accesso in sola lettura che il web risolve in altro modo. Un sistema unico dà cataloghi coerenti.
- **Alternative scartate**: un database per committente, inizializzato copiando i dizionari da uno esistente (soluzione Access).

## D-006 — Specie separata dalla classe di elemento

- **Data**: 2026-10-05 · **Passo**: 1 · **Stato**: ipotesi, da confermare allo Step 4
- **Decisione**: le specie (tassonomia botanica) sono un catalogo separato dalla classe di elemento, che deriva dall'habitus Access. La classe di elemento determina tipo di geometria, unità di misura e attributi da rilevare.
- **Motivazione**: il dizionario elementi Access mette nello stesso elenco specie botaniche e arredi. L'habitus fa già da classe (decide unità di misura e altezza) e si collega in modo naturale alle geometrie di D-002.
- **Alternative scartate**: un unico catalogo di elementi classificati per habitus (soluzione Access).

## D-007 — Stato come osservazione datata

- **Data**: 2026-10-05 · **Passo**: 1 · **Stato**: ipotesi, da confermare allo Step 4
- **Decisione**: la condizione non è un attributo dell'elemento ma il valore di un'osservazione datata, con autore ed eventuali foto. Lo stato corrente di un elemento è la sua ultima osservazione.
- **Motivazione**: è il terzo pilastro (registro dello stato). Nel software Access la condizione si sovrascrive e lo storico si perde.
- **Alternative scartate**: condizione come attributo dell'elemento, aggiornato a ogni rilievo (soluzione Access).

## D-008 — Interventi con ciclo pianificato → eseguito

- **Data**: 2026-10-05 · **Passo**: 1 · **Stato**: ipotesi, da confermare allo Step 3
- **Decisione**: l'operazione Access diventa un intervento con ciclo pianificato → eseguito, date, esecutore e bersaglio (uno o più elementi, o un'area). La periodicità diventa una regola che genera interventi pianificati.
- **Motivazione**: è il secondo pilastro (registro delle azioni). Nel software Access le operazioni sono solo raccomandazioni legate a un censimento, con un anno e una periodicità descrittiva.
- **Alternative scartate**: operazioni come raccomandazioni annuali legate al singolo censimento (soluzione Access).
