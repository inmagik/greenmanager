# 03 — Feature del prodotto

> **Stato**: da iniziare · **Passo**: 3 di 5 · Metodologia in [README.md](README.md)

- **Obiettivo**: definire le feature di GreenManager, con priorità e flussi principali.
- **Input**: [01-analisi-spec-esistente.md](01-analisi-spec-esistente.md), [02-benchmark.md](02-benchmark.md), [decisioni.md](decisioni.md).
- **Output atteso**: gli attori di dominio, il catalogo delle feature per modulo (MVP / v2 / futuro) e gli scenari d'uso principali.

## 1. Attori di dominio

_Chi interagisce con il sistema e per fare cosa (es. censitore, responsabile della manutenzione, squadra operativa, committente in sola lettura). I permessi non sono in perimetro._

## 2. Catalogo delle feature

_Per modulo, con priorità MVP / v2 / futuro._

### 2.1 Territorio e aree
### 2.2 Censimento degli elementi
### 2.3 Cataloghi (specie, classi di elemento, tipi di intervento…)
### 2.4 Interventi pianificati ed eseguiti
### 2.5 Monitoraggio dello stato e foto
### 2.6 Report ed export

## 3. Scenari principali

_Es. censimento in campo di un albero, piano annuale delle potature, registrazione di un intervento eseguito con foto prima e dopo, ispezione VTA._

## 4. Verifica delle ipotesi

_Conferma o revisione di D-002 (unità di censimento georeferenziata) e D-008 (interventi con ciclo pianificato → eseguito)._

## Domande aperte

Ereditate dallo [Step 1](01-analisi-spec-esistente.md#domande-aperte), con il numero originale:
- **Import dei dati esistenti** (2): bisogna importare censimenti dai database Access? Se sì, con quali regole si trasformano in elementi georeferenziati?
- **Elementi di gruppo** (3): oltre all'individuo singolo, servono elementi di gruppo con una quantità? Incide su D-002.
- **Committente** (4): le aree appartengono a un committente distinto da chi gestisce il verde? Come si rappresenta senza entrare nella multi-tenancy?
- **Affidamento** (5): serve la modalità di gestione, l'esecutore concreto o entrambi?
- **Gerarchia delle aree** (7): basta una macroarea facoltativa o serve una gerarchia a più livelli?
- **Periodicità** (8): quanto è strutturata la regola di ricorrenza? Gli interventi ricorrenti si generano in automatico o su conferma?
- **Stato delle aree** (9): il registro dello stato vale anche per le aree o solo per gli elementi?
- **Ambito dei cataloghi** (10): i cataloghi sono unici per tutto il sistema o personalizzabili da ogni organizzazione?
- **Report Access** (11): i report vanno riprodotti con lo stesso impianto o basta coprirne il contenuto?
