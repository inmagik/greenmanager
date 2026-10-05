# Metodologia di lavoro sulla specifica

Questa cartella contiene la specifica del dominio applicativo di GreenManager. Per obiettivo, perimetro e convenzioni vedi [AGENTS.md](../AGENTS.md).

## Come lavoriamo

- La specifica si costruisce in **5 passi**. Ogni passo produce un documento e richiede una o più sessioni di lavoro.
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
| 2. Benchmark di prodotti simili | [02-benchmark.md](02-benchmark.md) | da iniziare |
| 3. Feature del prodotto | [03-features.md](03-features.md) | da iniziare |
| 4. Modello dati | [04-modello-dati.md](04-modello-dati.md) | da iniziare |
| 5. Consolidamento | [spec.md](spec.md) | da iniziare |

## I passi

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
- **Attività**: scrivere una specifica autosufficiente, che rimanda ai documenti 01–04 come appendici, e farne la revisione finale.
- **Output**: [spec.md](spec.md)

## Documenti trasversali

- [decisioni.md](decisioni.md): registro delle decisioni.
- [glossario.md](glossario.md): termini di dominio e nomi delle entità nel modello.
