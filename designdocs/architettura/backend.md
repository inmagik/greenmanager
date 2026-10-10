# Backend

> **Stato**: completato per T1; §8 in corso con T3 e la prima fetta verticale · **Passo**: T1 e T3 del binario tecnico · Metodologia in [README.md](../README.md)

- **Obiettivo**: descrivere il progetto Django di GreenManager: struttura, settings, app core, pattern delle app di dominio, ambiente di sviluppo, versioni.
- **Fonte**: `server/` di [inmagik/data-lab](https://github.com/inmagik/data-lab) per struttura e pattern, [inmagik/bottaro-pesatura](https://github.com/inmagik/bottaro-pesatura) per le versioni (D-036). Commit e regole di copia in [README.md](README.md).
- **App di dominio**: elenco, permessi e regole sono in §8, che cresce con la prima fetta verticale (T3, D-040), partendo da §5 di [04-modello-dati.md](../04-modello-dati.md).

## 1. Struttura

```
server/
├── greenmanager/               radice Django, contiene manage.py
│   ├── manage.py
│   ├── greenmanager/           package di progetto
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── schema.py           AutoSchema di drf-spectacular per X-Tenant-ID
│   │   ├── wsgi.py
│   │   └── asgi.py
│   ├── auth_core/              utenti, ruoli, permessi (§3.1)
│   ├── tenants/                organizzazioni (§3.2)
│   ├── jobs_core/              job asincroni e pianificati (§3.3)
│   ├── inmagik_utils/          mixin e utilità condivise (§3.4)
│   └── <app di dominio>/       definite in T3
├── requirements.txt
├── requirements_prod.txt       gunicorn
├── Dockerfile
├── docker-compose.yml          database e Redis per lo sviluppo
├── build_image.sh
├── .devcontainer/
└── scripts/
    ├── start                   server
    ├── worker                  worker RQ
    └── scheduler               scheduler RQ
```

Rotte del progetto, in `greenmanager/urls.py`:

| Prefisso | Contenuto |
|---|---|
| `DJANGO_ADMIN_PATH` (default `admin/`) | admin di Django |
| `api/userbase/` | django-userbase: attivazione dell'account, recupero e cambio della password (`auth_core/account_urls.py`) |
| `api/core/auth/` | token JWT, `me/`, `permissions/`, `users/`, `roles/` (§3.1) |
| `api/core/` | `tenants/`, `tenant-memberships/` (§3.2) |
| `api/<app>/` | un prefisso per ogni app di dominio (§4.5) |
| `api/schema/`, `api/schema/swagger-ui/` | schema OpenAPI e Swagger UI |

In `DEBUG` il server espone anche i file di `MEDIA_ROOT`.

## 2. Settings

Un solo `settings.py`, come in data-lab:
- ogni valore che cambia tra ambienti si legge da una variabile d'ambiente `DJANGO_*`, con un default per lo sviluppo;
- il file è diviso in blocchi `# region … / # endregion`: REST framework, email, deployment, utenti e autenticazione, RQ, job pianificati, sviluppo;
- in fondo importa `localsettings.py`, se c'è, per le modifiche locali. Il file è in `.gitignore`.

### 2.1 Contenuto

| Blocco | Contenuto |
|---|---|
| Base | `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS` |
| `INSTALLED_APPS` | in tre gruppi commentati. *Django*: le app standard più `django.contrib.postgres` e `django.contrib.gis`. *Librerie*: `rest_framework`, `django_filters`, `axes`, `auditlog`, `drf_spectacular`, `userbase`, `inmagik_utils`, `django_rq`. *Locali*: `tenants`, `auth_core`, `jobs_core`, poi le app di dominio |
| `MIDDLEWARE` | quelli standard più `axes.middleware.AxesMiddleware` e `auditlog.middleware.AuditlogMiddleware` |
| Database | motore `django.contrib.gis.db.backends.postgis` |
| Lingua e ora | `LANGUAGE_CODE = "it-it"`, `TIME_ZONE = "Europe/Rome"`, `USE_TZ = True` |
| File | `STATIC_URL`, `MEDIA_URL`, `STATIC_ROOT`, `MEDIA_ROOT`, con lo slash finale aggiunto se manca |
| REST framework | autenticazione JWT (simplejwt) e di sessione; `IsAuthenticated` come permesso di default; schema `greenmanager.schema.TenantAwareAutoSchema`, sottoclasse di `AutoSchema` (riga sotto) |
| drf-spectacular | `TITLE`, `VERSION`, `COMPONENT_SPLIT_REQUEST`; lo schema di sicurezza `TenantId` (header `X-Tenant-ID`), che `greenmanager.schema.TenantAwareAutoSchema` (`DEFAULT_SCHEMA_CLASS`) aggiunge alle sole operazioni dei viewset con `TenantContextMixin`. In data-lab un hook lo aggiungeva a ogni operazione autenticata, anche a `me/` e `tenants/`, che il client chiama prima di conoscere un tenant |
| Email | `EMAIL_VENDOR`: `console` in sviluppo, `smtp` con i parametri del server |
| Deployment | `DJANGO_ADMIN_PATH`, `FRONTEND_URL` (link nelle email), `SECURE_PROXY_SSL_HEADER`, `USE_X_FORWARDED_HOST` |
| Utenti e autenticazione | `AUTH_USER_MODEL = "auth_core.User"`; `USERBASE_SETTINGS` (template e oggetti delle email, URL di reset e attivazione); `SIMPLE_JWT` (accesso 8 ore, refresh 7 giorni, `UPDATE_LAST_LOGIN`: senza, l'ultimo accesso nella lista degli utenti restava vuoto); backend di autenticazione con `AxesStandaloneBackend` per primo; blocco dopo 10 tentativi falliti per utente e IP |
| RQ | connessione Redis e coda `default`, con timeout e durata dei risultati |
| Job pianificati | `SCHEDULED_TASKS`: job con espressione cron, allineati all'avvio dello scheduler (§3.3) |
| Sviluppo | `INTERNAL_IPS`, import di `localsettings.py` |

### 2.2 Adattamenti rispetto a data-lab

- Nome del progetto: `datalab` → `greenmanager` in `ROOT_URLCONF`, `WSGI_APPLICATION`, oggetti delle email, nome e utente di default del database.
- Lingua e ora come in bottaro-pesatura (`it-it`, `Europe/Rome`); data-lab usa `en-us` e `UTC`.
- `DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"`, `ASGI_APPLICATION`, `TITLE` e `VERSION` di drf-spectacular, `EMAIL_PORT` come intero: come in bottaro-pesatura.
- Import di `localsettings.py` con `except ImportError`, come in bottaro-pesatura: un errore nel file locale non deve passare inosservato (data-lab usa `except Exception`).
- Si tolgono `solo`, `docs_core`, le app di simulazione, `AVAILABLE_SIMULATORS` e `SIMULATIONS_WORKDIR`.
- `urls.py` monta l'admin su `settings.DJANGO_ADMIN_PATH`; data-lab definisce la variabile ma usa `"admin/"` fisso.
- `AXES_USERNAME_CALLABLE` punta a una funzione invece che a una lambda, come chiede flake8.

### 2.3 Variabili d'ambiente

| Variabile | Default | Uso |
|---|---|---|
| `DJANGO_SECRET` | chiave insicura di sviluppo | `SECRET_KEY` |
| `DJANGO_DEBUG` | `True` | |
| `DJANGO_ALLOWED_HOSTS` | `*` | elenco separato da virgole |
| `DJANGO_CSRF_TRUSTED_ORIGINS` | — | elenco separato da virgole |
| `DJANGO_PG_NAME`, `DJANGO_PG_USER`, `DJANGO_PG_PASS` | `greenmanager` | database |
| `DJANGO_PG_HOST`, `DJANGO_PG_PORT` | `127.0.0.1`, `5432` | database |
| `DJANGO_STATIC_URL`, `DJANGO_MEDIA_URL` | `static/`, `media/` | |
| `DJANGO_STATIC_ROOT`, `DJANGO_MEDIA_ROOT` | `static/` e `media/` nella radice Django | |
| `DJANGO_EMAIL_VENDOR` | `console` | `console` o `smtp` |
| `DJANGO_EMAIL_HOST`, `_PORT`, `_USER`, `_PASS`, `_TLS`, `_SSL` | — | solo con `smtp` |
| `DJANGO_DEFAULT_FROM_EMAIL` | `support@mail.inmagik.com` | mittente |
| `DJANGO_ADMIN_PATH` | `admin/` | percorso dell'admin |
| `DJANGO_FRONTEND_URL` | `http://localhost:5173` | link nelle email di attivazione e reset |
| `DJANGO_REDIS_HOST`, `DJANGO_REDIS_PORT`, `DJANGO_REDIS_DB` | `localhost`, `6379`, `0` | code RQ |
| `DJANGO_RQ_DEFAULT_TIMEOUT`, `DJANGO_RQ_DEFAULT_RESULT_TTL` | `360`, `3600` | secondi |

## 3. App core

Si copiano da data-lab con gli adattamenti indicati. Le migrazioni si rigenerano da zero: la storia di data-lab (tenant di default, campi aggiunti nel tempo) non serve.

### 3.1 `auth_core` — utenti, ruoli, permessi

**Modelli.**
- `User` estende `AbstractUser` di django-userbase: l'utente si autentica con email e password. Campi aggiunti:
  - `roles`, i ruoli;
  - `tenants`, le organizzazioni, tramite `TenantMembership`;
  - `permissions`, i permessi assegnati direttamente;
  - `all_permissions`, calcolato: permessi diretti più quelli dei ruoli.
- `Role`: `tenant` (obbligatorio), `name` univoco per tenant, `permissions`.
- I receiver ricalcolano `all_permissions` quando cambiano l'utente, i suoi ruoli o un ruolo.

**Permessi.**
- Ogni app dichiara i propri permessi in `fm_permissions.py`: `permissions = [{"name": "...", "description": "..."}]`. Il codice completo è `<app_label>.<name>`, per esempio `auth_core.READ_USERS`.
- `PermissionManager` raccoglie i permessi di tutte le app installate. L'endpoint `permissions/` li restituisce al frontend, che li usa nel form dei ruoli.
- `ActionPermission` è la classe di permesso dei viewset. Il viewset dichiara `action_permissions = {action: [codici]}`; l'utente deve avere tutti i codici dell'action.
- **I permessi valgono nel tenant della richiesta**: quelli diretti dell'utente più quelli dei suoi ruoli in quel tenant (`tenant_permissions` e `request_permissions` in `utils.py`). Il tenant viene da `get_current_tenant()` della view; una view senza `TenantContextMixin` conta solo i permessi diretti. `all_permissions` resta come unione di tutti i ruoli, per l'admin, e non decide nulla: in data-lab un ruolo di un tenant dava i suoi permessi anche negli altri.
- Ogni action deve comparire in `action_permissions`, comprese le action aggiunte e `bulk_delete`. Un'action senza voce solleva `NotImplementedError`: si sbaglia chiudendo, non aprendo. `OPTIONS` è sempre permesso.
- Il superuser passa ogni controllo, come nel frontend (§5.6 di [frontend.md](frontend.md)).

**Endpoint** sotto `api/core/auth/`:

| Endpoint | Uso |
|---|---|
| `token/`, `token/refresh/` | login e rinnovo del token JWT. Credenziali bloccate da axes: `429` con codice `account_locked` (con simplejwt da solo, un `401` come per le credenziali errate) |
| `me/` | dati dell'utente corrente (`GET`), modifica del nome (`PATCH`) |
| `permissions/` | permessi disponibili |
| `users/` | utenti del tenant corrente; un utente creato da qui entra nel tenant corrente. Action `unlock` per sbloccare un utente bloccato da axes; filtri per stato (attivo, disattivato, bloccato) e ruolo |
| `users/` visto dal tenant | ruoli, permessi effettivi e appartenenze dell'utente sono quelli del tenant corrente; solo lo staff vede le altre appartenenze |
| `roles/` | ruoli del tenant corrente; action `grant_to` e `revoke_from` per assegnare un ruolo a più utenti del tenant e per toglierlo |

**Adattamenti.**
- Gli import di `StandardPaginationMixin` passano da `datasets.commons` a `inmagik_utils.pagination` (§3.4).
- `RuntimePermission` e `ActionPermission` lasciano passare il superuser, come in bottaro-pesatura; in data-lab guardano solo `all_permissions` (domanda 2).
- **Ruoli e permessi degli utenti**: chi crea o modifica un utente e ne cambia ruoli o permessi diretti deve avere anche `WRITE_ROLES`. In data-lab bastava `WRITE_USERS`, e un utente poteva assegnarsi privilegi da solo.
  - Il controllo sta in `UserSerializer` e confronta i valori nuovi con quelli attuali: chi ha solo `WRITE_USERS` può modificare o disattivare un utente anche se la richiesta ripete ruoli e permessi invariati.
  - bottaro-pesatura usa `ManageUserPrivilegesPermission`, che guarda solo la presenza dei campi nella richiesta. Qui non c'è.
- **Utenti visti da un tenant** (revisione della PR dello scaffold): `UserSerializer` riceve il tenant della richiesta.
  - Mostra e accetta solo i ruoli di quel tenant; una modifica conserva i ruoli degli altri tenant.
  - Calcola `all_permissions` sui ruoli di quel tenant; mostra le altre appartenenze solo allo staff.
  - `grant_to` e `revoke_from` accettano solo utenti del tenant.
- **Utenti condivisi** con altri tenant: solo lo staff ne cambia l'email, li disattiva o li elimina (errore `user_shared_with_other_tenants`), perché email, `is_active` e l'utente valgono per tutti i tenant. L'email conta più di tutto: chi la cambia può recuperare la password e usare l'account negli altri tenant.
- **Permessi diretti** (T3, D-045): li cambia solo lo staff, per ogni utente (errore `direct_permissions_staff_only`), perché valgono in tutti i tenant dell'utente. Dentro un'organizzazione i permessi si danno con i ruoli. È una differenza rispetto a data-lab e bottaro-pesatura.
- **Il proprio account**: nessuno lo disattiva o lo elimina (errore `cannot_change_own_account`).
- **Codici dei permessi**: utenti e ruoli accettano solo i codici raccolti da `PermissionManager` (errore `unknown_permission`).
- **Errori con codice** sollevati in `Serializer.validate()`: stanno sotto il campo (`{"email": {"code": ...}}`). DRF trasforma in liste i valori di un payload al primo livello, e il frontend non ne riconoscerebbe più il codice.
- `unlock` risponde con l'utente riletto dal queryset: lo stato di blocco è un'annotazione, che `refresh_from_db()` non aggiorna.
- Il receiver di `m2m_changed` gestisce anche le modifiche dal lato del ruolo (`role.user_set.add(...)`, per esempio dall'admin): in data-lab chiamava `update_permissions()` sul ruolo e falliva.
- **Endpoint di django-userbase**: `auth_core/account_urls.py` monta solo attivazione, recupero, reset e cambio della password, con sottoclassi che ne descrivono lo schema (`account_views.py`). Restano fuori `me/`, un secondo "me" che scrive `last_login` a ogni chiamata, e `resend-activation-email/`, con cui ogni utente autenticato poteva inviare email a qualunque utente e leggerne i dati. `change-password/` richiede l'autenticazione (in userbase non ha permessi, e una richiesta anonima finiva in errore 500); un token valido di un utente cancellato dà `invalid_token`.
- **Email di attivazione**: userbase la invia da `post_save`, dentro la transazione che crea l'utente; `auth_core/receivers.py` sostituisce quel receiver con uno che la invia dopo il commit (`transaction.on_commit`). La creazione dell'utente e della sua appartenenza è una sola transazione.
- `PermissionManager` costruisce l'elenco dei permessi in una variabile locale e lo assegna alla fine. In data-lab due prime richieste simultanee lo riempivano due volte, con permessi duplicati nell'interfaccia. Lo stesso vale per l'elenco dei job schedulabili di `jobs_core`.
- `Role` ha l'ordinamento di default per nome; il viewset dei ruoli lo ripete nel queryset, perché `annotate(Count(...))` ignora `Meta.ordering`.
- I codici dei permessi sono in inglese (`READ_USERS`, `WRITE_USERS`, `READ_ROLES`, `WRITE_ROLES`), come gli altri identificatori (D-001); le descrizioni restano in italiano. In data-lab erano `LETTURA_UTENTI`, `SCRITTURA_UTENTI`, `LETTURA_RUOLI`, `SCRITTURA_RUOLI`: la migrazione `0003_rename_permission_codes` converte quelli già salvati in ruoli e utenti. Le app di dominio usano lo stesso schema, `<app>.<VERBO>_<OGGETTO>`.

### 3.2 `tenants` — organizzazioni

In GreenManager il tenant è l'**organizzazione** che usa il sistema, l'entità di confine `Organization` del modello dati (D-037).

**Modelli.**
- `Tenant`: `name`, `slug` univoco, `is_active`, date di creazione e modifica.
- `TenantMembership`: lega un utente a un tenant. Ogni utente ha al più un tenant di default (vincolo nel database).
- `TenantScopedModel`, astratto: chiave esterna `tenant` (`PROTECT`, indicizzata) e manager `TenantScopedQuerySet` con `for_tenant(tenant)`.

**Mixin per i viewset.**
- `TenantContextMixin.get_current_tenant()` legge il tenant dall'header `X-Tenant-ID` o dal parametro `?tenant=`, una volta per richiesta. Un utente che non è staff vede solo i tenant di cui è membro; un tenant estraneo dà `404` con codice `tenant_not_found`.
- Senza tenant nella richiesta, `restrict_queryset_without_tenant()` restituisce un queryset vuoto agli utenti che non sono staff.
- `TenantScopedViewSetMixin` filtra il queryset con `tenant=<tenant corrente>` e, nella creazione, assegna il tenant corrente. Se manca, risponde con l'errore `tenant_required`. Passa il tenant corrente anche ai serializer (`context["tenant"]`), che validano il record con il tenant che riceverà al salvataggio.

**Endpoint** sotto `api/core/`:
- `tenants/`: lettura per i membri, scrittura solo per lo staff. Un tenant con dati collegati non si elimina (errore `tenant_has_related_data` con l'elenco dei dati). Action `users`, `add-users` e `remove-user` per gestire i membri;
- `tenant-memberships/`: lettura per i membri con `READ_USERS`, scrittura solo per lo staff, come per i tenant. In data-lab bastava `WRITE_USERS`, e un amministratore poteva aggiungere al proprio tenant qualunque utente del sistema. Creazioni, modifiche e cancellazioni, anche multiple, passano da `services.py` (`save_membership`, `remove_tenant_user`), che mantiene un tenant di default; in data-lab l'endpoint salvava direttamente il modello.

Le modifiche ai membri passano da `services.py`, che blocca con `select_for_update` utenti e tenant coinvolti e mantiene un tenant di default per ogni utente. Nell'admin, che salva direttamente i modelli, le pagine di utenti, tenant e appartenenze ripristinano il tenant di default dopo ogni modifica, anche per l'utente da cui un'appartenenza è stata spostata.

**In GreenManager.**
- Le entità che appartengono direttamente a un'organizzazione (persone, squadre, anagrafica degli esecutori, voci di catalogo dell'organizzazione) si appoggiano a questi strumenti.
- I dati del patrimonio appartengono a un committente e si filtrano tramite `Client.managing_organization`; gli esecutori di un'altra organizzazione vi accedono tramite gli affidamenti (§5.4 di [04-modello-dati.md](../04-modello-dati.md)). `TenantScopedViewSetMixin` non basta: l'estensione si definisce in T3 (domanda 5).

### 3.3 `jobs_core` — job asincroni e pianificati

Esegue i lavori lunghi o periodici fuori dalla richiesta HTTP, con django-rq, rq-scheduler e Redis (D-039).

**Modelli.**
- `CronJobDefinition`: job ricorrente con espressione cron, argomenti, coda, abilitazione.
- `ScheduledJobDefinition`: job da eseguire una volta, a una data e ora.
- `JobRun`: un'esecuzione, con stato (`pending`, `running`, `completed`, `failed`), inizio, fine, errore.

**Funzionamento.**
- Ogni app dichiara le funzioni schedulabili in `fm_scheduling.py`: `schedulable_jobs = [{"name": "...", "func": "app.jobs.funzione"}]`. Solo queste si possono usare nelle definizioni.
- Al salvataggio di una definizione, un receiver la registra nello scheduler. Lo scheduler esegue sempre `job_runner`, che chiama la funzione vera e aggiorna il `JobRun`. Se la funzione fallisce, `job_runner` registra l'errore e rilancia l'eccezione, così RQ segna il job come fallito; in data-lab l'eccezione si perdeva.
- Una `ScheduledJobDefinition` crea subito il suo `JobRun`. Per avviare un job da un'API e restituirne subito l'identificativo si crea una `ScheduledJobDefinition` con `start_at` adesso. La guida `how-to.md` dell'app spiega questo e gli altri casi, e si copia così com'è.
- Ogni esecuzione di una `CronJobDefinition` crea un `JobRun` collegato alla definizione (`cron_job_definition`), che passa nei metadati del job. In data-lab il collegamento restava vuoto.
- Il comando `schedule_auto_tasks` allinea allo scheduler i job di `SCHEDULED_TASKS`. Lo lancia `scripts/scheduler` all'avvio.
- Processi: il worker (`python manage.py rqworker default`) e lo scheduler (`scripts/scheduler`), oltre al server.

**In GreenManager**, usi previsti, da confermare in T3: import (`ImportBatch`) ed export CAM, GIS e tabellari; generazione degli interventi proposti dalle regole di ricorrenza (D-020, D-033); scadenzario e promemoria.

**Adattamenti.**
- Si tolgono i job di esempio (`jobs.py`) e le loro voci in `fm_scheduling.py`.
- Il validatore di `func` solleva una `ValidationError` di Django: in data-lab un `ValueError`, che nell'admin dava un errore 500.
- Una `ScheduledJobDefinition` salvata di nuovo riporta il suo `JobRun` a `pending`, e ogni esecuzione parte senza l'esito precedente: in data-lab una riesecuzione riuscita conservava l'errore della precedente.
- Le esecuzioni di una `CronJobDefinition` sono collegate alla definizione (vedi sopra).
- I receiver cambiano lo scheduler (Redis) solo dopo il commit della definizione (`transaction.on_commit`): in data-lab un salvataggio annullato lasciava comunque il job in coda, e un worker poteva partire prima che il `JobRun` fosse salvato.
- `job_runner` importa la funzione dentro il blocco che registra l'errore: una funzione rimossa o rinominata dopo la pianificazione dà un `JobRun` fallito, non solo un errore di RQ.

### 3.4 `inmagik_utils` — utilità condivise

| Modulo | Contenuto |
|---|---|
| `pagination.py` | `StandardPagination` (20 per pagina; risposta con `count`, `full_count`, `page_size`, `next`, `previous`, `results`), `HugePagination` (10.000), `StandardPaginationMixin` e `HugePaginationMixin` per i viewset |
| `mixins.py` | `BulkDeleteActionMixin`: action `POST bulk-delete/` con `{"ids": [...]}`, limitata al queryset visibile, in una transazione. Cancella con `perform_destroy`, quindi con le stesse regole della cancellazione singola (in data-lab chiamava `delete()` direttamente). Il serializer è uno per modello (`<Model>BulkDelete`), così lo schema OpenAPI descrive richiesta e risposta `204` |
| `structural_filters.py` | `StructuralFilterSet` e `StructuralFilterMixin` (sotto) |
| `nested_multi_parser.py` | `NestedMultiPartParser`: interpreta chiavi multipart come `items[0].name` e `items[0].file` in dati annidati, per i form con file |
| `audit_log/` | `standard_auditlog_manager()`: manager che annota `created_at`, `updated_at`, `created_by_email`, `updated_by_email` dalle voci di django-auditlog; `AuditLogFields`, i campi corrispondenti per i serializer; `AuditlogActorMixin` (sotto) |
| `serializers.py` | `FullCleanValidatorSerializerMixin`: applica `full_clean()` del modello nella validazione del serializer |

**Autore delle modifiche.** `AuditlogMiddleware` legge l'utente prima della view, ma con l'autenticazione JWT di DRF l'utente si conosce solo dentro la view: senza altro, le voci di django-auditlog restano senza autore. `AuditlogActorMixin`, in `audit_log/audit_log_mixins.py`, imposta l'utente autenticato da DRF come autore per tutta la richiesta. Si usa in ogni viewset che modifica dati (§4.4).

**Filtri strutturali.** Ogni filtro di uno `StructuralFilterSet` esiste anche con il prefisso `_sf_`.
- I filtri con il prefisso li applica `StructuralFilterMixin` dentro `get_queryset()`: definiscono il contesto, per esempio gli elementi di un'area.
- I filtri senza prefisso li applica `DjangoFilterBackend`, insieme a ricerca e ordinamento: sono le scelte dell'utente.
- `full_count` conta il contesto, `count` i risultati. Il frontend li usa per distinguere "non ci sono dati" da "nessun risultato per questi filtri".

**Adattamenti.**
- `pagination.py` prende posto e nome da bottaro-pesatura e contenuto da `datasets/commons.py` di data-lab, che ha in più lo schema OpenAPI della risposta e `HugePagination`.
- `FullCleanValidatorSerializerMixin` arriva da `datasets/commons.py`.
- `audit_log/` arriva tutta da bottaro-pesatura: in più di data-lab ha `AuditlogActorMixin` e `AuditLogEntrySerializer`, per l'action `history` (§4.4). `AuditLogEntrySerializer` restituisce l'azione come codice stabile (`create`, `update`, `delete`, `access`) e `actor` nullo per le modifiche del sistema: il frontend li traduce. In bottaro-pesatura restituiva l'etichetta e "Sistema".
- Commenti, docstring e messaggi di errore delle app core sono in inglese (D-001); in data-lab e bottaro-pesatura alcuni erano in italiano.
- `nested_multi_parser.py` arriva da bottaro-pesatura: limita le liste nei dati annidati (1.000 elementi per lista, 10.000 in tutto) e lascia chiudere a Django i file caricati.
- `FullCleanValidatorSerializerMixin` valida l'istanza esistente anche con `PUT`. In data-lab ne creava una nuova, e i vincoli di unicità segnalavano il record stesso come doppione. Valida una copia, così il record cambia solo al salvataggio; alla creazione aggiunge i valori che la view assegna al salvataggio (`get_server_assigned_values()`, di default il tenant corrente) e ignora i campi molti-a-molti.
- Si copiano anche i test di `inmagik_utils` di bottaro-pesatura.

## 4. Pattern delle app di dominio

Presi dall'app `datasets` di data-lab e dall'app `anagrafica` di bottaro-pesatura, adattati alle convenzioni di §5.3 di [04-modello-dati.md](../04-modello-dati.md).

### 4.1 File dell'app

| File | Contenuto |
|---|---|
| `models.py` | modelli, enumerazioni, QuerySet |
| `services.py` | operazioni di dominio che toccano più record: copie e derivati, cambi di stato, generazione di interventi. Transazioni esplicite |
| `serializers.py` | serializer di modello e di input |
| `views.py` | viewset |
| `urls.py` | router dell'app |
| `admin.py` | registrazione nell'admin |
| `fm_permissions.py` | permessi dell'app (§4.7) |
| `fm_scheduling.py`, `jobs.py` | job schedulabili e loro funzioni, se l'app ne ha |
| `importers.py`, `management/commands/` | import, export, comandi di manutenzione |
| `receivers.py` | solo effetti tecnici dei segnali; importato in `AppConfig.ready()` |
| `tests.py` o `tests/` | test, con il runner di Django (domanda 1) |

Le copie e i derivati del dominio (per esempio l'ultima condizione sull'elemento) si aggiornano nei servizi, nella stessa transazione del record che li cambia, non con i segnali (§5.3 di [04-modello-dati.md](../04-modello-dati.md)).

### 4.2 Modelli

- **Chiave**: UUID per tutte le entità di dominio, cataloghi compresi, generato di default e in v2 fornibile dal dispositivo (D-014, D-042). data-lab usa chiavi intere, tranne che per le feature geografiche. I campi comuni (§3.1 di [04-modello-dati.md](../04-modello-dati.md)) stanno in `core.TrackedModel` (§8.2).
- **Enumerazioni**: `models.TextChoices`, con valori stabili in inglese minuscolo (es. `GeometryType.POINT = "point", "Point"`).
- **Geometrie**: campi di `django.contrib.gis.db.models` con `srid=4326`. Linee e poligoni possono essere multiparte (D-035): l'area ha un `MultiPolygonField`. Per l'elemento, il cui tipo dipende dalla classe, campo e normalizzazione (per esempio linee e poligoni salvati sempre come multiparte) si fissano in T3.
- **Vincoli e indici**: in `Meta.constraints` (`UniqueConstraint`, anche con `condition`; `CheckConstraint`) e `Meta.indexes`, con nomi espliciti. Ordinamento di default in `Meta.ordering`.
- **QuerySet**: i filtri ricorrenti del dominio sono metodi di un QuerySet usato come manager (`objects = ElementQuerySet.as_manager()`). In `datasets`: `for_dataset()`, `in_bbox()`, `as_geojson_values()`.
- **Testi facoltativi**: `blank=True, default=""`, senza `null`.
- **`__str__`** su ogni modello.

### 4.3 Serializer

- `ModelSerializer` con `read_only_fields` per i campi assegnati dal server (tenant, campi calcolati, date).
- **Relazioni**: la chiave esterna si scrive con l'identificativo; un campo `<relazione>_data` annidato e in sola lettura la restituisce espansa. Esempio di `datasets`: `measure_type_data = MeasureTypeSerializer(source="measure_type", read_only=True)`.
- **Lista e dettaglio**: per la lista un serializer con meno campi, scelto in `get_serializer_class()`.
- **Valori calcolati**: annotati nel queryset del viewset. Il `SerializerMethodField` li legge dall'annotazione e li calcola solo se manca.
- **Input non di modello**: serializer dedicati per il corpo delle action (es. parametri di un import) e per validare i parametri di query (es. `bbox`, con un metodo `validate_bbox`).
- **Errori**: `ValidationError({"code": "...", "params": {...}, "detail": "..."})`.
  - `code` è stabile, in snake_case; il frontend lo traduce con la chiave `serverErrors.<code>` e i `params`;
  - `detail` è in inglese, per l'API e i log.
- **Validazione del modello**: `FullCleanValidatorSerializerMixin` dove contano le regole di `clean()` del modello.

### 4.4 Viewset

- `ModelViewSet` con i mixin prima della classe base, in quest'ordine:
  1. `AuditlogActorMixin`, per l'autore delle modifiche (§3.4);
  2. `TenantScopedViewSetMixin`, oppure `TenantContextMixin` se il filtro per organizzazione è indiretto (§3.2). Per i dati del patrimonio, `ClientScopedViewSetMixin` (§8.6);
  3. `StandardPaginationMixin`;
  4. `StructuralFilterMixin`;
  5. `BulkDeleteActionMixin`, se serve l'eliminazione multipla.
- `permission_classes = [ActionPermission]` e `action_permissions` completo (§3.1).
- `filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]`, con `filterset_class` (uno `StructuralFilterSet`), `search_fields` e `ordering_fields`.
- Queryset con `select_related` e `prefetch_related` per i dati annidati, annotazioni per i valori calcolati, ordinamento di default.
- La view valida l'input, chiama il servizio di dominio e serializza il risultato. La logica sta nei servizi.
- **Action aggiunte**: `@action(detail=…, methods=[…], url_path="kebab-case")` con `@extend_schema` per richiesta, risposta e parametri. Una action che restituisce una lista non paginata dichiara `pagination_class=None`, altrimenti lo schema la descrive paginata. `python manage.py spectacular --file /dev/null` non deve dare errori né avvisi.
  - Storico del record: action `history` (dettaglio, `GET`), che restituisce `LogEntry.objects.get_for_object(...)` con `AuditLogEntrySerializer`. La usa `AuditHistoryModal` nel frontend; il modello è `anagrafica` di bottaro-pesatura. Nelle app di dominio la dà `AuditHistoryActionMixin` (§8.2).
  - Voci da scegliere nei form: action `choices` (lista, `GET`), con `ChoicesActionMixin` (§8.2).
  - Upload con `parser_classes=[NestedMultiPartParser, FormParser]`.
  - Operazioni lunghe: avvio di un job (§3.3), con risposta che contiene l'identificativo del `JobRun`.
- **Export di file**: `HttpResponse` con `Content-Disposition: attachment; filename="…"`. Excel con openpyxl.
- **GeoJSON per la mappa**:
  - geometria convertita dal database: `Cast(AsGeoJSON("geometry"), output_field=JSONField())`, senza `json.loads` per riga;
  - lettura a blocchi con `iterator(chunk_size=…)`;
  - filtro `bbox=minx,miny,maxx,maxy` con `geometry__intersects`, senza paginazione: il limite è la porzione di mappa visibile;
  - parametro `srid` facoltativo per trasformare le coordinate.

### 4.5 URL

- Un `DefaultRouter` per app, con risorse al plurale in kebab-case e `basename` al singolare: `router.register(r"geo-datasets", GeoDatasetViewSet, basename="geo-dataset")`.
- `urlpatterns = router.urls`, incluso in `greenmanager/urls.py` sotto `api/<app>/`.

### 4.6 Admin

Ogni modello è registrato, con `list_display`, `list_filter`, `search_fields` e `autocomplete_fields` per le relazioni. I modelli con geometria usano `GISModelAdmin`. L'admin serve allo staff per supporto e verifiche; gli utenti usano il frontend.

### 4.7 Permessi delle app di dominio

- Codici in inglese, per area funzionale: `READ_*` per la lettura e `WRITE_*` per la scrittura (in `datasets`: `READ_CONTENTS`, `WRITE_LAYERS`). La `description` è in italiano.
- Gli stessi codici compaiono come costanti nel `permissions.ts` del modulo frontend (§4 di [frontend.md](frontend.md)).
- L'elenco per GreenManager si definisce in T3, insieme alle regole di accesso tra organizzazioni.

## 5. Ambiente di sviluppo e immagini

### 5.1 Sviluppo locale

Servono Python 3.14 e le librerie GDAL, GEOS e PROJ richieste da GeoDjango (su macOS: `brew install gdal`).

```bash
cd server
docker compose up -d db redis
python3.14 -m venv env
source env/bin/activate
pip install -r requirements.txt
cd greenmanager
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
python manage.py rqworker default    # in un altro terminale, per i job
python manage.py rqscheduler         # solo se servono job pianificati
```

`server/docker-compose.yml`:
- `db`: `postgis/postgis:18-3.6`, con dati in `./data/db` e porta 5432. data-lab fissa `platform: linux/amd64`, perché l'immagine PostGIS non è sempre pubblicata per arm64;
- `redis`: `redis:8`, con healthcheck e porta 6379.

### 5.2 Devcontainer

Si parte da quello di data-lab, con queste correzioni:
- il `Dockerfile` installa anche GDAL, GEOS e PROJ (`gdal-bin`, `libgdal-dev`, `libgeos-dev`, `libproj-dev`, `binutils`);
- il servizio `db` usa l'immagine PostGIS: data-lab usa `postgres:18`, che non ha PostGIS;
- si aggiunge il servizio `redis` e la variabile `DJANGO_REDIS_HOST=redis`;
- l'healthcheck usa l'utente del progetto (`pg_isready -U greenmanager`);
- si toglie `DJANGO_DB_VENDOR`, che i settings non leggono;
- estensioni di VS Code: black, isort, flake8, GitLens.

### 5.3 Immagine del server

- `Dockerfile` su `python:3.14-slim`, con GDAL, GEOS e PROJ; senza la CLI docker, che in data-lab serve ai simulatori. L'immagine imposta `DJANGO_DEBUG=False`; con il debug spento, `settings.py` rifiuta la chiave di sviluppo e chiede `DJANGO_SECRET`.
- Il codice va in `/code`, gli script in `/scripts`, aggiunti al `PATH`. Il comando di default è `start`.
- La stessa immagine fa girare tre processi:

  | Script | Processo |
  |---|---|
  | `start` | `collectstatic`, attesa del database (al massimo 60 secondi), un solo `migrate`, gunicorn `greenmanager.wsgi:application` con 4 worker. In data-lab `migrate` si ripeteva all'infinito anche per errori permanenti |
  | `worker` | `python manage.py rqworker default`. Nuovo: data-lab lo lancia senza script |
  | `scheduler` | `schedule_auto_tasks`, poi `rqscheduler` |

- Gli script si fermano al primo errore (`set -e`). In data-lab un `collectstatic` o uno `schedule_auto_tasks` non riuscito non fermava l'avvio. L'attesa del database usa `until`, la cui condizione non interrompe lo script.

- `build_image.sh` costruisce per `linux/amd64` e pubblica `docker.inmagik.com/greenmanager/server:latest`, come data-lab.

## 6. Strumenti e convenzioni

- **Formattazione e lint**: black (riga 88), isort (profilo black), flake8 (riga 88, `E203` e `W503` ignorati), come prevede bottaro-pesatura. Configurazione in `server/pyproject.toml` e `server/.flake8`.
- **Lingua del codice**:
  - identificatori in inglese (D-001);
  - commenti e docstring in inglese, come in data-lab;
  - descrizioni dei permessi e testi delle email in italiano;
  - messaggi all'utente tradotti nel frontend a partire dai codici di errore (§4.3).
- **Migrazioni**: una per modifica, con nome descrittivo quando non è generato (`--name`). Le migrazioni di dati restano separate da quelle di schema.

## 7. Versioni

Python 3.14. Fonte: `server/requirements.txt` e `requirements_prod.txt` di bottaro-pesatura al commit `3d4b313f00`.

| Pacchetto | Versione | Fonte |
|---|---|---|
| Django | 6.1.1 | bottaro-pesatura |
| djangorestframework | 3.18.1 | bottaro-pesatura |
| django-filter | 26.2 | bottaro-pesatura |
| django-auditlog | 3.4.1 | bottaro-pesatura |
| drf-spectacular | 0.30.0 | bottaro-pesatura |
| django-axes[ipware] | 8.3.1 | bottaro-pesatura |
| djangorestframework-simplejwt | 5.5.1 | bottaro-pesatura |
| PyJWT | 2.15.1 | bottaro-pesatura |
| psycopg[binary,pool] | 3.3.6 | bottaro-pesatura |
| inmagik-django-userbase | 0.0.3, wheel su `fra1.digitaloceanspaces.com/inmagik-builds` con hash | bottaro-pesatura |
| gunicorn | 26.2.0, in `requirements_prod.txt` | bottaro-pesatura |
| django-rq | 4.1.0 | data-lab |
| rq | 2.9.0 | data-lab |
| rq-scheduler | 0.14.0 | data-lab |
| django-imagekit | 6.1.0 | data-lab |
| pillow | 12.2.0 | data-lab |
| openpyxl | 3.1.5 | data-lab |
| python-dateutil | 2.9.0.post0 | data-lab |
| requests | 2.34.2 | data-lab |

- Si escludono `docker`, `numpy` e `qrcode`, che in data-lab servono ai simulatori e ai codici QR.
- `django-solo` (impostazioni come singleton) si valuta in T3. `jsonschema` non serve: gli attributi della classe si validano con una funzione dell'app `catalogs` (§8.4, D-047).
- Strumenti di sviluppo in `requirements-dev.txt`, alle versioni correnti allo scaffold: black 26.10.0, isort 9.0.2, flake8 7.4.1. I test usano il runner di Django, senza dipendenze aggiuntive.
- **Verifica di T4**: con Django 6.1.1 e Python 3.14.2 le librerie prese da data-lab funzionano senza cambi di versione. Migrazioni, test, server, worker e scheduler partono.

## 8. App di dominio

Si scrive in T3, insieme alla prima fetta verticale (D-040): ogni PR della fetta aggiunge le sue app. Decisioni D-041–D-048.

### 8.1 App

| App | Modelli | Prefisso | Arriva con |
|---|---|---|---|
| `core` | modelli astratti, `ChangeRecord` | — | PR1 |
| `catalogs` | `Species`, `ElementClass`, `AttributeDefinition`, `ElementClassAttribute`, `UrbanGreenType`, `AreaUse`, `UsageIntensity`, `RemovalCause` | `api/catalogs/` | PR1 |
| `parties` | `Client` | `api/parties/` | PR1 |
| `territory` | `Zone`, `Area` | `api/territory/` | PR2 |
| `inventory` | `Element`, `CompositionItem` | `api/inventory/` | PR2 |

- Le dipendenze vanno in un solo verso: `core` ← `catalogs` ← `parties` ← `territory` ← `inventory` (D-041). Le chiavi esterne verso entità di app successive (interventi, valutazioni, import) si aggiungono con quelle app.
- `core` non ha endpoint. Lo storico di dominio si consulterà con CE-4 e TR-6.

### 8.2 Basi comuni: `core`

| Modulo | Contenuto |
|---|---|
| `models.py` | `UUIDModel`; `TrackedModel` con `created_at`, `created_by`, `updated_at`, `updated_by`, `revision` (D-042); `ChangeRecord`; `system_entry_id(modello, codice)`, la chiave deterministica delle voci di sistema |
| `services.py` | `ChangeContext` (autore, organizzazione, origine); `change_source(request)`, che legge l'header `X-Change-Source` (`web` o `field`); `stamp`, l'autore della modifica; `snapshot`, i valori di un record in JSON (geometrie in GeoJSON); `record_change`, che scrive il `ChangeRecord`; `lock_for_change(queryset, pk)`, che blocca il record dentro il suo ambito (es. `editable_by(org)`) |
| `errors.py` | `api_error` e `permission_error`, errori con codice; `validate_model`, il `full_clean()` del record con gli errori nella forma dell'API; `check_revision`, il controllo della revisione (`409 revision_conflict`) |
| `serializers.py` | `TrackedModelSerializer`: autori della creazione e dell'ultima modifica (`created_by_label`, `updated_by_label`) e `revision`, che in una modifica è la revisione letta dal client; `pop_revision` |
| `views.py` | `ChangeContextMixin`; `ClientScopedViewSetMixin` (§8.6); `AuditHistoryActionMixin`, action `history`; `ChoicesActionMixin`, action `choices` con il `choice_serializer_class` della view |
| `admin.py` | `ChangeRecord` in sola lettura; `ServiceAdminMixin`, per i modelli che si salvano solo con i servizi: il form mostra gli errori delle regole, salvataggio e cancellazione chiamano i servizi. Una modifica blocca il record e controlla che la revisione sia quella con cui si è aperto il form. Una cancellazione rifiutata dai servizi si mostra come messaggio, e la cancellazione multipla è atomica; `ServiceBackedAdminMixin`, la sua variante per i dati operativi, che scrive il `ChangeRecord` con origine `system` |
| `audit.py` | `register_audit`: registra un modello in django-auditlog senza i campi di tracciamento |
| `permissions.py` | `any_permission(*codici)`: classe di permesso soddisfatta da uno dei codici |
| `testing.py` | `make_tenant`, `make_user` (membro con un ruolo che dà i permessi), `tenant_header` |

### 8.3 Servizi e validazione

Ogni modifica ai dati di dominio passa da un servizio, anche dall'admin.
- **La view** valida tipi e formati con il serializer e chiama il servizio con i dati validati e il `ChangeContext` della richiesta. Il serializer non salva.
- **Il servizio**:
  1. blocca il record con `lock_for_change`, rileggendolo nel suo ambito (`editable_by` dell'organizzazione della richiesta), e controlla la revisione. Un record uscito dall'ambito dopo la lettura della view dà `404`;
  2. applica i valori e ricava i derivati;
  3. controlla le regole di dominio e il modello (`validate_model`);
  4. salva con l'autore (`stamp`) e scrive il `ChangeRecord`, nella stessa transazione.
  I passi 2–3 e 4 sono funzioni separate (`prepare_*` e `commit_*`), così l'admin usa le stesse regole (`ServiceAdminMixin`).
- Gli errori sono quelli di DRF con codice (§4.3). Per gli errori del modello, `validate_model` conserva codice e parametri: i vincoli hanno `violation_error_code`, e `constraint_error_fields` del modello li sposta sul campo giusto (es. `catalog_code_not_unique` su `code`).
- I validatori dei campi del modello che hanno un codice proprio non girano nel serializer (`"validators": []` negli `extra_kwargs`): DRF restituirebbe solo il messaggio.
- I modelli con `TrackedModel` non si aggiornano con `QuerySet.update()`, che salterebbe revisione, autore e storico.

### 8.4 Cataloghi: `catalogs`

**Modelli** (`base.py`):
- `CatalogEntry`: `code`, `name`, `description`, `sort_order`, `source`, `retired`.
- `ExtensibleCatalog` aggiunge `organization` (vuota per le voci di sistema) e `hidden_by`. Il codice è univoco tra le voci di sistema e, per ogni organizzazione, tra le sue voci: un solo vincolo con `nulls_distinct=False`.
- `FixedCatalog`: solo voci di sistema, con codice univoco e `retired`.
- I QuerySet dei due tipi hanno gli stessi metodi:
  - `system()`;
  - `visible_to(org)`: voci di sistema e voci proprie, anche ritirate o nascoste;
  - `available_for(org)`: le voci che l'organizzazione può scegliere;
  - `with_flags(org)`: annota `is_hidden` e `is_available`.

**Endpoint** sotto `api/catalogs/`: `species/`, `element-classes/`, `attribute-definitions/`, `urban-green-types/`, `area-uses/`, `usage-intensities/`, `removal-causes/`.
- Lista, dettaglio, scrittura, `history/` e `choices/` (solo voci disponibili); `hide/` e `unhide/` sui cataloghi estendibili.
- Filtri: `available`, `retired`, `hidden`, `scope` (`system` o `organization`), più quelli del catalogo (es. `rank` per le specie, `category` per le classi).
- Una voce si crea per l'organizzazione della richiesta; lo staff crea voci di sistema con `is_system: true`.
- `ElementClass` scrive i suoi attributi in `class_attributes`, che sostituisce l'elenco. Un attributo nuovo deve essere disponibile per l'organizzazione della classe; uno già presente resta anche se nascosto o ritirato.
- L'admin cambia le voci con gli stessi servizi (`prepare_entry`, `commit_entry`), anche gli attributi delle classi nell'inline.

**Regole** (D-046), in `services.py`:
- voci di sistema solo dallo staff; codice delle voci di sistema immutabile;
- nessuna cancellazione di voci in uso;
- una voce non passa tra il sistema e un'organizzazione (`catalog_scope_immutable`); nei cataloghi senza voci dell'organizzazione, come gli attributi nell'MVP, l'errore è `organization_entries_not_allowed`;
- campi bloccati quando la voce è in uso (`locked_when_in_use`): tipo di geometria e modalità della specie di una classe, tipo e flag di misura di un attributo;
- per i dati di un committente, `check_available(voce, organizzazione di gestione)`. Il valore già salvato resta valido anche se poi la voce è nascosta o ritirata;
- per le specie:
  - nome e genere vengono dal nome scientifico;
  - il genitore ha un livello più alto: un genere non ha genitore, una specie o un ibrido hanno un genere, una cultivar ha un genere, una specie o un ibrido. Così la catena dei genitori non ha cicli, e un rango non cambia se ci sono voci figlie di livello uguale o più alto;
  - il nome scientifico è univoco tra le voci disponibili, nei due versi: una voce propria non ripete una voce di sistema disponibile, una voce di sistema non ripete una voce propria attiva di un'organizzazione che non la nasconde, e una voce di sistema nascosta non si mostra di nuovo finché l'organizzazione ha una voce propria attiva con lo stesso nome. `import_species` applica le stesse regole;
- una voce di sistema nuova, creata dall'API, dall'admin o da `import_species`, ha la chiave deterministica (D-042).

**Attributi della classe** (D-047): `validate_attributes(classe, valori, precedenti)` in `attributes.py` restituisce i valori puliti, oppure un errore con codice per ogni attributo.

**Dati iniziali** (D-048):
- la migrazione `0002_system_entries` carica le voci di sistema dei cataloghi piccoli;
- le specie si caricano con `python manage.py import_species catalogs/seeds/species_starter.csv`, dopo `migrate`. Il comando crea le voci nuove per codice, lascia le esistenti se non c'è `--update` e prova il file con `--dry-run`.

### 8.5 Committenti: `parties`

`api/parties/clients/`, con `history/` e `choices/`.
- L'organizzazione di gestione è quella della richiesta. Solo lo staff ne assegna un'altra (errore `managing_organization_staff_only`), per esempio nella variante K2 (§4.7 di [04-modello-dati.md](../04-modello-dati.md)).
- Un committente con dati non si elimina (`client_has_related_data`): si disattiva con `active`.
- Ogni creazione, modifica e cancellazione scrive un `ChangeRecord`.

### 8.6 Accesso e permessi

**Permessi.**

| Codice | Descrizione |
|---|---|
| `catalogs.WRITE_CATALOGS` | gestione delle voci dei cataloghi dell'organizzazione. La lettura non chiede permessi |
| `parties.READ_CLIENTS`, `parties.WRITE_CLIENTS` | lettura e gestione dei committenti |

**Accesso ai dati del patrimonio** (D-044).
- Il QuerySet del modello ha `visible_to(org)` ed `editable_by(org)`. `ClientScopedViewSetMixin` li applica alle letture e alle scritture.
- Nell'MVP valgono i committenti con `managing_organization` uguale all'organizzazione della richiesta. Gli affidamenti aggiungeranno i loro casi a questi due metodi.
- Senza tenant nella richiesta non si vede nulla, nemmeno dallo staff: i record non hanno un tenant proprio da controllare.
- Le entità con un'organizzazione diretta la chiamano `organization`, come il modello dati.

### 8.7 Storico

Vedi D-043.
- I modelli di dominio si registrano in django-auditlog con `register_audit`, in fondo a `models.py`. La modale dello storico del frontend legge l'action `history`.
- `hidden_by` dei cataloghi resta fuori dallo storico tecnico: una voce di sistema è condivisa, e il suo storico mostrerebbe a ogni organizzazione chi la nasconde nelle altre.
- `ChangeRecord` registra i dati operativi (oggi il committente; poi zone, aree, elementi), non i cataloghi. È immutabile:
  - nell'ORM, `save()` su un record esistente, `delete()` e le operazioni in blocco del QuerySet (`update()`, `delete()`) sollevano un errore;
  - nel database, un trigger rifiuta `UPDATE` e `DELETE` da qualunque client (migrazione `core.0002`). Passa solo l'autore messo a `NULL` quando si cancella l'utente: un secondo trigger, differito, controlla al commit che l'utente non esista più (migrazione `core.0003`). Il nome resta in `author_label`.
- `record_change` salta le modifiche senza differenze. Una cancellazione scrive un *annullamento* con gli ultimi valori.

## Domande aperte

1. **Test.** Runner di Django con `tests.py` per app, come data-lab, o pytest con pytest-django, come prevede bottaro-pesatura? → **chiusa** alla revisione: runner di Django (`python manage.py test`), con `tests.py` o `tests/` per app, come data-lab.
2. **Superuser e permessi.** Il frontend lascia passare il superuser in ogni controllo (`hasPermission`), il backend no: `ActionPermission` guarda solo `all_permissions`. → **chiusa** alla revisione: il superuser passa anche nel backend, in `RuntimePermission` e `ActionPermission`, come in bottaro-pesatura (§3.1).
3. **Storico delle modifiche e django-auditlog.** django-auditlog registra ogni modifica con l'autore e ne ricava date e autori (§3.4). `ChangeRecord` (D-034) chiede in più motivazione, organizzazione, origine e stato di approvazione, ed è consultabile dal committente. Proposta: django-auditlog resta per il tracciamento tecnico, `ChangeRecord` si scrive nei servizi di dominio. In alternativa si estende la voce di django-auditlog con dati aggiuntivi. → **chiusa** nella prima fetta verticale: django-auditlog per il tracciamento tecnico, `ChangeRecord` scritto dai servizi (§8.7, D-043)
4. **Permessi per organizzazione.** `all_permissions` unisce i ruoli di tutti i tenant dell'utente: chi ha ruoli in due organizzazioni ha in ciascuna anche i permessi dell'altra. In GreenManager capita, per esempio con un valutatore esterno. Proposta: calcolare i permessi sui ruoli del tenant della richiesta. Due punti collegati, emersi dalla revisione della PR dello scaffold:
   - i permessi diretti dell'utente (`permissions`) valgono in tutti i tenant;
   - `is_active` e la cancellazione dell'utente valgono per tutti i tenant. Per ora solo lo staff li cambia per gli utenti condivisi (§3.1).

   → **chiusa in parte** alla revisione della PR dello scaffold: server e frontend calcolano i permessi sui ruoli del tenant della richiesta più i permessi diretti (§3.1); email, attivazione, permessi diretti e cancellazione di un utente condiviso li cambia solo lo staff. Resta per T3, nella prima fetta verticale (D-040): se i permessi diretti debbano diventare per tenant, e come si gestiscono gli utenti condivisi (per esempio l'invito di un utente già esistente). → **chiusa** nella prima fetta verticale: i permessi diretti restano per tutti i tenant e li cambia solo lo staff; l'invito di un utente esistente è rinviato agli affidamenti (§3.1, D-045)
5. **Filtro per organizzazione dei dati del patrimonio.** `TenantScopedViewSetMixin` filtra su un campo `tenant` diretto. I dati del patrimonio hanno invece `client` (e quindi `managing_organization`), e gli esecutori di un'altra organizzazione vi accedono tramite gli affidamenti (§5.4 di [04-modello-dati.md](../04-modello-dati.md)). Da decidere anche il nome del campo nelle entità con organizzazione diretta: `tenant`, come lo scaffold, o `organization`, come il modello dati. → **chiusa** nella prima fetta verticale: `visible_to` ed `editable_by` nel QuerySet, `ClientScopedViewSetMixin` nelle view; il campo si chiama `organization` (§8.6, D-044). L'accesso tramite gli affidamenti arriva con le app che li introducono
6. **Archiviazione di foto e allegati.** data-lab salva i file su disco (`MEDIA_ROOT`). Le foto sono il cuore del registro dello stato e crescono molto. Proposta: disco nell'MVP, con `STORAGES` pronto per un object storage compatibile S3. → rinviata a T3
