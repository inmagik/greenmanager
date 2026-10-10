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

La **specifica del dominio applicativo** è quasi completa: manca il consolidamento (Step 5). Il **binario tecnico** ha prodotto lo scaffold del codice in `server/` e `frontend/`, senza app di dominio, che si aggiungono a partire dalla prima fetta verticale (D-040).
La metodologia, i passi di entrambi i binari e lo stato di avanzamento sono in [designdocs/README.md](designdocs/README.md).

**Stato**: Step 1 (analisi della specifica esistente), Step 2 (benchmark), Step 3 (feature del prodotto) e Step 4 (modello dati) completati. Lo Step 3 ha prodotto attori, posizionamento, catalogo di 102 feature (66 MVP, 29 v2, 7 futuro) e scenari; lo Step 4 schede di cataloghi e dati operativi, corrispondenza con il modello dati CAM v2.1 e note Django, con le decisioni D-027–D-035 confermate alla revisione (D-035 con la modifica sulle geometrie multiparte). Binario tecnico: T1 (stack e scaffold di riferimento) completato, con i documenti in [designdocs/architettura/](designdocs/architettura/README.md) e le decisioni D-036–D-039 confermate; T4 (scaffold) completato, con il codice in `server/` e `frontend/`. La revisione dello Step 4 e di T1 ha rivisto la sequenza dei passi (D-040). Prossimo passo: T2 e T3 insieme a una prima fetta verticale (cataloghi, committente, zone e aree, elementi su mappa); lo Step 5 (consolidamento) in parallelo.

## Stack (vincolo, non oggetto della specifica del dominio)

Dettagli, versioni e regole di copia sono in [designdocs/architettura/](designdocs/architettura/README.md).

- Backend: Python 3.14, Django 6.1 e Django REST Framework, con GeoDjango e PostGIS per le geometrie. Autenticazione JWT, organizzazioni come tenant (D-037), job asincroni con django-rq e Redis (D-039).
- Frontend: SPA React 19 con Vite, TypeScript e Mantine 9, data fetching con `@inmagik/react-crud` e TanStack Query (D-038), per gli utenti autenticati; più una mappa pubblica in sola lettura (D-015).
- Interfaccia responsive, usabile in campo da smartphone e tablet (GPS e fotocamera dal browser). Connessione richiesta nell'MVP; in v2 la raccolta in campo funziona anche offline (D-014).
- Lo scaffold si copia dai progetti INMAGIK di riferimento (D-036): [inmagik/data-lab](https://github.com/inmagik/data-lab) per struttura, app core e pattern; [inmagik/bottaro-pesatura](https://github.com/inmagik/bottaro-pesatura) per le versioni delle dipendenze, lo storico di django-auditlog e i pattern CRUD del modulo `anagrafica`. Si parte dai commit più recenti al momento della copia. Le convenzioni proprie di bottaro-pesatura (identificatori in italiano, codice single-tenant) non valgono qui.

## Perimetro della specifica

**Dentro**: entità di dominio, cataloghi, flussi operativi, regole di business, report ed export, modello dati.

**Fuori** (solo nominati come vincoli, non specificati nel dominio): autenticazione, multi-tenancy, ruoli e permessi, infrastruttura, deploy, design della UI.
- Autenticazione, multi-tenancy, ruoli e permessi e ambiente di sviluppo hanno un'implementazione di riferimento nello scaffold, descritta nel binario tecnico. Le regole di accesso proprie del dominio vi si innestano al passo T3.
- Deploy e design visivo dell'interfaccia restano fuori. I pattern dell'interfaccia sono il passo T2.

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
- **Dallo Step 4**: cataloghi con voci di sistema e dell'organizzazione, enumerazioni nel codice, voci dell'organizzazione di gestione sui dati del committente (D-027); misure nelle osservazioni (D-028); posto d'impianto come classi e legame di sostituzione (D-029); codici CAM come corrispondenza (D-030); persone del dominio distinte dagli utenti, esecutori e squadre (D-031); committente con organizzazione di gestione, senza entità proprietario (D-032); interventi proposti e piano come vista (D-033); storico delle modifiche e registri non cancellabili (D-034); geometrie in WGS84, con linee e poligoni anche multiparte, export CAM in RDN2008 con un oggetto per parte (D-035).
- **Dal binario tecnico, T1**: scaffold dai progetti di riferimento (D-036); organizzazione come tenant, con i dati del patrimonio filtrati tramite l'organizzazione di gestione del committente (D-037); frontend come SPA React a moduli (D-038); job asincroni e pianificati con `jobs_core` (D-039).
- **Dalla revisione dello Step 4 e di T1**: sequenza dei passi rivista, con lo scaffold subito, T2 e T3 insieme a una prima fetta verticale e lo Step 5 in parallelo (D-040).

## Comandi

Comandi, struttura e regole di ogni componente sono nel suo `AGENTS.md`: [server/AGENTS.md](server/AGENTS.md) e [frontend/AGENTS.md](frontend/AGENTS.md). In breve:
- **server**, da `server/`: `docker compose up -d db redis`, poi da `server/greenmanager/` `python manage.py runserver` e `python manage.py test`;
- **frontend**, da `frontend/`: `yarn dev`, `yarn lint`, `yarn build`.

## Convenzioni

- Documentazione **in italiano**.
- Nomi di entità e campi del modello **in inglese** (`Tree`, `Species`, `Intervention`…), con la corrispondenza IT↔EN in [designdocs/glossario.md](designdocs/glossario.md).
- Documenti in Markdown dentro [designdocs/](designdocs/), diagrammi in Mermaid.
- Ogni documento di specifica termina con una sezione **"Domande aperte"**.
- Ogni decisione presa va registrata in `designdocs/decisioni.md` e, se introduce termini nuovi, nel glossario.
- Alla chiusura di ogni passo va aggiornata la riga **Stato** qui sopra.
- **Codice**:
  - identificatori in inglese (D-001), a differenza di bottaro-pesatura; i testi dell'interfaccia stanno nelle traduzioni, in italiano;
  - Python formattato con black e isort, controllato con flake8; TypeScript con ESLint e Prettier. Configurazioni in §6 di [backend.md](designdocs/architettura/backend.md) e §7 di [frontend.md](designdocs/architettura/frontend.md);
  - ogni componente (`server/`, `frontend/`) ha un proprio `AGENTS.md`, con accanto un `CLAUDE.md` che contiene solo `@AGENTS.md`.
