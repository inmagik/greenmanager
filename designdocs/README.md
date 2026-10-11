# Metodologia di lavoro sulla specifica

Questa cartella contiene la specifica del dominio applicativo di GreenManager e, in [architettura/](architettura/), l'architettura tecnica dei componenti. Per obiettivo, perimetro e convenzioni vedi [AGENTS.md](../AGENTS.md).

## Come lavoriamo

- Il lavoro procede su due binari:
  - la **specifica del dominio**, in 5 passi (Step 1–5);
  - il **binario tecnico**, in 4 passi (T1–T4): stack, struttura e pattern di backend e frontend, fino allo scaffold del codice.
- Ogni passo, di entrambi i binari, produce un documento e richiede una o più sessioni di lavoro.
- Ogni passo si chiude con una **revisione** del responsabile di progetto. Si passa al successivo solo quando le "Domande aperte" del documento sono chiuse, oppure rinviate in modo esplicito a un passo successivo.
- Alla chiusura di un passo si aggiornano:
  - [decisioni.md](decisioni.md), con le decisioni prese
  - [glossario.md](glossario.md), con i termini nuovi
  - la riga **Stato** di [AGENTS.md](../AGENTS.md) e la tabella qui sotto

## Stato di avanzamento

| Passo | Documento | Stato |
|---|---|---|
| 0. Metodologia | questo file, `AGENTS.md` | completato |
| 1. Analisi della specifica esistente | [01-analisi-spec-esistente.md](01-analisi-spec-esistente.md) | completato |
| 2. Benchmark di prodotti simili | [02-benchmark.md](02-benchmark.md) | completato |
| 3. Feature del prodotto | [03-features.md](03-features.md) | completato |
| 4. Modello dati | [04-modello-dati.md](04-modello-dati.md) | completato |
| 5. Consolidamento | [spec.md](spec.md) | da iniziare, in parallelo allo sviluppo (D-040) |
| T1. Stack e scaffold di riferimento | [architettura/README.md](architettura/README.md), [backend.md](architettura/backend.md), [frontend.md](architettura/frontend.md) | completato |
| T2. Pattern dell'interfaccia | `architettura/frontend-pattern.md` | da iniziare, con la prima fetta verticale |
| T3. Corrispondenza tra dominio e componenti | aggiornamento di [backend.md](architettura/backend.md) e [frontend.md](architettura/frontend.md) | in corso, con la prima fetta verticale: basi, cataloghi e committente nel backend (§8 di backend.md) |
| T4. Scaffold | codice in `server/` e `frontend/` | completato |

## I passi della specifica del dominio

### 1. Analisi della specifica esistente
- **Input**: [Specifiche Software Censimento Verde.pdf](../resources/Specifiche%20Software%20Censimento%20Verde.pdf), un software Access 97 per comuni, del 2011.
- **Attività**:
  - estrarre entità, dizionari, funzioni, report e ruoli utente
  - ricostruire il modello dati in Mermaid
  - valutare ogni elemento con *mantenere / adattare / scartare*
  - elencare le lacune rispetto ai tre pilastri, tenendo conto del passaggio da desktop a web
- **Output**: [01-analisi-spec-esistente.md](01-analisi-spec-esistente.md)

### 2. Benchmark di prodotti simili
- **Input**: ricerca web.
- **Attività**:
  - schede sintetiche dei prodotti italiani ed esteri
  - contesto normativo italiano (L. 10/2013, CAM Verde pubblico DM 63/2020, VTA e classi CPC della SIA)
  - matrice delle feature per area funzionale, indicando per ogni feature se è candidata per GreenManager
- **Output**: [02-benchmark.md](02-benchmark.md)

### 3. Feature del prodotto
- **Input**: passi 1 e 2.
- **Attività**:
  - attori di dominio
  - posizionamento del prodotto (domanda 3 dello Step 2), da chiudere prima del catalogo
  - catalogo delle feature per modulo, con priorità MVP / v2 / futuro
  - flussi principali descritti come scenari
- **Output**: [03-features.md](03-features.md)

### 4. Modello dati
- **Input**: passo 3.
- **Attività**:
  - diagramma ER e scheda per ogni entità
  - separazione tra cataloghi e dati operativi
  - geometrie, storicizzazione dello stato, ciclo degli interventi (pianificato → eseguito)
  - note di mappatura su Django
- **Output**: [04-modello-dati.md](04-modello-dati.md)

