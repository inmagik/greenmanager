# 04 — Modello dati

> **Stato**: da iniziare · **Passo**: 4 di 5 · Metodologia in [README.md](README.md)

- **Obiettivo**: definire il modello dati del dominio, pronto per essere tradotto in modelli Django.
- **Input**: [03-features.md](03-features.md), [glossario.md](glossario.md), [decisioni.md](decisioni.md).
- **Output atteso**: il diagramma ER, una scheda per ogni entità e le scelte di modellazione motivate.

## 1. Panoramica

_Diagramma ER in Mermaid._

## 2. Cataloghi

_Specie, classi di elemento, tipi di intervento, condizioni… Come si gestiscono le voci globali e le personalizzazioni per organizzazione._

## 3. Dati operativi

_Aree, elementi, interventi, osservazioni, foto. Una scheda per entità con attributi, tipi, vincoli e cardinalità._

## 4. Scelte di modellazione

_Geometrie (punto, linea, poligono), storicizzazione dello stato tramite osservazioni datate, ciclo degli interventi (pianificato → eseguito), identificativi UUID (D-004). Conferma o revisione di D-006 (specie separata dalla classe di elemento) e D-007 (stato come osservazione datata)._

## 5. Note di mappatura su Django

_Suddivisione in app ed estensioni necessarie (GeoDjango/PostGIS). Nessun codice._

## Domande aperte

-
