# jobs_core - Guida operativa per requisito

Questo documento descrive come soddisfare i requisiti usando le primitive gia' presenti nel modulo `jobs_core`.

## 1) Primitive del modulo da conoscere

### Registrazione job schedulabili
- Ogni app espone i job schedulabili in `fm_scheduling.py` tramite la lista `schedulable_jobs`.
- Formato:
	- `name`: etichetta leggibile in Admin.
	- `func`: path importabile della funzione (es. `my_app.jobs.send_email`).
- Il manager `dynamic_scheduling_manager` raccoglie automaticamente tutti i job dichiarati nelle app installate.
- Validazione: i campi `func` di `CronJobDefinition` e `ScheduledJobDefinition` accettano solo funzioni schedulabili.

### Modelli principali
- `CronJobDefinition`: definizione di job ricorrente (cron).
- `ScheduledJobDefinition`: definizione di job one-shot a data/ora (`start_at`).
- `JobRun`: tracking esecuzione (stato, start/completamento, errore).

### Scheduling automatico via signal
- `post_save` su `CronJobDefinition`:
	- cancella eventuale job scheduler esistente con stesso `id`;
	- registra un nuovo cron con `scheduler.cron(...)` verso `job_runner`.
- `post_save` su `ScheduledJobDefinition`:
	- cancella eventuale job scheduler esistente con stesso `id`;
	- crea subito (o recupera) il relativo `JobRun` in stato `pending`;
	- enqueue a `start_at` (o immediato se `start_at <= now`).

### Runner unico
- Lo scheduler esegue sempre `job_runner`.
- `job_runner` legge da `meta["__inmagik_scheduler"]`:
	- `func`: funzione target reale da importare/eseguire.
	- `run_id`: ID `JobRun` da aggiornare durante l'esecuzione.

## 2) Requisito: aggiungere un cron da Admin

### Obiettivo
Configurare un job ricorrente da Django Admin.

### Come si fa
1. Assicurati che la funzione sia dichiarata in `schedulable_jobs` della tua app.
2. Vai in Admin su `CronJobDefinition` e crea record:
	 - `id`: identificativo univoco e stabile;
	 - `cron`: espressione cron (`* * * * *`, ecc.);
	 - `func`: scegli una funzione dalla tendina (solo schedulabili);
	 - `args` / `kwargs`: payload serializzabile JSON;
	 - opzionali: `repeat`, `result_ttl`, `ttl`, `queue_name`, `meta`, `use_local_timezone`, `enabled`.
3. Salva: il signal `post_save` registra automaticamente il cron su `rq-scheduler`.

### Nota importante su JobRun per cron
- Per i cron, il modulo registra `run_id=None` in `meta` quando crea la definizione.
- Quindi non esiste un `JobRun.id` "noto subito" al momento della sola creazione del cron.
- Il `JobRun` viene determinato quando il singolo firing viene realmente eseguito dal runner.

## 3) Requisito: aggiungere un job a data/ora da Admin

### Obiettivo
Schedulare un job one-shot in una data/ora specifica da Admin.

### Come si fa
1. Vai in Admin su `ScheduledJobDefinition` e crea record con:
	 - `id` univoco;
	 - `start_at` con data/ora desiderata;
	 - `func` dalla lista schedulabile;
	 - `args`, `kwargs`, e opzionali (`result_ttl`, `ttl`, `queue_name`, `meta`).
2. Salva.

### Cosa succede internamente
- Il signal `post_save` crea subito il `JobRun` (`pending`) associato alla definizione.
- Poi mette in coda il job con `scheduler.enqueue_at(start_at, ...)`.

### Come ottenere subito l'ID JobRun
- Subito dopo il save e' disponibile tramite relazione one-to-one:
	- `scheduled_job_definition.job_run.id`

Questa e' la primitive gia' pronta da usare quando serve restituire immediatamente l'identificativo di tracking.

## 4) Requisito: aggiungere un job adesso da Admin

### Obiettivo
Richiedere esecuzione immediata usando l'interfaccia Admin.

### Come farlo con le primitive attuali
- Usa `ScheduledJobDefinition` con `start_at <= now`.
- Il signal, vedendo una data non futura, usa `scheduler.enqueue_in(timedelta(seconds=0), ...)`.

### Vantaggio
- Anche in questo caso il `JobRun` viene creato subito prima dell'enqueue.
- Quindi l'ID e' immediatamente disponibile in Admin (`scheduled_job_definition.job_run.id`).

