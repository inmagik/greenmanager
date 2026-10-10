# AGENTS.md — server

Istruzioni per gli agenti che lavorano sul server Django di GreenManager. Contesto, dominio e decisioni sono nell'[AGENTS.md](../AGENTS.md) della radice e in [designdocs/](../designdocs/README.md).

## Riferimenti

- **Architettura del server**: [designdocs/architettura/backend.md](../designdocs/architettura/backend.md). Ci sono struttura, settings, app core, pattern delle app di dominio, ambiente e versioni.
- **Modello dati**: [designdocs/04-modello-dati.md](../designdocs/04-modello-dati.md), con le note su Django in §5.
- **Origine del codice**: lo scaffold viene da [inmagik/data-lab](https://github.com/inmagik/data-lab) e [inmagik/bottaro-pesatura](https://github.com/inmagik/bottaro-pesatura) (D-036). Cosa è stato preso e come è stato adattato: [designdocs/architettura/README.md](../designdocs/architettura/README.md).

## Comandi

Servono Python 3.14 e le librerie GDAL, GEOS e PROJ (su macOS: `brew install gdal`). I comandi partono da `server/`.

```bash
docker compose up -d db redis          # PostGIS e Redis
python3.14 -m venv env                 # con pyenv: ~/.pyenv/versions/3.14.x/bin/python -m venv env
source env/bin/activate
pip install -r requirements.txt -r requirements-dev.txt

cd greenmanager
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver             # API su http://localhost:8000/api/, admin su /admin/
python manage.py rqworker default      # worker dei job, in un altro terminale
python manage.py rqscheduler           # solo se servono job pianificati
```

- Un utente vede i dati solo dentro un'organizzazione. Dopo `createsuperuser`, crea un'organizzazione (`Tenant`) e la sua appartenenza (`TenantMembership`) dall'admin.
- Schema OpenAPI su `/api/schema/`, Swagger UI su `/api/schema/swagger-ui/`.

**Test**, con il runner di Django:

```bash
python manage.py test                                         # tutti
python manage.py test auth_core                               # un'app
python manage.py test auth_core.tests.UsersApiTests.test_create_user_assigns_current_tenant_as_default_membership
```

**Formattazione e lint**, da `server/`, prima di ogni commit:

```bash
black greenmanager && isort greenmanager && flake8 greenmanager
```

**Migrazioni**:
- una per modifica, con nome descrittivo: `python manage.py makemigrations <app> --name <nome>`;
- le migrazioni di dati sono separate da quelle di schema;
- `python manage.py makemigrations --check --dry-run` deve dire *No changes detected*.

**Schema OpenAPI**: `python manage.py spectacular --file /dev/null` non deve dare errori né avvisi. Le action aggiunte descrivono richiesta e risposta con `@extend_schema` (§4.4 di `backend.md`).

## Struttura

```
server/
├── greenmanager/             radice Django, con manage.py
│   ├── greenmanager/         settings, urls, schema
│   ├── auth_core/            utenti, ruoli, permessi
│   ├── tenants/              organizzazioni (tenant)
│   ├── jobs_core/            job asincroni e pianificati (how-to.md)
│   ├── inmagik_utils/        paginazione, filtri, mixin, storico di auditlog
│   └── <app di dominio>/     catalogs, parties, territory, inventory… (T3)
├── requirements*.txt
├── docker-compose.yml        PostGIS e Redis per lo sviluppo
├── Dockerfile, scripts/      immagine: start, worker, scheduler
└── .devcontainer/
```

## Regole

- **Lingua** (D-001):
  - identificatori, commenti e docstring in inglese;
  - in italiano le descrizioni dei permessi in `fm_permissions.py` e i testi delle email;
  - gli errori hanno un `code` stabile in snake_case, che il frontend traduce, e un `detail` in inglese.
- **App di dominio**: seguono i pattern di §4 di `backend.md` (file, modelli, serializer, viewset, URL, admin, permessi).
  - Dalle app di dominio dei progetti di riferimento (`datasets`, `anagrafica`) si prendono i pattern, mai il codice.
  - Ogni app si registra in `INSTALLED_APPS`, sotto `# Domain apps`, e in `greenmanager/urls.py`, sotto `api/<app>/`.
- **Viewset**:
  - `AuditlogActorMixin` come primo mixin;
  - `permission_classes = [ActionPermission]`, con `action_permissions` per ogni action, comprese quelle aggiunte e `bulk_delete`.
- **Modelli**:
  - chiave UUID per le entità del dominio (D-014);
  - geometrie in WGS84 (`srid=4326`); linee e poligoni anche multiparte (D-035).
- **Logica di dominio** in `services.py`, con transazioni esplicite. Le copie e i derivati (es. l'ultima condizione sull'elemento) si aggiornano lì, non con i segnali.
- **Registri non cancellabili** (D-034): osservazioni, valutazioni ed eseguito si correggono o si annullano con una motivazione.
- **App core** (`auth_core`, `tenants`, `jobs_core`, `inmagik_utils`): sono condivise con gli altri progetti INMAGIK. Si modificano solo se serve, e ogni differenza va annotata in `backend.md`.
- Non eseguire `build_image.sh`: pubblica l'immagine sul registry.