### 5. Consolidamento
- **Input**: passi 1–4.
- **Quando**: in parallelo al binario tecnico, senza bloccare lo sviluppo (D-040).
- **Attività**: scrivere una specifica autosufficiente, che rimanda ai documenti 01–04 come appendici, e farne la revisione finale. Per stack e struttura del codice rimanda ai documenti del binario tecnico.
- **Output**: [spec.md](spec.md)

## Il binario tecnico

Fissa tecnologie, struttura e pattern di backend e frontend, copiando lo scaffold dei progetti INMAGIK recenti invece di progettarlo da zero (D-036). Valgono le regole degli Step: un documento per passo, che finisce con "Domande aperte"; chiusura con la revisione del responsabile di progetto; decisioni in [decisioni.md](decisioni.md).

Il binario procede in parallelo alla specifica del dominio. Dopo la revisione dello Step 4 e di T1 la sequenza è questa (D-040):
1. T1 non dipende dagli Step;
2. T4 viene subito dopo T1: lo scaffold nasce senza app di dominio, che si aggiungono dopo;
3. T2 e T3 si svolgono insieme a una **prima fetta verticale**:
   - contenuto: cataloghi (`Species`, `ElementClass`), committente (`Client`), zone e aree, elementi su mappa;
   - T2 parte dalle feature e dagli scenari dello Step 3, T3 dal modello dati dello Step 4;
   - i loro documenti registrano le scelte fatte nella fetta;
4. lo Step 5 procede in parallelo e non blocca lo sviluppo.

### T1. Stack e scaffold di riferimento
- **Input**: i progetti di riferimento [inmagik/data-lab](https://github.com/inmagik/data-lab) (struttura, app core, pattern) e [inmagik/bottaro-pesatura](https://github.com/inmagik/bottaro-pesatura) (versioni); il vincolo di stack di [AGENTS.md](../AGENTS.md).
- **Attività**:
  - componenti dell'architettura e progetti di riferimento, con i commit letti;
  - cosa si copia, cosa si adatta e cosa si scarta;
  - struttura, settings, app core e pattern delle app di dominio del backend;
  - struttura, provider, moduli, data fetching e pattern UI di base del frontend;
  - ambiente di sviluppo, immagini, versioni delle dipendenze.
- **Output**: [architettura/README.md](architettura/README.md), [architettura/backend.md](architettura/backend.md), [architettura/frontend.md](architettura/frontend.md)

### T2. Pattern dell'interfaccia
- **Input**: T1, feature e scenari dello Step 3, la prima fetta verticale.
- **Attività**: i pattern per sezione, oltre a quelli di base di T1:
  - liste, dettaglio e form delle entità principali;
  - mappa: libreria, layer, disegno e modifica delle geometrie;
  - uso in campo da smartphone e tablet: GPS, fotocamera, schermi piccoli;
  - mappa pubblica in sola lettura.
- **Output**: `architettura/frontend-pattern.md`

### T3. Corrispondenza tra dominio e componenti
- **Input**: T1, lo Step 4 chiuso, la prima fetta verticale.
- **Attività**:
  - app Django e moduli del frontend per le entità del dominio, partendo da §5 di [04-modello-dati.md](04-modello-dati.md);
  - permessi di ogni app (`fm_permissions.py`);
  - filtro per organizzazione e accesso tramite gli affidamenti (§5.4 di [04-modello-dati.md](04-modello-dati.md));
  - job asincroni e pianificati;
  - le domande di T1 rinviate a questo passo.
- **Output**: aggiornamento di [architettura/backend.md](architettura/backend.md) e [architettura/frontend.md](architettura/frontend.md)

### T4. Scaffold
- **Input**: T1 chiuso. Si fa prima di T2 e T3 (D-040).
- **Attività**:
  - copiare server e frontend dai commit più recenti dei progetti di riferimento, secondo le regole di T1. Prima si riverificano le tabelle di §3 di [architettura/README.md](architettura/README.md) e le versioni;
  - creare `server/AGENTS.md` e `frontend/AGENTS.md` con le istruzioni per gli agenti che lavorano sul componente, ciascuno accanto a un `CLAUDE.md` che contiene solo `@AGENTS.md`;
  - verificare che il progetto parte: migrazioni, server, worker, build del frontend, login;
  - aggiornare i comandi e lo stato in [AGENTS.md](../AGENTS.md).
- **Output**: codice in `server/` e `frontend/`

## Documenti trasversali

- [decisioni.md](decisioni.md): registro delle decisioni.
- [glossario.md](glossario.md): termini di dominio e nomi delle entità nel modello.
- [architettura/](architettura/): architettura tecnica di backend e frontend (binario tecnico).