## 5) Requisito: aggiungere un job adesso da API

### Obiettivo
Esporre endpoint API per avvio immediato e restituzione istantanea di `JobRun.id`.

### Pattern consigliato (riusa le primitive esistenti)
- Non chiamare direttamente `scheduler.enqueue(...)` nel layer API.
- Crea invece un `ScheduledJobDefinition` con `start_at = timezone.now()`.
- Lascia al signal la creazione del `JobRun` e l'enqueue immediato.

### Esempio flusso applicativo
1. Validi che `func` sia schedulabile (`dynamic_scheduling_manager.is_schedulable(func)`).
2. Crei `ScheduledJobDefinition`.
3. Ricarichi l'istanza (se necessario) e leggi `instance.job_run.id`.
4. Restituisci risposta API con:
	 - `scheduled_job_definition_id`
	 - `job_run_id`
	 - `status` iniziale (`pending`)

### Esempio codice (service/API layer)
```python
from django.utils import timezone
from jobs_core.models import ScheduledJobDefinition
from jobs_core.scheduling import dynamic_scheduling_manager


def request_job_now(*, job_id: str, func: str, args=None, kwargs=None, queue_name="default", meta=None):
		args = args or []
		kwargs = kwargs or {}
		meta = meta or {}

		if not dynamic_scheduling_manager.is_schedulable(func):
				raise ValueError(f"Function '{func}' is not schedulable")

		definition = ScheduledJobDefinition.objects.create(
				id=job_id,
				start_at=timezone.now(),
				func=func,
				args=args,
				kwargs=kwargs,
				queue_name=queue_name,
				meta=meta,
		)

		# Il signal ha gia' creato JobRun e messo in coda il job.
		definition.refresh_from_db()

		return {
				"scheduled_job_definition_id": definition.id,
				"job_run_id": str(definition.job_run.id),
				"status": definition.job_run.status,
		}
```

## 6) Requisito: aggiungere un job a data/ora da API

### Obiettivo
Esporre endpoint API per scheduling futuro e tracking immediato.

### Pattern consigliato
- Stesso pattern del caso "adesso", ma con `start_at` futuro.
- Primitive usata: creazione `ScheduledJobDefinition`.

### Esempio codice
```python
from jobs_core.models import ScheduledJobDefinition
from jobs_core.scheduling import dynamic_scheduling_manager


def request_job_at(*, job_id: str, start_at, func: str, args=None, kwargs=None, queue_name="default", meta=None):
		args = args or []
		kwargs = kwargs or {}
		meta = meta or {}

		if not dynamic_scheduling_manager.is_schedulable(func):
				raise ValueError(f"Function '{func}' is not schedulable")

		definition = ScheduledJobDefinition.objects.create(
				id=job_id,
				start_at=start_at,
				func=func,
				args=args,
				kwargs=kwargs,
				queue_name=queue_name,
				meta=meta,
		)

		definition.refresh_from_db()

		return {
				"scheduled_job_definition_id": definition.id,
				"job_run_id": str(definition.job_run.id),
				"status": definition.job_run.status,
				"scheduled_for": definition.start_at,
		}
```

## 7) Requisito trasversale: ID JobRun disponibile subito

### Stato attuale delle primitive
- Garantito per i job one-shot basati su `ScheduledJobDefinition` (Admin e API):
	- il `JobRun` viene creato in `post_save` prima dell'esecuzione;
	- l'ID e' disponibile immediatamente.
- Non garantito "per singola esecuzione" in fase di sola creazione di un cron:
	- il cron definisce una regola ricorrente, non una singola run immediata.

### Regola pratica
- Se il requisito e' "devo avere subito un run ID": usa sempre la primitive `ScheduledJobDefinition`.
- Se il requisito e' "esecuzione ricorrente": usa `CronJobDefinition`, sapendo che il tracking run-level nasce al firing.

## 8) Checklist operativa minima

1. Dichiarare la funzione in `fm_scheduling.schedulable_jobs`.
2. Verificare che worker e scheduler siano attivi (rqworker + rqscheduler).
3. Per richieste con `JobRun.id` immediato: creare `ScheduledJobDefinition`.
4. Per ricorrenza: creare `CronJobDefinition`.
5. Tracciare stato su `JobRun` (`pending/running/completed/failed`).
