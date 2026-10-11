# Istruzioni per la revisione del codice

Queste regole valgono per la revisione delle pull request. Il contesto del progetto è in `AGENTS.md`, le decisioni registrate in `designdocs/decisioni.md`.

## Lingua

- Scrivi i commenti in italiano. Identificatori, nomi di file e citazioni di codice restano come sono.

## Revisioni successive alla prima

- Se la PR ha già una tua revisione, commenta solo le righe aggiunte o modificate dai commit successivi a quella revisione.
- Non aggiungere rilievi su codice non cambiato dall'ultima revisione ("previously missed"). Unica eccezione: vulnerabilità sfruttabili, perdita o corruzione di dati, accesso ai dati di un'altra organizzazione.
- In queste revisioni pubblica solo rilievi di gravità alta o media.
- Non riproporre, neanche riformulati, rilievi già risolti, chiusi o con una risposta, né quelli che una risposta o una issue aperta dichiarano rimandati.
- Se una correzione risolve il rilievo, accettala: non chiedere di irrigidire ancora lo stesso punto, salvo che introduca un difetto nuovo.

## Soglia dei rilievi

- Segnala solo difetti con uno scenario concreto: input o stato di partenza, risultato atteso, risultato ottenuto.
- Non segnalare:
  - formattazione, ordine degli import e stile, già controllati da black, isort, flake8, ESLint e Prettier;
  - preferenze di nomi o di struttura senza un difetto;
  - test, documentazione o descrizioni OpenAPI mancanti, salvo che il codice cambiato renda falso un test o un documento esistente;
  - difese contro chi ha accesso diretto al database o alle sue credenziali (UPDATE, DELETE o TRUNCATE via SQL);
  - scelte coerenti con una decisione registrata in `designdocs/decisioni.md`.

## Concorrenza

- Segnala race condition, ordine dei lock e deadlock solo con uno scenario realistico nell'uso previsto: pochi utenti per organizzazione, modifiche concorrenti allo stesso dato rare.
- Indica le due operazioni dell'applicazione (API, admin, comando) che entrano in conflitto e la sequenza che produce il difetto.
- Non segnalare scenari teorici, come lo staff e un utente che modificano lo stesso record nello stesso istante.
