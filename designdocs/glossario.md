# Glossario

Termini di dominio e nome dell'entità corrispondente nel modello.
- **Nome nel modello**: provvisorio fino allo Step 4.
- **Origine**: indica da dove viene il termine (*Access* = specifica Access 97 in `resources/`; *Step n* = introdotto nel passo n della specifica).

| Termine | Nome nel modello | Definizione | Origine |
|---|---|---|---|
| Area | `Area` | Porzione di territorio che raggruppa elementi censiti, identificata da numerazione e subalterno. È classificata per categoria e tipologia e ha una superficie. | Access |
| Numerazione e subalterno | campi di `Area` | Codice identificativo dell'area, formato da un numero e da un subalterno. | Access |
| Macroarea | `MacroArea` | Raggruppamento facoltativo di aree, usato da alcuni comuni. | Access |
| Categoria di area | `AreaCategory` | Classificazione d'uso dell'area (es. incolta, agricola, boschiva). | Access |
| Tipologia di area | `AreaType` | Classificazione tipologica dell'area (la spec Access non riporta esempi). | Access |
| Habitus | — | Nella spec Access: forma di crescita o classe dell'elemento (es. alberi – angiosperme, arbusti, tappezzanti, arredi urbani). Determina l'unità di misura richiesta e se va rilevata l'altezza. Nel nuovo modello confluisce nella classe di elemento (D-006). | Access |
| Unità di misura | — | Unità con cui si misura la quantità di un elemento censito (es. numero, metri, metri quadri). Nella spec Access è fissata dall'habitus. | Access |
| Elemento (dizionario) | — | Nella spec Access: voce del catalogo di ciò che si può censire (es. *Acer campestre*), legata a un habitus. Comprende sia specie botaniche sia arredi. Nel nuovo modello si divide tra specie e classe di elemento (D-006). | Access |
| Censimento | — | Nella spec Access: registrazione aggregata di uno o più elementi dello stesso tipo in un'area, con quantità e condizione, senza posizione. Nel nuovo modello è sostituito dall'elemento georeferenziato (D-002). | Access |
| Condizione | `Condition` | Stato dell'elemento o del gruppo di elementi censiti. Nel nuovo modello è il valore di un'osservazione datata (D-007). | Access |
| Tipo di operazione | `InterventionType` | Voce del catalogo degli interventi possibili (es. estirpazione, spollonatura). | Access |
| Operazione | — | Nella spec Access: un tipo di operazione suggerito per un censimento, con affidamento, periodicità e anno. Nel nuovo modello diventa un intervento (D-008). | Access |
| Affidamento | `Assignment` | Chi gestisce il verde o esegue l'intervento (es. tecnici comunali, ditta terza). | Access |
| Periodicità | `Recurrence` | Frequenza di un intervento, infrannuale o pluriennale. | Access |
| Comune | — | Nella spec Access: il comune titolare del database e dei dati censiti. Nel nuovo modello è un caso di committente. | Access |
| Studio | — | Nella spec Access: lo studio che esegue i censimenti. I suoi dati servono solo a intestare le stampe. Non è un'entità del nuovo modello. | Access |
| Committente | da definire allo Step 3 | Soggetto a cui appartengono aree ed elementi (comune, condominio, azienda), distinto da chi gestisce il verde. | Step 1 |
| Specie | `Species` | Voce del catalogo botanico: nome scientifico, nome comune, genere, famiglia, cultivar. È separata dalla classe di elemento (D-006). | Step 1 |
| Classe di elemento | `ElementClass` | Classificazione dell'elemento censito (es. albero, arbusto, siepe, prato, arredo). Determina tipo di geometria, unità di misura e attributi da rilevare. Deriva dall'habitus Access (D-006). | Step 1 |
| Osservazione | `Observation` | Rilievo datato dello stato di un elemento, con autore ed eventuali foto. Lo stato corrente è l'ultima osservazione (D-007). | Step 1 |
| Intervento | `Intervention` | Azione su uno o più elementi o su un'area, con ciclo pianificato → eseguito, date ed esecutore (D-008). | Step 1 |
