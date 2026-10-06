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

**Stato**: Step 1 (analisi della specifica esistente), Step 2 (benchmark) e Step 3 (feature del prodotto) completati. Lo Step 3 ha prodotto attori, posizionamento, catalogo di 102 feature (66 MVP, 29 v2, 7 futuro), scenari e verifica di D-002 e D-008. Step 4 (modello dati) in revisione: schede di cataloghi e dati operativi, corrispondenza con il modello dati CAM v2.1, note Django, decisioni D-027–D-035 da confermare, ipotesi D-006–D-026 verificate. Prossimo passo: chiudere la revisione dello Step 4, poi Step 5, consolidamento.

## Stack (vincolo, non oggetto della specifica)

- Backend: Django, con GeoDjango e PostGIS per le geometrie.
- Frontend: React (SPA) per gli utenti autenticati, più una mappa pubblica in sola lettura (D-015).
- Interfaccia responsive, usabile in campo da smartphone e tablet (GPS e fotocamera dal browser). Connessione richiesta nell'MVP; in v2 la raccolta in campo funziona anche offline (D-014).

## Perimetro della specifica

**Dentro**: entità di dominio, cataloghi, flussi operativi, regole di business, report ed export, modello dati.

**Fuori** (solo nominati come vincoli, non specificati): autenticazione, multi-tenancy, ruoli e permessi, infrastruttura, deploy, design della UI.

## Ipotesi di lavoro

Il registro completo, con le motivazioni, è in [designdocs/decisioni.md](designdocs/decisioni.md). In sintesi:
- **Unità di censimento**: il singolo elemento georeferenziato (albero = punto, siepe o filare = linea, prato o aiuola = poligono), raggruppato in aree. Confermata allo Step 3 (D-002).
- **Uso offline**: escluso dall'MVP, previsto in v2 per la raccolta in campo. Il modello lo prevede fin dall'MVP: UUID come identificativi, autore e data di ogni modifica (D-014).
- **Riferimento di partenza**: la specifica di un software Access 97 per il censimento del verde pubblico, in [resources/](resources/). È un esempio pensato per il desktop, non un requisito.
- **Dallo Step 1**: cataloghi gestiti nell'applicazione (D-005), specie separata dalla classe di elemento (D-006), stato come osservazione datata (D-007), interventi con ciclo pianificato → eseguito (D-008).
- **Dallo Step 2**: aree classificate per tipologia ISTAT, destinazione d'uso e intensità di fruizione (D-009); valutazioni di stabilità e rischio con protocolli a catalogo (D-010); import ed export secondo il modello dati CAM (D-011).
- **Dallo Step 3**:
  - posizionamento: gestione tecnica e rapporto tra committente ed esecutore (validazione, non conformità; prezzario e SAL dopo l'MVP), senza gestione d'impresa (D-012); committente come soggetto del dominio, legato all'esecutore da un affidamento (D-013);
  - vincoli di prodotto: offline in v2 (D-014); mappa pubblica in sola lettura nell'MVP (D-015); cataloghi di sistema con voci aggiuntive dell'organizzazione (D-016); giochi censiti nell'MVP, ispezioni in v2 (D-017);
  - dominio: elementi di gruppo con composizione di specie (D-018); zona come unico livello sopra l'area (D-019); piano degli interventi generato dalle regole su conferma del gestore (D-020); osservazioni anche sulle aree (D-021); valutatore esterno dentro o fuori dal sistema (D-022); alberi dedicati senza dati anagrafici (D-023); autorizzazioni come estremi dell'atto (D-024); ciclo pianificato → eseguito → validato, con le non conformità (D-025); nessun import dedicato da Access, posizione provvisoria (D-026).
- **Dallo Step 4** (in revisione): cataloghi con voci di sistema e dell'organizzazione, enumerazioni nel codice, voci dell'organizzazione di gestione sui dati del committente (D-027); misure nelle osservazioni (D-028); posto d'impianto come classi e legame di sostituzione (D-029); codici CAM come corrispondenza (D-030); persone del dominio distinte dagli utenti, esecutori e squadre (D-031); committente con organizzazione di gestione, senza entità proprietario (D-032); interventi proposti e piano come vista (D-033); storico delle modifiche e registri non cancellabili (D-034); geometrie in WGS84, export CAM in RDN2008 (D-035).

## Convenzioni

- Documentazione **in italiano**.
- Nomi di entità e campi del modello **in inglese** (`Tree`, `Species`, `Intervention`…), con la corrispondenza IT↔EN in [designdocs/glossario.md](designdocs/glossario.md).
- Documenti in Markdown dentro [designdocs/](designdocs/), diagrammi in Mermaid.
- Ogni documento di specifica termina con una sezione **"Domande aperte"**.
- Ogni decisione presa va registrata in `designdocs/decisioni.md` e, se introduce termini nuovi, nel glossario.
- Alla chiusura di ogni passo va aggiornata la riga **Stato** qui sopra.
