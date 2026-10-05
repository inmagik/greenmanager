# GreenManager — contesto di progetto

## Obiettivo

GreenManager è una webapp per il **censimento e la gestione del verde** su un territorio. Si rivolge a:
- ditte di manutenzione del verde
- enti pubblici (comuni, consorzi, parchi)
- privati che gestiscono superfici verdi estese (complessi residenziali, aziende, ville storiche)

Il sistema si regge su tre pilastri:
1. **Censimento**: inventario georeferenziato delle specie e degli elementi vegetali (e degli arredi) presenti sul territorio.
2. **Registro delle azioni**: interventi pianificati ed eseguiti (potature, abbattimenti, sfalci, messe a dimora, trattamenti…).
3. **Registro dello stato**: osservazioni datate sulla condizione della vegetazione, incluse le foto, che formano lo storico di ogni elemento.

## Fase attuale

Il progetto è nella fase di **specifica del dominio applicativo**. Non c'è ancora codice.
La metodologia, i passi e lo stato di avanzamento sono in [designdocs/README.md](designdocs/README.md).

**Stato**: Step 1 (analisi della specifica esistente) completato. Prossimo passo: Step 2, benchmark di prodotti simili.

## Stack (vincolo, non oggetto della specifica)

- Backend: Django, con GeoDjango e PostGIS per le geometrie.
- Frontend: React (SPA), accessibile solo a utenti autenticati.
- Interfaccia responsive, usabile in campo da smartphone e tablet (GPS e fotocamera dal browser), con connessione sempre richiesta.

## Perimetro della specifica

**Dentro**: entità di dominio, cataloghi, flussi operativi, regole di business, report ed export, modello dati.

**Fuori** (solo nominati come vincoli, non specificati): autenticazione, multi-tenancy, ruoli e permessi, infrastruttura, deploy, design della UI.

## Ipotesi di lavoro

Il registro completo, con le motivazioni, è in [designdocs/decisioni.md](designdocs/decisioni.md). In sintesi:
- **Unità di censimento**: il singolo elemento georeferenziato (albero = punto, siepe o filare = linea, prato o aiuola = poligono), raggruppato in aree.
- **Uso offline** escluso per ora, ma il modello non deve precluderlo (es. UUID come identificativi).
- **Riferimento di partenza**: la specifica di un software Access 97 per il censimento del verde pubblico, in [resources/](resources/). È un esempio pensato per il desktop, non un requisito.
- **Dallo Step 1**: cataloghi gestiti nell'applicazione (D-005), specie separata dalla classe di elemento (D-006), stato come osservazione datata (D-007), interventi con ciclo pianificato → eseguito (D-008).

## Convenzioni

- Documentazione **in italiano**.
- Nomi di entità e campi del modello **in inglese** (`Tree`, `Species`, `Intervention`…), con la corrispondenza IT↔EN in [designdocs/glossario.md](designdocs/glossario.md).
- Documenti in Markdown dentro [designdocs/](designdocs/), diagrammi in Mermaid.
- Ogni documento di specifica termina con una sezione **"Domande aperte"**.
- Ogni decisione presa va registrata in `designdocs/decisioni.md` e, se introduce termini nuovi, nel glossario.
- Alla chiusura di ogni passo va aggiornata la riga **Stato** qui sopra.
